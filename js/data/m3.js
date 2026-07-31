// M3 — Lab 3: Robô omnidirecional + trajetórias e mapas
window.SAUT_CONTENT = window.SAUT_CONTENT || {};
window.SAUT_CONTENT["m3"] = { modules: [

/* ============ MÓDULO 1 — Cinemática omnidirecional ============ */
{ id:"m3-mod1", title:"Cinemática do robô omnidirecional", minutes:30, kind:"study",
  blurb:"3 e 4 rodas, rodas suecas, cinemática direta/inversa e odometria omni. Kinematics, págs. 12–23.",
  pages:[
  { type:"theory", title:"V, Vn e W: os 3 graus de liberdade",
    html:`<p>O robô omnidirecional controla <b>independentemente</b>:</p>
    <ul><li><b>V</b> — velocidade linear frontal</li>
    <li><b>Vn</b> — velocidade linear lateral (normal)</li>
    <li><b>W</b> — velocidade angular</li></ul>
    <p>3 DOF controláveis no plano → robô <b>holonómico</b>: pode transladar em qualquer direção enquanto roda. Configurações típicas: <b>3 rodas a 120°</b> ou <b>4 rodas</b> com rodas suecas/mecanum.</p>
    <div class="hl">Contraste com o diferencial (M1): lá só tens v e ω, e Vn≡0 (restrição não-holonómica). No omni, o controlo de posição e o de orientação ficam <i>desacoplados</i> — daí as DUAS máquinas de estados na Lab 3.</div>`,
    figures:[{src:"assets/slides/kinematics/page-13.png", caption:"Slide 13 — Robô omnidirecional de 3 rodas", focus:"a disposição das 3 rodas a 120° e os rolos que permitem deslizar na direção passiva"}],
    slideRef:"MobileRobotics_KinematicsDynamics, págs. 12–14" },

  { type:"theory", title:"Odometria omni: deslocamentos d e dn",
    html:`<p>Na odometria do omni, cada ciclo tem <b>dois</b> deslocamentos lineares: <code>Δd</code> (frontal) e <code>Δdn</code> (lateral), além de <code>Δθ</code>.</p>
    <p>Aproximação discreta <b>com ω = 0</b> (translação pura):</p>
    <span class="formula">x(i+1) = x(i) + Δd·cos(θ) − Δdn·sin(θ)<br>y(i+1) = y(i) + Δd·sin(θ) + Δdn·cos(θ)</span>
    <p>Com <b>ω ≠ 0</b> a expressão exata usa o arco (fatores sin(Δθ)/Δθ e (1−cos(Δθ))/Δθ com a orientação média θ+Δθ/2) — é a generalização da discretização centrada do M1.</p>
    <div class="hl">O essencial para o exame: no omni o deslocamento lateral <b>roda com θ</b> — o termo −Δdn·sin(θ) / +Δdn·cos(θ). Um erro comum é esquecer o sinal negativo no x.</div>`,
    figures:[{src:"assets/slides/kinematics/page-16.png", caption:"Slide 16 — Aproximação discreta omni", focus:"o caso w=0 (simples, memoriza) vs w≠0 (reconhece a estrutura, não decores tudo)"}],
    slideRef:"Kinematics, págs. 15–16" },

  { type:"theory", title:"4 rodas, rodas suecas e derrapagem",
    html:`<p><b>4 rodas omnidirecionais:</b> a cinemática inversa dá a velocidade de cada roda a partir de (V, Vn, W). Na direta, o sistema fica <b>sobredeterminado</b> (4 equações, 3 incógnitas) — resolve-se com a pseudo-inversa (Moore-Penrose).</p>
    <p>Consequência útil: existem <b>duas soluções para W</b> a partir das rodas — comparar as duas permite <b>detetar derrapagem</b>, ou fazer a média para obter um valor mais robusto ao ruído.</p>
    <p><b>Rodas suecas/mecanum:</b> a restrição de movimento de cada roda depende dos ângulos (α, β, γ); nas mecanum γ = π/4. Não precisas de decorar a derivação — fica com a estrutura: velocidade da roda = combinação linear de V, Vn e W.</p>
    <div class="hl">Preço do omni: mais derrapagem e vibração (rolos pequenos) → <b>odometria pior</b> que no diferencial. Mais uma razão para a fusão sensorial dos M4/M5.</div>`,
    figures:[{src:"assets/slides/kinematics/page-19.png", caption:"Slide 19 — Cinemática inversa 4 rodas", focus:"a nota sobre as 2 soluções de W: deteção de slippage ou média robusta"}],
    slideRef:"Kinematics, págs. 17–23" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"O que distingue um robô holonómico (omni) de um não-holonómico (diferencial)?",
      options:["Ter mais rodas","Poder controlar independentemente translação em qualquer direção e rotação (Vn ≠ 0)","Ser mais rápido","Ter encoders melhores"], answer:1,
      hint:"Pensa no estacionamento paralelo: o omni faz, o carro não (sem manobras).",
      explain:"O omni tem 3 DOF controláveis (V, Vn, W); o diferencial tem a restrição Vn=0." },
    { kind:"input", q:"Robô omni com θ=90° desloca-se Δd=0 e Δdn=0,1 m (lateral pura, ω=0). Qual é o incremento em x? (x += Δd·cosθ − Δdn·sinθ)",
      answer: -0.1, tolerance: 0.005, unit:"m",
      hint:"cos(90°)=0, sin(90°)=1 → Δx = −Δdn·1.",
      explain:"Δx = 0 − 0,1·1 = −0,1 m. Com o robô virado para +y, andar 'para a direita dele' é andar em −x global. O sinal negativo é a armadilha típica." },
    { kind:"mcq", q:"Num omni de 4 rodas, ter duas soluções para W a partir dos encoders serve para:",
      options:["Duplicar a resolução","Detetar derrapagem ou obter W mais robusto pela média","Poupar um encoder","Calibrar o diâmetro das rodas"], answer:1,
      explain:"Se as duas soluções divergem, alguma roda derrapou; se coerentes, a média reduz o ruído." },
    { kind:"flash", front:"Porque é que a odometria de um omni é pior que a de um diferencial?", back:"As rodas suecas/mecanum têm rolos que derrapam e vibram mais → mais erro aleatório. Compensa-se com localização absoluta (EKF, M4/M5)." }
  ]}
]},

