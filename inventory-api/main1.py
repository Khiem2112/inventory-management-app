from fastapi import FastAPI, APIRouter

app = FastAPI()
router = APIRouter()

# test API
@router.get('/number')
def get_numbers():
    return list(range(1,11,1))

app.include_router(router)
