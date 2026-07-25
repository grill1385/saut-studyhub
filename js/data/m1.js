// M1 — Lab 1: Odometria e equações de movimento (KinematicsDynamics)
window.SAUT_CONTENT = window.SAUT_CONTENT || {};
window.SAUT_CONTENT["m1"] = { modules: [

/* ============ MÓDULO 1 — Cinemática do robô diferencial ============ */
{ id:"m1-mod1", title:"Cinemática do robô diferencial", minutes:30, kind:"study",
  blurb:"Das velocidades das rodas (v1, v2) a V e ω; equações contínuas e discretas. Kinematics, págs. 3–5.",
  pages:[
  { type:"theory", title:"O modelo contínuo",
    html:`<p>A pose do robô é <b>X = (x, y, θ)</b> num referencial global. Para tração diferencial:</p>
    <span class="formula">ẋ(t) = v(t)·cos(θ(t))<br>ẏ(t) = v(t)·sin(θ(t))<br>θ̇(t) = ω(t)</span>
    <p>onde as velocidades do robô vêm das velocidades lineares das duas rodas (b = distância entre rodas):</p>
    <span class="formula">v(t) = (v1(t) + v2(t)) / 2 &nbsp;&nbsp;&nbsp;&nbsp; ω(t) = (v1(t) − v2(t)) / b</span>
    <div class="hl">Convenção: v1 = roda direita, v2 = roda esquerda (confirma o sinal de ω no simulador — se rodar ao contrário, troca!). A velocidade lateral é sempre 0: o diferencial é não-holonómico.</div>`,
    figures:[{src:"assets/slides/kinematics/page-04.png", caption:"Slide 4 — Equações contínuas da tração diferencial", focus:"o sistema de 3 equações e as fórmulas de v(t) e ω(t) — memoriza a divisão por 2 e por b"}],
    slideRef:"MobileRobotics_KinematicsDynamics, págs. 3–4" },

  { type:"theory", title:"Versão discreta: Δd e Δθ",
    html:`<p>O controlador corre em ciclos discretos (SimTwo: 40 ms). Em cada ciclo i cada roda percorreu <code>Δd1(i)</code> e <code>Δd2(i)</code> (dos encoders: <code>Δd = K·N_imp</code>). O deslocamento do robô no ciclo:</p>
    <span class="formula">Δd(i) = (Δd1(i) + Δd2(i)) / 2 &nbsp;&nbsp;&nbsp;&nbsp; Δθ(i) = (Δd1(i) − Δd2(i)) / b</span>
    <p>Estas duas quantidades são o <b>input</b> das equações de odometria. Repara na analogia perfeita com o contínuo: média → deslocamento linear; diferença/b → rotação.</p>
    <div class="exam">Estas fórmulas aparecem dentro do pose_update do exame (P2). Escreve-as sem hesitar.</div>`,
    figures:[{src:"assets/slides/kinematics/page-05.png", caption:"Slide 5 — Discrete time kinematics", focus:"Δd(i) e Δθ(i) — a base de toda a odometria"}],
    slideRef:"Kinematics, pág. 5" },

  { type:"quiz", title:"Checkpoint — cinemática", questions:[
    { kind:"input", q:"Num ciclo, a roda direita avança Δd1 = 0,012 m e a esquerda Δd2 = 0,008 m, com b = 0,4 m. Qual é Δθ nesse ciclo (em rad)?",
      answer: 0.01, tolerance: 0.0005, unit:"rad",
      hint:"Δθ = (Δd1 − Δd2)/b.",
      explain:"Δθ = (0,012−0,008)/0,4 = 0,01 rad. E Δd = (0,012+0,008)/2 = 0,01 m." },
    { kind:"mcq", q:"Se v1 = 0,3 m/s e v2 = 0,1 m/s (b = 0,4 m), o robô descreve:",
      options:["Linha reta a 0,2 m/s","Arco com v = 0,2 m/s e ω = 0,5 rad/s","Rotação pura com ω = 1 rad/s","Arco com v = 0,4 m/s"], answer:1,
      hint:"Aplica v=(v1+v2)/2 e ω=(v1−v2)/b.",
      explain:"v = 0,4/2 = 0,2 m/s; ω = 0,2/0,4 = 0,5 rad/s → raio R = v/ω = 0,4 m." },
    { kind:"flash", front:"Escreve de cor as 4 fórmulas: v, ω (contínuo) e Δd, Δθ (discreto).", back:"v=(v1+v2)/2; ω=(v1−v2)/b; Δd=(Δd1+Δd2)/2; Δθ=(Δd1−Δd2)/b. Média = avanço, diferença/b = rotação." }
  ]},

  { type:"theory", title:"Do encoder ao deslocamento da roda",
    html:`<p>Cadeia completa (o que acontece a cada ciclo de 40 ms no SimTwo):</p>
    <ol><li>Encoder da roda j dá <code>N_j</code> impulsos no ciclo (<code>GetAxisOdo</code>)</li>
    <li><code>Δd_j = K · N_j</code> — com K [m/imp] medido/calculado</li>
    <li><code>Δd = (Δd1+Δd2)/2</code>, <code>Δθ = (Δd1−Δd2)/b</code></li>
    <li>Atualizar a pose com as equações de discretização (próximo módulo)</li></ol>
    <div class="hl">K e b são os DOIS parâmetros a identificar experimentalmente na Lab 1 (tarefas a–c). Erros em K ou b criam erros <i>sistemáticos</i> na odometria.</div>`,
    slideRef:"Kinematics, pág. 5 + enunciado Lab 1" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"O robô anda em linha reta mas a odometria curva ligeiramente para a esquerda de forma consistente. Causa provável:",
      options:["Ruído aleatório dos encoders","Diâmetros das rodas ligeiramente diferentes (K1≠K2) — erro sistemático","O ciclo de controlo é lento","A roda livre está presa"], answer:1,
      hint:"Consistente = sistemático, não aleatório.",
      explain:"Se uma roda tem diâmetro maior, o mesmo nº de impulsos corresponde a mais metros → Δθ falso constante. Slides 8–11 tratam a compensação destes erros." },
    { kind:"input", q:"K = 0,0002 m/imp e num ciclo o encoder direito conta 50 impulsos e o esquerdo 50. Quanto avançou o robô (em metros)?",
      answer: 0.01, tolerance: 0.0005, unit:"m",
      hint:"Δd1 = Δd2 = K·50; depois faz a média.",
      explain:"Δd1=Δd2=0,01 m → Δd = 0,01 m, Δθ = 0 (linha reta)." },
    { kind:"flash", front:"Quais os 2 parâmetros físicos a identificar na Lab 1 e que erro provocam se estiverem mal?", back:"<b>K</b> (m/impulso) e <b>b</b> (distância entre rodas). Erros nestes parâmetros → erros SISTEMÁTICOS (repetíveis, calibráveis) na odometria." }
  ]}
]},

