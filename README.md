# SAUT StudyHub

Plataforma de estudo para a UC **Sistemas Autónomos** (MEEC — Automação e Robótica).
Aplicação estática (HTML + CSS + JavaScript puro), sem build e sem dependências externas.

## Abrir

- **Online:** https://GRILLFEUP.github.io/saut-studyhub/ *(substituir pelo utilizador GitHub real)*
- **Local:** clonar o repositório e abrir `index.html` no browser.

```bash
git clone https://github.com/<utilizador>/saut-studyhub.git
cd saut-studyhub
# abrir index.html
```

## Estrutura

```
index.html            Página única (SPA por hash routing)
css/style.css         Estilos
js/app.js             Lógica da aplicação (router, quizzes, progresso, grafo)
js/pascal.js          Transpilador Pascal (subconjunto SimTwo) -> JavaScript
js/grader.js          Avaliador híbrido de código (estrutural + execução)
js/data/meta.js       Metadados dos milestones
js/data/topics.js     Índice de tópicos
js/data/graph.js      Grafo de conhecimento
js/data/m0..m7.js     Conteúdo de cada milestone
js/data/lab3spec.js   Testes/solução de referência da Labwork 3 (gerado)
js/data/m3lab.js      Labwork 3 com sub-tarefas de código avaliadas
assets/slides/        Slides das aulas teóricas (PNG por capítulo)
PLANO_IMPLEMENTACAO.md  Plano de desenvolvimento e estado do conteúdo
```

## Progresso de estudo

O progresso é guardado no `localStorage` do browser, ou seja, **é local a cada máquina**.
Para transferir entre PCs usar `⚙ Definições → Exportar progresso` / `Importar progresso`.

## Labworks com código avaliado

A partir da Labwork 3 (M3, último módulo) escreves as rotinas em Pascal e carregas em
**▶ Avaliar código**. O hub transpila o teu código, corre-o em casos unitários, de histerese e
de malha fechada, e compara os **sinais produzidos** com os da solução oficial do professor.
Não tens de escrever igual: `if/else` em vez de `case`, outros nomes, outra formulação — desde
que o comportamento seja o mesmo, passa. A solução do professor desbloqueia ao fim de 3 tentativas.

## Notas

- Não há passo de build: qualquer alteração aos ficheiros reflete-se ao recarregar a página.
- Os módulos M5–M7 estão como stub e serão preenchidos (ver `PLANO_IMPLEMENTACAO.md`).