/* ============ MÓDULO 2 — Controlo omni: duas máquinas de estados ============ */
{ id:"m3-mod2", title:"Controlo omni: GotoXY com 2 máquinas de estados", minutes:30, kind:"study",
  blurb:"Porquê duas FSM (linear + angular), FollowLine e FollowCircle omni, e a versão sem FSM. ★ Pergunta do exame.",
  pages:[
  { type:"theory", title:"Duas máquinas de estados ★",
    html:`<p>No diferencial (M2) uma única máquina sequenciava rodar→avançar, porque rodar e avançar usavam o <b>mesmo atuador</b> (as rodas) de forma acoplada.</p>
    <p>No omni, translação (V, Vn) e rotação (W) são <b>independentes</b> → usa-se <b>uma máquina de estados para o movimento linear</b> (aproximação e desaceleração à posição) e <b>outra para o movimento angular</b> (alinhamento com θf), a correr <b>em paralelo</b>.</p>
    <div class="exam">Pergunta do exame: "no controlo do robô omnidirecional usam-se duas máquinas de estados — uma para o movimento linear e outra para o angular". Sabe justificar: DOFs desacoplados → controlo paralelo, o robô roda ENQUANTO avança.</div>
    <p>Estados típicos de cada máquina: linear = GO / DE_ACCEL_LIN / STOP_LIN; angular = ROTATE / DE_ACCEL_ANG / STOP_ANG — com zonas de desaceleração como no M2.</p>`,
    slideRef:"Enunciado Lab 3 (procedure gotoXy) + Traj_Control" },

  { type:"theory", title:"GotoXY omni: decompor a velocidade",
    html:`<p>Para ir ao alvo, o vetor velocidade aponta do robô para (xf, yf), mas tem de ser expresso <b>no referencial do robô</b> (V frontal, Vn lateral):</p>
    <span class="formula">ang_alvo = atan2(yf−yr, xf−xr) − θr &nbsp;&nbsp;(direção do alvo no ref. do robô)<br>V = vel·cos(ang_alvo) &nbsp;&nbsp;&nbsp; Vn = vel·sin(ang_alvo)</span>
    <p>com <code>vel</code> a velocidade desejada (nominal, ou proporcional a erro_dist na desaceleração). Em paralelo, a máquina angular faz <code>W = K·(θf − θr)</code> normalizado.</p>
    <div class="hl">Repara: o omni NUNCA precisa de parar para rodar — a trajetória ao alvo é uma reta, mesmo com θ a variar. É o contraste-chave com o diferencial no exame.</div>`,
    slideRef:"Enunciado Lab 3, tarefa 1" },

  { type:"theory", title:"FollowLine e FollowCircle omni",
    html:`<p><b>FollowLine (tarefa 2):</b> mesma máquina do GotoXY, mudando as equações de velocidade nos estados Go_Forward e De_Accel_Lin: a componente <b>lateral</b> corrige a distância à linha (distanceToLine do M2!) enquanto a frontal avança ao longo dela.</p>
    <p><b>FollowCircle (tarefa 3):</b> círculo de centro (xc, yc) e raio R, percorrido no sentido anti-horário. O erro radial é:</p>
    <span class="formula">dist_ao_círculo = √((xr−xc)² + (yr−yc)²) − R</span>
    <p>— positivo fora, negativo dentro. A velocidade tangencial avança ao longo do círculo; a componente radial (lateral) anula esse erro.</p>
    <p><b>Tarefa 4:</b> repetir tudo <b>sem máquina de estados</b> — um único procedimento contínuo que controla V, Vn e W em simultâneo (leis proporcionais com saturação). No omni isto é natural, porque não há fases obrigatórias.</p>`,
    slideRef:"Enunciado Lab 3, tarefas 2–4" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"[Exame] Porque se usam DUAS máquinas de estados no GotoXY do robô omnidirecional?",
      options:["Porque o código fica mais curto","Porque translação e rotação são independentes (desacopladas) e controlam-se em paralelo","Porque o omni tem 4 rodas","Porque uma FSM não pode ter mais de 4 estados"], answer:1,
      hint:"Que grau de liberdade tem o omni que o diferencial não tem?",
      explain:"Uma FSM para o movimento linear (V, Vn) e outra para o angular (W). O robô roda enquanto avança — impossível no diferencial." },
    { kind:"input", q:"FollowCircle: centro (0,0), R = 2 m; o robô está em (3,4). Qual é a distância ao círculo em metros?",
      answer: 3, tolerance: 0.01, unit:"m",
      hint:"√(3²+4²) − 2.",
      explain:"√25 − 2 = 5 − 2 = 3 m (está fora do círculo; se desse negativo estaria dentro)." },
    { kind:"mcq", q:"No GotoXY omni, com o alvo a 45° à esquerda da frente do robô e vel = 1 m/s, os comandos são aproximadamente:",
      options:["V=1, Vn=0","V=0,71, Vn=0,71","V=0, Vn=1","V=0,5, Vn=0,5"], answer:1,
      hint:"V=vel·cos(45°), Vn=vel·sin(45°).",
      explain:"cos45°=sin45°≈0,707. O vetor velocidade aponta diretamente ao alvo, decomposto no referencial do robô." },
    { kind:"flash", front:"Porque é que a tarefa 4 (sem FSM) é natural no omni mas difícil no diferencial?", back:"No omni, V, Vn e W são independentes → leis contínuas simultâneas chegam. No diferencial, avançar e rodar partilham atuadores e há a restrição Vn=0 → é preciso sequenciar fases (FSM)." }
  ]}
]},

