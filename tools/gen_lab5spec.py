#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera js/data/lab5spec.js (Labwork 5 — EKF com beacons detetados por laser, SimTwo).

Os fragmentos de referência vêm de
  Lab_5/SimTwo64_LabWork__5_EKF.zip -> EKF_Beacon_Laser_Sol/NXTControl.spas
guardado em tools/lab5_solution/. O gerador VERIFICA que cada fragmento existe
mesmo nesse ficheiro antes de escrever.
"""
import json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SOL = os.path.join(HERE, "lab5_solution", "NXTControl.spas")
OUT = os.path.join(HERE, "..", "js", "data", "lab5spec.js")

with open(SOL, encoding="latin1") as f:
    SRC = f.read()


def squash(t):
    t = re.sub(r"//[^\n]*", "", t)
    return re.sub(r"\s+", "", t).lower()


def check(fragment, label):
    if squash(fragment) not in squash(SRC):
        sys.exit("FRAGMENTO NÃO ENCONTRADO na solução do professor: " + label)


def grab(name):
    """Extrai uma rotina completa do .spas pela contagem de begin/end."""
    m = re.search(r"(?im)^\s*(procedure|function)\s+" + name + r"\b", SRC)
    if not m:
        sys.exit("rotina não encontrada: " + name)
    i = m.start()
    depth = 0
    for m2 in re.finditer(r"(?i)\b(begin|case|record|end)\b", SRC[i:]):
        w = m2.group(1).lower()
        if w == "end":
            depth -= 1
            if depth == 0:
                return SRC[i:i + m2.end()].strip() + ";"
        else:
            depth += 1
    sys.exit("não consegui delimitar: " + name)


def jstr(s):
    return "`" + s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${") + "`"


# ===========================================================================
#  Contexto comum
# ===========================================================================
CONSTS = """const
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
"""

BEACONS = {
    1: (-0.3, 1.3),
    2: (1.3, 1.3),
    3: (0.5, -0.3),
}

R_PREDICT = grab("predictPosition")
R_MOTION = grab("EKF_MotionModel")
R_UPDATE = grab("EKF_Update")

# fragmentos do ciclo de associação (estão dentro do procedure Control)
F_L2W = """  px := MeasureDist*cos((i-NBEAMS2)*pi()/NBEAMS2 + theta) + x - 0.14*cos(theta);
  py := MeasureDist*sin((i-NBEAMS2)*pi()/NBEAMS2 + theta) + y - 0.14*sin(theta);"""
check("MeasurePos.x := MeasureDist*cos((i-NBEAMS2)*pi()/NBEAMS2 + theta) + x - 0.14*cos(theta)", "laser->mundo x")
check("MeasurePos.y := MeasureDist*sin((i-NBEAMS2)*pi()/NBEAMS2 + theta) + y - 0.14*sin(theta)", "laser->mundo y")

R_L2W = """procedure LaserPointToWorld(MeasureDist: double; i: integer; var px, py: double);
begin
""" + F_L2W + """
end;"""

check("BeaconCluster[j].dist := Dist(BeaconCluster[j].x - x, BeaconCluster[j].y - y)", "cluster dist")
check("BeaconCluster[j].ang := NormalizeAngle(ATan2(BeaconCluster[j].y - y, BeaconCluster[j].x - x) - theta)", "cluster ang")

R_CLUSTER = """procedure ClusterMeasure(j: integer);
begin
  BeaconCluster[j].dist := Dist(BeaconCluster[j].x - x, BeaconCluster[j].y - y);
  BeaconCluster[j].ang := NormalizeAngle(ATan2(BeaconCluster[j].y - y, BeaconCluster[j].x - x) - theta);
