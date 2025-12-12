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
from app.routers.warehouse_zone import warehouse_zones
from app.routers.purchase_order import purchase_order
from app.routers.supplier import supplier
from app.routers.good_receipt import good_receipt
from fastapi.middleware.cors	import CORSMiddleware
import os
from app.utils.logger import setup_logger
app = FastAPI()
router = APIRouter()
logger = setup_logger()

IS_PRODUCTION = os.environ.get('K_SERVICE') is not None
production_status = 'on' if IS_PRODUCTION else 'off'

logger.info(f'Start application with PRODUCTION MODE: {production_status}')


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
app.include_router(warehouse_zones.router)
app.include_router(purchase_order.router)
app.include_router(supplier.router)
app.include_router(good_receipt.router)

# users = get_all_users()
# print(users)
