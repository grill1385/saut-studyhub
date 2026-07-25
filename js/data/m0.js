// M0 — Fundamentos (Locomotion & Traction + Perception & Sensors)
window.SAUT_CONTENT = window.SAUT_CONTENT || {};
window.SAUT_CONTENT["m0"] = { modules: [

/* ============ MÓDULO 1 — Locomoção e tração ============ */
{ id:"m0-mod1", title:"Locomoção e tipos de tração", minutes:30, kind:"study",
  blurb:"Tipos de tração terrestre (diferencial, sincronizada, triciclo, Ackerman, omni) + locomoção aquática/aérea. Slides Locomotion, págs. 1–17.",
  pages:[
  { type:"theory", title:"Porque importa a locomoção?",
    html:`<p>Um robô móvel é definido, antes de tudo, pela forma como se move. O tipo de <b>tração</b> determina a <b>cinemática</b> (que equações descrevem o movimento), os <b>graus de liberdade controláveis</b> e o tipo de odometria possível.</p>
    <div class="hl">Nesta UC vais trabalhar sobretudo com dois tipos: <b>tração diferencial</b> (Labs 1, 2, 5, 6) e <b>tração omnidirecional</b> (Labs 3 e 7). Guarda os outros como cultura geral com potencial pergunta teórica.</div>
    <p>Roteiro deste módulo: trações terrestres → outras trações (lagartas, pernas) → locomoção aquática e aérea → exercícios.</p>`,
    slideRef:"MobileRobotics_Locomotion_and_traction, págs. 1–2" },

  { type:"theory", title:"Tração diferencial",
    html:`<p>Duas rodas motrizes independentes no mesmo eixo + roda(s) livre(s) de apoio. O movimento resulta da <b>diferença de velocidades</b> entre as rodas:</p>
    <ul><li><code>v1 = v2</code> → linha reta</li>
    <li><code>v1 = −v2</code> → rotação sobre o próprio eixo (raio nulo)</li>
    <li><code>v1 ≠ v2</code> → arco de circunferência</li></ul>
    <p>É o tipo mais simples e barato; é o robô das Labs 1, 2, 5 e 6. Não consegue deslocar-se lateralmente (restrição não-holonómica).</p>`,
    figures:[{src:"assets/slides/locomotion/page-03.png", caption:"Slide 3 — Differential traction", focus:"a disposição das 2 rodas motrizes + roda livre; o centro de rotação fica sobre o eixo das rodas"}],
    slideRef:"Locomotion, pág. 3" },

  { type:"theory", title:"Tração sincronizada, triciclo e Ackerman",
    html:`<p><b>Sincronizada (synchro-drive):</b> todas as rodas rodam e orientam-se em sincronia — o chassis translada sem rodar; a orientação do robô mantém-se.</p>
    <p><b>Triciclo:</b> uma roda dianteira orientável (e normalmente motriz) + duas rodas traseiras fixas. O ângulo da roda da frente α define o raio de curvatura. Sem deslocação lateral e raio mínimo limitado.</p>
    <p><b>Ackerman (automóvel):</b> duas rodas dianteiras orientáveis com ângulos ligeiramente diferentes para que todas as rodas girem em torno do mesmo <b>centro instantâneo de rotação (CIR)</b> — evita derrapagem nas curvas.</p>`,
    figures:[{src:"assets/slides/locomotion/page-05.png", caption:"Slide 5 — Tricycle traction", focus:"a roda dianteira orientável define o CIR na interseção com o eixo traseiro"},
             {src:"assets/slides/locomotion/page-06.png", caption:"Slide 6 — Ackerman traction", focus:"os ângulos diferentes das duas rodas da frente que convergem no mesmo CIR"}],
    slideRef:"Locomotion, págs. 4–6" },

  { type:"theory", title:"Tração omnidirecional",
    html:`<p>Rodas especiais (suecas/mecanum, com rolos) permitem movimento em <b>qualquer direção e rotação simultânea</b>: 3 graus de liberdade controláveis no plano — <code>V</code> (frente), <code>Vn</code> (lateral) e <code>W</code> (angular).</p>
    <ul><li>Configurações típicas: 3 rodas a 120° ou 4 rodas a 90°/45°.</li>
    <li>Robô <b>holonómico</b>: pode corrigir a posição sem manobras.</li>
    <li>Custo: mais derrapagem/vibração → odometria pior (relevante na Lab 3!).</li></ul>
    <div class="exam">O controlo do robô omni usa <b>duas máquinas de estados</b> (movimento linear + angular) — pergunta do exame ligada à Lab 3.</div>`,
    figures:[{src:"assets/slides/locomotion/page-07.png", caption:"Slide 7 — Omnidirectional traction", focus:"os rolos perpendiculares na periferia das rodas — deslizam na direção passiva"},
             {src:"assets/slides/locomotion/page-08.png", caption:"Slide 8 — Omnidirectional (cont.)", focus:"disposição das rodas (3×120° ou 4×) e os vetores V, Vn, W"}],
    slideRef:"Locomotion, págs. 7–8" },

  { type:"quiz", title:"Checkpoint — trações terrestres", questions:[
    { kind:"mcq", q:"Num robô de tração diferencial, para rodar sobre o próprio eixo (raio nulo) deve ter-se:",
      options:["v1 = v2 ≠ 0","v1 = −v2","v1 = 0 e v2 = 0","v1 muito maior que v2"], answer:1,
      hint:"As rodas têm de andar em sentidos opostos com o mesmo módulo.",
      explain:"Com v1=−v2 o ponto médio do eixo fica parado e o robô roda em torno dele: ω=(v1−v2)/b e v=0." },
    { kind:"mcq", q:"Qual a vantagem principal da geometria de Ackerman face a duas rodas dianteiras paralelas?",
      options:["Maior velocidade máxima","Todas as rodas giram em torno do mesmo CIR, evitando derrapagem","Permite movimento lateral","Dispensa diferencial no eixo motor"], answer:1,
      hint:"Pensa no que acontece aos pneus de um carro numa curva apertada.",
      explain:"Os ângulos diferentes das rodas interiores/exteriores garantem um CIR comum — as rodas rolam sem escorregar." },
    { kind:"flash", front:"Que 3 velocidades controlas num robô omnidirecional?", back:"<b>V</b> (linear frontal), <b>Vn</b> (linear lateral/normal) e <b>W</b> (angular). 3 DOF no plano → robô holonómico." },
    { kind:"mcq", q:"Qual destes robôs NÃO consegue deslocar-se lateralmente sem manobrar?",
      options:["Omnidirecional de 3 rodas","Omnidirecional de 4 rodas mecanum","Tração diferencial","Todos conseguem"], answer:2,
      hint:"Restrição não-holonómica…",
      explain:"O diferencial (tal como triciclo e Ackerman) é não-holonómico: a velocidade lateral é sempre nula." }
  ]},

  { type:"theory", title:"Outras trações: lagartas, pernas, rastejar",
    html:`<p><b>Lagartas (tracks):</b> excelente tração em terreno irregular; a rotação faz-se por derrapagem (skid-steering) → <b>odometria muito má</b>.</p>
    <p><b>Pernas (legs):</b> locomoção em terrenos muito irregulares/escadas; complexidade mecânica e de controlo elevada (equilíbrio, gaits).</p>
    <p><b>Rastejar (crawling):</b> robôs tipo cobra — redundância e acesso a espaços confinados.</p>`,
    figures:[{src:"assets/slides/locomotion/page-09.png", caption:"Slide 9 — Tracks", focus:"nota que a mudança de direção implica derrapagem das lagartas"}],
    slideRef:"Locomotion, págs. 9–11" },

  { type:"theory", title:"Locomoção aquática e aérea",
    html:`<p><b>Aquática:</b> baseada em <i>thrusters</i> (propulsores — ROVs/AUVs, controlo direto de força) ou em <i>superfícies de controlo</i> (gliders, submarinos, veleiros como o FastFEUP — eficiência energética, menor manobrabilidade).</p>
    <p><b>Aérea:</b> só com motores (multirrotores/drones — pairar, VTOL, gasto energético alto) ou com motores + superfícies de sustentação (aviões — eficiência, precisam de velocidade mínima).</p>
    <div class="hl">Peso baixo no exame — fica com a taxonomia: thrusters vs superfícies; rotores vs asas.</div>`,
    figures:[{src:"assets/slides/locomotion/page-13.png", caption:"Slide 13 — Thrusters", focus:"a disposição dos propulsores que dá controlo em vários eixos"}],
    slideRef:"Locomotion, págs. 12–17" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Porque é que a odometria num robô de lagartas é pouco fiável?",
      options:["Os encoders das lagartas têm pouca resolução","A rotação faz-se por derrapagem (skid-steering), violando o modelo de rolamento puro","As lagartas não têm encoders","O centro de massa desloca-se"], answer:1,
      hint:"Como é que um robô de lagartas muda de direção?",
      explain:"A odometria assume rolamento sem escorregamento; no skid-steering a derrapagem é o próprio mecanismo de viragem." },
    { kind:"flash", front:"Tração sincronizada: o que acontece à orientação do chassis quando o robô muda de direção?", back:"Mantém-se — todas as rodas se orientam em sincronia e o chassis translada sem rodar." },
    { kind:"mcq", q:"Um glider submarino desloca-se sobretudo à custa de:",
      options:["Thrusters de elevada potência","Variação de flutuabilidade + superfícies de controlo","Rodas no fundo do mar","Jatos de água orientáveis"], answer:1,
      explain:"Gliders trocam flutuabilidade e usam asas/superfícies para converter subida/descida em avanço — muito eficientes." }
  ]}
]},

