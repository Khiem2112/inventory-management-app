from pydantic import BaseModel

class RefreshTokenBase(BaseModel):
  Token: str
class RefreshToken (RefreshTokenBase):
  pass