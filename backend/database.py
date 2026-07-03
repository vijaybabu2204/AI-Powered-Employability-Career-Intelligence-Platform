import os
from dotenv import load_dotenv
import mysql.connector

# Load environment variables from .env
load_dotenv()

def get_connection():
    conn = mysql.connector.connect(
        host = os.getenv("DB_HOST", "localhost"),
        user = os.getenv("DB_USER", "root"),
        password = os.getenv("DB_PASSWORD", "Vij@y2344"),
        database = os.getenv("DB_NAME", "CareerIntelligence")
    )
    return conn