from flask import Blueprint, request, jsonify, session
from ai.pipeline.rag_pipeline import run_rag_pipeline

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/ask-ai", methods=["POST"])
def ask_ai():

    data = request.get_json()

    question = data.get("question")
    owner = data.get("owner") or session.get("owner")
    repo = data.get("repo") or session.get("repo")

    if not question:
        return jsonify({"error": "Question required"}), 400

    if not owner or not repo:
        return jsonify({"error": "Repo context missing"}), 400

    result = run_rag_pipeline(question, owner=owner, repo=repo)

    return jsonify(result)