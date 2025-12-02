from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
import urllib
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.schemas.user import UserPublic, UserCreate, UserUpdate
from typing import List
from app.database.user_model import User as UserORM
import sqlalchemy
from app.database.connection import get_db
from passlib.context import CryptContext
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from app.utils.dependencies import get_current_user

router = APIRouter(
	prefix= '/users',
	tags =['users']
)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
@router.get("/", response_model=List[UserPublic])
def get_all_users(db: Session = Depends(get_db)):
	try:
		users = db.query(UserORM).all()
		return users
	except sqlalchemy.exc.SQLAlchemyError as e:
				raise HTTPException(status_code=500, detail=f"Database error: {e}")
	except Exception as e:
			raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
 
@router.get("/{user_id}", response_model = UserPublic)
def get_single_user (user_id:int, db:Session = Depends(get_db)):
	try:
		user = db.query(UserORM).filter(UserORM.UserId == user_id)
		return user.one_or_none()
	except sqlalchemy.exc.SQLAlchemyError as e:
			raise HTTPException(status_code=500, detail=f"Database error: {e}")
	except Exception as e:
			raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
 
@router.patch("/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def create_user (user_data: UserCreate, 
                 current_user: UserORM = Depends(get_current_user),
                 db:Session = Depends(get_db)):
	try:
		# Check if the username exists
		query = db.query(UserORM).filter(UserORM.Username == user_data.username)
		found_user = query.one_or_none()
		if found_user:
			raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
		input_hashed_password = pwd_context.hash(user_data.password)
		new_user = UserORM(
            Username=user_data.username,
            PasswordHash=input_hashed_password,
            Name=user_data.name,
            Phone=user_data.phone,
            RoleId=user_data.role_id,
        )
		db.add(new_user)
		db.commit()
		db.refresh(new_user)
	except IntegrityError as e:
		db.rollback() # Rollback on error
		# Catch the specific error for a duplicate username
		raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Username already registered."
		)
	except sqlalchemy.exc.SQLAlchemyError as e:
		db.rollback()
		raise HTTPException(status_code=500, detail=f"Database error: {e}")
	except Exception as e:
		db.rollback()
		raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
	return new_user	

@router.patch("/{user_id}", response_model=UserPublic)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
  try:
    # 1. Get ORM Object
    user_orm = db.query(UserORM).filter(UserORM.UserId == user_id).first()
    if not user_orm:
      raise HTTPException(status_code=404, detail="User not found")

    # 2. THE INTERMEDIATE LAYER IN ACTION
    # The schema converts itself and updates the ORM object
    user_orm = user_update.apply_to_orm(user_orm, pwd_context=pwd_context)

    # 3. Save
    db.commit()
    db.refresh(user_orm)
    
    # 4. Return (FastAPI uses AutoReadSchema to convert Pascal -> Snake for JSON)
    return user_orm
  except sqlalchemy.exc.SQLalchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"Database error: {e}")
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
	user_id: int,
	db: Session = Depends(get_db)
):
  try:
    # Find that user
    user = db.query(UserORM).filter(UserORM.UserId == user_id).one_or_none()
    db.delete(user)
    db.commit()    
  except sqlalchemy.exc.SQLAlchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail =f'Database error {e}')
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail = f'Unexpected error {e}')
  
@router.get('/me/', response_model=UserPublic, status_code=status.HTTP_200_OK)
def get_me(current_user: UserORM= Depends(get_current_user)):
  try: 
    if not current_user:
      raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated')
    return current_user
  except HTTPException as e:
    raise e
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = "Unexpected Error")