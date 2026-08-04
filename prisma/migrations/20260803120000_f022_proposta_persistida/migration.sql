-- F022 — entidade Proposta (persistência + PDF + Pipeline).

CREATE TABLE "proposta" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "oportunidade_id" TEXT,
    "versao" INTEGER NOT NULL,
    "resumo" TEXT NOT NULL,
    "escopo" JSONB NOT NULL,
    "entregaveis" JSONB NOT NULL,
    "prazo_estimado" TEXT NOT NULL,
    "observacoes" TEXT NOT NULL DEFAULT '',
    "faixa_min" INTEGER NOT NULL,
    "faixa_max" INTEGER NOT NULL,
    "servicos" JSONB NOT NULL,
    "texto_copiavel" TEXT NOT NULL,
    "enviada" BOOLEAN NOT NULL DEFAULT false,
    "enviada_em" TIMESTAMP(3),
    "gerado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposta_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "proposta_user_id_idx" ON "proposta"("user_id");
CREATE INDEX "proposta_lead_id_idx" ON "proposta"("lead_id");
CREATE INDEX "proposta_oportunidade_id_idx" ON "proposta"("oportunidade_id");
CREATE UNIQUE INDEX "proposta_lead_id_versao_key" ON "proposta"("lead_id", "versao");

ALTER TABLE "proposta" ADD CONSTRAINT "proposta_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposta" ADD CONSTRAINT "proposta_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposta" ADD CONSTRAINT "proposta_oportunidade_id_fkey" FOREIGN KEY ("oportunidade_id") REFERENCES "oportunidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
