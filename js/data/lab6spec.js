/* ===== SAUT StudyHub — especificação avaliável da Labwork 6 (robô diferencial real) =====
   ATENÇÃO À PROVENIÊNCIA — é diferente das Labs 3, 4 e 5.
   Não existe solução do professor para esta labwork: o firmware distribuído
   (picoRobotSAUT/src/actions.cpp) traz o follow_track a andar em linha reta e o
   track_localization com os passos comentados. As referências abaixo foram
   escritas a partir do ENUNCIADO (LabWork_6_DiffTractionRobot_2026.pdf), que
   especifica as fórmulas — nomeadamente a equação (1) da modulação v(ω) e as
   regras de correção de pose nos troços retos.

   Por isso as duas tarefas do follow_track são avaliadas por CRITÉRIO — «dá a
   volta?», «em quanto tempo?» — que é exatamente o que o enunciado pede, e não
   por comparação com uma solução. A geometria da pista vem do
   fill_track_segment_list() do próprio firmware.
*/
window.SAUT_LABSPEC = window.SAUT_LABSPEC || {};

(function () {
  "use strict";

  /* código dado pelo firmware, comum a todas as tarefas */
  var PRELUDE_TRACK = "";

  var PRELUDE_LOC = "";

  /* ---------- referências (derivadas do enunciado) ---------- */
  var SOL_FOLLOW = `float last_w = 0;

void action_t::follow_track(void)
{
  if (robot.IRLine.found_center) {
    robot.w_req = ktrack * robot.IRLine.pos_center;
    last_w = robot.w_req;
  } else {
    robot.w_req = last_w;
  }
  robot.v_req = v_nom;
}`;

  var SOL_FOLLOW_VW = `float last_w = 0;

void action_t::follow_track(void)
{
  float w;
  if (robot.IRLine.found_center) {
    w = ktrack * robot.IRLine.pos_center;
    last_w = w;
  } else {
    w = last_w;
  }
  robot.w_req = w;
  robot.v_req = max(0, -v_nom/(w0*w0) * (w - w0) * (w + w0));
}`;

  var SOL_LOC_XY = `void track_localization(robot_t& robot, float_list_t& w_list)
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
        if (robot.align_index == 0) {
          robot.ye = seg.Pi.y;
        } else if (robot.align_index == 1) {
          robot.xe = seg.Pi.x;
        }
        break;
      }
    }
  }
}`;

  var SOL_LOC_GEN = `void track_localization(robot_t& robot, float_list_t& w_list)
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
        htransf_2d_t Hws(seg.angle, seg.Pi.x, seg.Pi.y);
        Vec2f Ps = Hws.apply_inv(robot.xe, robot.ye);
        Ps.y = 0;
        Vec2f Pw = Hws.apply(Ps);
        robot.xe = Pw.x;
        robot.ye = Pw.y;
        break;
      }
    }
  }
}`;

  /* ---------- estado do robô nos casos de localização ---------- */
  function loc(over) {
    return Object.assign({ mean_abs_w: 0.10, prev_mean_abs_w: 0.30,
                           mean_abs_w_tresh: 0.5, align_angle_tresh: 0.15 }, over);
  }

  window.SAUT_LABSPEC["m7-mod3"] = {

    /* ============================================================ */
    follow: {
      id: "follow", lang: "clike",
      title: "Seguimento da pista — <code>follow_track</code> proporcional",
      entry: "action_t::follow_track",
      signature: "void action_t::follow_track(void)",
      prelude: PRELUDE_TRACK,
      solution: SOL_FOLLOW,
      starter: `void action_t::follow_track(void)
{
  // Variaveis disponiveis:
  //   robot.IRLine.found_center  true se o sensor esta a ver a linha
  //   robot.IRLine.pos_center    desvio da linha ao centro do sensor, em MILIMETROS
  //                              POSITIVO = a linha esta a DIREITA do robo
  //   ktrack   ganho proporcional (vem negativo por omissao)
  //   v_nom    velocidade linear nominal
  //
  // Tens de definir:
  //   robot.w_req  velocidade angular pedida, em rad/s  (+ roda para a esquerda)
  //   robot.v_req  velocidade linear pedida, em m/s     (maximo 0.4)
  //
  // ATENCAO: tens de decidir o que fazer quando o robo PERDE a linha.
  // Deixar w a zero faz o robo seguir em frente e sair da pista nas curvas
  // apertadas — e o enunciado avisa expressamente para tratares esse caso.

  robot.w_req = 0;
  robot.v_req = v_nom;
}`,
      tests: [
        { kind: "track", name: "Uma volta completa a 0.15 m/s",
          vars: { ktrack: -0.20, v_nom: 0.15, w0: 4, wz: 4 },
          sim: { laps: 1, maxTime: 60 },
          check: function (r) {
            if (!r.ok) return "só completou " + (r.laps * 100).toFixed(0) + "% da volta" +
              (r.offTrack ? " e saiu da pista." : " (tempo esgotado)." ) +
              " Nas curvas apertadas o sensor deixa de ver a linha — o que fazes nesse caso?";
            return true;
          } },
        { kind: "track", name: "Arranque desalinhado (2 cm ao lado da linha)",
          vars: { ktrack: -0.20, v_nom: 0.15, w0: 4, wz: 4 },
          sim: { laps: 1, maxTime: 60, offset: 0.02 },
          check: function (r) {
            if (!r.ok) return "não recuperou do desalinhamento inicial (" +
              (r.laps * 100).toFixed(0) + "% da volta).";
            return true;
          } },
        { kind: "track", name: "Mantém-se perto da linha (desvio máximo < 6 cm)",
          vars: { ktrack: -0.30, v_nom: 0.15, w0: 4, wz: 4 },
          sim: { laps: 1, maxTime: 60 },
          check: function (r) {
            if (!r.ok) return "não completou a volta.";
            if (r.maxDev > 0.06) return "desvio máximo de " + (r.maxDev * 1000).toFixed(0) +
              " mm (limite 60 mm) — o robô anda aos ziguezagues.";
            return true;
          } },
        { kind: "track", name: "Não abusa: v_req dentro dos limites do robô",
          vars: { ktrack: -0.20, v_nom: 0.15, w0: 4, wz: 4 },
          sim: { laps: 1, maxTime: 60 },
          check: function (r, robot) {
            if (!r.ok) return "não completou a volta.";
            if (Math.abs(robot.v_req) > 0.4001) return "v_req = " + robot.v_req.toFixed(2) +
              " m/s excede o limite de 0.4 m/s.";
            return true;
          } }
      ],
      rules: [
        { re: /found_center/, msg: "Tens de consultar o <code>robot.IRLine.found_center</code> para saber se o sensor está a ver a linha.", level: "error" },
        { re: /pos_center/, msg: "A ação de controlo é proporcional ao <code>robot.IRLine.pos_center</code>.", level: "error" },
        { re: /ktrack/, msg: "Usa o <code>ktrack</code> como ganho — é o que podes afinar a partir do ComRobot sem recompilar.", level: "error" }
      ],
      signalHints: {},
      hints: [
        "A primeira metade é simples: quando o sensor vê a linha, <code>w = ktrack · pos_center</code>. O <code>ktrack</code> já vem negativo, portanto o sinal trata-se sozinho.",
        "A segunda metade é a que decide tudo. Quando <code>found_center</code> é falso, o robô está cego. Se puseres <code>w = 0</code>, ele segue em frente e sai — é o que acontece na curva do topo.",
        "Pensa: se perdeste a linha, foi porque ela virou. Para que lado? A última leitura válida diz-te.",
        "Solução: guarda o último <code>w</code> calculado numa variável e reutiliza-o enquanto não vires a linha. Duas linhas a mais e o robô fecha a volta."
      ]
    },

    /* ============================================================ */
    followvw: {
      id: "followvw", lang: "clike",
      title: "Modulação da velocidade — <code>v(ω)</code>",
      entry: "action_t::follow_track",
      signature: "void action_t::follow_track(void)",
      prelude: PRELUDE_TRACK,
      solution: SOL_FOLLOW_VW,
      starter: `void action_t::follow_track(void)
{
  // Parte do que ja fizeste e acrescenta a modulacao nao linear da velocidade
  // linear em funcao da angular, para o robo abrandar sozinho nas curvas.
  //
  // Equacao (1) do enunciado:
  //
  //     v(w) = max( 0 , -v_nom/w0^2 * (w - w0) * (w + w0) )
  //
  // Repara: em w = 0 da v_nom, e desce ate zero quando |w| chega a w0.
  // O w0 esta disponivel como variavel.

  float w;

  robot.w_req = w;
  robot.v_req = v_nom;
}`,
      tests: [
        { kind: "track", name: "Três voltas à velocidade máxima (v_nom = 0.40 m/s)",
          vars: { ktrack: -0.40, v_nom: 0.40, w0: 4, wz: 4 },
          sim: { laps: 3, maxTime: 90 },
          check: function (r) {
            if (!r.ok) return "não completou as três voltas (" + r.laps.toFixed(2) + " voltas" +
              (r.offTrack ? ", saiu da pista" : "") + "). A 0.40 m/s o controlo proporcional puro " +
              "não chega: sem abrandar nas curvas o robô não as consegue fazer.";
            return true;
          } },
        { kind: "track", name: "E fá-lo depressa (menos de 25 s)",
          vars: { ktrack: -0.40, v_nom: 0.40, w0: 4, wz: 4 },
          sim: { laps: 3, maxTime: 90 },
          check: function (r) {
            if (!r.ok) return "não completou as três voltas.";
            if (r.time > 25) return "demorou " + r.time.toFixed(1) + " s (limite 25 s). " +
              "Se estás a abrandar demasiado, revê o expoente do w0 na equação.";
            return true;
          } },
        { kind: "track", name: "Sem sair da linha (desvio máximo < 4 cm)",
          vars: { ktrack: -0.40, v_nom: 0.40, w0: 4, wz: 4 },
          sim: { laps: 3, maxTime: 90 },
          check: function (r) {
            if (!r.ok) return "não completou as três voltas.";
            if (r.maxDev > 0.04) return "desvio máximo de " + (r.maxDev * 1000).toFixed(0) + " mm (limite 40 mm).";
            return true;
          } },
        { kind: "track", name: "Continua a funcionar com w0 mais apertado (w0 = 3)",
          vars: { ktrack: -0.40, v_nom: 0.40, w0: 3, wz: 4 },
          sim: { laps: 1, maxTime: 60 },
          check: function (r) {
            if (!r.ok) return "com w0 = 3 já não dá a volta — o w0 não pode estar fixo no código.";
            return true;
          } },
        { kind: "track", name: "A velocidade nunca fica negativa",
          vars: { ktrack: -0.40, v_nom: 0.40, w0: 2, wz: 4 },
          sim: { laps: 1, maxTime: 60 },
          check: function (r) {
            if (!r.ok) return "não completou a volta.";
            if (r.minVreq < -1e-9) return "v_req chegou a " + r.minVreq.toFixed(3) +
              " m/s — negativo. Fora do intervalo [−w0, w0] a parábola desce abaixo de zero e o robô " +
              "anda para trás; é para isso que serve o <code>max(0, …)</code>.";
            return true;
          } }
      ],
      rules: [
        { re: /w0/, msg: "A equação (1) do enunciado usa o <code>w0</code> — a velocidade angular a partir da qual a linear chega a zero.", level: "error" },
        { re: /max\s*\(/, msg: "Sem o <code>max(0, …)</code> a parábola fica negativa para |w| > w0 e o robô anda para trás.", level: "error" }
      ],
      signalHints: {},
      hints: [
        "Reaproveita o que fizeste na sub-tarefa anterior para calcular o <code>w</code>. O que muda é só a linha do <code>v_req</code>.",
        "A equação é uma parábola invertida com zeros em <code>−w0</code> e <code>+w0</code>: <code>−v_nom/w0² · (w − w0)(w + w0)</code>. Substitui <code>w = 0</code> e confirma que dá <code>v_nom</code>.",
        "Fora do intervalo [−w0, w0] a parábola é negativa — daí o <code>max(0, …)</code>.",
        "Solução: <code>robot.v_req = max(0, -v_nom/(w0*w0) * (w - w0) * (w + w0));</code> com o <code>w</code> que acabaste de calcular."
      ]
    },

    /* ============================================================ */
    locxy: {
      id: "locxy", lang: "clike",
      title: "Correção de pose nos troços horizontal e vertical",
      entry: "track_localization",
      signature: "void track_localization(robot_t& robot, float_list_t& w_list)",
      prelude: PRELUDE_LOC,
      solution: SOL_LOC_XY,
      capture: ["xe", "ye", "thetae", "align_index", "led"],
      tol: 1e-6,
      starter: `void track_localization(robot_t& robot, float_list_t& w_list)
{
  robot.led = 0;
  robot.align_index = -1;

  // So vale a pena corrigir se o robo estiver a andar DIREITO: a media do
  // |w| tem de estar abaixo do limiar E a descer.
  if (robot.mean_abs_w < robot.mean_abs_w_tresh && robot.mean_abs_w < robot.prev_mean_abs_w) {

    for (int i = 0; i < segment_list.size(); i++) {
      segment_t seg = segment_list[i];

      // O robo esta alinhado com este troco?
      if (abs(dif_angle(normalize_angle(robot.thetae), seg.angle)) < robot.align_angle_tresh) {
        robot.led = 1;
        robot.align_index = i;
        robot.thetae = seg.angle;

        // Troco 0: horizontal  -> que coordenada do robo e que passas a conhecer?
        // Troco 1: vertical    -> e neste?
        if (robot.align_index == 0) {

        } else if (robot.align_index == 1) {

        }
        break;
      }
    }
  }
}`,
      tests: [
        { name: "Alinhado com o troço de baixo (horizontal)",
          robot: loc({ xe: 0.10, ye: -0.150, thetae: 0.05 }), args: ["$ROBOT", 0] },
        { name: "Alinhado com o troço da direita (vertical)",
          robot: loc({ xe: 0.235, ye: 0.02, thetae: 1.60 }), args: ["$ROBOT", 0] },
        { name: "A curvar — não pode corrigir nada",
          robot: loc({ xe: 0.10, ye: -0.150, thetae: 0.05, mean_abs_w: 0.90 }), args: ["$ROBOT", 0] },
        { name: "Média de |w| a subir — também não corrige",
          robot: loc({ xe: 0.10, ye: -0.150, thetae: 0.05, mean_abs_w: 0.20, prev_mean_abs_w: 0.10 }),
          args: ["$ROBOT", 0] },
        { name: "Não alinhado com nenhum troço",
          robot: loc({ xe: 0.05, ye: 0.05, thetae: 0.80 }), args: ["$ROBOT", 0] },
        { name: "Alinhado com o troço da esquerda (a descer)",
          robot: loc({ xe: -0.226, ye: 0.02, thetae: -1.55 }), args: ["$ROBOT", 0] }
      ],
      rules: [
        { re: /mean_abs_w/, msg: "A correção só se faz quando o robô anda com orientação estável — é isso que a média do |ω| deteta.", level: "error" },
        { re: /align_index|seg\s*\./, msg: "Precisas de saber <b>em que troço</b> estás para saber que coordenada corrigir.", level: "error" }
      ],
      signalHints: {
        xe: "No troço <b>vertical</b> sabes o <code>x</code>: é o x do troço. O <code>y</code> continua desconhecido — o robô pode estar em qualquer ponto ao longo dele.",
        ye: "No troço <b>horizontal</b> sabes o <code>y</code>: é o y do troço. O <code>x</code> fica por saber.",
        thetae: "A orientação corrige-se sempre para o ângulo do troço, seja ele qual for — isso já está feito no esqueleto.",
        align_index: "O <code>align_index</code> tem de ficar a −1 quando não há correção, e com o índice do troço quando há."
      },
      hints: [
        "A ideia é simples: se sabes que estás em cima de uma reta, ganhaste uma equação. Numa reta horizontal, o teu <code>y</code> é o da reta. Numa vertical, o teu <code>x</code>.",
        "As coordenadas do troço estão em <code>seg.Pi</code> e <code>seg.Pf</code> — para uma horizontal, <code>seg.Pi.y</code> e <code>seg.Pf.y</code> são iguais.",
        "O troço 0 é o de baixo (horizontal) e o 1 é o da direita (vertical). Os troços 2 e 3 são as diagonais — nesta sub-tarefa ignora-os.",
        "Solução: <code>robot.ye = seg.Pi.y;</code> no troço 0 e <code>robot.xe = seg.Pi.x;</code> no troço 1."
      ]
    },

    /* ============================================================ */
    locgen: {
      id: "locgen", lang: "clike",
      title: "Caso geral — correção com transformação homogénea",
      entry: "track_localization",
      signature: "void track_localization(robot_t& robot, float_list_t& w_list)",
      prelude: PRELUDE_LOC,
      solution: SOL_LOC_GEN,
      capture: ["xe", "ye", "thetae", "align_index", "led"],
      tol: 1e-6,
      starter: `void track_localization(robot_t& robot, float_list_t& w_list)
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

        // Agora vale para QUALQUER troco, incluindo as diagonais.
        // A biblioteca htransf_2d da-te:
        //   htransf_2d_t H(angulo, tx, ty);   constroi a transformacao
        //   H.apply(P)      ou H.apply(x, y)      : do referencial do troco para o mundo
        //   H.apply_inv(P)  ou H.apply_inv(x, y)  : do mundo para o referencial do troco
        //
        // Passos: leva a pose do robo para o referencial do troco, anula a
        // componente que sabes ser zero, e traz o ponto de volta ao mundo.

        break;
      }
    }
  }
}`,
      tests: [
        { name: "Troço de baixo (horizontal) — tem de dar o mesmo que antes",
          robot: loc({ xe: 0.10, ye: -0.150, thetae: 0.05 }), args: ["$ROBOT", 0] },
        { name: "Troço da direita (vertical)",
          robot: loc({ xe: 0.235, ye: 0.02, thetae: 1.60 }), args: ["$ROBOT", 0] },
        { name: "Diagonal descendente — é aqui que o caso específico falhava",
          robot: loc({ xe: 0.10, ye: 0.090, thetae: -2.40 }), args: ["$ROBOT", 0] },
        { name: "Diagonal ascendente",
          robot: loc({ xe: -0.10, ye: 0.090, thetae: 2.40 }), args: ["$ROBOT", 0] },
        { name: "A curvar — não corrige",
          robot: loc({ xe: -0.10, ye: 0.090, thetae: 2.40, mean_abs_w: 0.90 }), args: ["$ROBOT", 0] },
        { name: "Troço da esquerda",
          robot: loc({ xe: -0.226, ye: 0.02, thetae: -1.55 }), args: ["$ROBOT", 0] }
      ],
      rules: [
        { re: /htransf_2d_t|apply_inv/, msg: "Usa a classe <code>htransf_2d_t</code> — é para isso que o professor a incluiu no projeto.", level: "error" },
        { re: /\.y\s*=\s*0|\.y\s*=\s*0\.0/, msg: "O passo central é anular a componente perpendicular ao troço: no referencial dele, o robô está sobre o eixo dos xx, logo <code>y = 0</code>.", level: "error" }
      ],
      signalHints: {
        xe: "Três passos, por esta ordem: <code>Vec2f Ps = Hws.apply_inv(robot.xe, robot.ye);</code> leva a pose para o referencial do troço; <code>Ps.y = 0;</code> projeta-a sobre a reta; <code>Vec2f Pw = Hws.apply(Ps);</code> traz de volta ao mundo.",
        ye: "A transformação constrói-se com o ângulo e a origem do troço: <code>htransf_2d_t Hws(seg.angle, seg.Pi.x, seg.Pi.y);</code>",
        align_index: "A deteção do troço não muda em relação à sub-tarefa anterior — o que muda é só o que fazes depois de o encontrares."
      },
      hints: [
        "A ideia geral: num referencial <b>alinhado com a reta</b>, estar sobre a reta significa ter <code>y = 0</code>. O problema fica trivial nesse referencial.",
        "Constrói a transformação mundo→troço a partir do ângulo do troço e de um ponto dele (o <code>Pi</code> serve).",
        "<code>apply_inv</code> leva do mundo para o troço, <code>apply</code> traz de volta. Aplica um, anula o <code>y</code>, aplica o outro.",
        "Repara que isto <b>generaliza</b> o caso anterior: aplicado ao troço horizontal dá exatamente <code>ye = Pi.y</code>, e ao vertical dá <code>xe = Pi.x</code>. Os dois primeiros testes verificam isso."
      ]
    }
  };
})();
