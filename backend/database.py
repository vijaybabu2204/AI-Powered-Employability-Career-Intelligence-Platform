import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    host = os.getenv("MYSQL_HOST") or os.getenv("DB_HOST", "localhost")
    port = os.getenv("MYSQL_PORT") or os.getenv("DB_PORT", "3306")
    user = os.getenv("MYSQL_USER") or os.getenv("DB_USER", "root")
    password = os.getenv("MYSQL_PASSWORD") or os.getenv("DB_PASSWORD", "Vij@y2344")
    database = os.getenv("MYSQL_DATABASE") or os.getenv("DB_NAME", "CareerIntelligence")

    return mysql.connector.connect(
        host=host,
        port=int(port),
        user=user,
        password=password,
        database=database
    )