/* ============ MÓDULO 3 — Planeamento de caminhos: conceitos e métodos ============ */
{ id:"m3-mod3", title:"Planeamento: conceitos, Bug, roadmaps e células", minutes:35, kind:"study",
  blurb:"Path vs trajectory vs motion planning; Bug 1/2; visibility graph e Voronoi; decomposição em células. Trajectories_Maps, págs. 2–20.",
  pages:[
  { type:"theory", title:"Path, trajectory e motion planning",
    html:`<p>Três conceitos frequentemente confundidos:</p>
    <ul><li><b>Path planning</b> — descreve geometricamente o caminho do início ao destino, evitando obstáculos</li>
    <li><b>Trajectory planning</b> — o caminho <b>em função do tempo</b>: onde deve estar o robô em cada instante</li>
    <li><b>Motion planning</b> — acrescenta as <b>restrições cinemáticas e dinâmicas</b> do robô</li></ul>
    <p>Critérios de escolha de um método: o que se otimiza (comprimento, tempo, energia), a complexidade computacional, e a completude:</p>
    <ul><li><b>Completo</b> — encontra sempre solução se existir (e diz se não existe)</li>
    <li><b>Completo em resolução</b> — encontra solução para uma dada discretização do espaço</li>
    <li><b>Probabilisticamente completo</b> — P(encontrar) → 1 quando t → ∞</li></ul>
    <p>Outros fatores: offline vs online, um robô ou vários, obstáculos parados/móveis, robô holonómico ou não, restrições dinâmicas, obstáculos deformáveis.</p>`,
    slideRef:"SAUT_Trajectories_Maps, págs. 2–6" },

  { type:"theory", title:"Algoritmos Bug (ambiente desconhecido)",
    html:`<p>Para robôs <b>sem mapa</b>, guiados por sensores. Não constroem mapas.</p>
    <ul><li><b>Bug 1:</b> vai em direção ao destino; ao encontrar um obstáculo, <b>contorna-o todo</b> registando o ponto mais próximo do destino; volta a esse ponto e segue. Robusto mas longo.</li>
    <li><b>Bug 2:</b> segue a <b>linha reta início→destino</b>; ao encontrar um obstáculo, contorna até <b>reencontrar a linha</b> e continua. Mais curto em geral.</li>
    <li><b>Bug 2+:</b> só regressa à linha se ainda não passou por pontos de cruzamento mais próximos do destino (evita ciclos).</li></ul>`,
    figures:[{src:"assets/slides/trajmaps/page-09.png", caption:"Slide 9 — Bug 2", focus:"o robô abandona o contorno do obstáculo assim que reencontra a linha início→destino"}],
    slideRef:"Trajectories_Maps, págs. 7–10" },

  { type:"theory", title:"Roadmaps: visibility graph e Voronoi",
    html:`<p><b>Roadmap:</b> reduzir o planeamento a uma <b>pesquisa num grafo</b> (nós = locais, arestas = caminhos). O problema central é construir o grafo:</p>
    <ul><li><b>Visibility graph (VG):</b> nós = vértices dos obstáculos; aresta existe se os dois vértices se "veem" (reta sem intersetar obstáculos). Dá caminhos <b>curtos</b> mas rasantes aos obstáculos.</li>
    <li><b>Diagrama de Voronoi (DV):</b> conjunto de pontos <b>equidistantes</b> de 2+ obstáculos. Dá caminhos <b>seguros</b> (máxima distância aos obstáculos) mas mais longos — o oposto do VG.</li></ul>`,
    figures:[{src:"assets/slides/trajmaps/page-12.png", caption:"Slide 12 — Visibility graph", focus:"as arestas ligam vértices de obstáculos que se veem — o caminho roça os cantos"},
             {src:"assets/slides/trajmaps/page-13.png", caption:"Slide 13 — Diagrama de Voronoi", focus:"o caminho mantém-se equidistante dos obstáculos — seguro mas longo"}],
    slideRef:"Trajectories_Maps, págs. 11–13" },

  { type:"quiz", title:"Checkpoint", questions:[
    { kind:"mcq", q:"Qual é a diferença entre path planning e trajectory planning?",
      options:["São sinónimos","O trajectory planning acrescenta a dimensão tempo (onde estar em cada instante)","O path planning inclui a dinâmica do robô","O trajectory planning ignora obstáculos"], answer:1,
      explain:"Path = geometria; trajectory = geometria em função do tempo; motion = + restrições cinemáticas/dinâmicas." },
    { kind:"mcq", q:"Visibility graph vs Voronoi — qual o trade-off?",
      options:["VG dá caminhos curtos mas rasantes; DV dá caminhos seguros mas longos","VG é sempre melhor","DV dá caminhos mais curtos","São equivalentes"], answer:0,
      hint:"Um passa nos cantos dos obstáculos, o outro fica a meio caminho entre eles.",
      explain:"VG: nós nos vértices dos obstáculos → roça-os. DV: pontos equidistantes → margem máxima." },
    { kind:"flash", front:"Bug 1 vs Bug 2 — a diferença num tweet:", back:"Bug1 contorna o obstáculo TODO e volta ao ponto mais próximo do destino; Bug2 contorna só até reencontrar a reta início→destino. Bug2 é geralmente mais curto." }
  ]},

  { type:"theory", title:"Decomposição em células",
    html:`<p>Também reduz o problema a pesquisa em grafo (células adjacentes = arestas).</p>
    <ul><li><b>Exata:</b> as células representam fielmente o espaço (livre ou ocupado). Ex.: polígonos convexos (vértices dos obstáculos) ou <b>trapézios</b> (linha vertical em cada vértice).</li>
    <li><b>Aproximada:</b> células de forma simples (quadrados) com 3 estados — livre / ocupada / <b>parcialmente ocupada</b>. O mapa deixa de ser exato: com células grandes pode <b>não encontrar caminho que existe</b>.</li></ul>
    <p>Variantes aproximadas: <b>célula fixa</b> (grelha regular) e <b>quadtree</b> (divide recursivamente em 4 só onde há mistura livre/ocupado — poupa memória).</p>
    <p><b>Mapa topológico:</b> nós = posições com significado (salas, portas), arestas = existência de caminho. Compacto, sem geometria fina.</p>`,
    figures:[{src:"assets/slides/trajmaps/page-19.png", caption:"Slide 19 — Quadtree", focus:"só as zonas mistas são subdivididas — compara com a grelha fixa do slide 18"}],
    slideRef:"Trajectories_Maps, págs. 14–20" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Na decomposição aproximada em células, que problema surge com células demasiado grandes?",
      options:["Gasto excessivo de memória","Pode não encontrar um caminho que existe (passagens estreitas ficam 'parcialmente ocupadas')","O grafo fica com demasiados nós","Os obstáculos móveis desaparecem"], answer:1,
      explain:"Uma passagem mais estreita que a célula fica marcada parcialmente ocupada → tratada como bloqueada. O tamanho da célula é um compromisso resolução/custo." },
    { kind:"mcq", q:"A vantagem do quadtree sobre a grelha de células fixas é:",
      options:["Ser mais preciso que a decomposição exata","Usar células grandes nas zonas homogéneas e pequenas só onde é preciso (menos memória/nós)","Funcionar com obstáculos móveis","Não precisar de grafo"], answer:1,
      explain:"Subdivide recursivamente apenas células mistas, até um tamanho mínimo." },
    { kind:"flash", front:"Método completo, completo em resolução, probabilisticamente completo — define os 3.", back:"Completo: acha solução sse existir. Em resolução: acha para uma dada discretização. Probabilístico: P(achar)→1 com t→∞ (ex.: métodos de amostragem)." }
  ]}
]},

