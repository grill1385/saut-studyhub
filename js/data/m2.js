// M2 — Lab 2: Controlo de movimento diferencial (SAUT_Traj_Control)
window.SAUT_CONTENT = window.SAUT_CONTENT || {};
window.SAUT_CONTENT["m2"] = { modules: [

/* ============ MÓDULO 1 — GotoXYTheta: erros e máquina de estados ============ */
{ id:"m2-mod1", title:"GotoXYTheta: erros e máquina de estados", minutes:35, kind:"study",
  blurb:"Os 3 erros do controlador e o diagrama de estados completo. Traj_Control, págs. 2–7. ★ Pergunta 7 do exame.",
  pages:[
  { type:"theory", title:"Controlo de trajetória: visão geral",
    html:`<p>O controlo de movimento gera <b>referências de velocidade</b> para os motores. Acima disso, o controlo de trajetória oferece rotinas de alto nível:</p>
    <ul><li><code>GotoXYTheta(Xf, Yf, θf)</code> — ir para uma pose</li>
    <li><code>FollowLine(x1,y1,x2,y2,θf)</code> — seguir uma reta</li>
    <li><code>FollowCircle(x1..y3,θf)</code> — seguir um círculo</li>
    <li><code>FollowParametricSegment(Fx(t),Fy(t))</code> — curvas paramétricas</li></ul>
    <p>Para robôs móveis, estas rotinas implementam-se tipicamente com <b>máquinas de estados</b> (ou redes de Petri). A teoria de controlo com modelos dinâmicos ganha importância em robôs pesados ou rápidos.</p>
    <div class="hl">O controlador usa a pose <b>estimada</b> (PredictPosition da Lab 1!), não a pose real — se a odometria estiver má, o controlo leva o robô ao sítio errado.</div>`,
    figures:[{src:"assets/slides/trajcontrol/page-03.png", caption:"Slide 3 — Rotinas de controlo de trajetória", focus:"a lista de rotinas — são exatamente as tarefas das Labs 2 e 3"}],
    slideRef:"SAUT_Traj_Control, págs. 2–3" },

  { type:"theory", title:"Os 3 erros do GotoXYTheta ★",
    html:`<p>O controlador usa <b>três erros</b> (P7 do exame — decora os três!):</p>
    <ul><li><b>erro_dist</b> — distância do robô ao ponto final: <span class="formula">erro_dist = √((xf−xr)² + (yf−yr)²)</span></li>
    <li><b>erro_ang</b> — diferença entre a orientação atual e a direção que aponta para o ponto final: <span class="formula">erro_ang = atan2(yf−yr, xf−xr) − θr</span></li>
    <li><b>erro_theta_f</b> — na fase final, diferença entre a orientação atual e a orientação final desejada: <span class="formula">erro_theta_f = θf − θr</span></li></ul>
    <div class="exam">P7: "que erros usa o GotoXYTheta?" → erro de posição ao ponto + erro de orientação ao ponto + erro de orientação final. (Normaliza sempre os ângulos para [−π, π]!)</div>`,
    figures:[{src:"assets/slides/trajcontrol/page-05.png", caption:"Slide 5 — Geometria do GotoXYTheta", focus:"identifica erro_dist e erro_ang no desenho; a seta Theta_final é o alvo do erro_theta_f"}],
    slideRef:"Traj_Control, págs. 4–5" },

  { type:"theory", title:"A máquina de estados completa",
    html:`<p>Sequência: primeiro <b>rodar</b> até alinhar, só depois <b>avançar</b>, desacelerar perto do alvo, e no fim rodar para θf:</p>
    <ol><li><b>ROTATE</b>: v=0, ω=sign_dir·W_NOM → sai quando |erro_ang| &lt; MAX_ETF (com histerese HIST_ETF para reentrar)</li>
    <li><b>GO_FORWARD</b>: v=LIN_VEL_NOM, ω=GAIN_FWD·erro_ang → sai quando erro_dist &lt; DIST_DA</li>
    <li><b>DE_ACCEL</b>: v=LIN_VEL_DA (reduzida), ω=GAIN_DA·erro_ang → sai quando erro_dist &lt; TOL_FINDIST</li>
    <li><b>FINAL_ROT</b>: v=0, ω=sign_dir_f·W_NOM → desacelera (DE_ACC_FINAL_ROT com W_DA) quando |erro| &lt; THETA_DA</li>
    <li><b>STOP</b>: v=0, ω=0</li></ol>
    <p>Os parâmetros <b>DIST_NEWPOSE</b> e <b>THETA_NEWPOSE</b> permitem aceitar automaticamente uma nova pose-alvo: se o erro voltar a crescer acima deles, a máquina regressa aos estados de movimento.</p>
    <div class="hl">A zona de desaceleração (linear e angular) existe para aumentar a precisão do posicionamento final — chegar depressa demais = passar do alvo.</div>`,
    figures:[{src:"assets/slides/trajcontrol/page-07.png", caption:"Slide 7 — Diagrama de estados do GotoXYTheta", focus:"as condições de transição (setas): compara os limiares de saída e de reentrada (histerese)"}],
    slideRef:"Traj_Control, págs. 6–7" },

  { type:"quiz", title:"Checkpoint — formato exame", questions:[
    { kind:"mcq", q:"[P7 exame] Que erros usa o controlador GotoXYTheta?",
      options:["Apenas o erro de distância ao ponto final","Erro de distância + erro de orientação ao ponto + erro de orientação final","Erro de velocidade linear e angular","Erro de posição em x e em y separadamente"], answer:1,
      hint:"São três, e dois deles são angulares.",
      explain:"erro_dist, erro_ang (aponta ao ponto) e erro_theta_f (orientação final desejada)." },
    { kind:"input", q:"O robô está em (0,0) com θr=0 e o alvo é (2,2). Qual é o erro_ang inicial em graus? (só o número)",
      answer: 45, tolerance: 0.5, unit:"°",
      hint:"erro_ang = atan2(2−0, 2−0) − 0.",
      explain:"atan2(2,2) = 45°. No estado ROTATE o robô roda 45° antes de avançar." },
    { kind:"mcq", q:"Para que servem DIST_NEWPOSE e THETA_NEWPOSE na máquina de estados?",
      options:["Definir a tolerância final de paragem","Aceitar automaticamente uma nova pose-alvo se o erro voltar a crescer","Limitar a velocidade máxima","Calibrar a odometria"], answer:1,
      hint:"O enunciado da Lab 2 diz que 'o endpoint pode mudar a qualquer momento'.",
      explain:"Se o alvo mudar (erro > DIST_NEWPOSE ou > THETA_NEWPOSE), a máquina sai de STOP/FINAL_ROT e volta a mover-se." },
    { kind:"flash", front:"Sequência de estados do GotoXYTheta, de cor:", back:"ROTATE → GO_FORWARD → DE_ACCEL → FINAL_ROT (→ DE_ACC_FINAL_ROT) → STOP. Rodar primeiro, avançar depois, desacelerar antes de parar." }
  ]},

  { type:"theory", title:"Porquê rodar primeiro e histerese",
    html:`<p><b>Porquê ROTATE antes de GO_FORWARD?</b> Se o robô avançasse com erro_ang grande, descreveria um arco largo e imprevisível (ou afastar-se-ia do alvo). Alinhar primeiro torna a trajetória quase reta e o controlo do avanço simples.</p>
    <p><b>Porquê histerese (MAX_ETF vs MAX_ETF + HIST_ETF)?</b> Sem histerese, com o erro a flutuar em torno do limiar, a máquina alternaria rapidamente entre ROTATE e GO_FORWARD (chattering). A histerese cria uma banda morta que estabiliza a comutação.</p>
    <div class="hl">Estes dois "porquês" são ouro para justificações em perguntas de desenvolvimento.</div>`,
    slideRef:"Traj_Control, págs. 6–7 (interpretação)" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"O que aconteceria se a máquina de estados não tivesse histerese na transição ROTATE↔GO_FORWARD?",
      options:["O robô nunca sairia de ROTATE","Comutação rápida entre estados (chattering) com o erro perto do limiar","O robô andaria mais devagar","Nada — a histerese é opcional por estética"], answer:1,
      explain:"Com o erro a oscilar à volta do limiar, as transições disparariam constantemente — a histerese evita-o." },
    { kind:"flash", front:"No estado GO_FORWARD, que lei de controlo é aplicada à velocidade angular?", back:"ω = GAIN_FWD · erro_ang — controlo PROPORCIONAL ao erro de orientação, enquanto v = LIN_VEL_NOM constante. (É este ganho que, se for alto, causa oscilações — P15!)" },
    { kind:"mcq", q:"O controlador GotoXYTheta atua sobre a pose:",
      options:["Real do robô (ground truth do simulador)","Estimada pela odometria (PredictPosition)","Medida por GPS","Média das duas"], answer:1,
      explain:"Só a estimada está disponível num robô real — por isso o erro de odometria degrada o controlo (liga M1 → M2)." }
  ]}
]},

