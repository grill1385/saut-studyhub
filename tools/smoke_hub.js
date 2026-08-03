/* Smoke test do hub com jsdom: renderiza a Labwork 3 e exercita o avaliador na UI. */
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "outside-only", url: "file:///hub/index.html", pretendToBeVisual: true });
const w = dom.window;
w.confirm = () => true;

/* localStorage simples */
const store = {};
Object.defineProperty(w, "localStorage", {
  value: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, clear: () => { for (const k in store) delete store[k]; } },
  configurable: true
});

const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
let fails = 0;
function ok(cond, msg) { console.log((cond ? "  ✔ " : "  ✘ ") + msg); if (!cond) fails++; }

console.log("Scripts carregados pelo index.html:");
for (const s of scripts) {
  const p = path.join(ROOT, s);
  if (!fs.existsSync(p)) { console.log("  ✘ EM FALTA: " + s); fails++; continue; }
  try { w.eval(fs.readFileSync(p, "utf8")); }
  catch (e) { console.log("  ✘ ERRO em " + s + ": " + e.message); fails++; }
}
console.log("  (" + scripts.length + " ficheiros)\n");

console.log("Estrutura de dados:");
const m3 = w.SAUT_CONTENT["m3"];
ok(!!m3, "m3 existe");
const lab = m3.modules.find(x => x.id === "m3-mod6");
ok(!!lab, "módulo m3-mod6 presente");
ok(lab.title.indexOf("código avaliado") > 0, "título substituído pela versão nova");
const evals = lab.pages.filter(p => p.kind === "codeeval");
ok(evals.length === 7, "7 sub-tarefas de código avaliado (obtidas: " + evals.length + ")");
const spec = w.SAUT_LABSPEC["m3-mod6"];
ok(!!spec, "spec da labwork carregada");
evals.forEach(p => ok(!!spec[p.task], "spec existe para a tarefa '" + p.task + "'"));
ok(m3.modules.length === 6, "m3 mantém os 6 módulos (obtidos: " + m3.modules.length + ")");
console.log("");

console.log("Renderização da vista de módulo:");
w.location.hash = "#/m3/mod/m3-mod6";
w.dispatchEvent(new w.Event("hashchange"));
const app = w.document.querySelector("#app");
ok(app.innerHTML.length > 500, "página renderizada (" + app.innerHTML.length + " chars)");
ok(/Labwork 3/.test(app.innerHTML), "título da labwork visível");

/* navegar até à sub-tarefa MotorVel (página 1) */
const dots = app.querySelectorAll(".pdot");
ok(dots.length === lab.pages.length, "indicadores de página = " + lab.pages.length);
dots[1].dispatchEvent(new w.Event("click"));
let ta = w.document.querySelector("textarea.code-eval");
ok(!!ta, "textarea de código presente na sub-tarefa MotorVel");
ok(/Avaliar código/.test(w.document.querySelector("#app").innerHTML), "botão de avaliação presente");
ok(!/Ver solução do professor/.test(w.document.querySelector("#app").innerHTML), "solução ainda bloqueada (0 tentativas)");
console.log("");

console.log("Avaliação através da UI:");
function clickEval() {
  const btn = w.document.querySelector(".q-eval");
  btn.onclick();
  return new Promise(r => setTimeout(r, 60));
}
(async () => {
  /* 1) código errado */
  ta = w.document.querySelector("textarea.code-eval");
  ta.value = "procedure MotorVel(V, Vn, W: double; var RC: TRobotControls);\nbegin\n  RC.V[0] := V;\n  RC.V[1] := V;\n  RC.V[2] := V;\n  RC.V[3] := V;\nend;";
  await clickEval();
  let body = w.document.querySelector("#app").innerHTML;
  ok(/testes\.<\/b>|de \d+ testes/.test(body), "relatório de testes apresentado");
  ok(/✘/.test(body), "código errado reprovado");
  ok(/💡/.test(body), "dica mostrada após falhar");

  /* 2) mais duas tentativas -> desbloqueia solução */
  await clickEval(); await clickEval();
  body = w.document.querySelector("#app").innerHTML;
  ok(/Ver solução do professor/.test(body), "solução desbloqueada após 3 tentativas");

  /* 3) solução equivalente (escrita de outra forma) deve passar */
  ta = w.document.querySelector("textarea.code-eval");
  ta.value = `procedure MotorVel(V, Vn, W: double; var RC: TRobotControls);
var a, b, c: double;
begin
  a := V  * GetRCValue(14,6);
  b := Vn * GetRCValue(15,6);
  c := W  * GetRCValue(16,6) * (L1nom + L2nom) / 2;
  RC.V[0] := a - b - c;
  RC.V[1] := a + b + c;
  RC.V[2] := a + b - c;
  RC.V[3] := a - b + c;
end;`;
  await clickEval();
  body = w.document.querySelector("#app").innerHTML;
  ok(/Passou nos \d+ testes/.test(body), "solução equivalente aprovada");

  /* 4) persistência */
  const st = JSON.parse(store["saut_progress_v1"]);
  const q = st.milestones.m3.modules["m3-mod6"].quiz["p1q0"];
  ok(q && q.ok === true, "progresso guardado (ok=true)");
  ok(q.tries === 4, "contador de tentativas correto (" + q.tries + ")");
  ok(!!st.milestones.m3.codeTasks.motorvel, "código do utilizador persistido");

  /* 5) todas as tarefas: a solução do professor tem de passar pela UI/grader */
  console.log("\nOráculo — solução do professor em cada tarefa:");
  Object.keys(spec).forEach(id => {
    const r = w.SAUT_GRADER.grade(spec[id], spec[id].solution);
    ok(r.ok, id + " → " + r.passed + "/" + r.total + " testes");
  });

  console.log("\n" + (fails ? "### " + fails + " VERIFICAÇÕES FALHADAS ###" : ">>> TODAS AS VERIFICAÇÕES PASSARAM"));
  process.exit(fails ? 1 : 0);
})();
