# app/schemas/product.py

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# This is the base model for creating or updating a product.
# It includes the essential fields but no ID or auto-generated fields.
class ProductBase(BaseModel):
    ProductName: str
    Measurement: str
    SellingPrice: Optional[float] = None  # Using Optional since your SQL has no NOT NULL constraint
    InternalPrice: float

# This model is used for data coming from the client to create a new product.
class ProductCreate(ProductBase):
    pass
class ProductUpdate (ProductBase):
    pass
# This model is for the data that your API will return to the client.
# It inherits from ProductBase and adds the database-generated fields.
class ProductPublic(ProductBase):
    ProductId: int
    # CreateDate: Optional[datetime]

    # This configuration tells Pydantic to read from ORM attributes
    # which lets you return SQLAlchemy objects directly.
    model_config = ConfigDict(from_attributes=True)