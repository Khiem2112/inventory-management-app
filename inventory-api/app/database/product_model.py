# In app/database/DBModel.py

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, Integer, DateTime
from datetime import datetime

# You'll need to update your base class to inherit from DeclarativeBase
class Base(DeclarativeBase):
  pass

class Product(Base):
  __tablename__ = "Product"

  # Use mapped_column for each column definition
  ProductId: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  ProductName: Mapped[str] = mapped_column(String(255), nullable=False)
  Measurement: Mapped[str] = mapped_column(String(255), nullable=False)
  SellingPrice: Mapped[float] = mapped_column(Float) # DECIMAL maps to Float in Pydantic
  InternalPrice: Mapped[float] = mapped_column(Float, nullable=False)    
  ProductImageId: Mapped[str] = mapped_column(String, nullable=True)
  class Config:
    from_attributes = True