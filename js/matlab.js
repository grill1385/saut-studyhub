/* ===== SAUT StudyHub — mini-interpretador de MATLAB (subconjunto da Lab 4) =====
   Executa fragmentos de script MATLAB com álgebra matricial, para que o código
   escrito pelo utilizador possa ser comparado com a solução do professor pelos
   VALORES que produz (matrizes, vetores, escalares).

   Cobertura:
     atribuição (incl. indexada), [a,b] = f(...), if/elseif/else/end,
     for i=1:N/end, while/end, break/continue,
     literais de matriz [1 -1 0; 0 1 2] (com nova linha ou ';' como separador de linha),
     operadores + - * / \\ ^ .* ./ .^ ' == ~= < > <= >= && || & | ~, unário -,
     indexação A(i), A(i,j), A(:,j), A(i,:), 'end' em índices,
     comentários %, continuação de linha ...
   Builtins: sqrt sin cos tan atan atan2 exp log abs sign floor ceil round mod rem
             max min sum prod norm det inv pinv eye zeros ones diag size length numel
             transpose randn rand pi NormalizeAng linspace trace isempty ode45

   randn/rand usam um gerador com semente fixa -> execuções reprodutíveis, o que
   permite comparar o código do utilizador com o do professor mesmo em simulações.
*/
(function (global) {
  "use strict";

  function MlError(msg, line) { this.name = "MlError"; this.message = msg; this.line = line || 0; }
  MlError.prototype = Object.create(Error.prototype);
  MlError.prototype.toString = function () { return "Linha " + this.line + ": " + this.message; };
  function err(msg, line) { throw new MlError(msg, line); }

  /* ================================================================== */
  /* Matriz (row-major; indexação MATLAB é column-major e é convertida)  */
  /* ================================================================== */
  function Mat(r, c, d) {
    this.r = r; this.c = c;
    this.d = d || new Float64Array(r * c);
  }
  Mat.prototype.get = function (i, j) { return this.d[i * this.c + j]; };
  Mat.prototype.set = function (i, j, v) { this.d[i * this.c + j] = v; };
  Mat.prototype.clone = function () { return new Mat(this.r, this.c, this.d.slice()); };
  Mat.prototype.isScalar = function () { return this.r === 1 && this.c === 1; };
  Mat.prototype.toString = function () {
    var out = [];
    for (var i = 0; i < this.r; i++) {
      var row = [];
      for (var j = 0; j < this.c; j++) row.push(fmtNum(this.get(i, j)));
      out.push(row.join(" "));
    }
    return this.r === 1 && this.c === 1 ? out[0] : "[" + out.join("; ") + "]";
  };
  function fmtNum(x) {
    if (!isFinite(x)) return String(x);
    if (Math.abs(x) < 1e-12) return "0";
    return String(+x.toPrecision(6));
  }

  function isMat(x) { return x instanceof Mat; }
  function isNum(x) { return typeof x === "number"; }
  function toMat(x) {
    if (isMat(x)) return x;
    if (isNum(x)) { var m = new Mat(1, 1); m.d[0] = x; return m; }
    if (typeof x === "boolean") { var b = new Mat(1, 1); b.d[0] = x ? 1 : 0; return b; }
    err("valor não numérico");
  }
  function toNum(x) {
    if (isNum(x)) return x;
    if (typeof x === "boolean") return x ? 1 : 0;
    if (isMat(x)) { if (x.r * x.c < 1) err("matriz vazia usada como escalar"); return x.d[0]; }
    err("valor não numérico");
  }
  /* devolve escalar JS quando 1x1, para as contas ficarem simples */
  function simplify(m) { return isMat(m) && m.r === 1 && m.c === 1 ? m.d[0] : m; }

  function zeros(r, c) { return new Mat(r, c); }
  function eye(n) { var m = new Mat(n, n); for (var i = 0; i < n; i++) m.set(i, i, 1); return m; }

  function ew(a, b, f, opName) {
    var A = toMat(a), B = toMat(b);
    if (A.isScalar() && !B.isScalar()) { var t = A; A = B; B = t; var swapped = true; }
    var R;
    if (B.isScalar()) {
      R = new Mat(A.r, A.c);
      for (var i = 0; i < A.d.length; i++) R.d[i] = swapped ? f(B.d[0], A.d[i]) : f(A.d[i], B.d[0]);
      return simplify(R);
    }
    if (A.r !== B.r || A.c !== B.c)
      err("dimensões incompatíveis em '" + opName + "': " + A.r + "x" + A.c + " e " + B.r + "x" + B.c);
    R = new Mat(A.r, A.c);
    for (var k = 0; k < A.d.length; k++) R.d[k] = f(A.d[k], B.d[k]);
    return simplify(R);
  }

  function mmul(a, b) {
    if (isNum(a) || isNum(b)) return ew(a, b, function (x, y) { return x * y; }, "*");
    var A = toMat(a), B = toMat(b);
    if (A.isScalar() || B.isScalar()) return ew(A, B, function (x, y) { return x * y; }, "*");
    if (A.c !== B.r) err("dimensões incompatíveis em '*': " + A.r + "x" + A.c + " por " + B.r + "x" + B.c);
    var R = new Mat(A.r, B.c);
    for (var i = 0; i < A.r; i++)
      for (var k = 0; k < A.c; k++) {
        var aik = A.get(i, k);
        if (aik === 0) continue;
        for (var j = 0; j < B.c; j++) R.d[i * B.c + j] += aik * B.get(k, j);
      }
    return simplify(R);
  }

  function transpose(a) {
    if (isNum(a)) return a;
    var A = toMat(a), R = new Mat(A.c, A.r);
    for (var i = 0; i < A.r; i++) for (var j = 0; j < A.c; j++) R.set(j, i, A.get(i, j));
    return simplify(R);
  }

  function inv(a) {
    if (isNum(a)) return 1 / a;
    var A = toMat(a);
    if (A.isScalar()) return 1 / A.d[0];
    if (A.r !== A.c) err("inv() exige matriz quadrada");
    var n = A.r, M = [], i, j, k;
    for (i = 0; i < n; i++) {
      M[i] = [];
      for (j = 0; j < n; j++) M[i][j] = A.get(i, j);
      for (j = 0; j < n; j++) M[i][n + j] = i === j ? 1 : 0;
    }
    for (i = 0; i < n; i++) {
      var p = i;
      for (k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
      if (Math.abs(M[p][i]) < 1e-14) err("matriz singular em inv()");
      var tmp = M[i]; M[i] = M[p]; M[p] = tmp;
      var piv = M[i][i];
      for (j = 0; j < 2 * n; j++) M[i][j] /= piv;
      for (k = 0; k < n; k++) {
        if (k === i) continue;
        var f = M[k][i];
        if (f === 0) continue;
        for (j = 0; j < 2 * n; j++) M[k][j] -= f * M[i][j];
      }
    }
    var R = new Mat(n, n);
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) R.set(i, j, M[i][n + j]);
    return R;
  }

  function det(a) {
    if (isNum(a)) return a;
    var A = toMat(a);
    if (A.r !== A.c) err("det() exige matriz quadrada");
    var n = A.r, M = [], i, j, k, s = 1;
    for (i = 0; i < n; i++) { M[i] = []; for (j = 0; j < n; j++) M[i][j] = A.get(i, j); }
    for (i = 0; i < n; i++) {
      var p = i;
      for (k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
      if (Math.abs(M[p][i]) < 1e-15) return 0;
      if (p !== i) { var t = M[i]; M[i] = M[p]; M[p] = t; s = -s; }
      for (k = i + 1; k < n; k++) {
        var f = M[k][i] / M[i][i];
        for (j = i; j < n; j++) M[k][j] -= f * M[i][j];
      }
    }
    var d = s;
    for (i = 0; i < n; i++) d *= M[i][i];
    return d;
  }

  /* ================================================================== */
  /* Lexer                                                              */
  /* ================================================================== */
  var COMMANDS = {};
  ("clear clc close hold figure format warning grid axis pause drawnow more diary shg " +
   "clearvars rng").split(" ").forEach(function (k) { COMMANDS[k] = 1; });

  var KW = {};
  "if elseif else end for while break continue function return switch case otherwise do until global".split(" ")
    .forEach(function (k) { KW[k] = 1; });

  function lex(src) {
    var T = [], i = 0, line = 1, n = src.length, ws = false;
    function prevMeaning() {
      for (var k = T.length - 1; k >= 0; k--) return T[k];
      return null;
    }
    function transposeContext() {
      var p = T[T.length - 1];
      if (!p) return false;
      if (p.t === "id" && !KW[p.v]) return true;
      if (p.t === "num") return true;
      if (p.t === "op" && (p.v === ")" || p.v === "]" || p.v === "}" || p.v === "'" || p.v === ".'")) return true;
      return false;
    }
    while (i < n) {
      var c = src[i];
      if (c === "\r") { i++; continue; }
      if (c === "\n") { T.push({ t: "nl", v: "\n", line: line, ws: ws }); line++; i++; ws = false; continue; }
      if (c === " " || c === "\t") { i++; ws = true; continue; }
      if (c === "%") {
        if (src[i + 1] === "{") { /* bloco */
          while (i < n && !(src[i] === "%" && src[i + 1] === "}")) { if (src[i] === "\n") line++; i++; }
          i += 2; continue;
        }
        while (i < n && src[i] !== "\n") i++;
        continue;
      }
      if (c === "." && src.substr(i, 3) === "...") {
        i += 3;
        while (i < n && src[i] !== "\n") i++;
        if (i < n) { i++; line++; }
        ws = true; continue;
      }
      if (c >= "0" && c <= "9" || (c === "." && src[i + 1] >= "0" && src[i + 1] <= "9")) {
        var j = i;
        while (j < n && src[j] >= "0" && src[j] <= "9") j++;
        if (src[j] === "." && !(src[j + 1] === "*" || src[j + 1] === "/" || src[j + 1] === "^" || src[j + 1] === "'")) {
          j++; while (j < n && src[j] >= "0" && src[j] <= "9") j++;
        }
        if (src[j] === "e" || src[j] === "E") {
          var k2 = j + 1;
          if (src[k2] === "+" || src[k2] === "-") k2++;
          if (src[k2] >= "0" && src[k2] <= "9") { j = k2; while (j < n && src[j] >= "0" && src[j] <= "9") j++; }
        }
        T.push({ t: "num", v: parseFloat(src.slice(i, j)), line: line, ws: ws }); i = j; ws = false; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        var j2 = i;
        while (j2 < n && /[A-Za-z0-9_]/.test(src[j2])) j2++;
        var w = src.slice(i, j2);
        T.push({ t: KW[w] ? "kw" : "id", v: w, line: line, ws: ws }); i = j2; ws = false; continue;
      }
      if (c === "'") {
        if (transposeContext() && !ws) { T.push({ t: "op", v: "'", line: line, ws: ws }); i++; ws = false; continue; }
        var j3 = i + 1, s = "";
        while (j3 < n) {
          if (src[j3] === "'") { if (src[j3 + 1] === "'") { s += "'"; j3 += 2; } else { j3++; break; } }
          else { s += src[j3]; j3++; }
        }
        T.push({ t: "str", v: s, line: line, ws: ws }); i = j3; ws = false; continue;
      }
      if (c === '"') {
        var j4 = i + 1, s2 = "";
        while (j4 < n && src[j4] !== '"') { s2 += src[j4]; j4++; }
        T.push({ t: "str", v: s2, line: line, ws: ws }); i = j4 + 1; ws = false; continue;
      }
      var three = src.substr(i, 2);
      if ([".*", "./", ".^", ".\\", ".'", "==", "~=", "!=", "<=", ">=", "&&", "||"].indexOf(three) >= 0) {
        T.push({ t: "op", v: three === "!=" ? "~=" : three, line: line, ws: ws }); i += 2; ws = false; continue;
      }
      if ("+-*/\\^()[]{},;:<>=&|~@.".indexOf(c) >= 0) {
        T.push({ t: "op", v: c, line: line, ws: ws }); i++; ws = false; continue;
      }
      err("carácter inesperado '" + c + "'", line);
    }
    T.push({ t: "eof", v: "", line: line, ws: false });
    return T;
  }

  /* ================================================================== */
  /* Parser                                                             */
  /* ================================================================== */
  function parse(src) {
    var T = lex(src), p = 0, brDepth = 0;
    function pk(o) { return T[p + (o || 0)]; }
    function at(t, v) { var x = T[p]; return x.t === t && (v === undefined || x.v === v); }
    function atOp(v) { return at("op", v); }
    function atKw(v) { return at("kw", v); }
    function nx() { return T[p++]; }
    function want(t, v) {
      if (!at(t, v)) err("esperava '" + (v || t) + "' mas encontrei '" + (T[p].v || T[p].t) + "'", T[p].line);
      return T[p++];
    }
    function skipSep() { while (at("nl") || atOp(";") || atOp(",")) nx(); }

    function parseBlock(stops) {
      var list = [];
      for (;;) {
        skipSep();
        if (at("eof")) break;
        if (at("kw") && stops.indexOf(pk().v) >= 0) break;
        list.push(parseStmt());
      }
      return list;
    }

    function parseStmt() {
      var tk = pk();
      if (tk.t === "kw") {
        switch (tk.v) {
          case "if": {
            nx();
            var clauses = [{ cond: parseExpr(), body: null }];
            clauses[0].body = parseBlock(["elseif", "else", "end"]);
            var elseBody = null;
            while (atKw("elseif")) { nx(); var c2 = parseExpr(); clauses.push({ cond: c2, body: parseBlock(["elseif", "else", "end"]) }); }
            if (atKw("else")) { nx(); elseBody = parseBlock(["end"]); }
            want("kw", "end");
            return { k: "if", clauses: clauses, else: elseBody, line: tk.line };
          }
          case "for": {
            nx();
            var hasPar = atOp("(");
            if (hasPar) nx();
            var v = want("id").v;
            want("op", "=");
            var rng = parseExpr();
            if (hasPar && atOp(")")) nx();
            var body = parseBlock(["end"]);
            want("kw", "end");
            return { k: "for", v: v, range: rng, body: body, line: tk.line };
          }
          case "while": {
            nx();
            var cnd = parseExpr();
            var wb = parseBlock(["end"]);
            want("kw", "end");
            return { k: "while", cond: cnd, body: wb, line: tk.line };
          }
          case "break": nx(); return { k: "break", line: tk.line };
          case "continue": nx(); return { k: "continue", line: tk.line };
          case "return": nx(); return { k: "return", line: tk.line };
          case "function": {
            /* funções locais: assinatura + corpo até 'end' ou fim */
            nx();
            var outs = [];
            if (atOp("[")) {
              nx();
              while (!atOp("]")) { if (at("id")) outs.push(nx().v); else nx(); }
              nx(); want("op", "=");
            } else if (at("id") && T[p + 1] && T[p + 1].t === "op" && T[p + 1].v === "=") {
              outs.push(nx().v); nx();
            }
            var fname = want("id").v;
            var params = [];
            if (atOp("(")) {
              nx();
              while (!atOp(")")) { if (at("id")) params.push(nx().v); else nx(); }
              nx();
            }
            var fbody = parseBlock(["end", "function"]);
            if (atKw("end")) nx();
            return { k: "funcdef", name: fname, params: params, outs: outs, body: fbody, line: tk.line };
          }
          default: err("instrução '" + tk.v + "' não suportada", tk.line);
        }
      }
      /* forma de comando: "clear all", "hold on" -> ignorado */
      if (tk.t === "id" && COMMANDS[tk.v.toLowerCase()]) {
        var nt = pk(1);
        if (!nt || nt.t === "nl" || nt.t === "eof" || (nt.t === "op" && (nt.v === ";" || nt.v === ",")) ||
            (nt.t === "id" && !(pk(2) && pk(2).t === "op" && pk(2).v === "="))) {
          while (!at("nl") && !at("eof") && !atOp(";")) nx();
          return { k: "noop", line: tk.line };
        }
      }

      /* [a,b] = expr  |  lvalue = expr  |  expr */
      if (atOp("[")) {
        var save = p;
        try {
          nx();
          var tgts = [];
          while (!atOp("]")) {
            if (atOp(",")) { nx(); continue; }
            if (atOp("~")) { nx(); tgts.push(null); continue; }
            tgts.push(parsePostfix(parsePrimaryId()));
          }
          want("op", "]");
          if (atOp("=") && !(pk(1).t === "op" && pk(1).v === "=")) {
            nx();
            return { k: "multiassign", targets: tgts, value: parseExpr(), line: tk.line };
          }
        } catch (e) { /* não era multi-atribuição */ }
        p = save;
      }
      var e = parseExpr();
      if (atOp("=") && !(pk(1).t === "op" && pk(1).v === "=")) {
        nx();
        return { k: "assign", target: e, value: parseExpr(), line: tk.line };
      }
      return { k: "exprstmt", e: e, line: tk.line };
    }

    function parsePrimaryId() {
      var t = want("id");
      return { k: "var", name: t.v, line: t.line };
    }

    /* --- expressões --- */
    function parseExpr() { return parseOrOr(); }
    function parseOrOr() {
      var l = parseAndAnd();
      while (atOp("||") || atOp("|")) { var o = nx().v; l = { k: "bin", op: o === "|" ? "||" : o, l: l, r: parseAndAnd() }; }
      return l;
    }
    function parseAndAnd() {
      var l = parseCmp();
      while (atOp("&&") || atOp("&")) { var o = nx().v; l = { k: "bin", op: o === "&" ? "&&" : o, l: l, r: parseCmp() }; }
      return l;
    }
    function parseCmp() {
      var l = parseRange();
      while (atOp("==") || atOp("~=") || atOp("<") || atOp(">") || atOp("<=") || atOp(">=")) {
        var o = nx().v; l = { k: "cmp", op: o, l: l, r: parseRange() };
      }
      return l;
    }
    function parseRange() {
      var l = parseAdd();
      if (atOp(":") && brDepth === 0) { /* fora de índices: a:b ou a:s:b */ }
      if (atOp(":")) {
        nx();
        var b = parseAdd();
        if (atOp(":")) { nx(); return { k: "range", from: l, step: b, to: parseAdd() }; }
        return { k: "range", from: l, step: null, to: b };
      }
      return l;
    }
    function breaksElement() {
      /* dentro de [] : "1 -1" são dois elementos; "1 - 1" é uma subtração */
      if (brDepth === 0) return false;
      var t = pk();
      if (!(t.t === "op" && (t.v === "+" || t.v === "-"))) return false;
      var nt = pk(1);
      return t.ws && nt && !nt.ws;
    }
    function parseAdd() {
      var l = parseMul();
      for (;;) {
        if ((atOp("+") || atOp("-")) && !breaksElement()) { var o = nx().v; l = { k: "bin", op: o, l: l, r: parseMul() }; }
        else break;
      }
      return l;
    }
    function parseMul() {
      var l = parseUnary();
      for (;;) {
        if (atOp("*") || atOp("/") || atOp("\\") || atOp(".*") || atOp("./") || atOp(".\\")) {
          var o = nx().v; l = { k: "bin", op: o, l: l, r: parseUnary() };
        } else break;
      }
      return l;
    }
    function parseUnary() {
      if (atOp("-")) { nx(); return { k: "neg", e: parseUnary() }; }
      if (atOp("+")) { nx(); return parseUnary(); }
      if (atOp("~")) { nx(); return { k: "not", e: parseUnary() }; }
      return parsePower();
    }
    function parsePower() {
      var b = parsePostfix(parseAtom());
      if (atOp("^") || atOp(".^")) {
        var o = nx().v;
        var ex = (atOp("-")) ? (nx(), { k: "neg", e: parsePower() }) : parsePower();
        return { k: "bin", op: o, l: b, r: ex };
      }
      return b;
    }
    function parsePostfix(node) {
      for (;;) {
        if (atOp("(")) {
          nx();
          var saved = brDepth; brDepth = 0;
          var args = [];
          if (!atOp(")")) {
            args.push(parseArg());
            while (atOp(",")) { nx(); args.push(parseArg()); }
          }
          brDepth = saved;
          want("op", ")");
          node = { k: "call", callee: node, args: args };
        } else if (atOp("'") || atOp(".'")) { nx(); node = { k: "transp", e: node }; }
        else if (atOp(".") && pk(1).t === "id") { nx(); node = { k: "field", obj: node, name: nx().v }; }
        else break;
      }
      return node;
    }
    function parseArg() {
      if (atOp(":") && (pk(1).t === "op" && (pk(1).v === "," || pk(1).v === ")"))) { nx(); return { k: "colon" }; }
      return parseExpr();
    }
    function parseAtom() {
      var t = pk();
      if (t.t === "num") { nx(); return { k: "num", v: t.v }; }
      if (t.t === "str") { nx(); return { k: "str", v: t.v }; }
      if (t.t === "id") { nx(); return { k: "var", name: t.v, line: t.line }; }
      if (t.t === "kw" && t.v === "end") { nx(); return { k: "endidx" }; }
      if (atOp("(")) {
        nx();
        var saved = brDepth; brDepth = 0;
        var e = parseExpr();
        brDepth = saved;
        want("op", ")");
        return e;
      }
      if (atOp("[")) return parseMatrix();
      if (atOp("@")) { nx(); if (at("id")) return { k: "str", v: nx().v }; err("handles de função não suportados", t.line); }
      err("expressão inválida perto de '" + (t.v || t.t) + "'", t.line);
    }
    function parseMatrix() {
      want("op", "[");
      brDepth++;
      var rows = [], cur = [];
      for (;;) {
        while (atOp(",")) nx();
        if (atOp("]")) break;
        if (at("nl") || atOp(";")) {
          nx();
          if (cur.length) { rows.push(cur); cur = []; }
          continue;
        }
        if (at("eof")) err("falta ']'", pk().line);
        cur.push(parseExpr());
      }
      if (cur.length) rows.push(cur);
      want("op", "]");
      brDepth--;
      return { k: "matrix", rows: rows };
    }

    var prog = parseBlock([]);
    return prog;
  }

  /* ================================================================== */
  /* Runtime                                                            */
  /* ================================================================== */
  function makePRNG(seed) {
    var s = seed >>> 0 || 12345;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  function Workspace(opts) {
    opts = opts || {};
    this.vars = Object.create(null);
    this.funcs = Object.create(null);
    this.steps = 0;
    this.maxSteps = opts.maxSteps || 3000000;
    this.rnd = makePRNG(opts.seed || 20260806);
    this.spare = null;
    this.out = [];
  }
  Workspace.prototype.tick = function () {
    if (++this.steps > this.maxSteps) err("execução demasiado longa (ciclo infinito?)");
  };
  Workspace.prototype.randn = function () {
    if (this.spare !== null) { var v = this.spare; this.spare = null; return v; }
    var u1 = Math.max(this.rnd(), 1e-12), u2 = this.rnd();
    var r = Math.sqrt(-2 * Math.log(u1)), th = 2 * Math.PI * u2;
    this.spare = r * Math.sin(th);
    return r * Math.cos(th);
  };
  Workspace.prototype.get = function (n) { return this.vars[n]; };
  Workspace.prototype.set = function (n, v) { this.vars[n] = v; };

  function normAng(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a <= -Math.PI) a += 2 * Math.PI;
    return a;
  }

  function mapEw(x, f) {
    if (isNum(x)) return f(x);
    var A = toMat(x), R = new Mat(A.r, A.c);
    for (var i = 0; i < A.d.length; i++) R.d[i] = f(A.d[i]);
    return simplify(R);
  }

  function buildBuiltins() {
    function ewf(f) { return function (ws, a) { return mapEw(a, f); }; }
    var B = {
      pi: function () { return Math.PI; },
      e: function () { return Math.E; },
      sqrt: ewf(Math.sqrt), sin: ewf(Math.sin), cos: ewf(Math.cos), tan: ewf(Math.tan),
      asin: ewf(Math.asin), acos: ewf(Math.acos), atan: ewf(Math.atan),
      exp: ewf(Math.exp), log: ewf(Math.log), log10: ewf(Math.log10),
      abs: ewf(Math.abs), sign: ewf(Math.sign), floor: ewf(Math.floor),
      ceil: ewf(Math.ceil), round: ewf(Math.round), fix: ewf(Math.trunc),
      atan2: function (ws, y, x) { return ew(y, x, Math.atan2, "atan2"); },
      mod: function (ws, a, b) { return ew(a, b, function (x, y) { return x - Math.floor(x / y) * y; }, "mod"); },
      rem: function (ws, a, b) { return ew(a, b, function (x, y) { return x % y; }, "rem"); },
      power: function (ws, a, b) { return ew(a, b, Math.pow, "power"); },
      hypot: function (ws, a, b) { return ew(a, b, Math.hypot, "hypot"); },
      normalizeang: function (ws, a) { return mapEw(a, normAng); },
      eye: function (ws, n, m) { var N = toNum(n); return m === undefined ? eye(N) : zeros(N, toNum(m)); },
      zeros: function (ws, r, c) { var R = toNum(r === undefined ? 1 : r); return zeros(R, c === undefined ? R : toNum(c)); },
      ones: function (ws, r, c) {
        var R = toNum(r === undefined ? 1 : r), C = c === undefined ? R : toNum(c);
        var M = new Mat(R, C); M.d.fill(1); return M;
      },
      diag: function (ws, a) {
        var A = toMat(a);
        if (A.r === 1 || A.c === 1) {
          var n = A.r * A.c, M = new Mat(n, n);
          for (var i = 0; i < n; i++) M.set(i, i, A.d[i]);
          return M;
        }
        var k = Math.min(A.r, A.c), V = new Mat(k, 1);
        for (var j = 0; j < k; j++) V.d[j] = A.get(j, j);
        return V;
      },
      size: function (ws, a, dim, nargout) {
        var A = toMat(a);
        if (dim !== undefined && dim !== null) return toNum(dim) === 1 ? A.r : A.c;
        if (nargout >= 2) return [A.r, A.c];
        var M = new Mat(1, 2); M.d[0] = A.r; M.d[1] = A.c; return M;
      },
      length: function (ws, a) { var A = toMat(a); return Math.max(A.r, A.c); },
      numel: function (ws, a) { var A = toMat(a); return A.r * A.c; },
      isempty: function (ws, a) { var A = toMat(a); return A.r * A.c === 0; },
      transpose: function (ws, a) { return transpose(a); },
      inv: function (ws, a) { return inv(a); },
      pinv: function (ws, a) {
        var A = toMat(a);
        if (A.r === A.c) return inv(A);
        var At = toMat(transpose(A));
        return mmul(inv(mmul(At, A)), At);
      },
      det: function (ws, a) { return det(a); },
      trace: function (ws, a) { var A = toMat(a), s = 0; for (var i = 0; i < Math.min(A.r, A.c); i++) s += A.get(i, i); return s; },
      norm: function (ws, a) { var A = toMat(a), s = 0; for (var i = 0; i < A.d.length; i++) s += A.d[i] * A.d[i]; return Math.sqrt(s); },
      sum: function (ws, a) {
        var A = toMat(a);
        if (A.r === 1 || A.c === 1) { var s = 0; for (var i = 0; i < A.d.length; i++) s += A.d[i]; return s; }
        var R = new Mat(1, A.c);
        for (var j = 0; j < A.c; j++) { var t = 0; for (var k = 0; k < A.r; k++) t += A.get(k, j); R.d[j] = t; }
        return R;
      },
      max: function (ws, a, b) {
        if (b !== undefined) return ew(a, b, Math.max, "max");
        var A = toMat(a), m = -Infinity;
        for (var i = 0; i < A.d.length; i++) m = Math.max(m, A.d[i]);
        return m;
      },
      min: function (ws, a, b) {
        if (b !== undefined) return ew(a, b, Math.min, "min");
        var A = toMat(a), m = Infinity;
        for (var i = 0; i < A.d.length; i++) m = Math.min(m, A.d[i]);
        return m;
      },
      mean: function (ws, a) {
        var A = toMat(a), s = 0;
        for (var i = 0; i < A.d.length; i++) s += A.d[i];
        return s / (A.d.length || 1);
      },
      randn: function (ws, r, c) {
        var R = r === undefined ? 1 : toNum(r), C = c === undefined ? (r === undefined ? 1 : R) : toNum(c);
        if (r !== undefined && c === undefined) C = R;
        var M = new Mat(R, C);
        for (var i = 0; i < M.d.length; i++) M.d[i] = ws.randn();
        return simplify(M);
      },
      rand: function (ws, r, c) {
        var R = r === undefined ? 1 : toNum(r), C = c === undefined ? (r === undefined ? 1 : R) : toNum(c);
        var M = new Mat(R, C);
        for (var i = 0; i < M.d.length; i++) M.d[i] = ws.rnd();
        return simplify(M);
      },
      linspace: function (ws, a, b, n) {
        var N = n === undefined ? 100 : toNum(n), A = toNum(a), B2 = toNum(b), M = new Mat(1, N);
        for (var i = 0; i < N; i++) M.d[i] = A + (B2 - A) * i / (N - 1);
        return M;
      },
      clear: function () { return undefined; },
      clc: function () { return undefined; },
      close: function () { return undefined; },
      figure: function () { return undefined; },
      hold: function () { return undefined; },
      grid: function () { return undefined; },
      axis: function () { return undefined; },
      plot: function () { return undefined; },
      plot3: function () { return undefined; },
      legend: function () { return undefined; },
      xlabel: function () { return undefined; },
      ylabel: function () { return undefined; },
      title: function () { return undefined; },
      subplot: function () { return undefined; },
      drawnow: function () { return undefined; },
      pause: function () { return undefined; },
      rng: function () { return undefined; },
      fprintf: function (ws) { ws.out.push(Array.prototype.slice.call(arguments, 1).map(String).join(" ")); return undefined; },
      sprintf: function (ws, f) { return String(f); },
      num2str: function (ws, a) { return isMat(a) ? a.toString() : String(a); },
      disp: function (ws, a) { ws.out.push(isMat(a) ? a.toString() : String(a)); return undefined; },
      /* ode45('nome', tspan, y0, opts, u) -> [T, Y] (RK4 de passo fixo, suficiente aqui) */
      ode45: function (ws, fname, tspan, y0, opts, u, nargout) {
        var name = String(fname).toLowerCase();
        var deriv = ws.funcs[name] ? userDeriv(ws, name) : ODEFUNS[name];
        if (!deriv) err("ode45: função '" + fname + "' desconhecida");
        var TS = toMat(tspan), t0 = TS.d[0], t1 = TS.d[TS.d.length - 1];
        var Y0 = toMat(y0), n = Y0.r * Y0.c;
        var steps = 8, h = (t1 - t0) / steps;
        var y = Array.prototype.slice.call(Y0.d);
        var U = u === undefined ? null : toMat(u);
        var Ts = [t0], Ys = [y.slice()];
        function f(t, yy) { return deriv(t, yy, U); }
        for (var s = 0; s < steps; s++) {
          var t = t0 + s * h;
          var k1 = f(t, y);
          var y2 = y.map(function (v, i) { return v + h / 2 * k1[i]; });
          var k2 = f(t + h / 2, y2);
          var y3 = y.map(function (v, i) { return v + h / 2 * k2[i]; });
          var k3 = f(t + h / 2, y3);
          var y4 = y.map(function (v, i) { return v + h * k3[i]; });
          var k4 = f(t + h, y4);
          y = y.map(function (v, i) { return v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]); });
          Ts.push(t + h); Ys.push(y.slice());
        }
        var TM = new Mat(Ts.length, 1, Float64Array.from(Ts));
        var YM = new Mat(Ys.length, n);
        for (var i2 = 0; i2 < Ys.length; i2++) for (var j2 = 0; j2 < n; j2++) YM.set(i2, j2, Ys[i2][j2]);
        return nargout >= 2 ? [TM, YM] : YM;
      }
    };
    return B;
  }

  /* modelo do robô da Lab 4 (robot_5dpo.m) disponível de origem */
  var ODEFUNS = {
    robot_5dpo: function (t, y, u) {
      var v = u ? u.d[0] : 0, w = u ? u.d[1] : 0;
      return [v * Math.cos(y[2]), v * Math.sin(y[2]), w];
    }
  };
  function userDeriv(ws, name) {
    return function (t, y, u) {
      var Y = new Mat(y.length, 1, Float64Array.from(y));
      var r = callUser(ws, name, [t, Y, 0, u], 1);
      var R = toMat(r);
      return Array.prototype.slice.call(R.d);
    };
  }

  var BUILTINS = buildBuiltins();

  /* ---------------- avaliação ---------------- */
  var BREAK = { sig: "break" }, CONT = { sig: "continue" }, RET = { sig: "return" };

  function run(prog, ws) {
    /* regista funções locais primeiro */
    prog.forEach(function (s) { if (s.k === "funcdef") ws.funcs[s.name.toLowerCase()] = s; });
    return execBlock(prog, ws);
  }

  function execBlock(list, ws) {
    for (var i = 0; i < list.length; i++) {
      var r = execStmt(list[i], ws);
      if (r) return r;
    }
    return null;
  }

  function execStmt(s, ws) {
    ws.tick();
    switch (s.k) {
      case "funcdef": return null;
      case "noop": return null;
      case "exprstmt": evalExpr(s.e, ws); return null;
      case "assign": assign(s.target, evalExpr(s.value, ws), ws, s.line); return null;
      case "multiassign": {
        var vals = evalExpr(s.value, ws, s.targets.length);
        if (!Array.isArray(vals)) vals = [vals];
        s.targets.forEach(function (t, i) { if (t) assign(t, vals[i], ws, s.line); });
        return null;
      }
      case "if": {
        for (var i = 0; i < s.clauses.length; i++) {
          if (truthy(evalExpr(s.clauses[i].cond, ws))) return execBlock(s.clauses[i].body, ws);
        }
        return s.else ? execBlock(s.else, ws) : null;
      }
      case "for": {
        var rv = evalExpr(s.range, ws);
        var cols = [];
        if (isNum(rv)) cols = [rv];
        else {
          var M = toMat(rv);
          if (M.r === 1) { for (var c = 0; c < M.c; c++) cols.push(M.d[c]); }
          else for (var c2 = 0; c2 < M.c; c2++) {
            var col = new Mat(M.r, 1);
            for (var r2 = 0; r2 < M.r; r2++) col.d[r2] = M.get(r2, c2);
            cols.push(col);
          }
        }
        for (var k = 0; k < cols.length; k++) {
          ws.tick();
          ws.set(s.v, cols[k]);
          var res = execBlock(s.body, ws);
          if (res === BREAK) break;
          if (res === RET) return res;
        }
        return null;
      }
      case "while": {
        var guard = 0;
        while (truthy(evalExpr(s.cond, ws))) {
          ws.tick();
          if (++guard > 1000000) err("ciclo while infinito", s.line);
          var r2b = execBlock(s.body, ws);
          if (r2b === BREAK) break;
          if (r2b === RET) return r2b;
        }
        return null;
      }
      case "break": return BREAK;
      case "continue": return CONT;
      case "return": return RET;
      default: err("instrução não suportada", s.line);
    }
  }

  function truthy(v) {
    if (typeof v === "boolean") return v;
    if (isNum(v)) return v !== 0;
    var M = toMat(v);
    if (M.d.length === 0) return false;
    for (var i = 0; i < M.d.length; i++) if (M.d[i] === 0) return false;
    return true;
  }

  /* --- atribuição (incl. indexada) --- */
  function assign(target, value, ws, line) {
    if (target.k === "var") { ws.set(target.name, value); return; }
    if (target.k === "call" && target.callee.k === "var") {
      var name = target.callee.name;
      var cur = ws.get(name);
      var M = cur === undefined ? new Mat(0, 0) : toMat(cur).clone();
      var idx = target.args.map(function (a) { return a.k === "colon" ? ":" : evalExpr(a, ws); });
      setIndexed(M, idx, value, ws);
      ws.set(name, simplify(M));
      return;
    }
    err("alvo de atribuição não suportado", line);
  }

  function setIndexed(M, idx, value, ws) {
    var V = toMat(value);
    if (idx.length === 1) {
      if (idx[0] === ":") { for (var q = 0; q < M.d.length; q++) M.d[q] = V.d[Math.min(q, V.d.length - 1)]; return; }
      var lin = toIdxList(idx[0], M.r * M.c);
      lin.forEach(function (li, k) {
        /* column-major */
        var rr = M.r ? (li - 1) % M.r : 0, cc = M.r ? Math.floor((li - 1) / M.r) : li - 1;
        if (M.r <= 1) { rr = 0; cc = li - 1; }
        grow(M, rr + 1, cc + 1);
        M.set(rr, cc, V.d[Math.min(k, V.d.length - 1)]);
      });
      return;
    }
    var rows = idx[0] === ":" ? null : toIdxList(idx[0], M.r);
    var cols = idx[1] === ":" ? null : toIdxList(idx[1], M.c);
    var maxR = rows ? Math.max.apply(null, rows) : M.r;
    var maxC = cols ? Math.max.apply(null, cols) : M.c;
    grow(M, maxR, maxC);
    var RS = rows || range1(M.r), CS = cols || range1(M.c);
    var t = 0;
    for (var j = 0; j < CS.length; j++)
      for (var i = 0; i < RS.length; i++) {
        var v = V.d.length === 1 ? V.d[0] : V.d[(i * CS.length + j) % V.d.length];
        if (V.r === RS.length && V.c === CS.length) v = V.get(i, j);
        M.set(RS[i] - 1, CS[j] - 1, v);
        t++;
      }
  }
  function range1(n) { var a = []; for (var i = 1; i <= n; i++) a.push(i); return a; }
  function grow(M, r, c) {
    if (r <= M.r && c <= M.c) return;
    var nr = Math.max(r, M.r), nc = Math.max(c, M.c), D = new Float64Array(nr * nc);
    for (var i = 0; i < M.r; i++) for (var j = 0; j < M.c; j++) D[i * nc + j] = M.get(i, j);
    M.r = nr; M.c = nc; M.d = D;
  }
  function toIdxList(v, dim) {
    if (v === ":") return range1(dim);
    var M = toMat(v), out = [];
    /* índice lógico */
    for (var i = 0; i < M.d.length; i++) out.push(M.d[i]);
    return out.map(function (x) { return Math.round(x); });
  }

  /* --- expressões --- */
  function evalExpr(e, ws, nargout) {
    nargout = nargout || 1;
    switch (e.k) {
      case "num": return e.v;
      case "str": return e.v;
      case "colon": return ":";
      case "endidx": return ws.__endval !== undefined ? ws.__endval : err("'end' fora de um índice");
      case "neg": return mapEw(evalExpr(e.e, ws), function (x) { return -x; });
      case "not": return mapEw(evalExpr(e.e, ws), function (x) { return x === 0 ? 1 : 0; });
      case "transp": return transpose(evalExpr(e.e, ws));
      case "range": {
        var a = toNum(evalExpr(e.from, ws)), b = toNum(evalExpr(e.to, ws));
        var st = e.step ? toNum(evalExpr(e.step, ws)) : 1;
        var out = [];
        if (st > 0) for (var x = a; x <= b + 1e-12; x += st) out.push(x);
        else if (st < 0) for (var y = a; y >= b - 1e-12; y += st) out.push(y);
        return new Mat(1, out.length, Float64Array.from(out));
      }
      case "matrix": return buildMatrix(e, ws);
      case "var": {
        var v = ws.get(e.name);
        if (v !== undefined) return v;
        return callByName(ws, e.name, [], nargout, e.line);
      }
      case "cmp": {
        var l = evalExpr(e.l, ws), r = evalExpr(e.r, ws);
        var f = { "==": function (a2, b2) { return a2 === b2 ? 1 : 0; }, "~=": function (a2, b2) { return a2 !== b2 ? 1 : 0; },
          "<": function (a2, b2) { return a2 < b2 ? 1 : 0; }, ">": function (a2, b2) { return a2 > b2 ? 1 : 0; },
          "<=": function (a2, b2) { return a2 <= b2 ? 1 : 0; }, ">=": function (a2, b2) { return a2 >= b2 ? 1 : 0; } }[e.op];
        return ew(l, r, f, e.op);
      }
      case "bin": {
        var L = evalExpr(e.l, ws), R = evalExpr(e.r, ws);
        switch (e.op) {
          case "+": return ew(L, R, function (a2, b2) { return a2 + b2; }, "+");
          case "-": return ew(L, R, function (a2, b2) { return a2 - b2; }, "-");
          case "*": return mmul(L, R);
          case ".*": return ew(L, R, function (a2, b2) { return a2 * b2; }, ".*");
          case "/": {
            if (isNum(R) || (isMat(R) && R.isScalar())) return ew(L, toNum(R), function (a2, b2) { return a2 / b2; }, "/");
            return mmul(L, inv(R));
          }
          case "./": return ew(L, R, function (a2, b2) { return a2 / b2; }, "./");
          case "\\": {
            if (isNum(L) || (isMat(L) && L.isScalar())) return ew(R, toNum(L), function (a2, b2) { return a2 / b2; }, "\\");
            return mmul(inv(L), R);
          }
          case ".\\": return ew(R, L, function (a2, b2) { return a2 / b2; }, ".\\");
          case "^": {
            if ((isNum(L) || toMat(L).isScalar()) && (isNum(R) || toMat(R).isScalar()))
              return Math.pow(toNum(L), toNum(R));
            var n = toNum(R), A = toMat(L), Rm = eye(A.r);
            for (var i = 0; i < n; i++) Rm = toMat(mmul(Rm, A));
            return simplify(Rm);
          }
          case ".^": return ew(L, R, Math.pow, ".^");
          case "&&": return (truthy(L) && truthy(R)) ? 1 : 0;
          case "||": return (truthy(L) || truthy(R)) ? 1 : 0;
        }
        err("operador '" + e.op + "' não suportado");
        break;
      }
      case "call": {
        if (e.callee.k !== "var") err("chamada não suportada");
        var name = e.callee.name;
        var base = ws.get(name);
        if (base !== undefined) return indexValue(base, e.args, ws);
        var args = e.args.map(function (a) { return a.k === "colon" ? ":" : evalExpr(a, ws); });
        return callByName(ws, name, args, nargout, e.line);
      }
      case "field": err("estruturas não suportadas");
        break;
      default: err("expressão não suportada");
    }
  }

  function indexValue(base, argNodes, ws) {
    var M = toMat(base);
    var prevEnd = ws.__endval;
    var idx = argNodes.map(function (a, i) {
      if (a.k === "colon") return ":";
      ws.__endval = argNodes.length === 1 ? M.r * M.c : (i === 0 ? M.r : M.c);
      var v = evalExpr(a, ws);
      return v;
    });
    ws.__endval = prevEnd;
    if (idx.length === 1) {
      if (idx[0] === ":") {
        var col = new Mat(M.r * M.c, 1);
        var t = 0;
        for (var j = 0; j < M.c; j++) for (var i = 0; i < M.r; i++) col.d[t++] = M.get(i, j);
        return col;
      }
      var lin = toIdxList(idx[0], M.r * M.c);
      var R1 = new Mat(1, lin.length);
      lin.forEach(function (li, k) {
        var rr = (li - 1) % M.r, cc = Math.floor((li - 1) / M.r);
        if (rr >= M.r || cc >= M.c) err("índice fora de limites: " + li);
        R1.d[k] = M.get(rr, cc);
      });
      return simplify(R1);
    }
    var rows = idx[0] === ":" ? range1(M.r) : toIdxList(idx[0], M.r);
    var cols = idx[1] === ":" ? range1(M.c) : toIdxList(idx[1], M.c);
    var R2 = new Mat(rows.length, cols.length);
    for (var a2 = 0; a2 < rows.length; a2++)
      for (var b2 = 0; b2 < cols.length; b2++) {
        if (rows[a2] < 1 || rows[a2] > M.r || cols[b2] < 1 || cols[b2] > M.c)
          err("índice fora de limites (" + rows[a2] + "," + cols[b2] + ")");
        R2.set(a2, b2, M.get(rows[a2] - 1, cols[b2] - 1));
      }
    return simplify(R2);
  }

  function callByName(ws, name, args, nargout, line) {
    var low = name.toLowerCase();
    if (ws.funcs[low]) return callUser(ws, low, args, nargout);
    var f = BUILTINS[low];
    if (!f) err("'" + name + "' não está definido (variável ou função desconhecida)", line);
    var a = [ws].concat(args);
    if (low === "size" || low === "ode45") a.push(nargout);
    var r = f.apply(null, a);
    return r;
  }

  function callUser(ws, name, args, nargout) {
    var fn = ws.funcs[name];
    var sub = new Workspace({ seed: 1 });
    sub.funcs = ws.funcs; sub.rnd = ws.rnd; sub.steps = ws.steps; sub.maxSteps = ws.maxSteps;
    fn.params.forEach(function (p, i) { if (args[i] !== undefined) sub.set(p, args[i]); });
    execBlock(fn.body, sub);
    ws.steps = sub.steps;
    var outs = fn.outs.map(function (o) { return sub.get(o); });
    if (fn.outs.length === 0) return undefined;
    return nargout >= 2 ? outs : outs[0];
  }

  function buildMatrix(e, ws) {
    var rowMats = e.rows.map(function (row) {
      var parts = row.map(function (x) { return toMat(evalExpr(x, ws)); }).filter(function (m) { return m.r * m.c > 0 || m.r > 0; });
      if (!parts.length) return new Mat(0, 0);
      var h = Math.max.apply(null, parts.map(function (m) { return m.r; }));
      var totC = parts.reduce(function (a, m) { return a + m.c; }, 0);
      var M = new Mat(h, totC), off = 0;
      parts.forEach(function (m) {
        for (var i = 0; i < m.r; i++) for (var j = 0; j < m.c; j++) M.set(i, off + j, m.get(i, j));
        off += m.c;
      });
      return M;
    }).filter(function (m) { return m.r * m.c > 0; });
    if (!rowMats.length) return new Mat(0, 0);
    var c = rowMats[0].c;
    var totR = 0;
    rowMats.forEach(function (m) {
      if (m.c !== c) err("linhas com número de colunas diferente numa matriz (" + m.c + " vs " + c + ")");
      totR += m.r;
    });
    var R = new Mat(totR, c), ro = 0;
    rowMats.forEach(function (m) {
      for (var i = 0; i < m.r; i++) for (var j = 0; j < m.c; j++) R.set(ro + i, j, m.get(i, j));
      ro += m.r;
    });
    return simplify(R);
  }

  /* ================================================================== */
  /* API pública                                                        */
  /* ================================================================== */
  global.SAUT_MATLAB = {
    MlError: MlError,
    Mat: Mat,
    lex: lex,
    parse: parse,
    Workspace: Workspace,
    toMat: toMat,
    normAng: normAng,
    /* cria um workspace, corre o código e devolve o workspace */
    run: function (src, opts) {
      opts = opts || {};
      var ws = opts.ws || new Workspace(opts);
      if (opts.vars) for (var k in opts.vars) ws.set(k, opts.vars[k]);
      run(parse(src), ws);
      return ws;
    },
    /* converte um valor JS (número ou array de arrays) para Mat */
    fromJS: function (v) {
      if (typeof v === "number") return v;
      if (!Array.isArray(v)) return v;
      if (!Array.isArray(v[0])) return new Mat(1, v.length, Float64Array.from(v));
      var r = v.length, c = v[0].length, M = new Mat(r, c);
      for (var i = 0; i < r; i++) for (var j = 0; j < c; j++) M.set(i, j, v[i][j]);
      return M;
    },
    toJS: function (v) {
      if (isNum(v) || typeof v === "string" || typeof v === "boolean") return v;
      if (!isMat(v)) return v;
      if (v.r === 1 && v.c === 1) return v.d[0];
      var out = [];
      for (var i = 0; i < v.r; i++) { var row = []; for (var j = 0; j < v.c; j++) row.push(v.get(i, j)); out.push(row); }
      return out;
    },
    fmt: function (v) {
      if (isNum(v)) return fmtNum(v);
      if (isMat(v)) return v.toString();
      return String(v);
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
