-- AlterEnum
-- F009: tipo de Dor para Lead cuja presença é só agregador/perfil social.
-- O registro de Dor em si só é criado na F004; aqui o valor fica disponível.
ALTER TYPE "TipoDor" ADD VALUE 'SITE_AGREGADOR';

-- AlterTable
-- F009: marca quando o website do Lead é agregador link-in-bio ou perfil social
-- (não é site próprio). Aditivo e não-destrutivo; default false para Diagnósticos existentes.
ALTER TABLE "Diagnostico" ADD COLUMN     "site_e_agregador" BOOLEAN NOT NULL DEFAULT false;
