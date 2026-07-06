-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('novo', 'enriquecido', 'priorizado', 'contatado', 'respondeu', 'ganho', 'perdido');

-- CreateEnum
CREATE TYPE "TipoDor" AS ENUM ('SEM_SITE', 'SITE_LENTO', 'SEM_HTTPS', 'SEM_RESPOSTA_REVIEWS');

-- CreateEnum
CREATE TYPE "Severidade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "Canal" AS ENUM ('whatsapp', 'email');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "telefone" TEXT,
    "website" TEXT,
    "categoria" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'novo',
    "score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnostico" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "tem_site" BOOLEAN NOT NULL,
    "performance_mobile" INTEGER,
    "tem_https" BOOLEAN,
    "tempo_carregamento_ms" INTEGER,
    "executado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnostico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dor" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "tipo" "TipoDor" NOT NULL,
    "severidade" "Severidade" NOT NULL,
    "detalhes" TEXT NOT NULL,

    CONSTRAINT "Dor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outreach" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "canal" "Canal" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "gerado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Outreach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_place_id_key" ON "Lead"("place_id");

-- CreateIndex
CREATE INDEX "Diagnostico_lead_id_idx" ON "Diagnostico"("lead_id");

-- CreateIndex
CREATE INDEX "Dor_lead_id_idx" ON "Dor"("lead_id");

-- CreateIndex
CREATE INDEX "Outreach_lead_id_idx" ON "Outreach"("lead_id");

-- AddForeignKey
ALTER TABLE "Diagnostico" ADD CONSTRAINT "Diagnostico_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dor" ADD CONSTRAINT "Dor_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outreach" ADD CONSTRAINT "Outreach_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