/* ============ MÓDULO 2 — Perceção e características de sensores ============ */
{ id:"m0-mod2", title:"Perceção: classificação e características de sensores", minutes:25, kind:"study",
  blurb:"Características (gama, resolução, exatidão…), proprio/exterocetivo, ativo/passivo, sensores de força/contacto. Slides Percep&Sensors, págs. 1–7.",
  pages:[
  { type:"theory", title:"Características importantes de um sensor",
    html:`<p>Para escolher/avaliar um sensor num sistema autónomo:</p>
    <ul><li><b>Gama de medida</b> (measurement range)</li>
    <li><b>Resolução</b> — menor variação detetável</li>
    <li><b>Linearidade</b></li>
    <li><b>Largura de banda</b> — quão depressa atualiza</li>
    <li><b>Caracterização do erro</b> — essencial para os filtros: é daqui que vêm as matrizes <code>R</code> do Kalman!</li>
    <li><b>Exatidão / repetibilidade</b> (accuracy vs repeatability)</li>
    <li><b>Robustez</b> a variações do ambiente</li>
    <li>Preço / tamanho / peso / consumo</li></ul>
    <div class="hl">Distingue <b>exatidão</b> (proximidade ao valor verdadeiro) de <b>repetibilidade</b> (dispersão entre medidas repetidas). Um sensor pode ser repetível mas inexato (erro sistemático → calibrável).</div>`,
    figures:[{src:"assets/slides/sensors/page-03.png", caption:"Slide 3 — Características dos sensores", focus:"a lista completa; memoriza 'error characterization' — liga ao ruído R do EKF"}],
    slideRef:"SAUT_Percep_and_sensors, págs. 2–3" },

  { type:"theory", title:"Classificação: propriocetivo/exterocetivo, ativo/passivo",
    html:`<p><b>Propriocetivo:</b> mede o estado interno do robô. Ex.: <b>encoders</b>, giroscópio, tensão da bateria.</p>
    <p><b>Exterocetivo:</b> a medida depende do ambiente. Ex.: ultrassons, laser, câmara, bússola.</p>
    <p><b>Passivo:</b> só observa a energia do ambiente. Ex.: interruptor, câmara (sem iluminação própria), bússola.</p>
    <p><b>Ativo:</b> emite energia e mede a resposta. Ex.: laser scanner, ultrassons, infravermelhos.</p>
    <div class="exam">Classificar sensores nestas 2×2 categorias é pergunta teórica clássica. Ex.: laser = exterocetivo + ativo; encoder = propriocetivo (+ passivo/ativo conforme a leitura ótica).</div>`,
    figures:[{src:"assets/slides/sensors/page-04.png", caption:"Slide 4 — Perception characterization", focus:"as definições e os exemplos dados pelo professor (encoder vs ultra-som; switch vs laser)"}],
    slideRef:"SAUT_Percep_and_sensors, pág. 4" },

  { type:"theory", title:"Sensores de força e contacto",
    html:`<p><b>Células de carga, piezo, variação de resistência:</b> medem força/pressão de forma contínua.</p>
    <p><b>Switches, bumpers, barreiras:</b> deteção binária de contacto/presença — os sensores mais simples e robustos; usados como paragens de emergência e deteção de colisão.</p>`,
    figures:[{src:"assets/slides/sensors/page-07.png", caption:"Slide 7 — Switches e bumpers", focus:"exemplos físicos de bumpers para deteção de colisão"}],
    slideRef:"SAUT_Percep_and_sensors, págs. 6–7" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Um laser scanner (LiDAR) classifica-se como:",
      options:["Propriocetivo e passivo","Propriocetivo e ativo","Exterocetivo e passivo","Exterocetivo e ativo"], answer:3,
      hint:"Emite luz e mede o ambiente…",
      explain:"Depende do ambiente (exterocetivo) e emite energia própria (ativo)." },
    { kind:"mcq", q:"Um encoder incremental na roda do robô é um sensor:",
      options:["Exterocetivo — depende do piso","Propriocetivo — mede o estado interno (rotação do eixo)","Passivo exterocetivo","Nenhuma das anteriores"], answer:1,
      explain:"Mede a rotação do próprio eixo do robô, independentemente do ambiente → propriocetivo. (A derrapagem é que faz a odometria divergir da realidade!)" },
    { kind:"flash", front:"Porque interessa a 'caracterização do erro' de um sensor para o EKF?", back:"É dela que sai a matriz <b>R</b> (covariância do ruído de medida). Sem conhecer o desvio-padrão do sensor não se afina o filtro (Lab 5: rSensD, rSensA)." },
    { kind:"input", q:"Sensor que mede a orientação relativa ao campo magnético e é muito sensível a materiais ferromagnéticos (uma palavra, em português ou inglês):",
      answer:["bussola","bússola","compass"],
      hint:"Aparece no slide 12; é mais útil em outdoor.",
      explain:"A bússola/compass: em indoor sofre perturbações, mas pode dar informação qualitativa para rejeitar outliers." }
  ]}
]},

