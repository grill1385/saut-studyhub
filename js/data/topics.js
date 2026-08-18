// Taxonomia de tópicos da UC → módulos (para a aba Stats)
// pct de cada tópico = média do progresso dos módulos listados; ms:"mX" = milestone ainda em stub (0%)
window.SAUT_TOPICS = [
  { area:"Fundamentos", topics:[
    { id:"loco",    name:"Locomoção e tração",            modules:["m0-mod1"] },
    { id:"sens",    name:"Sensores e perceção",           modules:["m0-mod2","m0-mod4"] },
    { id:"enc",     name:"Encoders e constante K",        modules:["m0-mod3"] }
  ]},
  { area:"Odometria e Cinemática", topics:[
    { id:"ododif",  name:"Odometria diferencial",         modules:["m1-mod1","m1-mod2","m1-mod3","m1-mod4"] },
    { id:"cinomni", name:"Cinemática omnidirecional",     modules:["m3-mod1"] }
  ]},
  { area:"Controlo de Movimento", topics:[
    { id:"ctrldif", name:"Controlo diferencial (GotoXY, FollowLine)", modules:["m2-mod1","m2-mod2","m2-mod3","m2-mod5"] },
    { id:"ctrlomni",name:"Controlo omnidirecional (2 FSM)",modules:["m3-mod2","m3-mod6"] },
    { id:"trajpar", name:"Trajetórias paramétricas e MPC", modules:["m2-mod4"] }
  ]},
  { area:"Planeamento e Mapas", topics:[
    { id:"plan",    name:"Path planning (Bug, roadmaps, células)", modules:["m3-mod3"] },
    { id:"astar",   name:"Campos de potencial e A*",       modules:["m3-mod4"] },
    { id:"multi",   name:"Obstáculos móveis e TeA*",       modules:["m3-mod5"] }
  ]},
  { area:"Localização", topics:[
    { id:"kf",      name:"Filtro de Kalman (linear)",      modules:["m4-mod1"] },
    { id:"ekf",     name:"EKF — beacons",                  modules:["m4-mod2","m4-mod3","m4-mod4","m4-mod7"] },
    { id:"trian",   name:"Triangulação e trilateração",    modules:["m4-mod5"] },
    { id:"fusao",   name:"Fusão sensorial",                modules:["m4-mod6"] },
    { id:"laser",   name:"EKF laser + validação",          modules:["m5-mod1","m5-mod2","m5-mod3","m5-mod4","m5-mod5","m5-mod6"] },
    { id:"mcl",     name:"Localização Monte Carlo",        modules:["m6-mod1","m6-mod2"] },
    { id:"mapm",    name:"Map matching",                   modules:["m6-mod3","m6-mod4"] }
  ]},
  { area:"Tópicos Avançados", topics:[
    { id:"slam",    name:"SLAM",                           modules:["m6-mod5","m6-mod6"] },
    { id:"mrob",    name:"Multi-robô e robôs reais",       modules:["m7-mod1","m7-mod2","m7-mod3","m7-mod4"] }
  ]}
];
