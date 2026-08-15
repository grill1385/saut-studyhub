/* Testes de semântica do avaliador (não precisa de jsdom).
   Verifica as três propriedades que interessam:
     1. a solução do professor passa (oráculo);
     2. implementações ESCRITAS DE OUTRA FORMA mas equivalentes passam;
     3. os erros clássicos falham — e recebem a dica certa.

   Uso:  node tools/test_graders.js
*/
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..");
global.window = global;
["js/pascal.js", "js/matlab.js", "js/clike.js", "js/track_sim.js", "js/grader.js",
 "js/data/lab3spec.js", "js/data/lab4spec.js", "js/data/lab5spec.js", "js/data/lab6spec.js"]
  .forEach(f => eval(fs.readFileSync(path.join(ROOT, f), "utf8")));

const G = global.SAUT_GRADER;
const L3 = global.SAUT_LABSPEC["m3-mod6"];
const L4 = global.SAUT_LABSPEC["m4-mod7"];
const L5 = global.SAUT_LABSPEC["m5-mod6"];
const L6 = global.SAUT_LABSPEC["m7-mod3"];
let fails = 0;

function strip(s) { return String(s).replace(/<[^>]+>/g, ""); }
function check(bank, id, src, expectOk, label) {
  const task = bank[id];
  if (!task) { console.log("  ✘ tarefa inexistente: " + id); fails++; return; }
  const r = G.grade(task, src);
  const good = r.ok === expectOk;
  if (!good) fails++;
  console.log(`  ${good ? "✔" : "✘"} ${label} [${id}] → ${r.passed}/${r.total}`);
  if (!good) {
    if (r.error) console.log("      erro: " + strip(r.error));
    r.tests.filter(t => !t.ok).slice(0, 2).forEach(t => console.log("      ✗ " + t.name + " | " + strip(t.detail || "")));
  } else if (!expectOk) {
    const h = G.pickHint(task, r);
    const bad = r.tests.filter(t => !t.ok)[0];
    console.log("      apanhado em: " + (bad ? bad.name : "?"));
    if (h) console.log("      dica: " + strip(h).slice(0, 110) + "…");
  }
}

/* ================= 1. ORÁCULO ================= */
console.log("\n1) Oráculo — a solução do professor passa");
[[L3, "Lab 3"], [L4, "Lab 4"], [L5, "Lab 5"], [L6, "Lab 6"]].forEach(([bank, nome]) => {
  Object.keys(bank).forEach(id => check(bank, id, bank[id].solution, true, nome + " oráculo"));
});

/* ================= 2. EQUIVALENTES ================= */
console.log("\n2) Implementações equivalentes escritas de outra forma");

check(L3, "motorvel", `
procedure MotorVel(V, Vn, W: double; var RC: TRobotControls);
var a, b, c, braco: double;
begin
  braco := (L1nom + L2nom) / 2;
  a := V  * GetRCValue(14,6);
  b := Vn * GetRCValue(15,6);
  c := W  * GetRCValue(16,6) * braco;
  RC.V[1] := a + b + c;
  RC.V[0] := a - b - c;
  RC.V[3] := a - b + c;
  RC.V[2] := a + b - c;
end;`, true, "MotorVel com variáveis auxiliares e outra ordem");

check(L3, "dist2line", `
procedure Dist2Line(xi, yi, xf, yf, xr, yr: double; var kl, pix, piy: double);
var L, nx, ny: double;
begin
  L  := sqrt(power(xf-xi,2) + power(yf-yi,2));
  nx := -(yf - yi)/L;
  ny :=  (xf - xi)/L;
  kl := -( (xr - xi)*nx + (yr - yi)*ny );
  pix := xr + kl*nx;
  piy := yr + kl*ny;
end;`, true, "Dist2Line por projeção na normal");

