"""Uma chamada System One, validada integralmente antes da apresentação."""

import json
import math
import time

import requests

from . import AppError
from .presentation import present

MODEL = "nimble:9b-q4_K_M"
MAX_BYTES = 64 * 1024
TOLERANCE = 1e-6


def contract_error(message):
    return AppError(502, "invalid_model_response", f"O modelo retornou uma avaliação inválida: {message}")


def number(value, low, high):
    return (type(value) in (int, float) and low <= value <= high and math.isfinite(value))


def validate_distribution(probabilities, keys):
    if not isinstance(probabilities, dict) or set(probabilities) != set(keys):
        raise contract_error("distribuição incompleta.")
    if not all(number(value, 0, 1) for value in probabilities.values()):
        raise contract_error("probabilidade fora do intervalo.")
    if abs(sum(probabilities.values()) - 1) > TOLERANCE:
        raise contract_error("a distribuição não soma 1.")


def validate_result(result, schema, model=MODEL):
    if not isinstance(result, dict) or result.get("model") != model:
        raise contract_error("modelo ausente ou divergente.")
    answers = result.get("answers")
    if not isinstance(answers, dict) or set(answers) != set(schema["questions"]):
        raise contract_error("faltam respostas ou há perguntas inesperadas.")
    for key, question in schema["questions"].items():
        answer = answers[key]
        kind = question["type"]
        if not isinstance(answer, dict) or answer.get("type") != kind:
            raise contract_error(f"tipo incorreto em {key}.")
        if "confidence" in answer and not number(answer["confidence"], 0, 1):
            raise contract_error(f"confidence inválida em {key}.")
        if kind == "noul":
            if not number(answer.get("noul"), 0, 1):
                raise contract_error(f"noul inválido em {key}.")
        elif kind == "choice":
            probabilities = answer.get("probabilities")
            validate_distribution(probabilities, question["criteria"])
            choice = answer.get("choice")
            if not isinstance(choice, str) or choice not in probabilities:
                raise contract_error("categoria desconhecida.")
            if max(probabilities.values()) - probabilities[choice] > TOLERANCE:
                raise contract_error("categoria não corresponde à distribuição.")
        else:
            legend = {str(index): label for index, label in enumerate(question["criteria"])}
            if answer.get("legend") != legend:
                raise contract_error(f"legenda divergente em {key}.")
            probabilities = answer.get("probabilities")
            validate_distribution(probabilities, legend)
            score = answer.get("score")
            expected = sum(int(index) * value for index, value in probabilities.items())
            if not number(score, 0, 4) or abs(score - expected) > TOLERANCE:
                raise contract_error(f"score incoerente em {key}.")
    usage = result.get("usage")
    if usage is not None and (not isinstance(usage, dict) or any(
            type(value) is not int or value < 0 for value in usage.values())):
        raise contract_error("uso de tokens inválido.")
    return answers


class Evaluator:
    def __init__(self, catalog, base_url="http://localhost:11434", model=MODEL,
                 read_timeout=120, post=None):
        self.catalog = catalog
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.read_timeout = read_timeout
        self.post = post or requests.post

    def prepare(self, data):
        keys = ("attempt_id", "scenario_id", "scenario_version", "evaluation_schema_version", "seller_response")
        if not isinstance(data, dict) or any(not isinstance(data.get(key), str) for key in keys):
            raise AppError(400, "invalid_input", "Envie a identidade do cenário e uma resposta em texto.")
        if not data["attempt_id"].strip() or len(data["attempt_id"]) > 128:
            raise AppError(400, "invalid_attempt", "Identificador de tentativa inválido.")
        text = data["seller_response"]
        if not text.strip():
            raise AppError(400, "empty_response", "Escreva sua resposta antes de simular.")
        if len(text) > 2000:
            raise AppError(400, "response_too_long", "Sua resposta deve ter até 2.000 caracteres.")
        scenario = self.catalog.resolve(data["scenario_id"], data["scenario_version"], data["evaluation_schema_version"])
        payload = {"model": self.model, "state": {"scenario": scenario, "seller_response": text},
                   "questions": self.catalog.schema["questions"], "keep_alive": "5m"}
        if len(json.dumps(payload, ensure_ascii=False).encode("utf-8")) > MAX_BYTES:
            raise AppError(413, "context_too_large", "O contexto excede o limite da API. Revise o cenário.")
        return scenario, payload

    def evaluate(self, data):
        scenario, payload = self.prepare(data)
        started = time.perf_counter()
        try:
            response = self.post(f"{self.base_url}/v1/systemone", json=payload,
                                 timeout=(5, self.read_timeout))
            response.raise_for_status()
            result = response.json()
        except requests.Timeout as error:
            raise AppError(504, "model_timeout", "O modelo demorou para responder. Seu texto foi preservado; tente novamente.") from error
        except requests.ConnectionError as error:
            raise AppError(503, "model_unavailable", "Não foi possível conectar ao Ollama. Confira se ele está aberto.") from error
        except requests.HTTPError as error:
            detail = response.text[:400]
            raise AppError(502, "model_http_error", f"O Ollama rejeitou a avaliação (HTTP {response.status_code}): {detail}") from error
        except (ValueError, requests.RequestException) as error:
            raise AppError(502, "invalid_model_response", "O Ollama não retornou uma resposta JSON válida.") from error
        elapsed = time.perf_counter() - started
        answers = validate_result(result, self.catalog.schema, self.model)
        return {"attempt_id": data["attempt_id"], "scenario_id": scenario["id"],
                "scenario_version": scenario["version"], "evaluation_schema_version": self.catalog.schema["version"],
                "seller_response": data["seller_response"], "model": self.model,
                "answers": answers, "questions": payload["questions"],
                "presentation": present(answers, self.catalog.schema),
                "duration_seconds": elapsed, "usage": result.get("usage")}
