# app/database/models.py (Corrected version)

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column# Keep these
from sqlalchemy import String, Integer, DateTime, CheckConstraint, text # Import DateTime and text
from datetime import datetime
from typing import Optional, List # Keep Optional for nullable fields

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = 'User'

    # UserId: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # Corrected: Explicitly add Integer type and nullable=False (though primary_key implies it).
    UserId: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, nullable=False)

    # Username: Mapped[str] = mapped_column(String(255), nullable=False)
    # Corrected: Add unique=True as usernames are typically unique and your previous schema implied it.
    Username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    # PasswordHash: Mapped[str] = mapped_column(String(255), nullable=False)
    # This line is correct as is, assuming PasswordHash is nvarchar(255) NOT NULL
    PasswordHash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # This line is correct as is, matching nvarchar(255) NULL
    Name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Phone: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # This line is correct as is, matching nvarchar(255) NULL
    Phone: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # RoleId: Mapped[int] = mapped_column(Integer(66346), nullable= False)
    # Corrected: `Integer` type does not take an argument like `Integer(66346)`.
    #            It's just `Integer`.
    RoleId: Mapped[int] = mapped_column(Integer, nullable=False)

    # CreateDate: Mapped[datetime] = mapped_column()
    # Corrected: Need to specify DateTime type and add nullable=False, plus a default.
    #            Using server_default=text("GETDATE()") is best if your DB has a default.
    CreateDate: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    # OR if your SQL Server has a DEFAULT GETDATE() constraint:
    # CreateDate: Mapped[datetime] = mapped_column(DateTime, server_default=text("GETDATE()"), nullable=False)


    # Constraints
    __table_args__ = (
        CheckConstraint(
            # sqltext= "'RoleId' <100", # <-- Incorrect. Use actual SQL column name and text()
            text('"RoleId" < 100'), # Correct: Use text() and the exact SQL column name "RoleId"
            name = 'RoleId_range'
        ),
        # You can add other CheckConstraints here if needed for other columns
    )

    # Optional: For better debugging and representation
    def __repr__(self):
        return f"<User(UserId={self.UserId}, Username='{self.Username}')>"