end;"""

check("""if Dist(BeaconPos[j].x - MeasurePos.x, BeaconPos[j].y - MeasurePos.y) < 0.1 then begin
          BeaconCluster[j].n := BeaconCluster[j].n + 1;""".replace("\n          ", "\n"), "associação (limiar + contagem)")
check("BeaconCluster[j].x := ((BeaconCluster[j].x * (BeaconCluster[j].n - 1)) + MeasurePos.x)/BeaconCluster[j].n", "média incremental")

R_ASSOC = """procedure AssociateBeacons;
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
end;"""

R_TUNING = """procedure SetupNoise;
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
end;"""
check("qV := Power(lin_stddev,2);", "qV")
check("rSensA := Power(sensA_stddev,2);", "rSensA")

# harness de simulação para a tarefa de sintonia
SIM_HARNESS = """
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
"""

# células que a Initialize deixa preparadas (Meye(3) em df/dX, 1 em df/dq(3,2), -1 em dh/dX(2,3))
SHEET0 = {}
for i in range(3):
    for j in range(3):
        SHEET0["%d,%d" % (42 + i, 1 + j)] = "1" if i == j else "0"
for i in range(3):
    for j in range(2):
        SHEET0["%d,%d" % (42 + i, 5 + j)] = "0"
SHEET0["44,6"] = "1"
for i in range(2):
    for j in range(3):
        SHEET0["%d,%d" % (47 + i, 1 + j)] = "0"
SHEET0["48,3"] = "-1"


def beacon_js():
    return {str(k): {"x": v[0], "y": v[1]} for k, v in BEACONS.items()}


def cluster_js(vals):
    """vals: {j: (x, y, n)}"""
    out = {}
    for j in range(1, 4):
        x, y, n = vals.get(j, (0.0, 0.0, 0))
        out[str(j)] = {"x": x, "y": y, "n": n, "dist": 0.0, "ang": 0.0}
    return out


def mat(rows):
    return {"__mat": rows}


# ===========================================================================
#  Simulação de um varrimento laser (para a tarefa de associação)
# ===========================================================================
def laser_scan(px, py, th, rb=0.02, box=3.0):
    """360 raios a partir da origem do laser (0.14 m atrás do robô)."""
    lx = px - 0.14 * math.cos(th)
    ly = py - 0.14 * math.sin(th)
    rows = []
    for i in range(360):
        a = (i - 180) * math.pi / 180.0 + th
        dx, dy = math.cos(a), math.sin(a)
        best = None
        # paredes (caixa centrada na origem)
        for lim, comp, d in ((box, lx, dx), (-box, lx, dx), (box, ly, dy), (-box, ly, dy)):
            if abs(d) > 1e-9:
                t = (lim - comp) / d
                if t > 0 and (best is None or t < best):
                    best = t
        # beacons (círculos)
        for (bx, by) in BEACONS.values():
            ox, oy = lx - bx, ly - by
            b = 2 * (ox * dx + oy * dy)
            c = ox * ox + oy * oy - rb * rb
            disc = b * b - 4 * c
            if disc < 0:
                continue
            sq = math.sqrt(disc)
            for t in ((-b - sq) / 2, (-b + sq) / 2):
                if t > 0 and (best is None or t < best):
                    best = t
        rows.append([round(best, 6) if best else 0.0])
    return rows


# ===========================================================================
#  Tarefas
# ===========================================================================
TASKS = []


def T(**kw):
    TASKS.append(kw)


T(
    id="predict",
    title="Odometria do robô diferencial — <code>predictPosition</code>",
    entry="predictposition",
    prelude=CONSTS,
    solution=R_PREDICT,
    globals=["x", "y", "theta"],
    watch=["x", "y", "theta"],
    signature="procedure predictPosition(odo1, odo2: double);",
    starter="""procedure predictPosition(odo1, odo2: double);
var d, delta_theta: double;
begin
  // odo1 e odo2 sao os impulsos de cada roda desde o ciclo anterior.
  // ToMetres converte impulsos em metros; WheelDist e a distancia entre rodas.
  d := ;
  delta_theta := ;

  x := ;
  y := ;
  theta := ;
