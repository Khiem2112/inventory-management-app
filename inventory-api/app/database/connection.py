from sqlalchemy import create_engine
# from app.core.config import settings
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import select
from app.core.config import settings
# Define database models
# app/database/models.py (Corrected version)

# from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column# Keep these
# from sqlalchemy import String, Integer, DateTime, CheckConstraint, text # Import DateTime and text
# from datetime import datetime
# from typing import Optional, List # Keep Optional for nullable fields
# from DBModel import User
import urllib
# from app.core.config import settings

# Server details
server = f'{settings.DATABASE_HOSTNAME},{settings.DATABASE_PORT}'
database = settings.DATABASE_NAME
username = settings.DATABASE_USERNAME
password = settings.DATABASE_PASSWORD

# Build the connection string.
params = urllib.parse.quote_plus(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    f"SERVER={server};"
    f"DATABASE={database};"
    f"UID={username};"
    f"PWD={password};"
    "TrustServerCertificate=yes;"
)

url = f"mssql+pyodbc:///?odbc_connect={params}"
engine = create_engine(
	# url = settings.DATABASE_URL,
	url = url,
	echo = False    
)

def get_db():
  with Session(engine) as session:
    try:
      yield session
    finally:
      session.close()
	
