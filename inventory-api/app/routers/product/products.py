from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect, UploadFile, Form, File
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.schemas.product import ProductPublic, ProductBase, ProductCreate, ProductUpdate, ProductBroadcastMessage, ProductBroadcastType
from app.utils.dependencies import get_current_user
from app.database.connection import get_db
from app.database.user_model import User as UserORM
from app.database.product_model import Product as ProductORM
from typing import List, Annotated
from app.services.socket_manager import ConnectionManager
from app.utils.logger import setup_logger
from app.utils.dependencies import FormBody
import cloudinary.uploader
import cloudinary

import json

router = APIRouter(
  prefix='/products',
  tags =['product']
)

# logger
logger = setup_logger()

manager = ConnectionManager()
# Get all products
@router.get('/all/', 
            # response_model= List[ProductPublic], 
            status_code=status.HTTP_200_OK, 
            description="Fetch all product records")  
def get_products_all (current_user: UserORM = Depends(get_current_user), db: Session = Depends(get_db)):
  # Get all products
  try:
    query = db.query(ProductORM)
    logger.info(f"Get the query to fetch all products: {query}")
    products = query.all()
    logger.info(f"Can receive the products list: {products[:4]}")
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
def get_products_paginated (current_user: UserORM = Depends(get_current_user),
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
  
# Auto get some product using websocket
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    logger.info('A client connected to server')
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info('Disconnect to a client')
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
async def create_product(new_product: ProductCreate,
                   current_user: UserORM = Depends(get_current_user),
                   db: Session = Depends(get_db),
                   ):
  try:
    added_product = ProductORM(**new_product.model_dump(exclude_unset=True))
    # add product to db
    db.add(added_product)
    db.commit()
    db.refresh(added_product)
    
    # Broadcast message
    broadcast_data = ProductPublic.model_validate(added_product)
    logger.info(f"read broadcast data: {broadcast_data}")
    message = ProductBroadcastMessage (
      type=ProductBroadcastType.Add,
      payload= broadcast_data.model_dump()
    )
    logger.info('have create a message')
    await manager.broadcast(message.model_dump_json())
    return added_product

  except SQLAlchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail =f"Database error {e}")
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail= f"Unexpected error {e}")

@router.post("/upload-image", status_code=status.HTTP_201_CREATED)
async def upload_product_image (upload_file: UploadFile = File(...),
                                current_user = Depends(get_current_user),
                                ):
  # Check image upload
  if not upload_file.content_type.startswith('image/'):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                        detail="Only image file is valid")
  try:
    upload_result = cloudinary.uploader.upload(file = upload_file.file
                                                        )
    logger.info("Upload image can be performed")
    image_url = upload_result.get("secure_url")
    public_id = upload_result.get("public_id")
    
    logger.info(f"Image url returned by cloudinary server is: {image_url}")
    if not image_url:
      raise Exception("Cloudinary failed to return an url")
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Uncaught Internal Server Error: {e}")
  return {
    'image_url': image_url,
    'public_id': public_id,
    'message': "Upload Product image successfully",
    'image_category': "product"
  }

@router.put('/{product_id}', response_model=ProductPublic, status_code=status.HTTP_200_OK)
async def update_product(
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
    logger.info(f"The update data is like: {update_data}")
    # Set variable for updated Product
    for field, value in update_data.items():
      setattr(found_product, field, value)
    db.add(found_product)
    db.commit()
    db.refresh(found_product)
    # Broadcast an update message
    broadcast_data = ProductPublic.model_validate(found_product)
    message = ProductBroadcastMessage(
      type =ProductBroadcastType.Update,
      payload= broadcast_data.model_dump()
    )
    await manager.broadcast(message.model_dump_json())
  except SQLAlchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f'Database error: {e}')
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')
  return found_product

@router.put('/{product_id}/image')
async def update_product_image(
    product_id: int,
    upload_file: UploadFile = File(...),
    current_user: UserORM = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Step 1: Validate the incoming file
    if not upload_file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are valid"
        )
    
    # Step 2: Retrieve the existing product from the database
    product = db.query(ProductORM).filter(ProductORM.ProductId == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found."
        )

    public_id = None
    try:
        # Step 3: Delete the old image from Cloudinary if it exists
        if product.ProductImageId:
            cloudinary.uploader.destroy(product.ProductImageId)

        # Step 4: Upload the new image to Cloudinary
        upload_result = cloudinary.uploader.upload(upload_file.file)
        
        # Step 5: Update the database record with the new image info
        product.ProductImageUrl = upload_result.get("secure_url")
        product.ProductImageId = upload_result.get("public_id")

        db.commit()
        db.refresh(product)
        
        return {
            "message": "Product image updated successfully",
            "image_url": product.ProductImageUrl,
            "public_id": product.ProductImageId
        }
    
    except Exception as e:
        # Rollback the database if the upload or commit fails
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during image update: {e}"
        )

@router.delete('/{product_id}', status_code=status.HTTP_202_ACCEPTED)
async def delete_product(
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
    # broadcast message to all cients
    broadcast_data = ProductPublic.model_validate(product_orm)
    message = ProductBroadcastMessage(
      type = ProductBroadcastType.Delete,
      payload={
        "product_id": product_id
      }
    )
    await manager.broadcast(message.model_dump_json())
    return {
      'message': f'Successfully deleted product_id {product_id}'
    }
  except SQLAlchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"database error: {e}")
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')