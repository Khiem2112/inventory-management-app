from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

# Hypothetical imports
from app.database.shipment_manifest_model import (
  ShipmentManifest, 
  ShipmentManifestLine
)
from app.database.asset_model import Asset
from app.database.base import Base 
# Assuming these are available:
from app.schemas.shipment import (

ShipmentManifestLineRead,   
ManifestLinesListResponse,
CountingManifestLineResponse
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