import { zipSync, strToU8 } from "fflate";
import type { Attribute, Entity, Schema } from "../model/schema";
import { mcdToMld, type LogicalSchema } from "../transforms/mcd-to-mld";
import { columnDefault, generateSQL, validateNames } from "./sql";

const py = (value: string) => JSON.stringify(value);
const cls = (e: Entity) => "Entity_" + e.name;
function saType(a: Attribute) {
  return {
    UUID: "sa.Uuid()",
    INTEGER: "sa.Integer()",
    BIGINT: "sa.BigInteger()",
    SERIAL: "sa.Integer()",
    VARCHAR: "sa.String(" + (a.length ?? 255) + ")",
    TEXT: "sa.Text()",
    BOOLEAN: "sa.Boolean()",
    DATE: "sa.Date()",
    TIMESTAMP: "sa.DateTime()",
    NUMERIC: "sa.Numeric(" + (a.precision ?? 18) + ", " + (a.scale ?? 2) + ")",
    JSONB: "JSONB()",
  }[a.type];
}
const pythonType = (a: Attribute) =>
  ({
    UUID: "UUID",
    INTEGER: "int",
    BIGINT: "int",
    SERIAL: "int",
    VARCHAR: "str",
    TEXT: "str",
    BOOLEAN: "bool",
    DATE: "date",
    TIMESTAMP: "datetime",
    NUMERIC: "Decimal",
    JSONB: "Any",
  })[a.type];
