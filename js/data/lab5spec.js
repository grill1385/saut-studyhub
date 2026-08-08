/* ===== SAUT StudyHub — especificação avaliável da Labwork 5 =====
   EKF com beacons detetados por laser, no SimTwo (Pascal).
   GERADO por tools/gen_lab5spec.py a partir de
   Lab_5/SimTwo64_LabWork__5_EKF.zip -> EKF_Beacon_Laser_Sol/NXTControl.spas.
   NÃO EDITAR À MÃO — alterar o gerador e voltar a correr.
*/
window.SAUT_LABSPEC = window.SAUT_LABSPEC || {};
window.SAUT_LABSPEC["m5-mod6"] = {
  "predict": {
    id: "predict",
    title: "Odometria do robô diferencial — <code>predictPosition</code>",
    entry: "predictposition",
    signature: "procedure predictPosition(odo1, odo2: double);",
    starter: `procedure predictPosition(odo1, odo2: double);
var d, delta_theta: double;
begin
  // odo1 e odo2 sao os impulsos de cada roda desde o ciclo anterior.
  // ToMetres converte impulsos em metros; WheelDist e a distancia entre rodas.
  d := ;
  delta_theta := ;

  x := ;
  y := ;
  theta := ;
end;`,
    prelude: `const
  ToMetres  = 0.0007277;
  WheelDist = 0.198;
  NBEACONS  = 3;
  NBEAMS2   = 180;
  dt        = 0.04;
  lin_stddev   = 1E-2;
  omega_stddev = 1E-2;
  sensD_stddev = 0.005;
  sensA_stddev = 0.009;
var
  x, y, theta, vlin, omega: double;
  truex, truey, truetheta: double;
  errsum, errmax, erro_medio, erro_max: double;
  nerr, irobot, iLaser, firstRay, lastRay: integer;
  XR, P, Q, R, grad_f_X, grad_f_q, grad_h_x: Matrix;
  LaserValues: Matrix;
  LogOn: boolean;
`,
    solution: `procedure predictPosition(odo1, odo2: double);
var d, delta_theta: double;
begin

  d := (odo1+odo2)/2.0 * ToMetres;
  delta_theta := (odo2-odo1)* ToMetres/WheelDist;
  x := x + d*cos(theta+delta_theta/2);
  y := y + d*sin(theta+delta_theta/2);
  theta := NormalizeAngle(theta+delta_theta);
end;`,
    globals: ["x", "y", "theta"],
    watch: ["x", "y", "theta"],
    tol: 1e-06,
    tests: [
      {"name": "Andamento em frente", "G": {"x": 0.0, "y": 0.0, "theta": 0.0}, "args": [500, 500], "repeat": 3},
      {"name": "Rotação no lugar", "G": {"x": 0.5, "y": 0.5, "theta": 0.0}, "args": [-300, 300], "repeat": 4},
      {"name": "Curva à esquerda", "G": {"x": 0.2, "y": -0.1, "theta": 0.4}, "args": [400, 700], "repeat": 5},
      {"name": "Marcha-atrás", "G": {"x": 1.0, "y": 1.0, "theta": 1.2}, "args": [-600, -600], "repeat": 2},
      {"name": "Passagem por ±π", "G": {"x": 0.0, "y": 0.0, "theta": 3.1}, "args": [-2000, 2000], "repeat": 3}
    ],
    rules: [{re: /tometres/, msg: "Os impulsos convertem-se em metros com a constante <code>ToMetres</code>.", level: "error"}, {re: /wheeldist/, msg: "A variação de orientação divide pela distância entre rodas, <code>WheelDist</code>.", level: "error"}, {re: /normalizeangle/, msg: "A orientação tem de ficar normalizada em (−π, π].", level: "error"}],
    signalHints: {"G.theta": "<code>delta_theta = (odo2 − odo1)·ToMetres / WheelDist</code> — é a <b>diferença</b> entre rodas a dividir pela distância entre elas. E o resultado passa por <code>NormalizeAngle</code>.", "G.x": "O deslocamento do centro é a <b>média</b> das duas rodas: <code>d = (odo1+odo2)/2·ToMetres</code>. E integra-se no ângulo médio do intervalo, <code>theta + delta_theta/2</code>.", "G.y": "Mesma ideia da componente x, com <code>sin</code> em vez de <code>cos</code>, e o mesmo ângulo médio."},
    hints: ["Duas grandezas a partir dos encoders: o avanço do centro do robô (média das rodas) e a rotação (diferença das rodas).", "<code>d := (odo1+odo2)/2.0 * ToMetres;</code> e <code>delta_theta := (odo2-odo1)*ToMetres/WheelDist;</code>", "Tal como na Lab 4, a posição integra-se no <b>ângulo médio</b> do intervalo: <code>theta + delta_theta/2</code>.", "No fim: <code>theta := NormalizeAngle(theta + delta_theta);</code>"]
  },
  "motionmodel": {
    id: "motionmodel",
    title: "Predição do EKF — <code>EKF_MotionModel</code>",
    entry: "ekf_motionmodel",
    signature: "procedure EKF_MotionModel;",
    starter: `procedure EKF_MotionModel;
begin
  // 1) escreve o estado estimado nas celulas (33,1)..(35,1) e le para XR
  SetRCValue(33,1, format('%.4g', [x]));
  SetRCValue(34,1, format('%.4g', [y]));
  SetRCValue(35,1, format('%.4g', [theta]));
  XR := RangeToMatrix(33,1, 3,1);

  // 2) df/dX : so as entradas que dependem do estado mudam (as outras ja la estao)
  SetRCValue(42,3, format('%.4g', [ ]));
  SetRCValue(43,3, format('%.4g', [ ]));
  grad_f_X := RangeToMatrix(42,1, 3,3);

  // 3) df/dq
  grad_f_q := RangeToMatrix(42,5, 3,2);

  // 4) propagacao da covariancia com MMult / Mtran / Madd
  P := ;
  MatrixToRange(33, 5, P);
end;`,
    prelude: `const
  ToMetres  = 0.0007277;
  WheelDist = 0.198;
  NBEACONS  = 3;
  NBEAMS2   = 180;
  dt        = 0.04;
  lin_stddev   = 1E-2;
  omega_stddev = 1E-2;
  sensD_stddev = 0.005;
  sensA_stddev = 0.009;
var
  x, y, theta, vlin, omega: double;
  truex, truey, truetheta: double;
  errsum, errmax, erro_medio, erro_max: double;
  nerr, irobot, iLaser, firstRay, lastRay: integer;
  XR, P, Q, R, grad_f_X, grad_f_q, grad_h_x: Matrix;
  LaserValues: Matrix;
  LogOn: boolean;
`,
    solution: `procedure EKF_MotionModel;
begin
  //Update XR
  SetRCValue(33,1, format('%.4g', [x]));
  SetRCValue(34,1, format('%.4g', [y]));
  SetRCValue(35,1, format('%.4g', [theta]));
  XR := RangeToMatrix(33,1, 3,1);

  //Update df/dX
  SetRCValue(42,3, format('%.4g', [-vlin*dt*sin(theta + 0.5*omega*dt)]));
  SetRCValue(43,3, format('%.4g', [vlin*dt*cos(theta + 0.5*omega*dt)]));
  grad_f_X := RangeToMatrix(42,1, 3,3);

  //Update df/dq
  SetRCValue(42,5, format('%.4g', [cos(theta + 0.5*omega*dt)]));
  SetRCValue(42,6, format('%.4g', [-0.5*vlin*dt*sin(theta + 0.5*omega*dt)]));
  SetRCValue(43,5, format('%.4g', [sin(theta + 0.5*omega*dt)]));
  SetRCValue(43,6, format('%.4g', [0.5*vlin*dt*cos(theta + 0.5*omega*dt)]));
  grad_f_q := RangeToMatrix(42,5, 3,2);

  //Covariance propagation
  P := MMult(grad_f_X, P);
  P := MMult(P, Mtran(grad_f_X));
  P := Madd(P, MMult(grad_f_q, MMult(Q, Mtran(grad_f_q))));
  MatrixToRange(33, 5, P);
end;`,
    globals: ["x", "y", "theta", "vlin", "omega"],
    watch: ["p", "grad_f_x", "grad_f_q", "xr"],
    sheet0: {"42,1": "1", "42,2": "0", "42,3": "0", "43,1": "0", "43,2": "1", "43,3": "0", "44,1": "0", "44,2": "0", "44,3": "1", "42,5": "0", "42,6": "0", "43,5": "0", "43,6": "0", "44,5": "0", "44,6": "1", "47,1": "0", "47,2": "0", "47,3": "0", "48,1": "0", "48,2": "0", "48,3": "-1"},
    tol: 1e-06,
    tolPct: 0.005,
    tests: [
      {"name": "Andamento em frente", "G": {"x": 0.5, "y": 0.5, "theta": 0.0, "vlin": 0.2, "omega": 0.0, "p": {"__mat": [[0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.01]]}, "q": {"__mat": [[0.0001, 0], [0, 0.0001]]}}},
      {"name": "Curva", "G": {"x": -0.2, "y": 0.9, "theta": 0.7, "vlin": 0.25, "omega": 0.4, "p": {"__mat": [[0.02, 0.005, 0], [0.005, 0.03, 0.001], [0, 0.001, 0.01]]}, "q": {"__mat": [[0.0001, 0], [0, 0.0001]]}}},
      {"name": "P com correlações fortes (apanha transposições em falta)", "G": {"x": 1.0, "y": -0.4, "theta": -1.1, "vlin": 0.18, "omega": -0.6, "p": {"__mat": [[0.3, 0.2, 0.1], [0.2, 0.25, -0.05], [0.1, -0.05, 0.15]]}, "q": {"__mat": [[0.0004, 0.0001], [0.0001, 2.5e-05]]}}},
      {"name": "Robô parado", "G": {"x": 0.0, "y": 0.0, "theta": 1.5, "vlin": 0.0, "omega": 0.5, "p": {"__mat": [[0.05, 0, 0], [0, 0.05, 0], [0, 0, 0.02]]}, "q": {"__mat": [[0.0001, 0], [0, 0.0001]]}}},
      {"name": "Duas predições seguidas (a incerteza tem de crescer)", "G": {"x": 0.3, "y": 0.3, "theta": 0.2, "vlin": 0.22, "omega": 0.35, "p": {"__mat": [[0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.01]]}, "q": {"__mat": [[0.0001, 0], [0, 0.0001]]}}, "repeat": 3}
    ],
    rules: [{re: /mtran/, msg: "A propagação de P é uma sanduíche: <code>F·P·F'</code>. Precisas do <code>Mtran</code>.", level: "error"}, {re: /madd/, msg: "Há duas parcelas a somar — usa <code>Madd</code>.", level: "error"}, {re: /0\.5\s*\*\s*omega\s*\*\s*dt|omega\s*\*\s*dt\s*\/\s*2/, msg: "As derivadas avaliam-se no ângulo médio do intervalo, <code>theta + 0.5*omega*dt</code>.", level: "error"}],
    signalHints: {"G.grad_f_x": "Só duas entradas de <code>df/dX</code> mudam a cada ciclo — as da terceira coluna, linhas 1 e 2 (células (42,3) e (43,3)): <code>-vlin*dt*sin(theta+0.5*omega*dt)</code> e <code>vlin*dt*cos(theta+0.5*omega*dt)</code>. O resto da matriz é a identidade e já foi escrito na Initialize.", "G.grad_f_q": "<code>df/dq</code> é 3x2. Coluna do v: <code>[cos(a); sin(a); 0]</code>. Coluna do omega: <code>[-0.5*vlin*dt*sin(a); 0.5*vlin*dt*cos(a); 1]</code>, com <code>a = theta+0.5*omega*dt</code>. Escreve as células (42,5), (42,6), (43,5) e (43,6).", "G.p": "A fórmula é <code>P = F·P·F' + G·Q·G'</code>. Em SimTwo faz-se por passos: <code>P := MMult(grad_f_X, P); P := MMult(P, Mtran(grad_f_X)); P := Madd(P, MMult(grad_f_q, MMult(Q, Mtran(grad_f_q))));</code>", "G.xr": "<code>XR</code> lê-se das células (33,1) a (35,1) depois de lá escreveres x, y e theta."},
    hints: ["A folha de cálculo do SimTwo é o teu «bloco de notas» das matrizes: escreves com <code>SetRCValue</code>, lês com <code>RangeToMatrix(linha, coluna, nLinhas, nColunas)</code>.", "A Initialize já lá deixou a identidade em df/dX e o 1 em df/dq(3,2) — só tens de reescrever as entradas que dependem do estado.", "As derivadas são as mesmas da Lab 4, avaliadas em <code>theta + 0.5*omega*dt</code>.", "Propagação em três passos com MMult/Mtran/Madd, exatamente como <code>F·P·F' + G·Q·G'</code>."]
  },
  "update": {
    id: "update",
    title: "Atualização do EKF — <code>EKF_Update</code>",
    entry: "ekf_update",
    signature: "procedure EKF_Update(nBeacon: integer);",
    starter: `procedure EKF_Update(nBeacon: integer);
var Z, Z_E, Kf: Matrix;
    dBeacon: double;
begin
  // 1) distancia esperada ao beacon e dh/dX (celulas (47,1)..(48,3))
  dBeacon := ;

  grad_h_x := RangeToMatrix(47,1, 2,3);

  // 2) ganho de Kalman: Kf = P*H'*inv(H*P*H' + R)
  Kf := ;
  MatrixToRange(51,5, Kf);

  // 3) covariancia: P = (I - Kf*H)*P
  P := ;
  MatrixToRange(33, 5, P);

  // 4) inovacao: Z_E = medida - esperada (cuidado com o angulo!)

  // 5) estado: XR = XR + Kf*Z_E, e volta a ler x, y, theta
end;`,
    prelude: `const
  ToMetres  = 0.0007277;
  WheelDist = 0.198;
  NBEACONS  = 3;
  NBEAMS2   = 180;
  dt        = 0.04;
  lin_stddev   = 1E-2;
  omega_stddev = 1E-2;
  sensD_stddev = 0.005;
  sensA_stddev = 0.009;
var
  x, y, theta, vlin, omega: double;
  truex, truey, truetheta: double;
  errsum, errmax, erro_medio, erro_max: double;
  nerr, irobot, iLaser, firstRay, lastRay: integer;
  XR, P, Q, R, grad_f_X, grad_f_q, grad_h_x: Matrix;
  LaserValues: Matrix;
  LogOn: boolean;
`,
    solution: `procedure EKF_Update(nBeacon: integer);
var Z, Z_E, Kf: Matrix;
    //sensD, sensTheta, obsAng, obsDist, dw, a, b, dOdD: double;
    dBeacon: double;
    txt: string;
begin
  //dh/dX
  dBeacon := Dist(BeaconPos[nBeacon].x - x, BeaconPos[nBeacon].y - y);
  SetRCValue(47,1, format('%.4g', [-(BeaconPos[nBeacon].x - x)/dBeacon]));
  SetRCValue(48,1, format('%.4g', [(BeaconPos[nBeacon].y - y)/Power(dBeacon,2)]));
  SetRCValue(47,2, format('%.4g', [-(BeaconPos[nBeacon].y - y)/dBeacon]));
  SetRCValue(48,2, format('%.4g', [-(BeaconPos[nBeacon].x - x)/Power(dBeacon,2)]));
  SetRCValue(47,3, format('%d', [0]));
  SetRCValue(48,3, format('%d', [-1]));
  grad_h_x := RangeToMatrix(47,1, 2,3);

  //compute kalman gain
  Kf := MMult(grad_h_X, P);
  Kf := MMult(Kf, Mtran(grad_h_X));
  Kf := Madd(Kf, R);
  Kf := Minv(Kf);
  Kf := MMult(Mtran(grad_h_X), Kf);
  Kf := MMult(P, Kf);
  MatrixToRange(51,5, Kf);

  //covariance matrix update
  P := MMult( Msub( Meye(3), MMult(Kf, grad_h_X) ), P );
  MatrixToRange(33, 5, P);
    
  //update state variables
  //Matrix Z (measures from sensor)
  SetRCValue(51,1, format('%.4g', [BeaconCluster[nBeacon].dist]));
  SetRCValue(52,1, format('%.4g', [BeaconCluster[nBeacon].ang]));
  Z := RangeToMatrix(51,1, 2,1);
    
  //Matrix Z_E  (measures from sensor - expected measures)
  SetRCValue(51,3, format('%.4g', [BeaconCluster[nBeacon].dist - dBeacon]));
  SetRCValue(52,3, format('%.4g', [NormalizeAngle(BeaconCluster[nBeacon].ang - NormalizeAngle(Atan2(BeaconPos[nBeacon].y-y, BeaconPos[nBeacon].x-x) - theta))]));
  Z_E := RangeToMatrix(51,3, 2,1);

  //Matrix X
  XR := Madd(XR, MMult (Kf, Z_E));
  MatrixToRange(33,1, XR);

  //Update X and Theta
  x := GetRCValue(33,1);
  y := GetRCValue(34,1);
  theta := NormalizeAngle(GetRCValue(35,1));
  SetRCValue(35,1, format('%.4g', [theta]));

  if LogOn then begin
    // x y theta enc1 enc2 Laser
    txt := format('%d; %g; %g;  %g; %g; %g; %g; %g; %g; %g; %g', [nBeacon, dBeacon, NormalizeAngle(Atan2(BeaconPos[nBeacon].y-y, BeaconPos[nBeacon].x-x) - theta), BeaconCluster[nBeacon].dist, BeaconCluster[nBeacon].ang, x, y, theta, GetRobotX(0), GetRobotY(0), GetRobotTheta(0)]);
    log.add(txt);
  end;

end;`,
    globals: ["x", "y", "theta"],
    watch: ["p", "xr", "x", "y", "theta", "grad_h_x"],
    sheet0: {"42,1": "1", "42,2": "0", "42,3": "0", "43,1": "0", "43,2": "1", "43,3": "0", "44,1": "0", "44,2": "0", "44,3": "1", "42,5": "0", "42,6": "0", "43,5": "0", "43,6": "0", "44,5": "0", "44,6": "1", "47,1": "0", "47,2": "0", "47,3": "0", "48,1": "0", "48,2": "0", "48,3": "-1"},
    tol: 1e-06,
    tolPct: 0.005,
    tests: [
      {"name": "Beacon 1 à frente", "G": {"x": 0.5, "y": 0.5, "theta": 0.3, "p": {"__mat": [[0.02, 0.005, 0], [0.005, 0.03, 0.002], [0, 0.002, 0.01]]}, "r": {"__mat": [[2.5e-05, 0], [0, 8.1e-05]]}, "xr": {"__mat": [[0.5], [0.5], [0.3]]}, "beaconpos": {"1": {"x": -0.3, "y": 1.3}, "2": {"x": 1.3, "y": 1.3}, "3": {"x": 0.5, "y": -0.3}}, "beaconcluster": {"1": {"x": -0.29, "y": 1.31, "n": 6, "dist": 0.0, "ang": 0.0}, "2": {"x": 1.28, "y": 1.29, "n": 4, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.51, "y": -0.28, "n": 5, "dist": 0.0, "ang": 0.0}}, "logon": false}, "args": [1]},
      {"name": "Beacon 2, estimativa deslocada", "G": {"x": 0.35, "y": 0.62, "theta": -0.4, "p": {"__mat": [[0.08, 0.01, 0], [0.01, 0.07, 0], [0, 0, 0.03]]}, "r": {"__mat": [[2.5e-05, 0], [0, 8.1e-05]]}, "xr": {"__mat": [[0.35], [0.62], [-0.4]]}, "beaconpos": {"1": {"x": -0.3, "y": 1.3}, "2": {"x": 1.3, "y": 1.3}, "3": {"x": 0.5, "y": -0.3}}, "beaconcluster": {"1": {"x": -0.31, "y": 1.28, "n": 5, "dist": 0.0, "ang": 0.0}, "2": {"x": 1.32, "y": 1.33, "n": 7, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.48, "y": -0.31, "n": 3, "dist": 0.0, "ang": 0.0}}, "logon": false}, "args": [2]},
      {"name": "Beacon 3 atrás do robô (inovação angular a saltar ±π)", "G": {"x": 0.5, "y": 0.9, "theta": 3.05, "p": {"__mat": [[0.05, 0, 0], [0, 0.05, 0], [0, 0, 0.02]]}, "r": {"__mat": [[2.5e-05, 0], [0, 8.1e-05]]}, "xr": {"__mat": [[0.5], [0.9], [3.05]]}, "beaconpos": {"1": {"x": -0.3, "y": 1.3}, "2": {"x": 1.3, "y": 1.3}, "3": {"x": 0.5, "y": -0.3}}, "beaconcluster": {"1": {"x": -0.28, "y": 1.32, "n": 4, "dist": 0.0, "ang": 0.0}, "2": {"x": 1.29, "y": 1.31, "n": 4, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.52, "y": -0.29, "n": 8, "dist": 0.0, "ang": 0.0}}, "logon": false}, "args": [3]},
      {"name": "P grande — o filtro deve confiar muito na medida", "G": {"x": 0.0, "y": 0.0, "theta": 0.0, "p": {"__mat": [[0.6, 0.1, 0], [0.1, 0.5, 0], [0, 0, 0.2]]}, "r": {"__mat": [[2.5e-05, 0], [0, 8.1e-05]]}, "xr": {"__mat": [[0.0], [0.0], [0.0]]}, "beaconpos": {"1": {"x": -0.3, "y": 1.3}, "2": {"x": 1.3, "y": 1.3}, "3": {"x": 0.5, "y": -0.3}}, "beaconcluster": {"1": {"x": -0.3, "y": 1.3, "n": 9, "dist": 0.0, "ang": 0.0}, "2": {"x": 1.3, "y": 1.3, "n": 9, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.5, "y": -0.3, "n": 9, "dist": 0.0, "ang": 0.0}}, "logon": false}, "args": [1]},
      {"name": "Três beacons seguidos (atualizações sequenciais)", "G": {"x": 0.55, "y": 0.45, "theta": 0.15, "p": {"__mat": [[0.04, 0.01, 0], [0.01, 0.04, 0], [0, 0, 0.02]]}, "r": {"__mat": [[2.5e-05, 0], [0, 8.1e-05]]}, "xr": {"__mat": [[0.55], [0.45], [0.15]]}, "beaconpos": {"1": {"x": -0.3, "y": 1.3}, "2": {"x": 1.3, "y": 1.3}, "3": {"x": 0.5, "y": -0.3}}, "beaconcluster": {"1": {"x": -0.29, "y": 1.29, "n": 6, "dist": 0.0, "ang": 0.0}, "2": {"x": 1.31, "y": 1.3, "n": 6, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.49, "y": -0.3, "n": 6, "dist": 0.0, "ang": 0.0}}, "logon": false}, "args": [1], "repeat": 3}
    ],
    rules: [{re: /minv/, msg: "O ganho de Kalman precisa de <code>Minv</code> para inverter a covariância da inovação.", level: "error"}, {re: /meye\s*\(\s*3\s*\)/, msg: "A atualização da covariância é <code>(I − Kf·H)·P</code> — em SimTwo, <code>Meye(3)</code>.", level: "error"}, {re: /normalizeangle/, msg: "A inovação angular tem de ser normalizada, senão salta 2π quando o beacon está atrás.", level: "error"}, {re: /power\s*\(\s*dbeacon\s*,\s*2\s*\)|dbeacon\s*\*\s*dbeacon/, msg: "Na linha do ângulo de <code>dh/dX</code> o denominador é a distância ao <b>quadrado</b>.", level: "error"}],
    signalHints: {"G.grad_h_x": "É a mesma matriz 2x3 da Lab 4, agora escrita célula a célula: (47,1) e (47,2) são <code>-(bx-x)/d</code> e <code>-(by-y)/d</code>; (48,1) e (48,2) são <code>(by-y)/d²</code> e <code>-(bx-x)/d²</code>; (47,3) é 0 e (48,3) é −1.", "G.p": "<code>P := MMult( Msub( Meye(3), MMult(Kf, grad_h_X) ), P );</code> — a covariância só pode diminuir com uma observação.", "G.xr": "A inovação vai na coluna 3: <code>Z_E</code> guarda a <b>diferença</b> medida−esperada, não a medida esperada. E a componente angular passa por <code>NormalizeAngle</code>.", "G.theta": "Depois de <code>XR := Madd(XR, MMult(Kf, Z_E))</code> tens de escrever XR de volta na folha e reler x, y e theta — e normalizar o theta."},
    hints: ["A estrutura é a da Lab 4, mas as matrizes vivem na folha de cálculo: escreves as entradas com <code>SetRCValue</code> e lês o bloco com <code>RangeToMatrix</code>.", "Ganho, por passos: <code>Kf := MMult(grad_h_X, P); Kf := MMult(Kf, Mtran(grad_h_X)); Kf := Madd(Kf, R); Kf := Minv(Kf); Kf := MMult(Mtran(grad_h_X), Kf); Kf := MMult(P, Kf);</code>", "Atenção ao que o professor põe em <code>Z_E</code>: não é a medida esperada, é a <b>inovação</b> — <code>dist_medida − dBeacon</code> e o ângulo medido menos o esperado, normalizado.", "No fim, <code>XR := Madd(XR, MMult(Kf, Z_E)); MatrixToRange(33,1, XR);</code> e relê x, y, theta das células (33,1)..(35,1)."]
  },
  "laser2world": {
    id: "laser2world",
    title: "Do laser para o mundo — coordenadas de um ponto medido",
    entry: "laserpointtoworld",
    signature: "procedure LaserPointToWorld(MeasureDist: double; i: integer; var px, py: double);",
    starter: `procedure LaserPointToWorld(MeasureDist: double; i: integer; var px, py: double);
begin
  // i e o indice do raio (0..359). O angulo do raio no referencial do laser
  // e (i-NBEAMS2)*pi()/NBEAMS2, com NBEAMS2 = 180.
  // O laser esta alinhado com o robo mas 0.14 m ATRAS da origem do robo.
  px := ;
  py := ;
end;`,
    prelude: `const
  ToMetres  = 0.0007277;
  WheelDist = 0.198;
  NBEACONS  = 3;
  NBEAMS2   = 180;
  dt        = 0.04;
  lin_stddev   = 1E-2;
  omega_stddev = 1E-2;
  sensD_stddev = 0.005;
  sensA_stddev = 0.009;
var
  x, y, theta, vlin, omega: double;
  truex, truey, truetheta: double;
  errsum, errmax, erro_medio, erro_max: double;
  nerr, irobot, iLaser, firstRay, lastRay: integer;
  XR, P, Q, R, grad_f_X, grad_f_q, grad_h_x: Matrix;
  LaserValues: Matrix;
  LogOn: boolean;
`,
    solution: `procedure LaserPointToWorld(MeasureDist: double; i: integer; var px, py: double);
begin
  px := MeasureDist*cos((i-NBEAMS2)*pi()/NBEAMS2 + theta) + x - 0.14*cos(theta);
  py := MeasureDist*sin((i-NBEAMS2)*pi()/NBEAMS2 + theta) + y - 0.14*sin(theta);
end;`,
    globals: ["x", "y", "theta"],
    watchArgs: [2, 3],
    tol: 1e-06,
    tests: [
      {"name": "Raio central, robô na origem", "G": {"x": 0.0, "y": 0.0, "theta": 0.0}, "args": [1.0, 180, 0, 0]},
      {"name": "Raio a 90°", "G": {"x": 0.0, "y": 0.0, "theta": 0.0}, "args": [1.0, 270, 0, 0]},
      {"name": "Robô rodado", "G": {"x": 0.5, "y": 0.5, "theta": 0.7}, "args": [1.5, 200, 0, 0]},
      {"name": "Raio para trás", "G": {"x": -0.2, "y": 1.0, "theta": -1.2}, "args": [2.0, 10, 0, 0]},
      {"name": "Medida curta, robô longe da origem", "G": {"x": 1.4, "y": -0.8, "theta": 2.9}, "args": [0.3, 95, 0, 0]}
    ],
    rules: [{re: /0\.14/, msg: "O laser está 0.14 m atrás da origem do robô — esse desvio tem de aparecer nas duas linhas.", level: "error"}, {re: /nbeams2/, msg: "O ângulo do raio calcula-se com <code>(i-NBEAMS2)*pi()/NBEAMS2</code>.", level: "error"}],
    signalHints: {"arg3": "Três parcelas em cada coordenada: a projeção da medida na direção do raio <b>já rodada para o mundo</b> (<code>+ theta</code>), a posição do robô, e a correção de −0.14 m na direção em que o robô aponta.", "arg4": "Idem para y, com <code>sin</code> em vez de <code>cos</code> nas duas parcelas que dependem de ângulos."},
    hints: ["O raio <code>i</code> aponta, no referencial do laser, para <code>(i-NBEAMS2)*pi()/NBEAMS2</code>. Como o laser está alinhado com o robô, no mundo isso é esse ângulo <b>mais theta</b>.", "A origem do laser não é a origem do robô: está 0.14 m para trás, ou seja em <code>(x - 0.14*cos(theta), y - 0.14*sin(theta))</code>.", "Junta as duas coisas: ponto = origem do laser + distância medida na direção do raio."]
  },
  "clustermeasure": {
    id: "clustermeasure",
    title: "Do cluster para a medida — distância e ângulo ao beacon",
    entry: "clustermeasure",
    signature: "procedure ClusterMeasure(j: integer);",
    starter: `procedure ClusterMeasure(j: integer);
begin
  // BeaconCluster[j].x e .y ja tem o centroide dos pontos do laser (no MUNDO).
  // Converte para o par (distancia, angulo) que o EKF espera.
  BeaconCluster[j].dist := ;
  BeaconCluster[j].ang  := ;
end;`,
    prelude: `const
  ToMetres  = 0.0007277;
  WheelDist = 0.198;
  NBEACONS  = 3;
  NBEAMS2   = 180;
  dt        = 0.04;
  lin_stddev   = 1E-2;
  omega_stddev = 1E-2;
  sensD_stddev = 0.005;
  sensA_stddev = 0.009;
var
  x, y, theta, vlin, omega: double;
  truex, truey, truetheta: double;
  errsum, errmax, erro_medio, erro_max: double;
  nerr, irobot, iLaser, firstRay, lastRay: integer;
  XR, P, Q, R, grad_f_X, grad_f_q, grad_h_x: Matrix;
  LaserValues: Matrix;
  LogOn: boolean;
`,
    solution: `procedure ClusterMeasure(j: integer);
begin
  BeaconCluster[j].dist := Dist(BeaconCluster[j].x - x, BeaconCluster[j].y - y);
  BeaconCluster[j].ang := NormalizeAngle(ATan2(BeaconCluster[j].y - y, BeaconCluster[j].x - x) - theta);
end;`,
    globals: ["x", "y", "theta"],
    watch: ["beaconcluster"],
    tol: 1e-06,
    tests: [
      {"name": "Beacon à frente", "G": {"x": 0.5, "y": 0.5, "theta": 0.0, "beaconcluster": {"1": {"x": -0.29, "y": 1.31, "n": 6, "dist": 0.0, "ang": 0.0}, "2": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}}}, "args": [1]},
      {"name": "Beacon atrás (obriga a normalizar)", "G": {"x": 0.5, "y": 0.5, "theta": 3.0, "beaconcluster": {"1": {"x": -0.29, "y": 1.31, "n": 6, "dist": 0.0, "ang": 0.0}, "2": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}}}, "args": [1]},
      {"name": "Robô rodado, beacon 2", "G": {"x": 0.1, "y": 0.2, "theta": -2.4, "beaconcluster": {"1": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "2": {"x": 1.28, "y": 1.29, "n": 4, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}}}, "args": [2]},
      {"name": "Beacon 3 quase em cima do robô", "G": {"x": 0.45, "y": -0.25, "theta": 1.0, "beaconcluster": {"1": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "2": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.51, "y": -0.28, "n": 9, "dist": 0.0, "ang": 0.0}}}, "args": [3]}
    ],
    rules: [{re: /normalizeangle/, msg: "O ângulo é relativo ao robô e tem de ficar em (−π, π] — usa <code>NormalizeAngle</code>.", level: "error"}, {re: /atan2/, msg: "O ângulo obtém-se com <code>ATan2</code> sobre a diferença de coordenadas.", level: "error"}],
    signalHints: {"G.beaconcluster": "<code>dist</code> é a distância do robô ao centroide: <code>Dist(cluster.x - x, cluster.y - y)</code>. <code>ang</code> é o ângulo <b>no referencial do robô</b>: <code>NormalizeAngle(ATan2(cluster.y - y, cluster.x - x) - theta)</code>. Repara que se usa a pose <b>estimada</b> (x, y, theta) — é a única que o robô conhece."},
    hints: ["É a conversão de cartesianas para polares, com a origem no robô.", "Cuidado: o ângulo tem de ser relativo à orientação do robô, portanto subtrai <code>theta</code>.", "E normaliza — senão, com o beacon atrás do robô, sai um valor fora de (−π, π] e a inovação do EKF explode."]
  },
  "associate": {
    id: "associate",
    title: "Associação: dos pontos do laser aos beacons",
    entry: "associatebeacons",
    signature: "procedure AssociateBeacons;",
    starter: `procedure AssociateBeacons;
var i, j: integer;
    MeasureDist: double;
    MeasurePos: TPos;
begin
  // 1) limpa os clusters (x, y e n a zero)

  // 2) para cada raio de firstRay a LastRay:
  //      - le a distancia com Mgetv(LaserValues, i, 0) e soma 0.02
  //        (compensa o raio do poste)
  //      - converte para o mundo (o que fizeste na sub-tarefa anterior)
  //      - se o ponto cair a menos de 0.1 m de um beacon conhecido,
  //        junta-o ao cluster desse beacon e atualiza a MEDIA das coordenadas

end;`,
    prelude: `const
  ToMetres  = 0.0007277;
  WheelDist = 0.198;
  NBEACONS  = 3;
  NBEAMS2   = 180;
  dt        = 0.04;
  lin_stddev   = 1E-2;
  omega_stddev = 1E-2;
  sensD_stddev = 0.005;
  sensA_stddev = 0.009;
var
  x, y, theta, vlin, omega: double;
  truex, truey, truetheta: double;
  errsum, errmax, erro_medio, erro_max: double;
  nerr, irobot, iLaser, firstRay, lastRay: integer;
  XR, P, Q, R, grad_f_X, grad_f_q, grad_h_x: Matrix;
  LaserValues: Matrix;
  LogOn: boolean;
`,
    solution: `procedure AssociateBeacons;
var i, j: integer;
    MeasureDist: double;
    MeasurePos: TPos;
begin
  for j:=1 to NBEACONS do begin
    BeaconCluster[j].x := 0;
    BeaconCluster[j].y := 0;
    BeaconCluster[j].n := 0;
  end;
  for i:= firstRay to LastRay do begin
    MeasureDist := Mgetv(LaserValues, i, 0)+0.02;
    if MeasureDist > 0 then begin
      MeasurePos.x := MeasureDist*cos((i-NBEAMS2)*pi()/NBEAMS2 + theta) + x - 0.14*cos(theta);
      MeasurePos.y := MeasureDist*sin((i-NBEAMS2)*pi()/NBEAMS2 + theta) + y - 0.14*sin(theta);
      for j:=1 to NBEACONS do begin
        if Dist(BeaconPos[j].x - MeasurePos.x, BeaconPos[j].y - MeasurePos.y) < 0.1 then begin
          BeaconCluster[j].n := BeaconCluster[j].n + 1;
          BeaconCluster[j].x := ((BeaconCluster[j].x * (BeaconCluster[j].n - 1)) + MeasurePos.x)/BeaconCluster[j].n;
          BeaconCluster[j].y := ((BeaconCluster[j].y * (BeaconCluster[j].n - 1)) + MeasurePos.y)/BeaconCluster[j].n;
        end;
      end;
    end;
  end;
end;`,
    globals: ["x", "y", "theta", "firstray", "lastray"],
    watch: ["beaconcluster"],
    tol: 1e-09,
    tests: [
      {"name": "Robô no centro, três beacons à vista", "G": {"x": 0.5, "y": 0.5, "theta": 0.0, "firstray": 0, "lastray": 359, "beaconpos": {"1": {"x": -0.3, "y": 1.3}, "2": {"x": 1.3, "y": 1.3}, "3": {"x": 0.5, "y": -0.3}}, "beaconcluster": {"1": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "2": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}}}, "laser": [[3.36], [3.360512], [3.362048], [3.364611], [3.368205], [3.372835], [3.378508], [3.385233], [3.393021], [3.401883], [3.411833], [3.422888], [3.435064], [3.448382], [3.462862], [3.478528], [3.495406], [3.513524], [3.532913], [3.553605], [3.575637], [3.599047], [3.623877], [3.650171], [3.677978], [3.70735], [3.738343], [3.771016], [3.805435], [3.84167], [3.879794], [3.919888], [3.962039], [4.006341], [4.052892], [4.101803], [4.153188], [4.207176], [4.263901], [4.323512], [4.386168], [4.452044], [4.521326], [4.59422], [4.67095], [4.751758], [4.83691], [4.785646], [4.709715], [4.637545], [4.568926], [4.503658], [4.441564], [4.382475], [4.326238], [4.272711], [4.221763], [4.173272], [4.127124], [4.083217], [4.041452], [4.001739], [3.963995], [3.928142], [3.894107], [3.861823], [3.831227], [3.802261], [3.774872], [3.749007], [3.724622], [3.701672], [3.680118], [3.659921], [3.641048], [3.623467], [3.607148], [3.592064], [3.578192], [3.565508], [3.553993], [3.543628], [3.534397], [3.526284], [3.519279], [3.513369], [3.508547], [3.504803], [3.502133], [3.500533], [3.5], [3.500533], [3.502133], [3.504803], [3.508547], [3.513369], [3.519279], [3.526284], [3.534397], [0.796964], [0.792184], [0.799039], [3.578192], [3.592064], [3.607148], [3.623467], [3.641048], [3.659921], [3.680118], [3.701672], [3.724622], [3.749007], [3.774872], [3.802261], [3.831227], [3.861823], [3.894107], [3.928142], [3.963995], [4.001739], [4.041452], [4.083217], [4.127124], [4.173272], [4.221763], [4.272711], [4.326238], [4.382475], [4.288071], [4.195002], [4.107111], [4.024028], [3.945418], [3.870977], [3.800429], [3.733524], [3.670032], [3.609744], [3.55247], [3.498034], [3.446275], [3.397045], [3.350208], [3.305638], [3.263219], [3.222845], [3.184415], [3.147839], [3.113031], [3.079912], [3.048409], [3.018455], [2.989985], [2.962941], [2.937269], [2.912918], [2.88984], [2.867991], [2.847332], [2.827823], [2.809429], [2.792119], [2.77586], [2.760626], [2.746391], [2.733129], [2.72082], [2.709443], [2.698979], [2.689412], [2.680726], [2.672908], [2.665945], [2.659826], [2.654542], [2.650084], [2.646447], [2.643623], [2.641609], [2.640402], [2.64], [2.640402], [2.641609], [2.643623], [2.646447], [2.650084], [2.654542], [2.659826], [2.665945], [2.672908], [2.680726], [2.689412], [2.698979], [2.709443], [2.72082], [2.733129], [2.746391], [2.760626], [2.77586], [2.792119], [2.809429], [2.827823], [2.847332], [2.867991], [2.88984], [2.912918], [2.937269], [2.962941], [2.989985], [3.018455], [3.048409], [3.079912], [3.113031], [3.147839], [3.184415], [3.222845], [3.263219], [3.305638], [3.350208], [3.397045], [1.216263], [1.219014], [3.55247], [3.609744], [3.598891], [3.535534], [3.475409], [3.418319], [3.364082], [3.312532], [3.263518], [3.216899], [3.172546], [3.130339], [3.09017], [3.051936], [3.015545], [2.980908], [2.947946], [2.916583], [2.886751], [2.858385], [2.831425], [2.805816], [2.781505], [2.758445], [2.736591], [2.715901], [2.696337], [2.677862], [2.660444], [2.644052], [2.628656], [2.614229], [2.600749], [2.58819], [2.576534], [2.56576], [2.555851], [2.546792], [2.538567], [2.531163], [2.524569], [2.518775], [2.513771], [2.50955], [2.506105], [2.503431], [2.501524], [2.500381], [2.5], [2.500381], [2.501524], [2.503431], [2.506105], [2.50955], [2.513771], [2.518775], [2.524569], [2.531163], [2.538567], [2.546792], [2.555851], [2.56576], [2.576534], [2.58819], [2.600749], [2.614229], [2.628656], [2.644052], [2.660444], [2.677862], [2.696337], [2.715901], [2.736591], [2.758445], [2.781505], [2.805816], [2.831425], [2.858385], [2.886751], [2.916583], [2.947946], [2.980908], [3.015545], [3.051936], [3.09017], [3.130339], [3.172546], [1.019447], [1.019038], [3.312532], [3.364082], [3.418319], [3.475409], [3.535534], [3.598891], [3.665698], [3.736191], [3.810633], [3.88931], [3.972539], [4.060673], [4.1541], [4.153188], [4.101803], [4.052892], [4.006341], [3.962039], [3.919888], [3.879794], [3.84167], [3.805435], [3.771016], [3.738343], [3.70735], [3.677978], [3.650171], [3.623877], [3.599047], [3.575637], [3.553605], [3.532913], [3.513524], [3.495406], [3.478528], [3.462862], [3.448382], [3.435064], [3.422888], [3.411833], [3.401883], [3.393021], [3.385233], [3.378508], [3.372835], [3.368205], [3.364611], [3.362048], [3.360512]]},
      {"name": "Robô rodado", "G": {"x": 0.4, "y": 0.2, "theta": 1.1, "firstray": 0, "lastray": 359, "beaconpos": {"1": {"x": -0.3, "y": 1.3}, "2": {"x": 1.3, "y": 1.3}, "3": {"x": 0.5, "y": -0.3}}, "beaconcluster": {"1": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "2": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}}}, "laser": [[3.450635], [3.42077], [3.392442], [3.365597], [3.340182], [3.316151], [3.293459], [3.272066], [3.251933], [3.233025], [3.215309], [3.198755], [3.183336], [3.169026], [3.1558], [3.143638], [3.13252], [3.122428], [3.113346], [3.10526], [3.098157], [3.092027], [3.086859], [3.082645], [3.07938], [3.077058], [3.075676], [3.075231], [3.075723], [3.077153], [3.079523], [3.082836], [3.087098], [3.092314], [3.098494], [3.105646], [3.113783], [3.122915], [3.133059], [3.14423], [3.156445], [3.169725], [3.184091], [3.199567], [3.216179], [3.233955], [3.252924], [3.27312], [0.400176], [0.392363], [0.389637], [0.389589], [0.392195], [0.39964], [3.452191], [3.483735], [3.516941], [3.551879], [3.588622], [3.627249], [3.667847], [3.710507], [3.755328], [3.802418], [3.851891], [3.903874], [3.958502], [4.015921], [4.057788], [3.978588], [3.903587], [3.832508], [3.765097], [3.701124], [3.640379], [3.58267], [3.52782], [3.475666], [3.426061], [3.378866], [3.333956], [3.291213], [3.25053], [3.211807], [3.174952], [3.139878], [3.106506], [3.074764], [3.044581], [3.015895], [2.988646], [2.96278], [2.938245], [2.914993], [2.892981], [2.872168], [2.852514], [2.833985], [2.816547], [2.800171], [2.784827], [2.77049], [2.757135], [2.74474], [2.733286], [2.722752], [2.713122], [2.704382], [2.696516], [2.689512], [2.68336], [2.67805], [2.673574], [2.669925], [2.667097], [2.665086], [2.663889], [2.663504], [2.66393], [2.665168], [2.667221], [2.67009], [2.673781], [2.6783], [2.683652], [2.689847], [2.696894], [2.704804], [2.713589], [2.723264], [2.733844], [2.745346], [2.757789], [2.771193], [2.785581], [2.800976], [2.817406], [2.834898], [2.853483], [2.873195], [2.894069], [2.916142], [2.939458], [2.964059], [2.989994], [3.017315], [3.046075], [3.076335], [3.108159], [3.141615], [3.176777], [3.213725], [3.252546], [3.293331], [3.336181], [3.381204], [3.428518], [3.478249], [3.530535], [3.585527], [3.643385], [3.704289], [3.768431], [3.836022], [3.907294], [3.934098], [3.873867], [3.816598], [3.762127], [1.53921], [3.660987], [3.614052], [3.569378], [3.526856], [3.486386], [3.447871], [3.411226], [3.37637], [3.343227], [3.311727], [3.281805], [3.253402], [3.22646], [3.200928], [3.176757], [3.153901], [3.13232], [3.111973], [3.092825], [3.074842], [3.057993], [3.04225], [3.027585], [3.013975], [3.001396], [2.989829], [2.979255], [2.969657], [2.961019], [2.953329], [2.946574], [2.940743], [2.935828], [2.931821], [2.928715], [2.926507], [2.925192], [2.924769], [2.925237], [2.926597], [2.928851], [2.932002], [2.936055], [2.941017], [2.946894], [2.953696], [2.961435], [2.97012], [2.979768], [2.990392], [3.002009], [3.01464], [3.028303], [3.043022], [3.058821], [3.075727], [3.093768], [3.112976], [3.133384], [3.155029], [3.177951], [3.20219], [3.227792], [3.254807], [1.36321], [1.365565], [3.344867], [3.378096], [3.413041], [3.449779], [3.48839], [3.528963], [3.571591], [3.616377], [3.66343], [3.712869], [3.764824], [3.819434], [3.876849], [3.937234], [4.000769], [4.067646], [4.13808], [4.212301], [4.290565], [4.373149], [4.419202], [4.35387], [4.291731], [4.232612], [4.176354], [4.122811], [4.071849], [4.023341], [3.977173], [3.933237], [3.891434], [3.851671], [3.813862], [3.777927], [3.743794], [3.711392], [3.680657], [3.651531], [3.623957], [3.597884], [3.573265], [3.550054], [3.52821], [3.507696], [3.488475], [3.470515], [3.453786], [3.43826], [3.423911], [3.410715], [3.398653], [3.387703], [3.37785], [3.369077], [3.361371], [3.354719], [3.349112], [3.344541], [3.340998], [3.338479], [3.336979], [3.336497], [3.337031], [3.338582], [3.341153], [3.344748], [3.349371], [3.355031], [3.361736], [3.369496], [3.378324], [3.388232], [3.399237], [3.411357], [3.42461], [3.439019], [3.454605], [3.471396], [3.489419], [3.508705], [3.529286], [3.551198], [3.574479], [3.599171], [3.625319], [3.65297], [3.682177], [3.712994], [3.745483], [3.779706], [3.815733], [3.853639], [3.893504], [3.935413], [3.97946], [4.025744], [4.074373], [4.125463], [4.17914], [4.23554], [4.294808], [4.357105], [4.422603], [4.491489], [4.507009], [4.424941], [4.34711], [4.273248], [4.203114], [4.136483], [4.073154], [4.012939], [3.955666], [3.901176], [3.849323], [3.799973], [3.753001], [3.708292], [3.665739], [3.625244], [3.586714], [3.550064], [3.515216], [3.482095]]},
      {"name": "Robô perto do beacon 3", "G": {"x": 0.5, "y": 0.0, "theta": -1.5, "firstray": 0, "lastray": 359, "beaconpos": {"1": {"x": -0.3, "y": 1.3}, "2": {"x": 1.3, "y": 1.3}, "3": {"x": 0.5, "y": -0.3}}, "beaconcluster": {"1": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "2": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}}}, "laser": [[2.867534], [2.871525], [2.876405], [2.882181], [2.888862], [2.896458], [2.904981], [2.914445], [2.924865], [2.936258], [2.948641], [2.962035], [2.976462], [2.991946], [3.008513], [3.026192], [3.045013], [3.065009], [3.086215], [3.10867], [3.132416], [3.157497], [3.18396], [3.211857], [3.241243], [3.272178], [3.304726], [3.338955], [3.374939], [3.412758], [1.384376], [1.400334], [3.538117], [3.584204], [3.632629], [3.683518], [3.737007], [3.793246], [3.852394], [3.914627], [3.980136], [4.04913], [4.121835], [4.198501], [4.279402], [4.364837], [4.455138], [4.487345], [4.425599], [4.366842], [4.31092], [4.257692], [4.20703], [4.15881], [4.112922], [4.069262], [4.027732], [3.988245], [3.950716], [3.915068], [3.881229], [3.849133], [3.818717], [3.789923], [3.762698], [3.736991], [3.712757], [3.689951], [3.668535], [3.648471], [3.629724], [3.612264], [3.596062], [3.58109], [3.567324], [3.554742], [3.543325], [3.533053], [3.523911], [3.515884], [3.50896], [3.503129], [3.49838], [3.494708], [3.492106], [3.49057], [3.490098], [3.49069], [3.492346], [3.495068], [3.498861], [3.503731], [3.509686], [3.516733], [3.524885], [3.534153], [3.544553], [3.556101], [3.568815], [3.582716], [3.597825], [3.614168], [3.631771], [3.650665], [3.670879], [3.69245], [3.715415], [3.739813], [3.765688], [3.793088], [3.822061], [3.852664], [3.884953], [3.918992], [3.954848], [3.992594], [4.032307], [4.074072], [4.117979], [4.164124], [4.212613], [4.263559], [4.317083], [4.373317], [4.432403], [4.494496], [4.559762], [4.628381], [4.687017], [4.598756], [4.515108], [4.435776], [4.360488], [4.288999], [4.22108], [4.156526], [4.095145], [4.036762], [3.981216], [3.928358], [3.878052], [3.830169], [3.784593], [3.741216], [3.699935], [3.660659], [3.6233], [3.587777], [3.554017], [3.521948], [3.491507], [3.462634], [3.435272], [3.409369], [3.384878], [3.361753], [3.339951], [3.319436], [3.30017], [3.28212], [3.265256], [3.24955], [3.234974], [3.221505], [3.209122], [3.197804], [3.187532], [3.178292], [3.170068], [3.162847], [3.156619], [3.151373], [3.147101], [3.143798], [3.141457], [0.429125], [0.422043], [0.419838], [0.420605], [0.424843], [3.147534], [3.151915], [3.157271], [3.163611], [3.170944], [3.179282], [3.188638], [3.199026], [3.210463], [3.222968], [3.23656], [3.251262], [3.267098], [3.284094], [3.302279], [3.321684], [3.342343], [3.364291], [3.387568], [3.412216], [3.438281], [3.46581], [3.494857], [3.525479], [3.557734], [3.59169], [3.627416], [3.664987], [3.704484], [3.745996], [3.789616], [3.835446], [3.883596], [3.934183], [3.987337], [3.983441], [3.900148], [3.821408], [3.746902], [3.676345], [3.609475], [3.546055], [3.485868], [3.428718], [3.374422], [3.322816], [3.273747], [3.227074], [3.18267], [3.140414], [3.100198], [3.06192], [3.025485], [2.990808], [2.957808], [2.92641], [2.896544], [2.868146], [2.841157], [2.815521], [2.791186], [2.768104], [2.74623], [2.725523], [2.705944], [2.687457], [2.670029], [2.653628], [2.638227], [2.623798], [2.610316], [2.59776], [2.586108], [2.575341], [2.565441], [2.556393], [2.548182], [2.540795], [2.534221], [2.528448], [2.523469], [2.519275], [2.51586], [2.513219], [2.511348], [2.510244], [2.509904], [2.51033], [2.511521], [2.513478], [2.516206], [2.519709], [2.52399], [2.529059], [2.534921], [2.541586], [2.549066], [2.55737], [2.566514], [2.57651], [2.587376], [2.599129], [2.611788], [2.625376], [2.639913], [2.655426], [2.671941], [2.689487], [2.708095], [2.727799], [2.748636], [2.770643], [2.793864], [2.818343], [2.844129], [2.871274], [2.899834], [2.929869], [2.961444], [2.99463], [3.029501], [3.066138], [3.10463], [3.145071], [3.187563], [3.232217], [3.279153], [3.328501], [3.380402], [3.43501], [3.492494], [3.553034], [3.616832], [3.684105], [3.755094], [3.786767], [3.730847], [3.677657], [3.627053], [3.578897], [3.533066], [1.39506], [3.447922], [3.408403], [3.370795], [3.335012], [3.300976], [3.268614], [3.237857], [3.208641], [3.180908], [3.154603], [3.129675], [3.106077], [3.083764], [3.062696], [3.042834], [3.024144], [3.006592], [2.990148], [2.974784], [2.960474], [2.947195], [2.934925], [2.923643], [2.913332], [2.903974], [2.895556], [2.888063], [2.881485], [2.875811], [2.871031], [2.86714], [2.86413], [2.861997], [2.860739], [2.860352], [2.860837], [2.862194], [2.864425]]},
      {"name": "Robô longe, orientação negativa", "G": {"x": 1.2, "y": 0.8, "theta": -2.2, "firstray": 0, "lastray": 359, "beaconpos": {"1": {"x": -0.3, "y": 1.3}, "2": {"x": 1.3, "y": 1.3}, "3": {"x": 0.5, "y": -0.3}}, "beaconcluster": {"1": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "2": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}}}, "laser": [[2.581101], [2.549106], [2.518653], [2.489668], [2.462085], [2.435839], [2.410874], [2.387135], [2.364573], [2.34314], [2.322793], [2.303492], [2.2852], [2.267881], [2.251504], [2.236037], [2.221454], [2.207728], [2.194835], [2.182752], [2.17146], [2.160939], [2.151171], [2.142141], [2.133833], [2.126235], [2.119335], [2.11312], [2.107582], [2.102711], [2.098501], [0.375574], [0.36963], [0.367426], [0.367549], [0.370055], [0.376735], [2.087097], [2.088019], [2.089578], [2.091778], [2.09462], [2.098111], [2.102254], [2.107057], [2.112528], [2.118673], [2.125504], [2.133031], [2.141265], [2.150222], [2.159914], [2.170358], [2.181571], [2.193572], [2.206382], [2.220023], [2.234518], [2.249894], [2.266178], [2.2834], [2.301592], [2.320788], [2.341027], [2.362348], [2.384794], [2.408411], [2.43325], [2.459363], [2.486808], [2.515647], [2.545948], [2.577783], [2.611229], [2.646371], [2.683301], [2.722117], [2.762926], [2.805845], [2.851001], [2.898532], [2.948587], [3.001332], [3.056946], [3.115628], [3.177593], [3.243081], [3.312355], [3.385708], [3.463461], [3.545975], [3.633651], [3.726936], [3.826334], [3.932409], [4.045801], [4.167234], [4.297531], [4.437634], [4.588626], [4.751752], [4.727048], [4.68951], [4.653969], [4.620361], [4.588622], [4.558695], [4.530527], [4.504069], [4.479274], [4.456101], [4.43451], [1.611064], [1.624397], [4.378887], [4.363295], [4.349133], [4.33638], [4.325015], [4.315021], [4.306381], [4.299083], [4.293115], [4.288468], [4.285135], [4.28311], [4.282392], [4.282978], [4.28487], [4.28807], [4.292583], [4.298417], [4.30558], [4.314083], [4.323939], [4.335165], [4.347776], [4.361794], [4.377239], [4.394138], [4.412518], [4.432407], [4.453839], [4.47685], [4.501479], [4.527766], [4.555758], [4.585505], [4.617057], [4.650474], [4.685815], [4.723147], [4.762541], [4.804074], [4.847827], [4.893889], [4.942354], [4.993326], [5.046913], [5.103233], [5.162416], [5.224597], [5.289925], [5.358561], [5.430678], [5.506462], [5.586117], [5.669862], [5.757938], [5.743282], [5.638428], [5.538991], [5.44463], [5.355034], [5.269918], [5.189022], [5.112105], [5.038948], [4.969347], [4.903116], [4.840083], [4.780087], [4.722981], [1.42446], [1.438347], [4.567689], [4.520874], [4.476359], [4.43405], [4.393859], [4.355704], [4.319511], [4.28521], [4.252734], [4.222022], [4.19302], [4.165673], [4.139934], [4.115756], [4.093099], [4.071924], [4.052195], [4.033878], [4.016945], [4.001367], [3.987119], [3.974179], [3.962525], [3.95214], [3.943007], [3.935112], [3.928443], [3.922989], [3.918743], [3.915697], [3.913848], [3.913191], [3.913727], [3.915455], [3.91838], [3.922504], [3.927835], [3.93438], [3.94215], [3.951157], [3.961414], [3.972938], [3.985747], [3.999861], [4.015303], [4.032098], [4.050273], [4.069857], [4.090885], [4.11339], [4.137411], [4.16299], [4.190171], [4.219004], [4.249539], [4.231318], [4.071942], [3.925289], [3.789946], [3.664705], [3.548522], [3.440496], [3.339839], [3.245866], [3.157972], [3.075625], [2.998353], [2.925738], [2.857407], [2.793026], [2.732297], [2.674949], [2.620742], [2.569455], [2.520889], [2.474866], [2.43122], [2.389802], [2.350476], [2.313116], [2.277609], [2.243848], [2.211737], [2.181187], [2.152117], [2.12445], [2.098116], [2.07305], [2.049194], [2.02649], [2.004888], [1.98434], [1.964801], [1.94623], [1.928589], [1.911842], [1.895956], [1.8809], [1.866645], [1.853165], [1.840435], [1.828432], [1.817134], [1.806522], [1.796577], [1.787283], [1.778623], [1.770584], [1.763151], [1.756313], [1.75006], [1.74438], [1.739265], [1.734706], [1.730698], [1.727232], [1.724305], [1.721911], [1.720047], [1.718711], [1.717899], [1.717611], [1.717846], [1.718604], [1.719888], [1.721698], [1.724038], [1.726911], [1.730321], [1.734275], [1.738777], [1.743835], [1.749458], [1.755653], [1.762431], [1.769802], [1.77778], [1.786376], [1.795605], [1.805483], [1.816027], [1.827254], [1.839185], [1.85184], [1.865243], [1.879418], [1.894392], [1.910192], [1.92685], [1.944399], [1.962874], [1.982313], [2.002757], [2.02425], [2.046839], [2.070576], [2.095517], [2.121719], [2.149248], [2.178173], [2.208569], [2.240517], [2.274106], [2.309432], [2.346599], [2.38572], [2.42692], [2.470333], [2.516108], [2.564408], [2.61541], [2.669312], [2.687151], [2.650034], [2.614715]]}
    ],
    rules: [{re: /mgetv/, msg: "As distâncias do laser lêem-se da matriz <code>LaserValues</code> com <code>Mgetv(LaserValues, i, 0)</code>.", level: "error"}, {re: /0\.1/, msg: "O critério de associação é o ponto estar a menos de <b>0.1 m</b> de um beacon conhecido.", level: "error"}, {re: /0\.02/, msg: "Falta somar <b>0.02 m</b> à distância lida: o laser vê a superfície do poste, mas o que interessa ao filtro é o <b>centro</b>. Sem isso o centróide fica 2 cm curto em cada ponto.", level: "error"}],
    signalHints: {"G.beaconcluster": "Se o <code>n</code> está certo mas o centroide não, o problema é a média. O professor usa a forma <b>incremental</b>: <code>BeaconCluster[j].x := ((BeaconCluster[j].x * (n-1)) + MeasurePos.x)/n;</code> — repara que o <code>n</code> já foi incrementado antes. Se o <code>n</code> está a zero, ou não limpaste os clusters no início, ou o critério dos 0.1 m está errado."},
    hints: ["Três ciclos encaixados: limpar os clusters, percorrer os raios, e para cada ponto percorrer os beacons conhecidos.", "A distância a usar é <code>Mgetv(LaserValues, i, 0) + 0.02</code>, e só interessa se for maior que zero.", "A associação é por proximidade ao beacon <b>conhecido</b>: <code>if Dist(BeaconPos[j].x - MeasurePos.x, BeaconPos[j].y - MeasurePos.y) < 0.1</code>.", "Incrementa <code>n</code> <b>primeiro</b> e só depois atualiza a média incremental — a fórmula do professor assume essa ordem."]
  },
  "tuning": {
    id: "tuning",
    title: "Sintonia de <code>Q</code> e <code>R</code> — o filtro tem de convergir",
    entry: "runsim",
    signature: "procedure SetupNoise;",
    starter: `procedure SetupNoise;
var qV, qOmega, rSensD, rSensA: double;
begin
  // Q (2x2) : incerteza do modelo de movimento, no espaco [v ; omega]
  // R (2x2) : incerteza das medidas, no espaco [distancia ; angulo]
  // As constantes lin_stddev, omega_stddev, sensD_stddev e sensA_stddev
  // estao declaradas no topo do ficheiro. Sao DESVIOS PADRAO.
  qV     := ;
  qOmega := ;
  rSensD := ;
  rSensA := ;

  Q := Mzeros(2,2);

  R := Mzeros(2,2);
end;`,
    prelude: `const
  ToMetres  = 0.0007277;
  WheelDist = 0.198;
  NBEACONS  = 3;
  NBEAMS2   = 180;
  dt        = 0.04;
  lin_stddev   = 1E-2;
  omega_stddev = 1E-2;
  sensD_stddev = 0.005;
  sensA_stddev = 0.009;
var
  x, y, theta, vlin, omega: double;
  truex, truey, truetheta: double;
  errsum, errmax, erro_medio, erro_max: double;
  nerr, irobot, iLaser, firstRay, lastRay: integer;
  XR, P, Q, R, grad_f_X, grad_f_q, grad_h_x: Matrix;
  LaserValues: Matrix;
  LogOn: boolean;

procedure EKF_MotionModel;
begin
  //Update XR
  SetRCValue(33,1, format('%.4g', [x]));
  SetRCValue(34,1, format('%.4g', [y]));
  SetRCValue(35,1, format('%.4g', [theta]));
  XR := RangeToMatrix(33,1, 3,1);

  //Update df/dX
  SetRCValue(42,3, format('%.4g', [-vlin*dt*sin(theta + 0.5*omega*dt)]));
  SetRCValue(43,3, format('%.4g', [vlin*dt*cos(theta + 0.5*omega*dt)]));
  grad_f_X := RangeToMatrix(42,1, 3,3);

  //Update df/dq
  SetRCValue(42,5, format('%.4g', [cos(theta + 0.5*omega*dt)]));
  SetRCValue(42,6, format('%.4g', [-0.5*vlin*dt*sin(theta + 0.5*omega*dt)]));
  SetRCValue(43,5, format('%.4g', [sin(theta + 0.5*omega*dt)]));
  SetRCValue(43,6, format('%.4g', [0.5*vlin*dt*cos(theta + 0.5*omega*dt)]));
  grad_f_q := RangeToMatrix(42,5, 3,2);

  //Covariance propagation
  P := MMult(grad_f_X, P);
  P := MMult(P, Mtran(grad_f_X));
  P := Madd(P, MMult(grad_f_q, MMult(Q, Mtran(grad_f_q))));
  MatrixToRange(33, 5, P);
end;
procedure EKF_Update(nBeacon: integer);
var Z, Z_E, Kf: Matrix;
    //sensD, sensTheta, obsAng, obsDist, dw, a, b, dOdD: double;
    dBeacon: double;
    txt: string;
begin
  //dh/dX
  dBeacon := Dist(BeaconPos[nBeacon].x - x, BeaconPos[nBeacon].y - y);
  SetRCValue(47,1, format('%.4g', [-(BeaconPos[nBeacon].x - x)/dBeacon]));
  SetRCValue(48,1, format('%.4g', [(BeaconPos[nBeacon].y - y)/Power(dBeacon,2)]));
  SetRCValue(47,2, format('%.4g', [-(BeaconPos[nBeacon].y - y)/dBeacon]));
  SetRCValue(48,2, format('%.4g', [-(BeaconPos[nBeacon].x - x)/Power(dBeacon,2)]));
  SetRCValue(47,3, format('%d', [0]));
  SetRCValue(48,3, format('%d', [-1]));
  grad_h_x := RangeToMatrix(47,1, 2,3);

  //compute kalman gain
  Kf := MMult(grad_h_X, P);
  Kf := MMult(Kf, Mtran(grad_h_X));
  Kf := Madd(Kf, R);
  Kf := Minv(Kf);
  Kf := MMult(Mtran(grad_h_X), Kf);
  Kf := MMult(P, Kf);
  MatrixToRange(51,5, Kf);

  //covariance matrix update
  P := MMult( Msub( Meye(3), MMult(Kf, grad_h_X) ), P );
  MatrixToRange(33, 5, P);
    
  //update state variables
  //Matrix Z (measures from sensor)
  SetRCValue(51,1, format('%.4g', [BeaconCluster[nBeacon].dist]));
  SetRCValue(52,1, format('%.4g', [BeaconCluster[nBeacon].ang]));
  Z := RangeToMatrix(51,1, 2,1);
    
  //Matrix Z_E  (measures from sensor - expected measures)
  SetRCValue(51,3, format('%.4g', [BeaconCluster[nBeacon].dist - dBeacon]));
  SetRCValue(52,3, format('%.4g', [NormalizeAngle(BeaconCluster[nBeacon].ang - NormalizeAngle(Atan2(BeaconPos[nBeacon].y-y, BeaconPos[nBeacon].x-x) - theta))]));
  Z_E := RangeToMatrix(51,3, 2,1);

  //Matrix X
  XR := Madd(XR, MMult (Kf, Z_E));
  MatrixToRange(33,1, XR);

  //Update X and Theta
  x := GetRCValue(33,1);
  y := GetRCValue(34,1);
  theta := NormalizeAngle(GetRCValue(35,1));
  SetRCValue(35,1, format('%.4g', [theta]));

  if LogOn then begin
    // x y theta enc1 enc2 Laser
    txt := format('%d; %g; %g;  %g; %g; %g; %g; %g; %g; %g; %g', [nBeacon, dBeacon, NormalizeAngle(Atan2(BeaconPos[nBeacon].y-y, BeaconPos[nBeacon].x-x) - theta), BeaconCluster[nBeacon].dist, BeaconCluster[nBeacon].ang, x, y, theta, GetRobotX(0), GetRobotY(0), GetRobotTheta(0)]);
    log.add(txt);
  end;

end;

procedure SimStep(vt, wt: double);
begin
  truetheta := NormalizeAngle(truetheta + wt*dt);
  truex := truex + vt*dt*cos(truetheta - 0.5*wt*dt);
  truey := truey + vt*dt*sin(truetheta - 0.5*wt*dt);
end;

procedure MakeMeasurements;
var j: integer;
    dd, aa: double;
begin
  for j:=1 to NBEACONS do begin
    dd := Dist(BeaconPos[j].x - truex, BeaconPos[j].y - truey);
    aa := NormalizeAngle(ATan2(BeaconPos[j].y - truey, BeaconPos[j].x - truex) - truetheta);
    BeaconCluster[j].n := 1;
    BeaconCluster[j].dist := dd + RandG(0, sensD_stddev);
    BeaconCluster[j].ang  := NormalizeAngle(aa + RandG(0, sensA_stddev));
  end;
end;

procedure RunSim;
var i, j: integer;
    vt, wt, e: double;
begin
  SetupNoise;
  truex := 0.5; truey := 0.5; truetheta := 0;
  x := 0.85; y := 0.20; theta := 0.25;
  P := Mzeros(3,3);
  Msetv(P,0,0,0.1); Msetv(P,1,1,0.1); Msetv(P,2,2,0.05);
  XR := Mzeros(3,1);
  errsum := 0; errmax := 0; nerr := 0;
  for i := 1 to 300 do begin
    vt := 0.20;
    wt := 0.30;
    SimStep(vt, wt);
    vlin  := vt + RandG(0, lin_stddev);
    omega := wt + RandG(0, omega_stddev);
    x := x + vlin*dt*cos(theta + 0.5*omega*dt);
    y := y + vlin*dt*sin(theta + 0.5*omega*dt);
    theta := NormalizeAngle(theta + omega*dt);
    EKF_MotionModel;
    MakeMeasurements;
    for j := 1 to NBEACONS do EKF_Update(j);
    e := Dist(truex - x, truey - y);
    if i > 200 then begin
      errsum := errsum + e;
      nerr := nerr + 1;
      if e > errmax then errmax := e;
    end;
  end;
  erro_medio := errsum/nerr;
  erro_max := errmax;
end;
`,
    solution: `procedure SetupNoise;
var qV, qOmega, rSensD, rSensA: double;
begin
  qV     := Power(lin_stddev,2);
  qOmega := Power(omega_stddev,2);
  rSensD := Power(sensD_stddev,2);
  rSensA := Power(sensA_stddev,2);
  Q := Mzeros(2,2);
  Msetv(Q,0,0,qV);
  Msetv(Q,1,1,qOmega);
  R := Mzeros(2,2);
  Msetv(R,0,0,rSensD);
  Msetv(R,1,1,rSensA);
end;`,
    globals: ["x", "y", "theta", "vlin", "omega"],
    captureG: ["erro_medio", "erro_max"],
    sheet0: {"42,1": "1", "42,2": "0", "42,3": "0", "43,1": "0", "43,2": "1", "43,3": "0", "44,1": "0", "44,2": "0", "44,3": "1", "42,5": "0", "42,6": "0", "43,5": "0", "43,6": "0", "44,5": "0", "44,6": "1", "47,1": "0", "47,2": "0", "47,3": "0", "48,1": "0", "48,2": "0", "48,3": "-1"},
    G0: {"beaconpos": {"1": {"x": -0.3, "y": 1.3}, "2": {"x": 1.3, "y": 1.3}, "3": {"x": 0.5, "y": -0.3}}, "beaconcluster": {"1": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "2": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}, "3": {"x": 0.0, "y": 0.0, "n": 0, "dist": 0.0, "ang": 0.0}}, "logon": false},
    tol: 1e-06,
    tests: [
      {kind: "assert", name: "Q e R bem formadas (2x2, diagonal positiva)", check: function(cap, b){
               var Q = b.G.q, R = b.G.r;
               if(!Q || Q.r!==2 || Q.c!==2) return "Q tem de ser uma matriz 2x2 (espaco [v ; omega]).";
               if(!R || R.r!==2 || R.c!==2) return "R tem de ser uma matriz 2x2 (espaco [distancia ; angulo]).";
               if(!(Q.d[0]>0 && Q.d[3]>0)) return "A diagonal de Q tem de ser positiva — sao variancias.";
               if(!(R.d[0]>0 && R.d[3]>0)) return "A diagonal de R tem de ser positiva — sao variancias.";
               return true;
             }},
      {kind: "assert", name: "Variâncias, não desvios padrão", check: function(cap, b){
               var R = b.G.r;
               if(R.d[0] > 0.001) return "R(1,1) = " + R.d[0].toExponential(2) +
                 " e grande de mais para uma variancia: o desvio padrao da distancia e 0.005 m, "+
                 "portanto a variancia anda pelos 2.5e-5. Nao te esquecas de elevar ao quadrado.";
               return true;
             }},
      {kind: "assert", name: "O filtro converge (erro médio nas últimas 100 iterações < 4 cm)", check: function(cap){
               if(!(cap.erro_medio < 0.04))
                 return "erro medio final = " + cap.erro_medio.toFixed(4) + " m (limite 0.040 m). " +
                        "Com este Q e R a estimativa nao acompanha o robo.";
               return true;
             }},
      {kind: "assert", name: "Não diverge (erro máximo < 12 cm)", check: function(cap){
               if(!(cap.erro_max < 0.12))
                 return "erro maximo = " + cap.erro_max.toFixed(4) + " m (limite 0.120 m).";
               return true;
             }}
    ],
    rules: [{re: /procedure\s+setupnoise/, msg: "Mantém o nome e a assinatura: <code>procedure SetupNoise;</code>.", level: "error"}, {re: /power\s*\(|\bsqr\b|\*\s*lin_stddev/, msg: "As entradas de Q e R são <b>variâncias</b> — o quadrado dos desvios padrão declarados no topo.", level: "error"}, {re: /msetv/, msg: "Preenche as matrizes com <code>Mzeros(2,2)</code> e depois <code>Msetv</code> nas entradas da diagonal.", level: "warn"}],
    signalHints: {},
    hints: ["Ao contrário das outras sub-tarefas, aqui não se compara com o professor: corre-se o filtro 300 ciclos e mede-se se ele acompanha o robô.", "As constantes já lá estão: <code>lin_stddev</code>, <code>omega_stddev</code>, <code>sensD_stddev</code>, <code>sensA_stddev</code>. São desvios padrão — Q e R querem <b>variâncias</b>.", "Q é diagonal 2x2 no espaço dos controlos [v ; omega]; R é diagonal 2x2 no espaço das medidas [distância ; ângulo].", "Solução do professor: <code>qV := Power(lin_stddev,2);</code> e análogos, depois <code>Q := Mzeros(2,2); Msetv(Q,0,0,qV); Msetv(Q,1,1,qOmega);</code> e o mesmo para R."]
  }
};
