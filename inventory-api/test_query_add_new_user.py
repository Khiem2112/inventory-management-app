from app.database.connection import engine
from sqlalchemy.orm import Session
from app.database.DBModel import User as UserORM
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
with Session(engine) as session:
  query = session.query(UserORM).filter(UserORM.UserId == 1)
  new_username = "testuser_db24421"
  new_password = "testpassword123"
  
  # 1. Prepare a new user object
  # We must hash the password first
  hashed_password = pwd_context.hash(new_password)
  
  # Create the ORM object
  new_user = UserORM(
      Username=new_username,
      PasswordHash=hashed_password,
      Name="Tefewk",
      Phone="555-555-5555",
      RoleId=1,
  )
  
  # 2. Save the user to the database
  # session.add(new_user)
  # session.commit()
  
  # 3. Verify the user was saved and can be retrieved
  # We query the database for the user we just added
  saved_user = session.query(UserORM).filter(UserORM.Username == new_username).one_or_none()

  query = session.query(UserORM).filter(UserORM.Username == '332')
  user = query.one_or_none()
print(user)

  