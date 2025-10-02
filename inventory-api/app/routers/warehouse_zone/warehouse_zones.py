from fastapi import APIRouter, status, HTTPException,Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError 
from app.database.warehouse_zone_model import Zone as ZoneORM
from app.schemas.warehouse_zone import ZoneBase, ZoneUpdate, ZonePublic
from app.database.user_model import User as UserORM
from typing import List


# Dependencies
from app.utils.dependencies import get_current_user
from app.database.connection import get_db

# Logginf
from app.utils.logger import setup_logger



# Declare 

router = APIRouter(prefix="/warehouse_zones",
                   tags=["warehouse_zones"])
logger = setup_logger()

# Get API
@router.get(path='/all/', 
            response_model= List[ZonePublic],
            status_code=status.HTTP_200_OK, 
            description="Get all warehouse zones in database")
def get_zones_all(db: Session = Depends(get_db),
              current_user: UserORM = Depends(get_current_user)):
  # Query from database
  try:
    query = db.query(ZoneORM)
    logger.info(f'query: {query}')
    zones = query.all()
    return zones
  except SQLAlchemyError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error in database: {e}")
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error {e}")
  
  