from fastapi import APIRouter, status, Depends, HTTPException, Body
from app.utils.logger import setup_logger
from app.database.supplier_model import Supplier as SupplierORM
from app.database.user_model import User as UserORM
from app.database.purchase_order_model import PurchaseOrder, PurchaseOrderItem
from app.database.shipment_manifest_model import ShipmentManifest, ShipmentManifestLine
from app.database.asset_model import Asset
from app.database.warehouse_zone_model import Zone, ZoneType
from app.schemas.shipment import ShipmentManifestRead, ShipmentManifestInput
from app.schemas.supplier import SupplierPublic
from app.utils.dependencies import get_current_user, get_db
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
import uuid


router = APIRouter(
  prefix="/supplier",
  tags=['supplier']
)
logger = setup_logger()

# Get all suppliers
@router.get("/all",
        response_model=list[SupplierPublic],
        status_code= status.HTTP_200_OK 
        )
def get_all_supplers(db: Session = Depends(get_db),
                     current_user: UserORM = Depends(get_current_user)):
  try:
    # Get all suppliers
    suppliers = db.query(SupplierORM).all()
    return suppliers
  
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f'Error when fetching all suppliers record: {e}')
    
@router.post('/manifest', 
             response_model=ShipmentManifestRead, 
             status_code=status.HTTP_201_CREATED,
             description="Create a new Shipment Manifest. Assets are 'Disabled' if Draft, 'In Transit' if Issued.")
def create_shipment_manifest(
    payload: ShipmentManifestInput = Body(...),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    try:
        # 1. Validation: Check Purchase Order Validity
        po_orm = None
        sku_map = {} # Map[Sku, ProductId]

        if payload.purchase_order_id:
            po_orm = db.query(PurchaseOrder).filter(
                PurchaseOrder.PurchaseOrderId == payload.purchase_order_id
            ).options(
                joinedload(PurchaseOrder.PurchaseOrderItems).joinedload(PurchaseOrderItem.Product)
            ).first()
            
            if not po_orm:
                raise HTTPException(status_code=404, detail="Referenced Purchase Order not found.")

        # 2. Get Default Zone
        default_zone = db.query(Zone).filter(Zone.ZoneType == ZoneType.Receiving).first()
        if not default_zone:
            default_zone = db.query(Zone).first()
            if not default_zone:
                 raise HTTPException(status_code=400, detail="No Warehouse Zones defined. Cannot create Assets.")

        # 3. Determine Statuses
        manifest_status = payload.status or "Draft"
        if manifest_status == "Draft":
            initial_asset_status = "Disabled"
        else:
            initial_asset_status = "In Transit"

        # 4. Create Manifest Header (MANUAL MAPPING)
        # Note: We strictly use po_orm.SupplierId instead of anything from the payload
        new_manifest = ShipmentManifest(
            SupplierId=po_orm.SupplierId, 
            PurchaseOrderId=payload.purchase_order_id,
            TrackingNumber=payload.tracking_number,
            CarrierName=payload.carrier_name,
            EstimatedArrival=payload.estimated_arrival,
            Status=manifest_status,
            CreatedByUserId=current_user.UserId,
            CreatedAt=datetime.now()
        )
        
        db.add(new_manifest)
        db.flush() # Generate new_manifest.Id

        # 5. Create Lines and Associated Assets
        new_lines = []
        new_assets = []

        for line in payload.lines:
            # Create the Line
            new_line = ShipmentManifestLine(
                ShipmentManifestId=new_manifest.Id,
                SupplierSerialNumber=line.supplier_serial_number,
                SupplierSku=line.supplier_sku,
                QuantityDeclared=line.quantity_declared
            )
            db.add(new_line)
            db.flush() # Flush to generate new_line.Id

            # Create Assets
            product_id = line.product_id
            
            if product_id:
                for _ in range(line.quantity_declared):
                    # Generate a temporary Serial Number
                    temp_serial = f"TMP-{new_manifest.Id}-{new_line.Id}-{uuid.uuid4().hex[:6].upper()}"
                    
                    new_asset = Asset(
                        SerialNumber=temp_serial,
                        ProductId=line.product_id,
                        CurrentZoneId=default_zone.ZoneId,
                        AssetStatus=initial_asset_status, 
                        LastMovementDate=datetime.now(),
                        ShipmentManifestLineId=new_line.Id,
                        GoodsReceiptId=None
                    )
                    new_assets.append(new_asset)
            else:
                logger.warning(f"Could not find Product ID for SKU '{line.supplier_sku}'. Assets not created.")

        if new_assets:
            db.add_all(new_assets)
            
        # 6. Commit Transaction
        db.commit()
        db.refresh(new_manifest)
        
        logger.info(f"Created Manifest {new_manifest.Id} ({manifest_status}). Generated {len(new_assets)} assets.")
        return new_manifest

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating shipment manifest: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while creating the manifest.")