/* ============ MÓDULO 3 — Encoders e sensores de movimento ============ */
{ id:"m0-mod3", title:"Encoders e sensores de movimento interno", minutes:30, kind:"study",
  blurb:"Encoder absoluto vs incremental (base da constante K!), taco, resolver, bússola, giroscópio, IMU. Slides Percep&Sensors, págs. 8–13 e 22–23.",
  pages:[
  { type:"theory", title:"Encoders: absoluto vs incremental",
    html:`<p><b>Encoder absoluto:</b> cada posição angular tem um código único (Gray) → sabe a posição mesmo depois de desligar. Mais caro, resolução limitada pelo nº de pistas.</p>
    <p><b>Encoder incremental (ótico ou magnético):</b> gera <b>impulsos</b> à medida que o eixo roda; contar impulsos dá o deslocamento <i>relativo</i>; 2 canais em quadratura (A/B) dão o sentido.</p>
    <div class="hl">É o sensor da odometria: <span class="formula">Δd_roda = K · N_impulsos, com K [m/impulso]</span> A constante <b>K</b> converte impulsos em metros — vais medi-la na Lab 1 e calculá-la no exame (P12).</div>
    <p>De onde vem K teoricamente? Uma volta da roda = <code>π·D</code> metros e gera <code>N_v</code> impulsos (impulsos/volta × redução da caixa):</p>
    <span class="formula">K = π·D / N_v&nbsp;&nbsp;[m/imp]</span>`,
    figures:[{src:"assets/slides/sensors/page-08.png", caption:"Slide 8 — Encoders absoluto e incremental", focus:"o disco do incremental: os impulsos A/B em quadratura (sentido de rotação)"}],
    slideRef:"SAUT_Percep_and_sensors, pág. 8" },

  { type:"quiz", title:"Checkpoint — encoders", questions:[
    { kind:"input", q:"Uma roda tem diâmetro D = 0,10 m e o encoder gera 2000 impulsos por volta da roda. Calcula K em m/impulso (3 alg. sig., ex.: 0.000157):",
      answer: 0.000157, tolerance: 0.000002, unit:"m/imp",
      hint:"Uma volta = π·D metros = π·0,10 ≈ 0,314 m, dividida por 2000 impulsos.",
      explain:"K = π·0,10/2000 = 1,571×10⁻⁴ m/imp. No exame (P12) o mesmo raciocínio aparece com 1,5 voltas: usa sempre distância_total/impulsos_totais." },
    { kind:"mcq", q:"A vantagem do encoder absoluto sobre o incremental é:",
      options:["Maior resolução sempre","Conhecer a posição imediatamente após ligar, sem referência","Ser mais barato","Gerar impulsos em quadratura"], answer:1,
      explain:"O absoluto lê um código único por posição; o incremental só mede deslocamentos relativos e precisa de homing." },
    { kind:"flash", front:"Exame P12 (padrão): o robô dá 1,5 voltas de roda e acumula N impulsos. Como calculas K?", back:"K = distância/impulsos = (1,5·π·D)/N [m/imp]. Cuidado: usa o diâmetro da RODA e confirma se N é o total das 1,5 voltas ou por volta!" }
  ]},

  { type:"theory", title:"Outros sensores de eixo e de rotação",
    html:`<p><b>Taco-gerador:</b> tensão proporcional à velocidade angular (analógico).</p>
    <p><b>Resolver / potenciómetro:</b> posição angular absoluta analógica.</p>
    <p><b>Bússola:</b> orientação relativa ao campo magnético; sensível a materiais ferromagnéticos e correntes → melhor outdoor; indoor serve para rejeição qualitativa de outliers.</p>
    <p><b>Inclinómetro:</b> inclinação relativa à gravidade.</p>
    <p><b>Giroscópio:</b> velocidade angular; mecânico (forças) ou ótico (interferência de luz — fibra ótica). Integração de ω dá orientação, mas com <b>deriva (drift)</b>.</p>`,
    figures:[{src:"assets/slides/sensors/page-12.png", caption:"Slide 12 — Bússola e inclinómetro", focus:"as limitações da bússola indoor (perturbações ferromagnéticas)"},
             {src:"assets/slides/sensors/page-13.png", caption:"Slide 13 — Giroscópio", focus:"os dois princípios: mecânico (forças) vs ótico (interferência)"}],
    slideRef:"SAUT_Percep_and_sensors, págs. 9–13" },

  { type:"theory", title:"Acelerómetros e IMU",
    html:`<p><b>Acelerómetro:</b> mede aceleração via F=ma (ex.: massa+mola). Sensores low-cost têm <b>ruído elevado</b> — dupla integração para posição diverge rapidamente.</p>
    <p><b>IMU (Inertial Measurement Unit):</b> combina acelerómetros + giroscópios + magnetómetros, todos em 3 eixos, com pré-processamento (fusão interna). Dá orientação/aceleração; a posição por inércia continua a derivar → precisa de correção externa (GPS, beacons, mapa…).</p>
    <div class="hl">Padrão que se repete na UC: sensores internos <i>derivam</i> (odometria, IMU) e sensores externos <i>corrigem</i> (laser, beacons, GPS). É exatamente a lógica predição/atualização do EKF.</div>`,
    figures:[{src:"assets/slides/sensors/page-23.png", caption:"Slide 23 — IMU", focus:"a composição: 3× acelerómetro + 3× giroscópio + 3× magnetómetro"}],
    slideRef:"SAUT_Percep_and_sensors, págs. 22–23" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Porque é que estimar a posição integrando duas vezes um acelerómetro low-cost falha ao fim de poucos segundos?",
      options:["A gravidade não é constante","O ruído é integrado duas vezes e o erro cresce sem limite","Os acelerómetros só medem em 1 eixo","A frequência de amostragem é baixa"], answer:1,
      explain:"Ruído e bias integrados duas vezes → erro de posição cresce ~t². Mesma lógica do erro acumulado da odometria." },
    { kind:"mcq", q:"Qual destes sensores dá diretamente VELOCIDADE angular?",
      options:["Encoder absoluto","Giroscópio","Inclinómetro","Bússola"], answer:1,
      explain:"O giroscópio mede ω; integrando obtém-se orientação (com drift)." },
    { kind:"flash", front:"Qual é o 'padrão' sensores internos vs externos que atravessa toda a UC?", back:"Internos (encoders, IMU) → estimativa contínua mas com deriva (predição). Externos (laser, beacons, GPS) → correção absoluta mas intermitente/ruidosa (atualização). O EKF funde os dois." }
  ]}
]},

