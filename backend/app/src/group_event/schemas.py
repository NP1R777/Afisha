from pydantic import BaseModel

class GroupEventIn(BaseModel):
    name: str
    description: str
