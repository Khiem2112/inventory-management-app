from fastapi import APIRouter, Depends, status, HTTPException, Query
from app.utils.dependencies import get_db, get_current_user
from app.utils.logger import setup_logger
from app.database.purchase_order_model import PurchaseOrder as PurchaseOrderORM, PurchaseOrderItem as PurchaseOrderItemORM
from app.database.supplier_model import Supplier as SupplierORM
from app.database.user_model import User as UserORM 
from app.schemas.purchase_order import (
  PurchaseOrderRead,
  PurchaseOrderPublic, 
  PurchaseOrderResponse, 
  PurchaseOrderItemPublic,
  PurchaseOrderItemsResponse
  )
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import desc, inspect
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
        "create_date": po.CreateDate.date(),
        "total_price": po.TotalPrice,
        "status": po.Status,
        # Safe navigation for relationships
        "supplier_name": po.Supplier.SupplierName if po.Supplier else "Unknown",
        "create_user_name": po.CreateUser.Name if po.CreateUser else "Unknown"
      })
    # 6. Return Structure: Items + Meta
    """
    Get related metadata:
    - suppliers
    - users
    - statuses
    """   
    # Get list of suppliers
    suppliers_list = db.query(SupplierORM).all()
    # Get list of users
    users_list = db.query(UserORM).all()
    # Get list of unique statuses
    statuses_list = [s[0] for s in db.query(PurchaseOrderORM.Status).distinct().all()]
    return {
      "items": items_list,
      "current_page": page,
      "total_pages": total_pages,
      "limit": limit,
      "total_records": total_records,
      "suppliers": suppliers_list if suppliers_list else None,
      "users": users_list if users_list else None,
      "statuses": statuses_list if statuses_list else None,
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
    
@router.get('/{purchase_order_id}', 
            response_model=PurchaseOrderItemsResponse,
            status_code=status.HTTP_200_OK,
            responses={
        404: {"description": "Product not found"},
        400: {"description": "Invalid Request"}
    })
def get_purchase_order_items(purchase_order_id:int,
                             current_user:UserORM = Depends(get_current_user),
                             db:Session = Depends(get_db)):
  # First check if purchase order id exists and get header data
  try:
    po = db.query(PurchaseOrderORM).filter(
      PurchaseOrderORM.PurchaseOrderId==purchase_order_id
      ).options(joinedload(PurchaseOrderORM.Supplier),
                joinedload(PurchaseOrderORM.CreateUser)).one_or_none()
    logger.info(f"Can get the po: {po}")
    if po is None:
      raise HTTPException(status_code=404,
                          detail="Purchase Order ID does not exist")
    query = db.query(PurchaseOrderItemORM).options(
            # Correctly loading the 'Product' relationship on the PurchaseOrderItem
            joinedload(PurchaseOrderItemORM.Product) 
        ).filter(
            # Filtering using the FOREIGN KEY COLUMN on the PurchaseOrderItem
            PurchaseOrderItemORM.PurchaseOrderId == purchase_order_id
        )
    purchase_order_items = query.all()
    print("\n--- Raw ORM Results ---")
    for item in purchase_order_items:
      # The inspect method reveals the state, including all loaded attributes
      print(f"ORM Object Class: {item.__class__.__name__}")
      print(inspect(item).attrs.keys()) # Prints all available attribute names
      print(f"ORM Object Dict: {item.__dict__}") # Prints the internal dictionary representation
      logger.info(f"Detail product {item.Product.__dict__}")
      # print(f"Pydantic model mapping: {}")
    print("-----------------------\n")
    
    return {
      'header': {
        "purchase_order_id": po.PurchaseOrderId,
        "supplier_id": po.SupplierId,
        "create_user_id": po.CreateUserId,
        "create_date": po.CreateDate.date(),
        "total_price": po.TotalPrice,
        "status": po.Status,
        # Safe navigation for relationships
        "supplier_name": po.Supplier.SupplierName if po.Supplier else "Unknown",
        "create_user_name": po.CreateUser.Name if po.CreateUser else "Unknown"
        },
      'items': purchase_order_items
    }
  except HTTPException:
    raise
  except SQLAlchemyError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Database error: {e}")
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Unexpected error: {e}")
  