/* ============ MÓDULO 2 — Controlo proporcional, ganhos e rampas ============ */
{ id:"m2-mod2", title:"Ganho proporcional e rampas de aceleração", minutes:30, kind:"study",
  blurb:"Efeito do ganho alto (oscilações!), DVMAX/DWMAX e desaceleração. ★ Pergunta 15 do exame.",
  pages:[
  { type:"theory", title:"Controlo proporcional da orientação",
    html:`<p>No GO_FORWARD, a orientação é corrigida por um controlador P:</p>
    <span class="formula">ω = Kp · erro_ang</span>
    <p>Efeito do ganho:</p>
    <ul><li><b>Kp baixo</b> — convergência lenta; o robô "corta caminho" devagar para a direção certa</li>
    <li><b>Kp adequado</b> — correção rápida e suave</li>
    <li><b>Kp alto</b> — o robô responde demais a cada erro: ultrapassa a direção certa, corrige para o outro lado, ultrapassa outra vez… → <b>trajetória oscilante</b> (ziguezague). Com atrasos e período de amostragem de 40 ms, pode mesmo instabilizar</li></ul>
    <div class="exam">P15 (Labwork#2): "ganho proporcional alto → oscilações na trajetória". É resposta direta: memoriza a associação ganho alto ⇒ overshoot/oscilação.</div>`,
    slideRef:"Traj_Control, págs. 6–7 + Lab 2 (experiência com ganhos)" },

  { type:"theory", title:"Rampas de aceleração: DVMAX e DWMAX",
    html:`<p>Na Lab 2 (tarefa 3), as referências de velocidade deixam de mudar instantaneamente: limita-se a variação por ciclo:</p>
    <span class="formula">|v_ref(i+1) − v_ref(i)| ≤ DVMAX &nbsp;&nbsp;&nbsp; |ω_ref(i+1) − ω_ref(i)| ≤ DWMAX</span>
    <p>Porquê?</p>
    <ul><li>Variações bruscas pedem binários que as rodas não conseguem transmitir → <b>derrapagem</b> → odometria estraga-se (M1!)</li>
    <li>Suaviza o movimento e protege a mecânica</li>
    <li>Em contrapartida, a resposta fica mais lenta — há um compromisso</li></ul>
    <pre><code>// rampa (por ciclo de 40 ms)
if v_target > v_ref then v_ref := min(v_ref + DVMAX, v_target)
else                     v_ref := max(v_ref - DVMAX, v_target);</code></pre>`,
    slideRef:"Enunciado Lab 2, tarefa 3" },

  { type:"quiz", title:"Checkpoint", questions:[
    { kind:"mcq", q:"[P15 exame] Na Labwork 2, aumentar muito o ganho proporcional da orientação provoca:",
      options:["Trajetória mais suave e rápida","Oscilações na trajetória (ziguezague), podendo instabilizar","O robô para com erro grande","Só afeta a velocidade linear"], answer:1,
      hint:"O robô sobre-corrige cada erro…",
      explain:"Ganho alto → overshoot na orientação → correção para o lado oposto → oscilação. Com amostragem a 40 ms e dinâmica dos motores, pode divergir." },
    { kind:"input", q:"Com DVMAX = 0,05 m/s por ciclo (ciclo = 40 ms), quantos ciclos demora a referência a ir de 0 a 2 m/s? (nº inteiro)",
      answer: 40, tolerance: 0,
      hint:"2 ÷ 0,05.",
      explain:"40 ciclos × 40 ms = 1,6 s de rampa. É o preço da suavidade." },
    { kind:"flash", front:"Dá 2 razões para limitar a aceleração (DVMAX/DWMAX).", back:"1) Evitar derrapagem (protege a odometria e a tração); 2) suavizar o movimento/proteger a mecânica. Custo: resposta mais lenta." }
  ]},

  { type:"theory", title:"Caminho curto vs caminho rápido ★",
    html:`<p>Ideia recorrente no exame (ligada à P7): <b>o caminho mais curto nem sempre é o mais rápido</b> (nem o mais eficiente em energia).</p>
    <ul><li>O caminho mais curto entre duas poses pode exigir rotações no lugar (v=0) — tempo perdido sem avançar</li>
    <li>Um arco mais longo, percorrido sem parar e a velocidade alta, pode demorar menos</li>
    <li>Acelerações/travagens bruscas gastam energia e tempo — trajetórias suaves vencem</li></ul>
    <div class="exam">Se o exame perguntar "o caminho mais curto é sempre o melhor?", a resposta é NÃO — otimizar tempo/energia pode preferir caminhos mais longos mas mais suaves.</div>`,
    slideRef:"Traj_Control (discussão) + plano de estudo M2" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Porque pode um arco longo ser mais rápido do que a linha reta com rotação inicial?",
      options:["Porque os motores aquecem menos","Porque evita rotações no lugar (v=0) e mantém velocidade alta continuamente","Porque a odometria é melhor em arcos","Não pode — o mais curto é sempre o mais rápido"], answer:1,
      explain:"Rotar no lugar não avança nada; um arco contínuo aproveita o tempo todo. Curto ≠ rápido." },
    { kind:"mcq", q:"Qual é o principal risco de NÃO usar rampas de aceleração num robô diferencial real?",
      options:["Gasto de memória","Derrapagem das rodas → erro de odometria e perda de tração","O código fica mais longo","Os encoders deixam de contar"], answer:1,
      explain:"Arranques bruscos violam o rolamento puro — exatamente o erro aleatório estudado no M1." },
    { kind:"flash", front:"Trio de compromissos do controlo de movimento:", back:"Ganho alto = rápido mas oscila; rampas = suave mas lento; caminho curto = menos metros mas não necessariamente menos segundos/joules." }
  ]}
]},