check(L3, "gotoxy", `
procedure gotoXY(xf, yf, tf: double; var RC: TRobotControls);
var ang, ed, er, V, Vn, W, s: double;
begin
  ang := ATan2(yf - yodo, xf - xodo);
  ed  := sqrt(power(xf-xodo,2) + power(yf-yodo,2));
  er  := NormalizeAngle(tf - thodo);
  if er > 0 then s := 1 else s := -1;
  if state_Lin = Go_Forward then begin
    if ed < TOL_FINDIST then state_Lin := Stop_Lin
    else if ed < DIST_DA then state_Lin := De_Accel_Lin;
  end else if state_Lin = De_Accel_Lin then begin
    if ed < TOL_FINDIST then state_Lin := Stop_Lin
    else if ed > DIST_NEWPOSE then state_Lin := Go_Forward;
  end else begin
    if ed > DIST_NEWPOSE then state_Lin := Go_Forward;
  end;
  if state_Lin = Stop_Lin then begin V := 0; Vn := 0; end
  else begin
    V  := VEL_LIN_NOM*cos(ang - thodo);
    Vn := VEL_LIN_NOM*sin(ang - thodo);
    if state_Lin = De_Accel_Lin then begin V := V/3; Vn := Vn/3; end;
  end;
  if state_Rot = Rotation then begin
    if abs(er) < TOL_FINTHETA then state_Rot := Stop_Rot
    else if abs(er) < THETA_DA then state_Rot := De_Accel_Rot;
  end else if state_Rot = De_Accel_Rot then begin
    if abs(er) < TOL_FINTHETA then state_Rot := Stop_Rot
    else if abs(er) > THETA_NEWPOSE then state_Rot := Rotation;
  end else begin
    if abs(er) > THETA_NEWPOSE then state_Rot := Rotation;
  end;
  if state_Rot = Stop_Rot then W := 0
  else if state_Rot = De_Accel_Rot then W := s*VEL_ANG_NOM/3
  else W := s*VEL_ANG_NOM;
  MotorVel(V, Vn, W, RC);
end;`, true, "gotoXY com if/else e sign() em vez de case/constantes");

check(L4, "motion", `
a = theta_r_e + omega*dt/2;
xr_e = xr_e + v*dt*cos(a);
yr_e = yr_e + v*dt*sin(a);
theta_r_e = NormalizeAng(theta_r_e + omega*dt);`, true, "modelo de movimento com ângulo médio em variável");

check(L4, "grad_f_x", `
ang = theta_r_e + omega*dt/2;
grad_f_X = eye(3);
grad_f_X(1,3) = -v*dt*sin(ang);
grad_f_X(2,3) =  v*dt*cos(ang);`, true, "grad_f_X construído por indexação");

check(L4, "h_model", `
dx = xp1 - xr_e;
dy = yp1 - yr_e;
distp_e = norm([dx dy]);
theta_p_e = NormalizeAng(atan2(dy,dx) - theta_r_e);`, true, "h(X) com norm()");

check(L4, "r_matrix", "R = diag([(sdv_dist_1m*distp_e)^2, sdv_ang^2]);", true, "R com diag()");

check(L4, "update", `
H = grad_h_X;
S = H*P*H' + R;
k = P*H'*inv(S);
P = (eye(3) - k*H)*P;
inov = z - z_e;
inov(2) = NormalizeAng(inov(2));
X_e = X_e + k*inov;
X_e(3) = NormalizeAng(X_e(3));`, true, "atualização com S explícito e outros nomes");

check(L4, "loop4", `
j = 1;
while j <= 4
  xr_e = x_e(1); yr_e = x_e(2); theta_r_e = x_e(3);
  d = sqrt((xp(j)-xr_e)^2 + (yp(j)-yr_e)^2);
  z_e = [d ; NormalizeAng(atan2(yp(j)-yr_e, xp(j)-xr_e) - theta_r_e)];
  R = diag([(d*sdv_dist_1m)^2, sdv_ang^2]);
  H = [-(xp(j)-xr_e)/d, -(yp(j)-yr_e)/d, 0; (yp(j)-yr_e)/d^2, -(xp(j)-xr_e)/d^2, -1];
  k = P*H'*inv(H*P*H' + R);
  P = (eye(3) - k*H)*P;
  e = zs(:,j) - z_e;
  e(2) = NormalizeAng(e(2));
  x_e = x_e + k*e;
  j = j + 1;
end`, true, "ciclo dos 4 postes com while");

check(L4, "tuning", "P = eye(3)*0.05;\nQ = [0.002^2 0; 0 0.001^2];", true, "sintonia diferente da do professor mas válida");

/* ================= 3. ERROS CLÁSSICOS ================= */
console.log("\n3) Erros clássicos — têm de ser apanhados");

check(L3, "motorvel", `
procedure MotorVel(V, Vn, W: double; var RC: TRobotControls);
begin
  RC.V[0] := V - Vn - (L1nom + L2nom)*W/2;
  RC.V[1] := V + Vn + (L1nom + L2nom)*W/2;
  RC.V[2] := V + Vn - (L1nom + L2nom)*W/2;
  RC.V[3] := V - Vn + (L1nom + L2nom)*W/2;
end;`, false, "velocidades máximas ignoradas");

