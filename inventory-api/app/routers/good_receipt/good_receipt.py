from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import select, func, text
from enum import Enum
from datetime import datetime, date
from collections import Counter
# Hypothetical imports
from app.database.shipment_manifest_model import (
  ShipmentManifest, 
  ShipmentManifestLine
)
from app.database.asset_model import Asset as AssetORM
from app.database.supplier_model import Supplier as SupplierORM
from app.database.purchase_order_model import PurchaseOrder as PurchaseOrderORM, PurchaseOrderItem as PurchaseOrderItemORM
from app.database.warehouse_zone_model import Zone as ZoneORM
from app.database.user_model import User as UserORM
from app.database.good_receipt_model import GoodsReceipt as GoodsReceiptORM
# Assuming these are available:
from app.schemas.shipment import (

ShipmentManifestLineRead,   
ManifestLinesListResponse,
CountingManifestLineResponse,
ManifestSearchResponse,
ManifestSearchResultItem,
FinalizeManifestInput,
FinalizeManifestResponse,
AssetInput,
ShipmentLineVerifyResponse,
AssetUniquenessVerifyResponse,
FinalizeManifestItem
)
from app.schemas.base import StandardResponse
from app.utils.dependencies import get_db, get_current_user
from app.utils.logger import setup_logger
from app.utils.random_string import generate_random_string

# Initialize the router (assuming 'router' is already defined)
router = APIRouter(prefix="/receiving", tags=["Receiving"])

# Logger
logger = setup_logger()

@router.get(
    "/manifests/{manifest_id}/lines", 
    response_model=ManifestLinesListResponse, 
    description="Retrieves all line items for a specific Shipment Manifest."
)
async def get_manifest_lines_raw_sql(
    manifest_id: int, 
    db: Session = Depends(get_db)
):
    # ---------------------------------------------------------
    # 1. Fetch the Manifest Header
    # ---------------------------------------------------------
    header_query = text("""
        SELECT 
            Id, SupplierId, PurchaseOrderId, TrackingNumber, 
            CarrierName, EstimatedArrival, CreatedByUserId, Status
        FROM ShipmentManifest 
        WHERE Id = :manifest_id
    """)
    
    header_row = db.execute(header_query, {"manifest_id": manifest_id}).mappings().first()

    if not header_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shipment Manifest with ID {manifest_id} not found."
        )

    # ---------------------------------------------------------
    # 2. Fetch Aggregated Lines
    # ---------------------------------------------------------
    lines_query = text("""
        SELECT 
            sml.Id,
            sml.SupplierSku,
            sml.QuantityDeclared,
            sml.ReceivingStrategy,
            MAX(p.ProductName) AS ProductName,
            SUM(CASE 
                WHEN a.AssetStatus IN ('Available', 'Awaiting QC') THEN 1 
                ELSE 0 
            END) AS QuantityReceived
        FROM ShipmentManifestLine sml
        LEFT JOIN Asset a ON sml.Id = a.ShipmentManifestLineId
        LEFT JOIN Product p ON a.ProductId = p.ProductId
        WHERE sml.ShipmentManifestId = :manifest_id
        GROUP BY sml.Id, sml.SupplierSku, sml.QuantityDeclared, sml.ReceivingStrategy
    """)

    line_rows = db.execute(lines_query, {"manifest_id": manifest_id}).mappings().all()

    # ---------------------------------------------------------
    # 3. Construct Response (Safe Access)
    # ---------------------------------------------------------
    response_lines = []

    for row in line_rows:
        # Use .get(key, default) to prevent KeyErrors
        # Defaulting numeric fields to 0 ensures math doesn't break
        qty_received = row.get('QuantityReceived', 0) or 0
        qty_declared = row.get('QuantityDeclared', 0) or 0
        
        # Safe Math
        qty_remaining = qty_declared - qty_received
        
        # Handle optional strings safely
        po_id = header_row.get('PurchaseOrderId')
        po_number = f"PO-{po_id}" if po_id else None

        line_data = {
            "id": row.get('Id'),
            "supplier_sku": row.get('SupplierSku'),
            "receiving_strategy": row.get('ReceivingStrategy'),
            "quantity_declared": qty_declared,
            "po_number": po_number,
            "product_name": row.get('ProductName'), # Returns None if key missing or value is NULL
            "quantity_received": qty_received,
            "quantity_remaining": qty_remaining
        }

        response_lines.append(
            CountingManifestLineResponse.model_validate(line_data)
        )

    return ManifestLinesListResponse(
        shipment_manifest_id=header_row.get('Id'),
        supplier_id=header_row.get('SupplierId'),
        purchase_order_id=header_row.get('PurchaseOrderId'),
        tracking_number=header_row.get('TrackingNumber'),
        carrier_name=header_row.get('CarrierName'),
        estimated_arrival=header_row.get('EstimatedArrival'),
        created_by_user_id=header_row.get('CreatedByUserId'),
        status=header_row.get('Status'),
        lines=response_lines,
        message=f"Shipment Manifest {manifest_id} details retrieved safely.",
        total_lines=len(response_lines)
    )
    
