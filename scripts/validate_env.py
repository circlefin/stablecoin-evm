import os
import sys
from pathlib import Path

REQUIRED = [
    "DEPLOYER_PRIVATE_KEY",
    "PROXY_ADMIN_ADDRESS",
    "OWNER_ADDRESS",
    "MASTER_MINTER_OWNER_ADDRESS",
]

def load_env_file(path: Path) -> None:
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())

def main() -> int:
    env_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".env")
    if env_path.exists():
        load_env_file(env_path)

    missing = [k for k in REQUIRED if not os.environ.get(k)]
    if missing:
        print("Missing required env vars:")
        for k in missing:
            print(f"- {k}")
        return 1

    print("Env preflight passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