/* ============ MÓDULO 3 — FollowLine e distanceToLine ============ */
{ id:"m2-mod3", title:"FollowLine e distância à linha", minutes:30, kind:"study",
  blurb:"Seguir uma reta: lei de controlo, distanceToLine vetorial, e o tratamento de erros grandes. Lab 2, tarefa 4.",
  pages:[
  { type:"theory", title:"O problema e a lei de controlo",
    html:`<p>Dada a reta de (xi,yi) para (xf,yf), o robô deve segui-la nesse sentido e parar em (xf,yf) com uma dada orientação.</p>
    <p>Parte-se da máquina de estados do GotoXYTheta, substituindo apenas a equação de ω no GO_FORWARD:</p>
    <span class="formula">ω = −K_d · dist_à_linha − K_θ · (θr − θ_linha)</span>
    <p>Dois termos <b>proporcionais</b>:</p>
    <ul><li><b>distância à linha</b> (com sinal!) — puxa o robô para cima da reta</li>
    <li><b>erro de orientação face à direção da linha</b> — alinha o robô com a reta</li></ul>
    <div class="hl">São precisos os DOIS: só distância → o robô cruza a linha e oscila; só ângulo → anda paralelo à linha sem nunca a apanhar.</div>`,
    slideRef:"Enunciado Lab 2, tarefa 4a" },

  { type:"theory", title:"distanceToLine — abordagem vetorial",
    html:`<p>A distância (com sinal) do robô à reta calcula-se com o produto externo dos vetores:</p>
    <span class="formula">v⃗ = (xf−xi, yf−yi) — direção da linha<br>r⃗ = (xr−xi, yr−yi) — do início da linha ao robô<br>dist = (v⃗ × r⃗)/|v⃗| = [(xf−xi)(yr−yi) − (yf−yi)(xr−xi)] / |v⃗|</span>
    <p>O <b>sinal</b> diz de que lado da linha está o robô (esquerda/direita) — é o que permite ao termo −K_d·dist puxar no sentido certo. A orientação da linha é <code>θ_linha = atan2(yf−yi, xf−xi)</code>.</p>
    <div class="exam">O procedimento distanceToLine(thetarobot, xi, yi, xf, yf) aparece no código da Lab — sabe explicar o produto externo normalizado e o significado do sinal.</div>`,
    slideRef:"Enunciado Lab 2 (distanceToLine, abordagem vetorial)" },

  { type:"quiz", title:"Checkpoint", questions:[
    { kind:"input", q:"Linha de (0,0) para (4,0); robô em (2,1). Qual é a distância (com sinal) à linha? (produto externo/|v|)",
      answer: 1, tolerance: 0.01, unit:"m",
      hint:"dist = [(xf−xi)(yr−yi) − (yf−yi)(xr−xi)]/|v| = [4·1 − 0·2]/4.",
      explain:"dist = 4/4 = +1 m (lado esquerdo da direção da linha). Se estivesse em (2,−1), daria −1." },
    { kind:"mcq", q:"Se o FollowLine usasse APENAS o termo da distância (sem o erro de orientação), o robô:",
      options:["Seguiria a linha perfeitamente","Cruzaria a linha e oscilaria de um lado para o outro","Ficaria parado","Andaria paralelo à linha"], answer:1,
      hint:"Quando chega à linha, com que orientação chega?",
      explain:"Sem alinhar a orientação, atravessa a linha com ângulo e é puxado de volta → ziguezague. O termo de orientação amortece." },
    { kind:"flash", front:"Fórmula do distanceToLine (vetorial):", back:"dist = [(xf−xi)(yr−yi) − (yf−yi)(xr−xi)] / √((xf−xi)²+(yf−yi)²). Produto externo v⃗×r⃗ normalizado; o sinal indica o lado." }
  ]},

  { type:"theory", title:"Erros grandes: limitar ω e planear (4b, 4c)",
    html:`<p>A lei proporcional só funciona bem para erros <b>pequenos</b>. O enunciado trata os casos difíceis:</p>
    <ul><li><b>(4b) Erros grandes de ângulo/distância:</b> a lei pede ω enorme → satura/oscila. Solução: <b>limitar ω a um máximo</b> (clamp).</li>
    <li><b>(4c) Erros muito grandes:</b> nem vale a pena seguir a lei — <b>planear</b>: usar o GotoXYTheta para ir primeiro ao <b>ponto mais próximo da linha</b>; e se o robô não está entre (xi,yi) e (xf,yf), ir primeiro a (xi,yi) e só então seguir a linha.</li></ul>
    <div class="hl">Padrão de engenharia: controlador local (proporcional) para pequenos erros + planeador (GotoXY) para grandes erros. O plano de estudo destaca exatamente isto: "limitar rotação para erros grandes; planear até ao ponto mais próximo".</div>`,
    slideRef:"Enunciado Lab 2, tarefas 4b–4c" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"O robô está muito longe da linha e virado ao contrário. Qual é a estratégia correta (Lab 2, 4c)?",
      options:["Aumentar os ganhos K_d e K_θ","Usar GotoXYTheta até ao ponto mais próximo da linha (ou até (xi,yi)) e depois FollowLine","Recuar até à linha","Ignorar a orientação e usar só o termo de distância"], answer:1,
      explain:"Para erros muito grandes planeia-se; a lei proporcional é só para a vizinhança da linha." },
    { kind:"mcq", q:"Para que serve limitar a velocidade de rotação (4b)?",
      options:["Poupar bateria","Evitar pedidos de ω irrealizáveis/oscilações quando o erro é grande","Aumentar a exatidão do laser","Cumprir as regras do simulador"], answer:1,
      explain:"Com erro grande, ω = K·erro dispara; o clamp mantém o comando realizável até o erro diminuir." },
    { kind:"flash", front:"FollowLine — os 3 regimes de erro e a resposta a cada um:", back:"Pequeno → lei proporcional (dist + ângulo). Grande → mesma lei com ω limitado (clamp). Muito grande → planear com GotoXYTheta para o ponto mais próximo / início da linha." }
  ]}
]},

