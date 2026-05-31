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
