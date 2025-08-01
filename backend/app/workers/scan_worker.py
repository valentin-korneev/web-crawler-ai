import asyncio
from typing import Dict, Any
from app.services.queue_service import queue_service
from app.services.scanner_service import scanner_service
from app.core.database import init_db
from app.core.logging import logger


async def process_scan_task(task_data: Dict[str, Any]):
    """Обработка задачи сканирования"""
    try:
        contractor_id = task_data['contractor_id']
        url = task_data['url']
        depth = task_data.get('depth', 0)
        session_id = task_data.get('session_id')
        
        await logger.info(f"🚀 Starting scan task: contractor {contractor_id}, URL: {url}, depth: {depth}, session_id: {session_id}")
        
        # Запускаем сканирование
        await scanner_service.scan_contractor(contractor_id, url, session_id)
        
        await logger.info(f"✅ Completed scan task for contractor {contractor_id}, URL: {url}")
        
    except Exception as e:
        await logger.error(f"❌ Error processing scan task for contractor {task_data.get('contractor_id', 'unknown')}: {e}")
        await logger.exception("Full traceback:")

async def start_scan_worker():
    """Запуск worker'а для обработки задач сканирования"""
    await logger.info("🔧 Starting scan worker...")
    
    try:
        # Инициализируем базу данных
        await logger.info("📊 Initializing database connection...")
        await init_db()
        await logger.info("✅ Database initialized for scan worker")
        
        # Подключаемся к очереди
        await logger.info("🐰 Connecting to MQ...")
        await queue_service.connect()
        await logger.info("✅ Connected to MQ")
        
        # Начинаем потребление задач
        await logger.info("📥 Starting to consume scan tasks from queue...")
        await queue_service.consume_scan_tasks(process_scan_task)
        
        await logger.info("🔄 Scan worker is running and waiting for tasks...")
        
        # Держим worker запущенным
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        await logger.info("🛑 Scan worker stopped by user")
    except Exception as e:
        await logger.error(f"💥 Scan worker error: {e}")
        await logger.exception("Full traceback:")
    finally:
        await logger.info("🔌 Disconnecting from MQ...")
        await queue_service.disconnect()
        await logger.info("👋 Scan worker shutdown complete")

async def main():
    """Главная функция для запуска scan worker"""
    await logger.info("🎯 Scan worker process started")
    await start_scan_worker()


# Запускаем worker при импорте модуля
if __name__ == "__main__":
    asyncio.run(main())
