from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from datetime import datetime, date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.pagination import PaginationMetaData
from app.schemas.supplier import SupplierPublic
from app.schemas.user import UserPublic
from app.schemas.base import AutoReadSchema, AutoWriteSchema, StandardResponse

# --- 1. SHARED BASE MODELS (Data Only - NO IDs) ---

class PurchaseOrderBase(BaseModel):
    status: Optional[str] = Field(default=None)
    supplier_id: Optional[int] = Field(default=None)
    purchase_plan_id: Optional[int] = Field(default=None)
    create_user_id: Optional[int] = Field(default=None)
    total_price: Optional[Decimal] = Field(default=None)
    
    model_config = ConfigDict(populate_by_name=True)

class PurchaseOrderItemBase(BaseModel):
    # REMOVED IDs from here so Input schema doesn't require them
    product_id: int = Field(..., description="The correspoding product id")
    quantity: int = Field(..., description="Quantity")
    unit_price: float = Field(..., description="Unit Price we buy from supplier")
    item_description: Optional[str] = Field(default=None, description="Special note for purchase order item")
    
    model_config = ConfigDict(populate_by_name=True)

# --- 2. INPUT SCHEMAS (Requests) ---

class PurchaseOrderCreate(PurchaseOrderBase):
    """Legacy/Simple Create"""
    create_date: Optional[datetime] = Field(default=None, validation_alias="CreateDate")

class PurchaseOrderItemCreate(PurchaseOrderItemBase, AutoReadSchema):
    """Schema for items in the input payload. Inherits data fields, no IDs required."""
    pass

class PurchaseOrderInput(AutoWriteSchema):
    """
    The Master Payload for Creating or Updating a PO.
    """
    supplier_id: int = Field(..., description="Vendor ID")
    is_draft: bool = Field(..., description="True = Save as Draft, False = Confirm & Send")
    purchase_plan_id: Optional[int] = Field(default=None)
    
    # This List determines the Swagger Request Body
    items: List[PurchaseOrderItemCreate] = Field(default=[], description="List of items to save")

    model_config = ConfigDict(populate_by_name=True)

# --- 3. OUTPUT SCHEMAS (Responses) ---

class PurchaseOrderRead(PurchaseOrderBase, AutoReadSchema):
    purchase_order_id: int = Field(..., validation_alias="PurchaseOrderId")
    create_date: Optional[datetime] = Field(..., validation_alias="CreateDate")
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class PurchaseOrderPublic(PurchaseOrderBase, AutoReadSchema):
    purchase_order_id: int = Field(..., validation_alias="PurchaseOrderId")
    supplier_name: Optional[str] = Field(default=None, validation_alias='SupplierName')
    create_date: Optional[date|datetime] = Field(default=None, validation_alias="CreateDate")
    create_user_name: Optional[str] = Field(default=None, validation_alias='CreateUserName')
    model_config = ConfigDict(populate_by_name=True, extra='ignore')

class PurchaseOrderItemPublic(PurchaseOrderItemBase, AutoReadSchema):
    # IDs are added HERE for the response only
    purchase_order_item_id: int = Field(..., description="ID of the item")
    purchase_order_id: int = Field(..., description="The parent purchase order id", validation_alias="PurchaseOrderId")
    product_name: Optional[str] = Field(default=None, validation_alias="Product.ProductName")

# --- 4. METADATA ---

class PurchaseOrderMetaDataItem(BaseModel):
    id: int = Field(..., description="ID of related fields")
    label: int = Field(..., description= "Name of meta data instance")

class PurchaseOrderMetaData(BaseModel):
    supplier_types: list

class PurchaseOrderResponse(PaginationMetaData):
    items: list[PurchaseOrderPublic] | None = Field(..., description="List of purchase orders user fetch in a single page")
    suppliers: Optional[list[SupplierPublic]] | None= Field(default=None, description="List of unique suppliers")
    users: Optional[list[UserPublic]] | None= Field(default=None, description="List of unique users", )
    statuses: list | None = Field(default=None, description="List of unique statuses")

class PurchaseOrderItemsResponse(BaseModel):
    header: PurchaseOrderPublic = Field(..., description="General data of a purchase order")
    items: list[PurchaseOrderItemPublic] = Field(..., description="Items inside a purchase order")
class PurchaseOrderApproveResponse(StandardResponse, PurchaseOrderPublic):
    pass