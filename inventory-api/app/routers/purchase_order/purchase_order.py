from fastapi import APIRouter, Depends, status, HTTPException
from app.utils.dependencies import get_db, get_current_user
from app.utils.logger import setup_logger
from app.database.purchase_order_model import PurchaseOrder as PurchaseOrderORM
from app.schemas.purchase_order import PurchaseOrderBase, PurchaseOrderRead, PurchaseOrderCreate
from app.schemas.user import UserBase as UserORM
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError


logger = setup_logger()
router = APIRouter(prefix='/purchase-order', tags=['po'])


# get list of purchase orders

@router.get('/all', 
            response_model=list[PurchaseOrderRead], 
            status_code=status.HTTP_200_OK)
def get_all_purchase_orders(db:Session =  Depends(get_db),
                            current_user: UserORM = Depends(get_current_user)):
  # Try fetch data from sqlachemy
  try:
    query = db.query(PurchaseOrderORM)
    purchase_orders = query.all()
    logger.info('Have fetched purchase orders successfully from database')
    return purchase_orders
  except SQLAlchemyError as e:
    logger.error(f'Interal SQL alchemy error: {e}')
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal database error :{e}")
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'Unexpected error: {e}')
  