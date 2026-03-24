from pymongo import MongoClient

from config import get_settings

settings = get_settings()
client = None

if settings.mongodb_uri:
    client = MongoClient(settings.mongodb_uri)
else:
    try:
        import mongomock

        client = mongomock.MongoClient()
    except ImportError as exc:
        raise RuntimeError(
            "mongomock must be installed when MONGODB_URI is not provided"
        ) from exc

db = client[settings.mongodb_db]

