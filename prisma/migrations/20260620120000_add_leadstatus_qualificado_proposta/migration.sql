-- AlterEnum
-- F010: dois estágios de negociação no funil de venda, entre `respondeu` e `ganho`.
-- `qualificado` = respondeu com fit/verba/intenção; `proposta` = orçamento enviado.
-- Aditivo e não-destrutivo; posicionados antes de `ganho` para manter a ordem do funil.
ALTER TYPE "LeadStatus" ADD VALUE 'qualificado' BEFORE 'ganho';
ALTER TYPE "LeadStatus" ADD VALUE 'proposta' BEFORE 'ganho';