check(L3, "gotoxy", L3.gotoxy.solution.replace(/DIST_NEWPOSE/g, "TOL_FINDIST"), false, "histerese removida");
check(L3, "gotoxy", L3.gotoxy.solution.replace(/NormalizeAngle\(tf - thodo\)/, "(tf - thodo)"), false, "sem NormalizeAngle no erro angular");

check(L4, "motion", `
theta_r_e = NormalizeAng(theta_r_e + omega*dt);
xr_e = xr_e + v*cos(theta_r_e+omega*dt/2)*dt;
yr_e = yr_e + v*sin(theta_r_e+omega*dt/2)*dt;`, false, "orientação atualizada antes da posição");

check(L4, "grad_f_x", `
grad_f_X=[ 1 0 -v*dt*sin(theta_r_e);
    0 1 v*dt*cos(theta_r_e);
    0 0 1];`, false, "Jacobiano no ângulo inicial em vez do médio");

check(L4, "p_prop", "P = grad_f_X * P * grad_f_X + grad_f_U*Q*grad_f_U';", false, "transposição em falta");
check(L4, "r_matrix", "R = [ sdv_dist_1m^2 0 ; 0 sdv_ang^2 ];", false, "R sem dependência da distância");

check(L4, "grad_h_x", `
grad_h_X = [(xp1-xr_e)/distp_e, (yp1-yr_e)/distp_e, 0;
            -(yp1-yr_e)/(distp_e^2), (xp1-xr_e)/(distp_e^2), -1];`, false, "sinais trocados no Jacobiano da observação");

check(L4, "update", `
k = P * grad_h_X' * inv(grad_h_X * P * grad_h_X' + R);
P = (eye(3)-k*grad_h_X) * P;
X_e = X_e + k*(z - z_e);`, false, "inovação angular não normalizada");

check(L4, "tuning", "P = eye(3)*1e-9;\nQ = [1e-12 0; 0 1e-12];", false, "filtro demasiado confiante — não converge");

check(L4, "loop4", `
for j = 1:4
  xr_e = x_e(1); yr_e = x_e(2); theta_r_e = x_e(3);
  d = sqrt((xp(j)-xr_e)^2 + (yp(j)-yr_e)^2);
  z_e = [d ; NormalizeAng(atan2(yp(j)-yr_e, xp(j)-xr_e) - theta_r_e)];
  R = diag([(d*sdv_dist_1m)^2, sdv_ang^2]);
  H = [-(xp(j)-xr_e)/d, -(yp(j)-yr_e)/d, 0; (yp(j)-yr_e)/d^2, -(xp(j)-xr_e)/d^2, -1];
  k = P*H'*inv(H*P*H' + R);
  P = (eye(3) - k*H)*P;
  x_e = x_e + k*(zs(:,j) - z_e);
end`, false, "inovação não normalizada dentro do ciclo");

/* ================= 3b. LAB 5 ================= */
console.log("\n3b) Lab 5 — equivalentes e erros");

check(L5, "predict", `
procedure predictPosition(odo1, odo2: double);
var dEsq, dDir, d, dth: double;
begin
  dEsq := odo1 * ToMetres;
  dDir := odo2 * ToMetres;
  d   := (dEsq + dDir) / 2;
  dth := (dDir - dEsq) / WheelDist;
  x := x + d*cos(theta + dth/2);
  y := y + d*sin(theta + dth/2);
  theta := NormalizeAngle(theta + dth);
end;`, true, "odometria com as rodas separadas");

check(L5, "laser2world", `
procedure LaserPointToWorld(MeasureDist: double; i: integer; var px, py: double);
var ang, lx, ly: double;
begin
  ang := (i-NBEAMS2)*pi()/NBEAMS2 + theta;
  lx := x - 0.14*cos(theta);
  ly := y - 0.14*sin(theta);
  px := lx + MeasureDist*cos(ang);
  py := ly + MeasureDist*sin(ang);
end;`, true, "laser->mundo com a origem do laser em variáveis");

check(L5, "clustermeasure", `
procedure ClusterMeasure(j: integer);
var dx, dy: double;
begin
  dx := BeaconCluster[j].x - x;
  dy := BeaconCluster[j].y - y;
  BeaconCluster[j].dist := sqrt(dx*dx + dy*dy);
  BeaconCluster[j].ang := NormalizeAngle(ATan2(dy, dx) - theta);
end;`, true, "cluster->medida sem usar Dist()");

