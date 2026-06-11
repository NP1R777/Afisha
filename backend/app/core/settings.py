from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path


class AppSettings(BaseSettings):
    app_env: str = 'development'
    debug: bool = True
    
    # Переменные для базы данных
    db_user: str
    db_password: str
    db_name: str
    db_address: Optional[str] = None
    db_host: Optional[str] = None
    db_port: Optional[str] = None
    
    # JWT настройки
    jwt_key: str = "default_jwt_key"
    jwt_algorithm: str = "HS256"
    access_token_expire: int = 5
    refresh_token_expire: int = 30

    # Настройки внешних источников парсинга
    vmuzey_proxy: Optional[str] = None
    vmuzey_cookies: Optional[str] = None
    vmuzey_user_agent: Optional[str] = None

    # Mistral AI
    mistral_api_key: Optional[str] = None
    mistral_api_base_url: str = "https://api.mistral.ai/v1"
    mistral_chat_model: str = "mistral-large-latest"
    mistral_embedding_model: str = "mistral-embed"

    # Assistant search/index settings
    assistant_embedding_dim: int = 1024
    assistant_embedding_batch_size: int = 32
    assistant_semantic_limit: int = 80

    # Milvus
    milvus_uri: Optional[str] = None
    milvus_host: str = "localhost"
    milvus_port: int = 19530
    milvus_user: Optional[str] = None
    milvus_password: Optional[str] = None
    milvus_db_name: str = "default"
    milvus_collection_name: str = "afisha_events"

    # MinIO image storage
    minio_endpoint: Optional[str] = None
    minio_access_key: Optional[str] = None
    minio_secret_key: Optional[str] = None
    minio_bucket: str = "afisha-images"
    minio_secure: bool = False
    minio_public_base_url: Optional[str] = None
    minio_max_image_size_mb: int = 10
    minio_request_timeout_sec: int = 30
    default_event_card_image_url: Optional[str] = None
    default_event_detail_image_url: Optional[str] = None

    root_path: str = ''

    class Config:
        env_file = Path(__file__).parent.parent.parent / '.env' 
        env_prefix = ''

    @property
    def database_url(self) -> str:
        if self.db_address:
            address = self.db_address
        else:
            address = f"{self.db_host}:{self.db_port}"
        
        return "postgresql://" + self.db_user + ":" + \
            self.db_password + "@" + \
            address + "/" + self.db_name

    def is_production(self) -> bool:
        return self.app_env == 'production'

    def async_database_url(self):
        return self.database_url.replace('postgresql', 'postgresql+asyncpg', 1)
