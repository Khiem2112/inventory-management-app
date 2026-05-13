import csv
import requests
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database.product_model import Product
from app.database.product_quarantine_model import ProductQuarantine
from app.schemas.product import ProductCreate
from app.utils.logger import setup_logger

logger = setup_logger()

class ProductImportUseCase:
    def __init__(self, db: Session):
      self.db = db

    def execute(self, file_url: str, user_id: int, job_id:str):
      logger.info(f"Start the execution of product import use case")
      self.success_count = 0
      self.conflict_count = 0
      self.format_fail_count = 0
      

      # 1. Open an HTTP stream (do NOT load into memory)
      with requests.get(file_url, stream=True) as response:
        try:
          response.raise_for_status()
          
          # Decode bytes to strings on the fly
          lines = (line.decode('utf-8') for line in response.iter_lines())
          reader = csv.DictReader(lines)
          # Optimize code by place those sku numbers in a set
          self.product_skus = set(self.db.execute(select(Product.ModelNumber_SKU)).scalars().all())
          print(f'some of product skus: ',list(self.product_skus))
          # 2. Parse row-by-row
          for row in reader:
            print(f"Currnet row: {row}"),
            sku = row.get('ModelNumber_SKU') 
            
            # Check for existing product
            if sku is None:
              print(f"SKU is None")
              self.format_fail_count += 1
            elif sku in self.product_skus:
              logger.info(f"The product sku: {sku} is duplicated")
              self._add_to_quarantine(row, job_id)
            else:
              
              self._add_new_product(row)
                
            # Flush to DB periodically to clear SQLAlchemy session memory
            if (self.success_count + self.conflict_count) % 1000 == 0:
              self.db.flush()

          # 3. Final Commit
          self.db.commit()

      
        except Exception as e:
          
          self.db.rollback()
        
          logger.error(f"Face unexpected error: {e}")
        finally:
          # 4. Trigger Email Notification Adapter
          self._notify_user(user_id, 
                            self.success_count, 
                            self.conflict_count, 
                            self.format_fail_count)
          
    def _add_to_quarantine(self, raw_data: dict, job_id:str):
      # Find duplicate product
      input_product_sku = raw_data.get('ModelNumber_SKU')
      stmt = select(Product.ProductId).where(Product.ModelNumber_SKU == input_product_sku)
      duplicated_product_id = self.db.execute(stmt).scalar_one_or_none()
      # Insert into ProductQuarantine table
      quarantine_record = ProductQuarantine(
        JobId=job_id,
        ImportedRawData=raw_data,
        ConflictingProductId = duplicated_product_id,
        Status="pending"
      )
      self.db.add(quarantine_record)
      self.conflict_count += 1

    def _add_new_product(self, data: dict):
      try:
        # Insert into Product table
        new_product = Product(
            # Strings
            ProductName=data.get("ProductName"),
            ModelNumber_SKU=data.get("ModelNumber_SKU"),
            Measurement=data.get("Measurement"),
            Manufacturer=data.get("Manufacturer"),
            ProductSeries=data.get("ProductSeries"),
            Category=data.get("Category"),
            
            # Numbers (Explicitly cast with fallback to 0 if empty)
            SellingPrice=float(data.get("SellingPrice") or 0),
            InternalPrice=float(data.get("InternalPrice") or 0),
            SafetyStock=int(data.get("SafetyStock") or 0),
            
            # Physical Dimensions
            PackageWeight_KG=float(data.get("PackageWeight_KG") or 0),
            Dimensions_H_CM=float(data.get("Dimensions_H_CM") or 0),
            Dimensions_W_CM=float(data.get("Dimensions_W_CM") or 0),
            Dimensions_D_CM=float(data.get("Dimensions_D_CM") or 0),
            
            # IDs and Integers
            WarrantyPeriod_Days=int(data.get("WarrantyPeriod_Days") or 0),
            PrimarySupplierID=int(data.get("PrimarySupplierID") or 0) if data.get("PrimarySupplierID") else None,
            
        )
        self.db.add(new_product)
        # Update the global set to prevent duplicate over different product
        self.product_skus.add(str(data.get("ModelNumber_SKU")))
        self.success_count += 1

      except (ValueError, TypeError) as e:
        self.format_fail_count += 1
        logger.error(f"Format error: {e}")
    def _notify_user(self, 
                     user_id: int, 
                     success: int, 
                     conflict: int, 
                     format_fail: int):
      # Call your EmailAdapter here
      logger.info(f"There are actually {success} call and {conflict} conflicts and {format_fail} failed due to format when process task for user: {user_id}")
      