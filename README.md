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
js/matlab.js          Interpretador de MATLAB com álgebra matricial
js/grader.js          Avaliador híbrido de código (estrutural + execução)
js/data/meta.js       Metadados dos milestones
js/data/topics.js     Índice de tópicos
js/data/graph.js      Grafo de conhecimento
js/data/m0..m7.js     Conteúdo de cada milestone
js/data/lab3spec.js   Testes/solução de referência da Labwork 3 (gerado)
js/data/m3lab.js      Labwork 3 com sub-tarefas de código avaliadas
js/data/lab4spec.js   Testes/solução de referência da Labwork 4 (gerado)
js/data/m4lab.js      Labwork 4 com sub-tarefas de código avaliadas
js/data/lab5spec.js   Testes/solução de referência da Labwork 5 (gerado)
js/data/m5lab.js      Labwork 5 com sub-tarefas de código avaliadas
tools/                Geradores das specs e testes (não fazem parte da app)
assets/slides/        Slides das aulas teóricas (PNG por capítulo)
PLANO_IMPLEMENTACAO.md  Plano de desenvolvimento e estado do conteúdo
```

## Progresso de estudo

O progresso é guardado no `localStorage` do browser, ou seja, **é local a cada máquina**.
Para transferir entre PCs usar `⚙ Definições → Exportar progresso` / `Importar progresso`.

## Labworks com código avaliado

Nas Labworks **3** e **5** (Pascal do SimTwo) e **4** (MATLAB), no último módulo de cada
milestone, escreves tu o código e carregas em **▶ Avaliar código**. O hub executa o teu código e o da
solução oficial do professor nos mesmos dados e compara os **valores produzidos**: velocidades
das rodas e estados das máquinas na Lab 3, matrizes e estimativas do EKF nas Labs 4 e 5,
clusters de pontos do laser na Lab 5.

Não tens de escrever igual ao professor: `if/else` em vez de `case`, `diag()` em vez de escrever
a matriz à mão, `while` em vez de `for`, outros nomes de variáveis — desde que o comportamento
seja o mesmo, passa. Há ainda testes de **desempenho** (o robô converge? o filtro converge?) para
as tarefas que não têm resposta única, como a sintonia de P e Q.

A solução do professor desbloqueia ao fim de 3 tentativas.

## Notas

- Não há passo de build: qualquer alteração aos ficheiros reflete-se ao recarregar a página.
- Os módulos M5–M7 estão como stub e serão preenchidos (ver `PLANO_IMPLEMENTACAO.md`).
