from typing import Optional, List, Literal, Union
from datetime import datetime, date
from pydantic import Field, BaseModel, model_validator, field_validator
from collections import Counter

# Import your custom base schemas
from app.schemas.base import AutoReadSchema, AutoWriteSchema, StandardResponse

# ==========================================
# 1. SHARED ASSETS & CORE UTILS
# ==========================================

class AssetBase(BaseModel):
    """Base identification for a single physical asset."""
    serial_number: str = Field(..., description="Unique serial number of a product provided by supplier")

class AssetInput(AssetBase):
    """Simple wrapper for asset input."""
    pass

class AssetVerificationInput(BaseModel):
    """Used during Goods Receipt to verify asset acceptance."""
    serial_number: str = Field(..., description="Specific business identify number of an asset")
    isAccepted: bool = Field(...)

# --- Verification Responses ---
class ShipmentLineVerifyResponse(StandardResponse):
    missing_asset_serials: list[str | None] 
    redundant_asset_serials: list[str | None]
    matched_asset_serials: list[str | None]

class AssetUniquenessVerifyResponse(StandardResponse):
    existed_asset_serials: list[str | None]
    new_asset_serials: list[str | None]


# ==========================================
# 2. SHIPMENT MANIFEST (The Header)
# ==========================================

class ShipmentManifestBase(BaseModel):
    """Shared fields for ShipmentManifest."""
    purchase_order_id: Optional[int] = None
    tracking_number: Optional[str] = Field(None, max_length=200)
    carrier_name: Optional[str] = Field(None, max_length=200)
    estimated_arrival: Optional[datetime] = None
    status: Optional[str] = Field(..., max_length=100)

class ShipmentManifestWrite(ShipmentManifestBase, AutoWriteSchema):
    """Schema for WRITING to DB (Create/Update)."""
    pass

class ShipmentManifestRead(ShipmentManifestBase, AutoReadSchema):
    """Schema for READING from DB."""
    id: int
    supplier_id: Optional[int] = Field(default=None)
    created_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# ==========================================
# 3. SHIPMENT LINES (The Items)
# ==========================================

class ShipmentManifestLineBase(BaseModel):
    """Common fields for ShipmentManifestLine."""
    purchase_order_item_id: int = Field(..., description="Direct reference purchase order item")
    supplier_serial_number: Optional[str] = Field(default=None, description="Supplier injected serial number on their shipment line")
    supplier_sku: Optional[str] = Field(default=None, description="Supplier SKU")

# --- Specialized Inputs for Line Creation ---
class ShipmentManifestLineAssetInput(ShipmentManifestLineBase):
    """Input flow: Supplier specifies exact assets."""
    shipment_mode: Literal["asset_specified"] = "asset_specified"
    asset_items: list[AssetInput] = Field(..., description="List of asset items defined by supplier")

    @property
    def quantity(self) -> int:
        return len(self.asset_items)

class ShipmentManifestLineQuantityInput(ShipmentManifestLineBase):
    """Input flow: Supplier just declares a quantity."""
    shipment_mode: Literal["quantity_declared"] = "quantity_declared"
    quantity: int = Field(..., gt=0)

# --- Standard Database Schemas ---
class ShipmentManifestLineWrite(ShipmentManifestLineBase, AutoWriteSchema):
    pass

class ShipmentManifestLineRead(ShipmentManifestLineBase, AutoReadSchema):
    id: int


# ==========================================
# 4. COMPOSITE MANIFEST OPERATIONS
# ==========================================
# These combine Header + Lines for API payloads

class ShipmentManifestCreatePayload(ShipmentManifestWrite):
    """
    MASTER PAYLOAD: Creating a new Shipment Manifest.
    (Renamed from 'ShipmentManifestCreate' to avoid collision with Receipt logic)
    """
    purchase_order_id: int = Field(..., description="Linked PO is required to determine the Supplier")
    lines: List[Union[ShipmentManifestLineAssetInput, ShipmentManifestLineQuantityInput]] = Field(..., description="List of items in this shipment")


# ==========================================
# 5. SEARCH & REPORTING
# ==========================================

class ManifestSearchResultItem(ShipmentManifestRead):
    """Enhanced schema for search results with joined fields."""
    manifest_code: str = Field(..., description="Formatted Manifest ID (e.g., SM-1002)")
    supplier_name: Optional[str] = Field(None, description="Name of the Supplier")
    tracking_number: Optional[str] = Field(None, validation_alias="TrackingNumber")
    status: str = Field(...)
    estimated_arrival: Optional[datetime] = Field(None)
    po_number: Optional[str] = Field(None, description="Formatted PO Number (e.g., PO-123)")
    item_count: int = Field(default=0, description="Total items in this manifest")

