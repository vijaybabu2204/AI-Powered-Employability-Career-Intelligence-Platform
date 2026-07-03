import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from root folder
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)
MODEL_NAME = "llama-3.3-70b-versatile"

def chat_completion(messages, format_json=False):
    response_format = {"type": "json_object"} if format_json else None
    
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        response_format=response_format
    )
    
    return response.choices[0].message.content