@router.post(
    "/manifest/lines/{line_id}/verify_asset",
    response_model=ShipmentLineVerifyResponse,
    description = "List of asset user typed in"
)
async def verify_assets(
    line_id: int,
    asset_inputs: list[AssetInput],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if the shipment line id exist
    line_id_orm = db.execute(select(ShipmentManifestLine.Id).where(
        ShipmentManifestLine.Id == line_id
    )).scalars().first()
    
    if not line_id_orm:
        raise HTTPException(
            status_code=404,
            detail=f"Not found shipment manifest line id {line_id}"
        )
        
    input_asset_serials:list[str] = [ asset_input.serial_number  for asset_input in asset_inputs ]
    # Check if all input asset is identical
    # Show different asset serials number that has duplicated value
    asset_serials_counter = Counter(input_asset_serials)
    duplicated_asset_serials = [
        key
        for key, value in asset_serials_counter.items() if value > 1
    ]
    if len(duplicated_asset_serials) > 0:
        raise HTTPException(
            status_code=400,
            detail = f"Observed redundant serial number: {duplicated_asset_serials}"
        )
    
    # Compare all the asset serial number in the input asset to know which one is not in database
    asset_serials_query = select(AssetORM.SerialNumber,
                                 AssetORM.ShipmentManifestLineId).where(
                                     AssetORM.AssetStatus == "In Transit",
                                     AssetORM.ShipmentManifestLineId == line_id
                                 )
    assets_orm = db.execute(asset_serials_query).mappings().all()
    # handle if shipment line doesn't have any assets
    if len(assets_orm) == 0:
        raise HTTPException(status_code=400, detail="Shipment line id doesn't has any asset record")
    asset_serials_db_set = set(
        asset_orm.get('SerialNumber') for asset_orm in assets_orm
    )
    asset_serials_input_set = set(input_asset_serials)
    missing_serials = asset_serials_db_set - asset_serials_input_set
    logger.info(f"List of missing serials: {list(missing_serials)}")
    redundant_serials = asset_serials_input_set - asset_serials_db_set
    matched_serials = asset_serials_db_set & asset_serials_input_set
    return ShipmentLineVerifyResponse(
        message= "Have calculated the differences in user input serials successfully",
        missing_asset_serials= list(missing_serials) if missing_serials is not None else [],
        redundant_asset_serials= list(redundant_serials) if redundant_serials is not None else [],
        matched_asset_serials=list(matched_serials) if matched_serials is not None else []
    )
    
# Verify asset uniqueness
@router.post(
    "/manifest/lines/verify_asset_uniqueness",
    response_model=AssetUniquenessVerifyResponse,
    description = "List of asset user typed in"
)
async def verify_assets_uniqueness(
    asset_inputs: list[AssetInput],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
        
    input_asset_serials:list[str] = [ asset_input.serial_number  for asset_input in asset_inputs ]
    # Check if all input asset is identical
    # Show different asset serials number that has duplicated value
    asset_serials_counter = Counter(input_asset_serials)
    duplicated_asset_serials = [
        key
        for key, value in asset_serials_counter.items() if value > 1
    ]
    if len(duplicated_asset_serials) > 0:
        raise HTTPException(
            status_code=400,
            detail = f"Observed redundant serial number: {duplicated_asset_serials}"
        )
    
    # Search the input asset serials in the database to know which assets are existed
    asset_serials_query = select(AssetORM.SerialNumber).where(
                                     AssetORM.SerialNumber.in_(input_asset_serials),
                                 )
    assets_orm = db.execute(asset_serials_query).mappings().all()
    # handle if shipment line doesn't have any assets
    if len(assets_orm) == 0:
        return AssetUniquenessVerifyResponse(
            message="No serials are existed in database",
            existed_asset_serials= [],
            new_asset_serials= input_asset_serials
        )
    existed_asset_serials_set = set([asset_orm.get('SerialNumber') for asset_orm in assets_orm])
    return AssetUniquenessVerifyResponse(
        message= "Have calculated the differences in user input serials successfully",
        existed_asset_serials= [asset_orm.get('SerialNumber') for asset_orm in assets_orm],
        new_asset_serials= [asset_serial for asset_serial in input_asset_serials if asset_serial not in existed_asset_serials_set]
    )
    
    
class SearchType(str, Enum):
    manifest_id = "manifest_id"
    po_number = "po_number"
    supplier_name = "supplier_name"
@router.get(
    "/manifests/search",
    response_model=ManifestSearchResponse,
    description="Finds 'In Transit' manifests (Status='posted' & Assets='In Transit') based on criteria."
)
async def search_manifests(
    manifest_id: Optional[int] = Query(None, description="Exact match for Manifest ID"),
    supplier_id: Optional[int] = Query(None, description="Exact match for Supplier ID"),
    supplier_name: Optional[str] = Query(None, description="Partial match for Supplier Name"),
    tracking_number: Optional[str] = Query(None, description="Partial match for Tracking Number"),
    date_from: Optional[date] = Query(None, description="Arrival date from (inclusive)"),
    date_to: Optional[date] = Query(None, description="Arrival date to (inclusive)"),
    db: Session = Depends(get_db)
):
    logger.info(f"Searching manifests. Params: ID={manifest_id}, Supplier={supplier_name}/{supplier_id}")

    try:
        # 1. Base Query: The "In Transit" Logic
        query = (
            db.query(ShipmentManifest)
            .join(ShipmentManifest.manifest_lines)
            .join(ShipmentManifestLine.assets)
            # Join Supplier for filtering and fetching the name
            .join(SupplierORM, ShipmentManifest.SupplierId == SupplierORM.SupplierId)
            .filter(ShipmentManifest.Status == "posted")
            .filter(AssetORM.AssetStatus == "In Transit")
        )

        # 2. Apply Dynamic Filters
        if manifest_id:
            logger.info(f"Just searching with manifest id: {manifest_id}")
            query = query.filter(ShipmentManifest.Id == manifest_id)
        # Skipp searching other condition if already has manifest id
        else:
            if supplier_id:
                query = query.filter(ShipmentManifest.SupplierId == supplier_id)
            if supplier_name:
                query = query.filter(SupplierORM.SupplierName.ilike(f"%{supplier_name}%"))

            if tracking_number:
                query = query.filter(ShipmentManifest.TrackingNumber.ilike(f"%{tracking_number}%"))

            if date_from:
                query = query.filter(ShipmentManifest.EstimatedArrival >= date_from)
            if date_to:
                query = query.filter(ShipmentManifest.EstimatedArrival <= date_to)

        # 3. Execute & Deduplicate
        manifests = query.distinct().all()
        logger.info(f"Seeing list of manifests: {manifests}")

        # 4. Map to Response (using snake_case arguments)
        results = []
        for man in manifests:
            # Fetch Supplier Name explicitly or access via relationship if configured
            supp_name = "Unknown"
            
            # Since we performed an inner join on Supplier, the record typically exists.
            # If you have a lazy-loaded relationship: supp_name = man.supplier.SupplierName
            # Otherwise, a quick safe lookup (or optimization via add_entity in the query):
            supplier_obj = db.query(SupplierORM).filter(SupplierORM.SupplierId == man.SupplierId).first()
            if supplier_obj:
                supp_name = supplier_obj.SupplierName

            item_count = len(man.manifest_lines) if man.manifest_lines else 0

            # Use snake_case keys here. 
            # Pydantic will map these to the model fields defined above.
            item = ManifestSearchResultItem(
                id=man.Id,
                manifest_code=f"SM-{man.Id}",
                supplier_name=supp_name,
                tracking_number=man.TrackingNumber,
                carrier_name=man.CarrierName,
                status=man.Status,
                estimated_arrival=man.EstimatedArrival,
                created_at=man.CreatedAt,
                po_number=f"PO-{man.PurchaseOrderId}" if man.PurchaseOrderId else None,
                item_count=item_count
            )
            results.append(item)

        return ManifestSearchResponse(results=results)

    except Exception as e:
        logger.error(f"Error searching manifests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while performing the search."
        )

# Finalize user confirm when receive a shipment
@router.post(
    "/manifests/{manifest_id}/finalize",
    response_model=FinalizeManifestResponse,
    status_code=status.HTTP_201_CREATED,
    description="Submits the count, updates Asset Status to 'Awaiting QC', and updates PO Status."
)
async def finalize_manifest(
    manifest_id: int,
    payload: FinalizeManifestInput,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    try:
        # 1. Fetch Manifest
        manifest = db.query(ShipmentManifest).filter(ShipmentManifest.Id == manifest_id).first()
        if not manifest:
            raise HTTPException(status_code=404, detail="Manifest not found")

        # 2. Resolve Dock Location (Zone)
        # Assuming we look up the Zone by name, or default to a generic 'Receiving' zone if not found
        dock_zone = db.query(ZoneORM).filter(ZoneORM.ZoneName == payload.dock_location).first()
        if not dock_zone:
            # Fallback or Error? For now, let's raise an error to enforce valid zones
            raise HTTPException(status_code=400, detail=f"Zone '{payload.dock_location}' not found.")

        # 3. Create Goods Receipt Record
        receipt_num = f"GR-{generate_random_string(6).upper()}"
        goods_receipt = GoodsReceiptORM(
            ReceiptNumber=receipt_num,
            ReceivedDate=datetime.now(),
            ReceivedByUserId=current_user.UserId,
            ShipmentManifestId=manifest.Id,
            TrackingNumber=manifest.TrackingNumber
        )
        db.add(goods_receipt)
        db.flush() # Flush to get the GoodsReceipt ID

        # 4. Process Counts & Update Assets
        for count_item in payload.counts:
            # Find the line
            line = db.query(ShipmentManifestLine).filter(ShipmentManifestLine.Id == count_item.line_id).first()
            if not line or line.ShipmentManifestId != manifest_id:
                continue # Skip invalid lines

            # Find 'In Transit' assets for this line to mark as Received
            # We limit the query to 'qty_actual' to handle partial receipt/shortage
            assets_to_receive = (
                db.query(AssetORM)
                .filter(AssetORM.ShipmentManifestLineId == line.Id)
                .filter(AssetORM.AssetStatus == "In Transit") # Or 'Pending'
                .limit(count_item.qty_actual)
                .all()
            )

            # Update Assets
            for asset in assets_to_receive:
                asset.AssetStatus = "Awaiting QC" # Standard flow: Received -> Awaiting QC -> Available
                asset.CurrentZoneId = dock_zone.ZoneId
                asset.LastMovementDate = datetime.now()
                asset.GoodsReceiptId = goods_receipt.ReceiptId
            
            # NOTE: If qty_actual > available assets, you might need logic to create NEW assets dynamically.
            # For this implementation, we assume assets were pre-created (ASN logic).

        # 5. Update Manifest Status
        manifest.Status = "Awaiting QC" # Or 'Received'

        # 6. UPDATE PURCHASE ORDER STATUS (The Advice Logic)
        if manifest.PurchaseOrderId:
            update_po_status_logic(db, manifest.PurchaseOrderId)

        db.commit()
        
        return FinalizeManifestResponse(
            receipt_number=receipt_num,
            message=f"Manifest SM-{manifest_id} Finalized. Assets moved to {dock_zone.ZoneName}."
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Error finalizing manifest: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def update_po_status_logic(db: Session, po_id: int):
    """
    Helper function to calculate and update PO status based on asset reception.
    """
    # 1. Calculate Total Ordered Quantity from PO Items
    total_ordered = (
        db.query(func.sum(PurchaseOrderItemORM.Quantity))
        .filter(PurchaseOrderItemORM.PurchaseOrderId == po_id)
        .scalar()
    ) or 0

    # 2. Calculate Total Received Assets linked to this PO
    # We count assets that are NOT 'Pending', 'In Transit' (i.e., they have arrived)
    # Adjust status list based on your specific lifecycle
    total_received = (
        db.query(func.count(AssetORM.AssetId))
        .join(ShipmentManifestLine, AssetORM.ShipmentManifestLineId == ShipmentManifestLine.Id)
        .join(ShipmentManifest, ShipmentManifestLine.ShipmentManifestId == ShipmentManifest.Id)
        .filter(ShipmentManifest.PurchaseOrderId == po_id)
        # Filter for statuses that indicate the item is physically here
        .filter(AssetORM.AssetStatus.in_(["Awaiting QC", "Available", "Allocated", "Quarantine"])) 
        .scalar()
    ) or 0

    # 3. Determine Status
    new_status = "Issued" # Default
    if total_received >= total_ordered and total_ordered > 0:
        new_status = "Received"
    elif total_received > 0:
        new_status = "Partially Received"
    
    # 4. Update PO
    po = db.query(PurchaseOrderORM).filter(PurchaseOrderORM.PurchaseOrderId == po_id).first()
    if po and po.Status != new_status:
        logger.info(f"Updating PO {po_id} status from {po.Status} to {new_status}")
        po.Status = new_status