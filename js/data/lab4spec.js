/* ===== SAUT StudyHub — especificação avaliável da Labwork 4 (EKF com beacons, MATLAB) =====
   GERADO por tools/gen_lab4spec.py a partir de
   SAUTO/Lab_4/ekf_1p_1p_solution_V2_tested.m e ekf_4p_solution.m.
   NÃO EDITAR À MÃO — alterar o gerador e voltar a correr.

   Cada tarefa traz:
     harness   — script MATLAB onde o teu fragmento é inserido em %USER%
     solution  — o fragmento do professor, usado como ORÁCULO
     capture   — variáveis lidas do workspace e comparadas
     tests     — casos com variáveis de entrada diferentes; alguns são
                 critérios ("assert") em vez de comparações
*/
window.SAUT_LABSPEC = window.SAUT_LABSPEC || {};
window.SAUT_LABSPEC["m4-mod7"] = {
  "motion": {
    id: "motion",
    title: "Modelo de movimento — propagação do estado estimado",
    lang: "matlab",
    starter: `% X(k+1) = f(X(k), q), com q = [delta_d ; delta_theta] — os DESLOCAMENTOS
% deste ciclo. A partir das velocidades: delta_d = v*dt, delta_theta = omega*dt.
% Trabalhar em deslocamentos (e nao em velocidades) e a convencao do professor,
% e e o que faz as Jacobianas das sub-tarefas seguintes sairem certas.
delta_d     = ;
delta_theta = ;

% Atencao: as tres linhas seguintes nao sao independentes; pensa em que valor
% de theta_r_e cada uma deve usar.
xr_e =
yr_e =
theta_r_e = `,
    harness: `%%USER%%
X_e=[xr_e ; yr_e ; theta_r_e];
`,
    solution: `xr_e=xr_e+v*cos(theta_r_e+omega*dt/2)*dt;
yr_e=yr_e+v*sin(theta_r_e+omega*dt/2)*dt;
theta_r_e=NormalizeAng(theta_r_e+omega*dt);`,
    capture: ["xr_e", "yr_e", "theta_r_e"],
    tol: 1e-9,
    tolPct: 1e-7,
    tests: [
      {"name": "Andamento em frente (omega = 0)", "set": {"xr_e": 1.0, "yr_e": 2.0, "theta_r_e": 0.3, "v": 1.2, "omega": 0.0, "dt": 0.04}},
      {"name": "Curva à esquerda", "set": {"xr_e": 0.0, "yr_e": 0.0, "theta_r_e": 0.0, "v": 1.0, "omega": 0.8, "dt": 0.04}},
      {"name": "Curva à direita, orientação inicial negativa", "set": {"xr_e": -1.5, "yr_e": 0.7, "theta_r_e": -1.2, "v": 0.9, "omega": -1.5, "dt": 0.04}},
      {"name": "Robô parado (v = 0), só roda", "set": {"xr_e": 2.0, "yr_e": -2.0, "theta_r_e": 1.0, "v": 0.0, "omega": 2.0, "dt": 0.04}},
      {"name": "Passagem por ±π (obriga a normalizar o ângulo)", "set": {"xr_e": 0.5, "yr_e": 0.5, "theta_r_e": 3.1, "v": 1.0, "omega": 2.0, "dt": 0.04}},
      {"name": "Passo maior (dt = 0.1) — o dt não pode estar fixo no código", "set": {"xr_e": 0.0, "yr_e": 0.0, "theta_r_e": 0.5, "v": 1.5, "omega": 1.0, "dt": 0.1}}
    ],
    rules: [{re: /omega\s*\*\s*dt\s*\/\s*2|omega\s*\*\s*dt\s*\*\s*0?\.5|0?\.5\s*\*\s*omega\s*\*\s*dt|delta_\w*\s*\/\s*2|dth\w*\s*\/\s*2/, msg: "A posição integra-se no <b>ângulo médio</b> do intervalo: <code>theta_r_e + delta_theta/2</code> — que na escrita do professor é <code>theta_r_e + omega*dt/2</code>. Não uses o ângulo inicial.", level: "error"}, {re: /normalizeang/, msg: "O ângulo estimado tem de passar por <code>NormalizeAng</code>, senão sai fora de (−π, π].", level: "error"}],
    signalHints: {"theta_r_e": "A orientação é a mais simples: <code>theta_r_e = NormalizeAng(theta_r_e + omega*dt)</code>. Se falha só no caso do ±π, falta-te o <code>NormalizeAng</code>.", "xr_e": "Repara na ordem das linhas: <code>xr_e</code> e <code>yr_e</code> têm de usar o <b>theta anterior</b>. Se atualizares <code>theta_r_e</code> primeiro, as posições ficam erradas.", "yr_e": "O avanço do ciclo é <code>delta_d = v*dt</code>, aplicado na direção do ângulo médio: <code>yr_e + delta_d*sin(theta_r_e + delta_theta/2)</code>."},
    hints: ["Pensa em <b>deslocamentos</b>, não em velocidades: neste ciclo o robô avança <code>delta_d = v*dt</code> e roda <code>delta_theta = omega*dt</code>. É esta a convenção do professor — e a natural para um filtro alimentado por odometria, que mede deslocamentos e não velocidades.", "Integrar com o ângulo inicial dá erro de segunda ordem. Usa o <b>ângulo médio</b> do intervalo: <code>theta_r_e + delta_theta/2</code>.", "Atualiza <code>theta_r_e</code> <b>por último</b> (as duas linhas anteriores precisam do valor antigo) e envolve em <code>NormalizeAng</code>.", "Solução do professor, escrita em velocidades: <code>xr_e=xr_e+v*cos(theta_r_e+omega*dt/2)*dt;</code> — reconhece as peças: <code>v*(…)*dt</code> é o <code>delta_d</code> e <code>omega*dt/2</code> é o <code>delta_theta/2</code>. As duas escritas são a mesma coisa."]
  },
  "grad_f_x": {
    id: "grad_f_x",
    title: "Jacobiano do modelo de movimento em ordem ao estado — <code>grad_f_X</code>",
    lang: "matlab",
    starter: `% df/dX : derivada de f em ordem ao ESTADO [x ; y ; theta].  Matriz 3x3.
% Lembra-te de que f esta escrita em deslocamentos:
%     x' = x + delta_d*cos(theta + delta_theta/2)
% com delta_d = v*dt e delta_theta = omega*dt.
grad_f_X = [ ];`,
    harness: `%%USER%%
`,
    solution: `grad_f_X=[ 1 0 -v*dt*sin(theta_r_e+omega*dt/2);
    0 1 v*dt*cos(theta_r_e+omega*dt/2);
    0 0 1];`,
    capture: ["grad_f_X"],
    tol: 1e-9,
    tolPct: 1e-7,
    tests: [
      {"name": "Andamento em frente", "set": {"v": 1.2, "omega": 0.0, "dt": 0.04, "theta_r_e": 0.3}},
      {"name": "Curva", "set": {"v": 1.0, "omega": 0.8, "dt": 0.04, "theta_r_e": 0.0}},
      {"name": "Orientação negativa", "set": {"v": 0.9, "omega": -1.5, "dt": 0.04, "theta_r_e": -1.2}},
      {"name": "Robô parado", "set": {"v": 0.0, "omega": 2.0, "dt": 0.04, "theta_r_e": 1.0}},
      {"name": "Passo diferente", "set": {"v": 1.5, "omega": 1.0, "dt": 0.1, "theta_r_e": 2.5}}
    ],
    rules: [{re: /omega\s*\*\s*dt\s*\/\s*2|omega\s*\*\s*dt\s*\*\s*0?\.5|0?\.5\s*\*\s*omega\s*\*\s*dt|delta_\w*\s*\/\s*2|dth\w*\s*\/\s*2/, msg: "As derivadas avaliam-se no mesmo ângulo médio usado em f: <code>theta_r_e + delta_theta/2</code>.", level: "error"}],
    signalHints: {"grad_f_X": "A matriz é 3x3. As duas primeiras colunas são triviais (∂x/∂x = 1, ∂y/∂y = 1, o resto zero) porque x e y não dependem um do outro. Toda a informação está na <b>terceira coluna</b>: <code>∂x/∂theta = −delta_d·sin(·)</code> e <code>∂y/∂theta = +delta_d·cos(·)</code>. É por isso que aparece <code>v*dt</code> — não é um <i>dt</i> solto, é o <b>deslocamento</b> do ciclo. Última linha: <code>[0 0 1]</code>."},
    hints: ["Deriva cada linha de f em ordem a x, y e theta. As dependências em x e y são a identidade.", "Terceira coluna: <code>∂x/∂theta = -delta_d*sin(theta + delta_theta/2)</code> e <code>∂y/∂theta = +delta_d*cos(theta + delta_theta/2)</code>. Na escrita do professor isso aparece como <code>-v*dt*sin(…)</code>: o <code>v*dt</code> <b>é</b> o <code>delta_d</code>.", "A orientação não depende de x nem de y e a sua derivada em ordem a si própria é 1 — última linha <code>[0 0 1]</code>.", "Solução: <code>grad_f_X=[1 0 -v*dt*sin(theta_r_e+omega*dt/2); 0 1 v*dt*cos(theta_r_e+omega*dt/2); 0 0 1];</code>"]
  },
  "grad_f_u": {
    id: "grad_f_u",
    title: "Jacobiano em ordem ao ruído da odometria — <code>grad_f_U</code> = ∂f/∂[Δd ; Δθ]",
    lang: "matlab",
    starter: `% ATENCAO ao que esta matriz deriva.
% Apesar do nome 'grad_f_U', o professor NAO deriva em ordem a [v ; omega]:
% deriva em ordem aos DESLOCAMENTOS q = [delta_d ; delta_theta].
% Reescreve f nessas variaveis antes de derivar:
%     x'     = x     + delta_d*cos(theta + delta_theta/2)
%     y'     = y     + delta_d*sin(theta + delta_theta/2)
%     theta' = theta + delta_theta
% E por isso que NAO aparece nenhum dt solto: ele ja esta dentro do delta_d.
% Matriz 3x2.
grad_f_U = [ ];`,
    harness: `%%USER%%
`,
    solution: `grad_f_U=[cos(theta_r_e+omega*dt/2) -v*dt*0.5*sin(theta_r_e+omega*dt/2);
    sin(theta_r_e+omega*dt/2) v*dt*0.5*cos(theta_r_e+omega*dt/2);
    0 1];`,
    capture: ["grad_f_U"],
    tol: 1e-9,
    tolPct: 1e-7,
    tests: [
      {"name": "Andamento em frente", "set": {"v": 1.2, "omega": 0.0, "dt": 0.04, "theta_r_e": 0.3}},
      {"name": "Curva", "set": {"v": 1.0, "omega": 0.8, "dt": 0.04, "theta_r_e": 0.0}},
      {"name": "Orientação negativa", "set": {"v": 0.9, "omega": -1.5, "dt": 0.04, "theta_r_e": -1.2}},
      {"name": "Robô parado", "set": {"v": 0.0, "omega": 2.0, "dt": 0.04, "theta_r_e": 1.0}},
      {"name": "Passo diferente", "set": {"v": 1.5, "omega": 1.0, "dt": 0.1, "theta_r_e": 2.5}}
    ],
    rules: [{re: /0\.5|\/\s*2/, msg: "A derivada em ordem a <code>delta_theta</code> apanha o <code>delta_theta/2</code> que está dentro do seno/cosseno — daí o fator <code>1/2</code>.", level: "error"}],
    signalHints: {"grad_f_U": "Matriz 3x2: três estados, duas fontes de ruído. <b>Coluna do Δd</b> — derivando <code>x' = x + Δd·cos(θ+Δθ/2)</code> em ordem a Δd sobra <code>cos(θ+Δθ/2)</code>, <b>sem dt</b>, porque o dt já está dentro do Δd; e a orientação não depende de Δd, logo 0. <b>Coluna do Δθ</b> — pela regra da cadeia, <code>∂x'/∂Δθ = −Δd·½·sin(·)</code>, que na escrita do professor é <code>-v*dt*0.5*sin(·)</code>; e <code>∂θ'/∂Δθ = 1</code>, não dt, precisamente por se derivar em ordem ao deslocamento."},
    hints: ["Antes de derivar, reescreve f em <b>deslocamentos</b>: <code>x' = x + Δd·cos(θ + Δθ/2)</code> e <code>θ' = θ + Δθ</code>. É em ordem a Δd e Δθ que se deriva — não a v e omega.", "Coluna do Δd: <code>[cos(θ+Δθ/2) ; sin(θ+Δθ/2) ; 0]</code>. Não há dt nenhum, porque ele já está dentro do Δd.", "Coluna do Δθ: regra da cadeia sobre o <code>Δθ/2</code> de dentro do cosseno, <code>∂x'/∂Δθ = −Δd·½·sin(θ+Δθ/2)</code>. E <code>∂θ'/∂Δθ = 1</code>.", "Solução: <code>grad_f_U=[cos(a) -v*dt*0.5*sin(a); sin(a) v*dt*0.5*cos(a); 0 1];</code> com <code>a = theta_r_e+omega*dt/2</code>. Reconhece as peças: <code>v*dt</code> é o Δd, <code>omega*dt</code> é o Δθ.", "Se derivasses mesmo em ordem a [v ; omega] obterias esta matriz inteira multiplicada por dt, e um <code>dt</code> no canto inferior. Também estaria correto — mas então Q teria de ser dividido por dt² para dar o mesmo P. O professor escolheu a versão em deslocamentos."]
  },
  "p_prop": {
    id: "p_prop",
    title: "Propagação da covariância",
    lang: "matlab",
    starter: `% Propaga a incerteza através do modelo de movimento.
% Tens disponíveis: P (3x3), Q (2x2), grad_f_X (3x3) e grad_f_U (3x2).
P = ;`,
    harness: `%%USER%%
`,
    solution: `P = grad_f_X * P * grad_f_X' + grad_f_U*Q*grad_f_U';`,
    capture: ["P"],
    tol: 1e-9,
    tolPct: 1e-7,
    tests: [
      {"name": "Caso típico", "set": {"P": [[0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.01]], "Q": [[2.5e-07, 0], [0, 2.5e-07]], "grad_f_X": [[1, 0, -0.02], [0, 1, 0.04], [0, 0, 1]], "grad_f_U": [[0.99, -0.01], [0.1, 0.02], [0, 1]]}},
      {"name": "P não diagonal (apanha transposições em falta)", "set": {"P": [[0.05, 0.02, -0.01], [0.02, 0.03, 0.004], [-0.01, 0.004, 0.02]], "Q": [[0.01, 0], [0, 0.0025]], "grad_f_X": [[1, 0, -0.13], [0, 1, 0.07], [0, 0, 1]], "grad_f_U": [[0.6, -0.3], [0.8, 0.25], [0, 1]]}},
      {"name": "Q não diagonal", "set": {"P": [[0.2, 0.05, 0], [0.05, 0.1, 0.02], [0, 0.02, 0.08]], "Q": [[0.02, 0.005], [0.005, 0.01]], "grad_f_X": [[1, 0, 0.3], [0, 1, -0.2], [0, 0, 1]], "grad_f_U": [[0.4, 0.9], [-0.7, 0.1], [0, 1]]}}
    ],
    rules: [{re: /grad_f_x\s*'/, msg: "Falta transpor: a propagação é <code>F·P·F'</code>, com apóstrofo.", level: "error"}, {re: /grad_f_u\s*\*\s*q/, msg: "O termo do ruído é <code>grad_f_U*Q*grad_f_U'</code> — o Q vive no espaço dos <b>deslocamentos</b> [Δd ; Δθ] e tem de ser levado para o espaço do estado.", level: "error"}],
    signalHints: {"P": "A fórmula é <code>P = F·P·F' + G·Q·G'</code>, com F = <code>grad_f_X</code> e G = <code>grad_f_U</code>. O G é o que leva a incerteza dos <b>deslocamentos</b> [Δd ; Δθ] para o espaço do estado. Erros comuns: esquecer um apóstrofo, ou somar Q diretamente a P (as dimensões nem batem certo — Q é 2x2 e P é 3x3)."},
    hints: ["São dois termos: o que propaga a incerteza que já tinhas, e o que injeta a incerteza nova vinda do erro de <b>odometria</b> deste ciclo (o erro em Δd e Δθ).", "Cada termo tem a forma <b>sanduíche</b>: matriz · covariância · matriz transposta.", "Solução: <code>P = grad_f_X * P * grad_f_X' + grad_f_U*Q*grad_f_U';</code>"]
  },
  "h_model": {
    id: "h_model",
    title: "Medida esperada — <code>z = h(X)</code>",
    lang: "matlab",
    starter: `% Que distância e que ângulo é que o robô ESPERA medir ao poste 1,
% dado o estado estimado (xr_e, yr_e, theta_r_e)?
% O poste 1 está em (xp1, yp1).
distp_e =
theta_p_e = `,
    harness: `%%USER%%
z_e=[distp_e; theta_p_e];
`,
    solution: `distp_e= sqrt((xp1-xr_e)^2+(yp1-yr_e)^2);
theta_p_e=NormalizeAng(atan2(yp1-yr_e,xp1-xr_e)-theta_r_e);`,
    capture: ["distp_e", "theta_p_e"],
    tol: 1e-9,
    tolPct: 1e-7,
    tests: [
      {"name": "Poste à frente do robô", "set": {"xp1": 5, "yp1": -2.5, "xr_e": 2.0, "yr_e": -2.0, "theta_r_e": 0.0}},
      {"name": "Poste atrás do robô", "set": {"xp1": 5, "yp1": -2.5, "xr_e": 2.0, "yr_e": -2.0, "theta_r_e": 3.0}},
      {"name": "Robô rodado (obriga a subtrair theta)", "set": {"xp1": 5, "yp1": 2.5, "xr_e": 0.0, "yr_e": 0.0, "theta_r_e": 1.2}},
      {"name": "Ângulo a saltar ±π (obriga a normalizar)", "set": {"xp1": -5, "yp1": 0.1, "xr_e": 0.0, "yr_e": 0.0, "theta_r_e": -0.2}},
      {"name": "Outro poste, robô longe", "set": {"xp1": -5, "yp1": 2.5, "xr_e": 3.5, "yr_e": -1.0, "theta_r_e": -2.4}}
    ],
    rules: [{re: /atan2/, msg: "O ângulo ao poste obtém-se com <code>atan2(yp1-yr_e, xp1-xr_e)</code>.", level: "error"}, {re: /normalizeang/, msg: "Depois de subtrair <code>theta_r_e</code> o ângulo pode sair de (−π, π] — normaliza.", level: "error"}],
    signalHints: {"distp_e": "Distância euclidiana entre a pose <b>estimada</b> e o poste: <code>sqrt((xp1-xr_e)^2 + (yp1-yr_e)^2)</code>. Cuidado para não usar a pose verdadeira (xr, yr) — o filtro não a conhece.", "theta_p_e": "O ângulo é medido no referencial do <b>robô</b>: calcula o ângulo absoluto ao poste com <code>atan2</code> e subtrai a orientação do robô. Depois normaliza."},
    hints: ["h(X) responde a: «se o meu estado estimado estiver certo, o que é que o sensor vai ler?»", "Só podes usar variáveis com <code>_e</code> (estimadas) e as coordenadas do poste. Usar <code>xr</code>/<code>yr</code> seria batota — o robô não sabe onde está.", "O ângulo é relativo ao robô: <code>atan2(yp1-yr_e, xp1-xr_e) - theta_r_e</code>, envolvido em <code>NormalizeAng</code>."]
  },
  "r_matrix": {
    id: "r_matrix",
    title: "Covariância do ruído das medidas — <code>R</code>",
    lang: "matlab",
    starter: `% Matriz 2x2 com a incerteza das duas medidas (distância e ângulo).
% Disponíveis: distp_e, sdv_dist_1m (desvio padrão POR METRO) e sdv_ang.
R = [ ];`,
    harness: `%%USER%%
`,
    solution: `R= [ (distp_e*sdv_dist_1m)^2 0
    0 sdv_ang^2 ];`,
    capture: ["R"],
    tol: 1e-9,
    tolPct: 1e-7,
    tests: [
      {"name": "Poste a ~3 m", "set": {"distp_e": 3.0, "sdv_dist_1m": 0.05, "sdv_ang": 0.01}},
      {"name": "Poste a ~7 m (o erro de distância cresce)", "set": {"distp_e": 7.0, "sdv_dist_1m": 0.05, "sdv_ang": 0.01}},
      {"name": "Poste muito perto", "set": {"distp_e": 0.4, "sdv_dist_1m": 0.05, "sdv_ang": 0.01}},
      {"name": "Sensor diferente (não podes fixar os desvios)", "set": {"distp_e": 5.0, "sdv_dist_1m": 0.12, "sdv_ang": 0.03}}
    ],
    rules: [{re: /distp_e\s*\*\s*sdv_dist_1m|sdv_dist_1m\s*\*\s*distp_e/, msg: "O enunciado diz que o desvio padrão da distância cresce <b>proporcionalmente</b> com a distância: multiplica <code>sdv_dist_1m</code> por <code>distp_e</code>.", level: "error"}, {re: /\^\s*2|\.\^\s*2/, msg: "R é uma matriz de <b>variâncias</b> — os desvios padrão entram ao quadrado.", level: "error"}],
    signalHints: {"R": "R é diagonal 2x2 (assume-se que os dois erros são independentes). Entrada (1,1): variância da distância, que <b>depende da distância medida</b> — <code>(distp_e*sdv_dist_1m)^2</code>. Entrada (2,2): <code>sdv_ang^2</code>, constante."},
    hints: ["Dois erros independentes → matriz diagonal.", "<code>sdv_dist_1m = 0.05</code> está em m/m: é o erro <b>por metro</b> de distância. A 6 m o desvio padrão é 0.3 m.", "Não te esqueças de elevar ao quadrado: R guarda variâncias, não desvios padrão.", "Solução: <code>R = [ (distp_e*sdv_dist_1m)^2 0 ; 0 sdv_ang^2 ];</code>"]
  },
  "grad_h_x": {
    id: "grad_h_x",
    title: "Jacobiano da observação — <code>grad_h_X</code>",
    lang: "matlab",
    starter: `% dh/dX : derivada de [distância ; ângulo] em ordem a [x ; y ; theta].  Matriz 2x3.
% Disponíveis: xp1, yp1, xr_e, yr_e, distp_e.
grad_h_X = [ ];`,
    harness: `%%USER%%
`,
    solution: `grad_h_X  = [-(xp1-xr_e)/distp_e, -(yp1-yr_e)/distp_e, 0;
             (yp1-yr_e)/(distp_e^2), -(xp1-xr_e)/(distp_e^2), -1];`,
    capture: ["grad_h_X"],
    tol: 1e-9,
    tolPct: 1e-7,
    tests: [
      {"name": "Poste à frente", "set": {"xp1": 5, "yp1": -2.5, "xr_e": 2.0, "yr_e": -2.0, "distp_e": 3.0413812651491097}},
      {"name": "Poste na diagonal", "set": {"xp1": 5, "yp1": 2.5, "xr_e": 0.0, "yr_e": 0.0, "distp_e": 5.5901699437494745}},
      {"name": "Poste à esquerda", "set": {"xp1": -5, "yp1": 2.5, "xr_e": 3.5, "yr_e": -1.0, "distp_e": 9.192388155425117}},
      {"name": "Poste perto", "set": {"xp1": 1, "yp1": 1, "xr_e": 0.6, "yr_e": 0.7, "distp_e": 0.5}}
    ],
    rules: [{re: /distp_e\s*\^\s*2|distp_e\s*\*\s*distp_e/, msg: "A derivada do <b>ângulo</b> tem a distância ao <b>quadrado</b> no denominador.", level: "error"}, {re: /-1/, msg: "A derivada do ângulo medido em ordem à orientação do robô é <code>−1</code> — se o robô roda 1 rad, o ângulo ao poste diminui 1 rad.", level: "warn"}],
    signalHints: {"grad_h_X": "Matriz 2x3: duas medidas, três estados. <b>Linha 1</b> (distância): derivadas de <code>sqrt((xp-x)²+(yp-y)²)</code> — dão <code>-(xp-x)/d</code> e <code>-(yp-y)/d</code>, e 0 em theta (a distância não depende da orientação). <b>Linha 2</b> (ângulo): derivadas de <code>atan2(yp-y, xp-x) - theta</code> — o denominador é <code>d²</code>, e a última entrada é <code>-1</code>. Confirma os sinais: são o oposto do que sai se derivares em ordem a xp em vez de x."},
    hints: ["São 6 derivadas parciais. Faz uma linha de cada vez.", "Linha da distância: derivando <code>d = sqrt((xp-x)²+(yp-y)²)</code> em ordem a x dá <code>-(xp-x)/d</code>. A distância não depende de theta → terceira entrada 0.", "Linha do ângulo: derivando <code>atan2(yp-y, xp-x)</code> em ordem a x dá <code>+(yp-y)/d²</code> e em ordem a y dá <code>-(xp-x)/d²</code>. Em ordem a theta é <code>-1</code>.", "Solução: <code>grad_h_X = [-(xp1-xr_e)/distp_e, -(yp1-yr_e)/distp_e, 0; (yp1-yr_e)/(distp_e^2), -(xp1-xr_e)/(distp_e^2), -1];</code>"]
  },
  "update": {
    id: "update",
    title: "Ganho de Kalman e atualização",
    lang: "matlab",
    starter: `% Disponíveis: P (3x3), grad_h_X (2x3), R (2x2), z (2x1 medido),
%              z_e (2x1 esperado) e X_e (3x1).
% Ganho de Kalman
k = ;
% Atualização da covariância
P = ;
% Atualização do estado (cuidado com a inovação angular!)
X_e = ;`,
    harness: `%%USER%%
`,
    solution: `k = P * grad_h_X' * inv(grad_h_X * P * grad_h_X' + R);
P=(eye(3)-k * grad_h_X) * P;
z_dif = z-z_e;
z_dif(2)= NormalizeAng(z_dif(2));
X_e = X_e + k * (z_dif);
X_e(3) = NormalizeAng(X_e(3));`,
    capture: ["k", "P", "X_e"],
    tol: 1e-9,
    tolPct: 1e-7,
    tests: [
      {"name": "Inovação pequena", "set": {"P": [[0.02, 0.005, 0], [0.005, 0.03, 0.002], [0, 0.002, 0.01]], "grad_h_X": [[-0.98, 0.16, 0], [-0.05, -0.32, -1]], "R": [[0.0225, 0], [0, 0.0001]], "z": [[3.1], [0.22]], "z_e": [[3.04], [0.19]], "X_e": [[2.0], [-2.0], [0.1]]}},
      {"name": "Inovação com salto de ±π (obriga a normalizar)", "set": {"P": [[0.05, 0, 0], [0, 0.05, 0], [0, 0, 0.02]], "grad_h_X": [[-0.7, -0.7, 0], [0.1, -0.1, -1]], "R": [[0.04, 0], [0, 0.0001]], "z": [[4.0], [3.05]], "z_e": [[4.1], [-3.1]], "X_e": [[1.0], [1.0], [0.5]]}},
      {"name": "Medida muito ruidosa (R grande) — o filtro deve confiar pouco", "set": {"P": [[0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.01]], "grad_h_X": [[-1, 0, 0], [0, -0.2, -1]], "R": [[4.0, 0], [0, 1.0]], "z": [[6.0], [0.5]], "z_e": [[5.0], [0.2]], "X_e": [[0.0], [0.0], [0.0]]}},
      {"name": "P com correlações fortes", "set": {"P": [[0.3, 0.2, 0.1], [0.2, 0.25, -0.05], [0.1, -0.05, 0.15]], "grad_h_X": [[-0.6, -0.8, 0], [0.13, -0.1, -1]], "R": [[0.09, 0], [0, 0.0004]], "z": [[5.2], [-0.4]], "z_e": [[5.0], [-0.35]], "X_e": [[-1.0], [0.5], [-0.2]]}}
    ],
    rules: [{re: /inv\s*\(/, msg: "O ganho precisa da inversa da covariância da inovação, <code>inv(H·P·H' + R)</code>.", level: "error"}, {re: /eye\s*\(\s*3\s*\)/, msg: "A covariância atualiza-se com <code>(I − K·H)·P</code> — precisas de <code>eye(3)</code>.", level: "error"}, {re: /\(\s*2\s*\)\s*=\s*normalizeang/, msg: "A <b>inovação</b> angular <code>z(2)−z_e(2)</code> pode dar ~2π quando as duas leituras estão em lados opostos de ±π. Normaliza a <b>segunda componente da diferença</b> (<code>z_dif(2)=NormalizeAng(z_dif(2))</code>) antes de multiplicar pelo ganho — normalizar só o z_e não chega.", level: "error"}],
    signalHints: {"k": "Ganho: <code>k = P*H'*inv(H*P*H' + R)</code>, com H = <code>grad_h_X</code>. Fica 3x2. O termo <code>H*P*H' + R</code> é a covariância da inovação (2x2).", "P": "Atualização de Joseph simplificada: <code>P = (eye(3) - k*grad_h_X)*P</code>. Repara que P <b>diminui</b> sempre — a observação só pode reduzir a incerteza.", "X_e": "Se falha só no caso do salto de ±π, o problema é a inovação angular: faz <code>z_dif = z - z_e; z_dif(2) = NormalizeAng(z_dif(2));</code> <b>antes</b> de <code>X_e = X_e + k*z_dif</code>. Sem isso o filtro recebe um erro de ~2π e dá um salto absurdo."},
    hints: ["Três linhas: ganho, covariância, estado — por esta ordem (a atualização de P usa o ganho, não o P novo).", "O ganho pesa quanto acreditas na medida face à predição: <code>P*H'</code> a dividir pela covariância da inovação <code>H*P*H' + R</code>.", "A inovação é <code>z - z_e</code>. A segunda componente é um <b>ângulo</b> — tem de ser normalizada, senão o filtro explode sempre que o poste está por trás.", "Solução: <code>k = P*grad_h_X'*inv(grad_h_X*P*grad_h_X' + R); P = (eye(3)-k*grad_h_X)*P; z_dif = z-z_e; z_dif(2)=NormalizeAng(z_dif(2)); X_e = X_e + k*z_dif; X_e(3)=NormalizeAng(X_e(3));</code>"]
  },
  "tuning": {
    id: "tuning",
    title: "Sintonia: <code>P</code> inicial e <code>Q</code> — o filtro tem de convergir",
    lang: "matlab",
    starter: `% P : covariancia INICIAL da estimativa (3x3).  Quanto e que confias
%     na pose inicial? O robo arranca em (2, -2) mas o filtro assume (2.5, -2.5).
% Q : covariancia do ruido do modelo de movimento (2x2), no espaco dos
%     DESLOCAMENTOS [delta_d ; delta_theta] — erro em metros e em radianos
%     POR CICLO, nao por segundo.
P = ;
Q = ;`,
    harness: `N=300;
p_count=0;
X=[2 -2 0]';
v_t=randn(1,N)+1;
omega_t=randn(1,N)*0.5+0.5;
u_t=[ v_t ; omega_t ];

%%USER%%

sdv_dist_1m=0.05;
sdv_ang=0.01;
xp1=5; yp1=-2.5;
xp2=5; yp2=2.5;
X_e=[2.5 -2.5 0]';
xr_e=X_e(1); yr_e=X_e(2); theta_r_e=X_e(3);
dt=0.040;
errs=zeros(1,N);

for i=1:N
  v=u_t(1,i);
  omega=u_t(2,i);
  TSPAN=[0,dt];
  [T,Xs]=ode45('robot_5dpo',TSPAN,X,[],[v omega]);
  X=Xs(size(Xs,1),:)';
  xr=X(1); yr=X(2);
  X(3)= NormalizeAng(X(3));
  theta_r=X(3);

  xr_e=X_e(1); yr_e=X_e(2); theta_r_e=X_e(3);
  xr_e=xr_e+v*cos(theta_r_e+omega*dt/2)*dt;
  yr_e=yr_e+v*sin(theta_r_e+omega*dt/2)*dt;
  theta_r_e=NormalizeAng(theta_r_e+omega*dt);
  X_e=[xr_e ; yr_e ; theta_r_e];

  grad_f_X=[ 1 0 -v*dt*sin(theta_r_e+omega*dt/2);
      0 1 v*dt*cos(theta_r_e+omega*dt/2);
      0 0 1];
  grad_f_U=[cos(theta_r_e+omega*dt/2) -v*dt*0.5*sin(theta_r_e+omega*dt/2);
      sin(theta_r_e+omega*dt/2) v*dt*0.5*cos(theta_r_e+omega*dt/2);
      0 1];
  P = grad_f_X * P * grad_f_X' + grad_f_U*Q*grad_f_U';

  p_count=p_count+1;
  if p_count==100
    p_count=0;
  end
  if p_count<=50
    xpa=xp1; ypa=yp1;
  else
    xpa=xp2; ypa=yp2;
  end
  distp=sqrt((xpa-xr)^2+(ypa-yr)^2);
  distp_medido=distp+randn(1)*sdv_dist_1m*distp;
  theta_p= NormalizeAng(atan2(ypa-yr,xpa-xr)-theta_r);
  theta_p_medido = NormalizeAng(theta_p + randn(1)*sdv_ang);
  z=[distp_medido; theta_p_medido];

  distp_e= sqrt((xpa-xr_e)^2+(ypa-yr_e)^2);
  theta_p_e=NormalizeAng(atan2(ypa-yr_e,xpa-xr_e)-theta_r_e);
  z_e=[distp_e; theta_p_e];
  R= [ (distp_e*sdv_dist_1m)^2 0
      0 sdv_ang^2 ];
  grad_h_X  = [-(xpa-xr_e)/distp_e, -(ypa-yr_e)/distp_e, 0;
               (ypa-yr_e)/(distp_e^2), -(xpa-xr_e)/(distp_e^2), -1];

  k = P * grad_h_X' * inv(grad_h_X * P * grad_h_X' + R);
  P=(eye(3)-k * grad_h_X) * P;
  z_dif = z-z_e;
  z_dif(2)= NormalizeAng(z_dif(2));
  X_e = X_e + k * (z_dif);
  X_e(3) = NormalizeAng(X_e(3));

  errs(i) = sqrt((X(1)-X_e(1))^2 + (X(2)-X_e(2))^2);
end
erro_medio = mean(errs(N-99:N));
erro_max = max(errs(N-99:N));
`,
    solution: `P=eye(3)*1e-2;
Q=[0.0005^2 0
    0    0.0005^2];`,
    capture: ["P", "Q", "erro_medio", "erro_max"],
    tol: 1e-9,
    tolPct: 1e-7,
    tests: [
      {kind: "assert", name: "Dimensões corretas (P 3x3, Q 2x2)", check: function(cap){
               if(!Array.isArray(cap.P) || cap.P.length!==3 || cap.P[0].length!==3)
                 return "P tem de ser 3x3 (uma variância por componente do estado).";
               if(!Array.isArray(cap.Q) || cap.Q.length!==2 || cap.Q[0].length!==2)
                 return "Q tem de ser 2x2 — vive no espaço dos deslocamentos [delta_d ; delta_theta], não no do estado.";
               for(var i=0;i<3;i++) if(cap.P[i][i] <= 0) return "A diagonal de P tem de ser positiva (são variâncias).";
               for(var j=0;j<2;j++) if(cap.Q[j][j] <= 0) return "A diagonal de Q tem de ser positiva.";
               return true;
             }},
      {kind: "assert", name: "O filtro converge (erro médio nas últimas 100 iterações < 6 cm)", check: function(cap){
               if(!(cap.erro_medio < 0.06))
                 return "erro médio final = " + cap.erro_medio.toFixed(3) + " m (limite 0.060 m). " +
                        "Com estes P e Q a estimativa não acompanha o robô.";
               return true;
             }},
      {kind: "assert", name: "Não diverge em nenhum instante (erro máximo < 20 cm)", check: function(cap){
               if(!(cap.erro_max < 0.20))
                 return "erro máximo = " + cap.erro_max.toFixed(3) + " m (limite 0.200 m). " +
                        "O filtro chega a perder-se — sinal de Q demasiado pequeno face ao ruído real.";
               return true;
             }}
    ],
    rules: [],
    signalHints: {},
    hints: ["Não há uma resposta única: qualquer sintonia razoável passa. O que se avalia é o <b>desempenho</b> do filtro ao fim de 300 iterações.", "P inicial diz quanto confias na pose de arranque. O filtro começa em (2.5, −2.5) e o robô está em (2, −2): o erro inicial é ~0.7 m. Um P demasiado pequeno diz ao filtro «tenho a certeza» e ele demora imenso a corrigir.", "Q é a incerteza do <b>modelo de movimento</b>, no espaço dos deslocamentos [Δd ; Δθ]. Q grande = confio pouco no modelo e muito nas medidas (converge depressa, mas a estimativa fica ruidosa). Q pequeno = o contrário.", "Lê o Q do professor em unidades: <code>Q=[0.0005^2 0; 0 0.0005^2]</code> diz «em cada ciclo de 40 ms erro cerca de 0.5 mm no avanço e 0.5 mrad na rotação» — plausível para odometria. Se fosse ruído de <i>velocidade</i>, seriam 0.5 mm/s, otimista de mais. É mais uma confirmação de que a leitura certa é em deslocamentos.", "O professor usa <code>P=eye(3)*1e-2;</code> e <code>Q=[0.0005^2 0; 0 0.0005^2];</code>. Experimenta multiplicar e dividir por 100 e observa o efeito nos dois indicadores."]
  },
  "loop4": {
    id: "loop4",
    title: "Câmara omnidirecional: atualizar com os 4 postes",
    lang: "matlab",
    starter: `% Ponto 3 do enunciado: o robô vê os 4 postes ao mesmo tempo.
% Já tens: xp, yp (1x4 com as coordenadas dos postes), zs (2x4 com a medida
% [distância ; ângulo] de cada poste, já simulada), x_e (3x1) e P (3x3).
% Escreve o ciclo que faz UMA atualização do EKF por cada poste.
for j = 1:4

end`,
    harness: `sdv_dist_1m=0.05;
sdv_ang=0.01;
xp=[5 5 -5 -5];
yp=[-2.5 2.5 -2.5 2.5];
zs=zeros(2,4);
for jj=1:4
  dd = sqrt((xp(jj)-x_true(1))^2 + (yp(jj)-x_true(2))^2);
  zs(1,jj) = dd + randn(1)*sdv_dist_1m*dd;
  zs(2,jj) = NormalizeAng(atan2(yp(jj)-x_true(2), xp(jj)-x_true(1)) - x_true(3) + randn(1)*sdv_ang);
end

%%USER%%
`,
    solution: `for j=1:4
  xr_e=x_e(1);
  yr_e=x_e(2);
  theta_r_e=x_e(3);
  z = zs(:,j);
  distp_e= sqrt((xp(j)-xr_e)^2+(yp(j)-yr_e)^2);
  theta_p_e=NormalizeAng(atan2(yp(j)-yr_e,xp(j)-xr_e)-theta_r_e);
  z_e=[distp_e; theta_p_e];
  R= [ (distp_e*sdv_dist_1m)^2 0
      0 sdv_ang^2 ];
  grad_h_X  = [-(xp(j)-xr_e)/distp_e, -(yp(j)-yr_e)/distp_e, 0;
               (yp(j)-yr_e)/(distp_e^2), -(xp(j)-xr_e)/(distp_e^2), -1];
  k = P * grad_h_X' * inv(grad_h_X * P * grad_h_X' + R);
  P=(eye(3)-k * grad_h_X) * P;
  z_diff = z - z_e;
  z_diff(2) = NormalizeAng(z_diff(2));
  x_e = x_e + k * z_diff;
end`,
    capture: ["x_e", "P"],
    tol: 1e-9,
    tolPct: 1e-7,
    tests: [
      {"name": "Robô no centro do campo", "set": {"x_true": [[0.5], [0.2], [0.3]], "x_e": [[0.62], [0.05], [0.34]], "P": [[0.05, 0.01, 0], [0.01, 0.04, 0.005], [0, 0.005, 0.02]]}},
      {"name": "Robô junto a um canto", "set": {"x_true": [[3.8], [-2.0], [-0.4]], "x_e": [[3.55], [-1.78], [-0.31]], "P": [[0.1, 0, 0], [0, 0.1, 0], [0, 0, 0.03]]}},
      {"name": "Robô virado para trás (inovações a saltar ±π)", "set": {"x_true": [[0.0], [0.0], [3.05]], "x_e": [[0.3], [-0.25], [-3.05]], "P": [[0.2, 0.05, 0], [0.05, 0.2, 0], [0, 0, 0.1]]}},
      {"name": "Estimativa inicial má (P grande)", "set": {"x_true": [[-1.0], [1.5], [2.8]], "x_e": [[-0.2], [0.9], [2.4]], "P": [[0.6, 0.1, 0], [0.1, 0.5, 0], [0, 0, 0.2]]}}
    ],
    rules: [{re: /for\s+j|while/, msg: "Precisas de um ciclo pelos 4 postes — cada um dá uma atualização separada.", level: "error"}, {re: /xp\s*\(\s*j\s*\)/, msg: "Dentro do ciclo tens de usar as coordenadas do poste <code>j</code>: <code>xp(j)</code> e <code>yp(j)</code>.", level: "error"}, {re: /normalizeang/, msg: "Tanto o ângulo esperado como a inovação angular têm de ser normalizados.", level: "error"}, {re: /\(\s*2\s*\)\s*=\s*normalizeang/, msg: "Falta normalizar a <b>inovação</b> angular dentro do ciclo: <code>e(2) = NormalizeAng(e(2))</code>. Sem isso, sempre que a leitura e a expectativa caem em lados opostos de ±π o filtro recebe um erro de ~2π e dá um salto.", level: "error"}],
    signalHints: {"x_e": "Duas causas prováveis, por ordem: (1) não normalizaste a <b>inovação</b> angular — <code>e(2) = NormalizeAng(e(2))</code> dentro do ciclo; (2) estás a recalcular tudo com o <b>mesmo</b> <code>x_e</code> nas quatro iterações — cada poste tem de partir da estimativa já corrigida pelos anteriores, portanto reextrai <code>xr_e, yr_e, theta_r_e</code> de <code>x_e</code> no início de cada volta.", "P": "Se x_e está certo mas P não, verifica que atualizas P <b>dentro</b> do ciclo (uma vez por poste) e não só no fim. Quatro observações reduzem a incerteza quatro vezes."},
    hints: ["O corpo do ciclo é exatamente o que já escreveste nas sub-tarefas anteriores — h(X), R, grad_h_X, ganho, atualização — mas com o poste <code>j</code>.", "A medida do poste j é <code>z = zs(:,j)</code>.", "O ponto crítico: no início de cada iteração reextrai <code>xr_e=x_e(1); yr_e=x_e(2); theta_r_e=x_e(3);</code>. As quatro atualizações são <b>sequenciais</b>, cada uma parte do resultado da anterior.", "Não voltes a fazer a predição dentro do ciclo — o modelo de movimento aplica-se uma vez por período de amostragem, as observações é que são quatro."]
  }
};