function column(s: LogicalSchema, e: Entity, a: Attribute, migration = false) {
  const def = columnDefault(s, e, a);
  const args = [py(a.name), saType(a)];
  if (a.type === "SERIAL") args.push("sa.Identity()");
  if (a.isPrimaryKey) args.push("primary_key=True");
  args.push("nullable=" + (a.nullable && !a.isPrimaryKey ? "True" : "False"));
  if (a.unique) args.push("unique=True");
  if (a.type !== "SERIAL" && ["INTEGER", "BIGINT"].includes(a.type))
    args.push("autoincrement=False");
  if (def) args.push("server_default=sa.text(" + py(def) + ")");
  return (
    (migration ? "" : a.name + " = ") + "sa.Column(" + args.join(", ") + ")"
  );
}
function schemaFile(s: LogicalSchema, e: Entity) {
  const nonnull = e.attributes
    .filter((a) => !a.nullable || a.isPrimaryKey)
    .map((a) => a.name);
  const field = (a: Attribute, mode: "create" | "read" | "update") => {
    const optional =
      mode === "update" ||
      (mode === "create" &&
        (a.nullable || a.type === "SERIAL" || !!columnDefault(s, e, a)));
    const type =
      pythonType(a) +
      ((a.nullable || optional) && a.type !== "JSONB" ? " | None" : "");
    return (
      "    " +
      a.name +
      ": " +
      type +
      " = Field(" +
      (optional ? "None" : "...") +
      (a.type === "VARCHAR" ? ", max_length=" + (a.length ?? 255) : "") +
      ")"
    );
  };
  const guard =
    '\n    @model_validator(mode="after")\n    def reject_explicit_nulls(self):\n        for name in ' +
    py(nonnull.join("|")) +
    '.split("|"):\n            if name in self.model_fields_set and getattr(self, name, None) is None:\n                raise ValueError(f"{name} cannot be null")\n        return self\n';
  return (
    "from datetime import date, datetime\nfrom decimal import Decimal\nfrom typing import Any\nfrom uuid import UUID\n\nfrom pydantic import BaseModel, ConfigDict, Field, model_validator\n\n\nclass " +
    cls(e) +
    'Base(BaseModel):\n    model_config = ConfigDict(extra="forbid")\n\n' +
    e.attributes.map((a) => field(a, "create")).join("\n") +
    "\n" +
    guard +
    "\n\nclass " +
    cls(e) +
    "Create(" +
    cls(e) +
    "Base):\n    pass\n\n\nclass " +
    cls(e) +
    "Read(BaseModel):\n    model_config = ConfigDict(from_attributes=True)\n\n" +
    e.attributes.map((a) => field(a, "read")).join("\n") +
    "\n\n\nclass " +
    cls(e) +
    'Update(BaseModel):\n    model_config = ConfigDict(extra="forbid")\n\n' +
    e.attributes
      .filter((a) => !a.isPrimaryKey)
      .map((a) => field(a, "update"))
      .join("\n") +
    "\n" +
    guard
  );
}
function routerFile(e: Entity) {
  const keys = e.attributes.filter((a) => a.isPrimaryKey);
  const path = "/" + keys.map((a) => "{pk_" + a.name + "}").join("/");
  const params = keys
    .map((a) => "pk_" + a.name + ": " + pythonType(a))
    .join(", ");
  const identity =
    keys.length === 1
      ? "pk_" + keys[0]!.name
      : "(" + keys.map((a) => "pk_" + a.name).join(", ") + ")";
  return (
    "from datetime import date, datetime\nfrom decimal import Decimal\nfrom uuid import UUID\n\nfrom fastapi import APIRouter, HTTPException, Query, Response\nfrom sqlalchemy import select\nfrom sqlalchemy.exc import IntegrityError\n\nfrom app.database import SessionDep\nfrom app.models." +
    e.name +
    " import " +
    cls(e) +
    "\nfrom app.schemas." +
    e.name +
    " import " +
    cls(e) +
    "Create, " +
    cls(e) +
    "Read, " +
    cls(e) +
    "Update\n\nrouter = APIRouter(prefix=" +
    py("/" + e.name) +
    ", tags=[" +
    py(e.name) +
    "])\n\n\ndef find_row(session, identity):\n    row = session.get(" +
    cls(e) +
    ', identity)\n    if row is None:\n        raise HTTPException(status_code=404, detail="Row not found")\n    return row\n\n\ndef commit(session):\n    try:\n        session.commit()\n    except IntegrityError:\n        session.rollback()\n        raise HTTPException(status_code=409, detail="Constraint violation") from None\n\n\n@router.get("", response_model=list[' +
    cls(e) +
    "Read])\ndef list_rows(session: SessionDep, offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200)):\n    statement = select(" +
    cls(e) +
    ").order_by(" +
    keys.map((a) => cls(e) + "." + a.name).join(", ") +
    ').offset(offset).limit(limit)\n    return session.scalars(statement).all()\n\n\n@router.post("", response_model=' +
    cls(e) +
    "Read, status_code=201)\ndef create_row(payload: " +
    cls(e) +
    "Create, session: SessionDep):\n    row = " +
    cls(e) +
    "(**payload.model_dump(exclude_unset=True))\n    session.add(row)\n    commit(session)\n    session.refresh(row)\n    return row\n\n\n@router.get(" +
    py(path) +
    ", response_model=" +
    cls(e) +
    "Read)\ndef read_row(" +
    params +
    ", session: SessionDep):\n    return find_row(session, " +
    identity +
    ")\n\n\n@router.put(" +
    py(path) +
    ", response_model=" +
    cls(e) +
    "Read)\n@router.patch(" +
    py(path) +
    ", response_model=" +
    cls(e) +
    "Read)\ndef update_row(" +
    params +
    ", payload: " +
    cls(e) +
    "Update, session: SessionDep):\n    row = find_row(session, " +
    identity +
    ")\n    for name, value in payload.model_dump(exclude_unset=True).items():\n        setattr(row, name, value)\n    commit(session)\n    session.refresh(row)\n    return row\n\n\n@router.delete(" +
    py(path) +
    ", status_code=204)\ndef delete_row(" +
    params +
    ", session: SessionDep):\n    session.delete(find_row(session, " +
    identity +
    "))\n    commit(session)\n    return Response(status_code=204)\n"
  );
}
export function generateFastAPI(input: Schema): Record<string, string> {
  const s = mcdToMld(input);
  validateNames(s);
  for (const e of s.entities)
    for (const a of e.attributes) {
      if (a.isPrimaryKey && a.type === "JSONB")
        throw new Error(
          e.name +
            "." +
            a.name +
            " : utilisez une clé scalaire pour les routes CRUD.",
        );
      if (a.type === "SERIAL" && a.defaultValue?.trim())
        throw new Error(
          "SERIAL fournit déjà un défaut : retirez celui de " +
            e.name +
            "." +
            a.name +
            ".",
        );
    }
  const files: Record<string, string> = {};
  const put = (path: string, value: string) => {
    files["backend/" + path] = value;
  };
  put("app/__init__.py", "");
  put("app/schemas/__init__.py", "");
  put("app/routers/__init__.py", "");
  put(
    "app/models/__init__.py",
    s.entities
      .map((e) => "from app.models." + e.name + " import " + cls(e))
      .join("\n") + "\n",
  );
  for (const e of s.entities) {
    const fks = s.foreignKeys.filter((f) => f.targetEntityId === e.id);
    const constraints: string[] = [],
      references: string[] = [];
    for (const fk of fks) {
      const parent = s.entities.find((t) => t.id === fk.sourceEntityId)!;
      const locals = fk.targetColumnIds.map((id) =>
        e.attributes.find((a) => a.id === id)!,
      );
      const remotes = fk.sourceColumnIds.map((id) =>
        parent.attributes.find((a) => a.id === id)!,
      );
      const index = s.foreignKeys.indexOf(fk);
      constraints.push(
        "sa.ForeignKeyConstraint([" +
          locals.map((a) => py(a.name)).join(", ") +
          "], [" +
          remotes.map((a) => py(parent.name + "." + a.name)).join(", ") +
          "], name=" +
          py("fk_athena_" + index) +
          ", ondelete=" +
          py(fk.onDelete) +
          ")",
      );
      if (fk.unique)
        constraints.push(
          "sa.UniqueConstraint(" +
            locals.map((a) => py(a.name)).join(", ") +
            ", name=" +
            py("uq_athena_" + index) +
            ")",
        );
      references.push(
        "    ref_" +
          index +
          " = relationship(" +
          py(cls(parent)) +
          ", foreign_keys=[" +
          locals.map((a) => a.name).join(", ") +
          "]" +
          (parent.id === e.id
            ? ", remote_side=[" + remotes.map((a) => a.name).join(", ") + "]"
            : "") +
          ", viewonly=True)",
      );
    }
    put(
      "app/models/" + e.name + ".py",
      "import sqlalchemy as sa\nfrom sqlalchemy.dialects.postgresql import JSONB\nfrom sqlalchemy.orm import relationship\n\nfrom app.database import Base\n\n\nclass " +
        cls(e) +
        "(Base):\n    __tablename__ = " +
        py(e.name) +
        "\n" +
        (constraints.length
          ? "    __table_args__ = (\n" +
            constraints.map((c) => "        " + c + ",").join("\n") +
            "\n    )\n"
          : "") +
        "\n" +
        e.attributes.map((a) => "    " + column(s, e, a)).join("\n") +
        "\n\n" +
        references.join("\n") +
        "\n",
    );
    put("app/schemas/" + e.name + ".py", schemaFile(s, e));
    put("app/routers/" + e.name + ".py", routerFile(e));
  }
  put(
    "app/database.py",
    'import os\nfrom collections.abc import Generator\nfrom typing import Annotated\n\nfrom dotenv import load_dotenv\nfrom fastapi import Depends\nfrom sqlalchemy import create_engine\nfrom sqlalchemy.orm import DeclarativeBase, Session, sessionmaker\n\nload_dotenv()\nDATABASE_URL = os.environ.get("DATABASE_URL")\nif not DATABASE_URL:\n    raise RuntimeError("Set DATABASE_URL in .env before starting the application")\nengine = create_engine(DATABASE_URL, pool_pre_ping=True)\nSessionLocal = sessionmaker(bind=engine, expire_on_commit=False)\n\n\nclass Base(DeclarativeBase):\n    pass\n\n\ndef get_session() -> Generator[Session, None, None]:\n    with SessionLocal() as session:\n        yield session\n\n\nSessionDep = Annotated[Session, Depends(get_session)]\n',
  );
  put(
    "app/main.py",
    "from fastapi import FastAPI\n\n" +
      s.entities
        .map(
          (e) =>
            "from app.routers." + e.name + " import router as router_" + e.name,
        )
        .join("\n") +
      "\n\napp = FastAPI(title=" +
      py(input.name) +
      ")\n\n" +
      s.entities
        .map((e) => "app.include_router(router_" + e.name + ")")
        .join("\n") +
      '\n\n\n@app.get("/health", tags=["health"])\ndef health():\n    return {"status": "ok"}\n',
  );
  const create = s.entities
    .map(
      (e) =>
        "    op.create_table(" +
        py(e.name) +
        ",\n" +
        e.attributes
          .map((a) => "        " + column(s, e, a, true) + ",")
          .join("\n") +
        "\n    )",
    )
    .join("\n");
  const add = s.foreignKeys
    .map((fk, i) => {
      const src = s.entities.find((e) => e.id === fk.sourceEntityId)!,
        dst = s.entities.find((e) => e.id === fk.targetEntityId)!;
      const local = fk.targetColumnIds
          .map((id) => py(dst.attributes.find((a) => a.id === id)!.name))
          .join(", "),
        remote = fk.sourceColumnIds
          .map((id) => py(src.attributes.find((a) => a.id === id)!.name))
          .join(", ");
      return (
        "    op.create_foreign_key(" +
        py("fk_athena_" + i) +
        ", " +
        py(dst.name) +
        ", " +
        py(src.name) +
        ", [" +
        local +
        "], [" +
        remote +
        "], ondelete=" +
        py(fk.onDelete) +
        ")" +
        (fk.unique
          ? "\n    op.create_unique_constraint(" +
            py("uq_athena_" + i) +
            ", " +
            py(dst.name) +
            ", [" +
            local +
            "])"
          : "")
      );
    })
    .join("\n");
  const drop = [...s.foreignKeys]
    .reverse()
    .map(
      (fk) =>
        "    op.drop_constraint(" +
        py("fk_athena_" + s.foreignKeys.indexOf(fk)) +
        ", " +
        py(s.entities.find((e) => e.id === fk.targetEntityId)!.name) +
        ', type_="foreignkey")',
    )
    .join("\n");
  put(
    "alembic/versions/0001_initial.py",
    '"""Initial schema generated by Athena."""\nfrom alembic import op\nimport sqlalchemy as sa\nfrom sqlalchemy.dialects.postgresql import JSONB\n\nrevision = "0001"\ndown_revision = None\nbranch_labels = None\ndepends_on = None\n\n\ndef upgrade():\n' +
      create +
      "\n" +
      add +
      "\n\n\ndef downgrade():\n" +
      (drop ? drop + "\n" : "") +
      [...s.entities]
        .reverse()
        .map((e) => "    op.drop_table(" + py(e.name) + ")")
        .join("\n") +
      "\n",
  );
  put(
    "alembic/env.py",
    "from alembic import context\nfrom app.database import Base, engine\nimport app.models  # Register generated tables for migration discovery.\n\ntarget_metadata = Base.metadata\n\nif context.is_offline_mode():\n    context.configure(url=engine.url, target_metadata=target_metadata, literal_binds=True, compare_type=True)\n    with context.begin_transaction():\n        context.run_migrations()\nelse:\n    with engine.connect() as connection:\n        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)\n        with context.begin_transaction():\n            context.run_migrations()\n",
  );
  put(
    "alembic/script.py.mako",
    '"""${message}"""\nfrom alembic import op\nimport sqlalchemy as sa\n${imports if imports else ""}\nrevision = ${repr(up_revision)}\ndown_revision = ${repr(down_revision)}\nbranch_labels = ${repr(branch_labels)}\ndepends_on = ${repr(depends_on)}\n\ndef upgrade():\n    ${upgrades if upgrades else "pass"}\n\ndef downgrade():\n    ${downgrades if downgrades else "pass"}\n',
  );
  put(
    "alembic.ini",
    "[alembic]\nscript_location = %(here)s/alembic\nprepend_sys_path = .\npath_separator = os\n",
  );
  put(
    "requirements.txt",
    "fastapi>=0.115,<1\nuvicorn[standard]>=0.30,<1\nSQLAlchemy>=2.0,<2.1\npydantic>=2.9,<3\npsycopg[binary]>=3.2,<4\nalembic>=1.14,<2\npython-dotenv>=1.0,<2\n",
  );
  put(
    ".env.example",
    "DATABASE_URL=postgresql+psycopg://atlas:change_me_local@localhost:5432/atlas\nPOSTGRES_USER=atlas\nPOSTGRES_PASSWORD=change_me_local\nPOSTGRES_DB=atlas\nPOSTGRES_PORT=5432\nAPI_PORT=8000\n",
  );
  put(".gitignore", ".env\n.venv/\n__pycache__/\n*.pyc\n");
  put(".dockerignore", ".env\n.venv\n__pycache__\n.git\n");
  put(
    "Dockerfile",
    'FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]\n',
  );
  put(
    "docker-compose.yml",
    'services:\n  db:\n    image: postgres:17-alpine\n    environment:\n      POSTGRES_USER: ${POSTGRES_USER:-atlas}\n      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD in .env}\n      POSTGRES_DB: ${POSTGRES_DB:-atlas}\n    ports:\n      - "127.0.0.1:${POSTGRES_PORT:-5432}:5432"\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n    healthcheck:\n      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]\n      interval: 3s\n      timeout: 3s\n      retries: 20\n  api:\n    build: .\n    environment:\n      DATABASE_URL: postgresql+psycopg://${POSTGRES_USER:-atlas}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB:-atlas}\n    depends_on:\n      db:\n        condition: service_healthy\n    ports:\n      - "127.0.0.1:${API_PORT:-8000}:8000"\nvolumes:\n  postgres_data:\n',
  );
  put(
    "start.ps1",
    '$ErrorActionPreference = "Stop"\nSet-Location -LiteralPath $PSScriptRoot\nif (-not (Test-Path -LiteralPath ".env")) { Copy-Item -LiteralPath ".env.example" -Destination ".env" }\ndocker compose up --build\nif ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }\n',
  );
  put(
    "start.sh",
    '#!/usr/bin/env sh\nset -eu\ncd "$(dirname "$0")"\n[ -f .env ] || cp .env.example .env\nexec docker compose up --build\n',
  );
  put("schema.sql", generateSQL(input));
  put(
    "README.md",
    "# " +
      input.name.replace(/[\r\n]/g, " ") +
      "\n\nProjet FastAPI + PostgreSQL généré par Athena. Python 3.12+, Docker Compose.\n\n## Démarrage Docker\n\nWindows : ./start.ps1 · macOS/Linux : sh start.sh.\nOu copiez .env.example vers .env, puis lancez docker compose up --build.\nLa migration initiale est appliquée automatiquement. Documentation interactive : http://localhost:8000/docs.\n\n## Développement Python local\n\n    python -m venv .venv\n    # Windows : .venv\\Scripts\\activate\n    # macOS/Linux : source .venv/bin/activate\n    pip install -r requirements.txt\n    # Copier .env.example vers .env et adapter DATABASE_URL\n    docker compose up -d db\n    alembic upgrade head\n    uvicorn app.main:app --reload\n\nGET, POST, PUT/PATCH et DELETE pour chaque table ; listes paginées (offset, limit ≤ 200). Les clés composites utilisent plusieurs segments d’URL. PUT et PATCH appliquent les champs fournis, les clés primaires restent immuables. Les valeurs par défaut sont calculées par PostgreSQL ; omettez ces champs dans vos POST. Les contraintes violées retournent 409, les lignes absentes 404, les entrées invalides 422.\n\nLes relations N:N sont matérialisées par une table de jointure avec CRUD. Les attributs ORM ref_* permettent la navigation en lecture ; modifiez les clés étrangères pour changer une relation. Les migrations créent toutes les tables avant leurs clés étrangères pour accepter les cycles.\n\n## Évolution\n\nModifiez les modèles puis lancez alembic revision --autogenerate -m change, relisez la migration, et lancez alembic upgrade head. La commande alembic downgrade base détruit les tables : uniquement sur une base de test jetable.\n\nLes versions de dépendances sont bornées par majeure ; figez votre environnement validé avec pip freeze > requirements.lock.txt. Le SQL est une alternative à la migration initiale : ne lancez pas les deux sur la même base.\n\nCette base de développement expose un CRUD sans authentification. Ajoutez vos règles métier et votre authentification avant d’exposer une API publiquement. Les ports Docker sont liés à localhost. Ne commitez pas .env ; encodez les caractères réservés d’un mot de passe dans DATABASE_URL.\n",
  );
  return files;
}
export function zipProject(files: Record<string, string>): Uint8Array {
  return zipSync(
    Object.fromEntries(
      Object.entries(files).map(([name, content]) => [name, strToU8(content)]),
    ),
    { level: 6 },
  );
}
