import argparse
import math

from .evaluator import Evaluator
from .scenarios import Catalog
from .server import LocalServer


def positive_timeout(value):
    number = float(value)
    if not math.isfinite(number) or number <= 0:
        raise argparse.ArgumentTypeError("timeout deve ser positivo e finito")
    return number


def main():
    parser = argparse.ArgumentParser(description="Entrelinhas: simulador local de reações comerciais")
    parser.add_argument("--host", default="127.0.0.1", choices=("127.0.0.1", "localhost"))
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--timeout", type=positive_timeout, default=120)
    args = parser.parse_args()
    evaluator = Evaluator(Catalog(), read_timeout=args.timeout)
    with LocalServer((args.host, args.port), evaluator) as server:
        print(f"Entrelinhas: http://{args.host}:{server.server_port}", flush=True)
        print("Conceitos: /conceitos | Ctrl+C para encerrar", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
