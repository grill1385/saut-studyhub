/* ===== SAUT StudyHub — mini-interpretador de C/C++ (subconjunto do firmware da Lab 6/7) =====
   Avalia o código que o utilizador escreve para o robô diferencial (Raspberry Pi Pico,
   PlatformIO) e para o controlador ROS do robô omni, executando-o e comparando os
   SINAIS produzidos, tal como se faz para o Pascal do SimTwo e o MATLAB.

   Cobertura da gramática:
     declarações tipadas (float/int/bool/auto e tipos de utilizador), com e sem inicializador
     funções livres e métodos (tipo Classe::nome(args)), parâmetros por referência (T&)
     if/else, for, while, do..while, return, break, continue
     expressões: aritmética, comparações, && || !, ternário ?:, ++ -- (prefixo e sufixo),
                 += -= *= /=, acesso a membros a.b e a->b, indexação a[i], chamadas e métodos,
                 construção por declaração  (Tipo v(a, b))
     comentários // e ..., literais numéricos, true/false, strings

   NÃO cobre (nem precisa): ponteiros aritméticos, templates, herança, new/delete,
   sobrecarga de operadores definida pelo utilizador, pré-processador (as #include e
   #define são ignoradas).
*/
(function (global) {
  "use strict";

  function CError(msg, line) { this.name = "CError"; this.message = msg; this.line = line || 0; }
  CError.prototype = Object.create(Error.prototype);
  CError.prototype.toString = function () { return "Linha " + this.line + ": " + this.message; };
  function err(msg, line) { throw new CError(msg, line); }

  /* ================================================================== */
  /* Lexer                                                              */
  /* ================================================================== */
  var KW = {};
  ("if else for while do return break continue switch case default struct class public private " +
   "protected const static void float double int long short unsigned signed bool char auto true false " +
   "new delete this sizeof typedef enum namespace using inline virtual").split(" ")
    .forEach(function (k) { KW[k] = 1; });

  var TYPES = {};
  ("void float double int long short unsigned signed bool char auto size_t uint32_t int32_t uint8_t")
    .split(" ").forEach(function (t) { TYPES[t] = 1; });

  function lex(src) {
    var T = [], i = 0, line = 1, n = src.length;
    function isD(c) { return c >= "0" && c <= "9"; }
    function isA(c) { return /[A-Za-z_]/.test(c); }
    while (i < n) {
      var c = src[i];
      if (c === "\n") { line++; i++; continue; }
      if (c === " " || c === "\t" || c === "\r") { i++; continue; }
      if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
      if (c === "/" && src[i + 1] === "*") {
        i += 2;
        while (i < n && !(src[i] === "*" && src[i + 1] === "/")) { if (src[i] === "\n") line++; i++; }
        i += 2; continue;
      }
      if (c === "#") { /* diretivas do pré-processador: ignoradas */
        while (i < n && src[i] !== "\n") { if (src[i] === "\\" && src[i + 1] === "\n") { i++; line++; } i++; }
        continue;
      }
      if (isD(c) || (c === "." && isD(src[i + 1]))) {
        var j = i;
        while (j < n && isD(src[j])) j++;
        if (src[j] === ".") { j++; while (j < n && isD(src[j])) j++; }
        if (src[j] === "e" || src[j] === "E") {
          var k = j + 1;
          if (src[k] === "+" || src[k] === "-") k++;
          if (isD(src[k])) { j = k; while (j < n && isD(src[j])) j++; }
        }
        var txt = src.slice(i, j);
        while (j < n && /[fFuUlL]/.test(src[j])) j++;   /* sufixos: 1.0f, 10UL */
        T.push({ t: "num", v: parseFloat(txt), line: line }); i = j; continue;
      }
      if (isA(c)) {
        var j2 = i;
        while (j2 < n && (isA(src[j2]) || isD(src[j2]))) j2++;
        var w = src.slice(i, j2);
        T.push({ t: KW[w] ? "kw" : "id", v: w, line: line }); i = j2; continue;
      }
      if (c === '"' || c === "'") {
        var q = c, j3 = i + 1, s = "";
        while (j3 < n && src[j3] !== q) {
          if (src[j3] === "\\") { s += src[j3 + 1]; j3 += 2; } else { s += src[j3]; j3++; }
        }
        T.push({ t: "str", v: s, line: line }); i = j3 + 1; continue;
      }
      var three = src.substr(i, 3);
      if (three === "<<=" || three === ">>=" || three === "...") { T.push({ t: "op", v: three, line: line }); i += 3; continue; }
      var two = src.substr(i, 2);
      if (["==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "%=", "->", "::", "<<", ">>"].indexOf(two) >= 0) {
        T.push({ t: "op", v: two, line: line }); i += 2; continue;
      }
      if ("+-*/%()[]{};,.<>=!&|^~?:".indexOf(c) >= 0) { T.push({ t: "op", v: c, line: line }); i++; continue; }
      err("carácter inesperado '" + c + "'", line);
    }
    T.push({ t: "eof", v: "", line: line });
    return T;
  }

  /* ================================================================== */
  /* Parser                                                             */
  /* ================================================================== */
  function parse(src, knownTypes) {
    var T = lex(src), p = 0;
    var userTypes = Object.assign({}, knownTypes || {});

    function pk(o) { return T[p + (o || 0)]; }
    function at(t, v) { var x = T[p]; return x.t === t && (v === undefined || x.v === v); }
    function atOp(v) { return at("op", v); }
    function atKw(v) { return at("kw", v); }
    function nx() { return T[p++]; }
    function want(t, v) {
      if (!at(t, v)) err("esperava '" + (v || t) + "' mas encontrei '" + (T[p].v || T[p].t) + "'", T[p].line);
      return T[p++];
    }
    function isTypeTok(tk) {
      if (!tk) return false;
      if (tk.t === "kw" && TYPES[tk.v]) return true;
      if (tk.t === "id" && userTypes[tk.v]) return true;
      return false;
    }

    /* consome qualificadores e um nome de tipo; devolve o nome */
    function readType() {
      while (atKw("const") || atKw("static") || atKw("unsigned") || atKw("signed") ||
             atKw("inline") || atKw("virtual")) nx();
      if (!isTypeTok(pk())) return null;
      var name = nx().v;
      while (atKw("long") || atKw("int") || atKw("double")) nx();   /* long long int … */
      while (atOp("*") || atOp("&")) nx();                          /* T*  T&  */
      return name;
    }

    /* --- topo do ficheiro --- */
    var decls = [];
    while (!at("eof")) {
      if (atOp(";")) { nx(); continue; }
      if (atKw("using") || atKw("namespace") || atKw("typedef")) { while (!atOp(";") && !at("eof")) nx(); if (atOp(";")) nx(); continue; }
      if (atKw("struct") || atKw("class")) { skipClass(); continue; }
      var d = parseTopDecl();
      if (d) decls.push(d);
    }

    function skipClass() {
      nx();                                   /* struct|class */
      if (at("id")) userTypes[pk().v] = 1;
      var depth = 0;
      while (!at("eof")) {
        if (atOp("{")) depth++;
        if (atOp("}")) { depth--; nx(); if (depth <= 0) { if (atOp(";")) nx(); return; } continue; }
        nx();
      }
    }

    function parseTopDecl() {
      var start = p;
      var ty = readType();
      if (ty === null) { /* não é declaração: salta a linha */ nx(); return null; }
      /* Classe::metodo  ou  nome */
      var cls = null, name;
      if (!at("id")) { p = start; nx(); return null; }
      name = nx().v;
      if (atOp("::")) { nx(); cls = name; name = want("id").v; }
      if (atOp("(")) {
        var params = parseParams();
        while (atKw("const")) nx();
        if (atOp(";")) { nx(); return null; }              /* protótipo */
        if (!atOp("{")) { p = start; nx(); return null; }
        var body = parseBlock();
        return { k: "func", cls: cls, name: name, params: params, body: body, ret: ty };
      }
      /* variável global (com ou sem inicializador / construtor) */
      var init = null;
      if (atOp("=")) { nx(); init = parseExpr(); }
      else if (atOp("(")) { nx(); var args = []; if (!atOp(")")) { args.push(parseExpr()); while (atOp(",")) { nx(); args.push(parseExpr()); } } want("op", ")"); init = { k: "ctor", type: ty, args: args }; }
      while (atOp(",")) { nx(); if (at("id")) nx(); if (atOp("=")) { nx(); parseExpr(); } }
      if (atOp(";")) nx();
      return { k: "gvar", type: ty, name: name, init: init };
    }

    function parseParams() {
      want("op", "(");
      var out = [];
      while (!atOp(")")) {
        if (atOp(",")) { nx(); continue; }
        var ty = readType();
        if (ty === "void" && atOp(")")) break;
        var nm = at("id") ? nx().v : null;
        while (atOp("[")) { nx(); while (!atOp("]")) nx(); nx(); }
        if (atOp("=")) { nx(); parseExpr(); }
        if (nm) out.push({ name: nm, type: ty });
      }
      want("op", ")");
      return out;
    }

    function parseBlock() {
      want("op", "{");
      var list = [];
      while (!atOp("}") && !at("eof")) list.push(parseStmt());
      want("op", "}");
      return { k: "block", body: list };
    }

    function parseStmt() {
      var tk = pk();
      if (atOp("{")) return parseBlock();
      if (atOp(";")) { nx(); return { k: "empty" }; }
      if (tk.t === "kw") {
        switch (tk.v) {
          case "if": {
            nx(); want("op", "(");
            var c = parseExpr(); want("op", ")");
            var th = parseStmt(), el = null;
            if (atKw("else")) { nx(); el = parseStmt(); }
            return { k: "if", cond: c, then: th, else: el, line: tk.line };
          }
          case "while": {
            nx(); want("op", "(");
            var wc = parseExpr(); want("op", ")");
            return { k: "while", cond: wc, body: parseStmt(), line: tk.line };
          }
          case "do": {
            nx();
            var b = parseStmt();
            want("kw", "while"); want("op", "(");
            var dc = parseExpr(); want("op", ")");
            if (atOp(";")) nx();
            return { k: "dowhile", body: b, cond: dc, line: tk.line };
          }
          case "for": {
            nx(); want("op", "(");
            var init = atOp(";") ? null : parseSimpleStmt();
            if (atOp(";")) nx();
            var cond = atOp(";") ? null : parseExpr();
            want("op", ";");
            var step = atOp(")") ? null : parseExpr();
            want("op", ")");
            return { k: "for", init: init, cond: cond, step: step, body: parseStmt(), line: tk.line };
          }
          case "return": {
            nx();
            var v = atOp(";") ? null : parseExpr();
            if (atOp(";")) nx();
            return { k: "return", value: v, line: tk.line };
          }
          case "break": nx(); if (atOp(";")) nx(); return { k: "break" };
          case "continue": nx(); if (atOp(";")) nx(); return { k: "continue" };
          default: break;
        }
      }
      var s = parseSimpleStmt();
      if (atOp(";")) nx();
      return s;
    }

    /* declaração local ou expressão */
    function parseSimpleStmt() {
      var start = p, tk = pk();
      if (isTypeTok(tk) || atKw("const") || atKw("static")) {
        var isStatic = false;
        for (var q0 = p; q0 < p + 3 && T[q0]; q0++) {
          if (T[q0].t === "kw" && T[q0].v === "static") { isStatic = true; break; }
          if (T[q0].t !== "kw") break;
        }
        var ty = readType();
        if (ty !== null && at("id")) {
          var decls2 = [];
          for (;;) {
            var nm = want("id").v, init = null;
            if (atOp("[")) { nx(); var sz = atOp("]") ? null : parseExpr(); want("op", "]"); init = { k: "arr", size: sz }; }
            if (atOp("=")) { nx(); init = parseExpr(); }
            else if (atOp("(")) {
              nx(); var args = [];
              if (!atOp(")")) { args.push(parseExpr()); while (atOp(",")) { nx(); args.push(parseExpr()); } }
              want("op", ")");
              init = { k: "ctor", type: ty, args: args };
            }
            decls2.push({ name: nm, init: init });
            if (atOp(",")) { nx(); continue; }
            break;
          }
          return { k: "decl", type: ty, decls: decls2, isStatic: isStatic, line: tk.line };
        }
        p = start;
      }
      return { k: "exprstmt", e: parseExpr(), line: tk.line };
    }

    /* --- expressões --- */
    function parseExpr() { return parseAssign(); }
    function parseAssign() {
      var l = parseTernary();
      if (atOp("=") || atOp("+=") || atOp("-=") || atOp("*=") || atOp("/=") || atOp("%=")) {
        var op = nx().v;
        return { k: "assign", op: op, target: l, value: parseAssign() };
      }
      return l;
    }
    function parseTernary() {
      var c = parseOr();
      if (atOp("?")) {
        nx();
        var a = parseAssign(); want("op", ":");
        return { k: "ternary", cond: c, a: a, b: parseAssign() };
      }
      return c;
    }
    function parseOr() { var l = parseAnd(); while (atOp("||")) { nx(); l = { k: "bin", op: "||", l: l, r: parseAnd() }; } return l; }
    function parseAnd() { var l = parseEq(); while (atOp("&&")) { nx(); l = { k: "bin", op: "&&", l: l, r: parseEq() }; } return l; }
    function parseEq() {
      var l = parseRel();
      while (atOp("==") || atOp("!=")) { var o = nx().v; l = { k: "bin", op: o, l: l, r: parseRel() }; }
      return l;
    }
    function parseRel() {
      var l = parseAdd();
      while (atOp("<") || atOp(">") || atOp("<=") || atOp(">=")) { var o = nx().v; l = { k: "bin", op: o, l: l, r: parseAdd() }; }
      return l;
    }
    function parseAdd() {
      var l = parseMul();
      while (atOp("+") || atOp("-")) { var o = nx().v; l = { k: "bin", op: o, l: l, r: parseMul() }; }
      return l;
    }
    function parseMul() {
      var l = parseUnary();
      while (atOp("*") || atOp("/") || atOp("%")) { var o = nx().v; l = { k: "bin", op: o, l: l, r: parseUnary() }; }
      return l;
    }
    function parseUnary() {
      if (atOp("-")) { nx(); return { k: "neg", e: parseUnary() }; }
      if (atOp("+")) { nx(); return parseUnary(); }
      if (atOp("!")) { nx(); return { k: "not", e: parseUnary() }; }
      if (atOp("++") || atOp("--")) { var o = nx().v; return { k: "preinc", op: o, e: parseUnary() }; }
      if (atOp("(") && isTypeTok(pk(1)) && pk(2) && pk(2).t === "op" && pk(2).v === ")") {
        nx(); nx(); nx();                       /* cast: (float)x */
        return parseUnary();
      }
      return parsePostfix(parseAtom());
    }
    function parsePostfix(node) {
      for (;;) {
        if (atOp(".") || atOp("->")) { nx(); node = { k: "member", obj: node, name: want("id").v }; }
        else if (atOp("[")) { nx(); var idx = parseExpr(); want("op", "]"); node = { k: "index", obj: node, idx: idx }; }
        else if (atOp("(")) {
          nx(); var args = [];
          if (!atOp(")")) { args.push(parseExpr()); while (atOp(",")) { nx(); args.push(parseExpr()); } }
          want("op", ")");
          node = { k: "call", callee: node, args: args };
        }
        else if (atOp("++") || atOp("--")) { var o = nx().v; node = { k: "postinc", op: o, e: node }; }
        else break;
      }
      return node;
    }
    function parseAtom() {
      var tk = pk();
      if (tk.t === "num") { nx(); return { k: "num", v: tk.v }; }
      if (tk.t === "str") { nx(); return { k: "str", v: tk.v }; }
      if (atKw("true")) { nx(); return { k: "bool", v: true }; }
      if (atKw("false")) { nx(); return { k: "bool", v: false }; }
      if (atKw("this")) { nx(); return { k: "this" }; }
      if (atOp("(")) { nx(); var e = parseExpr(); want("op", ")"); return e; }
      if (tk.t === "id" || (tk.t === "kw" && TYPES[tk.v])) {
        nx();
        if (atOp("::")) { nx(); var m = want("id").v; return { k: "var", name: tk.v + "::" + m, line: tk.line }; }
        return { k: "var", name: tk.v, line: tk.line };
      }
      err("expressão inválida perto de '" + (tk.v || tk.t) + "'", tk.line);
    }

    return { decls: decls, types: userTypes };
  }

  /* ================================================================== */
  /* Runtime                                                            */
  /* ================================================================== */
  function Scope(parent) { this.vars = Object.create(null); this.parent = parent; }
  Scope.prototype.get = function (n) {
    var s = this;
    while (s) { if (n in s.vars) return s.vars[n]; s = s.parent; }
    return undefined;
  };
  Scope.prototype.has = function (n) {
    var s = this;
    while (s) { if (n in s.vars) return true; s = s.parent; }
    return false;
  };
  Scope.prototype.set = function (n, v) {
    var s = this;
    while (s) { if (n in s.vars) { s.vars[n] = v; return; } s = s.parent; }
    this.vars[n] = v;
  };
  Scope.prototype.declare = function (n, v) { this.vars[n] = v; };

  var BREAK = { sig: "break" }, CONT = { sig: "continue" };
  function RET(v) { return { sig: "return", value: v }; }

  function truthy(v) { return !(v === 0 || v === false || v === null || v === undefined); }

  function Interp(opts) {
    opts = opts || {};
    this.globals = new Scope(null);
    this.funcs = Object.create(null);
    this.steps = 0;
    this.maxSteps = opts.maxSteps || 8000000;
    this.natives = opts.natives || {};
    this.types = opts.types || {};
  }

  Interp.prototype.tick = function () {
    if (++this.steps > this.maxSteps) err("execução demasiado longa (ciclo infinito?)");
  };

  Interp.prototype.load = function (src) {
    var prog = parse(src, this.types);
    var self = this;
    prog.decls.forEach(function (d) {
      if (d.k === "func") {
        var key = (d.cls ? d.cls + "::" : "") + d.name;
        self.funcs[key] = d;
        if (!self.funcs[d.name]) self.funcs[d.name] = d;   /* também pelo nome simples */
      } else if (d.k === "gvar") {
        self.globals.declare(d.name, d.init ? self.evalExpr(d.init, self.globals) : 0);
      }
    });
    return prog;
  };

  Interp.prototype.call = function (name, args) {
    var f = this.funcs[name];
    if (!f) err("a função '" + name + "' não está definida no teu código");
    var sc = new Scope(this.globals);
    f.params.forEach(function (prm, i) { sc.declare(prm.name, args[i]); });
    var r = this.execBlock(f.body.body, sc);
    return r && r.sig === "return" ? r.value : undefined;
  };
  Interp.prototype.hasFunc = function (name) { return !!this.funcs[name]; };

  Interp.prototype.execBlock = function (list, sc) {
    for (var i = 0; i < list.length; i++) {
      var r = this.exec(list[i], sc);
      if (r) return r;
    }
    return null;
  };

  Interp.prototype.exec = function (s, sc) {
    this.tick();
    switch (s.k) {
      case "empty": return null;
      case "block": return this.execBlock(s.body, new Scope(sc));
      case "exprstmt": this.evalExpr(s.e, sc); return null;
      case "decl": {
        for (var i = 0; i < s.decls.length; i++) {
          var d = s.decls[i], v;
          /* 'static' local: vive uma só vez e persiste entre chamadas — guarda-se
             no âmbito global, que é o que dá a semântica certa ao reatribuir */
          if (s.isStatic) {
            if (!(d.name in this.globals.vars)) {
              this.globals.declare(d.name,
                d.init && d.init.k !== "arr" && d.init.k !== "ctor"
                  ? this.evalExpr(d.init, sc) : this.defaultFor(s.type));
            }
            continue;
          }
          if (!d.init) v = this.defaultFor(s.type);
          else if (d.init.k === "arr") v = new Array(d.init.size ? this.evalExpr(d.init.size, sc) : 0).fill(0);
          else if (d.init.k === "ctor") v = this.construct(d.init.type, d.init.args.map(a => this.evalExpr(a, sc)));
          else v = this.evalExpr(d.init, sc);
          sc.declare(d.name, v);
        }
        return null;
      }
      case "if": return truthy(this.evalExpr(s.cond, sc)) ? this.exec(s.then, new Scope(sc))
                                                          : (s.else ? this.exec(s.else, new Scope(sc)) : null);
      case "while": {
        var guard = 0;
        while (truthy(this.evalExpr(s.cond, sc))) {
          this.tick();
          if (++guard > 2000000) err("ciclo while infinito", s.line);
          var r = this.exec(s.body, new Scope(sc));
          if (r === BREAK) break;
          if (r && r.sig === "return") return r;
        }
        return null;
      }
      case "dowhile": {
        do {
          this.tick();
          var r2 = this.exec(s.body, new Scope(sc));
          if (r2 === BREAK) break;
          if (r2 && r2.sig === "return") return r2;
        } while (truthy(this.evalExpr(s.cond, sc)));
        return null;
      }
      case "for": {
        var fs = new Scope(sc);
        if (s.init) this.exec(s.init, fs);
        while (s.cond === null || truthy(this.evalExpr(s.cond, fs))) {
          this.tick();
          var r3 = this.exec(s.body, new Scope(fs));
          if (r3 === BREAK) break;
          if (r3 && r3.sig === "return") return r3;
          if (s.step) this.evalExpr(s.step, fs);
        }
        return null;
      }
      case "return": return RET(s.value ? this.evalExpr(s.value, sc) : undefined);
      case "break": return BREAK;
      case "continue": return CONT;
      default: err("instrução não suportada", s.line || 0);
    }
  };

  Interp.prototype.defaultFor = function (ty) {
    if (this.types[ty] && this.natives["new " + ty]) return this.natives["new " + ty]([]);
    if (ty === "bool") return false;
    return 0;
  };
  Interp.prototype.construct = function (ty, args) {
    var f = this.natives["new " + ty];
    if (f) return f(args);
    return this.defaultFor(ty);
  };

  /* --- lvalues --- */
  Interp.prototype.assignTo = function (node, val, sc) {
    if (node.k === "var") { sc.set(node.name, val); return val; }
    if (node.k === "member") {
      var o = this.evalExpr(node.obj, sc);
      if (o === undefined || o === null) err("acesso a membro de um objeto inexistente");
      o[node.name] = val; return val;
    }
    if (node.k === "index") {
      var a = this.evalExpr(node.obj, sc), i = this.evalExpr(node.idx, sc);
      if (a && typeof a.set === "function") { a.set(i, val); return val; }
      a[i] = val; return val;
    }
    err("alvo de atribuição inválido");
  };

  Interp.prototype.evalExpr = function (e, sc) {
    this.tick();
    var self = this;
    switch (e.k) {
      case "num": return e.v;
      case "str": return e.v;
      case "bool": return e.v;
      case "this": return sc.get("this");
      case "neg": return -this.evalExpr(e.e, sc);
      case "not": return !truthy(this.evalExpr(e.e, sc));
      case "ternary": return truthy(this.evalExpr(e.cond, sc)) ? this.evalExpr(e.a, sc) : this.evalExpr(e.b, sc);
      case "var": {
        if (sc.has(e.name)) return sc.get(e.name);
        if (this.natives[e.name] !== undefined) return this.natives[e.name];
        if (this.funcs[e.name]) return { __fn: e.name };
        err("'" + e.name + "' não está declarado", e.line);
        break;
      }
      case "member": {
        var o = this.evalExpr(e.obj, sc);
        if (o === undefined || o === null) err("acesso a '." + e.name + "' num objeto inexistente");
        var v = o[e.name];
        if (typeof v === "function") return { __bound: v, __self: o };
        return v;
      }
      case "index": {
        var a = this.evalExpr(e.obj, sc), i = this.evalExpr(e.idx, sc);
        if (a && typeof a.get === "function") return a.get(i);
        if (a === undefined) err("indexação de um objeto inexistente");
        return a[i];
      }
      case "assign": {
        var cur, nv;
        if (e.op === "=") nv = this.evalExpr(e.value, sc);
        else {
          cur = this.evalExpr(e.target, sc);
          var rhs = this.evalExpr(e.value, sc);
          nv = e.op === "+=" ? cur + rhs : e.op === "-=" ? cur - rhs :
               e.op === "*=" ? cur * rhs : e.op === "/=" ? cur / rhs : cur % rhs;
        }
        return this.assignTo(e.target, nv, sc);
      }
      case "preinc": {
        var v0 = this.evalExpr(e.e, sc) + (e.op === "++" ? 1 : -1);
        this.assignTo(e.e, v0, sc); return v0;
      }
      case "postinc": {
        var v1 = this.evalExpr(e.e, sc);
        this.assignTo(e.e, v1 + (e.op === "++" ? 1 : -1), sc); return v1;
      }
      case "bin": {
        if (e.op === "&&") return truthy(this.evalExpr(e.l, sc)) ? truthy(this.evalExpr(e.r, sc)) : false;
        if (e.op === "||") return truthy(this.evalExpr(e.l, sc)) ? true : truthy(this.evalExpr(e.r, sc));
        var a2 = this.evalExpr(e.l, sc), b2 = this.evalExpr(e.r, sc);
        switch (e.op) {
          case "+": return a2 + b2; case "-": return a2 - b2;
          case "*": return a2 * b2; case "/": return a2 / b2;
          case "%": return a2 % b2;
          case "<": return a2 < b2; case ">": return a2 > b2;
          case "<=": return a2 <= b2; case ">=": return a2 >= b2;
          case "==": return a2 === b2; case "!=": return a2 !== b2;
        }
        err("operador '" + e.op + "' não suportado");
        break;
      }
      case "call": {
        var args = e.args.map(function (a) { return self.evalExpr(a, sc); });
        var c = e.callee;
        /* método de objeto */
        if (c.k === "member") {
          var obj = this.evalExpr(c.obj, sc);
          if (obj && typeof obj[c.name] === "function") return obj[c.name].apply(obj, args);
          err("o objeto não tem o método '" + c.name + "'");
        }
        if (c.k === "var") {
          var nm = c.name;
          if (this.funcs[nm]) {
            var f = this.funcs[nm];
            var fs2 = new Scope(this.globals);
            f.params.forEach(function (prm, i) { fs2.declare(prm.name, args[i]); });
            var r = this.execBlock(f.body.body, fs2);
            return r && r.sig === "return" ? r.value : undefined;
          }
          if (typeof this.natives[nm] === "function") return this.natives[nm].apply(null, args);
          if (this.types[nm] || this.natives["new " + nm]) return this.construct(nm, args);
          err("função desconhecida '" + nm + "'", c.line);
        }
        var fv = this.evalExpr(c, sc);
        if (fv && fv.__bound) return fv.__bound.apply(fv.__self, args);
        err("chamada inválida");
        break;
      }
      default: err("expressão não suportada");
    }
  };

  /* ================================================================== */
  /* API pública                                                        */
  /* ================================================================== */
  global.SAUT_CLIKE = {
    CError: CError,
    lex: lex,
    parse: parse,
    Interp: Interp,
    /* cria um interpretador, carrega o código e devolve-o pronto a chamar */
    build: function (src, opts) {
      var it = new Interp(opts);
      it.load(src);
      return it;
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
