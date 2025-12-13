from typing import Optional, List
from datetime import datetime

# Import all necessary components from SQLAlchemy and Python typing
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey, text
from app.database.base import Base

class ShipmentManifest(Base):
    """
    SQLAlchemy ORM class for the 'ShipmentManifest' table.
    Based on Shipment_manifest.csv metadata.
    """
    __tablename__ = 'ShipmentManifest'

    # Id (Primary Key, NOT NULL)
    Id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, nullable=False)

    # SupplierId (NOT NULL, Foreign Key to Supplier)
    SupplierId: Mapped[int] = mapped_column(Integer, ForeignKey('Supplier.SupplierId'), nullable=False)

    # PurchaseOrderId (Nullable, Foreign Key to PurchaseOrder)
    PurchaseOrderId: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('PurchaseOrder.PurchaseOrderId'), nullable=True)

    # TrackingNumber (Nullable, nvarchar(200))
    TrackingNumber: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # CarrierName (Nullable, nvarchar(200))
    CarrierName: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # EstimatedArrival (Nullable, datetime2)
    EstimatedArrival: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Status (NOT NULL, nvarchar(100))
    Status: Mapped[str] = mapped_column(String(100), nullable=False)

    # CreatedByUserId (Nullable, Foreign Key to User)
    CreatedByUserId: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('User.UserId'), nullable=True)

    # CreatedAt (NOT NULL, datetime2, default timestamp)
    CreatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # UpdatedAt (Nullable, datetime2, on update timestamp)
    UpdatedAt: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=datetime.utcnow, nullable=True)

    # ORM Relationship: One-to-Many to ManifestLine
    manifest_lines: Mapped[List["ShipmentManifestLine"]] = relationship(
        back_populates="shipment_manifest",
        cascade="all, delete-orphan" # Common for parent/child relationships
    )
    
    # ORM Relationship: One-to-One (1:1) to GoodsReceipt
    # The ForeignKey lives on the GoodsReceipt table, but we define the relationship here.
    goods_receipt: Mapped[Optional["GoodsReceipt"]] = relationship(
        back_populates="shipment_manifest",
        uselist=False, # Set to False for 1:1 relationship
        # If the key name is different from the target primary key name:
        # primaryjoin="ShipmentManifest.Id == GoodsReceipt.ShipmentManifestId"
    )

    # ORM Relationship: Many-to-One (n:1) to PurchaseOrder
    # Many manifests can belong to one Purchase Order
    purchase_order: Mapped[Optional["PurchaseOrder"]] = relationship(
        back_populates="shipment_manifests" # Assuming you add this property to the PurchaseOrder model
    )

class ShipmentManifestLine(Base):
    """
    SQLAlchemy ORM class for the 'ManifestLine' table.
    Based on manifest_line.csv metadata.
    """
    __tablename__ = 'ShipmentManifestLine'

    # Id (Primary Key, NOT NULL)
    Id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, nullable=False)

    # ShipmentManifestId (NOT NULL, Foreign Key to ShipmentManifest)
    ShipmentManifestId: Mapped[int] = mapped_column(
        Integer,
        ForeignKey('ShipmentManifest.Id'),
        nullable=False
    )

    # SupplierSerialNumber (Nullable, nvarchar(200))
    SupplierSerialNumber: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # SupplierSku (Nullable, nvarchar(200))
    SupplierSku: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # QuantityDeclared (NOT NULL, int)
    QuantityDeclared: Mapped[int] = mapped_column(Integer, nullable=False)

    # ORM Relationship: Many-to-One to ShipmentManifest
    shipment_manifest: Mapped["ShipmentManifest"] = relationship(
        back_populates="manifest_lines"
    )
    assets: Mapped[list["Asset"]]  = relationship(
        back_populates="shipment_manifest_line"
    )