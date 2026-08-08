# SAUT StudyHub — Plano de Design e Implementação

> Documento de retoma: se a sessão for interrompida, ler este ficheiro + secção "Estado atual" no fim.

## 1. Objetivo
Plataforma de estudo interativa (localhost/file://) para a UC Sistemas Autónomos (época especial). Baseada no `SAUT_Plano_de_Estudo.docx` (pasta SAUTO). Fluxo: milestone ativa → módulos de ~30 min (teoria + exercícios) → labwork guiado interativo → milestone completa → desbloqueia a próxima.

## 2. Decisões acordadas com o utilizador (2026-07-09)
- **Stack:** HTML/CSS/JS vanilla, estático. Abre com duplo clique em `index.html` ou `python -m http.server`. Sem build, sem dependências.
- **Milestones:** 8 (M0 Fundamentos + M1–M7), estrutura do plano de estudo.
- **Ordem de preenchimento de conteúdo:** cronológica (M0 → M7). Sessão 1: plataforma + M0 + M1 completos; M2–M7 como stubs.
- **Progresso:** localStorage (chave `saut_progress_v1`) + botões Exportar/Importar JSON.
- **Idioma:** Português (PT-PT).

## 3. Estrutura de ficheiros
```
SAUTO/SAUT_StudyHub/
├── PLANO_IMPLEMENTACAO.md   ← este ficheiro
├── index.html               ← SPA única (carrega todos os js)
├── css/style.css
├── js/
│   ├── app.js               ← router, render, estado, pesquisa, progresso
│   └── data/
│       ├── meta.js          ← window.SAUT_META: lista de milestones (id, título, prioridade, cor, resumo, slides, examLinks)
│       ├── m0.js … m7.js    ← window.SAUT_CONTENT["mX"] = { modules: [...] }
└── assets/slides/<deck>/page-NN.png   ← páginas dos PDFs extraídas (pdftoppm, 110 dpi)
```
**IMPORTANTE:** dados em ficheiros `.js` (não `.json` via fetch) para funcionar com `file://`.

## 4. Modelo de dados (js/data/mX.js)
```js
window.SAUT_CONTENT["m1"] = { modules: [ MODULE, ... ] };

MODULE = {
  id: "m1-mod1", title: "...", minutes: 30, kind: "study" | "labwork",
  pages: [ PAGE, ... ]
}

// PAGE tipo teoria:
{ type: "theory", title: "...",
  html: "<p>… conteúdo …</p>",            // HTML livre; fórmulas em <span class='formula'> ou KaTeX-like unicode
  figures: [ { src: "assets/slides/deck/page-07.png",
               caption: "…", focus: "O que observar na figura" } ],
  slideRef: "KinematicsDynamics, págs. 5–8" }

// PAGE tipo quiz (avaliação contínua a meio/fim do módulo):
{ type: "quiz", title: "...",
  questions: [
    { kind: "mcq",   q: "…", options: ["A…","B…","C…","D…"], answer: 2, hint: "…", explain: "…" },
    { kind: "input", q: "…", answer: "0.2", tolerance: 0.01, unit: "m", hint: "…", explain: "…" },
    { kind: "flash", front: "…", back: "…" }   // flashcard auto-avaliado (Acertei/Falhei)
  ] }

// PAGE tipo labtask (só em módulos kind:"labwork"):
{ type: "labtask", title: "Sub-tarefa N", context: "<p>…enquadramento…</p>",
  q: "…pergunta…", kind: "input"|"mcq", options?, answer, tolerance?,
  hints: ["dica1","dica2"], solution: "<p>…solução direta explicada…</p>" }
```
Regra de conclusão de módulo: todas as páginas vistas **e** todos os quizzes/labtasks corretos (flashcards: marcados). Labtask permite "SOLUÇÃO DIRETA" (conta como concluído mas marcado `viaSolution`).

// PAGE labtask — kinds adicionais (v4, para labworks baseadas nas medições do UTILIZADOR):
{ type:"labtask", kind:"measure", store:"nome_var", unit:"m", title, context, q, hints:[...] }
   // guarda a medição do user em S.milestones[ms].vars[nome_var]; re-guardar com valor
   // diferente REPÕE automaticamente os calc do módulo que usem essa var
{ type:"labtask", kind:"calc", uses:["var1","var2"], tolPct:0.03 /*ou tolerance abs*/, unit,
  calc: function(v){ return v.var1 / v.var2; }, q, hints, solution }
   // valida contra a fórmula aplicada às MEDIÇÕES do user; feedback mostra o esperado
{ type:"labtask", kind:"code", title, context, q }
   // textarea; guarda em S.milestones[ms].code[modId]; consultável na página do
   // milestone (painel "📄 O teu código guardado") com botão copiar
REGRA para labworks futuras (M6/M7): SEMPRE que uma resposta dependa de valores lidos do
simulador/robô, usar measure+calc (nunca assumir valores de referência); terminar cada
labwork com uma página kind:"code".

## 5. Estado / progresso (localStorage `saut_progress_v1`)
```js
{ activeMilestone: "m1",
  milestones: { m0: { completed: false,
      modules: { "m0-mod1": { page: 3, seen: [0,1,2], quiz: { "p2q0": {ok:true} }, completed: false } } } } }
```
- Retomar: ao abrir módulo, saltar para `page` guardada.
- Desbloqueio: mX+1 desbloqueia quando mX.completed. Toggle "Modo livre" nas definições ignora bloqueios (guardado no estado).
- Export/Import: download/upload do JSON completo.

## 6. UI / Páginas (SPA, hash-router: #/dashboard, #/m1, #/m1/mod/m1-mod2)
1. **Dashboard:** cartões dos 8 milestones (cor por prioridade: ALTA+ vermelho, ALTA laranja, MÉDIA-ALTA amarelo, MÉDIA azul, BAIXA cinza), barra de progresso global, milestone ativa em destaque, pesquisa global.
2. **Página de milestone:** resumo do plano (objetivo, slides, tempo, ligação ao exame), barra de progresso detalhada por módulos (hover mostra conteúdos e págs. dos slides), lista de módulos (feito/ativo/bloqueado), botão "Continuar onde ficaste", pesquisa dentro do milestone.
3. **Vista de módulo:** subpáginas com botões ← →, indicador "pág. i/N", teoria com figuras (imagem da página do slide + legenda "foco"), quizzes com validação, dicas e explicação; labwork com fluxo COMEÇAR → subtarefas → dicas/solução.
4. **Pesquisa:** índice em memória (título+texto das páginas, strip HTML); resultados agrupados por milestone; filtro global ou milestone atual; clique navega para a página exata do módulo.

## 7. Conteúdo por milestone (fonte: SAUT_Plano_de_Estudo.docx)
| MS | Tema | Decks (págs) | Prioridade | Módulos previstos |
|----|------|--------------|-----------|-------------------|
| M0 | Fundamentos | Locomotion (17), Percep&Sensors (26) | MÉDIA | 4: Locomoção; Rodas/tração; Sensores+encoders; Laser/câmara. Sem labwork → "labwork" = mini-teste final |
| M1 | Odometria (Lab1, SimTwo) | KinematicsDynamics (36) | ALTA | 5: Cinemática diferencial; Encoders→K; Discretização fwd/centered + pose_update; Erro/slippage; + Labwork 1 guiado |
| M2 | Controlo diferencial (Lab2) | Traj_Control (30) | ALTA | 4 + Labwork 2 |
| M3 | Omni + trajetórias (Lab3) | Kinematics omni (8), Trajectories_Maps (63) | MÉDIA | 5 + Labwork 3 |
| M4 | EKF beacons (Lab4, Matlab) | Kalman (7), EKFBeacons (13), Lego (36), TrianTrilat (28), ExTriang (38) | ALTA+ | 7 + Labwork 4 |
| M5 | EKF laser + validação (Lab5) | Loc_Validation (16) | ALTA | 3 + Labwork 5 |
| M6 | Monte Carlo + Map Matching | Prob_Localization (23), Map_Matching (27) | MÉDIA-ALTA | 4 + mini-teste |
| M7 | SLAM/Multi-robô/reais (Labs 6-7) | SLAM (38), MultiRobot (12), Drone (8) | BAIXA | 4 + Labwork 6/7 (checklist guiado) |

Perguntas do exame modelo (mapa no docx, Tabela 10) devem aparecer como exercícios nos módulos respetivos. Perguntas de código (pose_update, validate_laser_measure, BeaconPoints, cálculo K) → labtasks tipo input/código.

## 8. Extração de figuras
`pdftoppm -png -r 110 <pdf> assets/slides/<deck>/page` → gera page-NN.png. Referenciar página inteira + campo `focus` a indicar onde olhar. Extrair apenas decks dos milestones já preenchidos (poupar espaço).

## 9. Pipeline para sessões futuras (como retomar)
1. Ler este ficheiro + `js/data/meta.js` + um `mX.js` já feito como exemplo de formato.
2. Extrair páginas do(s) deck(s) do próximo milestone (secção 8).
3. Ler o PDF do deck (Read/pdfplumber) e o PDF da labwork → escrever `js/data/mX.js` seguindo o schema (secção 4) e o plano (secção 7 + docx).
4. Substituir o stub, testar sintaxe (`node --check`), atualizar "Estado atual" abaixo.

## 10. Estado atual (atualizado 2026-07-09, sessão 2)
- [x] Plano de implementação
- [x] Plataforma (index.html, style.css, app.js, meta.js) — motor completo e testado (jsdom)
- [x] Figuras extraídas: Locomotion, Percep&Sensors, KinematicsDynamics, Traj_Control
- [x] M0 conteúdo completo (5 módulos)
- [x] M1 conteúdo completo (4 módulos, incl. Labwork 1 guiado)
- [x] M2 conteúdo completo (5 módulos, incl. Labwork 2 guiado)
- [x] M3 conteúdo completo (6 módulos, incl. Labwork 3 guiado; figuras trajmaps/ extraídas)
- [x] M4 conteúdo completo (7 módulos em 2 partes: 4.1 teoria+código [KF, ∇f, h/∇h/S, exercícios do ekf_1p_1p__V2.m, trian/trilat, Lego] e 4.2 Labwork 4 guiado). Figuras kalman/, ekfbeacons/, lego/, triantrilat/, extriang/ extraídas. NOTA: decks <10 págs → pdftoppm gera page-N.png sem zero — renomear para page-0N.png!
- [x] Features v3 (sessão 3): (1) códigos de referência automáticos e copiáveis em tudo — formato M4 / M4.3 / M4.3.2 / M4.3.2-Q1 (milestone.módulo.subpágina-questão, 1-based, derivados da posição nos arrays — NÃO renumerar módulos/páginas existentes sem avisar o utilizador!); (2) aba 📊 Stats (#/stats) — js/data/topics.js mapeia tópicos→módulos, XP/nível; (3) aba 🕸 Grafo (#/graph) — js/data/graph.js com 32 nós (summary HTML, fig opcional, modules p/ desbloqueio; nós de M5–M7 têm ms:"mX" e ficam 'stub' até o milestone ter conteúdo). v3.1: grafo é force-directed dinâmico (física repulsão+molas+gravidade, nós arrastáveis com pointer events, contido no viewBox 1000×620 sem scroll — x,y do graph.js são só posições iniciais).
- AO GERAR M5/M6/M7: atualizar também topics.js (trocar ms:"mX" por modules:[...]) e graph.js (preencher modules:[] dos nós val/mcl/mapm/slam/mrob).
- [x] M5 conteúdo completo (6 módulos, cobertura integral do deck Loc_Validation 16/16 págs + Labwork 5 guiada 8 sub-tarefas; P4/P6 do exame; topics.js e graph.js atualizados — nó 'val' desbloqueável)
- [x] v5 (sessão 4): motor de **avaliação automática de código** (`js/pascal.js`, `js/grader.js`)
  e **Labwork 3 reformulada** (`js/data/lab3spec.js` + `js/data/m3lab.js`, que substitui o
  m3-mod6 em runtime — `m3.js` não foi tocado). Ver secção 12.
  Testes: `tools/smoke_hub.js` (jsdom: carregamento, todas as vistas, fluxo de UI, oráculo) e
  `tools/test_graders.js` (semântica: oráculo + equivalentes passam, erros clássicos falham).
  Geradores das specs: `tools/gen_lab3spec.py` e `tools/gen_lab4spec.py`.
- [x] v6 (sessão 5): camada **MATLAB** (`js/matlab.js`) + grader estendido (harness `%%USER%%`,
  testes `assert`) + **Labwork 4 reformulada** (`js/data/lab4spec.js` + `js/data/m4lab.js`,
  substitui m4-mod7 em runtime; `m4.js` não foi tocado). 10 sub-tarefas. Ver secções 12.4/12.5.
- [x] v7 (sessão 6): álgebra matricial do SimTwo no `js/pascal.js` + **Labwork 5 reformulada**
  (`js/data/lab5spec.js` + `js/data/m5lab.js`, substitui m5-mod6 em runtime; `m5.js` intacto).
  7 sub-tarefas: odometria diferencial, laser→mundo, cluster→medida, associação, predição,
  atualização e sintonia. Ver secção 12.5.
- [ ] Lab 6 avaliável — ver tabela 12.6 (sem oráculo completo; ponderar avaliação só estrutural)
- [ ] M6 conteúdo (stub) — PRÓXIMO PASSO: decks SAUT_Prob_Localization (23 págs) + SAUT_Loc_Map_Matching (27 págs); sem lab dedicada → módulo final = mini-teste estilo M0. Perguntas exame: MCL/kidnap, rejeição outliers (já introduzida no m5-mod2!), map matching P14, landmarks lineares. Atualizar topics.js (mcl, mapm) e graph.js (nós mcl, mapm).
- [ ] M7 conteúdo (stub) — decks SLAM (38), MultiRobot (12), Drone (8) + Labs 6/7 (checklist guiado). Atualizar topics.js (slam, mrob) e graph.js (slam, mrob).

## 11. AVISO — escrita de ficheiros (sync Windows↔sandbox)
Reescrever/editar via ferramenta de ficheiros um .js JÁ EXISTENTE corrompe a cópia do sandbox
(truncagem ou padding com NULs; o lado Windows fica correto). Procedimento seguro para substituir
conteúdo de um ficheiro existente (ex.: stubs mX.js):
1. Write num FICHEIRO NOVO (ex. mX_full.js) — ficheiros novos sincronizam bem;
2. bash: `node --check mX_full.js && cat mX_full.js > mX.js` (escrita bash sincroniza bem nos 2 sentidos);
3. esvaziar o auxiliar via bash (`printf '// pode ser apagado\n' > mX_full.js`);
4. se aparecerem NULs no fim de um ficheiro: `python3 -c "d=open(f,'rb').read().rstrip(b'\x00'); open(f,'wb').write(d)"`.
Verificação padrão: node --check a todos os js + smoke test jsdom (ver histórico da sessão 2).


## 12. Avaliação automática de código nas labworks (v5, sessão 4)

**Motivação:** as pastas `SAUTO/Lab_3` … `Lab_6` incluem o *código de solução do professor*
(SimTwo `.pas`/`.spas`, MATLAB `.m`, C++). A partir da Lab 3 as labworks deixam de ser só
perguntas de input: o utilizador **escreve a rotina** e o hub **avalia-a**.

### 12.1 Arquitetura (3 camadas)
1. **`js/pascal.js`** — mini-transpilador do subconjunto de Pascal usado no SimTwo → JavaScript.
   Lexer + parser recursivo-descendente + codegen para `new Function`. Suporta `const`/`var`/
   `procedure`/`function` (incl. **parâmetros `var` por referência**, via caixas `{__v:…}`),
   `begin/end`, `if`, `case`, `for`, `while`, `repeat`, arrays, records, e uma API SimTwo
   mockada (`GetRCValue`/`SetRCValue`, `GetAxisOdo`, `NormalizeAngle`, `Deg`, `format`, …).
   Case-insensitive (tudo normalizado para minúsculas, como em Pascal).
   Guarda contra ciclos infinitos (`RT.__tick`, 4e6 passos).
   API: `SAUT_PASCAL.build(src, {globals, env})` → `{R, RT, G, env, call(nome, args)}`.
2. **`js/grader.js`** — avaliador híbrido.
   - *Estrutural*: regras regex sobre o código normalizado (`rules[]`), com `level:"error"|"warn"`.
   - *Execução*: compila o código do utilizador **e** a solução do professor com o mesmo
     `prelude`, corre ambos nos mesmos casos e compara **sinais** (`RC.V`, globais em `watch`,
     argumentos por referência em `watchArgs`, células em `watchCells`, valor de retorno).
   - *Malha fechada*: casos com `steps` simulam o robô omni (planta mecanum invertida a partir
     de `RC.V`) e comparam trajetórias — é o que verifica convergência e paragem.
   - `grade(task, src)` → `{ok, phase, passed, total, tests[], rules[], error}`;
     `pickHint(task, res)` escolhe a dica (regra `error` em falta → `signalHints` do sinal
     divergente → qualquer regra em falta).
3. **`js/data/lab3spec.js`** — `window.SAUT_LABSPEC["m3-mod6"][tarefa]` com
   `{entry, signature, starter, prelude, solution, globals, watch/watchArgs, sheet0, tests[],
   rules[], signalHints{}, hints[]}`. **GERADO** por `tools/gen_lab3spec.py` a partir de
   `SAUTO/Lab_3/SimTwo_Omni_sol_LabW_3.zip → RobotFactoryMecanum4Wheel/control.pas`
   (não editar à mão: reexecutar o gerador).

### 12.2 Novo tipo de página
```js
{ type:"labtask", kind:"codeeval", task:"gotoxy", title, q, context }
```
Renderizado por `labtaskHTML`; a spec vem de `labSpec(mod.id, pg.task)`.
Estado: `st.quiz[qid] = {ok, tries, report(HTML), revealed, viaSolution}`;
código do utilizador em `S.milestones[ms].codeTasks[task]`.
Solução do professor desbloqueia com `REVEAL_TRIES = 3` (constante no `app.js`).

### 12.3 Princípio de correção
Compara-se **comportamento, não texto**. Verificado com: solução do professor (passa),
reescritas equivalentes com `if/else`/`sign()`/outra matemática (passam), e erros clássicos
(`Vmax` fixado, falta de `NormalizeAngle`, histerese trocada — todos reprovados).
Os casos de teste incluem cenários desenhados de propósito para distinguir
`TOL_FINDIST` de `DIST_NEWPOSE` e `TOL_FINTHETA` de `THETA_NEWPOSE`.

### 12.4 Camada MATLAB (v6, Lab 4)

**`js/matlab.js`** — mini-interpretador de MATLAB (não é transpilador: avalia a AST
diretamente, porque a álgebra matricial obrigava a um runtime próprio de qualquer forma).
Classe `Mat` (row-major, mas indexação MATLAB column-major), operadores
`+ - * / \ ^ .* ./ .^ '`, indexação `A(i)`, `A(i,j)`, `A(:,j)`, `end`, atribuição indexada
com auto-crescimento, `if/for/while/break`, funções locais, multi-retorno `[a,b]=f(...)`.
Builtins incluem `inv`, `pinv`, `det`, `diag`, `eye`, `norm`, `mean`, `NormalizeAng`,
`randn`/`rand` **com semente fixa** (execuções reprodutíveis) e um `ode45` (RK4 de passo fixo,
8 subpassos) com `robot_5dpo` já registado. Comandos sem parênteses (`clear all`, `hold on`)
e chamadas gráficas (`plot`, `legend`, …) são no-op.
API: `SAUT_MATLAB.run(src, {ws, vars, seed})`, `fromJS`, `toJS`, `fmt`.

**Modelo de tarefa MATLAB** (diferente do Pascal — não há "entry", há um *harness*):
```js
{ lang:"matlab",
  harness: "…código MATLAB com o marcador %%USER%%…",
  solution: "…fragmento do professor…",
  capture: ["grad_f_X", "P", …],     // variáveis lidas do workspace e comparadas
  tests: [ {name, set:{v:1.2, dt:0.04, …}},                    // comparação com o oráculo
           {kind:"assert", name, check:function(cap){…}} ] }   // critério, sem oráculo
```
O `set` injeta variáveis no workspace **antes** do harness correr, portanto funciona mesmo
quando o fragmento do utilizador está no meio de um ciclo. Os testes `assert` servem para
tarefas sem resposta única (sintonia de P/Q: corre-se o filtro 300 iterações e exige-se
convergência), e estão disponíveis para as duas linguagens.

Spec: `js/data/lab4spec.js`, gerada por `tools/gen_lab4spec.py`. O gerador **verifica que cada
fragmento de referência existe mesmo** nos `.m` do professor (comparação sem comentários nem
espaços) antes de escrever — se alguém mexer nas soluções, o gerador falha em vez de gerar
silenciosamente um oráculo errado.

### 12.5 Camada matricial no Pascal (v7, Lab 5)

O `js/pascal.js` passou a expor a **álgebra matricial do SimTwo**, partilhando a classe `Mat`
do `js/matlab.js` quando disponível: `Mzeros`, `Meye`, `Mtran`, `MMult`, `Madd`, `Msub`, `Minv`,
`Mgetv`, `Msetv`, `MNumRows`, `MNumCols`, e a ponte com a folha de cálculo
(`RangeToMatrix(linha, col, nLin, nCol)` / `MatrixToRange(linha, col, M)`).
Juntou-se também `RandG` (com semente fixa) e `GetSensorValues` (devolve `env.laser`).

Correções ao transpilador feitas nesta sessão:
- `pi()` com parênteses (era resolvido como chamada a um número);
- chamadas a métodos de objeto (`Log.add(txt)`) deixam de rebentar em codegen;
- `initFor`: tipos desconhecidos (registos como `TPos`) passam a inicializar a `{}` em vez de `0`
  — era isto que impedia `MeasurePos.x := …` de funcionar.

Novidades no `js/grader.js`:
- testes `assert` também no caminho **Pascal** (`captureG` lê globais depois da execução);
- entradas matriciais nos casos de teste via `{__mat: [[…]]}`;
- `tc.laser` alimenta **e** `env.laser` (para `GetSensorValues`) **e** a global `LaserValues`;
- matrizes nos snapshots são convertidas para arrays aninhados antes da comparação.

> **Armadilha que já custou caro:** antes, se a *referência* rebentasse num caso de teste, o
> grader marcava-o como "ignorado" e contava-o como **passado** — a Lab 5 chegou a dar 4/4 com
> zero testes realmente executados. Agora um erro na referência aborta a avaliação com
> `phase:"interno"` e uma mensagem a dizer que o defeito é da spec. Não voltar a silenciar isto.

**Nota de precisão:** o professor faz as matrizes passarem pela folha com `format('%.4g')`, o que
corta para 4 algarismos significativos. As tarefas matriciais da Lab 5 usam por isso
`tolPct: 5e-3`, para não penalizar quem construa as matrizes diretamente com `Msetv`.

Spec: `js/data/lab5spec.js`, gerada por `tools/gen_lab5spec.py` (7 tarefas), que também **simula
os varrimentos do laser** (interseção raio–círculo com os três postes e as paredes) para os casos
de associação.

### 12.6 Como replicar para a Lab 6
| Lab | Solução disponível | O que falta construir |
|-----|--------------------|-----------------------|
| 6 | `Lab_6/SAUT_ESP_-_stud.zip` (parcial), `picoRobotSAUT.zip` | interpretador **C++** ou avaliação só estrutural; a solução do professor está incompleta, portanto não há oráculo fiável para metade das tarefas |

A Lab 6 é a única que falta e é a mais cara: exigiria um terceiro interpretador (C++) e, pior,
não há solução completa do professor para servir de oráculo. Alternativa realista: avaliação
**só estrutural** (regras + dicas), sem execução, deixando claro no módulo que ali não há
verificação de comportamento.
