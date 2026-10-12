import requests
import uuid
from datetime import datetime

from flask import Blueprint, jsonify, request, session

from config import docs_collection, repos_collection
from ai.chunking.chunk_service import chunk_text
from ai.embedding.embedding_service import embed_batch
from ai.vectorstore.qdrant_service import upsert_vector
from services.rag_service import embed_and_store


docs_bp = Blueprint("docs", __name__)


########################################################
# Extract markdown headings as sections
########################################################

def extract_sections(markdown):

    sections = []

    for line in markdown.split("\n"):

        if line.startswith("#"):

            heading = line.replace("#", "").strip()

            anchor = heading.lower().replace(" ", "-").replace(".", "")

            sections.append({
                "heading": heading,
                "anchor": anchor
            })

    return sections


########################################################
# GitHub auth header helper
########################################################

def _github_headers():

    token = session.get("github_token")

    if not token:
        return {}

    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }


########################################################
# Recursive markdown fetcher
########################################################

def fetch_markdown_files(owner, repo, path=""):

    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"

    try:
        r = requests.get(url, headers=_github_headers(), timeout=10)
    except requests.exceptions.RequestException:
        return []

    if r.status_code != 200:
        return []

    files = []

    for item in r.json():

        if item["type"] == "file" and item["name"].lower().endswith(".md"):

            try:
                dl = requests.get(
                    item["download_url"],
                    headers=_github_headers(),
                    timeout=10
                )

                content = dl.text if dl.ok else ""

            except requests.exceptions.RequestException:
                content = ""

            files.append({
                "path": item["path"],
                "name": item["name"],
                "content": content
            })

        elif item["type"] == "dir":

            # recurse ALL directories
            files.extend(
                fetch_markdown_files(owner, repo, item["path"])
            )

    return files


########################################################
# Load repo markdown → MongoDB + Qdrant embeddings
########################################################

@docs_bp.route("/docs/load-repo", methods=["POST"])
def load_repo():

    data = request.get_json() or {}

    owner = data.get("owner")
    repo = data.get("repo")

    if not owner or not repo:
        return jsonify({"error": "owner and repo required"}), 400

    if not session.get("github_token"):
        return jsonify({"error": "not authenticated"}), 401

    entries = fetch_markdown_files(owner, repo)

    if not entries:
        return jsonify({
            "ok": False,
            "files_loaded": 0,
            "message": "No markdown files found"
        })

    ##################################################
    # Delete previous repo docs
    ##################################################

    docs_collection.delete_many({
        "repo": repo,
        "owner": owner
    })

    ##################################################
    # Process markdown files
    ##################################################

    total_chunks = 0

    for file in entries:

        docs_collection.insert_one({

            "repo": repo,
            "owner": owner,
            "doc_id": file["path"],
            "title": file["name"].replace(".md", ""),
            "path": file["path"],
            "content": file["content"],
            "last_updated": datetime.utcnow()

        })

        chunks = chunk_text(file["content"])

        if not chunks:
            continue

        vectors = embed_batch(chunks)

        for i, vector in enumerate(vectors):

            point_id = uuid.uuid4().int >> 64

            upsert_vector(

                point_id=point_id,

                vector=vector,

                payload={
                    "owner": owner,
                    "repo": repo,
                    "doc_id": file["path"],
                    "title": file["name"],
                    "text": chunks[i]
                }

            )

            total_chunks += 1

    ##################################################
    # Save repo metadata
    ##################################################

    repos_collection.update_one(
        {"repo": repo, "owner": owner},
        {"$set": {"repo": repo, "owner": owner}},
        upsert=True
    )

    session["repo"] = repo
    session["owner"] = owner

    return jsonify({

        "ok": True,
        "files_loaded": len(entries),
        "chunks_indexed": total_chunks

    })


########################################################
# Docs index endpoint
########################################################

@docs_bp.route("/docs", methods=["GET"])
def list_docs():

    repo = request.args.get("repo")
    owner = request.args.get("owner") or session.get("owner")

    if not repo or not owner:

        return jsonify({
            "repo": {},
            "documents": []
        })

    docs_cursor = docs_collection.find(

        {
            "repo": repo,
            "owner": owner
        },

        {
            "_id": 0,
            "doc_id": 1,
            "title": 1,
            "path": 1,
            "last_updated": 1
        }

    )

    return jsonify({

        "repo": {
            "name": repo,
            "owner": owner
        },

        "documents": list(docs_cursor)

    })


########################################################
# Single doc endpoint
########################################################

@docs_bp.route("/docs/<path:doc_id>", methods=["GET"])
def get_doc(doc_id):

    repo = session.get("repo")
    owner = session.get("owner")

    if not repo or not owner:
        return jsonify({})

    doc = docs_collection.find_one(

        {
            "repo": repo,
            "owner": owner,
            "doc_id": doc_id
        },

        {"_id": 0}

    )

    if not doc:
        return jsonify({})

    sections = extract_sections(doc.get("content", ""))

    return jsonify({

        "doc_id": doc["doc_id"],
        "title": doc["title"],
        "repo": repo,
        "owner": owner,
        "path": doc["path"],
        "last_updated": doc.get("last_updated"),
        "content": doc["content"],
        "sections": sections

    })