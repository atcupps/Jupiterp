#!/usr/bin/env python3
import os
import re
import subprocess
import sys
import tempfile


def required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value


def sanitize_author(author: str) -> str:
    sanitized = re.sub(r"[^a-z0-9-]+", "-", author.lower())
    sanitized = re.sub(r"-+", "-", sanitized).strip("-")
    if not sanitized:
        raise SystemExit("Sanitized author name is empty; cannot deploy.")
    if not sanitized[0].isalpha():
        sanitized = f"p-{sanitized}"
    return sanitized


def parse_authorized(raw: str) -> set[str]:
    parts = [p.strip().lower() for p in re.split(r"[,\s]+", raw) if p.strip()]
    return set(parts)


def run_cmd(cmd: list[str]) -> None:
    print(f"+ {' '.join(cmd)}")
    subprocess.run(cmd, check=True)


def main() -> int:
    credentials = required_env("GCP_CREDENTIALS")
    project_id = required_env("GCP_PROJECT_ID")
    region = required_env("GCP_REGION")
    author = required_env("PR_AUTHOR")
    authorized_raw = required_env("AUTHORIZED_PR_AUTHORS")
    source_dir = os.environ.get("GCP_SOURCE_DIR", "site")
    if not os.path.isdir(source_dir):
        raise SystemExit(f"Source directory does not exist: {source_dir}")

    authorized = parse_authorized(authorized_raw)
    if author.lower() not in authorized:
        print(f"Author '{author}' is not authorized for deployment; skipping.")
        return 0

    service = sanitize_author(author)
    print(f"Deploying preview for '{author}' as service '{service}'.")

    with tempfile.NamedTemporaryFile("w", delete=False) as cred_file:
        cred_file.write(credentials)
        cred_path = cred_file.name

    try:
        run_cmd(["gcloud", "auth", "activate-service-account", "--key-file", cred_path])
        run_cmd(["gcloud", "config", "set", "project", project_id])
        run_cmd(["gcloud", "config", "set", "run/region", region])
        run_cmd(
            [
                "gcloud",
                "run",
                "deploy",
                service,
                "--source",
                source_dir,
                "--region",
                region,
                "--platform",
                "managed",
                "--allow-unauthenticated",
            ]
        )
    finally:
        try:
            os.unlink(cred_path)
        except FileNotFoundError:
            pass

    print("Deployment completed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