class ManifestSearchResponse(BaseModel):
    results: List[ManifestSearchResultItem]

class CountingManifestLineResponse(AutoReadSchema):
    """Detailed line view for receiving screens."""
    id: Optional[int] = Field(default=None, description="Line ID of Shipment Manifest")
    receiving_strategy: Optional[Literal['asset_specified','quantity_declared']] = Field(default=None)
    po_number: Optional[str] = None 
    product_name: Optional[str] = None
    quantity_received: Optional[int] = Field(default=None, description="Count of linked Assets with Status = 'received'")
    quantity_declared: Optional[int] = Field(default=None, description="Quantity supplier wanted to ship")
    quantity_remaining: Optional[int] = Field(default=None, description="= quantity_declared - quantity_received")

class ManifestLinesListResponse(ShipmentManifestBase, StandardResponse):
    """Full response for GET /manifests/{id}/lines"""
    supplier_id: Optional[int] = Field(default=None)
    created_by_user_id: Optional[int] = Field(default=None)
    shipment_manifest_id: Optional[int] = Field(default=None)
    status: Optional[str] = None
    lines: List[CountingManifestLineResponse]
    total_lines: Optional[int] = Field(default=None)


# ==========================================
# 6. GOODS RECEIPT & STOCK MOVEMENT (The Execution)
# ==========================================

class GoodsReceiptBase(BaseModel):
    receipt_number: str = Field(..., max_length=50)
    received_by_user_id: int
    tracking_number: Optional[str] = Field(None, max_length=50)
    shipment_manifest_id: Optional[int] = None 

class GoodsReceiptWrite(GoodsReceiptBase, AutoWriteSchema):
    pass

class GoodsReceiptRead(GoodsReceiptBase, AutoReadSchema):
    receipt_id: int
    received_date: Optional[datetime] = None

# --- Stock Movement / Finalization Logic ---

class StockMoveBase(BaseModel):
    po_item_id: int | None = Field(default=None)
    quantity: int | None = Field(default=None)
    source_location_id: int|None = Field(default=None)
    destination_location_id: int|None = Field(default=None)

class StockMovePublic(StockMoveBase):
    id: int|None = Field(default=None)
    movement_date: date|None = Field(default=None)

class FinalizeManifestItem(BaseModel):
    line_id: int = Field(..., description="ID of the Manifest Line Item being counted")
    qty_actual: int = Field(..., gt=0, description="Actual quantity received and counted")

class FinalizeManifestInput(BaseModel):
    dock_location: str = Field(..., description="Name of the Dock/Zone")
    counts: List[FinalizeManifestItem]

class FinalizeManifestResponse(BaseModel):
    receipt_number: str
    message: str


# ==========================================
# 7. COMPLEX RECEPTION INPUTS (The Polymorphic Inputs)
# ==========================================

# NOTE: These were previously causing confusion/collisions.
# I have renamed them to clear 'Input' names based on their structure.

class PurchaseOrderItemInput(BaseModel):
    """Used when receiving directly against a PO."""
    po_line_id: int | None = Field(default=None)
    received_quantity: int = Field(...)
    asset_items: list[AssetVerificationInput] = Field(...)

class PurchaseOrderReceptionInput(BaseModel):
    """Payload for PO Reception."""
    type: Literal['po']
    po_id: int | None = Field(default=None)
    lines: list[PurchaseOrderItemInput] = Field(...)

class ShipmentLineReceptionInput(BaseModel):
    """Used when receiving against a Shipment Manifest."""
    sm_line_id: int | None = Field(default=None)
    received_quantity: int | None = Field(default=None)
    asset_items: list[AssetVerificationInput] = Field(...)

    @model_validator(mode='after')
    def verify_counts_match(self):
        actual_count = len(self.asset_items)
        if self.received_quantity != actual_count:
            raise ValueError(
                f"Safety Check Failed: Declared {self.received_quantity}, "
                f"but provided {actual_count} asset records."
            )
        return self

class ShipmentReceptionInput(BaseModel):
    """
    Payload for Shipment Manifest Reception.
    (PREVIOUSLY named ShipmentManifestCreate in your code, which was a bug/conflict).
    """
    type: Literal['sm']
    sm_id: int | None = Field(default=None)
    lines: list[ShipmentLineReceptionInput] = Field(..., description="Each line item received")
    
    @field_validator('lines')
    @classmethod
    def check_duplicate_manifest_ids(cls, v: list[ShipmentLineReceptionInput]):
        ids = [item.sm_line_id for item in v]
        if len(ids) != len(set(ids)):
            duplicates = [id for id, count in Counter(ids).items() if count > 1]
            raise ValueError(f"Duplicate manifest_line_id(s) found: {duplicates}")
        return v