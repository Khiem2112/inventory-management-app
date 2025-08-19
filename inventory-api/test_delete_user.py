from app.database.connection import engine
from sqlalchemy.orm import Session
from app.database.DBModel import User as UserORM
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
with Session(engine) as session:
  user = session.query(UserORM).filter(UserORM.UserId == 3).one_or_none()
  print('We found a user named: ', '\n')
  print(user)
  session.delete(user)
  session.commit()
  session.refresh(user)
print(user)

  