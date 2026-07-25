// M4 — Lab 4: Localização por EKF com beacons (Matlab) — ALTA+ (núcleo do exame)
window.SAUT_CONTENT = window.SAUT_CONTENT || {};
window.SAUT_CONTENT["m4"] = { modules: [

/* ============ 4.1-A — Filtro de Kalman linear ============ */
{ id:"m4-mod1", title:"4.1 · Filtro de Kalman linear: o ciclo e as covariâncias", minutes:40, kind:"study",
  blurb:"Modelo linear, ciclo predição→atualização, significado de P, Q, R e do ganho K. Deck Kalman (7 págs, ALTA+). ★ Pergunta do exame sobre Q vs R.",
  pages:[
  { type:"theory", title:"O problema e o modelo linear",
    html:`<p>Queremos estimar o estado <b>X</b> (para nós: a pose do robô) a partir de um <b>modelo</b> com ruído e de <b>medidas</b> com ruído:</p>
    <span class="formula">X(k+1) = A·X(k) + B·u(k) + w(k) &nbsp;&nbsp;(modelo, ruído w ~ N(0, Q))<br>z(k) = H·X(k) + v(k) &nbsp;&nbsp;(medida, ruído v ~ N(0, R))</span>
    <ul><li><b>Q</b> — covariância do ruído do <b>processo/modelo</b> (a odometria não é perfeita)</li>
    <li><b>R</b> — covariância do ruído da <b>medida</b> (o sensor não é perfeito)</li>
    <li><b>P</b> — covariância da <b>estimativa</b> do estado (a nossa incerteza atual)</li></ul>
    <div class="hl">Associação a decorar (aparece em várias perguntas): <b>Q ↔ modelo/odometria; R ↔ sensor; P ↔ estimativa</b>.</div>`,
    figures:[{src:"assets/slides/kalman/page-02.png", caption:"Slide 2 — Modelo linear discreto e ruídos", focus:"onde entra Q (ruído do modelo) e R (ruído da medida)"}],
    slideRef:"SAUT_KalmanFilter, pág. 2" },

  { type:"theory", title:"O ciclo predição → atualização",
    html:`<p>O KF alterna duas fases em cada ciclo:</p>
    <p><b>PREDIÇÃO (time update)</b> — usa o modelo:</p>
    <span class="formula">X̂⁻ = A·X̂ + B·u<br>P⁻ = A·P·Aᵀ + Q</span>
    <p>— a incerteza P <b>cresce</b> (soma-se Q).</p>
    <p><b>ATUALIZAÇÃO (measurement update)</b> — usa a medida:</p>
    <span class="formula">K = P⁻Hᵀ(H·P⁻·Hᵀ + R)⁻¹<br>X̂ = X̂⁻ + K·(z − H·X̂⁻)<br>P = (I − K·H)·P⁻</span>
    <p>— a incerteza P <b>diminui</b>. O termo <code>z − H·X̂⁻</code> é a <b>inovação</b>: a diferença entre o que medimos e o que esperávamos medir.</p>
    <div class="hl">É o padrão que já conheces do M0/M1: odometria (deriva) faz a predição; sensores externos (correção) fazem a atualização.</div>`,
    figures:[{src:"assets/slides/kalman/page-03.png", caption:"Slide 3 — O ciclo do KF (Welch & Bishop)", focus:"o loop: time update ↔ measurement update, e as 5 equações de cada lado"}],
    slideRef:"SAUT_KalmanFilter, pág. 3" },

  { type:"theory", title:"O ganho K: quem manda, o modelo ou as medidas? ★",
    html:`<p>O ganho <code>K = P⁻Hᵀ(HP⁻Hᵀ + R)⁻¹</code> pesa a confiança relativa:</p>
    <ul><li><b>P⁻ grande face a R</b> (predição incerta, sensor bom) → K grande → a estimativa <b>segue as medidas</b> (e apanha o ruído delas)</li>
    <li><b>R grande face a P⁻</b> (sensor ruidoso, modelo bom) → K pequeno → a estimativa <b>quase ignora as medidas</b> e segue o modelo</li></ul>
    <p>Casos-limite: R→0 ⇒ X̂ = medida; P⁻→0 ⇒ X̂ = predição.</p>
    <div class="exam">Pergunta do exame sobre o KF: dá-te uma relação entre a covariância da predição e a das medidas e pergunta se a estimativa é muito/pouco influenciada pelo ruído das medidas. Lê COM CUIDADO qual das covariâncias é a alta e aplica a regra acima: confia-se sempre no lado com covariância mais BAIXA.</div>`,
    slideRef:"SAUT_KalmanFilter, págs. 2–3 (interpretação do ganho)" },

  { type:"quiz", title:"Checkpoint — KF linear (formato exame)", questions:[
    { kind:"mcq", q:"[Exame] Se a covariância do ruído das medidas (R) é muito alta face à incerteza da predição (P⁻), então:",
      options:["A estimativa segue de perto as medidas","O ganho K é pequeno e a estimativa é pouco influenciada pelas medidas (segue o modelo)","O filtro diverge sempre","P cresce sem limite"], answer:1,
      hint:"K = P⁻Hᵀ(HP⁻Hᵀ+R)⁻¹ — o que acontece a K quando R domina o denominador?",
      explain:"R grande → K pequeno → correção fraca: confia-se no modelo. Regra: o filtro confia no lado de covariância mais baixa." },
    { kind:"mcq", q:"Em que fase do ciclo a covariância P da estimativa AUMENTA?",
      options:["Na atualização (medida)","Na predição (soma-se Q)","Nunca aumenta","Só quando o robô para"], answer:1,
      explain:"P⁻ = APAᵀ + Q: cada predição sem medidas acumula incerteza — é a odometria a derivar. A atualização (I−KH)P reduz P." },
    { kind:"flash", front:"Q, R, P — associa cada matriz à sua fonte física no robô.", back:"<b>Q</b>: ruído do modelo/odometria (derrapagem, discretização). <b>R</b>: ruído do sensor (laser, câmara). <b>P</b>: incerteza da MINHA estimativa da pose (elipse de incerteza)." },
    { kind:"input", q:"Num KF escalar: P⁻ = 4, R = 1, H = 1. Qual é o ganho K = P⁻/(P⁻+R)?",
      answer: 0.8, tolerance: 0.01,
      hint:"4/(4+1).",
      explain:"K = 0,8 → a estimativa move-se 80% na direção da medida: predição incerta (P⁻=4) + sensor bom (R=1) ⇒ confiar na medida." }
  ]}
]},

/* ============ 4.1-B — EKF: predição ============ */
{ id:"m4-mod2", title:"4.1 · EKF — fase de predição: f(X,u) e Jacobianos", minutes:45, kind:"study",
  blurb:"Modelo não-linear, linearização, grad_f_X e grad_f_U com as entradas concretas. EKFBeacons, págs. 3–7. ★ Pergunta 11 do exame.",
  pages:[
  { type:"theory", title:"Do KF ao EKF",
    html:`<p>O robô é <b>não-linear</b> (cos/sin de θ). O EKF substitui A e H por <b>linearizações locais</b> (Jacobianos) do modelo não-linear:</p>
    <span class="formula">X(k+1) = f(X(k), u(k)) + w(k) &nbsp;&nbsp;&nbsp; z(k) = h(X(k)) + v(k)</span>
    <p>O ciclo é o mesmo do KF, com <code>∇f_X</code> no lugar de A e <code>∇h_X</code> no lugar de H. Os Jacobianos são calculados <b>na estimativa atual</b> do estado e nos valores atuais das entradas.</p>
    <p>Para o nosso robô diferencial, o <b>motion model</b> é a odometria do M1 (discretização centrada!), com estado X = [x; y; θ] e entradas u = [v; ω]:</p>
    <pre><code>xr_e = xr_e + v*cos(theta_r_e + omega*dt/2)*dt;
yr_e = yr_e + v*sin(theta_r_e + omega*dt/2)*dt;
theta_r_e = NormalizeAng(theta_r_e + omega*dt);</code></pre>`,
    figures:[{src:"assets/slides/ekfbeacons/page-03.png", caption:"EKFBeacons, slide 3 — Motion model", focus:"f(X,u): é o pose_update do M1 com v·dt e ω·dt no lugar de Δd e Δθ"}],
    slideRef:"SAUT_KalmanFilter págs. 4–6 + SAUT_Loc_EKFBeacons pág. 3" },

  { type:"theory", title:"O Jacobiano do motion model ★",
    html:`<p>Derivando f em ordem ao <b>estado</b> [x, y, θ] (linha = equação, coluna = variável):</p>
    <span class="formula">∇f_X = [ 1 &nbsp; 0 &nbsp; −v·dt·sin(θ+ω·dt/2) ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0 &nbsp; 1 &nbsp; +v·dt·cos(θ+ω·dt/2) ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0 &nbsp; 0 &nbsp; 1 ]</span>
    <p>Como ler: a coluna 3 diz "quanto muda cada equação se θ mudar" — só x e y dependem de θ (via cos/sin). A linha 3 (equação do θ) não depende de x nem de y → <b>zeros</b>.</p>
    <div class="exam">P11 do exame: "quanto vale grad_f_x(3,2)?" → linha 3 (equação de θ), coluna 2 (derivada em ordem a y) = <b>0</b> (θ não depende de y). Sabe justificar QUALQUER entrada, não só decorar.</div>
    <p>E em ordem às <b>entradas</b> [v, ω]:</p>
    <span class="formula">∇f_U = [ cos(θ+ω·dt/2)·dt &nbsp;&nbsp; −v·dt·(dt/2)·sin(θ+ω·dt/2) ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; sin(θ+ω·dt/2)·dt &nbsp;&nbsp; +v·dt·(dt/2)·cos(θ+ω·dt/2) ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; dt ]</span>
    <p>A propagação da incerteza usa os dois:</p>
    <span class="formula">P = ∇f_X · P · ∇f_Xᵀ + ∇f_U · Q · ∇f_Uᵀ</span>
    <p>— o 2º termo injeta o ruído das entradas (Q, 2×2 com qV e qω) no espaço do estado.</p>`,
    figures:[{src:"assets/slides/ekfbeacons/page-04.png", caption:"EKFBeacons, slide 4 — ∇f_X", focus:"compara entrada a entrada com a matriz acima; nota os zeros da linha 3"},
             {src:"assets/slides/ekfbeacons/page-06.png", caption:"EKFBeacons, slide 6 — ∇f_U e Q(k)", focus:"Q é 2×2 (ruído de v e ω); ∇f_U·Q·∇f_Uᵀ leva-o para 3×3 no espaço do estado"}],
    slideRef:"EKFBeacons, págs. 4–7" },

  { type:"quiz", title:"Checkpoint — Jacobianos (formato exame)", questions:[
    { kind:"mcq", q:"[P11 exame] No Jacobiano ∇f_X do motion model, a entrada (3,2) vale:",
      options:["−v·dt·sin(θ+ωdt/2)","1","0","dt"], answer:2,
      hint:"Linha 3 = equação de θ; coluna 2 = derivada em ordem a y.",
      explain:"θ(k+1) = θ(k) + ω·dt não depende de y → ∂θ/∂y = 0." },
    { kind:"mcq", q:"E a entrada (1,3) de ∇f_X (linha do x, derivada em ordem a θ)?",
      options:["0","−v·dt·sin(θ+ω·dt/2)","+v·dt·cos(θ+ω·dt/2)","1"], answer:1,
      hint:"x += v·cos(θ+ωdt/2)·dt — deriva o cos.",
      explain:"d/dθ[v·cos(θ+ωdt/2)·dt] = −v·dt·sin(θ+ωdt/2). A entrada (2,3) é a análoga com +cos." },
    { kind:"input", q:"Com v = 1 m/s, dt = 0,04 s e θ+ω·dt/2 = 0: quanto vale ∇f_X(2,3) = v·dt·cos(θ+ωdt/2)?",
      answer: 0.04, tolerance: 0.001,
      hint:"1 × 0,04 × cos(0).",
      explain:"0,04. No exame estas contas aparecem com números concretos — treina substituir." },
    { kind:"flash", front:"Porque é que a diagonal de ∇f_X é [1, 1, 1]?", back:"Cada variável de estado 'transporta-se' a si própria: x(k+1) = x(k) + …, logo ∂x(k+1)/∂x(k) = 1 (idem y, θ). Os Jacobianos avaliam-se na estimativa ATUAL." },
    { kind:"mcq", q:"Na propagação P = ∇f_X·P·∇f_Xᵀ + ∇f_U·Q·∇f_Uᵀ, o segundo termo representa:",
      options:["O ruído dos sensores externos","A injeção do ruído das entradas (v, ω) no espaço do estado","A inovação","A correção do ganho"], answer:1,
      explain:"Q (2×2, ruído de v e ω) é transformado para o espaço 3×3 do estado por ∇f_U. É o equivalente EKF do +Q do KF linear." }
  ]}
]},

/* ============ 4.1-C — EKF: atualização ============ */
{ id:"m4-mod3", title:"4.1 · EKF — atualização: h(M,X), ∇h, S e ganho", minutes:45, kind:"study",
  blurb:"O modelo de medida do beacon, o seu Jacobiano, a covariância S e a correção. EKFBeacons, págs. 8–12. ★ Perguntas 3 e 5 do exame.",
  pages:[
  { type:"theory", title:"O modelo de medida h(M_B, X) ★",
    html:`<p>O sensor mede <b>distância e ângulo</b> ao beacon B em (xB, yB), dado o estado X = [xv, yv, θv]:</p>
    <span class="formula">h(M_B, X) = [ √((xB−xv)² + (yB−yv)²) ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; atan2(yB−yv, xB−xv) − θv ]</span>
    <p>Em Matlab (Lab 4):</p>
    <pre><code>distp_e   = sqrt((xp-xr_e)^2 + (yp-yr_e)^2);
theta_p_e = NormalizeAng(atan2(yp-yr_e, xp-xr_e) - theta_r_e);
z_e = [distp_e; theta_p_e];</code></pre>
    <div class="exam">P3 do exame: dão-te este código e pedem para identificar as variáveis (qual é a pose estimada, qual é o beacon, porquê o −θv…). O −θv converte o ângulo global para o referencial do robô.</div>
    <p>Ruído da medida (nota: o desvio da distância <b>cresce com a distância</b> — 0,05 m por metro):</p>
    <pre><code>R = [ (distp_e*sdv_dist_1m)^2   0 ;
      0                        sdv_ang^2 ];</code></pre>`,
    figures:[{src:"assets/slides/ekfbeacons/page-02.png", caption:"EKFBeacons, slide 2 — Geometria beacon/robô", focus:"identifica (xv, yv, θv), o beacon Bi e as medidas r (distância) e φ (ângulo)"},
             {src:"assets/slides/ekfbeacons/page-08.png", caption:"EKFBeacons, slide 8 — Observation model e R", focus:"h(.) e a estrutura diagonal de R"}],
    slideRef:"EKFBeacons, págs. 2, 8" },

  { type:"theory", title:"O Jacobiano ∇h_X",
    html:`<p>Derivando h em ordem a [xv, yv, θv] (d = distância estimada):</p>
    <span class="formula">∇h_X = [ −(xB−xv)/d &nbsp;&nbsp; −(yB−yv)/d &nbsp;&nbsp; 0 ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (yB−yv)/d² &nbsp;&nbsp; −(xB−xv)/d² &nbsp;&nbsp; −1 ]</span>
    <p>Como ler:</p>
    <ul><li>Linha 1 (distância): não depende de θv → última entrada <b>0</b>. As outras são o vetor unitário robô→beacon com sinal −.</li>
    <li>Linha 2 (ângulo): a derivada do atan2 (denominador d²) e <b>−1</b> em θv (o −θv da fórmula).</li></ul>
    <div class="hl">Tal como no ∇f_X, sabe justificar cada entrada: os zeros e o −1 são as perguntas favoritas.</div>`,
    figures:[{src:"assets/slides/ekfbeacons/page-09.png", caption:"EKFBeacons, slide 9 — ∇h_X", focus:"confere entrada a entrada; nota o 0 (dist não depende de θ) e o −1 (ângulo vs θ)"}],
    slideRef:"EKFBeacons, pág. 9" },

  { type:"theory", title:"S, ganho e correção ★",
    html:`<p><b>Covariância da inovação/medida estimada</b> (P5 do exame!):</p>
    <span class="formula">S = ∇h·P·∇hᵀ + R</span>
    <ul><li><b>1º termo</b> ∇h·P·∇hᵀ — a covariância da pose estimada (P) <b>propagada para o espaço da medida</b>: "quão incerta é a medida que EU espero, por a minha pose ser incerta"</li>
    <li><b>2º termo</b> R — o ruído do próprio <b>sensor</b></li></ul>
    <p>Depois, o ciclo de correção:</p>
    <pre><code>K = P * grad_h_X' * inv(grad_h_X*P*grad_h_X' + R);  % ganho
P = (eye(3) - K*grad_h_X) * P;                      % P diminui
z_dif = z - z_e;
z_dif(2) = NormalizeAng(z_dif(2));                  % ângulo! [-pi,pi]
X_e = X_e + K*z_dif;
X_e(3) = NormalizeAng(X_e(3));</code></pre>
    <p><b>Vários beacons</b> (câmara omni, Lab 4 parte 3): a atualização repete-se <b>sequencialmente para cada observação</b>, reutilizando o X_e e P já corrigidos.</p>
    <div class="hl">Erro clássico: esquecer o NormalizeAng na inovação do ângulo — com o robô perto de ±π, o filtro "corrige" 2π para o lado errado e diverge.</div>`,
    figures:[{src:"assets/slides/ekfbeacons/page-11.png", caption:"EKFBeacons, slide 11 — Ganho e correção", focus:"as 3 equações: K, correção do estado, atualização de P"},
             {src:"assets/slides/ekfbeacons/page-12.png", caption:"EKFBeacons, slide 12 — Nº variável de observações", focus:"o loop de atualização por observação — usado com a câmara omnidirecional"}],
    slideRef:"EKFBeacons, págs. 10–12" },

  { type:"quiz", title:"Checkpoint — atualização (formato exame)", questions:[
    { kind:"mcq", q:"[P5 exame] Em S = ∇h·P·∇hᵀ + R, o primeiro termo representa:",
      options:["O ruído do sensor","A covariância da pose estimada propagada para o espaço da medida","A inovação","O ganho de Kalman"], answer:1,
      hint:"P é a incerteza da pose; ∇h leva-a para o espaço (distância, ângulo).",
      explain:"1º termo = incerteza da medida ESPERADA devida à incerteza da pose; 2º termo (R) = ruído do sensor." },
    { kind:"mcq", q:"[P3 exame] No código 'theta_p_e = atan2(yp-yr_e, xp-xr_e) - theta_r_e', o termo −theta_r_e serve para:",
      options:["Normalizar o ângulo","Converter o ângulo do referencial global para o referencial do robô","Compensar o atraso do sensor","Eliminar o ruído"], answer:1,
      explain:"O sensor mede o ângulo NO REFERENCIAL DO ROBÔ; atan2 dá o ângulo global → subtrai-se θv." },
    { kind:"mcq", q:"Porque é essencial NormalizeAng(z_dif(2)) antes de X_e = X_e + K*z_dif?",
      options:["Para acelerar o código","Porque a diferença de ângulos pode dar ±2π a mais e o filtro corrigiria para o lado errado","Porque o Matlab exige","Para P não crescer"], answer:1,
      explain:"Ex.: medido −179°, esperado +179° → diferença bruta −358° em vez de +2°. Sem normalizar, correção catastrófica." },
    { kind:"input", q:"Robô estimado em (2, 0), beacon em (5, 2.5), θv = 0. Distância esperada distp_e = ? (2 casas decimais)",
      answer: 3.91, tolerance: 0.01, unit:"m",
      hint:"√((5−2)² + (2,5−0)²) = √(9+6,25).",
      explain:"√15,25 ≈ 3,905 m. O ângulo esperado seria atan2(2,5, 3) − 0 ≈ 0,695 rad." },
    { kind:"flash", front:"Escreve de cor as 2 componentes de h(M_B, X) e as 6 entradas de ∇h_X.", back:"h = [√((xB−xv)²+(yB−yv)²); atan2(yB−yv, xB−xv) − θv].<br>∇h = [−(xB−xv)/d, −(yB−yv)/d, 0; (yB−yv)/d², −(xB−xv)/d², −1]. Escreve em papel até sair sem pensar!" }
  ]}
]},

/* ============ 4.1-D — Exercícios de código ============ */
{ id:"m4-mod4", title:"4.1 · Exercícios de código — preencher o EKF real", minutes:40, kind:"study",
  blurb:"O ficheiro ekf_1p_1p__V2.m da Lab 4 tem lacunas (??) — preenche-as aqui antes de tocar no Matlab. Treino direto para as perguntas de código.",
  pages:[
  { type:"theory", title:"O esqueleto do ekf_1p_1p__V2.m",
    html:`<p>O simulador da Lab 4 (robô de futebol com câmara rotativa, 2 beacons em (5,−2,5) e (5, 2,5)) tem esta estrutura por ciclo (dt = 0,04 s):</p>
    <ol><li>Simular o robô real (ode45 com robot_5dpo) e as medidas com ruído</li>
    <li><b>Predição:</b> propagar X_e com o motion model + P com os Jacobianos</li>
    <li>Comutação de beacon (a câmara alterna a cada 50 ciclos)</li>
    <li><b>Atualização:</b> z_e = h(X_e), R, ∇h_X, ganho K, corrigir X_e e P</li></ol>
    <p>O ficheiro do estudante tem <code>??</code> em: P inicial, Q, motion model, grad_f_X, grad_f_U, z_e, R e grad_h_X. As páginas seguintes são exatamente esses buracos, por ordem. Responde sem consultar os módulos anteriores (recall ativo!) — as dicas estão lá se precisares.</p>`,
    slideRef:"Lab_4/ekf_1p_1p__V2.m + Tips_Labwork__4.pdf" },

  { type:"quiz", title:"Lacunas 1–3: inicialização e predição", questions:[
    { kind:"mcq", q:"P = ?? — sabes a pose inicial com precisão de ~10 cm. Qual é a inicialização razoável?",
      options:["P = zeros(3)","P = eye(3)*1e-2","P = eye(3)*2.5^2","P = Q"], answer:1,
      hint:"P inicial = variância da tua incerteza inicial; (0,1 m)² = 0,01.",
      explain:"eye(3)*1e-2 (Tips do professor). Se NÃO fizesses ideia da pose: eye(3)*2.5^2 — e verias o filtro a convergir na mesma (experimenta na Lab!)." },
    { kind:"mcq", q:"Q = ?? — a matriz do ruído do modelo é:",
      options:["3×3 com a incerteza de x, y, θ","2×2 com as variâncias do ruído de v e ω (ex.: [0.0005^2 0; 0 0.0005^2])","1×1 com o ruído total","Igual a R"], answer:1,
      hint:"Q é o ruído das ENTRADAS u=[v; ω]; quem o leva a 3×3 é ∇f_U·Q·∇f_Uᵀ.",
      explain:"Q é 2×2 (v e ω). Tips: compara com desvios 100× menores e observa o efeito na estimativa — Q alto = confia menos no modelo." },
    { kind:"mcq", q:"xr_e = ?? — a linha correta do motion model é:",
      options:["xr_e + v*cos(theta_r_e)*dt","xr_e + v*cos(theta_r_e + omega*dt/2)*dt","xr_e + v*dt","xr_e + omega*cos(theta_r_e)*dt"], answer:1,
      hint:"Discretização CENTRADA — M1!",
      explain:"É o pose_update do M1 com Δd = v·dt e Δθ = ω·dt. theta_r_e = NormalizeAng(theta_r_e + omega*dt) no fim." }
  ]},

  { type:"quiz", title:"Lacunas 4–5: os Jacobianos", questions:[
    { kind:"mcq", q:"grad_f_X = ?? — qual é a matriz correta?",
      options:["[1 0 −v*dt*sin(θe+ω*dt/2); 0 1 v*dt*cos(θe+ω*dt/2); 0 0 1]",
               "[1 0 v*dt*cos(θe+ω*dt/2); 0 1 −v*dt*sin(θe+ω*dt/2); 0 0 1]",
               "[v*dt 0 0; 0 v*dt 0; 0 0 ω*dt]",
               "[1 0 0; 0 1 0; 0 0 1]"], answer:0,
      hint:"Coluna 3 = derivadas em ordem a θ: x tem −sin, y tem +cos.",
      explain:"Deriva x += v·cos(·)·dt em ordem a θ → −v·dt·sin(·). A opção B troca os sinais/posições." },
    { kind:"input", q:"grad_f_U(3,2) — derivada da equação de θ em ordem a ω. Quanto vale (em função de dt, escreve só 'dt' ou um número)?",
      answer:["dt","0.04"],
      hint:"θ(k+1) = θ(k) + ω·dt → ∂/∂ω = ?",
      explain:"= dt (0,04 s). E grad_f_U(3,1) = 0, porque θ não depende de v." },
    { kind:"flash", front:"Sem olhar: quais são as entradas NULAS de ∇f_X e de ∇f_U, e porquê?", back:"∇f_X: (1,2),(2,1) — x não depende de y e vice-versa; (3,1),(3,2) — θ não depende de x,y. ∇f_U: (3,1) — θ não depende de v. Justificação > memorização!" }
  ]},

  { type:"quiz", title:"Lacunas 6–8: a atualização", questions:[
    { kind:"mcq", q:"distp_e = ?? e theta_p_e = ?? (beacon 2 em (xp2, yp2)) — o par correto é:",
      options:["sqrt((xp2-xr_e)^2+(yp2-yr_e)^2) e NormalizeAng(atan2(yp2-yr_e, xp2-xr_e) - theta_r_e)",
               "sqrt((xp2-xr)^2+(yp2-yr)^2) e atan2(yp2-yr, xp2-xr) - theta_r",
               "(xp2-xr_e)+(yp2-yr_e) e atan2(xp2-xr_e, yp2-yr_e)",
               "sqrt((xr_e)^2+(yr_e)^2) e theta_r_e"], answer:0,
      hint:"z_e usa a pose ESTIMADA (…_e), nunca a real! A real só existe no simulador.",
      explain:"A opção B usa a pose real (xr, yr) — batota impossível num robô real. z_e = h(X_e) sempre com a estimativa." },
    { kind:"input", q:"R(1,1) = (distp_e*sdv_dist_1m)^2 com distp_e = 4 m e sdv_dist_1m = 0,05. Quanto vale? ",
      answer: 0.04, tolerance: 0.001,
      hint:"(4×0,05)² = 0,2².",
      explain:"0,04 m². O desvio-padrão da distância cresce com a distância (0,05 m por metro) — beacons longe valem menos." },
    { kind:"mcq", q:"grad_h_X(1,3) e grad_h_X(2,3) valem, respetivamente:",
      options:["0 e −1","−1 e 0","d e d²","0 e 0"], answer:0,
      hint:"A distância não depende de θv; o ângulo tem o termo −θv.",
      explain:"Linha 1 (dist): ∂/∂θ = 0. Linha 2 (ângulo): ∂(−θv)/∂θv = −1." },
    { kind:"mcq", q:"A linha 'k = P*grad_h_X' * inv(grad_h_X*P*grad_h_X' + R)' calcula:",
      options:["A inovação","O ganho de Kalman K = P∇hᵀS⁻¹ — repara no S dentro do inv()","A covariância R","O motion model"], answer:1,
      explain:"O denominador é exatamente S = ∇hP∇hᵀ + R (P5!). O ganho pesa a correção pela confiança relativa." }
  ]},

  { type:"quiz", title:"Prova final do módulo — escreve tu o código", questions:[
    { kind:"input", q:"Escreve a linha Matlab de z_e para a DISTÂNCIA ao beacon (xp1, yp1) com pose estimada (xr_e, yr_e). Formato: distp_e=sqrt((xp1-xr_e)^2+(yp1-yr_e)^2)",
      answer:["distp_e=sqrt((xp1-xr_e)^2+(yp1-yr_e)^2)","sqrt((xp1-xr_e)^2+(yp1-yr_e)^2)"],
      hint:"Raiz da soma dos quadrados das diferenças, com a pose ESTIMADA.",
      explain:"Exatamente como no exame (P3): h usa o beacon conhecido e a pose estimada." },
    { kind:"flash", front:"Fecha os olhos e percorre o ciclo completo do EKF da Lab 4, passo a passo.", back:"1) f(X_e,u) → nova X_e; 2) P = ∇f_X P ∇f_Xᵀ + ∇f_U Q ∇f_Uᵀ; 3) z_e=h(X_e), R, ∇h_X; 4) K = P∇hᵀ(∇hP∇hᵀ+R)⁻¹; 5) P=(I−K∇h)P; 6) X_e += K·NormalizeAng(z−z_e). Se recitaste isto, estás pronto para o Matlab." }
  ]}
]},

/* ============ 4.1-E — Triangulação vs trilateração ============ */
{ id:"m4-mod5", title:"4.1 · Triangulação vs trilateração", minutes:30, kind:"study",
  blurb:"Localização absoluta por ângulos vs distâncias; 2 vs 3 beacons; a elipse de incerteza. Trian_Trilat (28 págs). ★ Pergunta 13 do exame.",
  pages:[
  { type:"theory", title:"Relativa vs absoluta; os dois métodos",
    html:`<p><b>Localização relativa</b> (odometria): precisa, barata e rápida a curto prazo, mas acumula erro. <b>Localização absoluta</b>: sem acumulação, mas mais lenta/ruidosa e dependente de infraestrutura. (Já sabes: fundem-se com o EKF.)</p>
    <p>Com beacons em posições conhecidas há dois métodos absolutos:</p>
    <ul><li><b>Trilateração</b> — usa <b>DISTÂNCIAS</b> a beacons. Cada distância define uma <b>circunferência</b>; a pose está na interseção. Ex. clássico: <b>GPS</b> (distâncias a satélites).</li>
    <li><b>Triangulação</b> — usa <b>ÂNGULOS</b> a beacons. Cada par de beacons + ângulo define um <b>arco capaz</b>; a pose está na interseção dos arcos.</li></ul>
    <div class="hl">Mnemónica: tri<b>LATERA</b>ção = <b>latera</b>l = distâncias (lados); tri<b>ANGUL</b>ação = ângulos.</div>`,
    figures:[{src:"assets/slides/triantrilat/page-12.png", caption:"Trian_Trilat, slide 12 — Trilateração", focus:"as circunferências centradas nos beacons a intersetar na posição do robô"}],
    slideRef:"SAUT_Loc_Trian_Trilat, págs. 2–16" },

  { type:"theory", title:"Quantos beacons são precisos?",
    html:`<p><b>Triangulação:</b></p>
    <ul><li><b>2 beacons + orientação conhecida</b> (ex.: bússola): resolve a posição</li>
    <li><b>2 beacons sem orientação:</b> <b>indefinido</b> — o robô pode estar em qualquer ponto do arco capaz</li>
    <li><b>3 beacons:</b> resolve posição E orientação (caso geral)</li></ul>
    <p><b>Trilateração 2D:</b> 2 distâncias dão 2 interseções (ambiguidade); a 3ª distância desambigua. E a orientação <b>nunca</b> vem de distâncias — só de ângulos ou de várias posições ao longo do tempo.</p>
    <div class="exam">P13 do exame: a figura com a <b>elipse de incerteza</b> da pose + os <b>arcos/circunferências</b> dos beacons — identifica: elipse = P do EKF (incerteza da estimativa); arcos = restrições das medidas; a interseção aperta a elipse. É a leitura geométrica da atualização do EKF.</div>`,
    figures:[{src:"assets/slides/triantrilat/page-18.png", caption:"Trian_Trilat, slide 18 — 2 beacons + orientação", focus:"porque é que a orientação conhecida desfaz a ambiguidade"},
             {src:"assets/slides/triantrilat/page-20.png", caption:"Trian_Trilat, slide 20 — 3 beacons", focus:"o caso geral: posição e orientação"}],
    slideRef:"Trian_Trilat, págs. 17–28" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"[P13/exame] O GPS localiza-se por:",
      options:["Triangulação (ângulos aos satélites)","Trilateração (distâncias aos satélites, via tempo de voo)","Odometria","Map matching"], answer:1,
      explain:"Mede tempos de voo → distâncias → esferas que se intersetam. Ângulos a satélites não são mensuráveis com precisão." },
    { kind:"mcq", q:"Com apenas 2 beacons e orientação DESCONHECIDA, a localização por triangulação é:",
      options:["Única","Indefinida — qualquer ponto do arco capaz é compatível","Impossível só com 3 beacons","Exata se os beacons estiverem longe"], answer:1,
      hint:"O ângulo entre os 2 beacons vê-se igual de todos os pontos de um arco…",
      explain:"É o teorema do arco capaz. Resolve-se com um 3º beacon ou conhecendo θ (bússola)." },
    { kind:"mcq", q:"Na figura do exame (P13), a elipse em torno do robô representa:",
      options:["O alcance do sensor","A covariância P da estimativa da pose (incerteza do EKF)","A zona proibida","O ruído R"], answer:1,
      explain:"A elipse é a representação geométrica de P; as medidas dos beacons (arcos) intersetam-na e encolhem-na — é a atualização do EKF em desenho." },
    { kind:"flash", front:"Trilateração vs triangulação: o que mede, que curva define cada medida, e um exemplo real de cada.", back:"Trilateração: DISTÂNCIAS → circunferências → GPS. Triangulação: ÂNGULOS → arcos capazes → câmara omni da Lab 4 (variante só-ângulo)." }
  ]}
]},