end;""",
    tests=[
        dict(name="Andamento em frente", G=dict(x=0.0, y=0.0, theta=0.0), args=[500, 500], repeat=3),
        dict(name="Rotação no lugar", G=dict(x=0.5, y=0.5, theta=0.0), args=[-300, 300], repeat=4),
        dict(name="Curva à esquerda", G=dict(x=0.2, y=-0.1, theta=0.4), args=[400, 700], repeat=5),
        dict(name="Marcha-atrás", G=dict(x=1.0, y=1.0, theta=1.2), args=[-600, -600], repeat=2),
        dict(name="Passagem por ±π", G=dict(x=0.0, y=0.0, theta=3.10), args=[-2000, 2000], repeat=3),
    ],
    rules=[
        dict(level="error", re=r"tometres", msg="Os impulsos convertem-se em metros com a constante <code>ToMetres</code>."),
        dict(level="error", re=r"wheeldist", msg="A variação de orientação divide pela distância entre rodas, <code>WheelDist</code>."),
        dict(level="error", re=r"normalizeangle", msg="A orientação tem de ficar normalizada em (−π, π]."),
    ],
    signalHints={
        "G.theta": "<code>delta_theta = (odo2 − odo1)·ToMetres / WheelDist</code> — é a <b>diferença</b> entre rodas a dividir pela distância entre elas. E o resultado passa por <code>NormalizeAngle</code>.",
        "G.x": "O deslocamento do centro é a <b>média</b> das duas rodas: <code>d = (odo1+odo2)/2·ToMetres</code>. E integra-se no ângulo médio do intervalo, <code>theta + delta_theta/2</code>.",
        "G.y": "Mesma ideia da componente x, com <code>sin</code> em vez de <code>cos</code>, e o mesmo ângulo médio.",
    },
    hints=[
        "Duas grandezas a partir dos encoders: o avanço do centro do robô (média das rodas) e a rotação (diferença das rodas).",
        "<code>d := (odo1+odo2)/2.0 * ToMetres;</code> e <code>delta_theta := (odo2-odo1)*ToMetres/WheelDist;</code>",
        "Tal como na Lab 4, a posição integra-se no <b>ângulo médio</b> do intervalo: <code>theta + delta_theta/2</code>.",
        "No fim: <code>theta := NormalizeAngle(theta + delta_theta);</code>",
    ],
)

T(
    id="motionmodel",
    title="Predição do EKF — <code>EKF_MotionModel</code>",
    entry="ekf_motionmodel",
    prelude=CONSTS,
    solution=R_MOTION,
    globals=["x", "y", "theta", "vlin", "omega"],
    watch=["p", "grad_f_x", "grad_f_q", "xr"],
    sheet0=SHEET0,
    tol=1e-6, tolPct=5e-3,
    signature="procedure EKF_MotionModel;",
    starter="""procedure EKF_MotionModel;
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
end;""",
    tests=[
        dict(name="Andamento em frente",
             G=dict(x=0.5, y=0.5, theta=0.0, vlin=0.2, omega=0.0,
                    p=mat([[0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.01]]),
                    q=mat([[1e-4, 0], [0, 1e-4]]))),
        dict(name="Curva",
             G=dict(x=-0.2, y=0.9, theta=0.7, vlin=0.25, omega=0.4,
                    p=mat([[0.02, 0.005, 0], [0.005, 0.03, 0.001], [0, 0.001, 0.01]]),
                    q=mat([[1e-4, 0], [0, 1e-4]]))),
        dict(name="P com correlações fortes (apanha transposições em falta)",
             G=dict(x=1.0, y=-0.4, theta=-1.1, vlin=0.18, omega=-0.6,
                    p=mat([[0.3, 0.2, 0.1], [0.2, 0.25, -0.05], [0.1, -0.05, 0.15]]),
                    q=mat([[4e-4, 1e-4], [1e-4, 2.5e-5]]))),
        dict(name="Robô parado",
             G=dict(x=0.0, y=0.0, theta=1.5, vlin=0.0, omega=0.5,
                    p=mat([[0.05, 0, 0], [0, 0.05, 0], [0, 0, 0.02]]),
                    q=mat([[1e-4, 0], [0, 1e-4]]))),
        dict(name="Duas predições seguidas (a incerteza tem de crescer)",
             G=dict(x=0.3, y=0.3, theta=0.2, vlin=0.22, omega=0.35,
                    p=mat([[0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.01]]),
                    q=mat([[1e-4, 0], [0, 1e-4]])), repeat=3),
    ],
    rules=[
        dict(level="error", re=r"mtran", msg="A propagação de P é uma sanduíche: <code>F·P·F'</code>. Precisas do <code>Mtran</code>."),
        dict(level="error", re=r"madd", msg="Há duas parcelas a somar — usa <code>Madd</code>."),
        dict(level="error", re=r"0\.5\s*\*\s*omega\s*\*\s*dt|omega\s*\*\s*dt\s*/\s*2", msg="As derivadas avaliam-se no ângulo médio do intervalo, <code>theta + 0.5*omega*dt</code>."),
    ],
    signalHints={
        "G.grad_f_x": "Só duas entradas de <code>df/dX</code> mudam a cada ciclo — as da terceira coluna, linhas 1 e 2 (células (42,3) e (43,3)): <code>-vlin*dt*sin(theta+0.5*omega*dt)</code> e <code>vlin*dt*cos(theta+0.5*omega*dt)</code>. O resto da matriz é a identidade e já foi escrito na Initialize.",
        "G.grad_f_q": "<code>df/dq</code> é 3x2. Coluna do v: <code>[cos(a); sin(a); 0]</code>. Coluna do omega: <code>[-0.5*vlin*dt*sin(a); 0.5*vlin*dt*cos(a); 1]</code>, com <code>a = theta+0.5*omega*dt</code>. Escreve as células (42,5), (42,6), (43,5) e (43,6).",
        "G.p": "A fórmula é <code>P = F·P·F' + G·Q·G'</code>. Em SimTwo faz-se por passos: <code>P := MMult(grad_f_X, P); P := MMult(P, Mtran(grad_f_X)); P := Madd(P, MMult(grad_f_q, MMult(Q, Mtran(grad_f_q))));</code>",
        "G.xr": "<code>XR</code> lê-se das células (33,1) a (35,1) depois de lá escreveres x, y e theta.",
    },
    hints=[
        "A folha de cálculo do SimTwo é o teu «bloco de notas» das matrizes: escreves com <code>SetRCValue</code>, lês com <code>RangeToMatrix(linha, coluna, nLinhas, nColunas)</code>.",
        "A Initialize já lá deixou a identidade em df/dX e o 1 em df/dq(3,2) — só tens de reescrever as entradas que dependem do estado.",
        "As derivadas são as mesmas da Lab 4, avaliadas em <code>theta + 0.5*omega*dt</code>.",
        "Propagação em três passos com MMult/Mtran/Madd, exatamente como <code>F·P·F' + G·Q·G'</code>.",
    ],
)

T(
    id="update",
    title="Atualização do EKF — <code>EKF_Update</code>",
    entry="ekf_update",
    prelude=CONSTS,
    solution=R_UPDATE,
    globals=["x", "y", "theta"],
    watch=["p", "xr", "x", "y", "theta", "grad_h_x"],
    sheet0=SHEET0,
    tol=1e-6, tolPct=5e-3,
    signature="procedure EKF_Update(nBeacon: integer);",
    starter="""procedure EKF_Update(nBeacon: integer);
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
end;""",
    tests=[
        dict(name="Beacon 1 à frente",
             G=dict(x=0.5, y=0.5, theta=0.3,
                    p=mat([[0.02, 0.005, 0], [0.005, 0.03, 0.002], [0, 0.002, 0.01]]),
                    r=mat([[2.5e-5, 0], [0, 8.1e-5]]),
                    xr=mat([[0.5], [0.5], [0.3]]),
                    beaconpos=beacon_js(),
                    beaconcluster=cluster_js({1: (-0.29, 1.31, 6), 2: (1.28, 1.29, 4), 3: (0.51, -0.28, 5)}),
                    logon=False),
             args=[1]),
        dict(name="Beacon 2, estimativa deslocada",
             G=dict(x=0.35, y=0.62, theta=-0.4,
                    p=mat([[0.08, 0.01, 0], [0.01, 0.07, 0], [0, 0, 0.03]]),
                    r=mat([[2.5e-5, 0], [0, 8.1e-5]]),
                    xr=mat([[0.35], [0.62], [-0.4]]),
                    beaconpos=beacon_js(),
                    beaconcluster=cluster_js({1: (-0.31, 1.28, 5), 2: (1.32, 1.33, 7), 3: (0.48, -0.31, 3)}),
                    logon=False),
             args=[2]),
        dict(name="Beacon 3 atrás do robô (inovação angular a saltar ±π)",
             G=dict(x=0.5, y=0.9, theta=3.05,
                    p=mat([[0.05, 0, 0], [0, 0.05, 0], [0, 0, 0.02]]),
                    r=mat([[2.5e-5, 0], [0, 8.1e-5]]),
                    xr=mat([[0.5], [0.9], [3.05]]),
                    beaconpos=beacon_js(),
                    beaconcluster=cluster_js({1: (-0.28, 1.32, 4), 2: (1.29, 1.31, 4), 3: (0.52, -0.29, 8)}),
                    logon=False),
             args=[3]),
        dict(name="P grande — o filtro deve confiar muito na medida",
             G=dict(x=0.0, y=0.0, theta=0.0,
                    p=mat([[0.6, 0.1, 0], [0.1, 0.5, 0], [0, 0, 0.2]]),
                    r=mat([[2.5e-5, 0], [0, 8.1e-5]]),
                    xr=mat([[0.0], [0.0], [0.0]]),
                    beaconpos=beacon_js(),
                    beaconcluster=cluster_js({1: (-0.30, 1.30, 9), 2: (1.30, 1.30, 9), 3: (0.50, -0.30, 9)}),
                    logon=False),
             args=[1]),
        dict(name="Três beacons seguidos (atualizações sequenciais)",
             G=dict(x=0.55, y=0.45, theta=0.15,
                    p=mat([[0.04, 0.01, 0], [0.01, 0.04, 0], [0, 0, 0.02]]),
                    r=mat([[2.5e-5, 0], [0, 8.1e-5]]),
                    xr=mat([[0.55], [0.45], [0.15]]),
                    beaconpos=beacon_js(),
                    beaconcluster=cluster_js({1: (-0.29, 1.29, 6), 2: (1.31, 1.30, 6), 3: (0.49, -0.30, 6)}),
                    logon=False),
             args=[1], repeat=3),
    ],
    rules=[
        dict(level="error", re=r"minv", msg="O ganho de Kalman precisa de <code>Minv</code> para inverter a covariância da inovação."),
        dict(level="error", re=r"meye\s*\(\s*3\s*\)", msg="A atualização da covariância é <code>(I − Kf·H)·P</code> — em SimTwo, <code>Meye(3)</code>."),
        dict(level="error", re=r"normalizeangle", msg="A inovação angular tem de ser normalizada, senão salta 2π quando o beacon está atrás."),
        dict(level="error", re=r"power\s*\(\s*dbeacon\s*,\s*2\s*\)|dbeacon\s*\*\s*dbeacon", msg="Na linha do ângulo de <code>dh/dX</code> o denominador é a distância ao <b>quadrado</b>."),
    ],
    signalHints={
        "G.grad_h_x": "É a mesma matriz 2x3 da Lab 4, agora escrita célula a célula: (47,1) e (47,2) são <code>-(bx-x)/d</code> e <code>-(by-y)/d</code>; (48,1) e (48,2) são <code>(by-y)/d²</code> e <code>-(bx-x)/d²</code>; (47,3) é 0 e (48,3) é −1.",
        "G.p": "<code>P := MMult( Msub( Meye(3), MMult(Kf, grad_h_X) ), P );</code> — a covariância só pode diminuir com uma observação.",
        "G.xr": "A inovação vai na coluna 3: <code>Z_E</code> guarda a <b>diferença</b> medida−esperada, não a medida esperada. E a componente angular passa por <code>NormalizeAngle</code>.",
        "G.theta": "Depois de <code>XR := Madd(XR, MMult(Kf, Z_E))</code> tens de escrever XR de volta na folha e reler x, y e theta — e normalizar o theta.",
    },
    hints=[
        "A estrutura é a da Lab 4, mas as matrizes vivem na folha de cálculo: escreves as entradas com <code>SetRCValue</code> e lês o bloco com <code>RangeToMatrix</code>.",
        "Ganho, por passos: <code>Kf := MMult(grad_h_X, P); Kf := MMult(Kf, Mtran(grad_h_X)); Kf := Madd(Kf, R); Kf := Minv(Kf); Kf := MMult(Mtran(grad_h_X), Kf); Kf := MMult(P, Kf);</code>",
        "Atenção ao que o professor põe em <code>Z_E</code>: não é a medida esperada, é a <b>inovação</b> — <code>dist_medida − dBeacon</code> e o ângulo medido menos o esperado, normalizado.",
        "No fim, <code>XR := Madd(XR, MMult(Kf, Z_E)); MatrixToRange(33,1, XR);</code> e relê x, y, theta das células (33,1)..(35,1).",
    ],
)

T(
    id="laser2world",
    title="Do laser para o mundo — coordenadas de um ponto medido",
    entry="laserpointtoworld",
    prelude=CONSTS,
    solution=R_L2W,
    globals=["x", "y", "theta"],
    watchArgs=[2, 3],
    signature="procedure LaserPointToWorld(MeasureDist: double; i: integer; var px, py: double);",
    starter="""procedure LaserPointToWorld(MeasureDist: double; i: integer; var px, py: double);
