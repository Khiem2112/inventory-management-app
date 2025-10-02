from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped
from sqlalchemy import String, Integer, Boolean, Enum
from typing import Optional
from enum import Enum as PyEnum


class ZoneType(PyEnum):
  Receiving = "Receiving"
  Storage = "Storage"
  Quarantine = "Quarantine"
  

# Declare the base
class Base(DeclarativeBase):
  pass

class Zone(Base):
  __tablename__ = "Zone"
  ZoneId: Mapped[int] = mapped_column(Integer, nullable=False, autoincrement=True, primary_key=True)
  ZoneName: Mapped[str] = mapped_column(String(50), nullable= False)
  Description: Mapped[str] = mapped_column(String(255), nullable= True)
  IsStockable: Mapped[bytes] = mapped_column(Boolean, nullable= False, default=True)
  IsSecurityCage: Mapped[bytes] = mapped_column(Boolean, nullable= False, default=True)
  ZoneType: Mapped[ZoneType] = mapped_column(Enum(ZoneType), default=ZoneType.Storage)
  ZoneImageUrl: Mapped[str] = mapped_column(String, nullable=True)

  
