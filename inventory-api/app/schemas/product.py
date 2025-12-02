# app/schemas/product.py

from pydantic import BaseModel, ConfigDict, Field
from pydantic.fields import FieldInfo, PydanticUndefined
from fastapi import UploadFile
from datetime import datetime
from typing import Optional, TypeVar, Type, Any, get_args, get_origin, Dict
from enum import Enum
from app.schemas.base import AutoWriteSchema, AutoReadSchema
from app.schemas.pagination import PaginationMetaData
# --- REUSABLE ATTRIBUTE BLOCKS (MIXINS) ---

# Block 1: Product Identity (Primary Keys and Identifiers)
class IdentityMixin(BaseModel):
    product_id: Optional[int] = None # Optional for creation, required for updates/returns
    model_number_sku: str = Field(...)
    product_name: str

# Block 2: Core Metrics (Pricing and Measurement)
class CoreMetricsMixin(BaseModel):
    measurement: str
    selling_price: Optional[float] = None
    internal_price: float

# Block 3: General & Technical Specifications
class SpecsMixin(BaseModel):
    category: str
    product_series: Optional[str] = None
    manufacturer: Optional[str] = None
    package_weight_kg: Optional[float] = Field(...)
    dimensions_h_cm: Optional[float] = Field(...)
    dimensions_w_cm: Optional[float] = Field(...)
    dimensions_d_cm: Optional[float] = Field(...)
    warranty_period_days: Optional[int] = None
    
# Block 4: Media & Inventory (Upload/Management fields)
class MediaInventoryMixin(BaseModel):
    product_image_id: Optional[str] = None
    product_image_url: Optional[str] = None
    safety_stock: Optional[int] = None
    primary_supplier_id: Optional[int] = Field(...)

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
    model_config = ConfigDict(from_attributes=True,
                              populate_by_name=True)

# This model is used for data coming from the client to create a new product.
class ProductCreate(ProductBase, AutoWriteSchema):
    # Overrides ProductId from Base, setting it as excluded
    # It must NOT be provided by the client, but is needed for the full schema
    product_id: None = Field(default=None)
        
T = TypeVar('T', bound=BaseModel)

def make_optional_all(cls: Type[T]) -> Type[T]:
    """
    Dynamically converts all fields in a BaseModel to be Optional[type] = None 
    by explicitly building __annotations__ for Pydantic v2.
    """
    
    # Dictionary for the new class attributes (fields, config, annotations)
    new_class_attrs: Dict[str, Any] = {'model_config': cls.model_config}
    
    # 1. Start a separate dictionary to hold type hints
    annotations: Dict[str, Any] = {}
    
    # 2. Iterate over all original fields
    for name, field_info in cls.model_fields.items():
        
        original_annotation = field_info.annotation
        
        # Determine the new annotation (making sure it's Optional)
        is_optional = get_origin(original_annotation) is Optional or \
                      (get_origin(original_annotation) is type and type(None) in get_args(original_annotation))

        new_annotation = original_annotation if is_optional else Optional[original_annotation]
        
        # 3. Create the new Field object
        field_kwargs = {
            'alias': field_info.alias,
            'title': field_info.title,
            'description': field_info.description,
            **{key: getattr(field_info, key) for key in ('alias_priority', 'validation_alias', 'serialization_alias', 'discriminator', 'frozen') if getattr(field_info, key) is not PydanticUndefined}
        }
        
        # Create the new Field object. 
        # The key here is passing the default=None, which makes it optional
        # The annotation itself is handled by the __annotations__ dict.
        new_field = Field(
            default=None,  
            **field_kwargs
        )
        
        # 4. Assign the Field object as the attribute value
        new_class_attrs[name] = new_field
        
        # 5. Explicitly add the type hint to the annotations dictionary
        annotations[name] = new_annotation

    # 6. Inject the custom annotations dictionary into the class attributes
    new_class_attrs['__annotations__'] = annotations
    
    # 7. Dynamically create the new class
    new_class_name = f"Optional{cls.__name__}"
    
    # Pass the attributes dictionary to type()
    new_class = type(new_class_name, (BaseModel,), new_class_attrs)
    
    return new_class
# --------------------------------------------------------------------------------

# 5. Define the Final Update Schema
# ProductBase must be defined and passed here. 
# Assuming you have the ProductBase class defined from your previous messages:

# ProductUpdate is the dynamically generated class where ALL fields are Optional[Type] = None
ProductUpdateBase = make_optional_all(ProductBase)

class ProductUpdate(ProductUpdateBase, AutoWriteSchema):
    """
    Final schema for updating product data.
    All fields are optional because they inherit from ProductUpdateBase.
    We override ProductId to ensure it's not expected in the request body.
    """
    # Overwrite ProductId to be excluded for the request body, 
    # as the ID comes from the URL path.
    product_id: Optional[int] = Field(default=None, exclude=True)
class ProductPublic(ProductBase, AutoReadSchema):
    """Schema for data returned to the client, excluding sensitive fields."""
    # Overwrite validation alias for weird case
    model_number_sku: str = Field(..., validation_alias="ModelNumber_SKU")
    package_weight_kg: Optional[float] = Field(..., validation_alias="PackageWeight_KG")
    dimensions_h_cm: Optional[float] = Field(..., validation_alias="Dimensions_H_CM")
    dimensions_w_cm: Optional[float] = Field(..., validation_alias="Dimensions_W_CM")
    dimensions_d_cm: Optional[float] = Field(..., validation_alias="Dimensions_D_CM")
    warranty_period_days: Optional[int] = Field(..., validation_alias="WarrantyPeriod_Days")
    # Exclude sensitive internal data from the final JSON output
    internal_price: Optional[float] = Field(default=None, exclude=True)
    primary_supplier_id: Optional[int] = Field(default=None, exclude=True, validation_alias="PrimarySupplierID")
    safety_stock: Optional[int] = Field(default=None, exclude=True)


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
class ProductPaginationResponse(PaginationMetaData):
    items: list[ProductPublic] = Field(..., description = "List of products in one page")