from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped, relationship
from sqlalchemy import Integer, String, DateTime, ForeignKey
from datetime import datetime
class Base (DeclarativeBase):
  pass

class RefreshToken(Base):
  __tablename__ = 'RefreshToken'
  Id : Mapped[int] = mapped_column(Integer, nullable= False, primary_key=True)
  Jti: Mapped[str] = mapped_column(Integer(36), nullable= False, unique= True)
  TokenHash: Mapped[str] = mapped_column(String(255), nullable= False)
  UserId: Mapped[int] = mapped_column(Integer, ForeignKey('User.UserId'), nullable=False)
  ExpiresAt: Mapped[datetime] = mapped_column(DateTime, nullable=False)
  user = relationship("User")