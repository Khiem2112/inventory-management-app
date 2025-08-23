from fastapi import FastAPI, APIRouter, Depends, HTTPException
import urllib
from app.core.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.schemas.user import UserPublic
from typing import List
from app.database.user_model import User as UserORM
import sqlalchemy
from app.routers.auth import auth, users
from app.routers.product import products
from fastapi.middleware.cors	import CORSMiddleware


app = FastAPI()
router = APIRouter()
# Set up connection to local database
# --- Your Existing Database Connection Setup ---
server = '172.17.48.1,57931' # 172.17.48.1 is the IP. 57931 is the port
database = 'Inventory'
username = 'wsl_user'
password = 'haidang2015'


params = urllib.parse.quote_plus(
	"DRIVER={ODBC Driver 18 for SQL Server};"
	f"SERVER={server};"
	f"DATABASE={database};"
	f"UID={username};"
	f"PWD={password};"
	"TrustServerCertificate=yes;"
)
engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

# Exclude the FE client from firewall block
origins = [
    "http://localhost:5173", # Allow your front-end's origin
    "http://127.0.0.1:5173",
    "http://localhost:5174"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers for fetch all user API

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)

# users = get_all_users()
# print(users)
