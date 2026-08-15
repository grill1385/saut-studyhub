/* Smoke test do hub com jsdom.
   Cobre: carregamento de todos os scripts, renderização de todas as vistas,
   o fluxo de avaliação de código na UI (Pascal e MATLAB), e o "oráculo"
   (a solução do professor tem de passar em todas as tarefas das labworks).

   Uso:  npm install jsdom   &&   node tools/smoke_hub.js
*/
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "outside-only", url: "file:///hub/index.html", pretendToBeVisual: true });
const w = dom.window;
w.confirm = () => true;

const store = {};
Object.defineProperty(w, "localStorage", {
  value: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; }
  },
  configurable: true
});

let fails = 0;
const ok = (c, m) => { console.log((c ? "  ✔ " : "  ✘ ") + m); if (!c) fails++; };
const section = t => console.log("\n" + t);

/* ------------------------------------------------ carregamento */
section("Scripts do index.html");
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const s of scripts) {
  const p = path.join(ROOT, s);
  if (!fs.existsSync(p)) { console.log("  ✘ EM FALTA: " + s); fails++; continue; }
  try { w.eval(fs.readFileSync(p, "utf8")); }
  catch (e) { console.log("  ✘ ERRO em " + s + ": " + e.message); fails++; }
}
ok(true, scripts.length + " ficheiros carregados");

/* ------------------------------------------------ estrutura */
section("Estrutura das labworks avaliadas");
const LABS = [
  { ms: "m3", mod: "m3-mod6" },
  { ms: "m4", mod: "m4-mod7" },
  { ms: "m5", mod: "m5-mod6" },
  { ms: "m7", mod: "m7-mod3" }
];
for (const L of LABS) {
  const mods = (w.SAUT_CONTENT[L.ms] || { modules: [] }).modules;
  const mod = mods.find(x => x.id === L.mod);
  ok(!!mod, L.mod + " presente");
  if (!mod) continue;
  const evals = mod.pages.filter(p => p.kind === "codeeval");
  const spec = w.SAUT_LABSPEC[L.mod] || {};
  ok(!!w.SAUT_LABSPEC[L.mod], "spec de " + L.mod + " carregada");
  ok(evals.length > 0, `${L.mod}: ${evals.length} sub-tarefas de código avaliado`);
  /* consistência nos dois sentidos: nenhuma página sem spec, nenhuma spec órfã */
  evals.forEach(p => ok(!!spec[p.task], `  página → spec: '${p.task}'`));
  const used = evals.map(p => p.task);
  Object.keys(spec).forEach(id => ok(used.indexOf(id) >= 0, `  spec → página: '${id}' está a ser usada`));
}

/* ------------------------------------------------ vistas */
section("Renderização de todas as vistas");
store["saut_progress_v1"] = JSON.stringify({ activeMilestone: "m0", freeMode: true, milestones: {} });
const views = ["#/", "#/stats", "#/graph"];
w.SAUT_META.forEach(m => {
  views.push("#/" + m.id);
  ((w.SAUT_CONTENT[m.id] || { modules: [] }).modules).forEach(mo => views.push("#/" + m.id + "/mod/" + mo.id));
});
let bad = 0;
views.forEach(v => {
  try {
    w.location.hash = v;
    w.dispatchEvent(new w.Event("hashchange"));
    if (w.document.querySelector("#app").innerHTML.length < 200) { console.log("  ✘ vista vazia: " + v); bad++; }
  } catch (e) { console.log("  ✘ ERRO em " + v + ": " + e.message); bad++; }
});
ok(bad === 0, views.length + " vistas renderizam sem erro");

/* ------------------------------------------------ fluxo na UI */
const app = () => w.document.querySelector("#app").innerHTML;
const wait = () => new Promise(r => setTimeout(r, 80));
async function submit(txt) {
  w.document.querySelector("textarea.code-eval").value = txt;
  w.document.querySelector(".q-eval").onclick();
  await wait();
}
function goto(hash, dot) {
  w.location.hash = hash;
  w.dispatchEvent(new w.Event("hashchange"));
  w.document.querySelectorAll(".pdot")[dot].dispatchEvent(new w.Event("click"));
}

section("Fluxo de avaliação na UI (Labwork 3 — Pascal, MotorVel)");
goto("#/m3/mod/m3-mod6", 1);
ok(!!w.document.querySelector("textarea.code-eval"), "editor de código presente");
ok(!/Ver solução do professor/.test(app()), "solução bloqueada com 0 tentativas");

