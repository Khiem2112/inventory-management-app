from typing import Optional
from datetime import datetime

# Import all necessary components from SQLAlchemy and Python typing
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, BigInteger, DateTime, ForeignKey, text
from app.database.base import Base


class Asset(Base):
    """
    SQLAlchemy ORM class for the 'Asset' table,
    with relationships to Product and ManifestLine.
    """
    __tablename__ = 'Asset'

    # Primary Key (bigint, NOT NULL)
    AssetId: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, nullable=False)

    # SerialNumber (varchar(50), NOT NULL, typically unique)
    SerialNumber: Mapped[str] = mapped_column(String(50), nullable=False)

    # ProductId (int, NOT NULL, Foreign Key to Product)
    ProductId: Mapped[int] = mapped_column(Integer, ForeignKey('Product.ProductId'), nullable=False)

    # CurrentZoneId (int, NOT NULL, Foreign Key to Zone)
    CurrentZoneId: Mapped[int] = mapped_column(Integer, ForeignKey('Zone.ZoneId'), nullable=False)

    # AssetStatus (varchar(20), NOT NULL)
    AssetStatus: Mapped[str] = mapped_column(String(20), nullable=False)

    # LastMovementDate (datetime2, NOT NULL)
    LastMovementDate: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # ShipmentManifestLineId (int, NULL, Foreign Key to ManifestLine)
    ShipmentManifestLineId: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey('ShipmentManifestLine.Id'),
        nullable=True
    )

    # GoodsReceiptId (int, NULL, Foreign Key to GoodsReceipt)
    GoodsReceiptId: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey('GoodsReceipt.ReceiptID'),
        nullable=True
    )

    # ORM Relationship: Many-to-One to Product
    product: Mapped["Product"] = relationship(back_populates="assets")

    # ORM Relationship: Many-to-One to ManifestLine (ShipmentManifestLine)
    shipment_manifest_line: Mapped[Optional["ShipmentManifestLine"]] = relationship(back_populates="assets")

    # ORM Relationship: Many-to-One to Zone
    current_zone: Mapped["Zone"] = relationship(back_populates="assets")


    def __repr__(self):
        return f"<Asset(AssetId={self.AssetId}, SerialNumber='{self.SerialNumber}', Status='{self.AssetStatus}')>"