from flask import Flask
from flask_session import Session
import os
from routes.auth_routes import auth_bp
from routes.docs_routes import docs_bp
from flask_cors import CORS
from routes.ai_routes import ai_bp
from ai.vectorstore.qdrant_service import init_collection


def create_app():

    app = Flask(__name__)
    init_collection()

    app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY","smartdocs-secret-key")
    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_PREMANENT"]=False
    app.config["SESSION_USE_SIGNER"]=True
    app.config["SESSION_COOKIE_SAMESITE"]="Lax"
    app.config["SESSION_COOKIE_SECURE"]=False
    app.config["SESSION_COOKIE_HTTPONLY"]=True
    

    Session(app)
    CORS(app,supports_credentials=True,origins=["http://localhost:5173"])

    app.register_blueprint(auth_bp)
    app.register_blueprint(docs_bp)
    app.register_blueprint(ai_bp)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0",debug=False, port=8001)
