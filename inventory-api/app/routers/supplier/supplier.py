from fastapi import APIRouter, status, Depends, HTTPException
from app.utils.logger import setup_logger
from app.database.supplier_model import Supplier as SupplierORM
from app.database.user_model import User as UserORM
from app.schemas.supplier import SupplierPublic
from app.utils.dependencies import get_current_user, get_db
from sqlalchemy.orm import Session


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