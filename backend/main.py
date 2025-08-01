from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.logging import logger
from app.api.v1.api import api_router


security = HTTPBearer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await logger.info('Starting Huginn API application')
    try:
        await init_db()
        await logger.info('Database initialized successfully')
    except Exception as e:
        await logger.error(f'Failed to initialize database: {e}')
        raise
    
    yield

    await logger.info('Shutting down Huginn API application')
    try:
        await close_db()
        await logger.info('Database connections closed')
    except Exception as e:
        await logger.error(f'Error closing database connections: {e}')

app = FastAPI(
    title='Huginn API',
    description='API для проверки контрагентов банка',
    version='1.0.0',
    lifespan=lifespan,
    debug=settings.debug
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:3000', 
        'http://frontend:3000',
        'http://localhost',
        'http://huginn.by',
        'https://huginn.by',
        'https://localhost',
        'https://localhost:443'
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Include API router
app.include_router(api_router, prefix='/api/v1')

@app.get('/')
async def root():
    await logger.info('Root endpoint accessed')
    return {'message': 'Huginn API is running'}


@app.get('/health')
async def health_check():
    await logger.debug('Health check endpoint accessed')
    return {'status': 'healthy'}
