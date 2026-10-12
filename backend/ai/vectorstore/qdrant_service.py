from qdrant_client import QdrantClient
import os

try:
    from qdrant_client.models import (
        VectorParams, Distance, Filter,
        FieldCondition, MatchValue, PayloadSchemaType
    )
except Exception:
    from qdrant_client.http.models import (
        VectorParams, Distance, Filter,
        FieldCondition, MatchValue, PayloadSchemaType
    )

COLLECTION_NAME = "docs_vectors"

client = QdrantClient(
    ":memory:"
)


def init_collection():
    collections = client.get_collections().collections
    names = [c.name for c in collections]

    if COLLECTION_NAME not in names:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )

    # Required: create keyword indexes so filtered search works
    for field in ["owner", "repo"]:
        try:
            client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name=field,
                field_schema=PayloadSchemaType.KEYWORD
            )
        except Exception:
            pass  # Already exists


from qdrant_client.models import PointStruct


def upsert_vector(point_id, vector, payload):

    client.upsert(

        collection_name=COLLECTION_NAME,

        points=[

            PointStruct(
                id=point_id,
                vector=vector,
                payload=payload
            )

        ]

    )


def search_vectors(query_vector, limit=5):
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        limit=limit
    )
    return results.points


def search_vectors_filtered(query_vector, owner=None, repo=None, limit=5):
    query_filter = None

    if owner and repo:
        query_filter = Filter(
            must=[
                FieldCondition(key="owner", match=MatchValue(value=owner)),
                FieldCondition(key="repo", match=MatchValue(value=repo)),
            ]
        )

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=query_filter,
        limit=limit
    )
    return results.points