begin
  // i e o indice do raio (0..359). O angulo do raio no referencial do laser
  // e (i-NBEAMS2)*pi()/NBEAMS2, com NBEAMS2 = 180.
  // O laser esta alinhado com o robo mas 0.14 m ATRAS da origem do robo.
  px := ;
  py := ;
end;""",
    tests=[
        dict(name="Raio central, robô na origem", G=dict(x=0.0, y=0.0, theta=0.0), args=[1.0, 180, 0, 0]),
        dict(name="Raio a 90°", G=dict(x=0.0, y=0.0, theta=0.0), args=[1.0, 270, 0, 0]),
        dict(name="Robô rodado", G=dict(x=0.5, y=0.5, theta=0.7), args=[1.5, 200, 0, 0]),
        dict(name="Raio para trás", G=dict(x=-0.2, y=1.0, theta=-1.2), args=[2.0, 10, 0, 0]),
        dict(name="Medida curta, robô longe da origem", G=dict(x=1.4, y=-0.8, theta=2.9), args=[0.3, 95, 0, 0]),
    ],
    rules=[
        dict(level="error", re=r"0\.14", msg="O laser está 0.14 m atrás da origem do robô — esse desvio tem de aparecer nas duas linhas."),
        dict(level="error", re=r"nbeams2", msg="O ângulo do raio calcula-se com <code>(i-NBEAMS2)*pi()/NBEAMS2</code>."),
    ],
    signalHints={
        "arg3": "Três parcelas em cada coordenada: a projeção da medida na direção do raio <b>já rodada para o mundo</b> (<code>+ theta</code>), a posição do robô, e a correção de −0.14 m na direção em que o robô aponta.",
        "arg4": "Idem para y, com <code>sin</code> em vez de <code>cos</code> nas duas parcelas que dependem de ângulos.",
    },
    hints=[
        "O raio <code>i</code> aponta, no referencial do laser, para <code>(i-NBEAMS2)*pi()/NBEAMS2</code>. Como o laser está alinhado com o robô, no mundo isso é esse ângulo <b>mais theta</b>.",
        "A origem do laser não é a origem do robô: está 0.14 m para trás, ou seja em <code>(x - 0.14*cos(theta), y - 0.14*sin(theta))</code>.",
        "Junta as duas coisas: ponto = origem do laser + distância medida na direção do raio.",
    ],
)

T(
    id="clustermeasure",
    title="Do cluster para a medida — distância e ângulo ao beacon",
    entry="clustermeasure",
    prelude=CONSTS,
    solution=R_CLUSTER,
    globals=["x", "y", "theta"],
    watch=["beaconcluster"],
    signature="procedure ClusterMeasure(j: integer);",
    starter="""procedure ClusterMeasure(j: integer);
