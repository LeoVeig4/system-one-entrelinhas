#!/usr/bin/env python3
"""Cliente HTTP para o Nimble/System One; usa apenas a biblioteca padrão."""

import argparse
import json
import math
from pathlib import Path
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def positive_timeout(value):
    number = float(value)
    if not math.isfinite(number) or number <= 0:
        raise argparse.ArgumentTypeError("timeout deve ser positivo e finito")
    return number


def fetch_json(url, timeout, payload=None):
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {} if data is None else {"Content-Type": "application/json"}
    request = Request(url, data=data, headers=headers)
    with urlopen(request, timeout=timeout) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--status", action="store_true", help="Consultar versão, modelos e processos")
    mode.add_argument("--request", type=Path, help="Arquivo JSON com state e questions")
    state = parser.add_mutually_exclusive_group()
    state.add_argument("--text", help="Substituir state por este texto")
    state.add_argument("--state-file", type=Path, help="Substituir state pelo conteúdo UTF-8 de um arquivo")
    parser.add_argument("--model", help="Substituir a tag do modelo")
    parser.add_argument("--base-url", default="http://localhost:11434")
    parser.add_argument("--timeout", type=positive_timeout, default=120)
    parser.add_argument("--output", type=Path, help="Salvar o resultado em JSON")
    args = parser.parse_args()
    if args.status and (args.text is not None or args.state_file is not None or args.model is not None):
        parser.error("--text, --state-file e --model requerem --request")

    started = time.perf_counter()
    try:
        base_url = args.base_url.rstrip("/")
        if args.status:
            result = {name: fetch_json(f"{base_url}/api/{name}", args.timeout)
                      for name in ("version", "tags", "ps")}
        else:
            payload = json.loads(args.request.read_text(encoding="utf-8-sig"))
            if not isinstance(payload, dict):
                raise ValueError("A requisição deve ser um objeto JSON")
            if args.text is not None:
                payload["state"] = args.text
            elif args.state_file is not None:
                payload["state"] = args.state_file.read_text(encoding="utf-8-sig")
            if args.model is not None:
                payload["model"] = args.model
            payload.setdefault("model", "nimble:9b-q4_K_M")
            if "state" not in payload or not isinstance(payload.get("questions"), dict) or not payload["questions"]:
                raise ValueError("Forneça state e um objeto questions não vazio")
            result = fetch_json(f"{base_url}/v1/systemone", args.timeout, payload)
            if not isinstance(result, dict) or not isinstance(result.get("answers"), dict):
                raise ValueError("Resposta sem o objeto answers esperado")
        rendered = json.dumps(result, ensure_ascii=False, indent=2)
        if args.output is not None:
            args.output.write_text(rendered + "\n", encoding="utf-8")
        print(rendered)
        print(f"Tempo total HTTP: {time.perf_counter() - started:.3f} s", file=sys.stderr)
        return 0
    except HTTPError as error:
        detail = error.read(4096).decode("utf-8", errors="replace")
        print(f"HTTP {error.code}: {detail}", file=sys.stderr)
    except (URLError, OSError, ValueError) as error:
        print(f"Falha: {error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
