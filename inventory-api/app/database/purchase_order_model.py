from sqlalchemy.orm import mapped_column, DeclarativeBase, Mapped, relationship
from sqlalchemy import Integer, String, DateTime, DECIMAL, ForeignKey, Column
from sqlalchemy.dialects import mssql
from datetime import datetime
from app.database.supplier_model import Supplier
from app.database.base import Base


class PurchaseOrderItem(Base):
  __tablename__ = "PurchaseOrderItem"
  PurchaseOrderItemId: Mapped[int] = mapped_column(
    "POItemId", Integer, nullable=False, autoincrement=True, primary_key=True
  )
  Quantity: Mapped[int] = mapped_column(
    Integer, nullable=False
  )
  UnitPrice: Mapped[float] = mapped_column(
    "Unit_Price",DECIMAL(10,2), nullable=False
  )
  ItemDescription: Mapped[str] = mapped_column(
    String, nullable=True
  )
  # Relationship
  
  ProductId: Mapped[int] = mapped_column(Integer, ForeignKey("Product.ProductId"), nullable=False)
  Product = relationship("Product", lazy="joined", back_populates="PurchaseOrderItems")
  PurchaseOrderId: Mapped[int] = mapped_column(Integer, ForeignKey("PurchaseOrder.PurchaseOrderId"))
  PurchaseOrder: Mapped["PurchaseOrder"] = relationship("PurchaseOrder", lazy="joined", back_populates="PurchaseOrderItems")
  

class PurchaseOrder(Base):
  __tablename__ = "PurchaseOrder"
  PurchaseOrderId: Mapped[str] = mapped_column(Integer, nullable=False, autoincrement=True, primary_key=True)
  CreateDate: Mapped[datetime] = mapped_column(DateTime, nullable=True)
  TotalPrice: Mapped[float] = mapped_column(DECIMAL(10,2), nullable=True)
  Status: Mapped[str] = mapped_column(String, nullable=False)
  SupplierId: Mapped[int] = mapped_column(Integer,ForeignKey("Supplier.SupplierId"), nullable=False)
  PurchasePlanId: Mapped[int] = mapped_column(Integer, nullable=True)
  CreateUserId: Mapped[int] = mapped_column(Integer, ForeignKey("User.UserId"), nullable= False)
  Supplier = relationship("Supplier", lazy="joined")
  CreateUser = relationship("User", lazy="joined")
  PurchaseOrderItems: Mapped[list["PurchaseOrderItem"]] = relationship("PurchaseOrderItem",
                                                             lazy="joined",
                                                             back_populates="PurchaseOrder")
  