(async () => {
  await submit("procedure MotorVel(V, Vn, W: double; var RC: TRobotControls);\nbegin\n  RC.V[0] := V;\n  RC.V[1] := V;\n  RC.V[2] := V;\n  RC.V[3] := V;\nend;");
  ok(/✘/.test(app()), "código errado reprovado com relatório");
  ok(/💡/.test(app()), "dica apresentada");
  await submit("procedure MotorVel(V, Vn, W: double; var RC: TRobotControls);\nbegin\n  RC.V[0] := V;\nend;");
  await submit("procedure MotorVel(V, Vn, W: double; var RC: TRobotControls);\nbegin\n  RC.V[0] := V;\nend;");
  ok(/Ver solução do professor/.test(app()), "solução desbloqueia às 3 tentativas");
  await submit(`procedure MotorVel(V, Vn, W: double; var RC: TRobotControls);
var a, b, c: double;
begin
  a := V  * GetRCValue(14,6);
  b := Vn * GetRCValue(15,6);
  c := W  * GetRCValue(16,6) * (L1nom + L2nom) / 2;
  RC.V[0] := a - b - c;
  RC.V[1] := a + b + c;
  RC.V[2] := a + b - c;
  RC.V[3] := a - b + c;
end;`);
  ok(/Passou nos \d+ testes/.test(app()), "implementação equivalente aprovada");
  const st = JSON.parse(store["saut_progress_v1"]);
  ok(st.milestones.m3.modules["m3-mod6"].quiz["p1q0"].ok === true, "progresso persistido");
  ok(!!st.milestones.m3.codeTasks.motorvel, "código do utilizador persistido");

  section("Fluxo de avaliação na UI (Labwork 4 — MATLAB, modelo de movimento)");
  goto("#/m4/mod/m4-mod7", 1);
  ok(!!w.document.querySelector("textarea.code-eval"), "editor de código MATLAB presente");
  await submit("xr_e = xr_e + v*dt*cos(theta_r_e);\nyr_e = yr_e + v*dt*sin(theta_r_e);\ntheta_r_e = theta_r_e + omega*dt;");
  ok(/✘/.test(app()), "fragmento MATLAB errado reprovado");
  await submit(`a = theta_r_e + omega*dt/2;
xr_e = xr_e + v*dt*cos(a);
yr_e = yr_e + v*dt*sin(a);
theta_r_e = NormalizeAng(theta_r_e + omega*dt);`);
  ok(/Passou nos \d+ testes/.test(app()), "fragmento MATLAB equivalente aprovado");

  section("Fluxo de avaliação na UI (Labwork 5 — Pascal/SimTwo, odometria diferencial)");
  goto("#/m5/mod/m5-mod6", 1);
  ok(!!w.document.querySelector("textarea.code-eval"), "editor de código presente");
  await submit(`procedure predictPosition(odo1, odo2: double);
var d, delta_theta: double;
begin
  d := (odo1+odo2) * ToMetres;
  delta_theta := (odo2-odo1)* ToMetres/WheelDist;
  x := x + d*cos(theta);
  y := y + d*sin(theta);
  theta := theta + delta_theta;
end;`);
  ok(/✘/.test(app()), "odometria errada reprovada");
  await submit(`procedure predictPosition(odo1, odo2: double);
var dEsq, dDir, d, dth: double;
begin
  dEsq := odo1 * ToMetres;
  dDir := odo2 * ToMetres;
  d   := (dEsq + dDir) / 2;
  dth := (dDir - dEsq) / WheelDist;
  x := x + d*cos(theta + dth/2);
  y := y + d*sin(theta + dth/2);
  theta := NormalizeAngle(theta + dth);
end;`);
  ok(/Passou nos \d+ testes/.test(app()), "odometria equivalente aprovada");

  section("Oráculo — a solução do professor passa em todas as tarefas");
  for (const L of LABS) {
    const spec = w.SAUT_LABSPEC[L.mod];
    Object.keys(spec).forEach(id => {
      const r = w.SAUT_GRADER.grade(spec[id], spec[id].solution);
      ok(r.ok, `${L.mod}/${id} → ${r.passed}/${r.total}`);
    });
  }

  console.log("\n" + (fails ? "### " + fails + " VERIFICAÇÕES FALHADAS ###" : ">>> TODAS AS VERIFICAÇÕES PASSARAM"));
  process.exit(fails ? 1 : 0);
})();
