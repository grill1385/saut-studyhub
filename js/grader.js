/* ===== SAUT StudyHub — avaliador híbrido de código =====
   Camada 1: verificação estrutural (regras derivadas da solução do professor).
   Camada 2: execução — transpila o teu código e o da solução, corre ambos nos
             mesmos casos de teste e compara os SINAIS produzidos.
   Camada 3: fallback — se o parse falhar, dá erro de sintaxe + relatório estrutural.

   O teu código NÃO precisa de ser igual ao do professor: precisa de produzir os
   mesmos sinais (velocidades das rodas, estados das máquinas, saídas por referência).
*/
(function (global) {
  "use strict";

  var P = global.SAUT_PASCAL;

  /* ---------------- utilitários ---------------- */
  function stripComments(src) {
    return String(src)
      .replace(/\{[^}]*\}/g, " ")
      .replace(/\(\*[\s\S]*?\*\)/g, " ")
      .replace(/\/\/[^\n]*/g, " ");
  }
  function normalize(src) {
    return stripComments(src).toLowerCase().replace(/\s+/g, " ");
  }
  function num(x) { return typeof x === "number" && isFinite(x); }
  function fmt(x) {
    if (Array.isArray(x)) return "[" + x.map(fmt).join(", ") + "]";
    if (typeof x === "number") return String(+x.toPrecision(6));
    if (x && typeof x === "object") return JSON.stringify(x);
    return String(x);
  }

  function close(a, b, tol, tolPct) {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (!close(a[i], b[i], tol, tolPct)) return false;
      return true;
    }
    if (num(a) && num(b)) {
      var t = tol === undefined ? 1e-6 : tol;
      if (tolPct) t = Math.max(t, Math.abs(b) * tolPct);
      return Math.abs(a - b) <= t;
    }
    if (a && b && typeof a === "object" && typeof b === "object") {
      var ka = Object.keys(b);
      for (var j = 0; j < ka.length; j++) if (!close(a[ka[j]], b[ka[j]], tol, tolPct)) return false;
      return true;
    }
    return a === b;
  }

  function deepCopy(o) {
    if (Array.isArray(o)) return o.map(deepCopy);
    if (o && typeof o === "object") { var r = {}; for (var k in o) r[k] = deepCopy(o[k]); return r; }
    return o;
  }

  /* ---------------- construção de um caso ---------------- */
  /* Um caso é {G:{}, sheet:{}, args:[...]}; a string "$RC" nos args é substituída
     por um registo TRobotControls novo, para que cada execução seja independente. */
  function makeRC(task) {
    return deepCopy(task.rc || { irobot: 0, fh: 0, ifh: 0, v: [0, 0, 0, 0], imot: [0, 1, 2, 3] });
  }

  function preludeLines(task) {
    return task.prelude ? task.prelude.split("\n").length : 0;
  }

  function buildProgram(task, src) {
    var full = (task.prelude ? task.prelude + "\n" : "") + src;
    var env = { sheet: {}, odo: [0, 0, 0, 0] };
    var b = P.build(full, { globals: task.globals || [], env: env });
    return b;
  }

  function applyCase(b, task, tc) {
    var g = Object.assign({}, task.G0 || {}, tc.G || {});
    for (var k in g) b.G[k] = deepCopy(g[k]);
    var sh = Object.assign({}, task.sheet0 || {}, tc.sheet || {});
    for (var c in sh) b.env.sheet[c] = sh[c];
    if (tc.odo) b.env.odo = tc.odo.slice();
    return (tc.args || []).map(function (a) { return a === "$RC" ? makeRC(task) : deepCopy(a); });
  }

  /* recolhe os sinais observáveis depois de uma chamada */
  function snapshot(b, task, args, ret) {
    var s = { ret: ret === undefined ? null : ret };
    (task.watch || []).forEach(function (name) { s["G." + name] = deepCopy(b.G[name]); });
    (task.watchCells || []).forEach(function (c) { s["cel(" + c + ")"] = b.env.sheet[c]; });
    args.forEach(function (a, i) {
      if (a && typeof a === "object" && a.v !== undefined) s["RC.V"] = deepCopy(a.v);
      else if (num(a) && (task.watchArgs || []).indexOf(i) >= 0) s["arg" + (i + 1)] = a;
    });
    (task.watchArgs || []).forEach(function (i) { if (num(args[i])) s["arg" + (i + 1)] = args[i]; });
    return s;
  }

  /* ---------------- execução de um caso ---------------- */
  function runCase(b, task, tc) {
    var args = applyCase(b, task, tc);
    var ret;
    b.RT.__steps = 0;
    if (tc.steps) {
      /* teste de malha fechada: simula o robô e devolve a trajetória */
      return runSim(b, task, tc, args);
    }
    var reps = tc.repeat || 1;
    var snaps = [];
    for (var r = 0; r < reps; r++) {
      ret = b.call(task.entry, args);
      snaps.push(snapshot(b, task, args, ret));
    }
    return { kind: "call", snaps: snaps };
  }

  /* simulação em malha fechada (robô omni de 4 rodas mecanum) */
  function runSim(b, task, tc, args) {
    var k = (task.L1 !== undefined ? task.L1 : 0.16) + (task.L2 !== undefined ? task.L2 : 0.30);
    var dt = tc.dt || 0.04;
    var st = { x: tc.start ? tc.start[0] : 0, y: tc.start ? tc.start[1] : 0, th: tc.start ? tc.start[2] : 0 };
    var traj = [];
    for (var i = 0; i < tc.steps; i++) {
      b.G.xodo = st.x; b.G.yodo = st.y; b.G.thodo = st.th;
      b.RT.__steps = 0;
      b.call(task.entry, args);
      var rc = args.filter(function (a) { return a && typeof a === "object" && a.v; })[0];
      if (!rc) break;
      var v = rc.v;
      var V = (v[0] + v[1] + v[2] + v[3]) / 4;
      var Vn = (-v[0] + v[1] + v[2] - v[3]) / 4;
      var W = (-v[0] + v[1] - v[2] + v[3]) / (2 * k);
      st.x += (V * Math.cos(st.th) - Vn * Math.sin(st.th)) * dt;
      st.y += (V * Math.sin(st.th) + Vn * Math.cos(st.th)) * dt;
      st.th += W * dt;
      while (st.th > Math.PI) st.th -= 2 * Math.PI;
      while (st.th < -Math.PI) st.th += 2 * Math.PI;
      if (i % (tc.sample || 25) === 0) traj.push([st.x, st.y, st.th]);
    }
    traj.push([st.x, st.y, st.th]);
    return { kind: "sim", traj: traj, final: [st.x, st.y, st.th] };
  }

  /* ---------------- comparação ---------------- */
  function compare(task, tc, got, exp) {
    var tol = tc.tol !== undefined ? tc.tol : (task.tol !== undefined ? task.tol : 1e-6);
    var tolPct = tc.tolPct !== undefined ? tc.tolPct : task.tolPct;
    if (got.kind !== exp.kind) return { ok: false, msg: "tipos de resultado diferentes" };
    if (got.kind === "sim") {
      var st = tc.tolSim !== undefined ? tc.tolSim : 0.02;
      for (var i = 0; i < exp.traj.length; i++) {
        if (!close(got.traj[i], exp.traj[i], st)) {
          return {
            ok: false,
            signal: "trajetória (passo " + (i * (tc.sample || 25)) + ")",
            got: fmt(got.traj[i]), exp: fmt(exp.traj[i])
          };
        }
      }
      if (!close(got.final, exp.final, st)) {
        return { ok: false, signal: "pose final", got: fmt(got.final), exp: fmt(exp.final) };
      }
      return { ok: true };
    }
    for (var s = 0; s < exp.snaps.length; s++) {
      var a = got.snaps[s], e = exp.snaps[s];
      for (var key in e) {
        if (e[key] === null || e[key] === undefined) continue;
        if (!close(a[key], e[key], tol, tolPct)) {
          return {
            ok: false,
            signal: key + (exp.snaps.length > 1 ? " (chamada " + (s + 1) + ")" : ""),
            got: fmt(a[key]), exp: fmt(e[key])
          };
        }
      }
    }
    return { ok: true };
  }

  /* ---------------- camada estrutural ---------------- */
  function checkRules(task, src) {
    var n = normalize(src);
    return (task.rules || []).map(function (r) {
      var found = r.re instanceof RegExp ? r.re.test(n) : n.indexOf(String(r.re).toLowerCase()) >= 0;
      var ok = r.must === false ? !found : found;
      return { ok: ok, msg: r.msg, level: r.level || "warn" };
    });
  }

  /* ---------------- API principal ---------------- */
  function grade(task, userSrc) {
    var out = { ok: false, phase: "", tests: [], rules: [], error: null, passed: 0, total: 0 };
    if (!userSrc || !userSrc.trim()) {
      out.error = "Ainda não escreveste código.";
      out.phase = "vazio";
      return out;
    }
    out.rules = checkRules(task, userSrc);

    /* --- compilação --- */
    var bu, be;
    try {
      bu = buildProgram(task, userSrc);
    } catch (err) {
      out.phase = "sintaxe";
      if (err && err.name === "PasError") {
        var ln = Math.max(1, (err.line || 0) - preludeLines(task));
        out.error = "Erro de sintaxe na linha " + ln + " do teu código — " + err.message;
      } else {
        out.error = "Não consegui interpretar o código: " + (err.message || err);
      }
      return out;
    }
    if (!bu.program.routines[task.entry.toLowerCase()]) {
      out.phase = "sintaxe";
      out.error = "Não encontrei a rotina <code>" + task.entry + "</code> no teu código. " +
        "Mantém a assinatura pedida no enunciado.";
      return out;
    }
    try {
      be = buildProgram(task, task.solution);
    } catch (err2) {
      out.phase = "interno";
      out.error = "Erro interno na solução de referência: " + err2;
      return out;
    }

    /* --- execução --- */
    out.phase = "execução";
    var cases = task.tests || [];
    out.total = cases.length;
    for (var i = 0; i < cases.length; i++) {
      var tc = cases[i], res = { name: tc.name || ("Caso " + (i + 1)), ok: false };
      var gotR, expR;
      try {
        expR = runCase(be, task, tc);
      } catch (e0) {
        res.ok = true; res.skipped = true; res.detail = "caso ignorado (erro na referência)";
        out.tests.push(res); out.passed++;
        continue;
      }
      try {
        gotR = runCase(bu, task, tc);
      } catch (e1) {
        res.detail = "o teu código rebentou em execução: " +
          (e1 && e1.name === "PasError" ? e1.toString() : (e1.message || e1));
        out.tests.push(res);
        continue;
      }
      var cmp = compare(task, tc, gotR, expR);
      if (cmp.ok) { res.ok = true; out.passed++; }
      else {
        res.signal = cmp.signal; res.got = cmp.got; res.exp = cmp.exp;
        res.detail = cmp.signal
          ? ("sinal <b>" + cmp.signal + "</b> — obtido <code>" + cmp.got + "</code>, esperado <code>" + cmp.exp + "</code>")
          : cmp.msg;
      }
      out.tests.push(res);
    }
    out.ok = out.total > 0 && out.passed === out.total;
    return out;
  }

  /* devolve uma dica adequada ao primeiro teste falhado */
  function pickHint(task, result) {
    if (result.phase === "sintaxe" || result.phase === "vazio") return null;
    /* 1º: regra estrutural crítica em falta — é a causa mais provável */
    var hard = result.rules.filter(function (r) { return !r.ok && r.level === "error"; })[0];
    if (hard) return hard.msg;
    /* 2º: dica associada ao sinal que divergiu */
    var bad = result.tests.filter(function (t) { return !t.ok; })[0];
    if (bad && bad.signal && task.signalHints) {
      for (var key in task.signalHints) {
        if (bad.signal.indexOf(key) >= 0) return task.signalHints[key];
      }
    }
    /* 3º: qualquer regra em falta */
    var soft = result.rules.filter(function (r) { return !r.ok; })[0];
    return soft ? soft.msg : null;
  }

  global.SAUT_GRADER = {
    grade: grade,
    pickHint: pickHint,
    normalize: normalize,
    _internals: { close: close, runCase: runCase, buildProgram: buildProgram }
  };
})(typeof window !== "undefined" ? window : globalThis);