check(L5, "associate", `
procedure AssociateBeacons;
var i, j: integer;
    md, px, py: double;
    sx, sy: array[1..3] of double;
begin
  for j:=1 to NBEACONS do begin
    sx[j] := 0; sy[j] := 0;
    BeaconCluster[j].n := 0;
    BeaconCluster[j].x := 0;
    BeaconCluster[j].y := 0;
  end;
  i := firstRay;
  while i <= LastRay do begin
    md := Mgetv(LaserValues, i, 0) + 0.02;
    if md > 0 then begin
      px := md*cos((i-NBEAMS2)*pi()/NBEAMS2 + theta) + x - 0.14*cos(theta);
      py := md*sin((i-NBEAMS2)*pi()/NBEAMS2 + theta) + y - 0.14*sin(theta);
      for j:=1 to NBEACONS do begin
        if Dist(BeaconPos[j].x - px, BeaconPos[j].y - py) < 0.1 then begin
          BeaconCluster[j].n := BeaconCluster[j].n + 1;
          sx[j] := sx[j] + px;
          sy[j] := sy[j] + py;
        end;
      end;
    end;
    i := i + 1;
  end;
  for j:=1 to NBEACONS do begin
    if BeaconCluster[j].n > 0 then begin
      BeaconCluster[j].x := sx[j]/BeaconCluster[j].n;
      BeaconCluster[j].y := sy[j]/BeaconCluster[j].n;
    end;
  end;
end;`, true, "associação com soma total em vez de média incremental");

check(L5, "motionmodel", `
procedure EKF_MotionModel;
var a: double;
begin
  SetRCValue(33,1, format('%.4g', [x]));
  SetRCValue(34,1, format('%.4g', [y]));
  SetRCValue(35,1, format('%.4g', [theta]));
  XR := RangeToMatrix(33,1, 3,1);
  a := theta + 0.5*omega*dt;
  grad_f_X := Meye(3);
  Msetv(grad_f_X, 0, 2, -vlin*dt*sin(a));
  Msetv(grad_f_X, 1, 2,  vlin*dt*cos(a));
  grad_f_q := Mzeros(3,2);
  Msetv(grad_f_q, 0, 0, cos(a));
  Msetv(grad_f_q, 1, 0, sin(a));
  Msetv(grad_f_q, 0, 1, -0.5*vlin*dt*sin(a));
  Msetv(grad_f_q, 1, 1,  0.5*vlin*dt*cos(a));
  Msetv(grad_f_q, 2, 1, 1);
  P := Madd(MMult(MMult(grad_f_X, P), Mtran(grad_f_X)),
            MMult(grad_f_q, MMult(Q, Mtran(grad_f_q))));
  MatrixToRange(33, 5, P);
end;`, true, "predição com matrizes em memória (sem passar pela folha)");

check(L5, "tuning", `
procedure SetupNoise;
begin
  Q := Mzeros(2,2);
  Msetv(Q,0,0,0.0004);
  Msetv(Q,1,1,0.0004);
  R := Mzeros(2,2);
  Msetv(R,0,0,0.00005);
  Msetv(R,1,1,0.0001);
end;`, true, "sintonia diferente da do professor mas válida");

/* --- erros --- */
check(L5, "predict", L5.predict.solution.replace("NormalizeAngle(theta+delta_theta)", "(theta+delta_theta)"),
      false, "odometria sem NormalizeAngle");
check(L5, "predict", L5.predict.solution.replace("(odo1+odo2)/2.0", "(odo1+odo2)"),
      false, "avanço sem a média das rodas");
check(L5, "laser2world", `
procedure LaserPointToWorld(MeasureDist: double; i: integer; var px, py: double);
begin
  px := MeasureDist*cos((i-NBEAMS2)*pi()/NBEAMS2 + theta) + x;
  py := MeasureDist*sin((i-NBEAMS2)*pi()/NBEAMS2 + theta) + y;
end;`, false, "laser->mundo sem o desvio de 0.14 m");
check(L5, "clustermeasure", `
procedure ClusterMeasure(j: integer);
begin
  BeaconCluster[j].dist := Dist(BeaconCluster[j].x - x, BeaconCluster[j].y - y);
  BeaconCluster[j].ang := NormalizeAngle(ATan2(BeaconCluster[j].y - y, BeaconCluster[j].x - x));
end;`, false, "ângulo do cluster sem subtrair theta");
check(L5, "associate", L5.associate.solution.replace("Mgetv(LaserValues, i, 0)+0.02", "Mgetv(LaserValues, i, 0)"),
      false, "associação sem compensar o raio do poste");
