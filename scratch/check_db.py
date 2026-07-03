import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

def check_db():
    conn = mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        port=int(os.getenv("MYSQL_PORT")),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE")
    )
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print("Tables in database:", tables)
    for table in tables:
        name = table[0]
        cursor.execute(f"DESCRIBE {name}")
        print(f"\nStructure of {name}:")
        for col in cursor.fetchall():
            print(col)
    conn.close()

if __name__ == "__main__":
    check_db()