/* ============ MÓDULO 4 — Trajetórias paramétricas e controlo preditivo ============ */
{ id:"m2-mod4", title:"Trajetórias paramétricas e controlo preditivo (leitura)", minutes:25, kind:"study",
  blurb:"Curvas paramétricas, feedforward de curvatura e a ideia do MPC. Traj_Control, págs. 8–29 — peso menor no exame.",
  pages:[
  { type:"theory", title:"Seguir trajetórias paramétricas",
    html:`<p>Trajetória definida por <code>(Fx(t), Fy(t))</code>. Em cada ciclo:</p>
    <ol><li>Encontrar <b>t = tNear</b>, o ponto da curva mais próximo do robô → erro de distância</li>
    <li>A <b>tangente</b> à curva em tNear dá a orientação de referência → erro de ângulo</li>
    <li>O sentido de rotação depende do sinal do ângulo entre o robô e a <b>normal</b> à trajetória</li></ol>
    <p>Além do feedback, junta-se um termo de <b>antecipação (feedforward)</b> dependente da <b>curvatura</b> da trajetória em t:</p>
    <span class="formula">ω_ff(t) = v(t) · curvatura(t)</span>
    <p>— o robô "sabe" que vem aí uma curva e começa a rodar sem esperar pelo erro. Nos slides há um exemplo completo com um triciclo e controlador PI.</p>
    <div class="hl">Generalização do FollowLine: linha = curva de curvatura zero (sem feedforward); círculo = curvatura constante.</div>`,
    figures:[{src:"assets/slides/trajcontrol/page-10.png", caption:"Slide 10 — Triciclo com trajetória polinomial paramétrica", focus:"tNear, a tangente Fang(tNear) e o erro FangPathError — os 3 ingredientes do controlador"}],
    slideRef:"Traj_Control, págs. 8–11" },

  { type:"theory", title:"Controlo preditivo (MPC) — a ideia",
    html:`<p>Págs. 12–27: controlo preditivo de robôs omnidirecionais (leitura leve — BAIXA prioridade no exame escrito):</p>
    <ul><li>Usa um <b>modelo do sistema</b> para prever a saída num <b>horizonte de predição N</b></li>
    <li>Otimiza a sequência de comandos futura minimizando uma função de custo (erro à referência + esforço de controlo)</li>
    <li>Aplica só o primeiro comando e repete no ciclo seguinte (receding horizon)</li><li>Versão linear tem <b>solução fechada</b>; horizonte N maior → resposta mais suave/antecipada</li></ul>
    <p>Fica com a intuição: MPC = feedforward sofisticado que respeita restrições; os resultados nos slides mostram trajetórias mais precisas a alta velocidade.</p>`,
    figures:[{src:"assets/slides/trajcontrol/page-24.png", caption:"Slide 24 — Resultados para vários horizontes N", focus:"como o aumento de N suaviza e antecipa a trajetória (não precisas das fórmulas)"}],
    slideRef:"Traj_Control, págs. 12–27" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"O termo de feedforward no seguimento de trajetórias paramétricas depende de:",
      options:["Da distância ao ponto final","Da curvatura da trajetória no ponto atual (ω_ff = v·curvatura)","Do erro de orientação","Da velocidade máxima do robô"], answer:1,
      hint:"Antecipar = saber o que a curva vai fazer, não o erro atual.",
      explain:"O feedforward roda o robô 'por conta' da curvatura conhecida, deixando ao feedback só as perturbações." },
    { kind:"mcq", q:"No MPC, o que se faz com a sequência ótima de comandos calculada?",
      options:["Aplica-se toda até ao fim do horizonte","Aplica-se apenas o primeiro comando e recalcula-se no ciclo seguinte","Guarda-se para calibração","Aplica-se a média"], answer:1,
      explain:"Receding horizon: replaneia a cada ciclo com o estado mais recente." },
    { kind:"flash", front:"FollowLine, FollowCircle e curvas paramétricas — o que os unifica?", back:"Todos seguem uma referência geométrica com erro de distância + erro de orientação; diferem na curvatura: 0 (linha), constante (círculo), variável (paramétrica → feedforward v·curvatura)." }
  ]}
]},