begin
  // BeaconCluster[j].x e .y ja tem o centroide dos pontos do laser (no MUNDO).
  // Converte para o par (distancia, angulo) que o EKF espera.
  BeaconCluster[j].dist := ;
  BeaconCluster[j].ang  := ;
end;""",
    tests=[
        dict(name="Beacon à frente",
             G=dict(x=0.5, y=0.5, theta=0.0, beaconcluster=cluster_js({1: (-0.29, 1.31, 6)})), args=[1]),
        dict(name="Beacon atrás (obriga a normalizar)",
             G=dict(x=0.5, y=0.5, theta=3.0, beaconcluster=cluster_js({1: (-0.29, 1.31, 6)})), args=[1]),
        dict(name="Robô rodado, beacon 2",
             G=dict(x=0.1, y=0.2, theta=-2.4, beaconcluster=cluster_js({2: (1.28, 1.29, 4)})), args=[2]),
        dict(name="Beacon 3 quase em cima do robô",
             G=dict(x=0.45, y=-0.25, theta=1.0, beaconcluster=cluster_js({3: (0.51, -0.28, 9)})), args=[3]),
    ],
    rules=[
        dict(level="error", re=r"normalizeangle", msg="O ângulo é relativo ao robô e tem de ficar em (−π, π] — usa <code>NormalizeAngle</code>."),
        dict(level="error", re=r"atan2", msg="O ângulo obtém-se com <code>ATan2</code> sobre a diferença de coordenadas."),
    ],
    signalHints={
        "G.beaconcluster": "<code>dist</code> é a distância do robô ao centroide: <code>Dist(cluster.x - x, cluster.y - y)</code>. <code>ang</code> é o ângulo <b>no referencial do robô</b>: <code>NormalizeAngle(ATan2(cluster.y - y, cluster.x - x) - theta)</code>. Repara que se usa a pose <b>estimada</b> (x, y, theta) — é a única que o robô conhece.",
    },
    hints=[
        "É a conversão de cartesianas para polares, com a origem no robô.",
        "Cuidado: o ângulo tem de ser relativo à orientação do robô, portanto subtrai <code>theta</code>.",
        "E normaliza — senão, com o beacon atrás do robô, sai um valor fora de (−π, π] e a inovação do EKF explode.",
    ],
)

# --- cenários de laser para a tarefa de associação -------------------------
SCEN = [
    ("Robô no centro, três beacons à vista", 0.5, 0.5, 0.0),
    ("Robô rodado", 0.4, 0.2, 1.1),
    ("Robô perto do beacon 3", 0.5, 0.0, -1.5),
    ("Robô longe, orientação negativa", 1.2, 0.8, -2.2),
]

T(
    id="associate",
    title="Associação: dos pontos do laser aos beacons",
    entry="associatebeacons",
    prelude=CONSTS,
    solution=R_ASSOC,
    globals=["x", "y", "theta", "firstray", "lastray"],
    watch=["beaconcluster"],
    tol=1e-9,
    signature="procedure AssociateBeacons;",
    starter="""procedure AssociateBeacons;
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

