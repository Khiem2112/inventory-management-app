from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped, relationship
from sqlalchemy import String, Integer, Boolean, Enum
from typing import Optional
from enum import Enum as PyEnum
from app.database.base import Base


class ZoneType(PyEnum):
  Receiving = "Receiving"
  Storage = "Storage"
  Quarantine = "Quarantine"
  Shipping = "Shipping"
  
class Zone(Base):
  __tablename__ = "Zone"
  ZoneId: Mapped[int] = mapped_column(Integer, nullable=False, autoincrement=True, primary_key=True)
  ZoneName: Mapped[str] = mapped_column(String(50), nullable= False)
  Description: Mapped[str] = mapped_column(String(255), nullable= True)
  IsStockable: Mapped[bool] = mapped_column(Boolean, nullable= False, default=True)
  IsSecurityCage: Mapped[bool] = mapped_column(Boolean, nullable= False, default=True)
  ZoneType: Mapped[str] = mapped_column(Enum(ZoneType), default=ZoneType.Storage)
  ZoneImageUrl: Mapped[str] = mapped_column(String, nullable=True)
  
  # ORM relationship: 1:N with Asset
  assets: Mapped[list["Asset"]] = relationship(
    back_populates="current_zone"
  )

  
