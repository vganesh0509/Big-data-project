from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# Use your MongoDB Atlas connection string
MONGO_URI = "mongodb+srv://godakodati:46hvkyxhGB2itfU4@cluster0.0toxr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"


# Create a global MongoDB client (Singleton Pattern)
client = None

if client is None:
    client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
    db = client["bigdatatutor"]
    workflows_collection = db["workflows"]
    
    # Print only if the connection is established for the first time
    try:
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print("❌ Connection failed:", e)