/* ============ MÓDULO 2 — Discretização e pose_update ============ */
{ id:"m1-mod2", title:"Discretização: forward vs centered + pose_update", minutes:35, kind:"study",
  blurb:"As duas discretizações, porquê a centrada é melhor, e o código pose_update de cor. Kinematics, págs. 6–7. ★ Perguntas 1 e 2 do exame.",
  pages:[
  { type:"theory", title:"Forward difference",
    html:`<p>A forma mais simples de atualizar a pose: usar a orientação do <b>início</b> do ciclo:</p>
    <span class="formula">x(i+1) = x(i) + Δd(i)·cos(θ(i))<br>y(i+1) = y(i) + Δd(i)·sin(θ(i))<br>θ(i+1) = θ(i) + Δθ(i)</span>
    <p>Problema: se o robô rodou durante o ciclo, a direção real do deslocamento foi <i>a meio caminho</i> entre θ(i) e θ(i+1) — usar θ(i) introduz um erro que se acumula em curvas.</p>`,
    figures:[{src:"assets/slides/kinematics/page-06.png", caption:"Slide 6 — Forward difference discretization", focus:"repara que o cos/sin usam θ(i) sem correção"}],
    slideRef:"Kinematics, pág. 6" },

  { type:"theory", title:"Centered difference — a que deves usar",
    html:`<p>Usar a orientação <b>média</b> do ciclo, θ(i) + Δθ(i)/2:</p>
    <span class="formula">x(i+1) = x(i) + Δd(i)·cos(θ(i) + Δθ(i)/2)<br>y(i+1) = y(i) + Δd(i)·sin(θ(i) + Δθ(i)/2)<br>θ(i+1) = θ(i) + Δθ(i)</span>
    <div class="exam">P1 do exame: centered é MAIS PRECISA que forward porque usa a orientação média durante o deslocamento (aproximação de 2ª ordem do arco), reduzindo o erro de discretização em trajetórias curvas.</div>
    <div class="exam">P2 do exame: escrever este código. Em Pascal/SimTwo:<br>
    <code>ds := K*(odo1+odo2)/2;</code><br>
    <code>dtheta := K*(odo1-odo2)/b;</code><br>
    <code>x := x + ds*cos(theta + dtheta/2);</code><br>
    <code>y := y + ds*sin(theta + dtheta/2);</code><br>
    <code>theta := theta + dtheta;</code></div>
    <p>Nota: θ é atualizado <b>depois</b> de x e y (usa o θ antigo dentro do cos/sin!).</p>`,
    figures:[{src:"assets/slides/kinematics/page-07.png", caption:"Slide 7 — Centered difference discretization", focus:"o termo θ(i)+Δθ(i)/2 dentro do cos e do sin — é ISTO que o exame pede"}],
    slideRef:"Kinematics, pág. 7" },

  { type:"quiz", title:"Checkpoint — discretização (formato exame)", questions:[
    { kind:"mcq", q:"[P1 exame] Qual das discretizações estima a pose com mais precisão e porquê?",
      options:["Forward — usa menos operações","Centered — usa a orientação média θ+Δθ/2 durante o deslocamento","Forward — evita o erro do Δθ","São equivalentes se o ciclo for curto"], answer:1,
      hint:"Durante o ciclo o robô rodou Δθ; qual foi a orientação 'média' do deslocamento?",
      explain:"A centered aproxima o deslocamento pelo segmento com a orientação média do arco — erro de ordem superior. A forward acumula erro sempre que há rotação." },
    { kind:"mcq", q:"[P2 exame] No pose_update com discretização centrada, o argumento do cos() é:",
      options:["theta","theta + dtheta","theta + dtheta/2","dtheta/2"], answer:2,
      hint:"Orientação média do ciclo.",
      explain:"x := x + ds*cos(theta + dtheta/2). Se usares theta+dtheta estás a usar a orientação FINAL (também errado)." },
    { kind:"flash", front:"Escreve mentalmente (ou em papel!) o pose_update completo em 5 linhas.", back:"ds:=K*(odo1+odo2)/2;<br>dtheta:=K*(odo1-odo2)/b;<br>x:=x+ds*cos(theta+dtheta/2);<br>y:=y+ds*sin(theta+dtheta/2);<br>theta:=theta+dtheta;<br><i>Treina por ESCRITO — cai quase sempre.</i>" },
    { kind:"mcq", q:"Porque é que theta só é atualizado na última linha?",
      options:["Por convenção de estilo","Porque x e y devem usar o theta do início do ciclo (+dtheta/2), não o final","Porque o compilador exige","Não faz diferença"], answer:1,
      explain:"Se atualizasses theta primeiro, cos(theta+dtheta/2) usaria θ(i+1)+Δθ/2 — deslocamento com orientação errada." }
  ]},

  { type:"theory", title:"Interpretação geométrica e caso ω=0",
    html:`<p>Geometricamente, durante um ciclo com Δθ≠0 o robô percorre um <b>arco de circunferência</b> de raio R = Δd/Δθ. A solução exata do arco é:</p>
    <span class="formula">x(i+1) = x(i) + R·[sin(θ+Δθ) − sin(θ)]<br>y(i+1) = y(i) − R·[cos(θ+Δθ) − cos(θ)]</span>
    <p>A discretização centrada é a aproximação desta expressão para Δθ pequeno (evita a divisão por Δθ→0). Para Δθ=0 ambas caem na forward (linha reta exata).</p>
    <div class="hl">Se no exame aparecer a forma "exata" com sin/cos de (θ+Δθ), reconhece-a: é o modelo de arco, equivalente à centered para Δθ pequeno.</div>`,
    slideRef:"Kinematics, págs. 6–7 (interpretação)" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"input", q:"Num ciclo: Δd = 0,02 m, Δθ = 0,1 rad, θ(i) = 0. Com discretização CENTRADA, qual é o incremento em x (Δx = Δd·cos(θ+Δθ/2))? (4 casas decimais, em metros)",
      answer: 0.02, tolerance: 0.0001, unit:"m",
      hint:"cos(0,05) ≈ 0,99875 — multiplica por 0,02.",
      explain:"Δx = 0,02·cos(0,05) = 0,019975 ≈ 0,0200 m. (Δy = 0,02·sin(0,05) ≈ 0,0010 m — a forward daria Δy=0!)" },
    { kind:"mcq", q:"A diferença mais visível entre forward e centered surge quando o robô:",
      options:["Anda depressa em linha reta","Faz curvas (Δθ grande por ciclo)","Está parado","Tem encoders de alta resolução"], answer:1,
      explain:"Em linha reta Δθ=0 e são idênticas; a vantagem da centered aparece na rotação." },
    { kind:"flash", front:"R = Δd/Δθ representa o quê?", back:"O raio do arco percorrido nesse ciclo (CIR — centro instantâneo de rotação). Vai ser útil na Lab 1 tarefa (c): estimar o raio da trajetória circular para calibrar K e b." }
  ]}
]},

