#!/usr/bin/env python3
# Gera js/data/lab3spec.js a partir do control.pas da solução do professor.
import json, os, re

SOLDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lab3_solution")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "js", "data", "lab3spec.js")

def pas(name):
    with open(os.path.join(SOLDIR, "sol_%s.pas" % name), encoding="latin1") as f:
        return f.read().strip()

def jstr(s):
    """Template literal seguro."""
    return "`" + s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${") + "`"

CONSTS = """const
  Ce    = 360;
  ngear = 1;
  Dnom  = 0.0980;
  L1nom = 0.1600;
  L2nom = 0.3000;
  Go_Forward   = 1;
  De_Accel_Lin = 2;
  Stop_Lin     = 3;
  Rotation     = 1;
  De_Accel_Rot = 2;
  Stop_Rot     = 3;
  RotateRight  = 1;
  RotateLeft   = -1;
  VEL_ANG_NOM   = 0.5;
  VEL_LIN_NOM   = 1;
  VEL_LIN_DA    = 0.2;
  DIST_DA       = 0.2;
  TOL_FINDIST   = 0.02;
  DIST_NEWPOSE  = 0.05;
  THETA_NEWPOSE = 15 * 3.1415/180.0;
  THETA_DA      = 15 * 3.1415/180.0;
  W_DA          = 0.01;
  TOL_FINTHETA  = 1 * 3.1415/180.0;
var
  xodo, yodo, thodo: double;
  state_Lin, state_Rot: integer;
"""

MOTORVEL = pas("MotorVel")
DIST2LINE = pas("Dist2Line")
DIST2ARC = pas("Dist2Arc")

GLOBALS = ["xodo", "yodo", "thodo", "state_lin", "state_rot"]
SHEET_MAX = {"14,6": 1, "15,6": 1, "16,6": 1}

TASKS = []

# ---------------------------------------------------------------- 1. MotorVel
TASKS.append(dict(
    id="motorvel",
    title="Cinemática inversa mecanum — <code>MotorVel</code>",
    entry="motorvel",
    prelude=CONSTS,
    solution=MOTORVEL,
    globals=GLOBALS,
    sheet0=SHEET_MAX,
    signature="procedure MotorVel(V, Vn, W: double; var RC: TRobotControls);",
    starter="""procedure MotorVel(V, Vn, W: double; var RC: TRobotControls);
var Vmax, VnMax, Wmax: double;
begin
  // 1) lê as velocidades máximas das células (14,6), (15,6) e (16,6)
  Vmax  := ;
  VnMax := ;
  Wmax  := ;

  // 2) cinemática inversa: RC.V[0..3] em função de V, Vn e W
  RC.V[0] := ;
  RC.V[1] := ;
  RC.V[2] := ;
  RC.V[3] := ;
end;""",
    tests=[
        dict(name="Só avanço (V=1, Vn=0, W=0)", args=[1, 0, 0, "$RC"]),
        dict(name="Só translação lateral (Vn=1)", args=[0, 1, 0, "$RC"]),
        dict(name="Só rotação (W=1)", args=[0, 0, 1, "$RC"]),
        dict(name="Movimento combinado", args=[0.6, -0.3, 0.4, "$RC"]),
        dict(name="Velocidades máximas diferentes (não podes fixar valores)",
             sheet={"14,6": 2.0, "15,6": 1.5, "16,6": 3.0}, args=[0.5, 0.5, 0.5, "$RC"]),
    ],
    rules=[
        dict(level="error", re=r"getrcvalue\s*\(\s*14\s*,\s*6", msg="Vmax deve ser lido da célula (14,6) com <code>GetRCValue</code>, não fixado no código."),
        dict(level="error", re=r"getrcvalue\s*\(\s*16\s*,\s*6", msg="Wmax deve ser lido da célula (16,6)."),
        dict(re=r"l1nom\s*\+\s*l2nom", msg="O braço da rotação usa <code>(L1nom + L2nom)/2</code> — é a soma das duas semi-distâncias."),
    ],
    signalHints={
        "RC.V": "Compara as quatro rodas: numa mecanum as rodas 0 e 3 têm o rolo a 45° num sentido e as 1 e 2 no outro. O sinal de <b>Vn</b> tem de ser oposto entre {0,3} e {1,2}, e o de <b>W</b> oposto entre {0,2} e {1,3}."
    },
    hints=[
        "Começa pelas máximas: <code>Vmax := GetRCValue(14,6)</code>, <code>VnMax := GetRCValue(15,6)</code>, <code>Wmax := GetRCValue(16,6)</code>. Os argumentos V, Vn e W são <i>normalizados</i> (−1..1) e multiplicam estas máximas.",
        "Para uma mecanum de 4 rodas com a numeração do enunciado, a contribuição de avanço é <b>+V</b> em todas as rodas. Só mudam os sinais de Vn e de W.",
        "Termo de rotação: <code>(L1nom + L2nom)*W*Wmax/2</code>. É negativo nas rodas 0 e 2 e positivo nas 1 e 3.",
        "Solução: <code>RC.V[0] := V*Vmax - Vn*VnMax - (L1nom+L2nom)*W*Wmax/2;</code> e por analogia as restantes (troca os sinais de Vn em {1,2} e de W em {1,3}).",
    ],
))

# ------------------------------------------------------- 2. Odometria (forward)
TASKS.append(dict(
    id="odometria",
    title="Odometria omnidirecional — <code>SimTwoFowardKinematics</code>",
    entry="simtwofowardkinematics",
    prelude=CONSTS,
    solution=pas("SimTwoFowardKinematics"),
    globals=GLOBALS,
    watch=["xodo", "yodo", "thodo"],
    signature="procedure SimTwoFowardKinematics(var RC: TRobotControls);",
    starter="""procedure SimTwoFowardKinematics(var RC: TRobotControls);
var
  odo0, odo1, odo2, odo3: integer;
  delta_dwh0, delta_dwh1, delta_dwh2, delta_dwh3: double;
  delta_d, delta_dn, delta_th: double;
begin
  // 1) impulsos de cada encoder
  odo0 := GetAxisOdo( RC.irobot , RC.iMot[0] );
  odo1 := GetAxisOdo( RC.irobot , RC.iMot[1] );
  odo2 := GetAxisOdo( RC.irobot , RC.iMot[2] );
  odo3 := GetAxisOdo( RC.irobot , RC.iMot[3] );

  // 2) deslocamento linear de cada roda (impulsos -> metros)
  delta_dwh0 := ;
  delta_dwh1 := ;
  delta_dwh2 := ;
  delta_dwh3 := ;

  // 3) deslocamentos no referencial do robô
  delta_d  := ;
  delta_dn := ;
  delta_th := ;

  // 4) integra a pose odométrica (xodo, yodo, thodo)
  //    usa a aproximação de arco quando |delta_th| não é desprezável
end;""",
    tests=[
        dict(name="Andamento em frente", odo=[100, 100, 100, 100], args=["$RC"], repeat=3,
             G=dict(xodo=0, yodo=0, thodo=0)),
        dict(name="Translação lateral pura", odo=[-100, 100, 100, -100], args=["$RC"], repeat=2,
             G=dict(xodo=0, yodo=0, thodo=0)),
        dict(name="Rotação pura", odo=[-80, 80, -80, 80], args=["$RC"], repeat=4,
             G=dict(xodo=0, yodo=0, thodo=0)),
        dict(name="Trajetória curva (arco)", odo=[60, 140, 40, 120], args=["$RC"], repeat=5,
             G=dict(xodo=0.2, yodo=-0.1, thodo=0.4)),
        dict(name="Arranque com orientação inicial não nula", odo=[200, 200, 200, 200], args=["$RC"], repeat=2,
             G=dict(xodo=1.0, yodo=2.0, thodo=1.2)),
    ],
    rules=[
        dict(level="error", re=r"pi\s*\*\s*dnom", msg="O deslocamento de cada roda é <code>pi*Dnom*odo/(ngear*Ce)</code> — perímetro a dividir pela resolução do encoder."),
        dict(level="error", re=r"ngear\s*\*\s*ce", msg="Não te esqueças de dividir por <code>(ngear*Ce)</code>."),
        dict(level="error", re=r"2\s*\*\s*\(\s*l1nom\s*\+\s*l2nom\s*\)", msg="<code>delta_th</code> divide por <code>2*(L1nom+L2nom)</code>."),
    ],
    signalHints={
        "G.thodo": "O erro está em <code>delta_th</code>: é <code>(-d0 + d1 - d2 + d3) / (2*(L1nom+L2nom))</code>. Confirma os sinais e o denominador.",
        "G.xodo": "Se thodo está certo mas xodo não, o problema é a integração da pose. Para |delta_th| pequeno usa a aproximação linear; caso contrário usa a fórmula do arco com <code>thodo + delta_th/2</code>.",
        "G.yodo": "Verifica a rotação do deslocamento (delta_d, delta_dn) do referencial do robô para o do mundo: <code>x += delta_d*cos(th) - delta_dn*sin(th)</code>, <code>y += delta_d*sin(th) + delta_dn*cos(th)</code>.",
    },
    hints=[
        "Cada roda: <code>delta_dwh_i := pi*Dnom*odo_i/(ngear*Ce)</code>.",
        "Combina as quatro rodas: <code>delta_d</code> é a média das quatro; <code>delta_dn</code> usa os sinais (−,+,+,−)/4; <code>delta_th</code> usa (−,+,−,+) a dividir por <code>2*(L1nom+L2nom)</code>.",
        "Integração: se <code>Abs(Deg(delta_th)) &lt; 0.01</code> aplica a aproximação linear (rodar (delta_d, delta_dn) por thodo). Caso contrário usa a fórmula exata do arco, avaliada em <code>thodo + delta_th/2</code>.",
        "Fórmula do arco para x: <code>xodo := xodo + (delta_d*sin(delta_th) + delta_dn*(cos(delta_th)-1))*cos(thodo+delta_th/2)/delta_th - (delta_d*(1-cos(delta_th)) + delta_dn*sin(delta_th))*sin(thodo+delta_th/2)/delta_th;</code> — e a análoga para y (troca cos↔sin no fator externo e o sinal do segundo termo). No fim: <code>thodo := thodo + delta_th;</code>",
    ],
))

# ------------------------------------------------------------------- 3. gotoXY
TASKS.append(dict(
    id="gotoxy",
    title="<code>GotoXY</code> com duas máquinas de estados",
    entry="gotoxy",
    prelude=CONSTS + "\n" + MOTORVEL,
    solution=pas("gotoXY"),
    globals=GLOBALS,
    watch=["state_lin", "state_rot"],
    sheet0=SHEET_MAX,
    signature="procedure gotoXY(xf, yf, tf: double; var RC: TRobotControls);",
    starter="""procedure gotoXY(xf, yf, tf: double; var RC: TRobotControls);
var rotateToFinal, ang_target, error_dist, error_finalrot, V, Vn, W: double;
begin
  // 1) erros
  ang_target     := ;
  error_dist     := ;
  error_finalrot := ;

  // 2) sentido de rotação mais curto
  if error_finalrot > 0 then rotateToFinal := RotateRight
  else rotateToFinal := RotateLeft;

  // 3) TRANSIÇÕES da máquina linear (state_Lin)
  case state_Lin of
    Go_Forward: begin
      // ...
    end;
    De_Accel_Lin: begin
      // ...
    end;
    Stop_Lin: begin
      // ...
    end;
  end;

  // 4) SAÍDAS da máquina linear -> V e Vn
  case state_Lin of
    Go_Forward   : begin V := ; Vn := ; end;
    De_Accel_Lin : begin V := ; Vn := ; end;
    Stop_Lin     : begin V := 0; Vn := 0; end;
  end;

  // 5) TRANSIÇÕES e SAÍDAS da máquina angular (state_Rot) -> W
  // ...

  MotorVel(V, Vn, W, RC);
end;""",
    tests=[
        dict(name="Longe do alvo, robô alinhado", G=dict(xodo=0, yodo=0, thodo=0, state_lin=1, state_rot=1),
             args=[1.0, 0.5, 0.3, "$RC"]),
        dict(name="Longe do alvo, robô rodado", G=dict(xodo=-0.4, yodo=0.9, thodo=2.0, state_lin=1, state_rot=1),
             args=[1.0, 0.5, -1.2, "$RC"]),
        dict(name="Entrada na zona de desaceleração", G=dict(xodo=0.9, yodo=0.45, thodo=0.25, state_lin=1, state_rot=1),
             args=[1.0, 0.5, 0.3, "$RC"]),
        dict(name="Chegada ao alvo (tem de parar)", G=dict(xodo=1.0, yodo=0.5, thodo=0.3, state_lin=2, state_rot=2),
             args=[1.0, 0.5, 0.3, "$RC"]),
        dict(name="Histerese: alvo novo depois de parado", G=dict(xodo=0, yodo=0, thodo=0, state_lin=3, state_rot=3),
             args=[0.8, -0.6, 1.0, "$RC"]),
        dict(name="Rotação para trás (caminho mais curto)", G=dict(xodo=0, yodo=0, thodo=3.0, state_lin=1, state_rot=1),
             args=[0.05, 0.0, -3.0, "$RC"]),
        dict(name="Histerese linear: parado a 3.5 cm (não pode voltar a arrancar)",
             G=dict(xodo=0.965, yodo=0.5, thodo=0.3, state_lin=3, state_rot=3), args=[1.0, 0.5, 0.3, "$RC"]),
        dict(name="Histerese angular: parado com 8° de erro (não pode voltar a rodar)",
             G=dict(xodo=1.0, yodo=0.5, thodo=0.16, state_lin=3, state_rot=3), args=[1.0, 0.5, 0.3, "$RC"]),
        dict(name="Malha fechada: converge para (1.0, 0.5, 0.5)?", steps=400, dt=0.04, sample=50,
             start=[0, 0, 0], G=dict(state_lin=1, state_rot=1), args=[1.0, 0.5, 0.5, "$RC"], tolSim=0.03),
        dict(name="Malha fechada: alvo atrás do robô", steps=400, dt=0.04, sample=50,
             start=[0.5, 0.5, 1.5], G=dict(state_lin=1, state_rot=1), args=[-0.5, -0.2, -0.8, "$RC"], tolSim=0.03),
    ],
    rules=[
        dict(level="error", re=r"atan2", msg="O ângulo para o alvo obtém-se com <code>ATan2(yf-yodo, xf-xodo)</code>."),
        dict(level="error", re=r"normalizeangle", msg="O erro angular final tem de passar por <code>NormalizeAngle</code>, senão saltas 2π."),
        dict(re=r"tol_findist", msg="Usa a constante <code>TOL_FINDIST</code> para decidir a paragem linear."),
        dict(level="error", re=r"dist_newpose", msg="A transição de volta a Go_Forward usa <code>DIST_NEWPOSE</code> (histerese) — sem isso o robô oscila."),
        dict(level="error", re=r"motorvel", msg="No fim tens de chamar <code>MotorVel(V, Vn, W, RC)</code>."),
    ],
    signalHints={
        "G.state_lin": "A máquina linear está a transitar mal. Regra: em <b>Go_Forward</b>, se <code>error_dist &lt; TOL_FINDIST</code> → Stop_Lin, senão se <code>&lt; DIST_DA</code> → De_Accel_Lin. Em <b>Stop_Lin</b> só sais se <code>error_dist &gt; DIST_NEWPOSE</code>.",
        "G.state_rot": "A máquina angular usa o <b>módulo</b> do erro: <code>abs(error_finalrot)</code> contra <code>TOL_FINTHETA</code>, <code>THETA_DA</code> e <code>THETA_NEWPOSE</code>.",
        "RC.V": "As rodas estão erradas mas os estados certos — o problema está nas equações de V e Vn. Num robô omni não precisas de rodar para andar: <code>V := VEL_LIN_NOM*cos(ang_target - thodo)</code> e <code>Vn := VEL_LIN_NOM*sin(ang_target - thodo)</code> projetam a velocidade no referencial do robô.",
        "trajetória": "Em malha aberta acertas, mas fechada não converge. Verifica a desaceleração (dividir por 3) e a histerese entre Stop e Go_Forward.",
        "pose final": "O robô não pára onde devia. Confirma que no estado Stop_Lin fazes <code>V := 0; Vn := 0;</code> e que a tolerância usada é <code>TOL_FINDIST</code>.",
    },
    hints=[
        "Três erros a calcular: <code>ang_target := ATan2(yf-yodo, xf-xodo)</code>, <code>error_dist := Sqrt(sqr(xf-xodo) + sqr(yf-yodo))</code>, <code>error_finalrot := NormalizeAngle(tf - thodo)</code>.",
        "Separa sempre <b>transições</b> (um <code>case</code> que só muda state_Lin) das <b>saídas</b> (outro <code>case</code> que só calcula V e Vn). É essa a estrutura pedida no enunciado.",
        "Saídas lineares: em Go_Forward usa a velocidade nominal projetada; em De_Accel_Lin a mesma coisa a dividir por 3; em Stop_Lin zero.",
        "Saídas angulares: <code>W := rotateToFinal*VEL_ANG_NOM</code> em Rotation, <code>/3</code> em De_Accel_Rot, e 0 em Stop_Rot. O <code>rotateToFinal</code> é +1 se <code>error_finalrot &gt; 0</code> e −1 caso contrário.",
    ],
))

# ---------------------------------------------------------------- 4. Dist2Line
TASKS.append(dict(
    id="dist2line",
    title="Distância à reta — <code>Dist2Line</code>",
    entry="dist2line",
    prelude=CONSTS,
    solution=DIST2LINE,
    globals=GLOBALS,
    watchArgs=[6, 7, 8],
    signature="procedure Dist2Line(xi, yi, xf, yf, xr, yr: double; var kl, pix, piy: double);",
    starter="""procedure Dist2Line(xi, yi, xf, yf, xr, yr: double; var kl, pix, piy: double);
var
  ux, uy: double;
begin
  // versor da reta (de (xi,yi) para (xf,yf))
  ux := ;
  uy := ;

  // kl : distância com sinal do robô à reta
  kl := ;

  // (pix, piy) : ponto da reta mais próximo do robô
  pix := ;
  piy := ;
end;""",
    tests=[
        dict(name="Reta horizontal, robô acima", args=[0, 0, 2, 0, 1, 0.3, 0, 0, 0]),
        dict(name="Reta horizontal, robô abaixo", args=[0, 0, 2, 0, 0.5, -0.4, 0, 0, 0]),
        dict(name="Reta a 45°", args=[0, 0, 1, 1, 0.2, 0.9, 0, 0, 0]),
        dict(name="Reta vertical descendente", args=[1, 2, 1, -1, 1.6, 0.5, 0, 0, 0]),
        dict(name="Robô já em cima da reta", args=[-1, -1, 3, 3, 1, 1, 0, 0, 0]),
    ],
    rules=[
        dict(re=r"sqrt", msg="O versor da reta obriga a dividir pelo comprimento — precisas de <code>sqrt</code>."),
    ],
    signalHints={
        "arg7": "O <code>kl</code> é a distância <b>com sinal</b> do robô à reta: <code>kl := (xr*uy - yr*ux - xi*uy + yi*ux)/(sqr(ux) + sqr(uy))</code>. É o produto externo entre o versor da reta e o vetor até ao robô.",
        "arg8": "O ponto mais próximo obtém-se recuando <code>kl</code> na direção normal: <code>pix := -kl*uy + xr</code>.",
        "arg9": "Simétrico do anterior na outra componente: <code>piy := kl*ux + yr</code> (repara no sinal, é o oposto de pix).",
    },
    hints=[
        "Primeiro o versor: <code>ux := (xf-xi)/sqrt(sqr(xf-xi) + sqr(yf-yi))</code> e o análogo para uy.",
        "A distância com sinal é um produto externo 2D entre o versor e o vetor do ponto inicial ao robô.",
        "O ponto de interseção é o robô deslocado <code>kl</code> ao longo da <b>normal</b> à reta — a normal a (ux, uy) é (−uy, ux).",
    ],
))

# --------------------------------------------------------------- 5. FollowLine
TASKS.append(dict(
    id="followline",
    title="<code>FollowLine</code> — seguir um segmento de reta",
    entry="followline",
    prelude=CONSTS + "\n" + MOTORVEL + "\n" + DIST2LINE,
    solution=pas("FollowLine"),
    globals=GLOBALS,
    watch=["state_lin", "state_rot"],
    sheet0=SHEET_MAX,
    signature="procedure FollowLine(xi, yi, xf, yf, tf: double; var RC: TRobotControls);",
    starter="""procedure FollowLine(xi, yi, xf, yf, tf: double; var RC: TRobotControls);
var
  rotateToFinal, error_dist, distLine, error_finalrot, V, Vn, W, nearX, nearY: double;
  alfa, VlinX, VlinY: double;
begin
  // 1) erros: distância ao ponto final, distância à reta e erro angular
  error_dist := ;
  Dist2Line(xi, yi, xf, yf, xOdo, yOdo, distLine, nearX, nearY);
  distLine := abs(distLine);
  error_finalrot := ;
  alfa := ;              // direção da reta

  // 2) máquina linear: transições iguais às do gotoXY
  // 3) saídas: velocidade ao longo da reta + correção para o ponto mais próximo
  //    (calcula primeiro no referencial do MUNDO e depois roda para o do ROBÔ)

  // 4) máquina angular: igual à do gotoXY

  MotorVel(V, Vn, W, RC);
end;""",
    tests=[
        dict(name="Robô ao lado da reta, no início", G=dict(xodo=0, yodo=0.3, thodo=0, state_lin=1, state_rot=1),
             args=[0, 0, 2, 0, 0.0, "$RC"]),
        dict(name="Robô do outro lado da reta", G=dict(xodo=0.5, yodo=-0.25, thodo=0.6, state_lin=1, state_rot=1),
             args=[0, 0, 2, 0, 0.0, "$RC"]),
        dict(name="Reta oblíqua", G=dict(xodo=0.1, yodo=0.6, thodo=-0.4, state_lin=1, state_rot=1),
             args=[0, 0, 1.5, 1.5, 0.7, "$RC"]),
        dict(name="Perto do fim da reta", G=dict(xodo=1.85, yodo=0.02, thodo=0.05, state_lin=1, state_rot=1),
             args=[0, 0, 2, 0, 0.0, "$RC"]),
        dict(name="Histerese: parado a 3.5 cm do fim", G=dict(xodo=1.965, yodo=0, thodo=0, state_lin=3, state_rot=3),
             args=[0, 0, 2, 0, 0.0, "$RC"]),
        dict(name="Malha fechada: entra na reta e pára no fim", steps=500, dt=0.04, sample=60,
             start=[0, 0.3, 0], G=dict(state_lin=1, state_rot=1), args=[0, 0, 2, 0, 0.0, "$RC"], tolSim=0.04),
    ],
    rules=[
        dict(re=r"dist2line", msg="Aproveita o <code>Dist2Line</code> que já escreveste para obter o ponto mais próximo."),
        dict(re=r"atan2\s*\(\s*yf\s*-\s*yi", msg="A direção da reta é <code>alfa := ATan2(yf-yi, xf-xi)</code> — repara que é da reta, não do robô ao alvo."),
        dict(re=r"cos\s*\(\s*th", msg="Tens de rodar a velocidade do referencial do mundo para o do robô com cos/sin de <code>thOdo</code>."),
    ],
    signalHints={
        "RC.V": "A velocidade está mal. Constrói primeiro no MUNDO: <code>VlinX := VEL_LIN_NOM*cos(alfa) + k*(nearX - xOdo)</code> (idem para VlinY com sin). Depois roda para o robô: <code>V := VlinX*cos(thOdo) + VlinY*sin(thOdo)</code> e <code>Vn := -VlinX*sin(thOdo) + VlinY*cos(thOdo)</code>. O ganho de aproximação à reta é 2.",
        "G.state_lin": "As transições são exatamente as do gotoXY, com <code>error_dist</code> medido até ao ponto <b>final</b> da reta (não até à reta).",
        "trajetória": "Está a seguir mas afasta-se da reta: o termo corretor <code>k*(nearX - xOdo)</code> é o que puxa o robô de volta. Sem ele o robô anda paralelo à reta.",
        "pose final": "Confirma que o <code>error_dist</code> usado nas transições é a distância ao ponto final (xf, yf).",
    },
    hints=[
        "O truque é somar duas velocidades: uma <b>ao longo</b> da reta (direção alfa) e outra <b>para</b> a reta (do robô para nearX/nearY).",
        "Calcula tudo no referencial do mundo (VlinX, VlinY) e só no fim projeta em V e Vn com a rotação de <code>thOdo</code>.",
        "Em De_Accel_Lin só a componente ao longo da reta é dividida por 3 — o termo corretor mantém-se.",
        "A máquina angular é idêntica à do gotoXY: só depende de <code>error_finalrot = NormalizeAngle(tf - thodo)</code>.",
    ],
))

# ----------------------------------------------------------------- 6. Dist2Arc
TASKS.append(dict(
    id="dist2arc",
    title="Ponto mais próximo na circunferência — <code>Dist2Arc</code>",
    entry="dist2arc",
    prelude=CONSTS,
    solution=DIST2ARC,
    globals=GLOBALS,
    watchArgs=[5, 6],
    signature="procedure Dist2Arc(xc, yc, R, xr, yr: double; var pix, piy: double);",
    starter="""procedure Dist2Arc(xc, yc, R, xr, yr: double; var pix, piy: double);
var
  ux, uy: double;
begin
  // versor do centro para o robô
  ux := ;
  uy := ;

  // ponto da circunferência mais próximo do robô
  pix := ;
  piy := ;
end;""",
    tests=[
        dict(name="Robô fora da circunferência", args=[0, 0, 1, 2, 0, 0, 0]),
        dict(name="Robô dentro da circunferência", args=[0, 0, 1, 0.2, 0.2, 0, 0]),
        dict(name="Centro deslocado", args=[1, -1, 0.5, 1.8, -0.4, 0, 0]),
        dict(name="Robô já sobre a circunferência", args=[0, 0, 1.5, 0, 1.5, 0, 0]),
    ],
    rules=[
        dict(re=r"sqrt", msg="Precisas de normalizar o vetor centro→robô."),
    ],
    signalHints={
        "arg6": "O ponto mais próximo é <code>pix := R*ux + xc</code>, onde (ux, uy) é o <b>versor</b> do centro para o robô.",
        "arg7": "Idem: <code>piy := R*uy + yc</code>.",
    },
    hints=[
        "Vetor do centro para o robô, normalizado: divide por <code>sqrt(sqr(xr-xc) + sqr(yr-yc))</code>.",
        "Depois é só andar R ao longo desse versor a partir do centro.",
    ],
))

# ------------------------------------------------------------- 7. FollowCircle
TASKS.append(dict(
    id="followcircle",
    title="<code>FollowCircle</code> — seguir um arco no sentido direto",
    entry="followcircle",
    prelude=CONSTS + "\n" + MOTORVEL + "\n" + DIST2ARC,
    solution=pas("FollowCircle"),
    globals=GLOBALS,
    watch=["state_lin", "state_rot"],
    sheet0=SHEET_MAX,
    signature="procedure FollowCircle(xc, yc, R, angf, tf: double; var RC: TRobotControls);",
    starter="""procedure FollowCircle(xc, yc, R, angf, tf: double; var RC: TRobotControls);
var
  rotateToFinal, error_dist, error_finalrot, V, Vn, W, nearX, nearY: double;
  alfa, beta, VlinX, VlinY, xf, yf: double;
begin
  // 1) ponto da circunferência mais próximo + ponto final do arco
  Dist2Arc(xc, yc, R, xOdo, yOdo, nearX, nearY);
  xf := ;
  yf := ;
  error_finalrot := ;

  // 2) erro de percurso medido SOBRE o arco
  alfa := ;      // ângulo atual do robô em torno do centro
  beta := ;      // ângulo do ponto final em torno do centro
  // garante que beta > alfa (sentido direto) e calcula o comprimento de arco
  error_dist := ;

  // 3) direção tangente ao círculo
  alfa := ;

  // 4) máquinas de estados iguais às do FollowLine, com a correção para nearX/nearY

  MotorVel(V, Vn, W, RC);
end;""",
    tests=[
        dict(name="Robô sobre o arco, longe do fim", G=dict(xodo=1.5, yodo=1.0, thodo=1.5, state_lin=1, state_rot=1),
             args=[1.0, 1.0, 0.5, 3.14159, 0.0, "$RC"]),
        dict(name="Robô fora do arco", G=dict(xodo=1.7, yodo=1.1, thodo=1.0, state_lin=1, state_rot=1),
             args=[1.0, 1.0, 0.5, 3.14159, 0.0, "$RC"]),
        dict(name="Robô dentro do arco", G=dict(xodo=1.2, yodo=1.05, thodo=2.0, state_lin=1, state_rot=1),
             args=[1.0, 1.0, 0.5, 1.57, 0.5, "$RC"]),
        dict(name="Passagem pelo salto de ±π", G=dict(xodo=0.5, yodo=1.02, thodo=-1.5, state_lin=1, state_rot=1),
             args=[1.0, 1.0, 0.5, 0.5, 0.0, "$RC"]),
        dict(name="Malha fechada: percorre meia volta", steps=600, dt=0.04, sample=75,
             start=[1.5, 1.0, 1.5708], G=dict(state_lin=1, state_rot=1),
             args=[1.0, 1.0, 0.5, 3.14159, 0.0, "$RC"], tolSim=0.05),
    ],
    rules=[
        dict(re=r"dist2arc", msg="Usa o <code>Dist2Arc</code> para o ponto mais próximo do arco."),
        dict(level="error", re=r"2\s*\*\s*pi", msg="Quando <code>beta &lt; alfa</code> tens de somar <code>2*pi</code> — senão o erro de arco fica negativo e o robô pára logo."),
        dict(level="error", re=r"pi\s*/\s*2", msg="A tangente ao círculo está a <code>+pi/2</code> do raio."),
    ],
    signalHints={
        "G.state_lin": "O <code>error_dist</code> tem de ser o comprimento de <b>arco</b> que falta: <code>(beta - alfa)*R</code>, com <code>beta := beta + 2*pi</code> se <code>beta &lt; alfa</code>.",
        "RC.V": "A direção de avanço é a <b>tangente</b>: depois de calcular <code>alfa := ATan2(yOdo-yc, xOdo-xc)</code>, faz <code>alfa := alfa + pi/2</code> antes de usar em cos/sin. O resto é igual ao FollowLine.",
        "trajetória": "Se o robô sai do círculo, o termo corretor <code>(nearX - xOdo)</code> está em falta ou com ganho errado.",
        "pose final": "Verifica o teste <code>if beta &lt; alfa then beta := beta + 2*pi</code> — é o que garante que percorre o arco no sentido direto.",
    },
    hints=[
        "O erro linear já não é uma distância em linha reta: é o arco que falta percorrer, <code>(beta-alfa)*R</code>.",
        "<code>alfa</code> é o ângulo do robô visto do centro; <code>beta</code> é o ângulo do ponto final. Ambos com <code>ATan2</code> em torno de (xc, yc).",
        "Para andar sobre o círculo a direção de avanço é a tangente — soma <code>pi/2</code> ao ângulo radial.",
        "A estrutura de saídas é copiada do FollowLine: <code>VlinX := VEL_LIN_NOM*cos(alfa) + k*(nearX - xOdo)</code> e depois rodas para o referencial do robô.",
    ],
))

# --------------------------------------------------- 8. GotoXY contínuo sem FSM
# NOTA: a solução de referência desta tarefa NÃO é do professor — foi escrita
# para o StudyHub (tools/lab3_solution/sol_gotoXYCont.pas). Ver aviso na tarefa.
TASKS.append(dict(
    id="gotoxycont",
    title="<code>GotoXY</code> contínuo — sem máquina de estados",
    entry="gotoxycont",
    prelude=CONSTS + "\n" + MOTORVEL,
    solution=pas("gotoXYCont"),
    globals=GLOBALS,
    sheet0=SHEET_MAX,
    signature="procedure gotoXYCont(xf, yf, tf: double; var RC: TRobotControls);",
    starter="""procedure gotoXYCont(xf, yf, tf: double; var RC: TRobotControls);
const
  K_LIN = 5;    // ganho proporcional linear
  K_ANG = 3;    // ganho proporcional angular
var
  ang_target, error_dist, error_finalrot, vel, V, Vn, W: double;
begin
  // 1) erros (iguais aos do gotoXY com FSM)
  ang_target     := ;
  error_dist     := ;
  error_finalrot := ;

  // 2) lei linear: velocidade proporcional ao erro, SATURADA em VEL_LIN_NOM
  //    e anulada dentro de TOL_FINDIST (zona morta = o antigo estado Stop_Lin)
  vel := ;

  // 3) decompoe no referencial do robo (nao ha fase de rotacao: e omni)
  V  := ;
  Vn := ;

  // 4) lei angular: proporcional a error_finalrot, saturada em +/-VEL_ANG_NOM
  //    e anulada dentro de TOL_FINTHETA
  W := ;

  MotorVel(V, Vn, W, RC);
end;""",
    tests=[
        dict(name="Longe do alvo (velocidade saturada)", G=dict(xodo=0, yodo=0, thodo=0),
             args=[1.0, 0.5, 0.3, "$RC"]),
        dict(name="Longe do alvo, robô rodado", G=dict(xodo=-0.4, yodo=0.9, thodo=2.0),
             args=[1.0, 0.5, -1.2, "$RC"]),
        dict(name="Zona linear (erro < VEL_LIN_NOM/K_LIN)", G=dict(xodo=0.9, yodo=0.5, thodo=0.25),
             args=[1.0, 0.5, 0.3, "$RC"]),
        dict(name="Dentro da zona morta linear (tem de parar)", G=dict(xodo=0.995, yodo=0.5, thodo=0.3),
             args=[1.0, 0.5, 0.3, "$RC"]),
        dict(name="Dentro da zona morta angular (W tem de ser 0)", G=dict(xodo=0.5, yodo=0.5, thodo=0.3),
             args=[1.0, 0.5, 0.305, "$RC"]),
        dict(name="Erro angular grande (W saturado no sentido curto)", G=dict(xodo=0, yodo=0, thodo=3.0),
             args=[0.05, 0.0, -3.0, "$RC"]),
        dict(name="Sem histerese: a 3.5 cm tem de continuar a andar", G=dict(xodo=0.965, yodo=0.5, thodo=0.3),
             args=[1.0, 0.5, 0.3, "$RC"]),
        dict(name="Velocidades máximas diferentes (não podes fixar valores)",
             G=dict(xodo=0, yodo=0, thodo=0), sheet={"14,6": 2.0, "15,6": 1.5, "16,6": 3.0},
             args=[1.0, 0.5, 0.3, "$RC"]),
        dict(name="Malha fechada: converge para (1.0, 0.5, 0.5)?", steps=400, dt=0.04, sample=50,
             start=[0, 0, 0], args=[1.0, 0.5, 0.5, "$RC"], tolSim=0.03),
        dict(name="Malha fechada: alvo atrás do robô", steps=400, dt=0.04, sample=50,
             start=[0.5, 0.5, 1.5], args=[-0.5, -0.2, -0.8, "$RC"], tolSim=0.03),
    ],
    rules=[
        dict(level="error", re=r"atan2", msg="O ângulo para o alvo continua a ser <code>ATan2(yf-yodo, xf-xodo)</code>."),
        dict(level="error", re=r"normalizeangle", msg="O erro angular tem de passar por <code>NormalizeAngle</code>."),
        dict(level="error", re=r"motorvel", msg="No fim tens de chamar <code>MotorVel(V, Vn, W, RC)</code>."),
        dict(level="error", re=r"case", must=False, msg="Esta tarefa é <b>sem máquina de estados</b>: não deve haver nenhum <code>case</code> nem escrita em <code>state_Lin</code>/<code>state_Rot</code>."),
        dict(re=r"tol_findist", msg="A paragem deixa de ser um estado e passa a ser uma <b>zona morta</b>: <code>if error_dist &lt; TOL_FINDIST then vel := 0</code>."),
        dict(re=r"vel_lin_nom", msg="A saturação usa <code>VEL_LIN_NOM</code> como tecto — sem ela o robô arranca acima do máximo quando está longe."),
    ],
    signalHints={
        "RC.V": "As rodas estão erradas. A lei é <code>vel := K_LIN*error_dist</code>, cortada em <code>VEL_LIN_NOM</code> e anulada abaixo de <code>TOL_FINDIST</code>; depois <code>V := vel*cos(ang_target - thOdo)</code> e <code>Vn := vel*sin(ang_target - thOdo)</code>. O <code>W</code> é <code>K_ANG*error_finalrot</code> saturado em ±<code>VEL_ANG_NOM</code>.",
        "trajetória": "Converge mal ou oscila. Se oscila, o ganho está a mandar o robô saltar por cima do alvo em cada ciclo: com dt=40 ms, <code>K_LIN*dt</code> tem de ficar bem abaixo de 1. Se nunca chega, falta-te a zona morta.",
        "pose final": "O robô não estabiliza. Ao contrário da FSM, aqui não há histerese: a paragem vem só das zonas mortas <code>TOL_FINDIST</code> e <code>TOL_FINTHETA</code>.",
    },
    hints=[
        "Os três erros são exatamente os mesmos do <code>gotoXY</code> com FSM. O que muda é só o que fazes com eles.",
        "Substitui os estados por duas ideias: <b>saturação</b> (o tecto de velocidade, que faz o papel de Go_Forward) e <b>zona morta</b> (que faz o papel de Stop). A desaceleração deixa de ser um estado — é automática, porque a velocidade é proporcional ao erro.",
        "Linear: <code>vel := K_LIN*error_dist; if vel &gt; VEL_LIN_NOM then vel := VEL_LIN_NOM; if error_dist &lt; TOL_FINDIST then vel := 0;</code> e depois decompõe com <code>cos/sin(ang_target - thOdo)</code>.",
        "Angular: <code>W := K_ANG*error_finalrot;</code> saturado nos dois sentidos em ±<code>VEL_ANG_NOM</code>, e <code>W := 0</code> se <code>abs(error_finalrot) &lt; TOL_FINTHETA</code>. Não precisas do <code>rotateToFinal</code>: o sinal do erro já dá o sentido.",
    ],
))

# ----------------------------------------------------------------- serialização
def dump_task(t):
    parts = []
    parts.append("    id: %s," % json.dumps(t["id"]))
    parts.append("    title: %s," % json.dumps(t["title"]))
    parts.append("    entry: %s," % json.dumps(t["entry"]))
    parts.append("    signature: %s," % json.dumps(t["signature"]))
    parts.append("    starter: %s," % jstr(t["starter"]))
    parts.append("    prelude: %s," % jstr(t["prelude"]))
    parts.append("    solution: %s," % jstr(t["solution"]))
    parts.append("    globals: %s," % json.dumps(t["globals"]))
    if t.get("watch"):     parts.append("    watch: %s," % json.dumps(t["watch"]))
    if t.get("watchArgs"): parts.append("    watchArgs: %s," % json.dumps(t["watchArgs"]))
    if t.get("sheet0"):    parts.append("    sheet0: %s," % json.dumps(t["sheet0"]))
    parts.append("    tol: 1e-6,")
    parts.append("    tests: %s," % json.dumps(t["tests"], ensure_ascii=False))
    parts.append("    rules: [%s]," % ", ".join(
        "{re: /%s/, msg: %s, level: %s%s}" % (r["re"].replace("/", "\\/"),
                                              json.dumps(r["msg"], ensure_ascii=False),
                                              json.dumps(r.get("level", "warn")),
                                              ", must: false" if r.get("must") is False else "")
        for r in t.get("rules", [])))
    parts.append("    signalHints: %s," % json.dumps(t.get("signalHints", {}), ensure_ascii=False))
    parts.append("    hints: %s" % json.dumps(t.get("hints", []), ensure_ascii=False))
    return "  " + json.dumps(t["id"]) + ": {\n" + "\n".join(parts) + "\n  }"

body = ",\n".join(dump_task(t) for t in TASKS)
js = """/* ===== SAUT StudyHub — especificação avaliável da Labwork 3 (robô omnidirecional) =====
   GERADO a partir do control.pas da solução do professor
   (SimTwo_Omni_sol_LabW#3/RobotFactoryMecanum4Wheel/control.pas).

   Cada tarefa traz:
     prelude   — código já dado (constantes + rotinas anteriores), comum a ti e à referência
     solution  — a rotina do professor, usada como ORÁCULO (corre nos mesmos testes)
     tests     — casos unitários e de malha fechada; comparam-se os sinais, não o texto
     rules     — verificações estruturais que geram dicas quando algo falha
     hints     — dicas progressivas
*/
window.SAUT_LABSPEC = window.SAUT_LABSPEC || {};
window.SAUT_LABSPEC["m3-mod6"] = {
%s
};
""" % body

with open(OUT, "w", encoding="utf-8") as f:
    f.write(js)
print("escrito", OUT, len(js), "bytes,", len(TASKS), "tarefas")
