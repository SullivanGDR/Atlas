"""Exercise a generated blog backend against a disposable PostgreSQL database.

Generate the fixture with ATHENA_EXPORT_FIXTURE set before pnpm test.
Run from the exported backend directory, with DATABASE_URL ending in /athena_test.
"""
import os
import sys
from pathlib import Path

from sqlalchemy.engine import make_url

url = make_url(os.environ["DATABASE_URL"])
if url.database != "athena_test" or url.host not in ("127.0.0.1", "localhost"):
    raise RuntimeError("This check requires a disposable localhost database named athena_test")
sys.path.insert(0, str(Path.cwd()))

from alembic import command
from alembic.config import Config
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from fastapi.testclient import TestClient
from sqlalchemy.orm import configure_mappers
from app.database import Base, engine
from app.main import app

config = Config("alembic.ini")
command.upgrade(config, "head")
configure_mappers()
with engine.connect() as connection:
    differences = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    assert not differences, differences

client = TestClient(app)
assert client.get("/health").status_code == 200
assert client.get("/openapi.json").status_code == 200


def post(path, data, status=201):
    result = client.post(path, json=data)
    assert result.status_code == status, (path, result.status_code, result.text)
    return result.json()


user = post("/users", {"email": "test@example.com"})
post("/users", {"email": "test@example.com"}, 409)
post("/users", {"email": "x" * 121}, 422)
post("/posts", {"author_id": user["id"], "title": None}, 422)
post("/posts", {"author_id": "00000000-0000-0000-0000-000000000001", "title": "Invalid reference"}, 409)
post_row = post("/posts", {"author_id": user["id"], "title": "First post"})
assert post_row["id"] > 0 and post_row["created_at"]
assert post_row["published"] is False and post_row["payload"] == {}
assert post_row["content"] is None
assert client.patch(f"/posts/{post_row['id']}", json={"title": "Updated"}).json()["title"] == "Updated"
assert client.patch(f"/posts/{post_row['id']}", json={"title": None}).status_code == 422
assert client.patch(f"/posts/{post_row['id']}", json={"id": 999}).status_code == 422
assert client.get("/posts?limit=201").status_code == 422
assert len(client.get("/posts?limit=1").json()) == 1
tag = post("/tags", {"label": "Athena"})
post("/post_tags", {"posts_id": post_row["id"], "tags_id": tag["id"]})
join_path = f"/post_tags/{post_row['id']}/{tag['id']}"
assert client.get(join_path).status_code == 200
post("/post_tags", {"posts_id": post_row["id"], "tags_id": tag["id"]}, 409)
post("/comments", {"id": 12345, "post_id": post_row["id"], "body": "Comment"})
assert client.delete(f"/users/{user['id']}").status_code == 409
assert client.delete(f"/posts/{post_row['id']}").status_code == 204
assert client.get(join_path).status_code == 404
assert client.get("/comments/12345").status_code == 404
assert client.delete(f"/users/{user['id']}").status_code == 204
assert client.get(f"/users/{user['id']}").status_code == 404

command.downgrade(config, "base")
command.upgrade(config, "head")
assert client.get("/users").json() == []
print("PASS: migrations up/down/up, metadata parity, CRUD, defaults, validation, composite keys, RESTRICT and CASCADE")