/* ============ MÓDULO 3 — Erros de odometria ============ */
{ id:"m1-mod3", title:"Erros de odometria e compensação", minutes:25, kind:"study",
  blurb:"Erros sistemáticos (diâmetros, b) vs aleatórios (derrapagem); porquê o EKF é necessário. Kinematics, págs. 8–11.",
  pages:[
  { type:"theory", title:"Erros sistemáticos",
    html:`<p>Fontes principais (slides 8–11):</p>
    <ul><li><b>Diâmetros das rodas diferentes</b> do nominal (ou entre si) → K errado</li>
    <li><b>Distância entre rodas b mal estimada</b> → Δθ errado (o ponto de contacto do pneu não é um ponto!)</li></ul>
    <p>Factos importantes dos slides:</p>
    <ul><li>Fontes diferentes podem gerar <b>o mesmo erro final</b> — difícil separá-las com uma só experiência</li>
    <li>Erros podem <b>cancelar-se mutuamente</b> num sentido…</li>
    <li>…e <b>somar-se ao percorrer no sentido oposto</b> — por isso os testes de calibração fazem-se nos dois sentidos!</li>
    <li>Repetir a experiência várias vezes separa o sistemático (média) do aleatório (dispersão)</li></ul>`,
    figures:[{src:"assets/slides/kinematics/page-08.png", caption:"Slide 8 — Erros sistemáticos: mesmas consequências", focus:"dois defeitos diferentes → mesma pose final errada"},
             {src:"assets/slides/kinematics/page-10.png", caption:"Slide 10 — Sentido oposto", focus:"o mesmo defeito produz erro diferente ao inverter o sentido — base do método de calibração bidirecional"}],
    slideRef:"Kinematics, págs. 8–11" },

  { type:"theory", title:"Erros aleatórios e o crescimento sem limite",
    html:`<p><b>Derrapagem (slippage)</b>, piso irregular, quantização dos encoders → erros <b>aleatórios</b>, não calibráveis. Na Lab 1 (tarefa e) vais VER isto: acelera/trava bruscamente e a pose estimada foge da real.</p>
    <div class="hl">A odometria é dead-reckoning: cada ciclo soma um pequeno erro ao anterior → a incerteza <b>cresce sem limite</b> com a distância percorrida. Nenhuma calibração resolve isto.</div>
    <p>Consequência para toda a UC: a odometria serve de <b>predição</b> de curto prazo, mas precisa de <b>correção</b> por sensores externos → Filtro de Kalman (M4/M5), Monte Carlo e map matching (M6).</p>
    <div class="exam">No EKF, o ruído da odometria entra na matriz <b>Q</b> (ruído do modelo/processo); o dos sensores externos na <b>R</b>. Fixa esta associação desde já.</div>`,
    slideRef:"Kinematics, págs. 8–11 + Lab 1 (e)" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Qual destes erros de odometria é ALEATÓRIO (não sistemático)?",
      options:["Diâmetro da roda 2% acima do nominal","b usado no código 5 mm mais curto","Derrapagem ao acelerar bruscamente","Encoder que conta 1024 imp/volta em vez de 1000"], answer:2,
      hint:"Sistemático = repetível e calibrável.",
      explain:"A derrapagem varia de forma imprevisível — só se mitiga com fusão sensorial (EKF), não com calibração." },
    { kind:"mcq", q:"Porque se fazem os testes de calibração de odometria nos DOIS sentidos do percurso?",
      options:["Para aquecer os motores","Porque erros que se cancelam num sentido somam-se no oposto, revelando-se","Para duplicar os dados","Para testar os dois encoders"], answer:1,
      explain:"Slides 9–10: um defeito pode ser invisível num sentido e evidente no outro — o teste bidirecional separa as fontes." },
    { kind:"flash", front:"Q vs R no Kalman: qual corresponde à odometria?", back:"<b>Q</b> = ruído do modelo/processo → odometria (predição). <b>R</b> = ruído da medida → sensores externos (laser, beacons). No exame há uma pergunta direta sobre o equilíbrio Q vs R!" },
    { kind:"flash", front:"Porque é que o erro da odometria 'cresce sem limite'?", back:"É integração pura (dead-reckoning): erro de cada ciclo acumula no seguinte, sem nenhuma medição absoluta que o limite. Var(erro) cresce com a distância percorrida." }
  ]}
]},

