from fastapi import APIRouter

from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.alerts import router as alerts_router
from app.api.v1.endpoints.changes import router as changes_router
from app.api.v1.endpoints.embed import router as embed_router
from app.api.v1.endpoints.public import router as public_router

api_router = APIRouter()
api_router.include_router(public_router)
api_router.include_router(changes_router)
api_router.include_router(embed_router)
api_router.include_router(alerts_router)
api_router.include_router(admin_router)
