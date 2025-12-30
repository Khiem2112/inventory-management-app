
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, text, func, case, label, insert, bindparam
from app.database.purchase_order_model import PurchaseOrder as PurchaseOrderORM, PurchaseOrderItem as PurchaseOrderItemORM
from app.database.shipment_manifest_model import ShipmentManifest as ShipmentManifestORM, ShipmentManifestLine as ShipmentManifestLineORM
from app.database.asset_model import Asset as AssetORM
from app.schemas.shipment import ShipmentManifestInput, ShipmentManifestRead
from app.database.user_model import User as UserORM
from app.database.stock_move import StockMove as StockMoveORM, AssetStockMove as AssetStockMoveORM
from app.utils.logger import setup_logger
from datetime import datetime
from dateutil import parser
from collections import Counter
from enum import Enum
from collections import defaultdict  
from app.utils.dependencies import get_db, get_current_user
import traceback

logger = setup_logger()

# Helper function

class LocationID(Enum):
  AVAILABLE = 1
  IN_RECEIVING = 2
  IN_TRANSIT = 3
  AWAITING_QC = 4
  COMMITTED = 5
  DISABLED = 6
  REJECTED_DOCK = 7 
  QUARANTINE = 8
  VENDOR = 1007 # Example
class ZoneID(Enum):
  QUARANTINE = 14
  DEFAULT_STORAGE = 7

class AssetStatus(Enum):
  Available = "Available"
  InTransit = "In Transit"
  AwaitingQC = "Awaiting QC"
  Rejected = "Rejected"

  
class SupplierService():
  
  def __init__ (self, 
                user: UserORM,
                db:Session):
    self.user = user
    self.db = db

  
  def create_shipment_manifest(
    self,
    sm_data: ShipmentManifestInput,
    
  ) -> ShipmentManifestRead: 
    
    # pre check the estimated arrival time to warn user
    input_estimated_arrival_time = sm_data.estimated_arrival
    
    # Check if current purchase order is existed in database
    input_po_id = sm_data.purchase_order_id
    
    logger.info(f"Start creating new shipment manifest from purchase order id: {input_po_id}")
    

        
    if input_estimated_arrival_time.date() < datetime.now().date():
      logger.warn(f"Estimated arrival time is before today !!!")
        
    po_query = select(PurchaseOrderORM).where(
      PurchaseOrderORM.PurchaseOrderId == input_po_id
    )
    po_db = self.db.execute(po_query).scalars().first()
    if not po_db:
      logger.error(f"Cannot find po id: {input_po_id}")
      raise ValueError(f"Purchase order does not exist, po id: {input_po_id}")
    logger.info(f"The purchase order {po_db.PurchaseOrderId} is existed")
    
    if po_db.Status != "Issued":
      raise ValueError(f"Status of target po {po_db.PurchaseOrderId} is not valid, it must be Issued, not {po_db.Status}") 
    
    input_po_item_ids = [sm_iine.purchase_order_item_id for sm_iine in sm_data.lines ]
    
    logger.info(f"Summarize input po item ids: {input_po_item_ids}")
    
    # Check duplicated purchase order item ids
    if len(input_po_item_ids) != len(set(input_po_item_ids)):
      duplicated_ids = {po_item_id: count for po_item_id, count in Counter(input_po_item_ids).items() if count > 1}
      logger.info(f"There are duplicated ids: {duplicated_ids}")
      raise HTTPException(400, f"Face duplicated po item ids: {duplicated_ids}")
    logger.info(f"Have checked the duplicated purchase order: PASSED")
    
    # Check if po item is in the purchase order

    po_items_query = select(PurchaseOrderItemORM).where(
      PurchaseOrderItemORM.PurchaseOrderItemId.in_(input_po_item_ids),
      PurchaseOrderItemORM.PurchaseOrderId == input_po_id
    )
    
    po_items_db = self.db.execute(po_items_query).unique().scalars().all()
    
    po_item_lookup_map = {
      po_item_db.PurchaseOrderItemId: po_item_db
      for po_item_db in po_items_db
    }
    
    logger.info(f"Getting selected po item id from database: {po_item_lookup_map.keys()}")
    
    # loop over the input po ids and check if there is someone is not existed
    error_message = []
    for input_po_item_id in input_po_item_ids:
      if not po_item_lookup_map.get(input_po_item_id, None):
        error_message.append(f"Purchase order item id: {input_po_item_id} does not exist")
    if len(error_message) > 0:
      raise ValueError(f"Some po item ids do not exist: {error_message} in po {sm_data.purchase_order_id}")
    
    logger.info(f"Have checked the wrong purchase order item id: PASSED")
    # Get the statistic of each purchase order line to check if remaining quantity < input quantity
    sql_query = text("""
    SELECT 
        poi.POItemId as PurchaseOrderItemId,
        ISNULL(SUM(CASE WHEN sm.DestinationLocationId = 1 THEN sm.Quantity 
                 WHEN sm.SourceLocationId = 1 THEN -sm.Quantity ELSE 0 END), 0) AS available_quantity,
        ISNULL(SUM(CASE WHEN sm.DestinationLocationId = 3 THEN sm.Quantity 
                 WHEN sm.SourceLocationId = 3 THEN -sm.Quantity ELSE 0 END), 0) AS in_transit_quantity,
        ISNULL(SUM(CASE WHEN sm.DestinationLocationId = 4 THEN sm.Quantity 
                 WHEN sm.SourceLocationId = 4 THEN -sm.Quantity ELSE 0 END), 0) AS awaiting_qc_quantity,
        ISNULL(SUM(CASE WHEN sm.DestinationLocationId = 7 THEN sm.Quantity 
                 WHEN sm.SourceLocationId = 7 THEN -sm.Quantity ELSE 0 END), 0) AS rejected_quantity,
        poi.Quantity - ISNULL(SUM(CASE 
            WHEN sm.DestinationLocationId IN (1, 3, 4, 7) THEN sm.Quantity
            WHEN sm.SourceLocationId IN (1, 3, 4, 7) THEN -sm.Quantity 
            ELSE 0 END), 0) AS remaining_quantity,
        poi.Quantity AS ordered_quantity
    FROM PurchaseOrderItem poi
    LEFT JOIN StockMove sm ON poi.POItemId = sm.PurchaseOrderItemId
    WHERE poi.POItemId IN :item_ids
      AND poi.PurchaseOrderId = :po_id
    GROUP BY poi.POItemId, poi.Quantity
""").bindparams(bindparam("item_ids", expanding= True))

