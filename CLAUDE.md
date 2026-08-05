# SAUTO StudyHub — contexto permanente

Este ficheiro é lido automaticamente em TODAS as sessões nesta pasta.
**Nunca pedir acesso ao repositório ao David — está sempre disponível aqui.**

## O que é

Dashboard estático (HTML/JS, sem build) para estudar a cadeira **Sistemas Autónomos (SAUTO)**,
5.º ano. Publicado via GitHub Pages (`.nojekyll` na raiz).

## Onde está o conteúdo

| Caminho | Conteúdo |
|---|---|
| `index.html` | entrada da app |
| `js/app*.js` | lógica do hub (v3 é a versão atual) |
| `js/grader.js` | avaliador de código Pascal do lado do cliente |
| `js/data/m0.js` … `m7.js` | módulos M0–M7 (versões `_full` = conteúdo completo) |
| `js/data/m3lab.js` | **labwork do M3** — títulos, contexto e enunciado das sub-tarefas 3.6.x |
| `js/data/lab3spec.js` | **specs do M3**: `starter`, `prelude`, `solution`, `tests`, `hints`, `signalHints` |
| `js/data/topics.js`, `graph.js`, `meta.js` | taxonomia e grafo de pré-requisitos |
| `tools/lab3_solution/*.pas` | soluções de referência em Pascal (SimTwo) |
| `tools/gen_lab3spec.py` | gera `lab3spec.js` a partir das soluções |
| `assets/slides/<tema>/page-NN.png` | slides das aulas em imagem |
| `PLANO_IMPLEMENTACAO.md` | roadmap do projeto |

## Como responder a perguntas do tipo "M<n>.<x>.<y>-Q<k>"

1. `grep` do id da sub-tarefa em `js/data/m<n>lab.js` para o enunciado.
2. Abrir a entrada correspondente em `js/data/lab3spec.js` (chave = `id`, ex. `followline`)
   para `solution`, `hints` e `signalHints`.
3. Confirmar contra `tools/lab3_solution/sol_*.pas`.

## Constantes do Lab 3 (robô mecanum, SimTwo)

`VEL_LIN_NOM=1`, `VEL_ANG_NOM=0.5`, `DIST_DA=0.2`, `TOL_FINDIST=0.02`,
`DIST_NEWPOSE=0.05`, `THETA_DA=THETA_NEWPOSE=15°`, `TOL_FINTHETA=1°`.
Desaceleração = velocidade nominal **/3**. `RotateRight=+1`, `RotateLeft=-1`.

**Ganho do termo corretor de aproximação à trajetória: `FollowLine` = 2, `FollowCircle` = 5.**

**Cuidado — inconsistência nas soluções de referência do professor:**
`sol_gotoXY.pas` usa `W := rotateToFinal*VEL_ANG_NOM` (e `/3` na desaceleração), mas
`sol_FollowLine.pas` e `sol_FollowCircle.pas` usam `W := rotateToFinal` **sem** `VEL_ANG_NOM`.
O avaliador compara numericamente com a referência, portanto em FollowLine/FollowCircle
não se multiplica por `VEL_ANG_NOM`. Não há justificação de controlo para a diferença.

`V`, `Vn` e `W` passados ao `MotorVel` são **normalizados** (frações de `Vmax`/`VnMax`/`Wmax`
lidos de `GetRCValue(14..16, 6)`), não velocidades físicas.

## Preferências do David

- Responder em **português de Portugal**, conciso e direto.
- Perguntar o nível de conhecimento prévio antes de explicar, se não for explícito.
