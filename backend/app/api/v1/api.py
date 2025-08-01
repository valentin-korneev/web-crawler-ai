from fastapi import APIRouter
from app.api.v1.endpoints import contractors, forbidden_words, mcc_codes, scan_results, scan_sessions, users, auth, dashboard

api_router = APIRouter()

@api_router.get("/")
async def api_root():
    return {"message": "Huginn API v1", "version": "1.0.0"}

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(contractors.router, prefix="/contractors", tags=["contractors"])
api_router.include_router(forbidden_words.router, prefix="/forbidden-words", tags=["forbidden-words"])
api_router.include_router(mcc_codes.router, prefix="/mcc-codes", tags=["mcc-codes"])
api_router.include_router(scan_results.router, prefix="/scan-results", tags=["scan-results"])
api_router.include_router(scan_sessions.router, prefix="/scan-sessions", tags=["scan-sessions"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"]) 