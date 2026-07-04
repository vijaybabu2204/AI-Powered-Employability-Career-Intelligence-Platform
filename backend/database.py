import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def get_connection():
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
            detail=f"Database connection failed: {str(e)}. Please check your MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE environment variables on Render."
        )