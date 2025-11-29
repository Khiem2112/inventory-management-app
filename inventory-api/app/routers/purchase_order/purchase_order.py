from fastapi import APIRouter, Depends, status, HTTPException, Query
from app.utils.dependencies import get_db, get_current_user
from app.utils.logger import setup_logger
from app.database.purchase_order_model import PurchaseOrder as PurchaseOrderORM
from app.schemas.purchase_order import PurchaseOrderRead,PurchaseOrderPublic, PurchaseOrderResponse
from app.schemas.user import UserBase as UserORM
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import desc
from typing import Optional

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
  
@router.get('/', 
            response_model=PurchaseOrderResponse,
            status_code=status.HTTP_200_OK)
def get_purchase_order_paginated(
  db: Session = Depends(get_db),
  current_user: UserORM = Depends(get_current_user),
  page: int = Query(1, ge=1, description='Page number (1-based)'),
  limit: int = Query(10, ge=1, le=100, description='Items per page'),
  status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
  vendor_id: Optional[int] = Query(None, description="Filter by Vendor ID")
):
  try:
    # 1. Start the query with optimization (joinedload)
    # This prevents the N+1 problem by fetching relations in the same query
    query = db.query(PurchaseOrderORM).options(
      joinedload(PurchaseOrderORM.Supplier),
      joinedload(PurchaseOrderORM.CreateUser)
    )

    # 2. Apply Filters
    if status_filter:
      query = query.filter(PurchaseOrderORM.Status == status_filter)
    if vendor_id:
      query = query.filter(PurchaseOrderORM.SupplierId == vendor_id)

    # 3. Calculate Meta Data (Total Records)
    total_records = query.count()
    total_pages = (total_records + limit - 1) // limit

    # 4. Apply Sorting & Pagination
    # Default sort: Created Date Descending (Newest first)
    query = query.order_by(desc(PurchaseOrderORM.CreateDate))
    
    offset = (page - 1) * limit
    results = query.offset(offset).limit(limit).all()

    # 5. Map ORM Objects to Flat Dictionary (Items)
    # We manually map relationships to flat fields (vendor_name, creator_name)
    items_list = []
    for po in results:
      items_list.append({
        "purchase_order_id": po.PurchaseOrderId,
        "supplier_id": po.SupplierId,
        "create_user_id": po.CreateUserId,
        "create_date": po.CreateDate,
        "total_price": po.TotalPrice,
        "status": po.Status,
        # Safe navigation for relationships
        "supplier_name": po.Supplier.SupplierName if po.Supplier else "Unknown",
        "create_user_name": po.CreateUser.Name if po.CreateUser else "Unknown"
      })
    # 6. Return Structure: Items + Meta
    return {
      "items": items_list,
      "current_page": page,
      "total_pages": total_pages,
      "limit": limit,
      "total_records": total_records
    }

  except SQLAlchemyError as e:
    logger.error(f"Database Error: {e}")
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
      detail="Database error occurred while fetching purchase orders."
    )
  except Exception as e:
    logger.error(f"Unexpected Error: {e}")
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
      detail="An unexpected error occurred."
    )