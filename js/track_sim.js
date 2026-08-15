/* ===== SAUT StudyHub — simulador da pista e do robô diferencial da Lab 6 =====
   A geometria vem do fill_track_segment_list() do firmware do professor
   (picoRobotSAUT/src/actions.cpp): cinco troços retos, ligados por cantos.
   Aqui os cantos são arredondados, como na pista impressa.

   Serve para avaliar o follow_track pelo CRITÉRIO do enunciado — «a velocidade
   máxima que permite dar uma volta completa» e «o melhor tempo para três voltas» —
   em vez de comparar com uma solução, que não existe.

   Convenção do sensor (importante e assumida aqui):
     pos_center > 0  →  a linha está à DIREITA do centro do sensor
     w > 0           →  o robô roda para a ESQUERDA (sentido direto)
   É coerente com o ktrack negativo que vem por omissão no firmware.
*/
(function (global) {
  "use strict";

  /* vértices do percurso, no sentido de marcha (a partir dos troços do professor) */
  var VERTICES = [
    [-0.23, -0.145],   // início do troço de baixo
    [0.23, -0.145],    // canto inferior direito
    [0.23, 0.12],      // topo do lado direito
    [0.197, 0.165],    // início da diagonal
    [0.0, 0.0],        // vértice do V
    [-0.197, 0.165],   // fim da diagonal
    [-0.23, 0.12],     // topo do lado esquerdo
    [-0.23, -0.08]     // lado esquerdo (fecha em VERTICES[0])
  ];

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k]; }
  function len(a) { return Math.hypot(a[0], a[1]); }
  function unit(a) { var L = len(a); return L ? [a[0] / L, a[1] / L] : [0, 0]; }

  /* Constrói a linha central da pista: polilinha densa com cantos arredondados. */
  function buildTrack(radius, ds) {
    radius = radius === undefined ? 0.035 : radius;
    ds = ds || 0.002;
    var V = VERTICES, n = V.length, pts = [];

    for (var i = 0; i < n; i++) {
      var prev = V[(i - 1 + n) % n], cur = V[i], next = V[(i + 1) % n];
      var d0 = unit(sub(prev, cur)), d1 = unit(sub(next, cur));
      var ang = Math.acos(Math.max(-1, Math.min(1, d0[0] * d1[0] + d0[1] * d1[1])));
      var half = ang / 2;
      var cut = Math.min(radius / Math.tan(half),
                         len(sub(prev, cur)) * 0.45, len(sub(next, cur)) * 0.45);
      if (!isFinite(cut) || cut < 1e-6) { pts.push(cur.slice()); continue; }
      var A = add(cur, mul(d0, cut)), B = add(cur, mul(d1, cut));
      /* arco aproximado por Bézier quadrática A–cur–B */
      var steps = Math.max(4, Math.round((cut * 2) / ds));
      for (var t = 0; t <= steps; t++) {
        var u = t / steps, w = 1 - u;
        pts.push([w * w * A[0] + 2 * w * u * cur[0] + u * u * B[0],
                  w * w * A[1] + 2 * w * u * cur[1] + u * u * B[1]]);
      }
    }

    /* reamostra a intervalos ~ds e fecha o circuito */
    var dense = [], j;
    for (j = 0; j < pts.length; j++) {
      var a = pts[j], b = pts[(j + 1) % pts.length];
      var L = len(sub(b, a)), k = Math.max(1, Math.round(L / ds));
      for (var q = 0; q < k; q++) {
        var u2 = q / k;
        dense.push([a[0] + (b[0] - a[0]) * u2, a[1] + (b[1] - a[1]) * u2]);
      }
    }
    var acc = [0];
    for (j = 1; j < dense.length; j++) acc.push(acc[j - 1] + len(sub(dense[j], dense[j - 1])));
    var total = acc[acc.length - 1] + len(sub(dense[0], dense[dense.length - 1]));
    return { pts: dense, s: acc, length: total };
  }

  var TRACK = null;
  function track() { if (!TRACK) TRACK = buildTrack(); return TRACK; }

  /* ponto da pista mais próximo de (x, y); devolve distância, posição no percurso
     e o desvio lateral COM SINAL relativo à direção de marcha do robô */
  function nearest(tk, x, y, theta) {
    var best = Infinity, bi = 0;
    for (var i = 0; i < tk.pts.length; i++) {
      var dx = tk.pts[i][0] - x, dy = tk.pts[i][1] - y;
      var d2 = dx * dx + dy * dy;
      if (d2 < best) { best = d2; bi = i; }
    }
    var P = tk.pts[bi];
    var ex = P[0] - x, ey = P[1] - y;
    /* componente lateral no referencial do robô: +y do robô é a ESQUERDA */
    var lateral = -Math.sin(theta) * ex + Math.cos(theta) * ey;
    return { dist: Math.sqrt(best), s: tk.s[bi], idx: bi, lateral: lateral };
  }

  /* ------------------------------------------------------------------ */
  /* Simulação                                                          */
  /* ------------------------------------------------------------------ */
  /* opts: {dt, sensorAhead, sensorRange, vmax, wmax, laps, maxTime, start}
     step(robot) é chamada a cada ciclo depois de o sensor ser atualizado. */
  function simulate(step, robot, opts) {
    opts = opts || {};
    var tk = track();
    var dt = opts.dt || 0.04;
    var ahead = opts.sensorAhead === undefined ? 0.030 : opts.sensorAhead;  // sensor à frente do eixo
    var range = opts.sensorRange === undefined ? 0.035 : opts.sensorRange; // ±40 mm
    var vmax = opts.vmax === undefined ? 0.4 : opts.vmax;
    var wmax = opts.wmax === undefined ? 8 : opts.wmax;
    var laps = opts.laps || 1;
    var maxTime = opts.maxTime || 120;

    /* arranca a meio da reta de baixo, alinhado com a pista */
    var i0 = opts.startIdx;
    if (i0 === undefined) {
      var bestd = Infinity;
      for (var z = 0; z < tk.pts.length; z++) {
        var dd = Math.hypot(tk.pts[z][0] - 0.0, tk.pts[z][1] + 0.145);
        if (dd < bestd) { bestd = dd; i0 = z; }
      }
    }
    var P0 = tk.pts[i0], P1 = tk.pts[(i0 + 5) % tk.pts.length];
    var st = { x: P0[0], y: P0[1], th: Math.atan2(P1[1] - P0[1], P1[0] - P0[0]) };
    if (opts.offset) {
      st.x += -Math.sin(st.th) * opts.offset;
      st.y += Math.cos(st.th) * opts.offset;
    }

    var t = 0, prevS = tk.s[i0], progress = 0, maxDev = 0, lost = 0, offTrack = false;
    var minV = Infinity, maxW = 0;
    var nsteps = Math.round(maxTime / dt);

    for (var k = 0; k < nsteps; k++) {
      var sx = st.x + Math.cos(st.th) * ahead, sy = st.y + Math.sin(st.th) * ahead;
      var nr = nearest(tk, sx, sy, st.th);

      robot.IRLine.found_center = nr.dist <= range;
      robot.IRLine.pos_center = robot.IRLine.found_center ? nr.lateral * -1000 : 0; // mm, + à direita
      robot.v_req = 0; robot.w_req = 0;

      step(robot);

      if ((robot.v_req || 0) < minV) minV = robot.v_req || 0;
      if (Math.abs(robot.w_req || 0) > maxW) maxW = Math.abs(robot.w_req || 0);
      var v = Math.max(-vmax, Math.min(vmax, robot.v_req || 0));
      var w = Math.max(-wmax, Math.min(wmax, robot.w_req || 0));

      st.th += w * dt;
      st.x += v * dt * Math.cos(st.th);
      st.y += v * dt * Math.sin(st.th);
      t += dt;

      /* desvio do CENTRO do robô à pista */
      var cn = nearest(tk, st.x, st.y, st.th);
      if (cn.dist > maxDev) maxDev = cn.dist;
      if (cn.dist > 0.10) { offTrack = true; break; }   // perdeu a pista de vez
      if (!robot.IRLine.found_center) lost++;

      /* progresso ao longo do percurso, com passagem pelo fim */
      var d = cn.s - prevS;
      if (d > tk.length / 2) d -= tk.length;
      if (d < -tk.length / 2) d += tk.length;
      progress += d;
      prevS = cn.s;

      if (progress >= laps * tk.length) {
        return { ok: true, time: t, laps: laps, maxDev: maxDev, lostFrac: lost / (k + 1),
                 minVreq: minV, maxWreq: maxW, progress: progress, trackLen: tk.length };
      }
    }
    return { ok: false, time: t, laps: progress / tk.length, maxDev: maxDev,
             lostFrac: lost / nsteps, offTrack: offTrack, minVreq: minV, maxWreq: maxW,
             progress: progress, trackLen: tk.length };
  }

  global.SAUT_TRACK = {
    VERTICES: VERTICES,
    buildTrack: buildTrack,
    track: track,
    nearest: nearest,
    simulate: simulate
  };
})(typeof window !== "undefined" ? window : globalThis);
