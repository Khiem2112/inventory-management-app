from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.schemas.product import ProductPublic, ProductBase, ProductCreate, ProductUpdate
from app.utils.dependencies import get_current_user
from app.database.connection import get_db
from app.database.user_model import User as UserORM
from app.database.product_model import Product as ProductORM
from typing import List

router = APIRouter(
  prefix='/products',
  tags =['product']
)
# Get all products
@router.get('/all/', 
            response_model= List[ProductPublic], 
            status_code=status.HTTP_200_OK, 
            description="Fetch all product records")  
def get_products (current_user: UserORM = Depends(get_current_user), db: Session = Depends(get_db)):
  # Get all products
  try:
    query = db.query(ProductORM)
    products = query.all()
    return products
  except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
  except Exception as e:
      raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
    
# Get some products with parameter
@router.get('/',
            status_code=status.HTTP_200_OK, 
            # description="Get products based on page number"
            )
def get_products (current_user: UserORM = Depends(get_current_user),
                  db:Session = Depends(get_db),
                  page: int = Query(1, ge=1, description="Page index, must be >= 1"),
                  limit: int = Query(10, ge=10, le=25, description="Item per page, from 10 to 25")):
  try:
    # Set offset and limit
    offset = (page-1)*limit
    total_products = db.query(ProductORM).count()
    products = db.query(ProductORM).order_by(ProductORM.ProductId).offset(offset).limit(limit).all()
    total_page =( total_products + limit - 1 ) // limit
    return {
      "items" : products,
      "current_page" : page,
      "limit" : limit,
      "total_page" : total_page,
    }
  except SQLAlchemyError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e}")
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {e}")
  
# Get one product by id 
@router.get('/{product_id}', response_model=ProductPublic, status_code=status.HTTP_200_OK)
def get_product_by_id(
  product_id: int,
  current_user: UserORM = Depends(get_current_user),
  db: Session = Depends(get_db) 
):
  try:
    #Get single product
    query = db.query(ProductORM).filter(ProductORM.ProductId == product_id)
    product = query.one_or_none()
    return product
  except SQLAlchemyError as e:
    raise HTTPException(status_code=500, detail=f"Database error {e}")
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Unexpected error {e}")

# Create new product
@router.post('/', response_model=ProductPublic, status_code=status.HTTP_201_CREATED)
def create_product(new_product: ProductCreate,
                   current_user: UserORM = Depends(get_current_user),
                   db: Session = Depends(get_db)
                   ):
  try:
    added_product = ProductORM (
      ProductName = new_product.ProductName,
      Measurement = new_product.Measurement,
      SellingPrice = new_product.SellingPrice,
      InternalPrice = new_product.InternalPrice
    )
    # add product to db
    db.add(added_product)
    db.commit()
    db.refresh(added_product)
  except SQLAlchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail =f"Database error {e}")
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail= f"Unexpected error {e}")
  return added_product

@router.put('/{product_id}', response_model=ProductPublic, status_code=status.HTTP_200_OK)
def update_product(
  product: ProductUpdate,
  product_id: int,
  current_user: UserORM = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  try:
    # Find the product to be updated
    query = db.query(ProductORM).filter(ProductORM.ProductId == product_id)
    found_product = query.one_or_none()
    # Check if we find any product
    if not found_product:
      raise HTTPException(status_code=400, detail="Cannot found user")
    # Update that product
    ## dump pydantic model to create ORM model
    update_data = product.model_dump(exclude_unset=True)
    # Set variable for updated Product
    for field, value in update_data.items():
      setattr(found_product, field, value)
    db.add(found_product)
    db.commit()
    db.refresh(found_product)
  except SQLAlchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f'Database error: {e}')
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')
  return found_product

@router.delete('/{product_id}', status_code=status.HTTP_202_ACCEPTED)
def delete_product(
  product_id: int,
  current_user: UserORM = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  try:
    # Get product
    query = db.query(ProductORM).filter(ProductORM.ProductId == product_id)
    product_orm = query.one_or_none()
    if not product_orm:
      raise HTTPException(status_code=404, detail="Not found product")
    db.delete(product_orm)
    db.commit()
    return {
      'message': f'Successfully deleted product_id {product_id}'
    }
  except SQLAlchemyError as e:
    raise HTTPException(status_code=500, detail=f"database error: {e}")
  except Exception as e:
    raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')