/* ============ MÓDULO 4 — Labwork 1 guiado ============ */
{ id:"m1-mod4", title:"Labwork 1 — Odometria no SimTwo (guiado)", minutes:60, kind:"labwork",
  blurb:"Resolução guiada da Lab 1: calibrar K e b, implementar predictPosition e observar o erro. Acompanha no SimTwo!",
  pages:[
  { type:"theory", title:"Enquadramento e plataforma",
    html:`<p><b>Tema:</b> odometria e equações de movimento de um robô diferencial.</p>
    <p><b>Plataforma:</b> simulador <b>SimTwo</b> (pasta <code>Lab_1/SimTwo64_LabWork__1_stud</code>). Abre o <code>SimTwo.exe</code>, o editor de código (Ctrl+E) e lê as secções 1–3 do manual.</p>
    <p><b>Módulos necessários:</b> os 3 módulos anteriores (cinemática, discretização, erros) + M0-mod3 (encoders).</p>
    <p><b>Estrutura do código:</b> o procedimento <code>Control</code> corre a cada 40 ms. A leitura dos encoders já está feita:</p>
    <pre><code>//Update odometry
odo1 := GetAxisOdo(0,0);  imp1 := imp1 + odo1;
odo2 := GetAxisOdo(0,1);  imp2 := imp2 + odo2;</code></pre>
    <p><code>odo1/odo2</code> = impulsos neste ciclo; <code>imp1/imp2</code> = acumulado (OdoAcum). Ctrl+H + "RESET POS" faz reset à posição e aos acumuladores.</p>`,
    slideRef:"Enunciado SAUT_LabWork_1 + Manual SimTwo, secções 1–3" },

  { type:"theory", title:"Enunciado e etapas — clica COMEÇAR",
    html:`<p>Tarefas do enunciado:</p>
    <ol><li><b>(a)</b> Mover o robô ≥1 m em linha reta (seta ↑, KeyControl) e calcular a relação impulsos↔deslocamento (K)</li>
    <li><b>(b)</b> Rodar ≥π rad no lugar (setas ←/→) e calcular a distância entre rodas b</li>
    <li><b>(c)</b> Movimento composto (↑+→, VEL_LIN_NOM=2, INC_VEL_ANG=0.4, 180° de arco): obter K e b numa só experiência</li>
    <li><b>(d)</b> Implementar <code>predictPosition(odo1, odo2)</code> com as equações discretas (variáveis globais x, y, theta já definidas; chamar em Control)</li>
    <li><b>(e)</b> Comparar pose estimada vs real (User Charts, Ctrl+T) e observar o erro a crescer com acelerações/derrapagem</li></ol>
    <p>Nas próximas subpáginas vais resolver cada tarefa passo a passo. Faz cada experiência no SimTwo <b>antes</b> de responder — os números aqui usados são de uma execução de referência. Carrega em <b>Seguinte</b> para COMEÇAR.</p>`,
    slideRef:"SAUT_LabWork__1_Odo_en_V24Sept2024.pdf" },

  { type:"labtask", title:"Sub-tarefa (a) — Calcular K",
    context:"<p>No SimTwo: RESET POS, avança em linha reta e lê a posição final (Config Form → Robot Position) e o OdoAcum. Execução de referência: o robô avançou <b>1,000 m</b> e cada encoder acumulou <b>4900 impulsos</b>.</p>",
    q:"Qual é a constante K, em m/impulso? (ex.: 0.000204)",
    kind:"input", answer: 0.000204, tolerance: 0.000003, unit:"m/imp",
    hints:["K = deslocamento da roda ÷ impulsos acumulados dessa roda.","Em linha reta ambas as rodas percorrem 1,000 m → K = 1,000/4900."],
    solution:"<b>K = 1,000/4900 ≈ 2,041×10⁻⁴ m/imp.</b> Confere no teu SimTwo: o valor exato depende do robô, mas o método é sempre distância/impulsos. Regista o TEU valor — vais usá-lo em (d)." },

  { type:"labtask", title:"Sub-tarefa (b) — Calcular b",
    context:"<p>RESET POS e roda o robô no lugar ≥π rad. Referência: após uma rotação de exatamente <b>π rad</b> (180°), imp1 = <b>+2310</b> e imp2 = <b>−2310</b> (K = 2,041×10⁻⁴).</p>",
    q:"Qual é a distância entre rodas b, em metros? (2 casas decimais)",
    kind:"input", answer: 0.30, tolerance: 0.01, unit:"m",
    hints:["Δθ_total = (d1 − d2)/b, com d_j = K·imp_j.","d1 = 2310×2,041e−4 ≈ 0,4715 m; d2 = −0,4715 m → b = (d1−d2)/π."],
    solution:"d1 = K·2310 ≈ 0,4715 m, d2 ≈ −0,4715 m.<br><b>b = (d1 − d2)/Δθ = 0,943/π ≈ 0,30 m.</b><br>Nota o padrão exame: rotação no lugar → cada roda percorre um arco de raio b/2." },

  { type:"labtask", title:"Sub-tarefa (c) — Movimento composto",
    context:"<p>Com VEL_LIN_NOM = 2 e INC_VEL_ANG = 0.4 (↑+→ em simultâneo), o robô descreve um arco. Após 180° de variação de ângulo podes estimar o raio pela posição final.</p>",
    q:"Qual é o raio teórico da trajetória circular, em metros? (R = V/ω)",
    kind:"input", answer: 5, tolerance: 0.1, unit:"m",
    hints:["Movimento circular uniforme: R = V/ω.","V = 2 m/s, ω = 0,4 rad/s."],
    solution:"<b>R = V/ω = 2/0,4 = 5 m.</b> Na prática mede-se R pela pose final (após 180°, o robô está a 2R do início) → distância linear percorrida = π·R ≈ 15,7 m dá K; a variação angular π dá b. Uma experiência, dois parâmetros." },

  { type:"labtask", title:"Sub-tarefa (d1) — predictPosition: Δd e Δθ",
    context:"<p>Vais agora implementar <code>predictPosition(odo1, odo2: double)</code> no editor do SimTwo (Ctrl+E), chamada em cada ciclo a partir de <code>Control</code>.</p>",
    q:"Qual é o par de expressões correto para o deslocamento e rotação do ciclo?",
    kind:"mcq",
    options:["ds := K*(odo1−odo2)/2; dtheta := K*(odo1+odo2)/b;",
             "ds := K*(odo1+odo2)/2; dtheta := K*(odo1−odo2)/b;",
             "ds := K*(odo1+odo2)/b; dtheta := K*(odo1−odo2)/2;",
             "ds := (odo1+odo2)/(2*K); dtheta := (odo1−odo2)/(b*K);"],
    answer:1,
    hints:["Média das rodas → avanço; diferença ÷ b → rotação.","Os impulsos multiplicam por K (m/imp) para dar metros."],
    solution:"<code>ds := K*(odo1+odo2)/2;</code> e <code>dtheta := K*(odo1−odo2)/b;</code> — módulo 1 deste milestone. A opção D inverte K (dividiria por K)." },

  { type:"labtask", title:"Sub-tarefa (d2) — predictPosition: atualização da pose",
    context:"<p>Falta o corpo principal. Lembra-te: discretização CENTRADA e θ atualizado no fim.</p>",
    q:"Qual é o bloco correto?",
    kind:"mcq",
    options:["x:=x+ds*cos(theta); y:=y+ds*sin(theta); theta:=theta+dtheta;",
             "theta:=theta+dtheta; x:=x+ds*cos(theta); y:=y+ds*sin(theta);",
             "x:=x+ds*cos(theta+dtheta/2); y:=y+ds*sin(theta+dtheta/2); theta:=theta+dtheta;",
             "x:=x+ds*cos(dtheta/2); y:=y+ds*sin(dtheta/2); theta:=theta+dtheta;"],
    answer:2,
    hints:["Orientação média do ciclo dentro do cos/sin.","A opção A é a forward (menos precisa); a B atualiza theta cedo demais."],
    solution:"Opção C — o pose_update centrado (P2 do exame!):<br><code>x := x + ds*cos(theta + dtheta/2);<br>y := y + ds*sin(theta + dtheta/2);<br>theta := theta + dtheta;</code><br>Escreve-o no SimTwo, inicializa (x,y,theta) com a pose mostrada no simulador e corre." },

  { type:"labtask", title:"Sub-tarefa (e) — Observar o erro",
    context:"<p>Liga o Chart na Sheet form, Ctrl+T → User Charts: pose real vs estimada. Conduz suavemente; depois faz acelerações e travagens bruscas.</p>",
    q:"O que observas no erro da pose estimada quando acce/travas bruscamente, e porquê?",
    kind:"mcq",
    options:["O erro diminui — os encoders contam mais impulsos","O erro dá saltos e cresce — derrapagem: as rodas rodam sem o robô se mover de forma correspondente","O erro mantém-se constante","O erro oscila mas volta a zero"],
    answer:1,
    hints:["O que assume o modelo de odometria sobre o contacto roda–chão?"],
    solution:"Derrapagem (slippage): o encoder conta rotação que não corresponde a deslocamento real — o modelo de rolamento puro é violado e o erro salta e ACUMULA (nunca volta atrás sozinho). É a motivação direta do EKF (M4/M5).<br><br>🏁 <b>Labwork 1 concluída!</b> Ao terminar esta página (e as anteriores), o M1 fica completo e o M2 desbloqueia." }
]}
]};
