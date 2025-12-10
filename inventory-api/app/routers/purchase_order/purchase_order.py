from fastapi import APIRouter, Depends, status, HTTPException, Query, Body
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
  PurchaseOrderItemsResponse,
  PurchaseOrderInput,
  PurchaseOrderApproveResponse,
  PurchaseOrderRejectInput,
  PurchaseOrderRejectResponse
  )
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import desc, inspect
from datetime import datetime, date
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
        "purchase_plan_id": po.PurchasePlanId,
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
# Helper function validate po payload
def validate_po_payload(payload: PurchaseOrderInput):
    """
    Centralized business rules for POs.
    """
    if not payload.is_draft:
        # Strict Validation for Real/Confirmed POs
        if not payload.items:
            raise HTTPException(status_code=400, detail="Cannot submit a confirmed PO without items.")
        if payload.supplier_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid Supplier ID.")
    return True
@router.post('/', 
             response_model=PurchaseOrderPublic, 
             status_code=status.HTTP_201_CREATED,
             description="Create a NEW Purchase Order (Draft or Issued)")
# Create new po
def create_purchase_order(
    payload: PurchaseOrderInput = Body(..., description="The PO creation payload"),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    try:
        # 1. Validation
        validate_po_payload(payload)
        
        # 2. Prepare Data
        calculated_total = sum(item.quantity * item.unit_price for item in payload.items)
        po_status = "Draft" if payload.is_draft else "Issued"

        # 3. Create Header
        po_orm = PurchaseOrderORM(
            SupplierId = payload.supplier_id,
            PurchasePlanId = payload.purchase_plan_id,
            Status = po_status,
            TotalPrice = calculated_total,
            CreateUserId = current_user.UserId,
            CreateDate = datetime.now()
        )
        db.add(po_orm)
        db.flush() # Generate ID

        # 4. Create Items
        new_items_orm = []
        for item in payload.items:
            new_item = PurchaseOrderItemORM(
                PurchaseOrderId = po_orm.PurchaseOrderId,
                ProductId = item.product_id,
                Quantity = item.quantity,
                UnitPrice = item.unit_price,
                ItemDescription = item.item_description
            )
            new_items_orm.append(new_item)
        
        if new_items_orm:
            db.add_all(new_items_orm)

        db.commit()
        db.refresh(po_orm)
        logger.info(f"Created PO {po_orm.PurchaseOrderId} with status {po_status}")
        return po_orm

    except HTTPException as e:
        db.rollback()
        raise e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected Error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

# Update draft purchase order
@router.put('/{purchase_order_id}', 
            response_model=PurchaseOrderPublic, 
            status_code=status.HTTP_200_OK,
            description="Update an existing Draft PO (Replace items)")
def update_purchase_order(
    purchase_order_id: int,
    payload: PurchaseOrderInput,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    try:
        # 1. Validation
        validate_po_payload(payload)

        # 2. Check Existence
        po_orm = db.query(PurchaseOrderORM).filter(PurchaseOrderORM.PurchaseOrderId == purchase_order_id).first()
        if not po_orm:
            raise HTTPException(status_code=404, detail="Purchase Order not found.")

        # 3. Constraint: Only Drafts can be edited (unless being Issued now)
        # If it was already Issued, we block edits to prevent history corruption.
        if po_orm.Status == "Issued" and po_orm.Status != "Draft":
             raise HTTPException(status_code=400, detail="Cannot edit a Purchase Order that has already been issued.")

        # 4. Update Header
        calculated_total = sum(item.quantity * item.unit_price for item in payload.items)
        po_status = "Draft" if payload.is_draft else "Issued"

        po_orm.SupplierId = payload.supplier_id
        po_orm.PurchasePlanId = payload.purchase_plan_id
        po_orm.Status = po_status
        po_orm.TotalPrice = calculated_total
        # Note: We typically don't update CreateDate or CreateUserId on edit

        # 5. Update Items (Strategy: Delete All + Re-insert)
        db.query(PurchaseOrderItemORM).filter(PurchaseOrderItemORM.PurchaseOrderId == purchase_order_id).delete()
        
        new_items_orm = []
        for item in payload.items:
            new_item = PurchaseOrderItemORM(
                PurchaseOrderId = purchase_order_id, # Link to existing ID
                ProductId = item.product_id,
                Quantity = item.quantity,
                UnitPrice = item.unit_price,
                ItemDescription = item.item_description
            )
            new_items_orm.append(new_item)
        
        if new_items_orm:
            db.add_all(new_items_orm)

        db.commit()
        db.refresh(po_orm)
        logger.info(f"Updated PO {purchase_order_id} to status {po_status}")
        return po_orm

    except HTTPException as e:
        db.rollback()
        raise e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected Error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

# Approve a purchase order, converting it to issued state and being ready to send to vendor
@router.put('/{purchase_order_id}/approve', 
            response_model=PurchaseOrderApproveResponse, 
            status_code=status.HTTP_200_OK,
            description="Approve a Draft PO, changing status to Issued. Locks the PO from further edits.")
def approve_purchase_order(
    purchase_order_id: int,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    try:
        # 1. Fetch the PO with relations needed for the response
        po_orm = db.query(PurchaseOrderORM).filter(
            PurchaseOrderORM.PurchaseOrderId == purchase_order_id
        ).options(
            joinedload(PurchaseOrderORM.Supplier),
            joinedload(PurchaseOrderORM.CreateUser)
        ).first()

        # 2. Check Existence
        if not po_orm:
            raise HTTPException(status_code=404, detail="Purchase Order not found.")

        # 3. Validate State (Business Logic)
        if po_orm.Status != "Pending":
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot approve a PO with status '{po_orm.Status}'. Only 'Pending' POs can be approved."
            )
        
        # 4. Validate Content (Ensure it's not empty)
        # We need to check if items exist. 
        # Since we didn't eager load items above, we query efficiently:
        item_count = db.query(PurchaseOrderItemORM).filter(
            PurchaseOrderItemORM.PurchaseOrderId == purchase_order_id
        ).count()
        
        if item_count == 0:
            raise HTTPException(status_code=400, detail="Cannot approve an empty Purchase Order.")

        # 5. Perform Transition
        po_orm.Status = "Issued"
        # Set approve date
        po_orm.ApprovalDate = datetime.now()
        po_orm.ApprovedByUserId = current_user.UserId
        # Optional: You might want to record who approved it if you add an 'ApprovedBy' column later
        # po_orm.ApprovedBy = current_user.UserId 
        # po_orm.ApprovedDate = datetime.now()

        # 6. Commit
        db.commit()
        db.refresh(po_orm)
        po_data = PurchaseOrderPublic.model_validate(po_orm)
        
        logger.info(f"User {current_user.UserId} approved PO {purchase_order_id}")
        return PurchaseOrderApproveResponse(
            **po_data.model_dump(),
            message=f"Purchase order: {po_orm.PurchaseOrderId} has been issued"
        )

    except HTTPException as e:
        raise e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database Error during approval: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred.")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected Error during approval: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
      
# Reject PO
@router.put('/{purchase_order_id}/reject', 
            response_model=PurchaseOrderRejectResponse,
            status_code=status.HTTP_200_OK,
            description="Reject a Pending PO, moving it back to Draft status with a reason.")
def reject_purchase_order(
    purchase_order_id: int,
    payload: PurchaseOrderRejectInput, # <--- Capture the JSON body
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user)
):
    try:
        # 1. Fetch the PO
        po_orm = db.query(PurchaseOrderORM).filter(
            PurchaseOrderORM.PurchaseOrderId == purchase_order_id
        ).options(
            joinedload(PurchaseOrderORM.Supplier),
            joinedload(PurchaseOrderORM.CreateUser)
        ).first()

        # 2. Check Existence
        if not po_orm:
            raise HTTPException(status_code=404, detail="Purchase Order not found.")

        # 3. Validate State
        # Ensure we only reject POs that are actually waiting for approval.
        # Note: Adjust "Pending" to "Issued" if that is your 'waiting' status.
        if po_orm.Status != "Pending": 
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot reject a PO with status '{po_orm.Status}'. Only 'Pending' POs can be rejected."
            )
        
        # 4. Perform Transition
        po_orm.Status = "Draft"
        po_orm.RejectionReason = payload.reason  # Save the reason

        # 5. Commit
        db.commit()
        db.refresh(po_orm)
        
        logger.info(f"User {current_user.UserId} rejected PO {purchase_order_id}")

        # 6. Return Response
        # Convert ORM to Pydantic first
        po_data = PurchaseOrderPublic.model_validate(po_orm)
        
        return PurchaseOrderRejectResponse(
            **po_data.model_dump(),
            message=f"Purchase order {purchase_order_id} has been rejected and moved to Draft."
        )

    except HTTPException as e:
        raise e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database Error during rejection: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred.")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected Error during rejection: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")