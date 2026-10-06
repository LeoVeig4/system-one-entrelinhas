from sales_trainer.evaluator import MODEL


def valid_result(schema):
    answers = {}
    for key, question in schema["questions"].items():
        kind = question["type"]
        if kind == "noul":
            answers[key] = {"type": kind, "noul": 0.8}
        elif kind == "choice":
            probabilities = {label: 0 for label in question["criteria"]}
            probabilities["discovery"] = 1
            answers[key] = {"type": kind, "choice": "discovery", "probabilities": probabilities, "confidence": 1}
        else:
            answers[key] = {"type": kind, "score": 2.75,
                            "legend": {str(index): label for index, label in enumerate(question["criteria"])},
                            "probabilities": {"0": 0, "1": 0, "2": 0.25, "3": 0.75, "4": 0}}
    return {"model": MODEL, "answers": answers, "usage": {"input_tokens": 100, "output_tokens": 10}}


def input_data(catalog, text="Entendo sua preocupação. Onde a planilha dá mais trabalho?"):
    scenario = catalog.scenarios[0]
    return {"attempt_id": "test-attempt", "scenario_id": scenario["id"],
            "scenario_version": scenario["version"], "evaluation_schema_version": catalog.schema["version"],
            "seller_response": text}
