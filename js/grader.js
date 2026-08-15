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
  var ML = global.SAUT_MATLAB;
  var CL = global.SAUT_CLIKE;

  /* ---------------- utilitários ---------------- */
  function stripComments(src, lang) {
    var s = String(src);
    if (lang === "matlab") return s.replace(/%[^\n]*/g, " ");
    if (lang === "clike") {
      /* em C as chavetas são blocos, não comentários */
      return s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
    }
    /* Pascal: { } e (* *) são comentários */
    return s.replace(/\{[^}]*\}/g, " ")
            .replace(/\(\*[\s\S]*?\*\)/g, " ")
            .replace(/\/\/[^\n]*/g, " ");
  }
  function normalize(src, lang) {
    return stripComments(src, lang).toLowerCase().replace(/\s+/g, " ");
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

  function isMatV(x) {
    return x && typeof x === "object" && typeof x.r === "number" && typeof x.c === "number" && x.d;
  }
  function matToJS(m) {
    if (m.r === 1 && m.c === 1) return m.d[0];
    var out = [];
    for (var i = 0; i < m.r; i++) { var row = []; for (var j = 0; j < m.c; j++) row.push(m.d[i * m.c + j]); out.push(row); }
    return out;
  }
  function deepCopy(o) {
    if (isMatV(o)) return matToJS(o);
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

  /* cópia para ENTRADAS: {__mat:[[...]]} é convertido numa Matrix do SimTwo */
  function deepCopyIn(o) {
    if (o && typeof o === "object" && o.__mat) return P.matFromRows(o.__mat);
    if (Array.isArray(o)) return o.map(deepCopyIn);
    if (o && typeof o === "object") { var r = {}; for (var k in o) r[k] = deepCopyIn(o[k]); return r; }
    return o;
  }

  function applyCase(b, task, tc) {
    var g = Object.assign({}, task.G0 || {}, tc.G || {});
    for (var k in g) b.G[k] = deepCopyIn(g[k]);
    if (tc.laser) {
      b.env.laser = P.matFromRows(tc.laser);
      b.G.laservalues = P.matFromRows(tc.laser);
    }
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

  /* ================================================================
     Runner MATLAB — o utilizador escreve um FRAGMENTO que é inserido
     no marcador %%USER%% do harness da tarefa. Depois de correr,
     lêem-se as variáveis de task.capture do workspace.
     ================================================================ */
  function harnessPrefixLines(task) {
    var i = task.harness.indexOf("%%USER%%");
    return i < 0 ? 0 : task.harness.slice(0, i).split("\n").length - 1;
  }

  function runMatlab(task, src, tc) {
    var code = task.harness.replace("%%USER%%", src);
    var ws = new ML.Workspace({ seed: task.seed || 20260806, maxSteps: task.maxSteps || 4000000 });
    var set = Object.assign({}, task.set0 || {}, tc.set || {});
    for (var k in set) ws.set(k, ML.fromJS(set[k]));
    ML.run(code, { ws: ws });
    var cap = {};
    (task.capture || []).forEach(function (n) {
      var v = ws.get(n);
      cap[n] = v === undefined ? undefined : ML.toJS(v);
    });
    return { kind: "vars", cap: cap, ws: ws };
  }

  function compareVars(task, tc, got, exp) {
    var tol = tc.tol !== undefined ? tc.tol : (task.tol !== undefined ? task.tol : 1e-8);
    var tolPct = tc.tolPct !== undefined ? tc.tolPct : task.tolPct;
    var names = task.capture || [];
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      if (exp.cap[n] === undefined) continue;
      if (got.cap[n] === undefined) {
        return { ok: false, signal: n, got: "(não definida)", exp: fmt(exp.cap[n]) };
      }
      var a = got.cap[n], b = exp.cap[n];
      if (Array.isArray(a) !== Array.isArray(b) ||
          (Array.isArray(a) && Array.isArray(b) && (a.length !== b.length ||
           (Array.isArray(a[0]) && a[0].length !== b[0].length)))) {
        return { ok: false, signal: n, got: dimOf(a), exp: dimOf(b) };
      }
      if (!close(a, b, tol, tolPct)) return { ok: false, signal: n, got: fmt(a), exp: fmt(b) };
    }
    return { ok: true };
  }

  function dimOf(v) {
    if (!Array.isArray(v)) return "escalar";
    if (!Array.isArray(v[0])) return "1x" + v.length;
    return v.length + "x" + v[0].length;
  }

  function gradeMatlab(task, userSrc, out) {
    if (!ML) { out.phase = "interno"; out.error = "Falta carregar js/matlab.js."; return out; }
    /* sintaxe */
    try {
      ML.parse(task.harness.replace("%%USER%%", userSrc));
    } catch (e) {
      out.phase = "sintaxe";
      var ln = Math.max(1, (e.line || 0) - harnessPrefixLines(task));
      out.error = "Erro de sintaxe na linha " + ln + " do teu código — " + (e.message || e);
      return out;
    }
    out.phase = "execução";
    var cases = task.tests || [];
    out.total = cases.length;
    for (var i = 0; i < cases.length; i++) {
      var tc = cases[i], res = { name: tc.name || ("Caso " + (i + 1)), ok: false };
      var gotR;
      try { gotR = runMatlab(task, userSrc, tc); }
      catch (e1) {
        res.detail = "o teu código rebentou em execução: " +
          (e1 && e1.name === "MlError"
            ? ("linha " + Math.max(1, (e1.line || 0) - harnessPrefixLines(task)) + " — " + e1.message)
            : (e1.message || e1));
        out.tests.push(res); continue;
      }
      if (tc.kind === "assert") {
        var verdict;
        try { verdict = tc.check(gotR.cap, gotR.ws); }
        catch (e2) { verdict = "erro ao avaliar o critério: " + e2; }
        if (verdict === true) { res.ok = true; out.passed++; }
        else { res.detail = typeof verdict === "string" ? verdict : (tc.why || "critério não satisfeito"); res.signal = tc.signal || ""; }
        out.tests.push(res); continue;
      }
      var expR;
      try { expR = runMatlab(task, task.solution, tc); }
      catch (e3) {
        out.phase = "interno";
        out.error = "A solução de referência falhou no caso \"" + res.name + "\": " + (e3.message || e3) +
          ". Isto é um defeito da especificação da labwork, não do teu código.";
        out.ok = false;
        return out;
      }
      var cmp = compareVars(task, tc, gotR, expR);
      if (cmp.ok) { res.ok = true; out.passed++; }
      else {
        res.signal = cmp.signal;
        res.detail = "variável <b>" + cmp.signal + "</b> — obtido <code>" + cmp.got + "</code>, esperado <code>" + cmp.exp + "</code>";
      }
      out.tests.push(res);
    }
    out.ok = out.total > 0 && out.passed === out.total;
    return out;
  }

  /* ================================================================
     Runner C/C++ (Lab 6/7). Dois tipos de caso:
       - kind:"track"  simula o robô sobre a pista e avalia por critério
       - normal        chama a função e compara os campos de task.capture
     ================================================================ */
  function mockVec2f(x, y) {
    return {
      x: x || 0, y: y || 0,
      set: function (a, b) { this.x = a; this.y = b; },
      distance: function (o) { return Math.hypot(this.x - o.x, this.y - o.y); }
    };
  }
  function mockH(angle, dx, dy) {
    var H = { theta: angle || 0, tx: dx || 0, ty: dy || 0 };
    H.ct = Math.cos(H.theta); H.st = Math.sin(H.theta);
    H.apply = function (P, y2) {
      var px = (y2 === undefined) ? P.x : P, py = (y2 === undefined) ? P.y : y2;
      return mockVec2f(this.ct * px - this.st * py + this.tx,
                       this.st * px + this.ct * py + this.ty);
    };
    H.apply_inv = function (P, y2) {
      var px = (y2 === undefined) ? P.x : P, py = (y2 === undefined) ? P.y : y2;
      var dx2 = px - this.tx, dy2 = py - this.ty;
      return mockVec2f(this.ct * dx2 + this.st * dy2, -this.st * dx2 + this.ct * dy2);
    };
    H.inverse = function () {
      var h = mockH(-this.theta, 0, 0);
      h.tx = -(this.ct * this.tx + this.st * this.ty);
      h.ty = -(-this.st * this.tx + this.ct * this.ty);
      return h;
    };
    H.set = function (a, b, c) { this.theta = a; this.tx = b; this.ty = c; this.ct = Math.cos(a); this.st = Math.sin(a); };
    return H;
  }
  function mockSegment(xi, yi, xf, yf) {
    var S = { Pi: mockVec2f(xi, yi), Pf: mockVec2f(xf, yf) };
    S.refresh = function () {
      this.angle = Math.atan2(this.Pf.y - this.Pi.y, this.Pf.x - this.Pi.x);
      this.dist = this.Pi.distance(this.Pf);
    };
    S.set_points = function (a, b, c, d) { this.Pi.set(a, b); this.Pf.set(c, d); this.refresh(); };
    S.refresh();
    return S;
  }
  function mockList(arr) {
    return { __a: arr, size: function () { return this.__a.length; },
             get: function (i) { return this.__a[i]; },
             set: function (i, v) { this.__a[i] = v; },
             push: function (v) { this.__a.push(v); } };
  }

  function baseNatives(task, extra) {
    var n = {
      PI: Math.PI, TWO_PI: 2 * Math.PI, HALF_PI: Math.PI / 2,
      abs: Math.abs, fabs: Math.abs, sqrt: Math.sqrt, pow: Math.pow,
      sin: Math.sin, cos: Math.cos, tan: Math.tan, atan: Math.atan, atan2: Math.atan2,
      exp: Math.exp, log: Math.log, floor: Math.floor, ceil: Math.ceil,
      fmod: function (a, b) { return a % b; },
      max: Math.max, min: Math.min, round: Math.round,
      radians: function (d) { return d * Math.PI / 180; },
      degrees: function (r) { return r * 180 / Math.PI; },
      sqr: function (x) { return x * x; },
      sign: function (x) { return x > 0 ? 1 : (x < 0 ? -1 : 0); },
      norm: function (x, y) { return Math.hypot(x, y); },
      dist: function (a, b, c, d) { return Math.hypot(c - a, d - b); },
      normalize_angle: function (a) {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a <= -Math.PI) a += 2 * Math.PI;
        return a;
      },
      "new Vec2f": function (a) { return mockVec2f(a[0], a[1]); },
      "new htransf_2d_t": function (a) { return mockH(a[0], a[1], a[2]); },
      "new segment_t": function (a) { return mockSegment(a[0], a[1], a[2], a[3]); }
    };
    n.dif_angle = function (a, b) { return n.normalize_angle(n.normalize_angle(a) - n.normalize_angle(b)); };
    /* lista de troços exatamente como o fill_track_segment_list() do firmware */
    n.segment_list = mockList([
      mockSegment(-0.23, -0.145, 0.23, -0.145),
      mockSegment(0.23, -0.08, 0.23, 0.12),
      mockSegment(0.197, 0.165, 0.0, 0.0),
      mockSegment(0.0, 0.0, -0.197, 0.165),
      mockSegment(-0.23, 0.12, -0.23, -0.08)
    ]);
    n.w_list = mockList([]);
    for (var k in (task.natives || {})) n[k] = task.natives[k];
    for (var k2 in (extra || {})) n[k2] = extra[k2];
    return n;
  }

  var CTYPES = { action_t: 1, robot_t: 1, segment_t: 1, Vec2f: 1, htransf_2d_t: 1,
                 float_list_t: 1, IRLine_t: 1 };

  function newRobot(over) {
    var r = {
      v_req: 0, w_req: 0, xe: 0, ye: 0, thetae: 0,
      prev_xe: 0, prev_ye: 0, prev_thetae: 0,
      mean_abs_w: 0, prev_mean_abs_w: 0, mean_abs_w_tresh: 0.5,
      align_angle_tresh: 0.15, align_index: -1, led: 0, dt: 0.04, dtheta: 0,
      IRLine: { found_center: false, pos_center: 0, found_center_digital: false, pos_center_digital: 0 }
    };
    for (var k in (over || {})) {
      if (k === "IRLine") { for (var j in over[k]) r.IRLine[j] = over[k][j]; }
      else r[k] = over[k];
    }
    return r;
  }

  function buildC(task, src, extraNat) {
    var full = (task.prelude ? task.prelude + "\n" : "") + src;
    var nat = baseNatives(task, extraNat);
    var it = CL.build(full, { natives: nat, types: CTYPES });
    return { it: it, nat: nat };
  }

  function gradeC(task, userSrc, out) {
    if (!CL) { out.phase = "interno"; out.error = "Falta carregar js/clike.js."; return out; }
    try {
      CL.parse((task.prelude ? task.prelude + "\n" : "") + userSrc, CTYPES);
    } catch (e) {
      out.phase = "sintaxe";
      var ln = Math.max(1, (e.line || 0) - preludeLines(task));
      out.error = "Erro de sintaxe na linha " + ln + " do teu código — " + (e.message || e);
      return out;
    }
    out.phase = "execução";
    var cases = task.tests || [];
    out.total = cases.length;
    for (var i = 0; i < cases.length; i++) {
      var tc = cases[i], res = { name: tc.name || ("Caso " + (i + 1)), ok: false };
      try {
        if (tc.kind === "track") {
          var TS = global.SAUT_TRACK;
          var robot = newRobot(tc.robot);
          var b = buildC(task, userSrc, Object.assign({ robot: robot }, tc.vars || {}));
          if (!b.it.hasFunc(task.entry)) {
            out.phase = "sintaxe";
            out.error = "Não encontrei a função <code>" + task.entry + "</code> no teu código. Mantém a assinatura pedida.";
            return out;
          }
          var r = TS.simulate(function () { b.it.call(task.entry, []); }, robot, tc.sim || {});
          var verdict = tc.check(r, robot);
          if (verdict === true) { res.ok = true; out.passed++; }
          else res.detail = typeof verdict === "string" ? verdict : "critério não satisfeito";
        } else {
          var rb = newRobot(tc.robot);
          var bb = buildC(task, userSrc, Object.assign({ robot: rb }, tc.vars || {}));
          if (!bb.it.hasFunc(task.entry)) {
            out.phase = "sintaxe";
            out.error = "Não encontrei a função <code>" + task.entry + "</code> no teu código. Mantém a assinatura pedida.";
            return out;
          }
          var args = (tc.args || []).map(function (a) { return a === "$ROBOT" ? rb : a; });
          bb.it.call(task.entry, args);
          if (tc.check) {
            var v2 = tc.check(rb, bb.nat);
            if (v2 === true) { res.ok = true; out.passed++; }
            else res.detail = typeof v2 === "string" ? v2 : "critério não satisfeito";
          } else {
            /* comparação com a referência */
            var rr = newRobot(tc.robot);
            var br = buildC(task, task.solution, Object.assign({ robot: rr }, tc.vars || {}));
            br.it.call(task.entry, (tc.args || []).map(function (a) { return a === "$ROBOT" ? rr : a; }));
            var bad = null;
            (task.capture || []).forEach(function (f) {
              if (bad) return;
              if (!close(rb[f], rr[f], tc.tol !== undefined ? tc.tol : (task.tol || 1e-6), task.tolPct)) {
                bad = { signal: f, got: fmt(rb[f]), exp: fmt(rr[f]) };
              }
            });
            if (!bad) { res.ok = true; out.passed++; }
            else {
              res.signal = bad.signal;
              res.detail = "campo <b>robot." + bad.signal + "</b> — obtido <code>" + bad.got +
                           "</code>, esperado <code>" + bad.exp + "</code>";
            }
          }
        }
      } catch (e1) {
        res.detail = "o teu código rebentou em execução: " +
          (e1 && e1.name === "CError" ? e1.toString() : (e1.message || e1));
      }
      out.tests.push(res);
    }
    out.ok = out.total > 0 && out.passed === out.total;
    return out;
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
    var n = normalize(src, task.lang || "pascal");
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

    var lang = task.lang || "pascal";
    if (lang === "matlab") return gradeMatlab(task, userSrc, out);
    if (lang === "clike") return gradeC(task, userSrc, out);

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
      if (tc.kind === "assert") {
        var capP;
        try {
          runCase(bu, task, tc);
          capP = {};
          (task.watch || []).concat(task.captureG || []).forEach(function (n) { capP[n] = deepCopy(bu.G[n]); });
        } catch (ea) {
          res.detail = "o teu código rebentou em execução: " +
            (ea && ea.name === "PasError" ? ea.toString() : (ea.message || ea));
          out.tests.push(res); continue;
        }
        var verdictP;
        try { verdictP = tc.check(capP, bu); }
        catch (eb) { verdictP = "erro ao avaliar o critério: " + eb; }
        if (verdictP === true) { res.ok = true; out.passed++; }
        else res.detail = typeof verdictP === "string" ? verdictP : (tc.why || "critério não satisfeito");
        out.tests.push(res); continue;
      }
      try {
        expR = runCase(be, task, tc);
      } catch (e0) {
        out.phase = "interno";
        out.error = "A solução de referência falhou no caso \"" + res.name + "\": " +
          (e0 && e0.name === "PasError" ? e0.toString() : (e0.message || e0)) +
          ". Isto é um defeito da especificação da labwork, não do teu código.";
        out.ok = false;
        return out;
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