/* ============ MÓDULO 4 — Beacons, distância e visão ============ */
{ id:"m0-mod4", title:"Sensores de distância, beacons e visão", minutes:30, kind:"study",
  blurb:"Beacons (distância/ângulo), ultrassons, laser range finder, IR, visão e 3D. Slides Percep&Sensors, págs. 14–26.",
  pages:[
  { type:"theory", title:"Medir em relação a beacons",
    html:`<p><b>Beacons</b> são marcos artificiais em posições conhecidas do mapa. O robô mede <b>distância</b> e/ou <b>ângulo</b> a cada beacon e daí estima a sua pose (Labs 4 e 5!).</p>
    <ul><li><b>Distância</b>: beacons acústicos (tempo de voo), rádio/ultrassom, GPS (rádio de satélites).</li>
    <li><b>Distância + ângulo</b>: laser com refletores — o scanner deteta o refletor e dá (d, φ).</li>
    <li><b>Ângulo</b>: sensores óticos / câmara omnidirecional (Lab 4, partes 3–4).</li></ul>
    <div class="exam">O modelo de medida h(M,X) = [distância; ângulo] ao beacon é O coração do EKF do exame (P3). Este slide é a versão física desse modelo.</div>`,
    figures:[{src:"assets/slides/sensors/page-15.png", caption:"Slide 15 — Distância/ângulo com refletores (laser)", focus:"o laser a varrer e a detetar refletores — é o cenário da Lab 5 com beacons cilíndricos"}],
    slideRef:"SAUT_Percep_and_sensors, págs. 14–16" },

  { type:"theory", title:"Ultrassons e infravermelhos",
    html:`<p><b>Ultrassons:</b> mede tempo de voo do som: <span class="formula">d = c·t / 2</span> Gama típica 10 cm–5 m, f &gt; 30 kHz. Limitações: reflexão depende da superfície e do ângulo; lento — objeto a 3,5 m demora 20 ms; um anel de 10 sensores (para evitar interferências) só consegue ~5 varrimentos/s.</p>
    <p><b>Infravermelhos:</b> reflexão simples (binário/curta distância) ou <b>triangulação</b> (ex. sensores Sharp). Sensível à luz ambiente, cor e textura da superfície.</p>`,
    figures:[{src:"assets/slides/sensors/page-18.png", caption:"Slide 18 — Ultrassons: números-chave", focus:"os números: 10cm–5m, >30kHz, 20ms @ 3,5m, 5 medidas/s com anel de 10"}],
    slideRef:"SAUT_Percep_and_sensors, págs. 17–18, 20" },

  { type:"theory", title:"Laser range finder (LiDAR)",
    html:`<p>Mede distância pela <b>diferença de fase</b> entre a onda emitida e a refletida:</p>
    <span class="formula">d = λθ / 4π</span>
    <p>Um espelho rotativo produz um <b>varrimento (scan)</b>: N raios por volta, cada um com (índice → ângulo, distância). É o sensor da Lab 5:</p>
    <ul><li>ângulo do raio i: <code>φ_i = i·(2π/N_raios)</code> (+ offset do sensor)</li>
    <li>quantos raios atingem um beacon cilíndrico depende do diâmetro e da distância — função <b>BeaconPoints</b> do exame (P6): <code>floor(arcsin(diam/dist)·N/(2π))</code></li></ul>
    <div class="hl">Fixa já a ideia: o laser devolve pares (índice_do_raio, distância) → converter para coordenadas globais exige a pose estimada do robô + offset do sensor.</div>`,
    figures:[{src:"assets/slides/sensors/page-19.png", caption:"Slide 19 — Laser range finder", focus:"o princípio da diferença de fase e o espelho rotativo que gera o varrimento"}],
    slideRef:"SAUT_Percep_and_sensors, pág. 19" },

  { type:"quiz", title:"Checkpoint — distância", questions:[
    { kind:"input", q:"Um ultrassom recebe o eco 12 ms depois de emitir (c = 340 m/s). A que distância está o obstáculo? (em metros)",
      answer: 2.04, tolerance: 0.03, unit:"m",
      hint:"d = c·t/2 — o som vai E volta.",
      explain:"d = 340×0,012/2 = 2,04 m. Não te esqueças do ÷2!" },
    { kind:"mcq", q:"O laser range finder dos slides mede a distância através de:",
      options:["Tempo de voo de um impulso único","Diferença de fase entre onda emitida e refletida","Triangulação com duas câmaras","Intensidade da luz refletida"], answer:1,
      explain:"d = λθ/4π — diferença de fase. (Existem LiDARs de tempo de voo, mas o slide usa a fase.)" },
    { kind:"mcq", q:"Porque é que um anel de 10 sonares só faz ~5 medidas/s por sensor?",
      options:["Limitação do microcontrolador","Os sensores disparam à vez para evitar interferência mútua (crosstalk)","O som demora 200 ms a 3,5 m","Consumo de energia"], answer:1,
      explain:"Se disparassem juntos, o eco de um seria captado por outro. 10 sensores × 20 ms = 200 ms por ciclo → 5 Hz." }
  ]},

  { type:"theory", title:"Visão artificial e sensores 3D",
    html:`<p><b>Câmara:</b> características importantes — resolução (640×480…), bits/pixel, fps, cor e representação (RGB, YUV…). Na Lab 4 usa-se uma <b>câmara omnidirecional</b> para medir o ângulo aos 4 beacons em simultâneo.</p>
    <p><b>Visão 3D / profundidade:</b></p>
    <ul><li><b>Kinect:</b> projeção de um padrão de luz estruturada</li>
    <li><b>MESA SR4000:</b> TOF — Time of Flight por pixel</li>
    <li><b>Radar:</b> robusto a poeira/chuva, usado em exteriores e automóvel</li></ul>`,
    figures:[{src:"assets/slides/sensors/page-25.png", caption:"Slide 25 — Visão 3D", focus:"Kinect = padrão projetado; SR4000 = tempo de voo; distingue os dois princípios"}],
    slideRef:"SAUT_Percep_and_sensors, págs. 24–26" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"flash", front:"Que duas grandezas pode um robô medir em relação a um beacon, e que sensores as dão?", back:"<b>Distância</b> (acústico, rádio, laser-refletor, GPS) e <b>ângulo</b> (ótico, câmara omni, laser). O EKF da Lab 4 usa ambas: h = [d; φ]." },
    { kind:"mcq", q:"O Kinect obtém profundidade por:",
      options:["Diferença de fase","Projeção de um padrão de luz estruturada","Estereovisão passiva","Ultrassons"], answer:1,
      explain:"Projeta um padrão IR e mede a sua deformação; o SR4000 é que usa tempo de voo." },
    { kind:"mcq", q:"Para medir o ÂNGULO a vários beacons em simultâneo (Lab 4, parte 3) usa-se:",
      options:["Um sonar rotativo","Uma câmara omnidirecional","Um GPS diferencial","Um inclinómetro"], answer:1,
      explain:"A câmara omnidirecional vê os 4 beacons ao mesmo tempo e dá o ângulo a cada um." }
  ]}
]},

