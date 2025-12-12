from typing import Optional
from datetime import datetime

# Import all necessary components from SQLAlchemy and Python typing
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey, text
from app.database.base import Base
from app.database.shipment_manifest_model import ShipmentManifest

class GoodsReceipt(Base):
  """
  SQLAlchemy ORM class for the 'GoodsReceipt' table,
  using Mapped and mapped_column (SQLAlchemy 2.0 style).
  """
  __tablename__ = 'GoodsReceipt' # Changed to PascalCase to align with User/RefreshToken tables

  # Primary Key - Following the style of User.UserId
  ReceiptId: Mapped[int] = mapped_column("ReceiptID",Integer, primary_key=True, autoincrement=True, nullable=False)

  # Unique receipt identifier - Following the style of User.Username
  ReceiptNumber: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

  # Date and time the goods were received - Following the style of User.CreateDate
  ReceivedDate: Mapped[datetime] = mapped_column(
      DateTime,
      default=datetime.utcnow,
      nullable=True
  )

  # User who received the goods - Foreign Key to the User table
  ReceivedByUserId: Mapped[int] = mapped_column(
      "ReceivedByUserID",
      Integer,
      ForeignKey('User.UserId'), # References the 'User' class in user_model.py
      nullable=False # Assuming the user who received it is always recorded
  )

  # Details about the shipment (Optional fields use Mapped[Optional[str]])
  TrackingNumber: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
  ShipmentManifestId: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey('ShipmentManifest.Id'),
        unique=True, # Critical for 1:1 relationship
        nullable=True # Assuming a Goods Receipt might be created without a manifest initially
    )

  # ORM Relationship: One-to-One to ShipmentManifest (The "Many" side is in ShipmentManifest)
  shipment_manifest: Mapped["ShipmentManifest"] = relationship(
      back_populates="goods_receipt",
      uselist=False # Set to False for 1:1 relationship
  )

  received_by_user: Mapped["User"] = relationship(back_populates="goods_receipts_received")

  def __repr__(self):
      return f"<GoodsReceipt(ReceiptID={self.ReceiptID}, ReceiptNumber='{self.ReceiptNumber}')>"