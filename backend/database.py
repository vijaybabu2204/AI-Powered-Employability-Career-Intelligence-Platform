import mysql.connector

def get_connection():
    conn = mysql.connector.connect(
        host = "localhost",
        user = "root",
        password = "Vij@y2344",
        database = "CareerIntelligence"
        
    )
    return conn