/* ============ 4.1-F — Exemplo Lego ============ */
{ id:"m4-mod6", title:"4.1 · Exemplo Lego: fusão odometria + triangulação", minutes:30, kind:"study",
  blurb:"O caso de estudo completo (SimTwo + Lego NXT): odometria com Q, triangulação e fusão EKF. Ex_Triangulation (38 págs) + Lego (36 págs) — leitura guiada.",
  pages:[
  { type:"theory", title:"A arquitetura de fusão",
    html:`<p>O exemplo (Sobreira, Moreira, Costa, Santos) junta tudo o que estudaste num sistema real:</p>
    <ul><li><b>Odometria:</b> boa a curto prazo, alta taxa, barata, MAS acumula erro e depende das medidas anteriores</li>
    <li><b>Triangulação com beacons:</b> não depende das medidas anteriores, MAS taxa baixa, depende de infraestrutura e às vezes fica indisponível</li></ul>
    <span class="formula">Encoders → Odometria → [pose + incerteza] ⟶ FUSÃO (EKF) ⟵ [pose + incerteza] ← Triangulação ← Beacons</span>
    <p>O modelo de odometria é X(k+1) = f(X(k), ΔD(k), Δθ(k)) + V(k), com V ~ N(0, Q) — a versão "por deslocamentos" do motion model que já dominas (dados: impulsos dos encoders, diâmetros das rodas, distância L entre rodas).</p>
    <div class="hl">Este deck é a ponte perfeita para perguntas de desenvolvimento: "explique como fundir odometria com localização absoluta" — descreve exatamente esta arquitetura.</div>`,
    figures:[{src:"assets/slides/extriang/page-04.png", caption:"Ex_Triangulation, slide 4 — Arquitetura de fusão", focus:"os dois ramos (odometria e triangulação) e o bloco de fusão que combina pose+incerteza de cada um"}],
    slideRef:"SAUT_Example_Triangulation, págs. 1–5" },

  { type:"theory", title:"O que ver nos dois decks (leitura orientada)",
    html:`<p>Não precisas de decorar os 74 slides — usa esta leitura orientada (~50 min no total):</p>
    <ul><li><b>Ex_Triangulation págs. 5–15:</b> modelo de odometria com incerteza (Q a crescer com o percurso) — revê com olhos de M1</li>
    <li><b>Ex_Triangulation págs. 16–30:</b> triangulação com os beacons do campo e a sua incerteza; repara como a geometria (beacons alinhados/próximos) degrada a precisão</li>
    <li><b>Ex_Triangulation págs. 31–38:</b> resultados da fusão — a elipse de incerteza encolhe a cada correção (é a imagem mental para a P13!)</li>
    <li><b>EKF_Loc_Landmarks_Ex_Lego:</b> o mesmo sistema no robô Lego NXT com as contas do EKF por extenso — usa-o como <b>gabarito</b> para verificar os teus Jacobianos do módulo de código</li></ul>`,
    figures:[{src:"assets/slides/lego/page-02.png", caption:"EKF Lego, slide 2", focus:"o setup do robô Lego com os landmarks — o mesmo pipeline da Lab 4 em hardware real"}],
    slideRef:"Ex_Triangulation + EKF_Lego (leitura orientada)" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Qual é a caracterização correta de odometria vs triangulação (deck Ex_Triangulation)?",
      options:["Odometria: alta taxa, erro acumulado; Triangulação: baixa taxa, sem acumulação de erro","Odometria: baixa taxa, sem erro; Triangulação: alta taxa, erro acumulado","Ambas acumulam erro","Ambas dependem de infraestrutura externa"], answer:0,
      explain:"É o slide 3 do deck — e a razão de ser da fusão: cada uma cobre a fraqueza da outra." },
    { kind:"mcq", q:"No bloco de fusão, cada fonte entrega:",
      options:["Só a pose","Pose E incerteza (covariância) — sem a incerteza não há pesos para fundir","Só a incerteza","Os impulsos brutos dos encoders"], answer:1,
      explain:"A fusão (EKF) pesa cada fonte pela sua covariância — é o ganho K outra vez." },
    { kind:"flash", front:"Quando é que a triangulação fica 'temporariamente indisponível' e o que faz o sistema nesse período?", back:"Beacons ocultos/fora do alcance/não detetados. O sistema sobrevive só com odometria (predição), com P a crescer — até a próxima medida válida encolher a elipse." }
  ]}
]},

