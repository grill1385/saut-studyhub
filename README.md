# SAUT StudyHub

Plataforma de estudo para a UC **Sistemas Autónomos** (MEEC — Automação e Robótica).
Aplicação estática (HTML + CSS + JavaScript puro), sem build e sem dependências externas.

## Abrir

- **Online:** https://grill1385.github.io/saut-studyhub/
- **Local:** clonar o repositório e abrir `index.html` no browser.

```bash
git clone https://github.com/grill1385/saut-studyhub.git
cd saut-studyhub
# abrir index.html
```

## Estrutura

```
index.html            Página única (SPA por hash routing)
css/style.css         Estilos
js/app.js             Lógica da aplicação (router, quizzes, progresso, grafo)
js/data/meta.js       Metadados dos milestones
js/data/topics.js     Índice de tópicos
js/data/graph.js      Grafo de conhecimento
js/data/m0..m7.js     Conteúdo de cada milestone
assets/slides/        Slides das aulas teóricas (PNG por capítulo)
PLANO_IMPLEMENTACAO.md  Plano de desenvolvimento e estado do conteúdo
```

## Progresso de estudo

O progresso é guardado no `localStorage` do browser, ou seja, **é local a cada máquina**.
Para transferir entre PCs usar `⚙ Definições → Exportar progresso` / `Importar progresso`.

## Notas

- Não há passo de build: qualquer alteração aos ficheiros reflete-se ao recarregar a página.
- Os módulos M5–M7 estão como stub e serão preenchidos (ver `PLANO_IMPLEMENTACAO.md`).
