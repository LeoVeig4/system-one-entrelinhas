"""Dados visíveis dos cenários e fonte única das perguntas."""

import json
from pathlib import Path

from . import AppError

DATA_DIR = Path(__file__).parent / "data"


class Catalog:
    def __init__(self, data_dir=DATA_DIR):
        self.scenarios = json.loads((data_dir / "scenarios.json").read_text(encoding="utf-8"))
        self.schema = json.loads((data_dir / "evaluation_schema.json").read_text(encoding="utf-8"))
        self.validate()

    def validate(self):
        schema = self.schema
        questions = schema["questions"]
        effects, dimensions = schema["effects"], schema["dimensions"]
        keys = [item["key"] for item in effects + dimensions] + ["seller_approach"]
        if len(effects) != 6 or len(dimensions) != 3 or set(keys) != set(questions) or len(keys) != 10:
            raise ValueError("A rubrica deve conter seis noul, uma choice e três score.")
        for effect in effects:
            if questions[effect["key"]]["type"] != "noul":
                raise ValueError("Efeito precisa usar noul.")
        for dimension in dimensions:
            question = questions[dimension["key"]]
            if question["type"] != "score" or len(question["criteria"]) != 5:
                raise ValueError("Dimensão precisa usar score com cinco níveis.")
        approach = questions["seller_approach"]
        if approach["type"] != "choice" or len(approach["criteria"]) != 6:
            raise ValueError("Abordagem precisa usar choice com seis alternativas.")
        if set(approach["criteria"]) != set(schema["approaches"]):
            raise ValueError("Alternativas e rótulos de abordagem divergentes.")
        ids = set()
        for scenario in self.scenarios:
            if scenario["id"] in ids or scenario["evaluation_schema_version"] != schema["version"]:
                raise ValueError("Identidade ou versão de cenário inválida.")
            ids.add(scenario["id"])
            for key in ("id", "version", "title", "category", "offer_summary", "customer_context", "stage", "customer_name", "customer_profile"):
                if not isinstance(scenario[key], str) or not scenario[key].strip():
                    raise ValueError(f"Campo de cenário inválido: {key}")
            if not scenario["offer_facts"] or not all(isinstance(fact, str) for fact in scenario["offer_facts"]):
                raise ValueError("Fatos da oferta inválidos.")
            if len(scenario["messages"]) < 5 or len(scenario["messages"]) % 2 != 1:
                raise ValueError("A conversa deve ter ao menos cinco turnos e terminar com o cliente.")
            for index, message in enumerate(scenario["messages"]):
                expected_role = "customer" if index % 2 == 0 else "seller"
                if message["role"] != expected_role or not isinstance(message["content"], str) or not message["content"].strip():
                    raise ValueError("Mensagem de cenário inválida.")
        if len(ids) != 3:
            raise ValueError("O MVP deve conter três cenários.")

    def resolve(self, scenario_id, scenario_version, schema_version):
        scenario = next((item for item in self.scenarios if item["id"] == scenario_id), None)
        if scenario is None:
            raise AppError(404, "scenario_not_found", "Esse cenário não foi encontrado.")
        if scenario["version"] != scenario_version or self.schema["version"] != schema_version:
            raise AppError(409, "version_mismatch", "O cenário mudou. Recarregue a página antes de simular.")
        return scenario

    def public(self, model):
        return {"scenarios": self.scenarios, "model": model,
                "schema": {key: value for key, value in self.schema.items() if key != "questions"}}
