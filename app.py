from __future__ import annotations

from dataclasses import asdict
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_from_directory

from treino.adaptacao import ExerciseAttempt, suggest_next_intensity

FORGE_PUBLIC_DIR = Path(__file__).parent / "forge90" / "server" / "public"


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/")
    def home():
        return render_template("home.html")

    @app.get("/laboratorio")
    def laboratorio():
        # Interface Forge 90 distribuída sem alterações a partir do clone AGPL.
        # O código Python do Loloa permanece responsável pela migração gradual
        # das regras e das APIs, sem iniciar o servidor Node do projeto-base.
        return send_from_directory(FORGE_PUBLIC_DIR, "index.html")

    @app.get("/laboratorio/<path:asset_path>")
    def laboratorio_asset(asset_path: str):
        return send_from_directory(FORGE_PUBLIC_DIR, asset_path)

    @app.get("/icon.png")
    def forge_icon():
        return send_from_directory(FORGE_PUBLIC_DIR, "icon.png")

    @app.post("/api/laboratorio/intensidade")
    def laboratorio_intensidade():
        data = request.get_json(silent=True) or {}
        attempts = [
            ExerciseAttempt(
                load_kg=float(item["load_kg"]),
                reps=int(item["reps"]),
                target_reps=int(item.get("target_reps", 10)),
                rir=int(item.get("rir", 2)),
                pain=int(item.get("pain", 0)),
                completed=bool(item.get("completed", True)),
            )
            for item in data.get("attempts", [])
        ]
        suggestion = suggest_next_intensity(attempts)
        return jsonify(asdict(suggestion))

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=8000)
