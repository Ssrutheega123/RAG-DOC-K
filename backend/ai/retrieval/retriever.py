from ai.embedding.embedding_service import embed_text
from ai.vectorstore.qdrant_service import search_vectors


def retrieve_context(question, limit=5):

    query_vector = embed_text(question)

    hits = search_vectors(query_vector, limit)

    contexts = [
        hit.payload["text"]
        for hit in hits
    ]

    sources = [
        hit.payload["doc_id"]
        for hit in hits
    ]

    return contexts, sources