check(L5, "motionmodel", L5.motionmodel.solution.replace("MMult(P, Mtran(grad_f_X))", "MMult(P, grad_f_X)"),
      false, "predição com uma transposição em falta");
check(L5, "update", L5.update.solution.replace(
        "NormalizeAngle(BeaconCluster[nBeacon].ang - NormalizeAngle(Atan2(BeaconPos[nBeacon].y-y, BeaconPos[nBeacon].x-x) - theta))",
        "BeaconCluster[nBeacon].ang - (Atan2(BeaconPos[nBeacon].y-y, BeaconPos[nBeacon].x-x) - theta)"),
      false, "inovação angular sem normalizar");
check(L5, "tuning", `
procedure SetupNoise;
begin
  Q := Mzeros(2,2); Msetv(Q,0,0,Power(lin_stddev,2)); Msetv(Q,1,1,Power(omega_stddev,2));
  R := Mzeros(2,2); Msetv(R,0,0,100); Msetv(R,1,1,100);
end;`, false, "R enorme — o filtro ignora as medidas");
check(L5, "tuning", `
procedure SetupNoise;
begin
  Q := Mzeros(2,2); Msetv(Q,0,0,lin_stddev); Msetv(Q,1,1,omega_stddev);
  R := Mzeros(2,2); Msetv(R,0,0,sensD_stddev); Msetv(R,1,1,sensA_stddev);
end;`, false, "desvios padrão em vez de variâncias");

/* ================= 3d. LAB 6 (C++) ================= */
console.log("\n3d) Lab 6 — equivalentes e erros");

check(L6, "follow", `
void action_t::follow_track(void)
{
  static float memoria = 0;
  float erro = robot.IRLine.pos_center;
  if (robot.IRLine.found_center) { memoria = ktrack * erro; }
  robot.w_req = memoria;
  robot.v_req = v_nom;
}`, true, "seguimento com variavel estatica e outra estrutura");

check(L6, "followvw", `
void action_t::follow_track(void)
{
  float w, s;
  if (robot.IRLine.found_center) { w = ktrack * robot.IRLine.pos_center; wmem = w; }
  else { w = wmem; }
  robot.w_req = w;
  s = 1 - (w*w)/(w0*w0);
  if (s < 0) s = 0;
  robot.v_req = v_nom * s;
}
float wmem = 0;`, true, "v(w) reescrito como v_nom*(1 - w^2/w0^2)");

check(L6, "locgen", `
void track_localization(robot_t& robot, float_list_t& w_list)
{
  robot.led = 0;
  robot.align_index = -1;
  if (robot.mean_abs_w >= robot.mean_abs_w_tresh) return;
  if (robot.mean_abs_w >= robot.prev_mean_abs_w) return;
  int i = 0;
  while (i < segment_list.size()) {
    segment_t seg = segment_list[i];
    if (abs(dif_angle(normalize_angle(robot.thetae), seg.angle)) < robot.align_angle_tresh) {
      robot.led = 1;
      robot.align_index = i;
      robot.thetae = seg.angle;
      htransf_2d_t H(seg.angle, seg.Pi.x, seg.Pi.y);
      Vec2f Ps = H.apply_inv(robot.xe, robot.ye);
      Ps.y = 0;
      Vec2f Pw = H.apply(Ps);
      robot.xe = Pw.x;
      robot.ye = Pw.y;
      return;
    }
    i = i + 1;
  }
}`, true, "localizacao com while e return antecipado");

/* --- erros --- */
check(L6, "follow", `
void action_t::follow_track(void)
{
  if (robot.IRLine.found_center) robot.w_req = ktrack * robot.IRLine.pos_center;
  else robot.w_req = 0;
  robot.v_req = v_nom;
}`, false, "nao trata a perda da linha (w=0)");

check(L6, "follow", `
void action_t::follow_track(void)
{
  robot.w_req = -ktrack * robot.IRLine.pos_center;
  robot.v_req = v_nom;
}`, false, "sinal do ganho trocado");

check(L6, "followvw", `
float lw = 0;
void action_t::follow_track(void)
{
  float w;
  if (robot.IRLine.found_center) { w = ktrack * robot.IRLine.pos_center; lw = w; } else w = lw;
  robot.w_req = w;
  robot.v_req = v_nom;
}`, false, "sem a modulacao v(w) a 0.40 m/s");

