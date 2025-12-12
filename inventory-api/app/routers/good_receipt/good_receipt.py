from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import select
from enum import Enum
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
    query: str = Query(..., description="The search term (e.g., 'PO-10023', 'Apple', 'SM-1002')"),
    type: SearchType = Query(SearchType.manifest_id, description="Type of search"),
    db: Session = Depends(get_db)
):
    logger.info(f"Searching manifests. Type: {type}, Query: {query}")

    try:
        # 1. Base Query: Join tables to filter by Asset Status
        # Path: ShipmentManifest -> ShipmentManifestLine -> Asset
        stmt = (
            db.query(ShipmentManifest)
            .join(ShipmentManifest.manifest_lines) # Inner join ensures manifest has lines
            .join(ShipmentManifestLine.assets)     # Inner join ensures lines have assets
            .filter(ShipmentManifest.Status == "posted")   # Header status must be 'posted'
            .filter(Asset.AssetStatus == "In Transit")     # Linked assets must be 'In Transit'
        )

        # 2. Dynamic Filtering based on Search Type
        if type == SearchType.manifest_id:
            # Extract digits (e.g., "SM-1002" -> 1002)
            clean_id_str = "".join(filter(str.isdigit, query))
            logger.info(f"clean id str when finding based on manifest id is: {clean_id_str}")
            if clean_id_str:
                stmt = stmt.filter(ShipmentManifest.Id == int(clean_id_str))
            else:
                return ManifestSearchResponse(results=[])

        elif type == SearchType.po_number:
            # Join PO Table to search by PO ID
            clean_po_id_str = "".join(filter(str.isdigit, query))
            if clean_po_id_str:
                stmt = stmt.join(ShipmentManifest.purchase_order)\
                           .filter(PurchaseOrderORM.PurchaseOrderId == int(clean_po_id_str))
            else:
                return ManifestSearchResponse(results=[])

        elif type == SearchType.supplier_name:
            # Join Supplier Table manually (since we are querying ShipmentManifest)
            stmt = stmt.join(SupplierORM, ShipmentManifest.SupplierId == SupplierORM.SupplierId)\
                       .filter(SupplierORM.SupplierName.ilike(f"%{query}%"))

        # 3. distinct(): 
        # Since we join with Assets (1 Manifest has Many Assets), the query will return 
        # duplicate Manifest rows for every matching Asset. distinct() removes them.
        manifests = stmt.distinct().all()
        # 4. Map to Response Schema
        results = []
        for man in manifests:
            # Fetch Supplier Name manually if relationship lazy loading isn't set up perfectly
            supplier_name = "Unknown"
            # Optimization: could use eager loading in query, but simple lookup is safe here
            supplier = db.query(SupplierORM).filter(SupplierORM.SupplierId == man.SupplierId).first()
            if supplier:
                supplier_name = supplier.SupplierName
            
            # Calculate item count (Total lines in this manifest)
            item_count = len(man.manifest_lines) if man.manifest_lines else 0

            item = ManifestSearchResultItem(
                **man.__dict__,
                manifest_code=f"SM-{man.Id}",
                supplier_name=supplier_name,
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