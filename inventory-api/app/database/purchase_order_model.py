from sqlalchemy.orm import mapped_column, DeclarativeBase, Mapped
from sqlalchemy import Integer, String, DateTime, DECIMAL
from datetime import datetime

class Base(DeclarativeBase):
  pass

class PurchaseOrder(Base):
  __tablename__ = "PurchaseOrder"
  PurchaseOrderId: Mapped[str] = mapped_column(Integer, nullable=False, autoincrement=True, primary_key=True)
  CreateDate: Mapped[datetime] = mapped_column(DateTime, nullable=True)
  TotalPrice: Mapped[float] = mapped_column(DECIMAL(10,2), nullable=True)
  Status: Mapped[str] = mapped_column(String, nullable=False)
  SupplierId: Mapped[int] = mapped_column(Integer, nullable=False)
  PurchasePlanId: Mapped[int] = mapped_column(Integer, nullable=True)
  CreateUserId: Mapped[int] = mapped_column(Integer, nullable= False) 