# 2. Pass the parameters as a dictionary
# Ensure item_ids is a LIST or TUPLE. SQLAlchemy handles the expansion.
    params = {
        "item_ids": tuple(input_po_item_ids), 
        "po_id": sm_data.purchase_order_id
    }

    po_items_stats = self.db.execute(sql_query, params).mappings().all()
    
    po_item_stats_lookup_map = {
      po_item_stat["PurchaseOrderItemId"]: po_item_stat
      for po_item_stat in po_items_stats 
    }
    
    # Check if remaining quantity < input quantity
    error_message = []
    for sm_line in sm_data.lines:
      po_item_stats = po_item_stats_lookup_map.get(sm_line.purchase_order_item_id)
      if not po_item_stats:
        logger.info(f"Purchase order line id {sm_line.purchase_order_item_id} doesn't have history stock moving")
        continue
      remaining_quantity = po_item_stats['remaining_quantity']
      logger.info(f"Start compare two quantity fr line {sm_line.purchase_order_item_id} with remaining {remaining_quantity} vs ship quantity {sm_line.quantity}")

      if sm_line.quantity > remaining_quantity:
        error_message.append(f"Excessive quantity on purchase order id {sm_line.purchase_order_item_id}, where remaining is {remaining_quantity} and ship quantity is {sm_line.quantity}")
    if len(error_message) >0:
      raise ValueError(f"Some lines have input quantity > remaining quantity: {error_message}")
    logger.info(f"Have checked the input quantity of each shipment line item: PASSED")
    try:
      # Insert new records to database
      # Shipment manifest first
      new_shipment_manifest_orm = ShipmentManifestORM(
        SupplierId = po_db.SupplierId,
        PurchaseOrderId = po_db.PurchaseOrderId,
        TrackingNumber = sm_data.tracking_number,
        CarrierName= sm_data.carrier_name,
        EstimatedArrival = sm_data.estimated_arrival,
        CreatedByUserId = self.user.UserId,
        Status = sm_data.status,
      )
      self.db.add(new_shipment_manifest_orm)
      self.db.flush()
      logger.info(f"Have created new shipment manifest with id: {new_shipment_manifest_orm.Id}")
      # Creat shipment manifest line items and the corresponding stock moves
      
      sm_lines_data: list[dict[str, any]] = []

      for sm_line in sm_data.lines:
        po_item_orm = po_item_lookup_map.get(sm_line.purchase_order_item_id)
        
        sm_lines_data.append({
          "ShipmentManifestId": new_shipment_manifest_orm.Id,
          "PurchaseOrderLineId": po_item_orm['PurchaseOrderItemId'],
          "SupplierSerialNumber": sm_line.supplier_serial_number,
          "SupplierSku": sm_line.supplier_sku,
          "QuantityDeclared": sm_line.quantity
        })

      # 2. Execute Bulk Insert with RETURNING for immediate ID retrieval
      if sm_lines_data:
        stmt = (
          insert(ShipmentManifestLineORM)
          .returning(
            ShipmentManifestLineORM.Id, 
            ShipmentManifestLineORM.PurchaseOrderLineId
          )
        )
        
        # result is a list of RowMapping objects
        result = self.db.execute(stmt, sm_lines_data).mappings().all()

        # 3. Build lookup map for the Asset creation step
        # Key: PO Item ID -> Value: New Shipment Line ID
        new_sm_line_lookup: dict[int, int] = {
          row.PurchaseOrderLineId: row.Id for row in result
        }
      logger.info(f'Have created shipment manifest lines: {[value for key, value in new_sm_line_lookup.items()]}')
      # Create stock moves
      stock_moves_data: list[dict] = []
      for sm_line in sm_data.lines:
        stock_moves_data.append({
          'PurchaseOrderItemId': sm_line.purchase_order_item_id,
          'Quantity': sm_line.quantity,
          'MovementDate': datetime.today(),
          'SourceLocationId': LocationID.VENDOR.value,
          'DestinationLocationId': LocationID.IN_TRANSIT.value
        })
      results = self.db.execute(insert(StockMoveORM).returning(
        StockMoveORM.PurchaseOrderItemId,
        StockMoveORM.Id
        ), stock_moves_data).mappings().all()
      self.db.flush()
      stock_move_lookup_map = {
        stock_move['PurchaseOrderItemId']: stock_move['Id']
        for stock_move in results
      }
      
      logger.info(f"Have create stock move ids: {[value for key, value in stock_move_lookup_map.items()]}")
      # Create many asset records
      # Handle different cases of shipment manifest lines
      # For asset specified
      assets_to_be_created: list[dict] = []
      for sm_line in sm_data.lines:
        if sm_line.shipment_mode == "asset_specified":
          for asset_item in sm_line.asset_items:
            new_asset_dict = {
              'SerialNumber': asset_item.serial_number,
              'ProductId': po_item_orm.ProductId,
              'CurrentZoneId': ZoneID.DEFAULT_STORAGE.value,
              'ShipmentManifestLineId': new_sm_line_lookup.get(sm_line.purchase_order_item_id),
              'PurchaseOrderLineId': sm_line.purchase_order_item_id,
              'AssetStatus': 'In Transit',
              'LastMovementDate': datetime.today()
              }
            assets_to_be_created.append(new_asset_dict)
        elif sm_line.shipment_mode == "quantity_declared":
          new_asset_list = [{
            'ProductId': po_item_orm.ProductId,
            'CurrentZoneId': ZoneID.DEFAULT_STORAGE.value,
            'ShipmentManifestLineId': new_sm_line_lookup.get(sm_line.purchase_order_item_id),
            'PurchaseOrderLineId': sm_line.purchase_order_item_id,
            'AssetStatus': 'In Transit',
            'LastMovementDate': datetime.today()
            } for i in range(sm_line.quantity)]
          assets_to_be_created.extend(new_asset_list)

      asset_results = self.db.execute(insert(AssetORM).returning(
      AssetORM.AssetId,
      AssetORM.PurchaseOrderLineId
      ), 
      assets_to_be_created).mappings().all()
      self.db.flush()
      asset_lookup_map: dict[int, list[int]] = defaultdict(list)

      for row in asset_results:
        asset_lookup_map[row['PurchaseOrderLineId']].append(row['AssetId'])
      
      logger.info(f'Have created so many assets: ')
      
      # Create StockMoveAsset rel
      asset_stock_move_links: list[dict] = []

      for po_item_id, asset_ids in asset_lookup_map.items():
        # Get the specific stock move ID for this PO Item
        move_id = stock_move_lookup_map.get(po_item_id)
        
        if move_id:
          for asset_id in asset_ids:
            asset_stock_move_links.append({
              "AssetId": asset_id,
              "StockMoveId": move_id
            })

      # Bulk insert into the junction table
      if asset_stock_move_links:
        self.db.execute(insert(AssetStockMoveORM), asset_stock_move_links)
        self.db.flush()
      logger.info(f'Have created so many stock moves relation: ')
      response_data = ShipmentManifestRead(
      # Primary Key and Metadata
      id=new_shipment_manifest_orm.Id,
      supplier_id=new_shipment_manifest_orm.SupplierId,
      created_by_user_id=getattr(new_shipment_manifest_orm, "CreatedByUserId", None), # Use getattr if field might be absent
      created_at=new_shipment_manifest_orm.CreatedAt, 
      updated_at=getattr(new_shipment_manifest_orm, "UpdatedAt", None),
      
      # Business Data (Mapped from PascalCase ORM to snake_case Schema)
      purchase_order_id=new_shipment_manifest_orm.PurchaseOrderId,
      tracking_number=new_shipment_manifest_orm.TrackingNumber,
      carrier_name=new_shipment_manifest_orm.CarrierName,
      estimated_arrival=new_shipment_manifest_orm.EstimatedArrival,
      status=new_shipment_manifest_orm.Status
    )
      self.db.commit()
      return response_data
        
    except Exception as e:
      self.db.rollback()
      logger.error(f"Face exception {e}, rollback all transactions")
      raise e
  
def get_supplier_service(
  db: Session = Depends(get_db),
  current_user: UserORM = Depends(get_current_user)
  ) -> SupplierService  :
  return SupplierService(current_user, db)
  