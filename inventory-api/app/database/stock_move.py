from app.database.base import Base
from typing import Optional
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy import Integer, String, Date, ForeignKey
from datetime import date
from app.database.asset_model import Asset

class StockMove (Base):
  __tablename__ = "StockMove"
  Id: Mapped[int] = mapped_column("Id", Integer, nullable=False, primary_key=True)
  PurchaseOrderItemId: Mapped[int] = mapped_column("PurchaseOrderItemId",Integer, ForeignKey("PurchaseOrderItem.POItemId"), nullable=True)
  GoodsReceiptId: Mapped[int] = mapped_column("GoodsReceiptId", Integer, ForeignKey("GoodsReceipt.ReceiptID"), nullable=True)
  Quantity: Mapped[int] = mapped_column("Quantity",Integer, nullable=False)
  MovementDate: Mapped[date | None] = mapped_column("MovementDate", Date, nullable= True)
  SourceLocationId: Mapped[int] = mapped_column("SourceLocationId",Integer, ForeignKey("Location.Id"), nullable=False)
  DestinationLocationId: Mapped[int] = mapped_column("DestinationLocationId",Integer,ForeignKey("Location.Id"), nullable=False)
  AssetLinks: Mapped[list["AssetStockMove"]] = relationship(back_populates="stock_move")
  SourceLocation = relationship(
        "Location", 
        foreign_keys=[SourceLocationId],
        back_populates="OutgoingStockMoves" # Access all moves LEAVING this location
    )

    # 2. The Destination Relationship
  DestinationLocation = relationship(
      "Location", 
      foreign_keys=[DestinationLocationId],
      back_populates="IncomingStockMoves" # Access all moves ENTERING this location
  )

class Location(Base):
  __tablename__ = "Location"
  Id: Mapped[int] = mapped_column("Id", Integer, nullable=False, primary_key=True)
  Name: Mapped[str] = mapped_column("Name", String, nullable=False)
  Description: Mapped[str | None] = mapped_column("Description", String, nullable=True)
  IncomingStockMoves: Mapped[list["StockMove"]] = relationship(
    "StockMove",
    foreign_keys="[StockMove.DestinationLocationId]",
    back_populates="DestinationLocation")
  OutgoingStockMoves: Mapped[list["StockMove"]] = relationship(
    "StockMove",
    foreign_keys="[StockMove.SourceLocationId]",
    back_populates="SourceLocation")

class AssetStockMove(Base):
  __tablename__ = "StockMove_Asset_Rel"
  
  AssetId: Mapped[int] = mapped_column(ForeignKey("Asset.AssetId"), primary_key=True)
  StockMoveId: Mapped[int] = mapped_column(ForeignKey("StockMove.Id"), primary_key=True)
  
  # Optional: track details specific to this asset during this specific move
  SequenceOrder: Mapped[int | None] = mapped_column(Integer)

  # Relationships back to parents
  asset: Mapped["Asset"] = relationship(back_populates="StockMoveLinks")
  stock_move: Mapped["StockMove"] = relationship(back_populates="AssetLinks")