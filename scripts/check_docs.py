"""Conferir links locais da documentação sem acessar a internet."""

import os
from pathlib import Path
import re
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
EXCLUDED = {".git", ".venv", "node_modules", "dist", "__pycache__", "playwright-report", "test-results", "artifacts"}


def main():
    errors, links, documents = [], 0, 0
    for directory, directories, files in os.walk(ROOT):
        directories[:] = [name for name in directories if name not in EXCLUDED]
        for name in files:
            if not name.endswith(".md"):
                continue
            file = Path(directory) / name
            documents += 1
            content = file.read_text(encoding="utf-8")
            for target in re.findall(r"!?\[[^\]]*\]\(([^)\n]+)\)", content):
                target = target.strip("<>").split("#")[0]
                if not target or re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", target):
                    continue
                links += 1
                if not (file.parent / unquote(target)).exists():
                    errors.append(f"{file.relative_to(ROOT)}: link ausente {target}")
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"{documents} documentos; {links} links locais válidos.")


if __name__ == "__main__":
    main()
