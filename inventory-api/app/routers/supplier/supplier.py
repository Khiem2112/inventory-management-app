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
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from app.services.procurement.supplier import SupplierService, get_supplier_service
import traceback
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
    supplier_service: SupplierService = Depends(get_supplier_service)
):
    
    """
    This function create a new shipment manifest in two modes:
    - Each line will be declared with quantity
    - Each line will has its own asset list with specified serial number
    The general flow:
    - Check purchase order existence
    - Check po status if it is Issued
    - Check if the estimated arrival is not before today timestamp --> WARN user
    - Check if any po line item id is duplicated
    - if each shipment manifest line's reference purchase order item id is in the purchase order
    - if quantity in each shipment manifest line match the remaining quantity of the purchase order
    - Create a Shipment manifest document 
    - And many shipment manifest line:
        - Create one shipment manifest line document with reference po and the quantity declared
        - Create one stock move for each shipment manifest, 
        source location = supplier location, destination = in transit location
    - Create n new asset items based on shipment quantity 
        
    """
    try:
        # Create a new supplier service to perform create shipment manifest
        # Check the current purchase order
        return supplier_service.create_shipment_manifest(
            sm_data = payload
        )
    except IntegrityError as e:
        raise HTTPException(500, detail=f"Database integrity error: {e}")
        
    except HTTPException as e:
        raise e
    except ValueError as e:
        raise HTTPException(400, detail=f"Value error: {e}")
    except KeyError as e:
        raise HTTPException(500, detail=f"Key Error: {e}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, detail=f"Unexpected error: {e}")