/* ============ MÓDULO 4 — Campos de potencial e pesquisa em grafos (A*) ============ */
{ id:"m3-mod4", title:"Campos de potencial e A*", minutes:35, kind:"study",
  blurb:"Potenciais (mínimos locais!), pesquisa sem/com heurística, f=g+h, admissibilidade e heurísticas. Trajectories_Maps, págs. 21–48.",
  pages:[
  { type:"theory", title:"Campos de potencial",
    html:`<p>Ideia: o destino cria um <b>potencial atrativo</b>, os obstáculos criam <b>potencial repulsivo</b>; o robô desce o gradiente do campo resultante. Simples, elegante, online.</p>
    <p><b>Fraqueza principal — mínimos locais:</b></p>
    <ul><li>Robô–obstáculo–destino alinhados: se a repulsão ≥ atração, o robô não passa</li>
    <li>Forças de vários obstáculos somam zero → o robô fica <b>preso num mínimo local</b></li></ul>
    <p>Soluções: (1) desenhar potenciais <b>sem mínimos locais</b> exceto no destino (funções de navegação); (2) métodos de <b>escape</b> do mínimo (ex.: passeio aleatório).</p>`,
    figures:[{src:"assets/slides/trajmaps/page-23.png", caption:"Slide 23 — Campo resultante e trajetória", focus:"o 'vale' que conduz ao destino — e imagina um poço fora do destino: é o mínimo local"}],
    slideRef:"Trajectories_Maps, págs. 21–25" },

  { type:"theory", title:"Pesquisa em grafos sem informação",
    html:`<p>Sobre o grafo (do roadmap ou das células) corre-se um algoritmo de pesquisa. <b>Sem informação</b> (cegos):</p>
    <ul><li><b>Profundidade (depth-first):</b> completo se b finito; tempo O(b<sup>m</sup>); espaço O(b·m); <b>não ótimo</b></li>
    <li><b>Largura (breadth-first):</b> completo; tempo e espaço O(b<sup>d+1</sup>); ótimo <b>só</b> se todas as arestas custarem o mesmo</li>
    <li><b>Profundidade limitada</b> e <b>aprofundamento iterativo</b> — variantes que controlam a memória</li></ul>
    <p>(b = ramificação máxima; m = profundidade máxima; d = profundidade da solução.)</p>
    <p><b>Com heurística:</b> <b>Dijkstra</b> (expande o nó mais próximo da ORIGEM), <b>Greedy</b> (o mais próximo do DESTINO, estimado), e <b>A*</b> que combina os dois.</p>`,
    slideRef:"Trajectories_Maps, págs. 26–35" },

  { type:"theory", title:"O algoritmo A* ★",
    html:`<p>O A* ordena a exploração pelos nós de menor:</p>
    <span class="formula">f(n) = g(n) + h(n)</span>
    <ul><li><b>g(n)</b> — custo real do início até n</li>
    <li><b>h(n)</b> — estimativa (heurística) do custo de n até ao destino</li></ul>
    <p>Propriedades:</p>
    <ul><li><b>Completo</b> — termina no destino ou com a lista aberta vazia</li>
    <li><b>Ótimo (admissível)</b> se h nunca sobrestima: <b>h(n) ≤ h_m(n)</b></li>
    <li><b>Consistente</b> se h(n) ≤ c(n,m) + h(m) para nós adjacentes</li>
    <li>Complexidade: depende da heurística — de O(2<sup>n</sup>) (h=0, vira Dijkstra exaustivo) a O(n) (h perfeita)</li></ul>
    <p>Heurísticas em grelha: <b>Manhattan</b> (só horizontal/vertical), <b>diagonal</b>, <b>euclidiana</b> (qualquer direção).</p>`,
    slideRef:"Trajectories_Maps, págs. 36–42" },

  { type:"quiz", title:"Checkpoint — A*", questions:[
    { kind:"input", q:"Num nó n: g(n)=4 e h(n)=2,5. Qual é f(n)?",
      answer: 6.5, tolerance: 0.01,
      hint:"f = g + h.",
      explain:"f(n) = 4 + 2,5 = 6,5 — o A* expande sempre o nó com menor f da lista aberta." },
    { kind:"mcq", q:"O A* é ótimo (encontra o caminho de menor custo) desde que:",
      options:["A heurística nunca sobrestime o custo real até ao destino (admissível)","A heurística seja sempre zero","O grafo seja pequeno","Use a distância de Manhattan"], answer:0,
      hint:"h(n) ≤ h_m(n).",
      explain:"Admissibilidade: h nunca sobrestima. Com h=0 continua ótimo mas degenera em Dijkstra (lento)." },
    { kind:"mcq", q:"Dijkstra vs Greedy vs A* — que informação usa cada um para escolher o próximo nó?",
      options:["Todos usam f=g+h","Dijkstra: g (distância à origem); Greedy: h (estimativa ao destino); A*: g+h","Dijkstra: h; Greedy: g; A*: g","Nenhum usa heurística"], answer:1,
      explain:"É a definição de cada um. O A* junta o melhor dos dois: garantia (g) + direção (h)." },
    { kind:"flash", front:"Porque é que multiplicar a heurística euclidiana por K>1 acelera o A* mas perde a otimalidade?", back:"Com K>1, h pode sobrestimar (deixa de ser admissível) → explora muito menos nós (ex. dos slides: 1214→94 nós, 1,04→0,30 ms) mas o caminho pode não ser o ótimo (2,76→2,77 m)." }
  ]},

  { type:"theory", title:"A* na prática: futebol robótico",
    html:`<p>O exemplo dos slides (futebol robótico, células de 1–10 cm):</p>
    <ul><li><b>Cspace:</b> o robô vira um ponto; os obstáculos são <b>aumentados</b> pelo raio do robô</li>
    <li><b>K>1 na heurística euclidiana:</b> processa 94 nós em vez de 1214 (0,30 ms vs 1,04 ms), com caminho quase igual (2,77 vs 2,76 m) — troca otimalidade por velocidade</li>
    <li><b>Tamanho da célula:</b> 0,01 m → 14 ms; 0,04 m → 0,72 ms com caminho quase igual — o compromisso resolução/tempo outra vez</li>
    <li><b>Estruturas de dados:</b> as listas aberta/fechada dominam o tempo; binary heaps ~50% mais rápidos que arrays ordenados</li></ul>
    <div class="hl">Estes números concretos (94 vs 1214 nós; célula 1 cm vs 4 cm) são bons exemplos para justificar respostas sobre compromissos de planeamento.</div>`,
    figures:[{src:"assets/slides/trajmaps/page-47.png", caption:"Slide 47 — A* com K=1 vs K=1.5", focus:"vermelho=lista fechada, verde=aberta, branco=caminho: com K=1.5 explora-se muito menos"}],
    slideRef:"Trajectories_Maps, págs. 43–48" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Porque se aumentam os obstáculos no Cspace pelo raio do robô?",
      options:["Para o mapa ficar mais bonito","Para tratar o robô como um ponto sem risco de colisão","Para acelerar o A*","Porque os sensores têm ruído"], answer:1,
      explain:"Obstáculo dilatado + robô pontual ⇔ obstáculo real + robô com dimensão. Simplifica o planeamento." },
    { kind:"mcq", q:"O principal problema dos campos de potencial é:",
      options:["Custo computacional alto","Mínimos locais onde o robô fica preso sem chegar ao destino","Não funcionar com obstáculos parados","Exigir um grafo"], answer:1,
      explain:"Forças que se anulam criam mínimos locais. Soluções: potenciais sem mínimos locais ou métodos de escape." },
    { kind:"flash", front:"3 fatores de implementação que afetam o desempenho do A*:", back:"Qualidade da heurística (admissível? K>1?), tamanho da célula do Cspace, e estrutura de dados das listas aberta/fechada (binary heap ≈ 50% mais rápido que array ordenado)." }
  ]}
]},