/* ============ MÓDULO 5 — Mini-teste final M0 ============ */
{ id:"m0-mod5", title:"Mini-teste final — Fundamentos", minutes:20, kind:"labwork",
  blurb:"Consolidação do M0 no formato das perguntas de exame. Completa-o para desbloquear o M1 (Odometria).",
  pages:[
  { type:"theory", title:"Como funciona este mini-teste",
    html:`<p>O M0 não tem Lab Work associada — em vez disso, fecha com um <b>mini-teste</b> ao estilo das sub-tarefas que vais encontrar nas labworks seguintes.</p>
    <ul><li><b>Plataforma:</b> nenhuma — papel e calculadora chegam.</li>
    <li><b>Módulos necessários:</b> os 4 módulos anteriores deste milestone.</li>
    <li>Em cada sub-tarefa escreve/escolhe a resposta; tens <b>💡 dicas</b> e, em último recurso, <b>SOLUÇÃO DIRETA</b>.</li></ul>
    <p>Quando terminares, o milestone M0 fica completo e o <b>M1 — Odometria</b> desbloqueia. Clica em <b>Seguinte</b> para COMEÇAR.</p>`,
    slideRef:"—" },
  { type:"labtask", title:"Sub-tarefa 1 — Constante do encoder",
    context:"<p>Antecipação direta da Pergunta 12 do exame: converter voltas de roda em K.</p>",
    q:"Um robô tem rodas de diâmetro 0,065 m. Fazes a roda dar exatamente 1,5 voltas e o contador acumula 1500 impulsos. Qual é a constante K em m/impulso? (ex.: 0.000204)",
    kind:"input", answer: 0.000204, tolerance: 0.000003, unit:"m/imp",
    hints:["Distância percorrida pela roda = 1,5 × π × D.","1,5×π×0,065 = 0,3063 m; divide pelos 1500 impulsos acumulados."],
    solution:"<b>K = (1,5·π·D)/N = (1,5·π·0,065)/1500 = 0,3063/1500 ≈ 2,04×10⁻⁴ m/imp.</b> No exame, a armadilha típica é esquecer o fator 1,5 ou usar o raio em vez do diâmetro." },
  { type:"labtask", title:"Sub-tarefa 2 — Classificar sensores",
    q:"Qual é a classificação correta do conjunto {encoder incremental, laser scanner, bússola}?",
    kind:"mcq",
    options:["Todos propriocetivos","Propriocetivo / exterocetivo-ativo / exterocetivo-passivo","Exterocetivo / propriocetivo / propriocetivo","Todos exterocetivos-ativos"],
    answer:1,
    hints:["O encoder mede o estado interno; o laser emite energia; a bússola só 'lê' o campo magnético do ambiente."],
    solution:"Encoder = <b>propriocetivo</b> (rotação do próprio eixo). Laser = <b>exterocetivo ativo</b> (emite luz, mede o ambiente). Bússola = <b>exterocetivo passivo</b> (observa o campo magnético sem emitir)." },
  { type:"labtask", title:"Sub-tarefa 3 — Ultrassom",
    q:"Com c=340 m/s, quanto tempo (em ms) demora um sonar a receber o eco de um objeto a 1,7 m? (só o número)",
    kind:"input", answer: 10, tolerance: 0.3, unit:"ms",
    hints:["O som percorre 2×1,7 = 3,4 m.","t = 2d/c = 3,4/340 s → converte para ms."],
    solution:"t = 2d/c = 3,4/340 = 0,01 s = <b>10 ms</b>. É a conta inversa do slide 18 (20 ms @ 3,5 m)." },
  { type:"labtask", title:"Sub-tarefa 4 — Deriva vs correção",
    q:"No 'padrão' central da UC, que par de sensores corresponde a (deriva contínua → predição) + (correção absoluta → atualização)?",
    kind:"mcq",
    options:["Laser + GPS","Encoders (odometria) + laser/beacons","Bússola + inclinómetro","Câmara + IMU"],
    answer:1,
    hints:["Qual sensor dá uma estimativa contínua mas acumula erro? Qual corrige com referência ao mundo?"],
    solution:"<b>Encoders/odometria</b> dão a predição (contínua, mas com erro acumulado por derrapagem) e <b>laser/beacons</b> dão a atualização (correção absoluta). É literalmente a estrutura do EKF das Labs 4/5." }
]}
]};
