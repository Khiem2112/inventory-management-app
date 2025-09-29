# app/schemas/product.py

from pydantic import BaseModel, ConfigDict, Field
from pydantic.fields import FieldInfo, PydanticUndefined
from fastapi import UploadFile
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum

# --- REUSABLE ATTRIBUTE BLOCKS (MIXINS) ---

# Block 1: Product Identity (Primary Keys and Identifiers)
class IdentityMixin(BaseModel):
    ProductId: Optional[int] = None # Optional for creation, required for updates/returns
    ModelNumber_SKU: str
    ProductName: str

# Block 2: Core Metrics (Pricing and Measurement)
class CoreMetricsMixin(BaseModel):
    Measurement: str
    SellingPrice: Optional[float] = None
    InternalPrice: float

# Block 3: General & Technical Specifications
class SpecsMixin(BaseModel):
    Category: str
    ProductSeries: str
    Manufacturer: Optional[str] = None
    PackageWeight_KG: Optional[float] = None
    Dimensions_H_CM: Optional[float] = None
    Dimensions_W_CM: Optional[float] = None
    Dimensions_D_CM: Optional[float] = None
    WarrantyPeriod_Days: Optional[int] = None
    
# Block 4: Media & Inventory (Upload/Management fields)
class MediaInventoryMixin(BaseModel):
    ProductImageId: Optional[str] = None
    ProductImageUrl: Optional[str] = None
    SafetyStock: int
    PrimarySupplierID: Optional[int] = None

# -------------------------------------------------------------

# This is the base model for creating or updating a product.
# 2. BASE MODEL (The Full Product Schema)
class ProductBase(
    IdentityMixin, 
    CoreMetricsMixin, 
    SpecsMixin, 
    MediaInventoryMixin
):
    """The single source of truth containing all product attributes."""
    model_config = ConfigDict(from_attributes=True)

# This model is used for data coming from the client to create a new product.
class ProductCreate(ProductBase):
    # Overrides ProductId from Base, setting it as excluded
    # It must NOT be provided by the client, but is needed for the full schema
    ProductId: None = Field(default=None) 
    
    # Example: You might want to make some Optional fields REQUIRED for creation
    # ModelNumber_SKU: str # Already done via Mixin, but you could override here.
    
# Create a new Base for updates to make all fields Optional
def make_optional(field_name: str, field: FieldInfo) -> FieldInfo:
    """Transforms a FieldInfo object to be Optional and have a default of None
       by replacing it with a new FieldInfo object based on the original metadata.
    """
    
    # 1. Determine the new annotation: Optional[OriginalType]
    original_annotation = field.annotation
    optional_annotation = Optional[original_annotation]
    
    # 2. Extract the original Field metadata (title, description, etc.)
    # We must pass these as keyword arguments to Field()
    
    # Prepare metadata to be passed to Field()
    metadata = {
        'default': None,  # Force the default value to None
        'alias': field.alias,
        'title': field.title,
        'description': field.description,
        # Get other validation metadata (e.g., gt, lt, max_length)
        # by checking the FieldInfo's metadata list.
        'metadata': field.metadata, 
    }
    
    # Use the pydantic.Field() function to create a new FieldInfo object.
    # We then use the new annotation to create the final FieldInfo object.
    return FieldInfo.from_annotation(
        annotation=optional_annotation,
        **{k: v for k, v in metadata.items() if v is not PydanticUndefined}
    )

class UpdateSchema(ProductBase):
    """Base class for updating, dynamically making all fields Optional."""
    
    @classmethod
    def __pydantic_init_subclass__(cls, **kwargs: Any) -> None:
        # Loop through all fields inherited from ProductBase
        for field_name, field in cls.model_fields.items():
            # Skip fields that are explicitly excluded (like the one you might add in ProductUpdate)
            if field.exclude:
                 continue
            
            # Replace the field with the optional version
            cls.model_fields[field_name] = make_optional(field_name, field)
            
        super().__pydantic_init_subclass__(**kwargs)
        
class ProductUpdate(UpdateSchema):
    """Schema for updating product data (all fields are optional)."""
    # Overwrite ProductId to be excluded, as it's passed via the URL path
    # We must explicitly exclude it and set a default
    ProductId: Optional[int] = Field(default=None, exclude=True)
class ProductPublic(ProductBase):
    """Schema for data returned to the client, excluding sensitive fields."""
    
    # Exclude sensitive internal data from the final JSON output
    InternalPrice: None = Field(default=None, exclude=True)
    PrimarySupplierID: None = Field(default=None, exclude=True)
    SafetyStock: None = Field(default=None, exclude=True)

class ProductBroadcastType(Enum):
    Add= "product_added"
    Update = "product_updated"
    Delete = "product_deleted"
class ProductBroadcastPayload(ProductPublic):
    pass
class ProductBroadcastMessage(BaseModel):
    type: ProductBroadcastType
    payload: Optional[ProductPublic] = None  # Use a flexible dict for the payload
    model_config = ConfigDict(use_enum_values=True)