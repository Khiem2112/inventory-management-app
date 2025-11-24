from pydantic import BaseModel, Field, ConfigDict


class SupplierBase(BaseModel):
  supplier_id: int = Field(..., validation_alias='SupplierId')
  name: str = Field(..., validation_alias='SupplierName')
  phone: str = Field(..., validation_alias='Phone')
  email: str = Field(..., validation_alias='Email')
  address: str = Field(..., validation_alias='Address')
  contact_person: str = Field(..., validation_alias='ContactPerson')

