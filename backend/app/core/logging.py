from aiologger import Logger
from aiologger.formatters.base import Formatter
from app.core.config import settings


logger = Logger.with_default_handlers(
    name='huginn',
    level=settings.log_level,
    formatter=Formatter(settings.log_format),
)
