// SAUT StudyHub — metadados dos milestones (fonte: SAUT_Plano_de_Estudo.docx)
window.SAUT_META = [
  {
    id: "m0", num: "M0", title: "Fundamentos", prio: "MÉDIA",
    short: "Locomoção, tração e sensores — a base de linguagem antes da Lab 1.",
    lab: "Base transversal (não é Lab Work; prepara Labs 1, 3 e 5)",
    objetivo: "Criar a base de conceitos: como se move um robô, que sensores existem e como se lê um encoder/laser. Sem isto, os slides de odometria e EKF ficam abstratos.",
    decks: ["MobileRobotics_Locomotion_and_traction (17 págs, BAIXA-MÉDIA, ~43 min)", "SAUT_Percep_and_sensors (26 págs, MÉDIA, ~1h18)"],
    tempo: "~2h01 de slides",
    exame: "Suporte indireto às perguntas de odometria (constante K) e deteção de beacons por laser."
  },
  {
    id: "m1", num: "M1", title: "Lab 1 — Odometria", prio: "ALTA",
    short: "Equações de movimento e dead-reckoning do robô diferencial. Tema mais recorrente no exame.",
    lab: "Lab 1 — Odometria (SimTwo, robô diferencial): estimar a pose (x, y, θ) a partir dos encoders.",
    objetivo: "Dominar as equações de odometria do robô diferencial — a fundação de tudo (o EKF usa-as como modelo de movimento).",
    decks: ["MobileRobotics_KinematicsDynamics (36 págs, ALTA, ~2h24)"],
    tempo: "~2h24 de slides + prática SimTwo",
    exame: "Perguntas 1, 2 e 12 do exame modelo — praticamente garantidas: forward vs centered, escrever pose_update, calcular a constante K."
  },
  {
    id: "m2", num: "M2", title: "Lab 2 — Controlo diferencial", prio: "ALTA",
    short: "GotoXYTheta, FollowLine e máquinas de estados no robô diferencial.",
    lab: "Lab 2 — Rotinas de controlo: GotoXYTheta, FollowLine, FollowCircle com máquinas de estados.",
    objetivo: "Perceber os controladores de trajetória por máquina de estados e controlo proporcional.",
    decks: ["SAUT_Traj_Control (30 págs, ALTA, ~2h30)"],
    tempo: "~2h30 de slides + prática SimTwo",
    exame: "Erros do GotoXYTheta (P7), ganho proporcional alto → oscilações (P15), caminho curto vs rápido."
  },
  {
    id: "m3", num: "M3", title: "Lab 3 — Omnidirecional", prio: "MÉDIA",
    short: "Controlo de V, Vn e W; trajetórias, curvas paramétricas e mapas.",
    lab: "Lab 3 — GotoXY, FollowLine e FollowCircle num robô omnidirecional.",
    objetivo: "Estender o controlo ao robô omni (duas máquinas de estados) e cobrir geração de trajetórias e mapas.",
    decks: ["KinematicsDynamics — parte omni (8 págs, MÉDIA, ~20 min)", "SAUT_Trajectories_Maps (63 págs, MÉDIA, ~3h09)"],
    tempo: "~3h29 de slides + prática SimTwo",
    exame: "Pergunta sobre as duas máquinas de estados (linear + angular) no controlo do omnidirecional."
  },
  {
    id: "m4", num: "M4", title: "Lab 4 — EKF beacons (Matlab)", prio: "ALTA+",
    short: "O núcleo do exame: Filtro de Kalman Estendido com beacons. Máximo tempo aqui.",
    lab: "Lab 4 — Simulador Matlab: trajetória circular + EKF para estimar a pose a partir de beacons (distância e ângulo).",
    objetivo: "Dominar o EKF: predição (motion model + Jacobiano) e atualização (h, ∇h, S, ganho de Kalman).",
    decks: ["SAUT_KalmanFilter (7 págs, ALTA+, ~56 min)", "SAUT_Loc_EKFBeacons (13 págs, ALTA+, ~1h31)", "SAUT_EKF_Loc_Landmarks_Ex_Lego (36 págs, ALTA, ~2h24)", "SAUT_Loc_Trian_Trilat (28 págs, MÉDIA, ~1h24)", "SAUT_Example_Triangulation (38 págs, MÉDIA, ~1h35)"],
    tempo: "~7h50 de slides + Matlab",
    exame: "Perguntas 3, 5, 11, 13 (+ base da 4/6). O tema com mais peso no exame."
  },
  {
    id: "m5", num: "M5", title: "Lab 5 — EKF laser + validação", prio: "ALTA",
    short: "Deteção de beacons no laser, clustering, validação de medidas e ruído.",
    lab: "Lab 5 — SimTwo: robô diferencial com laser scan e 3 beacons cilíndricos; EKF completo.",
    objetivo: "Ligar o EKF a um sensor laser real: detetar beacons, validar medidas (outliers) e afinar Q/R.",
    decks: ["SAUT_Loc_Validation (16 págs, ALTA, ~1h20)"],
    tempo: "~1h20 de slides + SimTwo",
    exame: "Perguntas 4 e 6 — funções validate_laser_measure e BeaconPoints: sabe escrevê-las de cor."
  },
  {
    id: "m6", num: "M6", title: "Localização avançada e SLAM", prio: "MÉDIA-ALTA",
    short: "Filtro de partículas e kidnap, map matching (Perfect Match) e SLAM.",
    lab: "Extensão teórica das Labs 4/5 — sem Lab dedicada, mas cai no exame.",
    objetivo: "Fechar a localização em três passos: largar a hipótese gaussiana do EKF (partículas), localizar por correspondência com o mapa todo em vez de beacons isolados (map matching), e finalmente deixar cair a hipótese de o mapa ser conhecido (SLAM).",
    decks: ["SAUT_Prob_Localization (23 págs, ALTA, ~1h32)", "SAUT_Loc_Map_Matching (27 págs, MÉDIA-ALTA, ~1h35)", "SAUT_SLAM (38 págs, MÉDIA, ~1h35)"],
    tempo: "~4h42 de slides",
    exame: "Monte Carlo/kidnap, rejeição de outliers, map matching (P14), landmarks lineares."
  },
  {
    id: "m7", num: "M7", title: "Labs 6 e 7 — Robôs reais", prio: "BAIXA",
    short: "Setup do ambiente, firmware e os algoritmos das Labs 1–3 em hardware real.",
    lab: "Lab 6 — robô diferencial real (Raspberry Pi Pico). Lab 7 — omni real com ROS.",
    objetivo: "Passar do simulador ao hardware: preparar o ambiente (VM, ROS, firmware), perceber o que muda quando o robô é real, e reimplementar lá a odometria e o controlo das Labs 1–3.",
    decks: ["Enunciado LabWork 6 — robô diferencial (Pico)", "Enunciado LabWork 7 + Guia de setup da VM (ROS)", "SAUT_MultiRobot (12 págs, BAIXA, ~24 min)", "Apresentacao_Drone (8 págs, BAIXA, ~12 min)"],
    tempo: "~36 min de slides + setup e hardware",
    exame: "Raramente no exame escrito; o peso está no setup e na demonstração das Labs 6 e 7."
  }
];