/* ============ MÓDULO 5 — Labwork 2 guiado ============ */
{ id:"m2-mod5", title:"Labwork 2 — GotoXY e FollowLine no SimTwo (guiado)", minutes:60, kind:"labwork",
  blurb:"Resolução guiada da Lab 2: das velocidades das rodas ao FollowLine robusto. Acompanha no SimTwo!",
  pages:[
  { type:"theory", title:"Enquadramento e plataforma",
    html:`<p><b>Tema:</b> rotinas básicas de controlo de movimento (GotoXY, FollowLine) num robô diferencial, com máquinas de estados.</p>
    <p><b>Plataforma:</b> <b>SimTwo</b> — usa a pasta <code>Lab_2/SimTwo64_LabWork__1__2_sol</code> (inclui a solução da Lab 1; parte do código da 2 vem por preencher). Editor: Ctrl+E; o <code>Control()</code> corre a cada 40 ms.</p>
    <p><b>Módulos necessários:</b> os 4 módulos anteriores + M1 completo (o controlador usa a pose estimada do predictPosition!).</p>
    <p><b>Lembretes do enunciado:</b> RESET POS várias vezes até a pose estimada (células (4,5)–(6,5)) estar correta; lê o código do Control antes de escrever; o botão <b>LAB#2Q1</b> ativa o modo de velocidades por células (18,8) e (19,8).</p>`,
    slideRef:"SAUT_LabWork_2_Goto_FLine_22Sept2023.pdf" },

  { type:"theory", title:"Enunciado e etapas — clica COMEÇAR",
    html:`<p>Tarefas:</p>
    <ol><li><b>(1)</b> Verificar MotorVel(): de (v, ω) desejados para v1, v2 das rodas</li>
    <li><b>(2)</b> Implementar GOTOXY com máquina de estados (rodar → avançar), com tolerâncias e alvo alterável a qualquer momento</li>
    <li><b>(3)</b> Adicionar rampas DVMAX/DWMAX às referências</li>
    <li><b>(4a)</b> FollowLine: substituir o ω do GO_FORWARD pela lei proporcional (distância à linha + erro de orientação)</li>
    <li><b>(4b)</b> Limitar ω para erros grandes</li>
    <li><b>(4c)</b> Erros muito grandes: planear com GotoXY até ao ponto mais próximo / início da linha</li></ol>
    <p>Faz cada etapa no SimTwo antes de responder às sub-tarefas. Carrega em <b>Seguinte</b> para COMEÇAR.</p>`,
    slideRef:"Enunciado Lab 2" },

  { type:"labtask", title:"Sub-tarefa (1) — De (v, ω) a (v1, v2)",
    context:"<p>O MotorVel() converte a velocidade linear e angular desejadas nas velocidades de cada roda (b = distância entre rodas). É a cinemática INVERSA do M1.</p>",
    q:"Qual é o par correto (v1 = roda direita)?",
    kind:"mcq",
    options:["v1 = v + ω·b/2 ;  v2 = v − ω·b/2",
             "v1 = v − ω·b/2 ;  v2 = v + ω·b/2",
             "v1 = (v + ω)/2 ;  v2 = (v − ω)/2",
             "v1 = v·b/2 + ω ;  v2 = v·b/2 − ω"],
    answer:0,
    hints:["Inverte as fórmulas do M1: v=(v1+v2)/2 e ω=(v1−v2)/b.","Soma e subtrai: v1 = v + ωb/2. Confirma: (v1+v2)/2 = v ✓ e (v1−v2)/b = ω ✓."],
    solution:"De v=(v1+v2)/2 e ω=(v1−v2)/b resolve-se: <b>v1 = v + ω·b/2</b>, <b>v2 = v − ω·b/2</b>. Para ω>0 (rodar à esquerda com esta convenção) a roda direita acelera. Verifica no código do MotorVel() do simulador." },

  { type:"labtask", title:"Sub-tarefa (2a) — Primeiro estado do GOTOXY",
    context:"<p>Vais escrever a máquina de estados. O enunciado é explícito sobre a ordem das ações.</p>",
    q:"O que faz o robô no primeiro estado, antes de avançar?",
    kind:"mcq",
    options:["Avança devagar enquanto roda","Roda no lugar até estar alinhado com o ponto final (|erro_ang| < limiar)","Desacelera","Roda para a orientação final θf"],
    answer:1,
    hints:["'At the first state it will rotate until aligned with the end point and only then you should move forward.'"],
    solution:"ROTATE: v=0, ω=±W_NOM até |erro_ang| < MAX_ETF. Só depois GO_FORWARD. Cuidado: alinhamento é com a DIREÇÃO PARA O PONTO (erro_ang), não com θf (esse é o FINAL_ROT)." },

  { type:"labtask", title:"Sub-tarefa (2b) — erro_ang no código",
    context:"<p>No teu GOTOXY precisas de calcular o erro de orientação ao ponto-alvo. Pose estimada: (xr, yr, tr); alvo: (xf, yf).</p>",
    q:"Escreve a expressão de erro_ang (usa atan2, xf, xr, yf, yr, tr; ex. de formato: atan2(yf-yr,xf-xr)-tr):",
    kind:"input",
    answer:["atan2(yf-yr,xf-xr)-tr","atan2((yf-yr),(xf-xr))-tr"],
    hints:["Ângulo da reta robô→alvo menos a orientação atual.","atan2(Δy, Δx) − tr, com Δy=yf−yr e Δx=xf−xr."],
    solution:"<code>erro_ang := atan2(yf-yr, xf-xr) - tr;</code> seguido de normalização para [−π, π] (senão o robô pode dar a volta longa!). No SimTwo há uma função de normalização de ângulo — usa-a sempre." },

  { type:"labtask", title:"Sub-tarefa (3) — Rampas",
    context:"<p>Implementaste DVMAX/DWMAX. Testa: manda o robô para um alvo distante e observa a velocidade na Sheet.</p>",
    q:"Com DVMAX = 0,02 m/s por ciclo (40 ms), qual é a aceleração máxima equivalente em m/s²?",
    kind:"input", answer: 0.5, tolerance: 0.01, unit:"m/s²",
    hints:["a = Δv/Δt = 0,02/0,04."],
    solution:"a_max = 0,02/0,04 = <b>0,5 m/s²</b>. Escolhe DVMAX de acordo com a aceleração que as rodas aguentam sem derrapar — liga diretamente ao erro de odometria do M1(e)." },

  { type:"labtask", title:"Sub-tarefa (4a) — Lei do FollowLine",
    context:"<p>No estado GO_FORWARD do FollowLine substituis a equação do ω.</p>",
    q:"Qual é a lei correta para ω?",
    kind:"mcq",
    options:["ω = −K_d·distanceToLine − K_θ·(θr − θ_linha)",
             "ω = K_d·erro_dist_ao_ponto_final",
             "ω = −K_θ·(θr − θf)",
             "ω = −K_d·distanceToLine (só a distância chega)"],
    answer:0,
    hints:["Dois termos: puxar para a linha E alinhar com ela.","Só distância → oscila cruzando a linha; só ângulo → paralelo sem apanhar a linha."],
    solution:"ω = −K_d·dist − K_θ·(θr − θ_linha). O sinal da distância (produto externo!) garante que puxa para o lado certo; o termo angular amortece a aproximação." },

  { type:"labtask", title:"Sub-tarefa (4b/4c) — Robustez a erros grandes",
    context:"<p>Coloca o robô longe da linha e mal orientado; testa o comportamento com e sem as correções.</p>",
    q:"O robô está fora do segmento, antes de (xi,yi), e muito longe da linha. Segundo o enunciado (4c), o que deve fazer?",
    kind:"mcq",
    options:["FollowLine com ganhos maiores","GotoXY(xi, yi) primeiro e só depois seguir a linha","Seguir a normal à linha em linha reta","Parar e pedir novo alvo"],
    answer:1,
    hints:["'If the robot is not between (xi,yi) and (xf,yf) then GotoXY(xi,yi) and then follow the line.'"],
    solution:"Se está fora do segmento → <b>GotoXY(xi,yi)</b> e depois FollowLine; se está dentro mas longe → GotoXY até ao <b>ponto mais próximo</b> da linha. E em qualquer caso, ω limitado (4b).<br><br>🏁 <b>Labwork 2 concluída!</b> O M2 fica completo e o M3 (omnidirecional) desbloqueia. Trabalho complementar (opcional): seguir curvas paramétricas polinomiais — já tens a teoria no módulo 4." }
]}
]};
