from sqlalchemy.orm import Session
from app.schemas.shipment import PurchaseOrderReceptionInput, PurchaseOrderItemInput,  ShipmentReceptionInput, ShipmentLineReceptionInput
from sqlalchemy import select, text, exists, bindparam, insert
from app.database.purchase_order_model import PurchaseOrder as PurchaseOrderORM, PurchaseOrderItem as PurchaseOrderItemORM
from app.database.product_model import Product
from app.database.asset_model import Asset as AssetORM
from app.database.user_model import User
from app.database.warehouse_zone_model import Zone
from app.database.good_receipt_model import GoodsReceipt as GoodsReceiptORM
from app.database.stock_move import StockMove as StockMoveORM, AssetStockMove as AssetStockMoveORM
from app.database.shipment_manifest_model import ShipmentManifest as ShipmentManifestORM, ShipmentManifestLine as ShipmentManifestLineORM

from fastapi import HTTPException, Depends
from typing import Union
from app.utils.random import generate_random_serial
from app.utils.dependencies import get_db
from datetime import date, datetime
import collections
from app.services.enum import LocationID, ZoneID, AssetStatus
from collections import defaultdict

class GRService():
  def __init__(self, db: Session):
    self.db = db
  
  def _handle_gr_creation_from_po(
    self,
    po: PurchaseOrderReceptionInput,   
  ):
    print('Start handle good receipt')
    print(f"Receiving input with lines: {po.lines}")
    # Check if the purchase order is existed ?
    
    check_line_items_obj = self._check_po_context(po)
    message =check_line_items_obj['message']
    print(f"After checking the po context: {message}")
    
    # Check quantity of every po line item
    check_line_items_obj = self._check_line_items(
      po_lines=po.lines,
      po_id=po.po_id
    )
    message = check_line_items_obj["message"]
    print(f"After checking the line items: {message}")
    
    po_stats_hash_map = check_line_items_obj['stats_hash_map']
    # Insert/Update to database
    try: 
    
      # Post Good Receipt
      new_good_receipt = GoodsReceiptORM(
        ReceiptNumber = generate_random_serial(length=10),
        ReceivedDate = datetime.now(),
        ReceivedByUserId = 2
      )
      self.db.add(new_good_receipt)
      self.db.flush()
      # Create n Asset for each matched line item
      all_accepted_asset = []
      all_declined_asset = []
      for line in po.lines:
        current_line_accepted_asset = []
        current_line_declined_asset = []

        row_info = po_stats_hash_map.get(line.po_line_id)
        # Check if total amount of Asset match received quantity
        if len(line.asset_items) != line.received_quantity:
          raise ValueError(f"Total assets in line {line.po_line_id} are {len(line.asset_items)} not match received quantity: {line.received_quantity}")
        
        # Add all assets to the current po line item
        for asset_input in line.asset_items:
          if asset_input.isAccepted:
            
            new_asset = AssetORM(
            ProductId=row_info["ProductId"],
            SerialNumber = generate_random_serial(length=12),
            AssetStatus=  "Awaiting QC",
            LastMovementDate = datetime.today(),
            CurrentZoneId= ZoneID.DEFAULT_STORAGE.value,
            GoodsReceiptId = new_good_receipt.ReceiptId
          )
            current_line_accepted_asset.append(new_asset)
          else:
            # CRITICAL: Record the bad item too!            
            new_asset = AssetORM(
            ProductId=row_info["ProductId"],
            SerialNumber = generate_random_serial(length=12),
            AssetStatus= "Rejected",
            LastMovementDate = datetime.today(),
            CurrentZoneId= ZoneID.DEFAULT_STORAGE.value ,
            GoodsReceiptId = new_good_receipt.ReceiptId
          )
            current_line_declined_asset.append(new_asset)
          
        # Expand the total line of asset
        all_accepted_asset.extend(current_line_accepted_asset)
        all_declined_asset.extend(current_line_declined_asset)
        print(f'For line {line.po_line_id}, we add {len(current_line_accepted_asset)} accepted assets and {len(current_line_declined_asset)} declined assets')
        # Create new StockMove record
        if not len(current_line_accepted_asset) > 0:
          continue
        new_accepted_stock_move = StockMoveORM(
          PurchaseOrderItemId = line.po_line_id,
          Quantity= len(current_line_accepted_asset),
          MovementDate = datetime.today(),
          SourceLocationId = LocationID.IN_TRANSIT.value,
          DestinationLocationId = LocationID.AVAILABLE.value
        )
        
        new_declined_stock_move = StockMoveORM (
          PurchaseOrderItemId = line.po_line_id,
          Quantity= len(current_line_declined_asset),
          MovementDate = datetime.today(),
          SourceLocationId = LocationID.IN_TRANSIT.value,
          DestinationLocationId = LocationID.REJECTED_DOCK.value
        )
        
        self.db.add(new_accepted_stock_move)
        self.db.add(new_declined_stock_move)
      # Add new accepted Asset records
      if all_accepted_asset:
        asset_to_create_ids = [asset.SerialNumber for asset in all_accepted_asset]
        self.db.add_all(all_accepted_asset)
        print(f"Add {len(asset_to_create_ids)} accepted assets to database")
      # Add new declined Asset records
      if all_declined_asset:
        asset_to_create_ids = [asset.SerialNumber for asset in all_declined_asset]
        self.db.add_all(all_declined_asset)
        print(f"Add {len(asset_to_create_ids)} declined assets to database")

      self.db.commit()
      # Temporarily return list of po line item
    except ValueError as e:
      print(e)
      raise e
    except Exception as e:
      self.db.rollback()
      raise e
    return {
      "flow": "Directly from PO",
      "message": "Have created new goods receipt add new Asset to database and the corresponding StockMove document"
    }
  def _check_po_context(
    self,
    po: PurchaseOrderReceptionInput
    ):
    """
    This function check context of the purchase order and its line to process the goods receiptwhich includes:
    - Does this purchase order exits
    - Is it Status valid to perform good receipt
    - Are there any duplicated line ids
    - Is there any unexisted line ids

    Args:
        po (PurchaseOrderInput):
    """
    stmt = text("SELECT PurchaseOrderId, Status FROM PurchaseOrder WHERE PurchaseOrderId = :id")
    po_orm = self.db.execute(stmt, {"id": po.po_id}).mappings().first()
    
    is_po_existed = True if po_orm else False
    
    if not is_po_existed:
      raise ValueError(f"Purchase order: {po.po_id} does not exist")
    
    print(f"Being able to get the purchase order with ID: {po_orm.PurchaseOrderId}")
    
    # Check if the purchase order stats is valid to process ?
    valid_po_status = ["Delivered", "Partially Received"]

    
    is_po_status_valid = po_orm.Status in valid_po_status
    if not is_po_status_valid:
      raise ValueError(f"Status of Purchase order is not valid to create a good receipt\nit must be 'Delivered' or 'Partially Received'")
    print(f"Being able to process GR since the status of PO : {po.po_id} is {po_orm.Status}")
    
    # handle each Line item of a po
    line_items_ids = [line.po_line_id for line in po.lines]
    
    if len(line_items_ids) != len(set(line_items_ids)):
      # Find which ones are duplicated for a better error message
      duplicates = [item for item, count in collections.Counter(line_items_ids).items() if count > 1]
      raise ValueError(f"Duplicate po_line_id found in request: {duplicates}. Each line must be unique.")
    
    line_items_stmt = select(PurchaseOrderItemORM.PurchaseOrderItemId
                             ).where(PurchaseOrderItemORM.PurchaseOrderItemId.in_(line_items_ids),
                                     PurchaseOrderItemORM.PurchaseOrderId == po.po_id)
    
    line_items_orm = set(self.db.execute(line_items_stmt).scalars().all())
    raw_result = self.db.execute(line_items_stmt).scalars().all()
    
    print(f'Query to get list of po items in database: {line_items_stmt}')
    print(f"DEBUG: Found {len(raw_result)} matches in DB. Values: {raw_result}")
    print("Start to compare input line items and line items from database")
    print(f"Input: {line_items_ids}")
    print(f"ORM item ids: {line_items_orm}")
    
    error_message = []
    existed_input_ids = []
    line_items_ids = [line.po_line_id for line in po.lines]
    
    for line_item in po.lines:
      if not line_item.po_line_id in line_items_orm:
        error_message.append(f"Line item ID: {line_item.po_line_id} does not exist in database\n")
    if len(error_message) > 0:  
      raise ValueError(rf"Some items are not in the purchase order:\n {error_message}")
    return {
      'message': "The PO context is cleared"
    }
  def _check_line_items (
    self,
    po_lines: list[PurchaseOrderItemInput],
    po_id: int
  ):
    """
    Check po stats in all po lines
    - Calculate different quantity types in each po line item:
    + Available
    + In Receiving
    + In Transit
    + Awaiting QC
    + Committed
    + Disabled
    + Ordered Quantity
    + Remaining: Ordered Quantity - Available - Awaiting QC
    
    The function check if received quantity of each po line item exceed the remaining quantity of that line

    Args:
        po_lines (list[PurchaseOrderItemInput]):
    """
    
    line_items_ids = [line.po_line_id for line in po_lines]
    # get different quantity of that po item line
    
    
    get_po_item_data_string = """
    SELECT 
    poi.PoitemId,
    poi.PurchaseOrderId,
    poi.ProductId,
    poi.Quantity as Ordered_Qty,

    -- 1. CURRENT STATUS COLUMNS (Your logic is perfect here)
    -- Shows where the stock sits RIGHT NOW
    SUM(CASE WHEN sm.DestinationLocationId = 1 THEN sm.Quantity WHEN sm.SourceLocationId = 1 THEN -sm.Quantity ELSE 0 END) AS Available_Qty,
    SUM(CASE WHEN sm.DestinationLocationId = 3 THEN sm.Quantity WHEN sm.SourceLocationId = 3 THEN -sm.Quantity ELSE 0 END) AS InTransit_Qty,
    SUM(CASE WHEN sm.DestinationLocationId = 4 THEN sm.Quantity WHEN sm.SourceLocationId = 4 THEN -sm.Quantity ELSE 0 END) AS AwaitingQC_Qty,
    SUM(CASE WHEN sm.DestinationLocationId = 6 THEN sm.Quantity WHEN sm.SourceLocationId = 6 THEN -sm.Quantity ELSE 0 END) AS Disabled_Qty,

    -- 2. THE FIX: CUMULATIVE RECEIVED
    -- We only sum the INFLOW events. We ignore outbound moves (consumption).
    -- Logic: Count moves where Source was Transit (3) OR Source was Creation (NULL)
    -- This represents the "Moment of Arrival".
    SUM(CASE 
        WHEN sm.DestinationLocationId IN (1, 2, 4, 6) -- Any internal location
             AND (sm.SourceLocationId = 3 OR sm.SourceLocationId IS NULL) -- From External
        THEN sm.Quantity 
        ELSE 0 
    END) as Total_Physically_Received,

    -- 3. THE CORRECT REMAINING CALCULATION
    (
        poi.Quantity - 
        SUM(CASE 
            WHEN sm.DestinationLocationId IN (1, 2, 4, 6) 
                 AND (sm.SourceLocationId = 3 OR sm.SourceLocationId IS NULL)
            THEN sm.Quantity 
            ELSE 0 
        END)
    ) AS Remaining_Qty

    FROM PurchaseOrderItem poi
    LEFT JOIN StockMove sm ON poi.PoitemId = sm.PurchaseOrderItemId -- Ensure you use the specific FK column
    WHERE poi.PurchaseOrderId = :target_po_id
    AND poi.Poitemid in :line_ids
    GROUP BY poi.PoitemId, poi.PurchaseOrderId, poi.ProductId, poi.Quantity;
    """
    query = text(get_po_item_data_string).bindparams(
    bindparam("line_ids", expanding=True)
)
    po_stats = self.db.execute(query, 
    {
      "target_po_id": po_id,
      "line_ids": tuple(line_items_ids)
    }
                               ).mappings().all()
      
    # Check if current quantity exceed the remaining quantity
    
    # Convert the po_stats to a hashmap
    po_stats_hash_map = {
      po_item.PoitemId: po_item
     for po_item in po_stats}
    
    # Check if po_stats hash map is empty
    
    # Loop over each input line and check if received quantity exceed remaining quantity"
    error_message = []
    for po_item_input in po_lines:
      
      remaining_qty = po_stats_hash_map.get(po_item_input.po_line_id)["Remaining_Qty"]
      received_qty = po_item_input.received_quantity
      if received_qty > remaining_qty:
        error_message.append(f"line: {po_item_input.po_line_id} \nhas received {received_qty} > remaining quantity, which is: {remaining_qty}\n")
    if len(error_message) > 0:
      raise ValueError(f"Having received quantity > remaining quantity:\n{error_message}")
    return {
      "message": "No invalid received quantity found",
      "stats_hash_map": po_stats_hash_map
    }
  def _handle_gr_flow_from_sm (
    self,
    sm: ShipmentReceptionInput
  ):
    
    # Check if the shipment manifest exists ?
    stmt = select(ShipmentManifestORM.Id, 
                  ShipmentManifestORM.Status).where(
      ShipmentManifestORM.Id == sm.sm_id
    )
    result = self.db.execute(stmt).mappings().first()
    
    
    print(f"query to get sm: {stmt}")
    print(f"result: {result}")
        
    if not result:
      raise ValueError(f"Shipment manifest ID: {sm.sm_id} does not exist")
    
    print(f"Got the SM from database with Status: {result['Status']}")

    
    # Check shipment manifest status
    valid_statuses = ['posted']
    
    if not result.Status in valid_statuses:
      raise ValueError(f"Shipment manifest Status: {result.Status} is not valid to process GR")
    
    input_sm_line_ids = [line_id.sm_line_id for line_id in sm.lines]

    # Check if each line is in the shipment manifest document ?
    
    sm_lines_from_db_query = select(
      ShipmentManifestLineORM.Id,
      ShipmentManifestLineORM.PurchaseOrderLineId).where(
      ShipmentManifestLineORM.ShipmentManifestId == sm.sm_id,
      ShipmentManifestLineORM.Id.in_(input_sm_line_ids)
    )
      
    sm_lines_from_db = self.db.execute(sm_lines_from_db_query).mappings().all()
        
    sm_lines_map = {sm_line_orm["Id"]: sm_line_orm for sm_line_orm in sm_lines_from_db}
    
    sm_line_ids_from_db = set(sm_lines_map.keys())
    
    error_message = []
    for sm_line_id in input_sm_line_ids:
      if sm_line_id not in sm_line_ids_from_db:
        error_message.append(f"Line ID: {sm_line_id} does not exist")
    if len(error_message) > 0:
      raise ValueError(f"Some shipment lines do not exist in shipment manifest id {sm.sm_id}: {error_message}")
    
    # Check received value of each independent shipment manifest line id
    """
    We check 2 cases:
    - Check if Asset idd are not duplicated and in the database
    - Check their current status if it is 'In Transit'
    """
    # Check if any asset is not found in database
    
    all_inputs_asset_ids = [asset.asset_id for line in sm.lines for asset in line.asset_items]
    
    target_manifest_id = sm.sm_id 

    all_assets_query = (
      select(
          AssetORM.AssetId,
          AssetORM.SerialNumber,
          AssetORM.AssetStatus,
          AssetORM.ProductId,
          AssetORM.ShipmentManifestLineId
      )
      .join(ShipmentManifestLineORM) # Joins Asset -> Manifest Line
      .join(ShipmentManifestORM)     # Joins Manifest Line -> Manifest
      .where(
          ShipmentManifestORM.Id == target_manifest_id,
          AssetORM.AssetId.in_(all_inputs_asset_ids)
      )
    )
    
    all_assets_from_db = self.db.execute(all_assets_query).mappings().all()
    
    all_asset_ids_from_db = [asset.AssetId for asset in all_assets_from_db]

    # Check duplicated asset
    
    error_message = []
    
    if len(all_inputs_asset_ids) != len(set(all_inputs_asset_ids)):
          
      asset_ids_counter = collections.Counter(all_inputs_asset_ids)
      duplicated_asset_ids = [item for item, count in asset_ids_counter.items() if  count > 1]
      raise ValueError(f"Duplicated asset ids: {duplicated_asset_ids}")
  
    # Check non-existed asset id
    for asset_id in all_inputs_asset_ids:
      
      if asset_id not in set(all_asset_ids_from_db):
        error_message.append(f"Asset id: {asset_id} does not exist")
        
    if len(error_message) > 0:
      raise ValueError(f"Some asset in input does not exits in database {error_message}")
    
    try:
      # Create new Goods Receipt
      new_gr_orm = GoodsReceiptORM (
        ReceiptNumber = generate_random_serial(
          length= 12,
          prefix='GR'
          ),
        ReceivedDate = datetime.now(),
        ReceivedByUserId = 2,
        ShipmentManifestId = sm.sm_id
      )
      
      self.db.add(new_gr_orm)
      self.db.flush()
      print(f"Have created goods receipt id {new_gr_orm.ReceiptId}")
      
      assets_map_db = {
        asset['AssetId']: asset for asset in all_assets_from_db
      }
      
      # Aggregatee a list of updated assets
      assets_update_payload = []
      assets_lookup_from_po_line_id = defaultdict(list)
      stock_moves_inserted: list[dict] = []
      
      for input_sm_line in sm.lines:
        current_line_accepted_count = 0
        current_line_declined_count = 0
        
        current_sm_line_orm = sm_lines_map.get(input_sm_line.sm_line_id)
        if current_sm_line_orm:
          print(f"Being able to get the data of current shipment manifest line: {current_sm_line_orm}")
        
        for asset in input_sm_line.asset_items:
          asset_id = asset.asset_id
          asset_orm = assets_map_db.get(asset_id)
          
          # Check integrity
          if not asset_orm:
            raise ValueError(f"Asset {asset_id} not found in DB")
          
          # Check if we are pointing to the right shipment manifest line id since the whole assets list was flatten
          if asset_orm["ShipmentManifestLineId"] != input_sm_line.sm_line_id:
            raise ValueError(f"Input line {input_sm_line.sm_line_id} have unexpected asset id {asset_id}, it should be in {asset_orm['ShipmentManifestLineId'] }")

          # CHANGE 2: Create a DICTIONARY, not an AssetORM object
          update_data = {
            "AssetId": asset_id,  # Primary Key is required
            "LastMovementDate": datetime.now(),
            "GoodsReceiptId": new_gr_orm.ReceiptId,
            "PurchaseOrderLineId": current_sm_line_orm['PurchaseOrderLineId'],
            "ShipmentManifestLineId": input_sm_line.sm_line_id
            # Retain existing data if needed, or rely on partial update
          }

          if asset.isAccepted:
            update_data.update({
                "AssetStatus": AssetStatus.AwaitingQC.value,
                "CurrentZoneId": ZoneID.DEFAULT_STORAGE.value
            })
            current_line_accepted_count += 1
          else:
            update_data.update({
                "AssetStatus": AssetStatus.Rejected.value,
                "CurrentZoneId": ZoneID.QUARANTINE.value
            })
            current_line_declined_count += 1
          
          assets_update_payload.append(update_data)
          
          # Prepare asset lookup map from po line id
          key = update_data['PurchaseOrderLineId']
          assets_lookup_from_po_line_id[key].append(asset_id)
        if current_line_accepted_count > 0:
          new_accepted_stock_move_orm = {
            'PurchaseOrderItemId': current_sm_line_orm['PurchaseOrderLineId'],
            'GoodsReceiptId': new_gr_orm.ReceiptId,
            'Quantity': current_line_accepted_count,
            'MovementDate': datetime.now(),
            'SourceLocationId': LocationID.IN_TRANSIT.value,
            'DestinationLocationId': LocationID.AWAITING_QC.value
            }
          
          stock_moves_inserted.append(new_accepted_stock_move_orm)
        if current_line_declined_count >0:
          new_declined_stock_move_orm = {
            'PurchaseOrderItemId': current_sm_line_orm['PurchaseOrderLineId'],
            'GoodsReceiptId': new_gr_orm.ReceiptId,
            'Quantity': current_line_declined_count,
            'MovementDate': datetime.now(),
            'SourceLocationId': LocationID.IN_TRANSIT.value,
            'DestinationLocationId': LocationID.REJECTED_DOCK.value
            }
          stock_moves_inserted.append(new_declined_stock_move_orm)
        
      if assets_update_payload:
        self.db.bulk_update_mappings(AssetORM, assets_update_payload)
      if stock_moves_inserted:
        stock_move_results = self.db.execute(
          insert(StockMoveORM).returning(
              StockMoveORM.Id, 
              StockMoveORM.PurchaseOrderItemId
          ), 
          stock_moves_inserted
      ).mappings().all()
        
      # update the StockMove_Asset relationship table
      stock_moves_assets_rel_inserted: list[dict] = []
      for stock_move_db in stock_move_results:
        stock_move_id = stock_move_db.get('Id')
        po_line_id = stock_move_db.get('PurchaseOrderItemId')
        # Handle unexpected error when stock_move doesn't link to any po item id
        if not po_line_id:
          raise ValueError(f"Stock move id {stock_move_id} does not link to any po line id")
        asset_ids_list = assets_lookup_from_po_line_id.get(po_line_id)
        if not asset_ids_list:
          # This catches the "it should never happen" scenario
          # Prevents creating a Stock Move without associated Assets
          raise ValueError(f"Data Mismatch: StockMove {stock_move_id} (PO: {po_line_id}) has no matching assets in the update payload.")
        # Loop over each asset to build the inserted list with 
        for asset_id in asset_ids_list:
          stock_moves_assets_rel_inserted.append({
            "AssetId": asset_id,
            "StockMoveId": stock_move_id
          })
      self.db.execute(insert(AssetStockMoveORM), stock_moves_assets_rel_inserted)
      self.db.commit()
      return {
      "message" : f"Successfully create good receipt from SM id {sm.sm_id}"
    }
    except ValueError as e:
      self.db.rollback()
      raise e
    except Exception as e:
      self.db.rollback()
      raise e
def get_gr_service(
  db:Session = Depends(get_db)
) -> GRService:
  return GRService(db=db)
    
    