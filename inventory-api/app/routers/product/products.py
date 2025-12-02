from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect, UploadFile, Form, File
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.schemas.product import (ProductPublic, 
                                 ProductBase, 
                                 ProductCreate, 
                                 ProductUpdate,
                                 ProductBroadcastMessage,
                                 ProductBroadcastType,
                                 ProductPaginationResponse)
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
            response_model= List[ProductPublic], 
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
            response_model=ProductPaginationResponse,
            description="Get products based on page number"
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
      "total_pages" : total_page,
      "total_records": total_products
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
    added_product = ProductORM(
      ProductId = new_product.product_id,
      ModelNumber_SKU = new_product.model_number_sku,
      ProductName = new_product.product_name,
      
      # General info
      Category = new_product.category,
      ProductSeries = new_product.product_series,
      Manufacturer = new_product.manufacturer,
      Measurement = new_product.measurement,
      SellingPrice = new_product.selling_price,
      InternalPrice = new_product.internal_price,
      
      # Media
      ProductImageId = new_product.product_image_id,
      ProductImageUrl = new_product.product_image_url,
      
      # Technical stats
      PackageWeight_KG = new_product.package_weight_kg,
      Dimensions_H_CM = new_product.dimensions_h_cm,
      Dimensions_W_CM= new_product.dimensions_w_cm,
      Dimensions_D_CM = new_product.dimensions_d_cm,
      
      # Additional
      SafetyStock = new_product.safety_stock,
      WarrantyPeriod_Days = new_product.warranty_period_days,
      PrimarySupplierID = new_product.primary_supplier_id
    )
    
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
        # 1. Find the product
        query = db.query(ProductORM).filter(ProductORM.ProductId == product_id)
        found_product = query.one_or_none()

        if not found_product:
            raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found.")

        # 2. Get the incoming Pydantic data (only fields that were set)
        #    We use this dictionary to check if a value was actually provided in the request
        update_data = product.model_dump(exclude_unset=True)

        # 3. EXPLICIT MANUAL MAPPING AND UPDATE
        #    If the field was provided in the Pydantic input (checked via update_data keys),
        #    manually map the snake_case Pydantic field to the PascalCase ORM attribute.
        
        # Identity
        if 'product_id' in update_data:
            found_product.ProductId = product_id
        if 'model_number_sku' in update_data:
            found_product.ModelNumber_SKU = product.model_number_sku
        if 'product_name' in update_data:
            found_product.ProductName = product.product_name
        
        # General info
        if 'category' in update_data:
            found_product.Category = product.category
        if 'product_series' in update_data:
            found_product.ProductSeries = product.product_series
        if 'manufacturer' in update_data:
            found_product.Manufacturer = product.manufacturer
        if 'measurement' in update_data:
            found_product.Measurement = product.measurement
        if 'selling_price' in update_data:
            found_product.SellingPrice = product.selling_price
        if 'internal_price' in update_data:
            found_product.InternalPrice = product.internal_price
            
        # Media
        if 'product_image_id' in update_data:
            found_product.ProductImageId = product.product_image_id
        if 'product_image_url' in update_data:
            found_product.ProductImageUrl = product.product_image_url
            
        # Technical stats
        if 'package_weight_kg' in update_data:
            found_product.PackageWeight_KG = product.package_weight_kg
        if 'dimensions_h_cm' in update_data:
            found_product.Dimensions_H_CM = product.dimensions_h_cm
        if 'dimensions_w_cm' in update_data:
            found_product.Dimensions_W_CM = product.dimensions_w_cm
        if 'dimensions_d_cm' in update_data:
            found_product.Dimensions_D_CM = product.dimensions_d_cm
            
        # Additional
        if 'safety_stock' in update_data:
            found_product.SafetyStock = product.safety_stock
        if 'warranty_period_days' in update_data:
            found_product.WarrantyPeriod_Days = product.warranty_period_days
        if 'primary_supplier_id' in update_data:
            found_product.PrimarySupplierID = product.primary_supplier_id


        # 4. Commit the changes
        db.add(found_product)
        db.commit()
        db.refresh(found_product)
        
        # Broadcast an update message
        broadcast_data = ProductPublic.model_validate(found_product)
        message = ProductBroadcastMessage(
            type = ProductBroadcastType.Update,
            payload= broadcast_data.model_dump()
        )
        await manager.broadcast(message.model_dump_json())
        
        return found_product

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f'Database error: {e}')
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')

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
    return {
      'message': f'Successfully deleted product_id {product_id}'
    }
  except SQLAlchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"database error: {e}")
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f'Unexpected error: {e}')