from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class ZoneBase (BaseModel):
  ZoneId: Optional[int] = Field(default=None, description="Zone ID")
  ZoneName: Optional[str] = Field(default=None, description="Name of Zone")
  Description: Optional[str] = Field(default=None, description="Description for what that zone's responsibility")
  IsStockable: bool = Field(default=True, description="1 for stockable, 0 for non-stockable")
  IsSecurityCage: bool = Field(default=True, description="To show if that zone mostly support for high-value product")
  ZoneType: str = Field (...,description="Type of Zone, including: Receiving, Storage and Quarantine area")
  ZoneImageUrl :Optional[str] = Field(..., description="Image url for warehouse zone stored in cloudinary")
  
class ZoneUpdate (ZoneBase):
  pass
class ZonePublic (ZoneBase):
  ZoneId: int
  model_config = ConfigDict(from_attributes=True)
  pass
