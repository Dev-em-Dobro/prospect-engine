-- F021 — Pipeline / CRM do Builder

CREATE TYPE "EstagioOportunidade" AS ENUM (
  'novo',
  'abordado',
  'qualificando',
  'proposta',
  'fechado',
  'producao',
  'entregue',
  'recorrencia'
);

CREATE TYPE "StatusOportunidade" AS ENUM ('open', 'won', 'lost');

CREATE TYPE "OrigemOportunidade" AS ENUM ('orion', 'manual', 'indicacao');

CREATE TABLE "oportunidade" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "lead_id" TEXT,
  "nome_negocio" TEXT NOT NULL,
  "contato" TEXT,
  "whatsapp" TEXT,
  "cidade" TEXT,
  "nicho" TEXT,
  "website" TEXT,
  "origem" "OrigemOportunidade" NOT NULL DEFAULT 'orion',
  "estagio" "EstagioOportunidade" NOT NULL DEFAULT 'novo',
  "valor" DECIMAL(10,2),
  "status" "StatusOportunidade" NOT NULL DEFAULT 'open',
  "motivo_perda" TEXT,
  "fechado_em" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "oportunidade_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tarefa_oportunidade" (
  "id" TEXT NOT NULL,
  "oportunidade_id" TEXT NOT NULL,
  "estagio" "EstagioOportunidade" NOT NULL,
  "titulo" TEXT NOT NULL,
  "entregavel_slug" TEXT,
  "concluida" BOOLEAN NOT NULL DEFAULT false,
  "concluida_em" TIMESTAMP(3),
  "ordem" INTEGER NOT NULL,
  CONSTRAINT "tarefa_oportunidade_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "nota_oportunidade" (
  "id" TEXT NOT NULL,
  "oportunidade_id" TEXT NOT NULL,
  "corpo" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nota_oportunidade_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "oportunidade_user_id_idx" ON "oportunidade"("user_id");
CREATE INDEX "oportunidade_user_id_status_idx" ON "oportunidade"("user_id", "status");
CREATE INDEX "oportunidade_user_id_estagio_idx" ON "oportunidade"("user_id", "estagio");
CREATE INDEX "oportunidade_lead_id_idx" ON "oportunidade"("lead_id");
CREATE INDEX "tarefa_oportunidade_oportunidade_id_idx" ON "tarefa_oportunidade"("oportunidade_id");
CREATE INDEX "nota_oportunidade_oportunidade_id_idx" ON "nota_oportunidade"("oportunidade_id");

ALTER TABLE "oportunidade"
  ADD CONSTRAINT "oportunidade_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "oportunidade"
  ADD CONSTRAINT "oportunidade_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tarefa_oportunidade"
  ADD CONSTRAINT "tarefa_oportunidade_oportunidade_id_fkey"
  FOREIGN KEY ("oportunidade_id") REFERENCES "oportunidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nota_oportunidade"
  ADD CONSTRAINT "nota_oportunidade_oportunidade_id_fkey"
  FOREIGN KEY ("oportunidade_id") REFERENCES "oportunidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
