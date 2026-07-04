import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    from urllib.parse import urlparse
    db_url = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL") or os.getenv("MYSQLURL")
    
    if db_url:
        try:
            parsed = urlparse(db_url)
            host = parsed.hostname
            port = parsed.port or 3306
            user = parsed.username
            password = parsed.password
            database = parsed.path.lstrip('/')
        except Exception as parse_err:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse database connection URL: {str(parse_err)}"
            )
    else:
        host = os.getenv("MYSQL_HOST") or os.getenv("MYSQLHOST")
        port_val = os.getenv("MYSQL_PORT") or os.getenv("MYSQLPORT")
        try:
            port = int(port_val) if port_val else 3306
        except (ValueError, TypeError):
            port = 3306
            
        user = os.getenv("MYSQL_USER") or os.getenv("MYSQLUSER")
        password = os.getenv("MYSQL_PASSWORD") or os.getenv("MYSQLPASSWORD")
        database = os.getenv("MYSQL_DATABASE") or os.getenv("MYSQLDATABASE")

    try:
        return mysql.connector.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(e)}. Please check your MYSQL_URL or individual MYSQL_* environment variables on Render."
        )