from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey
from datetime import datetime
import uuid
from app.database.base import Base

class ProductQuarantine(Base):
  __tablename__ = "ProductQuarantine"

  # Primary Key matching your PascalCase style
  Id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  
  # job_id groups all rows from a single CSV upload session
  JobId: Mapped[str] = mapped_column(String(36), default=lambda: str(uuid.uuid4()), nullable=False)
  
  # Stores the CSV row as a dictionary
  ImportedRawData: Mapped[dict] = mapped_column(JSON, nullable=False)
  
  # Links to Product.ProductId
  ConflictingProductId: Mapped[int] = mapped_column(Integer, ForeignKey("Product.ProductId"), nullable=True)
  
  # Status tracks the workflow: 'pending', 'overwritten', 'skipped'
  Status: Mapped[str] = mapped_column(String(50), default="pending")
  
  CreatedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

  # Relationship for side-by-side comparison logic
  ConflictingProduct: Mapped["Product"] = relationship("Product")