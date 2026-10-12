from ai.embedding.embedding_service import embed_text
from ai.vectorstore.qdrant_service import search_vectors_filtered
from ai.llm.groq_service import generate_answer


########################################################
# Clean unwanted LLM prefixes for better UI experience
########################################################

def clean_response(text: str) -> str:

    if not text:
        return text

    prefixes = [
        "Based on the provided context:",
        "According to the documentation:",
        "From the provided documentation:",
        "Based on the given context:"
    ]

    cleaned = text.strip()

    for prefix in prefixes:
        if cleaned.startswith(prefix):
            cleaned = cleaned.replace(prefix, "").strip()

    return cleaned


########################################################
# Main RAG pipeline
########################################################

def run_rag_pipeline(question: str, owner: str = None, repo: str = None) -> dict:

    # Generate embedding for user question
    query_vector = embed_text(question)

    # Search only inside selected repository chunks
    chunks = search_vectors_filtered(
        query_vector,
        owner=owner,
        repo=repo,
        limit=5
    )

    context = [
        c.payload.get("text", "")
        for c in chunks
        if c.payload.get("text")
    ]

    if not context:
        return {
            "answer": "No relevant documentation found for this repository."
        }

    # Generate LLM answer
    raw_answer = generate_answer(context, question)

    # Clean formatting artifacts
    cleaned_answer = clean_response(raw_answer)

    return {
        "answer": cleaned_answer
    }