/* ============ MÓDULO 5 — A* dinâmico e multi-robô (leitura) ============ */
{ id:"m3-mod5", title:"Obstáculos móveis e TeA* (leitura)", minutes:20, kind:"study",
  blurb:"Collision points, clearance, trail, direction e o TeA* multi-robô. Trajectories_Maps, págs. 49–60 — peso menor.",
  pages:[
  { type:"theory", title:"A* com obstáculos móveis",
    html:`<p>Modificações ao Cspace e aos custos para lidar com obstáculos em movimento:</p>
    <ul><li><b>Collision points:</b> marca-se como obstáculo o <b>ponto de colisão previsto</b> (não a posição atual do obstáculo)</li>
    <li><b>Clearance zone:</b> margem em torno do ponto de impacto — para evitar (ou promover!) aproximações</li>
    <li><b>Distance:</b> obstáculo mais pequeno quanto mais longe estiver o ponto de colisão</li>
    <li><b>Trail:</b> zona de custo na direção da velocidade do obstáculo (proporcional a ela) — evita que o robô seja "arrastado" para o caminho do obstáculo</li>
    <li><b>Direction:</b> custos que favorecem chegar ao destino com a orientação desejada</li></ul>`,
    figures:[{src:"assets/slides/trajmaps/page-54.png", caption:"Slide 54 — Efeito do 'trail'", focus:"a trajetória 'Modificado' desvia-se por trás do obstáculo em vez de cruzar à frente dele"}],
    slideRef:"Trajectories_Maps, págs. 49–56" },

  { type:"theory", title:"TeA*: A* com tempo para múltiplos robôs",
    html:`<p><b>TeA* (Time-enhanced A*):</b> acrescenta <b>camadas temporais</b> ao grafo — cada nó é (célula, instante). Cada robô planeia tendo em conta onde os outros <b>vão estar</b>, não onde estão.</p>
    <p>Problema clássico: <b>deadlock</b> — com prioridades fixas, dois robôs podem bloquear-se mutuamente (o amarelo com prioridade encurrala o outro). Solução dos slides: <b>trocar as prioridades</b> quando se deteta o bloqueio.</p>
    <div class="hl">Peso baixo no exame — retém: TeA* = A* + dimensão temporal; deadlocks resolvem-se com gestão de prioridades. Liga ao M7 (coordenação multi-robô).</div>`,
    figures:[{src:"assets/slides/trajmaps/page-57.png", caption:"Slide 57 — Camadas temporais do TeA*", focus:"o mesmo mapa replicado ao longo do tempo — o caminho atravessa camadas"}],
    slideRef:"Trajectories_Maps, págs. 57–60" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Com obstáculos móveis, o que se insere no mapa como obstáculo (modificação 'collision points')?",
      options:["A posição atual do obstáculo","O ponto de colisão previsto entre robô e obstáculo","Toda a trajetória do obstáculo","Nada — replaneia-se a cada ciclo"], answer:1,
      explain:"A posição atual estaria desatualizada quando o robô lá chegasse; o ponto de colisão previsto é o que interessa evitar." },
    { kind:"mcq", q:"No TeA*, um deadlock entre dois robôs resolve-se tipicamente:",
      options:["Aumentando a velocidade","Trocando as prioridades dos robôs","Removendo as camadas temporais","Usando Manhattan em vez de euclidiana"], answer:1,
      explain:"Se a ordem de prioridades encurrala um robô, inverte-se a ordem e replaneia-se." },
    { kind:"flash", front:"O que acrescenta o TeA* ao A* clássico?", back:"A dimensão TEMPO: nós = (célula, instante), em camadas. Permite planear vários robôs sem se cruzarem, considerando onde cada um estará em cada momento." }
  ]}
]},

