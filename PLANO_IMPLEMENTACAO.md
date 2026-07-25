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
- [ ] M5 conteúdo (stub) — PRÓXIMO PASSO: deck Loc_Validation (16 págs) + Lab5 PDF (SimTwo laser, validate_laser_measure, BeaconPoints — P4 e P6 do exame)
- [ ] M6–M7 conteúdo (stubs criados)

## 11. AVISO — escrita de ficheiros (sync Windows↔sandbox)
Reescrever/editar via ferramenta de ficheiros um .js JÁ EXISTENTE corrompe a cópia do sandbox
(truncagem ou padding com NULs; o lado Windows fica correto). Procedimento seguro para substituir
conteúdo de um ficheiro existente (ex.: stubs mX.js):
1. Write num FICHEIRO NOVO (ex. mX_full.js) — ficheiros novos sincronizam bem;
2. bash: `node --check mX_full.js && cat mX_full.js > mX.js` (escrita bash sincroniza bem nos 2 sentidos);
3. esvaziar o auxiliar via bash (`printf '// pode ser apagado\n' > mX_full.js`);
4. se aparecerem NULs no fim de um ficheiro: `python3 -c "d=open(f,'rb').read().rstrip(b'\x00'); open(f,'wb').write(d)"`.
Verificação padrão: node --check a todos os js + smoke test jsdom (ver histórico da sessão 2).
