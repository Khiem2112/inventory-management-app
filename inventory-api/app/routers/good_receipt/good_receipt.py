from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import select
from enum import Enum
from datetime import datetime, date
# Hypothetical imports
from app.database.shipment_manifest_model import (
  ShipmentManifest, 
  ShipmentManifestLine
)
from app.database.asset_model import Asset
from app.database.supplier_model import Supplier as SupplierORM
from app.database.purchase_order_model import PurchaseOrder as PurchaseOrderORM
# Assuming these are available:
from app.schemas.shipment import (

ShipmentManifestLineRead,   
ManifestLinesListResponse,
CountingManifestLineResponse,
ManifestSearchResponse,
ManifestSearchResultItem
)
from app.utils.dependencies import get_db
from app.utils.logger import setup_logger

# Initialize the router (assuming 'router' is already defined)
router = APIRouter(prefix="/receiving", tags=["Receiving"])

# Logger
logger = setup_logger()

@router.get(
    "/manifests/{manifest_id}/lines", 
    response_model=ManifestLinesListResponse, 
    description="Retrieves all line items for a specific Shipment Manifest."
)
async def get_all_manifest_lines(
    manifest_id: int, 
    db: Session = Depends(get_db)
):
    """
    Fetches a ShipmentManifest and eagerly loads all associated ShipmentManifestLine objects 
    using the db.query() and filter() syntax.
    """
    logger.info(f"Fetching manifest details for ID: {manifest_id}. Using final consistent naming conventions.")

    try:
        # 1. Fetch data efficiently using db.query() and eager loading (1.x syntax)
        manifest_orm: Optional[ShipmentManifest] = (
            db.query(ShipmentManifest)
            .options(
                selectinload(ShipmentManifest.manifest_lines)
                .selectinload(ShipmentManifestLine.assets) 
                .joinedload(Asset.product) 
            )
            .filter(ShipmentManifest.Id == manifest_id)
            .first()
        )

    except Exception as e:
        logger.error(f"Database error while fetching manifest {manifest_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while accessing manifest data."
        )

    if manifest_orm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shipment Manifest with ID {manifest_id} not found."
        )

    # 2. Process Lines and Map to Response Schema
    response_lines: List[CountingManifestLineResponse] = []
    
    for line_orm in manifest_orm.manifest_lines:
        
        # --- CORE LOGIC: Calculation ---
        qty_received = sum(
            1 for asset in line_orm.assets 
            if asset.AssetStatus.lower() == 'received'
        )
        
        # --- Data Derivation ---
        product_name = None
        if line_orm.assets and line_orm.assets[0].product:
            product_name = line_orm.assets[0].product.ProductName

        po_number = f"PO-{manifest_orm.PurchaseOrderId}" if manifest_orm.PurchaseOrderId else None
        
        # --- Prepare the data dictionary for Pydantic mapping ---
        line_data = {
            "id": line_orm.Id, # Maps directly to Pydantic 'id'
            "supplier_sku": line_orm.SupplierSku, 
            "quantity_declared": line_orm.QuantityDeclared, 
            "po_number": po_number,
            "product_name": product_name,
            "qty_received": qty_received 
        }
        # Validate and append using the Pydantic schema
        response_line = CountingManifestLineResponse.model_validate(
            line_data
        )
        
        response_lines.append(response_line)

    # 3. Construct Final Response
    
    return ManifestLinesListResponse(
        shipment_manifest_id=manifest_orm.Id,
        supplier_id= manifest_orm.SupplierId,
        purchase_order_id= manifest_orm.PurchaseOrderId,
        tracking_number = manifest_orm.TrackingNumber,
        carrier_name= manifest_orm.CarrierName,
        estimated_arrival= manifest_orm.EstimatedArrival,
        created_by_user_id= manifest_orm.CreatedByUserId,
        status=manifest_orm.Status,
        lines=response_lines,
        message=f"Shipment Manifest {manifest_id} details successfully retrieved with {len(response_lines)} lines.",
        total_lines= len(response_lines)
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
            .filter(Asset.AssetStatus == "In Transit")
        )

        # 2. Apply Dynamic Filters
        if manifest_id:
            query = query.filter(ShipmentManifest.Id == manifest_id)

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