check(L6, "followvw", `
float lw = 0;
void action_t::follow_track(void)
{
  float w;
  if (robot.IRLine.found_center) { w = ktrack * robot.IRLine.pos_center; lw = w; } else w = lw;
  robot.w_req = w;
  robot.v_req = -v_nom/(w0*w0) * (w - w0) * (w + w0);
}`, false, "v(w) sem o max(0, ...)");

check(L6, "locxy", `
void track_localization(robot_t& robot, float_list_t& w_list)
{
  robot.led = 0;
  robot.align_index = -1;
  for (int i = 0; i < segment_list.size(); i++) {
    segment_t seg = segment_list[i];
    if (abs(dif_angle(normalize_angle(robot.thetae), seg.angle)) < robot.align_angle_tresh) {
      robot.led = 1;
      robot.align_index = i;
      robot.thetae = seg.angle;
      if (robot.align_index == 0) robot.ye = seg.Pi.y;
      else if (robot.align_index == 1) robot.xe = seg.Pi.x;
      break;
    }
  }
}`, false, "corrige mesmo em curva (sem o teste do mean_abs_w)");

check(L6, "locxy", `
void track_localization(robot_t& robot, float_list_t& w_list)
{
  robot.led = 0;
  robot.align_index = -1;
  if (robot.mean_abs_w < robot.mean_abs_w_tresh && robot.mean_abs_w < robot.prev_mean_abs_w) {
    for (int i = 0; i < segment_list.size(); i++) {
      segment_t seg = segment_list[i];
      if (abs(dif_angle(normalize_angle(robot.thetae), seg.angle)) < robot.align_angle_tresh) {
        robot.led = 1;
        robot.align_index = i;
        robot.thetae = seg.angle;
        if (robot.align_index == 0) robot.xe = seg.Pi.x;
        else if (robot.align_index == 1) robot.ye = seg.Pi.y;
        break;
      }
    }
  }
}`, false, "troca x com y nos dois trocos");

check(L6, "locgen", L6.locgen.solution.replace("Ps.y = 0;", ""), false, "esquece de anular a componente perpendicular");

/* ========= 3c. REGRESSOES DO INTERPRETADOR MATLAB ========= */
console.log("\n3c) Regressões do interpretador");
(function () {
  const M = global.SAUT_MATLAB;
  function eq(src, esperado, label) {
    let got;
    try { got = M.fmt(M.run("d=2; a=4; b=6;\n" + src).get("L")); }
    catch (e) { got = "ERRO: " + e.message; }
    const good = got === esperado;
    if (!good) fails++;
    console.log(`  ${good ? "✔" : "✘"} ${label}  ->  ${got}${good ? "" : "  (esperado " + esperado + ")"}`);
  }
  /* Regra do MATLAB: dentro de [], '(' com espaco antes comeca um NOVO elemento;
     sem espaco e indexacao/chamada. Isto partia matrizes como
     [(a)/d (b)/d 0], que sao MATLAB perfeitamente valido. */
  eq("L = [(a)/d (b)/d 0];", "[2 3 0]", "[(a)/d (b)/d 0] sao tres elementos");
  eq("L = [a (b) 9];", "[4 6 9]", "[a (b) 9] sao tres elementos");
  eq("L = [sqrt(4) 7];", "[2 7]", "[sqrt(4) 7] mantem a chamada de funcao");
  eq("v=[10 20 30]; L = [v(2) 9];", "[20 9]", "[v(2) 9] mantem a indexacao");
  eq("L = [-(a)/d 1];", "[-2 1]", "unario com parentesis dentro de []");
})();

/* ================= 4. SINTAXE ================= */
console.log("\n4) Erros de sintaxe e assinatura");
check(L3, "dist2arc", "procedure Dist2Arc(xc, yc, R, xr, yr: double; var pix, piy: double)\nbegin\n  pix = R;\nend", false, "Pascal mal formado");
check(L3, "dist2arc", "procedure OutraCoisa(a,b: double);\nbegin\nend;", false, "rotina com nome errado");
check(L4, "h_model", "distp_e = sqrt((xp1-xr_e)^2 + ;", false, "MATLAB mal formado");

console.log("\n" + (fails ? "### " + fails + " TESTES FALHADOS ###" : ">>> TODOS OS TESTES DE SEMÂNTICA PASSARAM"));
process.exit(fails ? 1 : 0);