/* ============ 4.2 — Labwork 4 guiado ============ */
{ id:"m4-mod7", title:"4.2 · Labwork 4 — EKF com beacons em Matlab (guiado)", minutes:75, kind:"labwork",
  blurb:"Resolução guiada da Lab 4: completar o EKF, afinar P/Q e explorar as variantes só-ângulo e só-distância.",
  pages:[
  { type:"theory", title:"Enquadramento e plataforma",
    html:`<p><b>Tema:</b> localização de um robô (futebol robótico, tração diferencial, câmara rotativa) por EKF com beacons — medidas de distância e ângulo.</p>
    <p><b>Plataforma:</b> <b>Matlab</b> (ou Octave). Ficheiros na pasta <code>Lab_4</code>:</p>
    <ul><li><code>ekf_1p_1p__V2.m</code> — o teu ficheiro de trabalho (tem os ??)</li>
    <li><code>robot_5dpo.m</code> — dinâmica do robô para o ode45</li>
    <li><code>NormalizeAng.m</code> — normalização de ângulos para [−π, π]</li>
    <li><code>ekf_1p_1p_solution_V2_tested.m</code> e <code>ekf_4p_solution.m</code> — soluções (só no fim!)</li>
    <li><code>Tips_Labwork__4.pdf</code> — as dicas do professor (usa-as como 2ª linha de socorro)</li></ul>
    <p><b>Módulos necessários:</b> TODOS os módulos 4.1 (em especial o de exercícios de código — se o completaste, isto vai parecer familiar).</p>
    <p><b>Cenário:</b> beacons em (5, −2,5) e (5, 2,5); a câmara alterna de beacon a cada 50 ciclos; dt = 40 ms; desvios: 0,05 m/m (distância), 0,01 rad (ângulo).</p>`,
    slideRef:"SAUT_LabWork_EKF_Beacons_V1_18Oct2023.pdf" },

  { type:"theory", title:"Enunciado e etapas — clica COMEÇAR",
    html:`<p>Tarefas do enunciado:</p>
    <ol><li><b>(1)</b> Simulador Matlab: robô em trajetória circular (com componente aleatória) + EKF completo com medidas de distância E ângulo</li>
    <li><b>(2)</b> Repetir medindo apenas: (a) o ângulo; (b) a distância</li>
    <li><b>(3)</b> Câmara omnidirecional: medir aos 4 beacons em simultâneo</li>
    <li><b>(4)</b> Variantes só-ângulo e só-distância com os 4 beacons</li></ol>
    <p>Trabalha no <code>ekf_1p_1p__V2.m</code> e corre o script a cada etapa — o gráfico final mostra a trajetória real vs estimada e os beacons. Carrega em <b>Seguinte</b> para COMEÇAR.</p>`,
    slideRef:"Enunciado Lab 4" },

  { type:"labtask", title:"Sub-tarefa (1a) — Inicializações",
    context:"<p>Preenche P e Q no topo do ficheiro. A pose inicial estimada é (2,5, −2,5, 0) e a real é (2, −2, 0) — sabes a pose 'mais ou menos'.</p>",
    q:"Que par (P, Q) é o recomendado para começar?",
    kind:"mcq",
    options:["P = zeros(3);  Q = eye(2)","P = eye(3)*1e-2;  Q = [0.0005^2 0; 0 0.0005^2]","P = eye(3)*100;  Q = zeros(2)","P = [0.0005^2 0; 0 0.0005^2];  Q = eye(3)*1e-2"],
    answer:1,
    hints:["P é 3×3 (estado), Q é 2×2 (entradas v, ω) — isso elimina metade das opções.","Tips: P=eye(3)*1e-2 para pose inicial ~conhecida; experimenta depois 2.5^2 para 'sem ideia'."],
    solution:"P = eye(3)*1e-2 e Q = [0.0005² 0; 0 0.0005²] (Tips). <b>Experimenta</b>: P inicial com desvio 2,5 m (sem ideia da pose) → vê a convergência; Q 100× menor → estimativa mais 'teimosa' e suave, mas lenta a reagir. Esta sensibilidade é matéria de exame (Q vs R!)." },

  { type:"labtask", title:"Sub-tarefa (1b) — Motion model",
    context:"<p>Preenche as 3 linhas da propagação do estado (predição).</p>",
    q:"Escreve a linha do yr_e (formato: yr_e=yr_e+v*sin(theta_r_e+omega*dt/2)*dt):",
    kind:"input",
    answer:["yr_e=yr_e+v*sin(theta_r_e+omega*dt/2)*dt","yr_e=yr_e+v*dt*sin(theta_r_e+omega*dt/2)"],
    hints:["Discretização centrada: sin(θ + ω·dt/2), tudo × v·dt.","É o pose_update do M1 com Δd=v·dt."],
    solution:"<code>yr_e = yr_e + v*sin(theta_r_e + omega*dt/2)*dt;</code> e depois <code>theta_r_e = NormalizeAng(theta_r_e + omega*dt);</code>. Corre o script SÓ com a predição (comenta a atualização): vês a estimativa a divergir da real — odometria pura." },

  { type:"labtask", title:"Sub-tarefa (1c) — Jacobianos da predição",
    context:"<p>Preenche grad_f_X e grad_f_U. Valida com números: v = 1, dt = 0,04, theta_r_e + omega*dt/2 = π/2.</p>",
    q:"Quanto vale grad_f_X(1,3) = −v·dt·sin(θ+ωdt/2) com estes valores?",
    kind:"input", answer: -0.04, tolerance: 0.001,
    hints:["sin(π/2) = 1.","−1 × 0,04 × 1."],
    solution:"−0,04. E grad_f_X(2,3) = v·dt·cos(π/2) = 0 — com o robô virado para +y, um erro em θ desloca a predição em x, não em y. Confirma a matriz completa no slide 4 do deck EKFBeacons (ou no módulo 4.1-B)." },

  { type:"labtask", title:"Sub-tarefa (1d) — Atualização",
    context:"<p>Preenche z_e, R e grad_h_X nos dois ramos (beacon 1 e beacon 2). Depois corre o EKF completo.</p>",
    q:"Ao correr com tudo preenchido, o comportamento correto da estimativa é:",
    kind:"mcq",
    options:["Diverge lentamente da trajetória real","Converge para a trajetória real e mantém-se colada, com pequenos solavancos a cada correção","Fica parada na pose inicial","Segue a real com atraso constante de 2 s"],
    answer:1,
    hints:["A estimativa começa errada (2,5, −2,5) vs real (2, −2) — o que deve acontecer nos primeiros ciclos?","Cada medida do beacon 'puxa' a estimativa; entre medidas, a odometria segura."],
    solution:"Converge em poucos ciclos e cola-se à real. Se diverge: revê o NormalizeAng na inovação e os sinais do grad_h_X. Se converge mas com muito ruído: Q ou R mal escalados. O gráfico final mostra real ('o' azul) vs estimada — deve haver sobreposição quase total após a convergência." },

  { type:"labtask", title:"Sub-tarefa (2a) — Só ângulo",
    context:"<p>Variante: o sensor só mede o ângulo ao beacon. z fica 1×1, h fica só com a 2ª componente, R = sdv_ang², grad_h_X fica 1×3 (a 2ª linha).</p>",
    q:"Com medidas de ângulo a UM beacon de cada vez, a pose continua a convergir. O que o permite?",
    kind:"mcq",
    options:["O ângulo chega para localizar instantaneamente","A fusão com a odometria ao longo do tempo + a alternância entre os 2 beacons acumula informação suficiente","O Matlab resolve automaticamente","Não converge — é impossível"],
    answer:1,
    hints:["Um ângulo a um beacon define um arco — não chega num instante. Mas o EKF não trabalha só com um instante…","É triangulação 'espalhada no tempo' pela odometria."],
    solution:"Cada ângulo restringe a pose a um arco; a odometria liga as restrições de instantes diferentes e a alternância de beacons cruza arcos distintos → convergência (mais lenta e com P maior que na versão completa). É literalmente triangulação temporal — liga ao módulo 4.1-E." },

  { type:"labtask", title:"Sub-tarefa (2b) — Só distância",
    context:"<p>Agora só a distância: h fica com a 1ª componente, R = (d·0,05)², grad_h_X = 1ª linha (1×3).</p>",
    q:"Na variante só-distância, que componente da pose fica PIOR estimada, e porquê?",
    kind:"mcq",
    options:["x — porque os beacons estão longe","θ (orientação) — a distância não depende de θ (grad_h_X(1,3)=0), logo as medidas não a corrigem diretamente","y — pelo ruído do sensor","Nenhuma — fica tudo igual"],
    answer:1,
    hints:["Olha para o Jacobiano: que coluna é zero na linha da distância?","Se a medida não depende de θ, o ganho não corrige θ diretamente."],
    solution:"θ: como ∂dist/∂θ = 0, a correção de θ é apenas indireta (via correlações em P entre x, y e θ criadas pelo motion model). Vês no gráfico a orientação estimada a 'derivar' mais. Contraste com a variante só-ângulo, onde θ é diretamente observado (o termo −1)." },

  { type:"labtask", title:"Sub-tarefa (3/4) — Câmara omni: 4 beacons",
    context:"<p>Passa ao <code>ekf_4p</code>: a câmara omnidirecional vê os 4 beacons em SIMULTÂNEO em cada ciclo.</p>",
    q:"Como se processa a atualização com 4 observações no mesmo ciclo (método do slide 12 do deck)?",
    kind:"mcq",
    options:["Usa-se só o beacon mais próximo","Atualização sequencial: para cada beacon, recalcula-se z_e, ∇h, K e corrige-se X_e e P, reutilizando o resultado anterior","Faz-se a média das 4 medidas primeiro","Espera-se 4 ciclos"],
    answer:1,
    hints:["'For each observation the estimation of the state and its covariance are updated repeatedly…' (slide 12).","Também podias empilhar tudo num z 8×1 — mas o método do deck é o sequencial."],
    solution:"Atualização sequencial por observação (slide 12): cada beacon corrige um pouco mais o X_e/P já corrigidos. Resultado: convergência muito mais rápida e P menor — compara os gráficos com a versão 1 beacon. Repete depois as variantes só-ângulo/só-distância (tarefa 4): com 4 beacons até a só-distância fica bem melhor (trilateração instantânea!).<br><br>🏁 <b>Labwork 4 concluída — o núcleo do exame está dominado!</b> Desbloqueaste o M5 (EKF com laser + validação), que estende isto ao sensor laser real. Antes de avançares, faz uma 2ª passagem aos flashcards dos módulos 4.1-B e 4.1-C: h, ∇h e S têm de sair de cor." }
]}
]};
