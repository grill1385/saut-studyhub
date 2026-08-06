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
["js/pascal.js", "js/matlab.js", "js/grader.js", "js/data/lab3spec.js", "js/data/lab4spec.js"]
  .forEach(f => eval(fs.readFileSync(path.join(ROOT, f), "utf8")));

const G = global.SAUT_GRADER;
const L3 = global.SAUT_LABSPEC["m3-mod6"];
const L4 = global.SAUT_LABSPEC["m4-mod7"];
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
[[L3, "Lab 3"], [L4, "Lab 4"]].forEach(([bank, nome]) => {
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

/* ================= 4. SINTAXE ================= */
console.log("\n4) Erros de sintaxe e assinatura");
check(L3, "dist2arc", "procedure Dist2Arc(xc, yc, R, xr, yr: double; var pix, piy: double)\nbegin\n  pix = R;\nend", false, "Pascal mal formado");
check(L3, "dist2arc", "procedure OutraCoisa(a,b: double);\nbegin\nend;", false, "rotina com nome errado");
check(L4, "h_model", "distp_e = sqrt((xp1-xr_e)^2 + ;", false, "MATLAB mal formado");

console.log("\n" + (fails ? "### " + fails + " TESTES FALHADOS ###" : ">>> TODOS OS TESTES DE SEMÂNTICA PASSARAM"));
process.exit(fails ? 1 : 0);
