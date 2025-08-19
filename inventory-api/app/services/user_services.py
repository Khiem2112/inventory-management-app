from sqlalchemy.orm import Session
from typing import List
from app.database.DBModel import User
def get_all_users(db:Session) -> List[User]:
  return  db.query(User).all()

