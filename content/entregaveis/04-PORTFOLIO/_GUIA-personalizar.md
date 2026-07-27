# Guia: personalizar o seu portfólio (5 minutos)

> Você recebeu um portfólio **pronto** (`index.html`). Aqui você só troca os seus dados e ele já é seu.
> Não precisa saber programar. Abra o `index.html` no bloco de notas, no VS Code ou no Claude Code.

---

## O que trocar (use Ctrl+F pra achar cada um)

| Ache com Ctrl+F | Troque por | Aparece em |
|---|---|---|
| `[SEU NOME]` | seu nome | topo, "quem sou", rodapé, título da aba |
| `[SUA CIDADE]` | sua cidade | título, textos, dados do Google |
| `SEU_WHATSAPP` | seu número **só com números**, país e DDD (ex: `5585999998888`) | todos os botões de WhatsApp |
| `[SEU EMAIL]` | seu e-mail (ou apague a linha do e-mail no rodapé) | rodapé |
| `[PLACEHOLDER: sua foto aqui]` | (opcional) uma foto sua | seção "Quem sou" |
| `[PLACEHOLDER: print do projeto]` | (opcional) um print de cada projeto | seção "Projetos" |

> **Atenção no WhatsApp:** o número vai **sem** `+`, **sem** espaço e **sem** traço. Só números.
> Ex: `5585999998888` (55 = Brasil, 85 = DDD, resto = número).

---

## Os seus projetos

O portfólio já vem com 3 **projetos de demonstração** (barbearia, clínica, advocacia). Você pode:

- **Manter** como estão (são demonstrações honestas do seu padrão, você recebeu esses templates), ou
- **Trocar** pelos seus: procure `Site de barbearia`, `Site de clínica`, `Site de advocacia` e mude o
  nome e a linha de descrição. Se você tiver um print do projeto, troque o bloco cinza
  `[PLACEHOLDER: print do projeto]` por uma imagem. Pra adicionar mais, copie um bloco
  `<article class="hv-card">` inteiro e cole em seguida.

> **Regra de honestidade:** se é um projeto de demonstração (você fez pra treinar, sem cliente pago),
> mantenha a marca **"Projeto de demonstração"**. Nunca diga que foi trabalho pago. Prova de
> capacidade fecha mais que case inventado.

---

## Trocar a cor (opcional, avançado)

O portfólio usa um verde-esmeralda como cor principal. Ela aparece nos códigos `#0b6b5b` (tom principal)
e `#073d34` (tom escuro, usado ao passar o mouse). Se quiser outra cor, use Ctrl+H (substituir tudo):
troque `#0b6b5b` pela sua cor e `#073d34` por um tom mais escuro dela. É opcional, o padrão já fica bom.

---

## Antes de publicar, confira

- [ ] Não sobrou nenhum `[SEU NOME]`, `[SUA CIDADE]`, `SEU_WHATSAPP` no arquivo (Ctrl+F pra ter certeza).
- [ ] Clicou num botão de WhatsApp e abriu **a sua** conversa.
- [ ] Abriu no **celular** e está tudo legível, sem rolar pro lado.

Deu tudo certo? Vai pro **`_GUIA-publicar-github-pages.md`** pra colocar no ar.
