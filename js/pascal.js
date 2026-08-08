/* ===== SAUT StudyHub — mini-transpilador Pascal (subconjunto SimTwo) -> JavaScript =====
   Objetivo: correr o código do utilizador escrito na sintaxe do SimTwo e comparar
   os SINAIS produzidos com os da solução de referência (o .pas do professor),
   em vez de comparar texto. Sem dependências externas; funciona em file://.

   Cobertura da gramática:
     const / var / type(ignorado) / procedure / function (com parâmetros var)
     begin..end, if..then..else, case..of..else..end, for..to/downto..do,
     while..do, repeat..until, atribuição :=, chamadas, arrays, records,
     expressões com and/or/not/div/mod/xor/shl/shr e comparações.
   Case-insensitive (como Pascal): tudo é normalizado para minúsculas.
*/
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Erros                                                               */
  /* ------------------------------------------------------------------ */
  function PasError(msg, line) {
    this.name = "PasError";
    this.message = msg;
    this.line = line || 0;
  }
  PasError.prototype = Object.create(Error.prototype);
  PasError.prototype.toString = function () {
    return "Linha " + this.line + ": " + this.message;
  };

  /* ------------------------------------------------------------------ */
  /* Lexer                                                               */
  /* ------------------------------------------------------------------ */
  var KEYWORDS = {};
  ("and array begin case const div do downto else end file for function goto if implementation in interface " +
   "label mod nil not of or packed procedure program record repeat set shl shr string then to type unit until " +
   "uses var while with xor").split(" ").forEach(function (k) { KEYWORDS[k] = 1; });

  function lex(src) {
    var T = [], i = 0, line = 1, n = src.length;
    function isDigit(c) { return c >= "0" && c <= "9"; }
    function isAlpha(c) { return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_"; }
    while (i < n) {
      var c = src[i];
      if (c === "\n") { line++; i++; continue; }
      if (c === " " || c === "\t" || c === "\r") { i++; continue; }
      if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
      if (c === "{") { i++; while (i < n && src[i] !== "}") { if (src[i] === "\n") line++; i++; } i++; continue; }
      if (c === "(" && src[i + 1] === "*") {
        i += 2;
        while (i < n && !(src[i] === "*" && src[i + 1] === ")")) { if (src[i] === "\n") line++; i++; }
        i += 2; continue;
      }
      if (isDigit(c)) {
        var j = i;
        while (j < n && isDigit(src[j])) j++;
        if (src[j] === "." && isDigit(src[j + 1])) { j++; while (j < n && isDigit(src[j])) j++; }
        if (src[j] === "e" || src[j] === "E") {
          var k = j + 1;
          if (src[k] === "+" || src[k] === "-") k++;
          if (isDigit(src[k])) { j = k; while (j < n && isDigit(src[j])) j++; }
        }
        T.push({ t: "num", v: parseFloat(src.slice(i, j)), line: line }); i = j; continue;
      }
      if (c === "$") {
        var j2 = i + 1;
        while (j2 < n && /[0-9a-fA-F]/.test(src[j2])) j2++;
        T.push({ t: "num", v: parseInt(src.slice(i + 1, j2), 16), line: line }); i = j2; continue;
      }
      if (isAlpha(c)) {
        var j3 = i;
        while (j3 < n && (isAlpha(src[j3]) || isDigit(src[j3]))) j3++;
        var w = src.slice(i, j3), lw = w.toLowerCase();
        T.push({ t: KEYWORDS[lw] ? "kw" : "id", v: lw, raw: w, line: line });
        i = j3; continue;
      }
      if (c === "'") {
        var j4 = i + 1, s = "";
        while (j4 < n) {
          if (src[j4] === "'") {
            if (src[j4 + 1] === "'") { s += "'"; j4 += 2; } else { j4++; break; }
          } else { if (src[j4] === "\n") line++; s += src[j4]; j4++; }
        }
        T.push({ t: "str", v: s, line: line }); i = j4; continue;
      }
      var two = src.substr(i, 2);
      if (two === ":=" || two === "<=" || two === ">=" || two === "<>" || two === "..") {
        T.push({ t: "op", v: two, line: line }); i += 2; continue;
      }
      if ("+-*/()[].,;:=<>^@".indexOf(c) >= 0) { T.push({ t: "op", v: c, line: line }); i++; continue; }
      throw new PasError("carácter inesperado '" + c + "'", line);
    }
    T.push({ t: "eof", v: "", line: line });
    return T;
  }

  /* ------------------------------------------------------------------ */
  /* Runtime (API SimTwo mockada + matemática Pascal)                     */
  /* ------------------------------------------------------------------ */
  /* Matriz partilhada com o js/matlab.js quando disponível (mesma representação:
     row-major com {r, c, d}), para o avaliador poder comparar valores. */
  function newMat(r, c) {
    var ML = global.SAUT_MATLAB;
    if (ML && ML.Mat) return new ML.Mat(r, c);
    return { r: r, c: c, d: new Float64Array(r * c) };
  }
  function isMatV(x) { return x && typeof x === "object" && typeof x.r === "number" && typeof x.c === "number" && x.d; }
  function ewMat(A, B, f, nome) {
    if (typeof B === "number") { var S = newMat(A.r, A.c); for (var q = 0; q < A.d.length; q++) S.d[q] = f(A.d[q], B); return S; }
    if (typeof A === "number") { var S2 = newMat(B.r, B.c); for (var q2 = 0; q2 < B.d.length; q2++) S2.d[q2] = f(A, B.d[q2]); return S2; }
    if (A.r !== B.r || A.c !== B.c)
      throw new PasError(nome + ": dimensões incompatíveis (" + A.r + "x" + A.c + " e " + B.r + "x" + B.c + ")", 0);
    var R = newMat(A.r, A.c);
    for (var i = 0; i < A.d.length; i++) R.d[i] = f(A.d[i], B.d[i]);
    return R;
  }

  function makeRuntime(env) {
    env = env || {};
    var sheet = env.sheet || (env.sheet = {});
    var log = env.log || (env.log = []);
    var RT = {
      __steps: 0,
      __tick: function () {
        if (++RT.__steps > 4000000) throw new PasError("execução demasiado longa (ciclo infinito?)", 0);
      },
      /* --- matemática --- */
      pi: Math.PI,
      sin: Math.sin, cos: Math.cos, tan: Math.tan,
      arctan: Math.atan,
      arctan2: Math.atan2, atan2: Math.atan2,
      exp: Math.exp, ln: Math.log,
      sqrt: function (x) { return Math.sqrt(x); },
      sqr: function (x) { return x * x; },
      abs: Math.abs,
      power: Math.pow,
      round: function (x) { return Math.round(x); },
      trunc: function (x) { return Math.trunc(x); },
      int: function (x) { return Math.trunc(x); },
      frac: function (x) { return x - Math.trunc(x); },
      floor: Math.floor, ceil: Math.ceil,
      max: function (a, b) { return Math.max(a, b); },
      min: function (a, b) { return Math.min(a, b); },
      sign: function (x) { return x > 0 ? 1 : (x < 0 ? -1 : 0); },
      deg: function (r) { return r * 180 / Math.PI; },
      rad: function (d) { return d * Math.PI / 180; },
      hypot: function (a, b) { return Math.sqrt(a * a + b * b); },
      dist: function (a, b) { return Math.sqrt(a * a + b * b); },
      normalizeangle: function (a) {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
      },
      /* --- strings --- */
      format: function (f, args) {
        args = args || [];
        var i = 0;
        return String(f).replace(/%[-+ #0]*\d*(?:\.\d+)?[difgeEsxX]/g, function (m) {
          var v = args[i++];
          if (/[dix]$/i.test(m)) return String(Math.round(Number(v)));
          if (/s$/.test(m)) return String(v);
          var mm = /\.(\d+)/.exec(m);
          if (mm && /g$/.test(m)) return String(Number(Number(v).toPrecision(+mm[1])));
          if (mm) return Number(v).toFixed(+mm[1]);
          return String(v);
        });
      },
      inttostr: function (x) { return String(Math.round(x)); },
      floattostr: function (x) { return String(x); },
      strtofloat: function (s) { return parseFloat(s); },
      strtoint: function (s) { return parseInt(s, 10); },
      /* --- folha de cálculo do SimTwo --- */
      setrcvalue: function (r, c, v) { sheet[r + "," + c] = v; return v; },
      getrcvalue: function (r, c) {
        var v = sheet[r + "," + c];
        if (v === undefined) return 0;
        var f = parseFloat(v);
        return isNaN(f) ? 0 : f;
      },
      setrctext: function (r, c, v) { sheet[r + "," + c] = String(v); return v; },
      getrctext: function (r, c) { return String(sheet[r + "," + c] === undefined ? "" : sheet[r + "," + c]); },
      /* --- sensores / atuadores --- */
      getaxisodo: function (rb, mt) { return (env.odo && env.odo[mt] !== undefined) ? env.odo[mt] : 0; },
      getaxisodoup: function (rb, mt) { return RT.getaxisodo(rb, mt); },
      setaxisspeedref: function (rb, mt, v) { (env.speedref = env.speedref || [])[mt] = v; return v; },
      setaxisvoltageref: function (rb, mt, v) { (env.vref = env.vref || [])[mt] = v; return v; },
      getrobotx: function () { return env.truex || 0; },
      getroboty: function () { return env.truey || 0; },
      getrobottheta: function () { return env.truetheta || 0; },
      getsensorvalue: function (rb, s) { return (env.sensors && env.sensors[s]) || 0; },
      keypressed: function () { return false; },
      writeln: function () { log.push(Array.prototype.join.call(arguments, " ")); },
      /* --- gerador com semente fixa (execuções reprodutíveis) --- */
      __seed: (env.seed || 20260806) >>> 0,
      __rand: function () {
        var x = RT.__seed;
        x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
        RT.__seed = x;
        return x / 4294967296;
      },
      __spare: null,
      randg: function (mean, sigma) {
        if (RT.__spare !== null) { var v = RT.__spare; RT.__spare = null; return mean + sigma * v; }
        var u1 = Math.max(RT.__rand(), 1e-12), u2 = RT.__rand();
        var r = Math.sqrt(-2 * Math.log(u1)), th = 2 * Math.PI * u2;
        RT.__spare = r * Math.sin(th);
        return mean + sigma * r * Math.cos(th);
      },
      random: function () { return RT.__rand(); },

      /* --- álgebra matricial do SimTwo --- */
      mzeros: function (r, c) { return newMat(r | 0, c | 0); },
      meye: function (n) {
        var M = newMat(n | 0, n | 0);
        for (var i = 0; i < n; i++) M.d[i * M.c + i] = 1;
        return M;
      },
      mnumrows: function (M) { return M ? M.r : 0; },
      mnumcols: function (M) { return M ? M.c : 0; },
      mgetv: function (M, i, j) { return M.d[i * M.c + j]; },
      msetv: function (M, i, j, v) { M.d[i * M.c + j] = v; return v; },
      mtran: function (A) {
        var R = newMat(A.c, A.r);
        for (var i = 0; i < A.r; i++) for (var j = 0; j < A.c; j++) R.d[j * R.c + i] = A.d[i * A.c + j];
        return R;
      },
      mmult: function (A, B) {
        if (typeof A === "number") { var S = newMat(B.r, B.c); for (var q = 0; q < B.d.length; q++) S.d[q] = A * B.d[q]; return S; }
        if (typeof B === "number") { var S2 = newMat(A.r, A.c); for (var q2 = 0; q2 < A.d.length; q2++) S2.d[q2] = B * A.d[q2]; return S2; }
        if (A.c !== B.r) throw new PasError("MMult: dimensões incompatíveis (" + A.r + "x" + A.c + " por " + B.r + "x" + B.c + ")", 0);
        var R = newMat(A.r, B.c);
        for (var i = 0; i < A.r; i++)
          for (var k = 0; k < A.c; k++) {
            var a = A.d[i * A.c + k];
            if (a === 0) continue;
            for (var j = 0; j < B.c; j++) R.d[i * R.c + j] += a * B.d[k * B.c + j];
          }
        return R;
      },
      madd: function (A, B) { return ewMat(A, B, function (a, b) { return a + b; }, "MAdd"); },
      msub: function (A, B) { return ewMat(A, B, function (a, b) { return a - b; }, "MSub"); },
      minv: function (A) {
        if (A.r !== A.c) throw new PasError("Minv: a matriz tem de ser quadrada", 0);
        var n = A.r, M = [], i, j, k;
        for (i = 0; i < n; i++) {
          M[i] = [];
          for (j = 0; j < n; j++) M[i][j] = A.d[i * n + j];
          for (j = 0; j < n; j++) M[i][n + j] = i === j ? 1 : 0;
        }
        for (i = 0; i < n; i++) {
          var p = i;
          for (k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
          if (Math.abs(M[p][i]) < 1e-14) throw new PasError("Minv: matriz singular", 0);
          var t = M[i]; M[i] = M[p]; M[p] = t;
          var piv = M[i][i];
          for (j = 0; j < 2 * n; j++) M[i][j] /= piv;
          for (k = 0; k < n; k++) {
            if (k === i) continue;
            var f = M[k][i];
            if (f === 0) continue;
            for (j = 0; j < 2 * n; j++) M[k][j] -= f * M[i][j];
          }
        }
        var R = newMat(n, n);
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) R.d[i * n + j] = M[i][n + j];
        return R;
      },
      /* leitura/escrita na folha de cálculo */
      rangetomatrix: function (row, col, nrows, ncols) {
        var M = newMat(nrows, ncols);
        for (var i = 0; i < nrows; i++)
          for (var j = 0; j < ncols; j++) M.d[i * ncols + j] = RT.getrcvalue(row + i, col + j);
        return M;
      },
      matrixtorange: function (row, col, M) {
        for (var i = 0; i < M.r; i++)
          for (var j = 0; j < M.c; j++) RT.setrcvalue(row + i, col + j, String(+M.d[i * M.c + j].toPrecision(12)));
        return M;
      },
      /* sensores que devolvem matrizes (ex.: laser) */
      getsensorvalues: function (rb, s) {
        return env.laser || newMat(0, 1);
      },
      getsensorindex: function () { return 0; },

      /* --- utilitários internos --- */
      __env: env
    };
    return RT;
  }

  var BUILTINS = {};
  (function () {
    var probe = makeRuntime({});
    for (var k in probe) if (k.indexOf("__") !== 0) BUILTINS[k] = 1;
  })();

  /* ------------------------------------------------------------------ */
  /* Parser                                                              */
  /* ------------------------------------------------------------------ */
  function parse(src) {
    var T = lex(src), p = 0;
    function peek(o) { return T[p + (o || 0)]; }
    function at(t, v) { var x = T[p]; return x.t === t && (v === undefined || x.v === v); }
    function atKw(v) { return at("kw", v); }
    function atOp(v) { return at("op", v); }
    function next() { return T[p++]; }
    function expect(t, v) {
      if (!at(t, v)) {
        throw new PasError("esperava '" + (v || t) + "' mas encontrei '" + (T[p].raw || T[p].v || T[p].t) + "'", T[p].line);
      }
      return T[p++];
    }
    function expectOp(v) { return expect("op", v); }

    var unit = { consts: [], vars: [], routines: [] };

    function skipType() {
      /* consome uma descrição de tipo até ao ';' ao nível 0 */
      var depth = 0;
      while (!(depth === 0 && (atOp(";") || atOp(")"))) && !at("eof")) {
        if (atOp("(") || atOp("[")) depth++;
        if (atOp(")") || atOp("]")) { if (depth === 0) break; depth--; }
        if (atKw("record")) { skipRecord(); continue; }
        next();
      }
    }
    function skipRecord() {
      next(); // record
      var d = 1;
      while (d > 0 && !at("eof")) {
        if (atKw("record")) d++;
        else if (atKw("end")) d--;
        next();
      }
    }
    function parseConstBlock() {
      next(); // const
      while (at("id")) {
        var name = next().v;
        if (atOp(":")) { next(); skipType(); }   // const tipada
        expectOp("=");
        var e = parseExpr();
        unit.consts.push({ name: name, expr: e });
        if (atOp(";")) next();
      }
    }
    function parseVarBlock(target) {
      next(); // var
      while (at("id")) {
        var names = [next().v];
        while (atOp(",")) { next(); names.push(expect("id").v); }
        expectOp(":");
        var tk = collectTypeTokens();
        if (atOp(";")) next();
        names.forEach(function (nm) { target.push({ name: nm, type: tk }); });
      }
    }
    function collectTypeTokens() {
      var toks = [], depth = 0;
      while (!at("eof")) {
        if (depth === 0 && (atOp(";") || atOp(")"))) break;
        if (atKw("record")) { toks.push({ t: "kw", v: "record" }); skipRecord(); continue; }
        if (atOp("[") || atOp("(")) depth++;
        if (atOp("]") || atOp(")")) depth--;
        toks.push(next());
      }
      return toks;
    }
    function parseTypeBlock() {
      next(); // type
      while (at("id")) {
        next(); expectOp("=");
        collectTypeTokens();
        if (atOp(";")) next();
      }
    }

    function parseRoutine() {
      var isFunc = atKw("function");
      next();
      var name = expect("id").v;
      var params = [];
      if (atOp("(")) {
        next();
        while (!atOp(")")) {
          var byRef = false;
          if (atKw("var")) { byRef = true; next(); }
          else if (atKw("const")) { next(); }
          var nms = [expect("id").v];
          while (atOp(",")) { next(); nms.push(expect("id").v); }
          if (atOp(":")) { next(); collectTypeTokens(); }
          nms.forEach(function (nm) { params.push({ name: nm, byRef: byRef }); });
          if (atOp(";")) next();
        }
        expectOp(")");
      }
      if (atOp(":")) { next(); collectTypeTokens(); }
      expectOp(";");
      /* declarações locais */
      var locals = [], lconsts = [];
      for (;;) {
        if (atKw("var")) { parseVarBlock(locals); continue; }
        if (atKw("const")) {
          next();
          while (at("id")) {
            var cn = next().v;
            if (atOp(":")) { next(); skipType(); }
            expectOp("=");
            lconsts.push({ name: cn, expr: parseExpr() });
            if (atOp(";")) next();
          }
          continue;
        }
        if (atKw("type")) { parseTypeBlock(); continue; }
        if (atKw("procedure") || atKw("function")) { parseRoutine(); continue; } // aninhada -> promovida
        break;
      }
      var body = parseCompound();
      if (atOp(";")) next();
      unit.routines.push({
        name: name, isFunc: isFunc, params: params, locals: locals, consts: lconsts, body: body
      });
    }

    function parseCompound() {
      expect("kw", "begin");
      var list = parseStmtList(["end"]);
      expect("kw", "end");
      return { k: "block", body: list };
    }
    function parseStmtList(stopKws) {
      var out = [];
      for (;;) {
        while (atOp(";")) next();
        if (at("eof")) break;
        if (at("kw") && stopKws.indexOf(peek().v) >= 0) break;
        out.push(parseStmt());
        if (atOp(";")) next();
        else break;
      }
      while (atOp(";")) next();
      return out;
    }

    function parseStmt() {
      var tk = peek();
      if (tk.t === "kw") {
        switch (tk.v) {
          case "begin": return parseCompound();
          case "if": {
            next();
            var c = parseExpr();
            expect("kw", "then");
            var th = atOp(";") ? { k: "empty" } : parseStmt();
            var el = null;
            if (atKw("else")) { next(); el = parseStmt(); }
            return { k: "if", cond: c, then: th, else: el, line: tk.line };
          }
          case "case": {
            next();
            var subj = parseExpr();
            expect("kw", "of");
            var branches = [], elseB = null;
            while (!atKw("end") && !atKw("else") && !at("eof")) {
              var labels = [parseExpr()];
              while (atOp(",")) { next(); labels.push(parseExpr()); }
              expectOp(":");
              var s = (atOp(";")) ? { k: "empty" } : parseStmt();
              branches.push({ labels: labels, stmt: s });
              if (atOp(";")) next();
            }
            if (atKw("else")) { next(); elseB = { k: "block", body: parseStmtList(["end"]) }; }
            expect("kw", "end");
            return { k: "case", subj: subj, branches: branches, else: elseB, line: tk.line };
          }
          case "for": {
            next();
            var v = parseDesignator();
            expectOp(":=");
            var a = parseExpr();
            var down = atKw("downto");
            if (!down) expect("kw", "to"); else next();
            var b = parseExpr();
            expect("kw", "do");
            return { k: "for", v: v, from: a, to: b, down: down, body: parseStmt(), line: tk.line };
          }
          case "while": {
            next();
            var wc = parseExpr();
            expect("kw", "do");
            return { k: "while", cond: wc, body: parseStmt(), line: tk.line };
          }
          case "repeat": {
            next();
            var body = parseStmtList(["until"]);
            expect("kw", "until");
            return { k: "repeat", body: body, cond: parseExpr(), line: tk.line };
          }
          case "end": return { k: "empty" };
          default:
            throw new PasError("instrução não suportada a começar em '" + tk.v + "'", tk.line);
        }
      }
      if (tk.t === "id") {
        var d = parseDesignator();
        if (atOp(":=")) {
          next();
          return { k: "assign", target: d, value: parseExpr(), line: tk.line };
        }
        return { k: "callstmt", call: d, line: tk.line };
      }
      if (atOp(";")) return { k: "empty" };
      throw new PasError("instrução inválida perto de '" + (tk.raw || tk.v) + "'", tk.line);
    }

    /* designador: id { .campo | [idx] | (args) } */
    function parseDesignator() {
      var tk = expect("id");
      var node = { k: "var", name: tk.v, line: tk.line };
      for (;;) {
        if (atOp(".")) { next(); node = { k: "field", obj: node, name: expect("id").v, line: tk.line }; }
        else if (atOp("[")) {
          next();
          var idx = [parseExpr()];
          while (atOp(",")) { next(); idx.push(parseExpr()); }
          expectOp("]");
          idx.forEach(function (e) { node = { k: "index", obj: node, idx: e, line: tk.line }; });
        } else if (atOp("(")) {
          next();
          var args = [];
          if (!atOp(")")) {
            args.push(parseExpr());
            while (atOp(",")) { next(); args.push(parseExpr()); }
          }
          expectOp(")");
          node = { k: "call", callee: node, args: args, line: tk.line };
        } else break;
      }
      return node;
    }

    var RELOPS = { "=": "===", "<>": "!==", "<": "<", ">": ">", "<=": "<=", ">=": ">=" };

    function parseExpr() {
      var l = parseSimple();
      if (at("op") && RELOPS[peek().v] !== undefined) {
        var op = next().v;
        return { k: "bin", op: RELOPS[op], l: l, r: parseSimple() };
      }
      return l;
    }
    function parseSimple() {
      var neg = false;
      if (atOp("-")) { next(); neg = true; }
      else if (atOp("+")) next();
      var l = parseTerm();
      if (neg) l = { k: "neg", e: l };
      for (;;) {
        if (atOp("+")) { next(); l = { k: "bin", op: "+", l: l, r: parseTerm() }; }
        else if (atOp("-")) { next(); l = { k: "bin", op: "-", l: l, r: parseTerm() }; }
        else if (atKw("or")) { next(); l = { k: "bin", op: "||", l: l, r: parseTerm() }; }
        else if (atKw("xor")) { next(); l = { k: "bin", op: "!==", l: l, r: parseTerm() }; }
        else break;
      }
      return l;
    }
    function parseTerm() {
      var l = parseFactor();
      for (;;) {
        if (atOp("*")) { next(); l = { k: "bin", op: "*", l: l, r: parseFactor() }; }
        else if (atOp("/")) { next(); l = { k: "bin", op: "/", l: l, r: parseFactor() }; }
        else if (atKw("div")) { next(); l = { k: "idiv", l: l, r: parseFactor() }; }
        else if (atKw("mod")) { next(); l = { k: "bin", op: "%", l: l, r: parseFactor() }; }
        else if (atKw("and")) { next(); l = { k: "bin", op: "&&", l: l, r: parseFactor() }; }
        else if (atKw("shl")) { next(); l = { k: "bin", op: "<<", l: l, r: parseFactor() }; }
        else if (atKw("shr")) { next(); l = { k: "bin", op: ">>", l: l, r: parseFactor() }; }
        else break;
      }
      return l;
    }
    function parseFactor() {
      if (atKw("not")) { next(); return { k: "not", e: parseFactor() }; }
      if (atOp("-")) { next(); return { k: "neg", e: parseFactor() }; }
      if (atOp("+")) { next(); return parseFactor(); }
      if (at("num")) return { k: "num", v: next().v };
      if (at("str")) return { k: "str", v: next().v };
      if (atOp("(")) { next(); var e = parseExpr(); expectOp(")"); return e; }
      if (atOp("[")) { // conjunto/array literal -> array JS
        next();
        var items = [];
        if (!atOp("]")) { items.push(parseExpr()); while (atOp(",")) { next(); items.push(parseExpr()); } }
        expectOp("]");
        return { k: "arr", items: items };
      }
      if (at("id")) {
        var nm = peek().v;
        if (nm === "true") { next(); return { k: "bool", v: true }; }
        if (nm === "false") { next(); return { k: "bool", v: false }; }
        return parseDesignator();
      }
      throw new PasError("expressão inválida perto de '" + (peek().raw || peek().v) + "'", peek().line);
    }

    /* --- programa --- */
    while (!at("eof")) {
      if (atKw("const")) { parseConstBlock(); continue; }
      if (atKw("var")) { parseVarBlock(unit.vars); continue; }
      if (atKw("type")) { parseTypeBlock(); continue; }
      if (atKw("procedure") || atKw("function")) { parseRoutine(); continue; }
      if (atKw("program") || atKw("unit") || atKw("uses") || atKw("interface") || atKw("implementation")) {
        while (!atOp(";") && !at("eof")) next();
        if (atOp(";")) next();
        continue;
      }
      if (atKw("begin")) { parseCompound(); if (atOp(".")) next(); continue; } // bloco principal: ignorado
      if (atOp(";") || atOp(".")) { next(); continue; }
      throw new PasError("declaração não reconhecida perto de '" + (peek().raw || peek().v) + "'", peek().line);
    }
    return unit;
  }

  /* ------------------------------------------------------------------ */
  /* Codegen                                                             */
  /* ------------------------------------------------------------------ */
  function compile(src, opts) {
    opts = opts || {};
    var unit = parse(src);

    var routines = {};
    unit.routines.forEach(function (r) { routines[r.name] = r; });
    var globalConsts = {};
    unit.consts.forEach(function (c) { globalConsts[c.name] = 1; });
    var globalVars = {};
    unit.vars.forEach(function (v) { globalVars[v.name] = 1; });
    (opts.globals || []).forEach(function (g) { globalVars[g] = 1; });

    function jsName(n) { return "v_" + n; }

    function genExpr(e, sc) {
      switch (e.k) {
        case "num": return "(" + e.v + ")";
        case "str": return JSON.stringify(e.v);
        case "bool": return e.v ? "true" : "false";
        case "arr": return "[" + e.items.map(function (x) { return genExpr(x, sc); }).join(",") + "]";
        case "neg": return "(-" + genExpr(e.e, sc) + ")";
        case "not": return "(!(" + genExpr(e.e, sc) + "))";
        case "idiv": return "(Math.trunc(" + genExpr(e.l, sc) + "/" + genExpr(e.r, sc) + "))";
        case "bin": return "(" + genExpr(e.l, sc) + " " + e.op + " " + genExpr(e.r, sc) + ")";
        case "var": return genVarRef(e.name, sc, e.line);
        case "field": return genExpr(e.obj, sc) + "." + e.name;
        case "index": return genExpr(e.obj, sc) + "[" + genExpr(e.idx, sc) + "]";
        case "call": {
          var args = e.args.map(function (a) { return genExpr(a, sc); });
          if (e.callee.k === "field") {
            /* método de objeto (ex.: Log.add(txt)) — tolerado, sem semântica */
            return "(function(){var o=" + genExpr(e.callee.obj, sc) + "; return (o && o." + e.callee.name +
              ") ? o." + e.callee.name + "(" + args.join(",") + ") : 0;})()";
          }
          if (e.callee.k === "var") {
            var nm = e.callee.name;
            if (routines[nm]) return "R." + nm + "(" + args.join(",") + ")";
            if (nm === "pi") return "RT.pi";
            if (BUILTINS[nm]) return "RT." + nm + "(" + args.join(",") + ")";
            /* sqr/abs em maiúsculas etc. já normalizados; desconhecido -> erro claro */
            throw new PasError("função desconhecida '" + nm + "'", e.line);
          }
          return genExpr(e.callee, sc) + "(" + args.join(",") + ")";
        }
        default: throw new PasError("expressão não suportada", e.line || 0);
      }
    }

    function genVarRef(name, sc, line) {
      if (sc.byRef[name]) return jsName(name) + ".__v";
      if (sc.locals[name]) return jsName(name);
      if (sc.consts[name]) return "C_" + name;
      if (globalConsts[name]) return "C_" + name;
      if (globalVars[name]) return "G." + name;
      if (BUILTINS[name]) return (name === "pi") ? "RT.pi" : "RT." + name;
      if (routines[name]) return "R." + name + "()";
      /* variável desconhecida -> assume global (permite usar xodo/yodo/thodo sem declarar) */
      globalVars[name] = 1;
      return "G." + name;
    }

    function isLValue(e) { return e.k === "var" || e.k === "field" || e.k === "index"; }

    function genStmt(s, sc, ind) {
      var I = ind || "  ";
      switch (s.k) {
        case "empty": return "";
        case "block": return s.body.map(function (x) { return genStmt(x, sc, I); }).join("\n");
        case "assign": {
          /* atribuição ao nome da função -> result */
          if (s.target.k === "var" && sc.funcName && s.target.name === sc.funcName) {
            return I + "v_result = " + genExpr(s.value, sc) + ";";
          }
          return I + genExpr(s.target, sc) + " = " + genExpr(s.value, sc) + ";";
        }
        case "callstmt": return genCallStmt(s.call, sc, I);
        case "if": {
          var out = I + "if (" + genExpr(s.cond, sc) + ") {\n" + genStmt(s.then, sc, I + "  ") + "\n" + I + "}";
          if (s.else) out += " else {\n" + genStmt(s.else, sc, I + "  ") + "\n" + I + "}";
          return out;
        }
        case "case": {
          var o = I + "switch (" + genExpr(s.subj, sc) + ") {\n";
          s.branches.forEach(function (b) {
            b.labels.forEach(function (l) { o += I + "case " + genExpr(l, sc) + ":\n"; });
            o += genStmt(b.stmt, sc, I + "  ") + "\n" + I + "  break;\n";
          });
          if (s.else) o += I + "default:\n" + genStmt(s.else, sc, I + "  ") + "\n";
          o += I + "}";
          return o;
        }
        case "for": {
          var v = genExpr(s.v, sc), t = "__t" + (sc.tmp++);
          return I + "for (var " + t + " = " + genExpr(s.to, sc) + ", " + v + " = " + genExpr(s.from, sc) + "; " +
            v + (s.down ? " >= " : " <= ") + t + "; " + v + (s.down ? "--" : "++") + ") { RT.__tick();\n" +
            genStmt(s.body, sc, I + "  ") + "\n" + I + "}";
        }
        case "while":
          return I + "while (" + genExpr(s.cond, sc) + ") { RT.__tick();\n" + genStmt(s.body, sc, I + "  ") + "\n" + I + "}";
        case "repeat":
          return I + "do { RT.__tick();\n" +
            s.body.map(function (x) { return genStmt(x, sc, I + "  "); }).join("\n") +
            "\n" + I + "} while (!(" + genExpr(s.cond, sc) + "));";
        default: throw new PasError("instrução não suportada", s.line || 0);
      }
    }

    /* chamada como instrução: trata parâmetros var (passagem por referência) */
    function genCallStmt(call, sc, I) {
      if (call.k === "var") {
        var nm0 = call.name;
        if (routines[nm0]) return I + "R." + nm0 + "();";
        if (BUILTINS[nm0]) return I + "RT." + nm0 + "();";
        return I + "/* " + nm0 + " */;";
      }
      if (call.k !== "call") return I + genExpr(call, sc) + ";";
      var nm = call.callee.k === "var" ? call.callee.name : null;
      var r = nm ? routines[nm] : null;
      if (!r) {
        if (nm && BUILTINS[nm]) {
          return I + "RT." + nm + "(" + call.args.map(function (a) { return genExpr(a, sc); }).join(",") + ");";
        }
        if (nm) throw new PasError("procedimento desconhecido '" + nm + "'", call.line);
        return I + genExpr(call, sc) + ";";
      }
      var pre = [], post = [], argsJs = [];
      call.args.forEach(function (a, i) {
        var prm = r.params[i];
        if (prm && prm.byRef && isLValue(a)) {
          var t = "__r" + (sc.tmp++), lv = genExpr(a, sc);
          pre.push(I + "var " + t + " = {__v: " + lv + "};");
          post.push(I + lv + " = " + t + ".__v;");
          argsJs.push(t);
        } else if (prm && prm.byRef) {
          argsJs.push("{__v: " + genExpr(a, sc) + "}");
        } else {
          argsJs.push(genExpr(a, sc));
        }
      });
      return pre.concat([I + "R." + nm + "(" + argsJs.join(",") + ");"]).concat(post).join("\n");
    }

    function genRoutine(r) {
      var sc = { locals: {}, consts: {}, byRef: {}, funcName: r.isFunc ? r.name : null, tmp: 0 };
      r.params.forEach(function (p) { sc.locals[p.name] = 1; if (p.byRef) sc.byRef[p.name] = 1; });
      r.locals.forEach(function (l) { sc.locals[l.name] = 1; });
      r.consts.forEach(function (c) { sc.consts[c.name] = 1; });
      if (r.isFunc) sc.locals["result"] = 1;

      var head = "R." + r.name + " = function (" + r.params.map(function (p) { return jsName(p.name); }).join(", ") + ") {\n";
      var decl = "";
      r.consts.forEach(function (c) { decl += "  var C_" + c.name + " = " + genExpr(c.expr, sc) + ";\n"; });
      r.locals.forEach(function (l) { decl += "  var " + jsName(l.name) + " = " + initFor(l.type) + ";\n"; });
      if (r.isFunc) decl += "  var v_result = 0;\n";
      var body = genStmt(r.body, sc, "  ");
      var tail = (r.isFunc ? "\n  return v_result;\n" : "\n") + "};\n";
      return head + decl + body + tail;
    }

    function initFor(typeToks) {
      if (!typeToks || !typeToks.length) return "0";
      var s = typeToks.map(function (t) { return String(t.v); }).join(" ");
      if (/array/.test(s)) {
        var m = /(-?\d+)\s*\.\.\s*(-?\d+)/.exec(s);
        var n = m ? (parseInt(m[2], 10) - parseInt(m[1], 10) + 1) : 8;
        return "new Array(" + Math.max(n, 1) + ").fill(0)";
      }
      if (/string/.test(s)) return '""';
      if (/boolean/.test(s)) return "false";
      if (/\b(double|real|single|extended|integer|byte|word|longint|cardinal|int64|shortint|smallint)\b/.test(s)) return "0";
      /* tipo desconhecido (registo, matriz, lista…) -> objeto, para permitir campos */
      return "{}";
    }

    var js = '"use strict";\nvar R = {};\n';
    /* constantes globais */
    var scTop = { locals: {}, consts: {}, byRef: {}, funcName: null, tmp: 0 };
    unit.consts.forEach(function (c) { js += "var C_" + c.name + " = " + genExpr(c.expr, scTop) + ";\n"; });
    /* garantir que globais existem */
    js += "Object.keys(__globalNames).forEach(function(k){ if(G[k]===undefined) G[k]=__globalInit[k]!==undefined?__globalInit[k]:0; });\n";
    unit.routines.forEach(function (r) { js += genRoutine(r); });
    js += "return R;\n";

    var globalInit = {};
    unit.vars.forEach(function (v) {
      var s = (v.type || []).map(function (t) { return String(t.v); }).join(" ");
      if (/array/.test(s)) {
        var m = /(-?\d+)\s*\.\.\s*(-?\d+)/.exec(s);
        var n = m ? (parseInt(m[2], 10) - parseInt(m[1], 10) + 1) : 8;
        globalInit[v.name] = new Array(Math.max(n, 1)).fill(0);
      } else if (/string/.test(s)) globalInit[v.name] = "";
      else if (/boolean/.test(s)) globalInit[v.name] = false;
      else if (/\b(double|real|single|extended|integer|byte|word|longint|cardinal|int64|shortint|smallint)\b/.test(s)) globalInit[v.name] = 0;
      else globalInit[v.name] = null; /* registos/matrizes: preenchidos pelo caso de teste */
    });

    var factory;
    try {
      factory = new Function("RT", "G", "__globalNames", "__globalInit", js);
    } catch (err) {
      throw new PasError("erro ao gerar código: " + err.message, 0);
    }

    return {
      js: js,
      globalNames: globalVars,
      routineNames: Object.keys(routines),
      routines: routines,
      /* instancia as rotinas ligadas a um runtime/estado global */
      link: function (RT, G) {
        var gi = {};
        for (var k in globalInit) if (globalInit[k] !== null) gi[k] = Array.isArray(globalInit[k]) ? globalInit[k].slice() : globalInit[k];
        return factory(RT, G, globalVars, gi);
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                         */
  /* ------------------------------------------------------------------ */
  global.SAUT_PASCAL = {
    PasError: PasError,
    newMat: newMat,
    matFromRows: function (rows) {
      var r = rows.length, c = r ? rows[0].length : 0, M = newMat(r, c);
      for (var i = 0; i < r; i++) for (var j = 0; j < c; j++) M.d[i * c + j] = rows[i][j];
      return M;
    },
    lex: lex,
    parse: parse,
    compile: compile,
    makeRuntime: makeRuntime,
    builtins: BUILTINS,
    /* utilitário: compila e devolve {R, RT, G} pronto a chamar */
    build: function (src, opts) {
      opts = opts || {};
      var prog = compile(src, opts);
      var env = opts.env || {};
      var RT = makeRuntime(env);
      var G = opts.G || {};
      var R = prog.link(RT, G);
      /* chamada externa: trata automaticamente os parâmetros var (por referência).
         args é MUTADO no lugar, para que o chamador leia os valores de saída. */
      function callRoutine(name, args) {
        args = args || [];
        var r = prog.routines[name.toLowerCase()];
        if (!R[name.toLowerCase()]) throw new PasError("a rotina '" + name + "' não está definida no teu código", 0);
        var boxes = [];
        var a = args.map(function (x, i) {
          var prm = r && r.params[i];
          if (prm && prm.byRef) { var b = { __v: x }; boxes.push({ i: i, b: b }); return b; }
          return x;
        });
        var res = R[name.toLowerCase()].apply(null, a);
        boxes.forEach(function (o) { args[o.i] = o.b.__v; });
        return res;
      }
      return { R: R, RT: RT, G: G, env: env, program: prog, call: callRoutine };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
