from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-small-en-v1.5")


def embed_text(text):

    return model.encode(text).tolist()


def embed_batch(texts):

    if not texts:
        return []

    return model.encode(texts).tolist()