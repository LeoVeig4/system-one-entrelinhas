"""Servidor local com rotas explícitas e uma avaliação ativa por processo."""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
from pathlib import Path
import threading
from urllib.parse import unquote, urlsplit

from . import AppError
from .evaluator import MAX_BYTES

ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST = ROOT / "frontend" / "dist"


class LocalServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address, evaluator):
        self.evaluator = evaluator
        self.evaluation_lock = threading.Lock()
        super().__init__(address, Handler)


class Handler(BaseHTTPRequestHandler):
    def send_bytes(self, status, content, content_type):
        self.send_response(status)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        try:
            self.wfile.write(content)
        except (BrokenPipeError, ConnectionResetError):
            pass  # Navegação pode encerrar a espera antes de o modelo terminar.

    def send_json(self, status, data):
        self.send_bytes(status, json.dumps(data, ensure_ascii=False, allow_nan=False).encode("utf-8"), "application/json")

    def fail(self, error):
        self.send_json(error.status, {"error": {"code": error.code, "message": error.message}})

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == "/api/scenarios":
            evaluator = self.server.evaluator
            self.send_json(200, evaluator.catalog.public(evaluator.model))
        elif path in ("/", "/conceitos"):
            file = FRONTEND_DIST / "index.html"
            if not file.is_file():
                self.fail(AppError(503, "frontend_not_built", "Interface ainda não compilada. Execute npm ci e npm run build na raiz do projeto."))
                return
            self.send_bytes(200, file.read_bytes(), "text/html")
        elif path.startswith("/assets/") or path == "/favicon.svg":
            file = (FRONTEND_DIST / path.lstrip("/")).resolve()
            if not file.is_relative_to(FRONTEND_DIST.resolve()) or not file.is_file():
                self.fail(AppError(404, "not_found", "Arquivo não encontrado."))
                return
            mime = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
            self.send_bytes(200, file.read_bytes(), mime)
        else:
            self.fail(AppError(404, "not_found", "Página não encontrada."))

    def do_POST(self):
        if urlsplit(self.path).path != "/api/evaluations":
            self.fail(AppError(404, "not_found", "Rota não encontrada."))
            return
        try:
            if self.headers.get_content_type() != "application/json":
                raise AppError(400, "invalid_content_type", "Envie um objeto JSON.")
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                length = 0
            if length <= 0:
                raise AppError(400, "invalid_body", "Corpo da requisição ausente.")
            if length > MAX_BYTES:
                # Consumir corpos próximos do limite evita um reset TCP no Windows
                # antes de o cliente receber o erro; a leitura permanece limitada.
                self.rfile.read(min(length, MAX_BYTES * 2))
                raise AppError(413, "body_too_large", "Corpo da requisição muito grande.")
            try:
                data = json.loads(self.rfile.read(length).decode("utf-8"))
            except (UnicodeError, ValueError) as error:
                raise AppError(400, "invalid_json", "O corpo não é um JSON válido.") from error
            self.server.evaluator.prepare(data)
            if not self.server.evaluation_lock.acquire(blocking=False):
                raise AppError(409, "evaluation_busy", "Uma avaliação ainda está em curso. Aguarde e tente novamente.")
            try:
                result = self.server.evaluator.evaluate(data)
            finally:
                self.server.evaluation_lock.release()
            self.send_json(200, result)
        except AppError as error:
            self.fail(error)

    def log_message(self, format, *args):
        return  # O terminal mostra inicialização; as respostas preservam diagnósticos úteis.
