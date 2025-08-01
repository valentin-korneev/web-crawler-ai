import aio_pika
import json
from typing import Dict, Any, Optional
from datetime import datetime
from app.core.config import settings
from app.core.logging import logger


class QueueService:
    def __init__(self):
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        
    async def connect(self):
        """Подключение к MQ"""
        try:
            self.connection = await aio_pika.connect_robust(settings.mq_url)
            self.channel = await self.connection.channel()
            
            # Объявляем очереди
            await self.channel.declare_queue("scan_tasks", durable=True)
            await self.channel.declare_queue("scan_results", durable=True)
            await self.channel.declare_queue("violation_notifications", durable=True)
            
            await logger.info("Connected to MQ")
        except Exception as e:
            await logger.error(f"Failed to connect to MQ: {e}")
            raise
    
    async def disconnect(self):
        """Отключение от MQ"""
        if self.connection:
            await self.connection.close()
            await logger.info("Disconnected from MQ")
    
    async def publish_scan_task(self, contractor_id: int, url: str, depth: int = 0, session_id: int = None):
        """Публикация задачи сканирования"""
        if not self.channel:
            await self.connect()
        
        message = {
            "contractor_id": contractor_id,
            "url": url,
            "depth": depth,
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(message).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            ),
            routing_key="scan_tasks"
        )
        
        await logger.info(f"Published scan task for contractor {contractor_id}, URL: {url}, session_id: {session_id}")
    
    async def publish_scan_result(self, result_data: Dict[str, Any]):
        """Публикация результата сканирования"""
        if not self.channel:
            await self.connect()
        
        await self.channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(result_data).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            ),
            routing_key="scan_results"
        )
        
        await logger.info(f"Published scan result for contractor {result_data.get('contractor_id')}")
    
    async def publish_violation_notification(self, violation_data: Dict[str, Any]):
        """Публикация уведомления о нарушении"""
        if not self.channel:
            await self.connect()
        
        await self.channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(violation_data).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT
            ),
            routing_key="violation_notifications"
        )
        
        await logger.info(f"Published violation notification for contractor {violation_data.get('contractor_id')}")
    
    async def consume_scan_tasks(self, callback):
        """Потребление задач сканирования"""
        if not self.channel:
            await self.connect()
        
        queue = await self.channel.declare_queue("scan_tasks", durable=True)
        
        async def process_message(message):
            async with message.process():
                try:
                    data = json.loads(message.body.decode())
                    await callback(data)
                except Exception as e:
                    await logger.error(f"Error processing scan task: {e}")
        
        await queue.consume(process_message)
        await logger.info("Started consuming scan tasks")
    
    async def consume_scan_results(self, callback):
        """Потребление результатов сканирования"""
        if not self.channel:
            await self.connect()
        
        queue = await self.channel.declare_queue("scan_results", durable=True)
        
        async def process_message(message):
            async with message.process():
                try:
                    data = json.loads(message.body.decode())
                    await callback(data)
                except Exception as e:
                    await logger.error(f"Error processing scan result: {e}")
        
        await queue.consume(process_message)
        await logger.info("Started consuming scan results")

# Глобальный экземпляр сервиса
queue_service = QueueService() 