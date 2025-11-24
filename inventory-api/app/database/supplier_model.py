from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer
from app.database.base import Base

class Supplier(Base):
  __tablename__ = 'Supplier'
  SupplierId: Mapped[int] = mapped_column(Integer, nullable=False, autoincrement=True, primary_key=True)
  SupplierName: Mapped[str] = mapped_column(String, nullable=True)
  Phone: Mapped[str] = mapped_column(String, nullable=True)
  Email: Mapped[str] = mapped_column(String, nullable= True)
  Address: Mapped[str] = mapped_column(String, nullable=False)
  ContactPerson: Mapped[str] = mapped_column(String, nullable=True)