from sqlalchemy.orm import mapped_column, DeclarativeBase, Mapped, relationship
from sqlalchemy import Integer, String, DateTime, DECIMAL, ForeignKey
from datetime import datetime
from app.database.supplier_model import Supplier
from app.database.base import Base

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