/* ============ MÓDULO 6 — Labwork 3 guiado ============ */
{ id:"m3-mod6", title:"Labwork 3 — GotoXY, FollowLine e FollowCircle omni (guiado)", minutes:60, kind:"labwork",
  blurb:"Resolução guiada da Lab 3 no SimTwo omni: 2 FSMs, linha, círculo e versão sem FSM.",
  pages:[
  { type:"theory", title:"Enquadramento e plataforma",
    html:`<p><b>Tema:</b> rotinas de controlo (GotoXY, FollowLine, FollowCircle) num robô <b>omnidirecional</b>, controlado por (V, Vn, W).</p>
    <p><b>Plataforma:</b> <b>SimTwo</b> — pasta <code>Lab_3/SimTwo_Omni_-_Student</code> (a solução está em <code>SimTwo_Omni_sol_LabW_3</code> para conferires no fim). O <code>Control()</code> corre a cada 40 ms.</p>
    <p><b>Módulos necessários:</b> módulos 1–2 deste milestone (cinemática e controlo omni) + M2 (distanceToLine, máquinas de estados, rampas).</p>
    <p><b>Lembretes:</b> botão <b>ResetRob</b> até a pose estimada estar correta (células (21,12)–(23,13)); lê o <code>Control</code> e o <code>procedure gotoXy</code> antes de escrever; botão <b>GotoXY</b> define o modo de trajetória e <b>Script</b> executa.</p>`,
    slideRef:"SAUT_LabWork_3_Goto_FLine_Omni_V8Oct24.pdf" },

  { type:"theory", title:"Enunciado e etapas — clica COMEÇAR",
    html:`<p>Tarefas:</p>
    <ol><li><b>(1)</b> GOTOXY com <b>duas máquinas de estados</b> (linear + angular), com tolerâncias de distância e ângulo</li>
    <li><b>(2)</b> FollowLine de (xi,yi) para (xf,yf): mudar as equações de velocidade nos estados Go_Forward e De_Accel_Lin, usando a distância à linha</li>
    <li><b>(3)</b> FollowCircle: centro (xc,yc), raio R, sentido anti-horário, parar em (xf,yf) com orientação tf — usando a distância ao círculo</li>
    <li><b>(4)</b> Repetir tudo <b>num único procedimento sem máquina de estados</b>, controlando V, Vn e W continuamente</li></ol>
    <p>Faz cada etapa no SimTwo antes de responder. Carrega em <b>Seguinte</b> para COMEÇAR.</p>`,
    slideRef:"Enunciado Lab 3" },

  { type:"labtask", title:"Sub-tarefa (1a) — Estrutura do controlador",
    context:"<p>Vais estruturar o gotoXy do omni. Decide primeiro a arquitetura.</p>",
    q:"Como se organizam as máquinas de estados no GotoXY omni?",
    kind:"mcq",
    options:["Uma única FSM: rodar até alinhar e depois avançar (como no diferencial)",
             "Duas FSMs em paralelo: uma para o movimento linear (V, Vn), outra para o angular (W)",
             "Três FSMs: uma por roda",
             "Nenhuma — o omni não precisa de estados"],
    answer:1,
    hints:["É a pergunta de exame deste milestone!","Translação e rotação são desacopladas no omni."],
    solution:"<b>Duas FSMs em paralelo</b> (é literalmente o que o enunciado pede: 'using two state machines, one for linear motion and another for angular motion'). O robô avança para o alvo ENQUANTO alinha θ — sem fases sequenciais." },

  { type:"labtask", title:"Sub-tarefa (1b) — Decompor a velocidade",
    context:"<p>No estado GO da máquina linear, com vel = velocidade nominal e ang = atan2(yf−yr, xf−xr) − θr:</p>",
    q:"Quais são as expressões de V e Vn?",
    kind:"mcq",
    options:["V = vel·cos(ang) ;  Vn = vel·sin(ang)",
             "V = vel·sin(ang) ;  Vn = vel·cos(ang)",
             "V = vel ;  Vn = 0",
             "V = vel·cos(θr) ;  Vn = vel·sin(θr)"],
    answer:0,
    hints:["ang é a direção do alvo NO REFERENCIAL DO ROBÔ; V é a componente frontal.","Se o alvo está mesmo em frente (ang=0): V=vel, Vn=0 ✓."],
    solution:"<code>V := vel*cos(ang); Vn := vel*sin(ang);</code> — o vetor velocidade aponta ao alvo, decomposto em frontal/lateral. Teste rápido: ang=0 → V=vel, Vn=0 (frente); ang=90° → V=0, Vn=vel (lateral pura)." },

  { type:"labtask", title:"Sub-tarefa (1c) — Máquina angular",
    context:"<p>Em paralelo, a FSM angular alinha o robô com θf. Usa controlo proporcional com desaceleração.</p>",
    q:"Enquanto a FSM linear ainda está em GO (longe do alvo), o que faz a FSM angular?",
    kind:"mcq",
    options:["Espera que a linear termine para começar a rodar",
             "Roda já para θf (W = K·erro_θ normalizado), em simultâneo com o avanço",
             "Mantém W=0 até faltar 10 cm",
             "Roda para a direção do alvo (erro_ang), como no diferencial"],
    answer:1,
    hints:["As FSMs são independentes — é essa a vantagem do omni.","Atenção: o alvo angular é θf (orientação final), não a direção do alvo!"],
    solution:"Roda de imediato para <b>θf</b> em paralelo com o avanço. Nota fina: no omni não é preciso apontar 'para onde se anda' — a orientação é um objetivo independente (θf), ao contrário do diferencial onde alinhar com o alvo era obrigatório." },

  { type:"labtask", title:"Sub-tarefa (2) — FollowLine omni",
    context:"<p>Linha de (0,0) para (5,0). O robô está em (2, 0.4), já alinhado a andar ao longo da linha (+x).</p>",
    q:"Que componente de velocidade corrige o desvio de 0,4 m, e com que sinal? (responde: Vn negativa / Vn positiva / V negativa / V positiva — escreve p.ex. 'Vn negativa')",
    kind:"input",
    answer:["vnnegativa","vn negativa","-vn","vnneg"],
    hints:["O robô avança com V ao longo da linha; o desvio lateral corrige-se com… ?","Está 0,4 m ACIMA da linha (y>0) e a linha aponta +x → tem de descer: lateral para a direita do robô."],
    solution:"<b>Vn negativa</b> — a componente lateral (proporcional a −K·distanceToLine) puxa o robô de volta à linha enquanto V mantém o avanço. No diferencial (M2) isto era feito com ω; no omni corrige-se lateralmente SEM rodar. As equações mudam nos estados Go_Forward e De_Accel_Lin." },

  { type:"labtask", title:"Sub-tarefa (3) — FollowCircle",
    context:"<p>Círculo: centro (1,1), R = 1,5 m, anti-horário. O robô está em (1, 3.1).</p>",
    q:"Qual é o valor da distância ao círculo (erro radial) em metros? (sinal incluído)",
    kind:"input", answer: 0.6, tolerance: 0.01, unit:"m",
    hints:["dist_ao_centro − R.","dist ao centro = √((1−1)²+(3,1−1)²) = 2,1."],
    solution:"√(0² + 2,1²) − 1,5 = 2,1 − 1,5 = <b>+0,6 m</b> (fora do círculo). O controlador: componente radial (para o centro) proporcional a −K·0,6 + componente tangencial (anti-horária) constante. Quando o erro radial é negativo (dentro), empurra para fora." },

  { type:"labtask", title:"Sub-tarefa (4) — Sem máquina de estados",
    context:"<p>Última tarefa: um único procedimento contínuo, sem FSM, para o GotoXY.</p>",
    q:"Qual é a formulação correta do controlo contínuo?",
    kind:"mcq",
    options:["V, Vn proporcionais ao erro de posição (decomposto no ref. do robô, com saturação) e W proporcional ao erro de θf, tudo em simultâneo",
             "V constante até chegar; depois W",
             "Apenas W proporcional; V e Vn nulos",
             "Impossível sem máquina de estados"],
    answer:0,
    hints:["No omni os 3 DOFs são independentes — 3 leis proporcionais em paralelo.","Satura as velocidades e desacelera perto do alvo (vel ∝ erro_dist quando pequeno)."],
    solution:"Leis contínuas em paralelo: <code>vel = min(V_NOM, K·erro_dist)</code> decomposta em V/Vn com cos/sin(ang), e <code>W = sat(Kw·(θf−θr))</code>. Sem estados porque não há fases obrigatórias — só saturações e zonas de desaceleração implícitas.<br><br>🏁 <b>Labwork 3 concluída!</b> O M3 fica completo e desbloqueia o <b>M4 — EKF beacons</b>, o milestone com mais peso no exame. Reserva-lhe o máximo de tempo!" },
  { type:"labtask", kind:"code",
    title:"💾 Guarda o teu código da Lab 3",
    context:"<p>Cola o teu <code>gotoXy</code> omni (2 máquinas de estados), <code>FollowLine</code>, <code>FollowCircle</code> e a versão sem FSM. Fica guardado neste milestone — consultável em <b>M3 → 📄 O teu código guardado</b>.</p>",
    q:"Snippet da Lab 3 (Pascal/SimTwo omni):" }

]}
]};