end;""",
    tests=[
        dict(name=nome, G=dict(x=px, y=py, theta=th, firstray=0, lastray=359,
                               beaconpos=beacon_js(), beaconcluster=cluster_js({})),
             laser=laser_scan(px, py, th))
        for (nome, px, py, th) in SCEN
    ],
    rules=[
        dict(level="error", re=r"mgetv", msg="As distâncias do laser lêem-se da matriz <code>LaserValues</code> com <code>Mgetv(LaserValues, i, 0)</code>."),
        dict(level="error", re=r"0\.1", msg="O critério de associação é o ponto estar a menos de <b>0.1 m</b> de um beacon conhecido."),
        dict(level="error", re=r"0\.02", msg="Falta somar <b>0.02 m</b> à distância lida: o laser vê a superfície do poste, mas o que interessa ao filtro é o <b>centro</b>. Sem isso o centróide fica 2 cm curto em cada ponto."),
    ],
    signalHints={
        "G.beaconcluster": "Se o <code>n</code> está certo mas o centroide não, o problema é a média. O professor usa a forma <b>incremental</b>: <code>BeaconCluster[j].x := ((BeaconCluster[j].x * (n-1)) + MeasurePos.x)/n;</code> — repara que o <code>n</code> já foi incrementado antes. Se o <code>n</code> está a zero, ou não limpaste os clusters no início, ou o critério dos 0.1 m está errado.",
    },
    hints=[
        "Três ciclos encaixados: limpar os clusters, percorrer os raios, e para cada ponto percorrer os beacons conhecidos.",
        "A distância a usar é <code>Mgetv(LaserValues, i, 0) + 0.02</code>, e só interessa se for maior que zero.",
        "A associação é por proximidade ao beacon <b>conhecido</b>: <code>if Dist(BeaconPos[j].x - MeasurePos.x, BeaconPos[j].y - MeasurePos.y) < 0.1</code>.",
        "Incrementa <code>n</code> <b>primeiro</b> e só depois atualiza a média incremental — a fórmula do professor assume essa ordem.",
    ],
)

T(
    id="tuning",
    title="Sintonia de <code>Q</code> e <code>R</code> — o filtro tem de convergir",
    entry="runsim",
    prelude=CONSTS + "\n" + R_MOTION + "\n" + R_UPDATE + "\n" + SIM_HARNESS,
    solution=R_TUNING,
    globals=["x", "y", "theta", "vlin", "omega"],
    captureG=["erro_medio", "erro_max"],
    sheet0=SHEET0,
    G0=dict(beaconpos=beacon_js(), beaconcluster=cluster_js({}), logon=False),
    signature="procedure SetupNoise;",
    starter="""procedure SetupNoise;
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
end;""",
    tests=[
        dict(kind="assert", name="Q e R bem formadas (2x2, diagonal positiva)",
             check_js="""function(cap, b){
               var Q = b.G.q, R = b.G.r;
               if(!Q || Q.r!==2 || Q.c!==2) return "Q tem de ser uma matriz 2x2 (espaco [v ; omega]).";
               if(!R || R.r!==2 || R.c!==2) return "R tem de ser uma matriz 2x2 (espaco [distancia ; angulo]).";
               if(!(Q.d[0]>0 && Q.d[3]>0)) return "A diagonal de Q tem de ser positiva — sao variancias.";
               if(!(R.d[0]>0 && R.d[3]>0)) return "A diagonal de R tem de ser positiva — sao variancias.";
               return true;
             }"""),
        dict(kind="assert", name="Variâncias, não desvios padrão",
             check_js="""function(cap, b){
               var R = b.G.r;
               if(R.d[0] > 0.001) return "R(1,1) = " + R.d[0].toExponential(2) +
                 " e grande de mais para uma variancia: o desvio padrao da distancia e 0.005 m, "+
                 "portanto a variancia anda pelos 2.5e-5. Nao te esquecas de elevar ao quadrado.";
               return true;
             }"""),
        dict(kind="assert", name="O filtro converge (erro médio nas últimas 100 iterações < 4 cm)",
             check_js="""function(cap){
               if(!(cap.erro_medio < 0.04))
                 return "erro medio final = " + cap.erro_medio.toFixed(4) + " m (limite 0.040 m). " +
                        "Com este Q e R a estimativa nao acompanha o robo.";
               return true;
             }"""),
        dict(kind="assert", name="Não diverge (erro máximo < 12 cm)",
             check_js="""function(cap){
               if(!(cap.erro_max < 0.12))
                 return "erro maximo = " + cap.erro_max.toFixed(4) + " m (limite 0.120 m).";
               return true;
             }"""),
    ],
    rules=[
        dict(level="error", re=r"procedure\s+setupnoise", msg="Mantém o nome e a assinatura: <code>procedure SetupNoise;</code>."),
        dict(level="error", re=r"power\s*\(|\bsqr\b|\*\s*lin_stddev", msg="As entradas de Q e R são <b>variâncias</b> — o quadrado dos desvios padrão declarados no topo."),
        dict(re=r"msetv", msg="Preenche as matrizes com <code>Mzeros(2,2)</code> e depois <code>Msetv</code> nas entradas da diagonal."),
    ],
    signalHints={},
    hints=[
        "Ao contrário das outras sub-tarefas, aqui não se compara com o professor: corre-se o filtro 300 ciclos e mede-se se ele acompanha o robô.",
        "As constantes já lá estão: <code>lin_stddev</code>, <code>omega_stddev</code>, <code>sensD_stddev</code>, <code>sensA_stddev</code>. São desvios padrão — Q e R querem <b>variâncias</b>.",
        "Q é diagonal 2x2 no espaço dos controlos [v ; omega]; R é diagonal 2x2 no espaço das medidas [distância ; ângulo].",
        "Solução do professor: <code>qV := Power(lin_stddev,2);</code> e análogos, depois <code>Q := Mzeros(2,2); Msetv(Q,0,0,qV); Msetv(Q,1,1,qOmega);</code> e o mesmo para R.",
    ],
)


# ===========================================================================
#  Serialização
# ===========================================================================
def dump_tests(tests):
    parts = []
    for t in tests:
        if t.get("kind") == "assert":
            parts.append('{kind: "assert", name: %s, check: %s}' %
                         (json.dumps(t["name"], ensure_ascii=False), t["check_js"]))
        else:
            parts.append(json.dumps({k: v for k, v in t.items() if k != "check_js"}, ensure_ascii=False))
    return "[\n      " + ",\n      ".join(parts) + "\n    ]"


def dump_task(t):
    p = []
    p.append("    id: %s," % json.dumps(t["id"]))
    p.append("    title: %s," % json.dumps(t["title"], ensure_ascii=False))
    p.append("    entry: %s," % json.dumps(t["entry"]))
    p.append("    signature: %s," % json.dumps(t["signature"], ensure_ascii=False))
    p.append("    starter: %s," % jstr(t["starter"]))
    p.append("    prelude: %s," % jstr(t["prelude"]))
    p.append("    solution: %s," % jstr(t["solution"]))
    p.append("    globals: %s," % json.dumps(t["globals"]))
    if t.get("watch"):     p.append("    watch: %s," % json.dumps(t["watch"]))
    if t.get("watchArgs"): p.append("    watchArgs: %s," % json.dumps(t["watchArgs"]))
    if t.get("captureG"):  p.append("    captureG: %s," % json.dumps(t["captureG"]))
    if t.get("sheet0"):    p.append("    sheet0: %s," % json.dumps(t["sheet0"]))
    if t.get("G0"):        p.append("    G0: %s," % json.dumps(t["G0"], ensure_ascii=False))
    p.append("    tol: %s," % (t.get("tol", 1e-6)))
    if t.get("tolPct"):    p.append("    tolPct: %s," % t["tolPct"])
    p.append("    tests: %s," % dump_tests(t["tests"]))
    p.append("    rules: [%s]," % ", ".join(
        "{re: /%s/, msg: %s, level: %s}" % (r["re"].replace("/", "\\/"),
                                            json.dumps(r["msg"], ensure_ascii=False),
                                            json.dumps(r.get("level", "warn")))
        for r in t.get("rules", [])))
    p.append("    signalHints: %s," % json.dumps(t.get("signalHints", {}), ensure_ascii=False))
    p.append("    hints: %s" % json.dumps(t.get("hints", []), ensure_ascii=False))
    return "  " + json.dumps(t["id"]) + ": {\n" + "\n".join(p) + "\n  }"


body = ",\n".join(dump_task(t) for t in TASKS)
js = """/* ===== SAUT StudyHub — especificação avaliável da Labwork 5 =====
   EKF com beacons detetados por laser, no SimTwo (Pascal).
   GERADO por tools/gen_lab5spec.py a partir de
   Lab_5/SimTwo64_LabWork__5_EKF.zip -> EKF_Beacon_Laser_Sol/NXTControl.spas.
   NÃO EDITAR À MÃO — alterar o gerador e voltar a correr.
*/
window.SAUT_LABSPEC = window.SAUT_LABSPEC || {};
window.SAUT_LABSPEC["m5-mod6"] = {
%s
};
""" % body

with open(OUT, "w", encoding="utf-8") as f:
    f.write(js)
print("escrito", os.path.normpath(OUT), len(js), "bytes,", len(TASKS), "tarefas")
