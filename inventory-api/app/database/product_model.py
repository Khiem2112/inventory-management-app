# In app/database/DBModel.py

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Integer, DateTime, FLOAT
from datetime import datetime
from app.database.base import Base
from app.database.purchase_order_model import PurchaseOrderItem

# You'll need to update your base class to inherit from DeclarativeBase


class Product(Base):
  __tablename__ = "Product"

  # Use mapped_column for each column definition
  
  # Product Identity
  ProductId: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  ModelNumber_SKU: Mapped[str] = mapped_column(String, nullable=False)
  ProductName: Mapped[str] = mapped_column(String(255), nullable=False)
  
  # General info
  Category: Mapped[str] = mapped_column(String, nullable=False)
  ProductSeries: Mapped[str] = mapped_column(String, nullable=False)
  Manufacturer: Mapped[str] = mapped_column(String, nullable=True)
  Measurement: Mapped[str] = mapped_column(String(255), nullable=False)
  SellingPrice: Mapped[float] = mapped_column(Float) # DECIMAL maps to Float in Pydantic
  InternalPrice: Mapped[float] = mapped_column(Float, nullable=False)
  
  # Media
  ProductImageId: Mapped[str] = mapped_column(String, nullable=True)
  ProductImageUrl: Mapped[str] = mapped_column(String, nullable=True)
  
  # Technical stats
  PackageWeight_KG: Mapped[float] = mapped_column(FLOAT, nullable=True)
  Dimensions_H_CM: Mapped[float] = mapped_column(FLOAT, nullable=True)
  Dimensions_W_CM: Mapped[float] = mapped_column(FLOAT, nullable=True)
  Dimensions_D_CM: Mapped[float] = mapped_column(FLOAT, nullable=True)
  
  # Additional
  SafetyStock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
  WarrantyPeriod_Days: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
  PrimarySupplierID :  Mapped[int] = mapped_column(Integer, nullable=True)
  
  # relationship
  PurchaseOrderItems: Mapped[list["PurchaseOrderItem"]] = relationship("PurchaseOrderItem", 
                                                                     lazy="joined", 
                                                                     back_populates="Product")
  
  class Config:
    from_attributes = True