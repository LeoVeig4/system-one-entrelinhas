"""Transformações de apresentação, sem arredondar ou agregar escores."""


def present(answers, schema):
    effects = []
    for definition in schema["effects"]:
        value = answers[definition["key"]]["noul"]
        effects.append({**definition, "probability": value, "percent": 100 * value,
                        "opacity": 0.15 + 0.85 * value})
    approach = answers["seller_approach"]
    dimensions = []
    for definition in schema["dimensions"]:
        answer = answers[definition["key"]]
        dimensions.append({**definition, **answer, "position": answer["score"] / 4})
    return {"effects": effects,
            "approach": {**approach, "label": schema["approaches"][approach["choice"]]},
            "dimensions": dimensions}
