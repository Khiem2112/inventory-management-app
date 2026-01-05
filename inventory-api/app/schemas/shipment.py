from typing import Optional, List, Literal, Union
from datetime import datetime
from pydantic import Field, BaseModel

# Import the custom base schemas for auto-conversion
from app.schemas.base import AutoReadSchema, AutoWriteSchema, StandardResponse
class ShipmentManifestBase(BaseModel):
    """Common fields for ShipmentManifest model."""
    purchase_order_id: Optional[int] = None
    tracking_number: Optional[str] = Field(None, max_length=200)
    carrier_name: Optional[str] = Field(None, max_length=200)
    estimated_arrival: Optional[datetime] = None
    status: Optional[str] = Field(..., max_length=100)

# (2) INPUT/WRITE: Inherits Base fields and AutoWriteSchema for ORM conversion
class ShipmentManifestWrite(ShipmentManifestBase, AutoWriteSchema):
    """Schema for creating or updating a ShipmentManifest (input)."""
    pass

# (3) OUTPUT/READ: Inherits Base fields and AutoReadSchema, plus read-only fields
class ShipmentManifestRead(ShipmentManifestBase, AutoReadSchema):
    """Schema for reading a ShipmentManifest (response)."""
    id: int # Primary Key
    supplier_id: Optional[int] = Field(default=None) # Only showing Shipment manifest read supplier id
    created_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
# Search Schema Result
class ManifestSearchResultItem(ShipmentManifestRead):
    """
    Enhanced schema for search results.
    Inherits standard fields (id, status, dates) and adds joined/derived info.
    """
    # Override/Add fields for the specific search response format
    manifest_code: str = Field(..., description="Formatted Manifest ID (e.g., SM-1002)")
    supplier_name: Optional[str] = Field(None, description="Name of the Supplier")
    tracking_number: Optional[str] = Field(None, validation_alias="TrackingNumber")
    status: str = Field(...)
    estimated_arrival: Optional[datetime] = Field(None)
    po_number: Optional[str] = Field(None, description="Formatted PO Number (e.g., PO-123)")
    item_count: int = Field(default=0, description="Total items in this manifest")

class ManifestSearchResponse(BaseModel):
    """
    Wrapper for the search results array as per the API design.
    """
    results: List[ManifestSearchResultItem]
# --- 2. ShipmentManifestLine Schemas ---

class AssetBase(BaseModel):
    serial_number: str = Field(..., description=" Unique serial number of a product provide by supplier")

class AssetInput(AssetBase):
    pass
class ShipmentLineVerifyResponse(StandardResponse):
    missing_asset_serials: list[str] 
    redundant_asset_serials: list[str]
    matched_asset_serials: list[str]

class ShipmentManifestLineBase(BaseModel):
    """Common fields for ShipmentManifestLine model."""
    purchase_order_item_id: int = Field(...,desciption = "Direct reference purchase order item")
    supplier_serial_number: Optional[str] = Field(default=None, description="Supplier injected supplier serial number on their shipment line")
    supplier_sku: Optional[str] = Field(default = None, description="Supplier SKU")
    
class ShipmentManifestLineAssetInput(ShipmentManifestLineBase):
    """Shipment manifest line model for Asset input flow."""
    shipment_mode: Literal["asset_specified"] = "asset_specified"
    asset_items: list[AssetInput] = Field(..., description = "List of asset items defined by supplier")
    @property
    def quantity(
        self
    ) -> int:
        return len(self.asset_items)
    
class ShipmentManifestLineQuantityInput(ShipmentManifestLineBase):
    """Shipment manifest line model for Quantity input flow."""
    shipment_mode: Literal["quantity_declared"] = "quantity_declared"
    quantity: int = Field(..., gt=0)

# (2) INPUT/WRITE: Inherits Base fields and AutoWriteSchema
class ShipmentManifestLineWrite(ShipmentManifestLineBase, AutoWriteSchema):
    """Schema for creating or updating a ShipmentManifestLine (input)."""
    pass

# (3) OUTPUT/READ: Inherits Base fields and AutoReadSchema, plus read-only fields
class ShipmentManifestLineRead(ShipmentManifestLineBase, AutoReadSchema):
    """Schema for reading a ShipmentManifestLine (response)."""
    id: int
    

class ShipmentManifestInput(ShipmentManifestWrite):
    """
    Master payload for creating a Shipment Manifest.
    Includes the header fields and a list of lines.
    """
    purchase_order_id: int = Field(..., description="Linked PO is required to determine the Supplier")
    lines: List[Union[ ShipmentManifestLineAssetInput, ShipmentManifestLineQuantityInput ]] = Field(..., description="List of items in this shipment")

class CountingManifestLineResponse(AutoReadSchema):
    """
    Schema for a single line item in the Manifest Details response.
    Inherits fields like supplier_sku directly.
    Aliases fields line_id and qty_shipped to adhere to the base contract.
    """
    id: Optional[int] = Field(default=None, description= "Line ID of Shipment Manifest")
    # 1. Alias fields to match the specific API contract output names (keeping line_id and qty_shipped)
    # 2. Add calculated/derived fields
    po_number: Optional[str] = None 
    product_name: Optional[str] = None
    quantity_received: Optional[int] = Field(default=None, description="Count of linked Assets with Status = 'received'")
    quantity_declared: Optional[int] = Field(default= None, description= "Quantity that supplier want to ship on that SHipment Line")
    quantity_remaining: Optional[int] = Field(default = None, description="= quantity_declared - quantity_received")
    
class ManifestLinesListResponse(ShipmentManifestBase, StandardResponse):
    """
    The full response body for GET /manifests/{manifest_id}/lines.
    """
    supplier_id:Optional[int] = Field(default=None, description="Supplier who created te Manifest")
    created_by_user_id: Optional[int] = Field(default=None, description = "User ID who created the manifest")
    
    shipment_manifest_id: Optional[int] = Field(default=None)
    status: Optional[str] = None
    lines: List[CountingManifestLineResponse] # Leveraging the existing Read schema
    total_lines: Optional[int] = Field(default=None)


# --- 3. GoodsReceipt Schemas ---

# (1) BASE: All common fields, used for inheritance
class GoodsReceiptBase(BaseModel):
    """Common fields for GoodsReceipt model."""
    receipt_number: str = Field(..., max_length=50)
    received_by_user_id: int
    tracking_number: Optional[str] = Field(None, max_length=50)
    shipment_manifest_id: Optional[int] = None # FK for the 1:1 relationship

# (2) INPUT/WRITE: Inherits Base fields and AutoWriteSchema
class GoodsReceiptWrite(GoodsReceiptBase, AutoWriteSchema):
    """Schema for creating or updating a GoodsReceipt (input)."""
    pass

# (3) OUTPUT/READ: Inherits Base fields and AutoReadSchema, plus read-only fields
class GoodsReceiptRead(GoodsReceiptBase, AutoReadSchema):
    """Schema for reading a GoodsReceipt (response)."""
    receipt_id: int # Primary Key 'ReceiptId' maps to 'receipt_id'
    received_date: Optional[datetime] = None
    
class FinalizeManifestItem(BaseModel):
    line_id: int = Field(..., description="ID of the Manifest Line Item being counted")
    qty_actual: int = Field(..., gt=0, description="Actual quantity received and counted")

class FinalizeManifestInput(BaseModel):
    dock_location: str = Field(..., description="Name of the Dock/Zone where goods are received (e.g., 'Dock-04')")
    counts: List[FinalizeManifestItem]

class FinalizeManifestResponse(BaseModel):
    receipt_number: str
    message: str