/* ===== SAUT StudyHub — M7: Labs 6 e 7 (robôs reais) =====
   Quatro módulos:
     m7-mod1  deployment do robô diferencial (Lab 6) — orientado a exame
     m7-mod2  deployment do robô omni em ROS (Lab 7) — orientado a exame
     m7-mod3  Labwork 6 — código avaliado (C++, interpretado por js/clike.js)
     m7-mod4  Labwork 7 — controlo do omni real e ligação à Lab 3

   Nota de proveniência: ao contrário das Labs 3, 4 e 5, aqui NÃO há solução do
   professor. As referências do m7-mod3 foram escritas a partir do enunciado, que
   especifica as fórmulas; as duas tarefas do follow_track são avaliadas por
   critério (dá a volta? em quanto tempo?), que é o que o enunciado pede.
*/
(function () {
  "use strict";
  var C = window.SAUT_CONTENT = window.SAUT_CONTENT || {};

  function code(task, title, q, context) {
    return { type: "labtask", kind: "codeeval", task: task, title: title, q: q, context: context };
  }

  /* =================================================================== */
  var mod1 = {
    id: "m7-mod1", title: "7.1 · Deployment do robô diferencial (Lab 6)", minutes: 35, kind: "study",
    blurb: "Do código ao robô a andar: PlatformIO, firmware no Pico, ComRobot. O que o professor avisou que pode sair no exame.",
    pages: [
      {
        type: "theory",
        title: "A cadeia completa: do VSCode ao robô a andar",
        html: `
<div class="labctx"><b>Porque é que isto está aqui.</b> Quando perguntaste ao professor se podias
fazer as Labs 6 e 7 só em simulação, a resposta foi sim — «<i>embora devas entender o processo
quer dos omnis quer dos diferenciais, pois podem sair perguntas sobre isso no exame</i>». Este
módulo e o seguinte são exatamente esse processo. Não é matéria de cálculo: é saber onde corre
o código, como lá chega e como se afina.</div>

<p>O robô da Lab 6 é um <b>diferencial</b>: duas rodas motrizes com encoder e uma esfera de apoio.
A unidade de processamento é um <b>Raspberry Pi Pico W</b> montado numa placa <b>Pico4drive</b>,
que faz a ponte para os motores. O sensor de linha é uma barra de refletância de infravermelhos.</p>

<h4>1. Ambiente</h4>
<ul>
  <li><b>VSCode + extensão PlatformIO</b> — é o PlatformIO que trata do compilador, das bibliotecas
  e do upload. Na primeira compilação demora muito, porque descarrega tudo.</li>
  <li><b>Git</b>, com <code>git config --global core.longpaths true</code>, e no Windows
  <code>LongPathsEnabled = 1</code> no registo (<code>HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\FileSystem</code>).
  Sem isto os caminhos longos do PlatformIO rebentam.</li>
  <li><b>Zadig</b> — só é preciso se o upload falhar: seleciona <i>RP2 Boot (Interface 1)</i> e
  instala o driver <b>WinUSB</b>.</li>
  <li>Em Linux, instalar <code>python3-venv</code> <b>antes</b> do PlatformIO.</li>
</ul>

<h4>2. Compilar e gravar</h4>
<p>Compila-se com o botão de <i>build</i>; envia-se com o de <i>upload</i>, com o robô ligado por USB.
Se for a <b>primeira vez</b> que se grava a placa, o caminho é outro: arrasta-se o ficheiro
<code>firmware.uf2</code>, que fica em <code>&lt;projeto&gt;/.pio/build/pico</code>, para o
dispositivo de armazenamento em massa que o Pico apresenta quando arranca em modo BOOTSEL.</p>

<h4>3. Ligação e monitorização</h4>
<p>A aplicação de PC chama-se <b>ComRobot.exe</b> e liga por <b>duas vias alternativas</b>:</p>
<ul>
  <li><b>Série sobre USB</b>: <i>Refresh</i> para procurar portas, escolher a COM, <i>Open</i>. A
  caixa fica verde e começa a aparecer o fluxo de dados.</li>
  <li><b>WiFi</b>: o PC e o robô na mesma rede (<code>TP-Link_28CD</code>), e o IP do robô no
  formato <code>xx.xx.xx.xx:4224</code>. O IP aparece na <b>célula (1,2)</b> depois de o robô se
  ligar, e é diferente em cada robô. Com a ligação estabelecida pode desligar-se o USB.</li>
</ul>

<h4>4. O que já está feito a bordo</h4>
<p>Isto é importante para perceber onde entra o teu código:</p>
<ul>
  <li>os <b>encoders em quadratura</b> medem a velocidade de cada roda;</li>
  <li>um <b>PID por roda</b> controla a tensão aplicada ao motor para manter a velocidade pedida;</li>
  <li>dessas medidas calculam-se a velocidade <b>linear e angular</b> do robô e estima-se a pose
  por <b>odometria</b> (<code>robot_t::odometry()</code> em <code>robot.cpp</code>).</li>
</ul>
<p>Ou seja: tu não escreves o controlo de baixo nível. Escreves a camada de cima, que decide
<code>v_req</code> e <code>w_req</code>.</p>

<h4>5. Afinar sem recompilar</h4>
<p>É a parte mais elegante da arquitetura. O ComRobot mostra uma folha de células e permite
escrever nelas — o <code>ktrack</code>, o <code>v_nom</code> e o <code>w0</code> são lidos daí.
Podes afinar o controlador com o robô a andar, sem passar pelo ciclo compilar-gravar-testar.</p>
<p>Células a conhecer: <b>(17,3)</b> velocidade linear pedida, <b>(18,3)</b> angular,
<b>(25,7)</b> posição da linha em mm, <b>(1,2)</b> o IP. Os botões <i>state VW</i>,
<i>Set V,W</i> e <i>Zero V,W</i> põem o robô em modo de velocidade imposta.</p>
<p>Limites do robô: <b>v ∈ [−0.4, 0.4] m/s</b> e <b>ω ∈ [−8, 8] rad/s</b>.</p>`,
        slideRef: "LabWork_6_DiffTractionRobot_2026, pontos 1 e 2"
      },
      {
        type: "quiz",
        title: "Perguntas de exame sobre o processo do diferencial",
        questions: [
          {
            kind: "mcq",
            q: "Onde é que corre o controlador que escreves no <code>follow_track</code>?",
            options: [
              "No PC, que envia comandos de velocidade ao robô por WiFi a cada ciclo.",
              "<b>A bordo do Pico</b>, dentro do firmware compilado e gravado — o PC só monitoriza e afina parâmetros.",
              "No ComRobot, que interpreta o código em tempo real.",
              "Numa máquina virtual ligada ao robô."
            ],
            answer: 1,
            hint: "Se desligares o cabo USB e fechares o ComRobot, o robô continua a seguir a linha?",
            explain: "É firmware embebido: compilas em C++, gravas no Pico e o robô fica autónomo. O ComRobot é uma janela para dentro do robô — mostra variáveis e deixa escrever nas células dos parâmetros —, mas o ciclo de controlo corre no microcontrolador. É o contraste central com a arquitetura ROS da Lab 7."
          },
          {
            kind: "mcq",
            q: "Qual é a vantagem prática de o <code>ktrack</code> ser lido de uma célula do ComRobot em vez de ser uma constante no código?",
            options: [
              "Ocupa menos memória no Pico.",
              "Permite afinar o ganho com o robô a andar, sem recompilar e regravar o firmware.",
              "É a única forma de o PID aceder ao valor.",
              "Torna o código mais portátil entre robôs."
            ],
            answer: 1,
            hint: "Quanto tempo demora o ciclo compilar → gravar → colocar o robô na pista → testar?",
            explain: "Afinar um ganho proporcional exige dezenas de tentativas. Fazê-lo por recompilação seria proibitivo. É um padrão comum em robótica: separar o que é lógica (compilada) do que é parâmetro (ajustável em tempo real)."
          },
          {
            kind: "mcq",
            q: "O robô descreve uma circunferência de raio R com velocidades v e ω. Que ω é preciso para R = 0.2 m com v = 0.2 m/s?",
            options: ["ω = 0.04 rad/s", "ω = 1 rad/s", "ω = 4 rad/s", "ω = 0.1 rad/s"],
            answer: 1,
            hint: "R = v/ω.",
            explain: "R = v/ω, logo ω = v/R = 0.2/0.2 = 1 rad/s. Para R = 0.1 m seriam 2 rad/s e para R = 0.4 m seriam 0.5 rad/s — o exercício do ponto 2 do enunciado. Repara que com v = 0.4 m/s e R = 0.05 m seria ω = 8 rad/s, exatamente o limite do robô."
          },
          {
            kind: "flash",
            front: "Para que serve o <code>firmware.uf2</code> e quando é que se usa?",
            back: "É o binário compilado, em <code>.pio/build/pico</code>. Usa-se na <b>primeira</b> gravação da placa: com o Pico em modo BOOTSEL ele aparece como uma pen USB, e arrasta-se o ficheiro para lá. A partir daí o upload normal do PlatformIO já funciona. Se falhar no Windows, instala-se o driver WinUSB com o Zadig."
          }
        ]
      }
    ]
  };

  /* =================================================================== */
  var mod2 = {
    id: "m7-mod2", title: "7.2 · Deployment do robô omni em ROS (Lab 7)", minutes: 35, kind: "study",
    blurb: "Máquina virtual, catkin, nós e serviços ROS, NoMachine. O contraste com a arquitetura embebida da Lab 6.",
    pages: [
      {
        type: "theory",
        title: "Arquitetura ROS: simulação e robô real",
        html: `
<p>O robô da Lab 7 é o <b>omnidirecional</b> — o mesmo tipo da Lab 3, controlado por
<code>V</code>, <code>Vn</code> e <code>W</code>. Mas a forma de lá chegar não tem nada a ver com
a do diferencial.</p>

<h4>Parte 1 — simulação, na tua máquina</h4>
<ul>
  <li><b>Máquina virtual com Ubuntu 20.04</b> (password <code>12345</code>), ou Ubuntu nativo.
  O enunciado avisa: <b>não fazer upgrades</b> — partiria as versões do ROS.</li>
  <li>O código vive num <b>catkin workspace</b>:
  <code>~/catkin_ws/src/5dpo_saut_ros_packages/5dpo_saut_ros_nav_controller</code>, e as rotinas
  a completar estão no <code>SARosNavController.cpp</code>.</li>
  <li>Compila-se com <code>catkin_make</code> a partir de <code>~/catkin_ws</code>.</li>
  <li>Arrancam-se os nós com
  <code>roslaunch sdpo_saut_ros_nav_conf wake_up_robot_ros1.launch</code>, e param-se com Ctrl+C.</li>
</ul>

<h4>Como se invoca uma rotina</h4>
<p>Aqui está a diferença mais visível para a Lab 6: não há botões nem células. As rotinas são
expostas como <b>serviços ROS</b> e chamam-se de <b>outro terminal</b>, com os nós já a correr:</p>
<pre class="pas">rosservice call /unnamed_robot/gotoxy_srv      -- 0.5 0.5 90
rosservice call /unnamed_robot/followline_srv  -- 0 0 1.5 0 180
rosservice call /unnamed_robot/followcircle_srv -- 1 1 1 -90 40</pre>
<p>Os ângulos vão em <b>graus</b> nestas chamadas, ao contrário do código, que trabalha em radianos.</p>

<h4>Parte 2 — o robô real</h4>
<ul>
  <li>Instalar o <b>NoMachine</b> e ligar-se ao <b>Raspberry Pi</b> do robô, em
  <code>192.168.3.XXX</code> (XXX = número do robô), na rede <code>TP-Link_28CD</code>.
  Credenciais <code>sdpo-ratf</code> / <code>5dpo5dpo</code>.</li>
  <li>No robô o workspace chama-se <code>saut_catkin_ws</code>. Os comandos são os mesmos da VM.</li>
  <li>A configuração — <b>posições dos beacons e pose inicial</b> — não está no código: está num
  <b>ficheiro yaml</b>,
  <code>…/5dpo_saut_ros_nav_conf/launch/localization/…/sdpo_ratf_ros_localization_ros1.yaml</code>.
  Depois de o alterar, <code>catkin_make</code>.</li>
  <li>Aviso prático do enunciado: o <b>VSCode é pesado de mais</b> para o Raspberry Pi — parar os
  nós antes de o abrir, ou usar um editor leve pelo gestor de ficheiros.</li>
  <li><code>rqt_graph</code> mostra o <b>grafo de nós</b> — útil para perceber quem publica o quê.</li>
</ul>

<h4>O contraste, que é o que interessa para o exame</h4>
<table class="testtab"><tbody>
<tr><td></td><td><b>Diferencial (Lab 6)</b></td><td><b>Omni (Lab 7)</b></td></tr>
<tr><td>Onde corre o controlo</td><td>a bordo, no Pico</td><td>nó ROS, no Raspberry Pi</td></tr>
<tr><td>Linguagem / build</td><td>C++ / PlatformIO</td><td>C++ / catkin_make</td></tr>
<tr><td>Como chega ao robô</td><td>firmware gravado por USB (.uf2)</td><td>compilado <i>no</i> robô, por sessão remota</td></tr>
<tr><td>Como se invoca</td><td>botões e células do ComRobot</td><td><code>rosservice call</code></td></tr>
<tr><td>Como se muda um parâmetro</td><td>célula da folha, em tempo real</td><td>ficheiro yaml + recompilar</td></tr>
<tr><td>Arquitetura</td><td>firmware monolítico</td><td>nós distribuídos, tópicos e serviços</td></tr>
<tr><td>Acesso</td><td>USB ou WiFi (porta 4224)</td><td>NoMachine (ambiente gráfico remoto)</td></tr>
</tbody></table>
<p>Se te perguntarem «como é que se altera a posição dos beacons em cada robô», a resposta é
<b>yaml + catkin_make</b> — e não recompilar firmware. Se perguntarem «como se testa uma rotina de
navegação», é <b>roslaunch num terminal e rosservice call noutro</b>.</p>`,
        slideRef: "LabWork_7_Real_Omni_Robot_V3_Nov2025 + guia de instalação da VM"
      },
      {
        type: "quiz",
        title: "Perguntas de exame sobre o processo do omni",
        questions: [
          {
            kind: "mcq",
            q: "Para mudar as posições dos beacons usadas pelo EKF do robô omni real, o que fazes?",
            options: [
              "Recompilas o firmware e gravas por USB.",
              "Escreves numa célula da aplicação de PC.",
              "Editas o ficheiro <b>yaml</b> de configuração da localização e corres <code>catkin_make</code>.",
              "Alteras diretamente o <code>SARosNavController.cpp</code>."
            ],
            answer: 2,
            hint: "Em ROS, o que é configuração e o que é código estão separados.",
            explain: "É um princípio da arquitetura ROS: parâmetros em ficheiros de configuração (yaml, carregados pelos launch files), lógica no código. Cada robô tem o seu yaml, com os beacons e a pose inicial. Compara com a Lab 6, onde os parâmetros afináveis vivem em células lidas em tempo real."
          },
          {
            kind: "mcq",
            q: "Já com os nós ROS a correr, como executas o <code>GoToXY</code> para (0.5, 0.5, 90°)?",
            options: [
              "Carregas num botão da aplicação ComRobot.",
              "<code>rosservice call /unnamed_robot/gotoxy_srv -- 0.5 0.5 90</code> noutro terminal.",
              "Escreves as coordenadas num ficheiro yaml e recompilas.",
              "<code>roslaunch gotoxy 0.5 0.5 90</code>."
            ],
            answer: 1,
            hint: "As rotinas de controlo estão expostas como serviços.",
            explain: "O <code>roslaunch</code> arranca e mantém os nós vivos num terminal; as rotinas invocam-se de outro terminal por <code>rosservice call</code>. Repara que o ângulo vai em graus na chamada, embora o código trabalhe em radianos."
          },
          {
            kind: "mcq",
            q: "Porque é que o enunciado avisa para não abrir o VSCode no Raspberry Pi com os nós a correr?",
            options: [
              "Porque o VSCode não é compatível com ROS.",
              "Porque o editor consome demasiado processamento e prejudica os nós de controlo, que correm em tempo real no mesmo computador.",
              "Porque impede o NoMachine de funcionar.",
              "Porque apaga os ficheiros yaml."
            ],
            answer: 1,
            hint: "Onde é que os nós de controlo estão a correr?",
            explain: "É a consequência prática de o controlo correr <i>no</i> robô: o Pi é modesto e partilha CPU entre o teu editor e o ciclo de controlo. Na Lab 6 o problema não se põe, porque o PC e o robô são máquinas separadas — o ComRobot pode consumir o que quiser."
          },
          {
            kind: "flash",
            front: "Resume em duas frases a diferença de arquitetura entre a Lab 6 e a Lab 7.",
            back: "<b>Lab 6:</b> firmware monolítico compilado no PC e gravado no microcontrolador; o robô fica autónomo e afina-se em tempo real por células de uma folha de cálculo. <b>Lab 7:</b> sistema distribuído de nós ROS que corre no computador de bordo, compilado <i>nele</i> com catkin_make, configurado por ficheiros yaml e invocado por chamadas a serviços."
          }
        ]
      }
    ]
  };

  /* =================================================================== */
  var mod3 = {
    id: "m7-mod3", title: "7.3 · Labwork 6 — seguimento de pista e localização (código avaliado)",
    minutes: 100, kind: "labwork",
    blurb: "follow_track com controlo proporcional e modulação v(ω), e correção de pose pelos troços retos. Avaliado numa simulação da pista real.",
    pages: [
      {
        type: "theory",
        title: "Como funciona esta labwork",
        html: `
<p>Escreves <b>C++</b> — o mesmo que escreverias no <code>actions.cpp</code> do firmware — e o hub
executa-o. Duas diferenças em relação às Labs 3, 4 e 5, e é importante que as saibas:</p>

<div class="labctx"><b>Não há solução do professor para esta labwork.</b> O firmware distribuído
traz o <code>follow_track</code> a andar em linha reta e o <code>track_localization</code> com os
passos comentados. As referências aqui usadas foram escritas <b>a partir do enunciado</b>, que
especifica as fórmulas — em particular a equação (1) da modulação v(ω) e as regras de correção de
pose. Onde nas outras labs eu podia dizer «isto é o código do professor», aqui digo «isto é o que
o enunciado descreve».</div>

<p>Por isso as duas sub-tarefas do <code>follow_track</code> <b>não comparam valores</b>: correm o
robô numa <b>simulação da pista real</b> e avaliam pelo critério do próprio enunciado — «a
velocidade máxima que permite dar uma volta completa» e «o melhor tempo para três voltas».</p>

<h4>A pista</h4>
<p>A geometria vem do <code>fill_track_segment_list()</code> do firmware: cinco troços retos com
cantos arredondados, cerca de 46 × 31 cm, com um <b>entalhe em V</b> no topo que aponta para a
origem. O perímetro é ~1.56 m. É o V e os dois cantos do topo que separam um controlador que
funciona de um que sai da pista.</p>

<h4>O modelo do sensor</h4>
<ul>
  <li><code>robot.IRLine.found_center</code> — <code>true</code> se a barra está a ver a linha;</li>
  <li><code>robot.IRLine.pos_center</code> — desvio em <b>milímetros</b>, com o alcance de ±35 mm;</li>
  <li><b>convenção de sinal:</b> <code>pos_center &gt; 0</code> significa que a linha está à
  <b>direita</b> do centro do sensor, e <code>w &gt; 0</code> roda o robô para a <b>esquerda</b>.
  É coerente com o <code>ktrack</code> vir negativo por omissão no firmware.</li>
</ul>
<div class="labctx"><b>No robô real, confirma esta convenção antes de mais nada.</b> O enunciado
manda-te precisamente isso: pôr o robô sobre a pista, deslocá-lo para um lado e para o outro e ver
a célula (25,7). Se o sinal for o oposto do assumido aqui, é só trocar o sinal do
<code>ktrack</code> — mas descobre-o antes de te convenceres de que o código está errado.</div>

<p>As velocidades são saturadas nos limites do robô, <b>±0.4 m/s</b> e <b>±8 rad/s</b>, tal como
no firmware.</p>`,
        slideRef: "LabWork_6_DiffTractionRobot_2026, pontos 3 e 4"
      },

      code("follow",
        "Sub-tarefa 7.3.2 — seguir a pista com controlo proporcional",
        "Escreve o <code>follow_track</code>: velocidade angular proporcional ao desvio da linha, e uma decisão sobre o que fazer quando o robô a perde.",
        `<p>A primeira metade é o que o enunciado sugere: <code>v = v_nom</code> e <code>ω</code>
proporcional à posição da linha, com o <code>ktrack</code> como ganho.</p>
<p>A segunda metade é a que decide se o robô dá a volta. O enunciado diz-o em duas linhas —
«<i>Beware that you should deal with the case where the robot loses contact with track</i>» — e a
simulação mostra porquê: a versão ingénua, que põe <code>ω = 0</code> quando perde a linha,
<b>sai da pista a 38% da volta</b>, na curva do topo. O sensor está à frente do eixo, e numa curva
apertada a linha sai-lhe de baixo antes de o robô ter acabado de virar.</p>
<p>Pensa no que sabes no instante em que ficas cego: sabias para que lado a linha estava a fugir.</p>`),

      code("followvw",
        "Sub-tarefa 7.3.3 — modulação não linear <code>v(ω)</code>",
        "Acrescenta a modulação da velocidade linear em função da angular, para o robô abrandar sozinho nas curvas.",
        `<p>O ponto 3 do enunciado dá a equação:</p>
<pre class="pas">v(ω) = max( 0 , −v_nom/ω₀² · (ω − ω₀)(ω + ω₀) )</pre>
<p>É uma parábola invertida com zeros em ±ω₀: vale <code>v_nom</code> quando o robô vai a direito
e desce a zero quando a curva aperta. O <code>max(0, …)</code> impede que fique negativa.</p>
<p>Vale a pena veres a diferença que faz. Medi na simulação, com o mesmo controlador proporcional
nos dois casos:</p>
<table class="testtab"><tbody>
<tr><td></td><td><b>v_nom máximo</b></td><td><b>3 voltas</b></td><td><b>desvio máximo</b></td></tr>
<tr><td>proporcional simples</td><td>0.25 m/s</td><td>20.6 s</td><td>51 mm</td></tr>
<tr><td>com v(ω)</td><td><b>0.40 m/s</b> (o limite do robô)</td><td><b>15.2 s</b></td><td>9 mm</td></tr>
</tbody></table>
<p>Sem a modulação, tentar 0.40 m/s nem sequer completa uma volta. É a resposta empírica à
pergunta «<i>test the new maximum speed</i>» do enunciado.</p>`),

      {
        type: "quiz",
        title: "Antes da localização: porque é que a odometria não chega",
        questions: [
          {
            kind: "mcq",
            q: "O enunciado nota que «<i>after a few laps, the robot loses the correct estimate of its location</i>». Porquê?",
            options: [
              "Porque o sensor de linha tem ruído.",
              "Porque a odometria é um integrador: cada pequeno erro de escorregamento ou de quantização dos encoders acumula-se e nunca é corrigido.",
              "Porque o PID das rodas está mal afinado.",
              "Porque o Pico não tem precisão suficiente."
            ],
            answer: 1,
            hint: "Compara com o que viste na Lab 5 sobre a diferença entre erro inicial e deriva.",
            explain: "É o mesmo fenómeno da Lab 5, mas aqui num robô real, onde o escorregamento é significativo. Sem observações externas o erro só cresce. A diferença é que aqui a «observação externa» não são beacons: é a própria pista, cuja geometria é conhecida."
          },
          {
            kind: "mcq",
            q: "Porque é que a correção de pose só se faz quando a média do |ω| está abaixo de um limiar <b>e</b> a descer?",
            options: [
              "Para poupar processamento no Pico.",
              "Porque só com o robô a andar com orientação estável é que se pode concluir que ele está alinhado com um troço reto da pista.",
              "Porque o sensor de linha não funciona em curva.",
              "Porque a odometria só é válida em linha reta."
            ],
            answer: 1,
            hint: "Com o controlador em uso, quando é que ω se mantém pequeno durante vários ciclos seguidos?",
            explain: "É uma inferência esperta: com um controlador que reage ao desvio da linha, ω só fica pequeno e estável se o robô estiver alinhado com a linha — e isso, num percurso feito de retas e curvas, só acontece nas retas. A condição de estar a <i>descer</i> evita disparar a meio de uma transição."
          },
          {
            kind: "flash",
            front: "Estando o robô sobre um troço reto, quanta informação é que isso te dá sobre a pose?",
            back: "Duas das três componentes, e nunca as três. O <b>ângulo</b> fica determinado (é o do troço) e a coordenada <b>perpendicular</b> ao troço também. A coordenada <b>ao longo</b> do troço continua desconhecida — o robô pode estar em qualquer ponto dele. Num troço horizontal ganhas θ e y; num vertical, θ e x."
          }
        ]
      },

      code("locxy",
        "Sub-tarefa 7.3.5 — correção de pose nos troços horizontal e vertical",
        "Escreve o <code>track_localization</code> para os dois casos simples do ponto 4 do enunciado.",
        `<p>O ponto 4 explica o raciocínio: se o robô anda ao longo do segmento S1, que vai de
<code>(−X1, Y1)</code> a <code>(X1, Y1)</code>, então <b>θ = 0</b> e <b>y = Y1</b>. No segmento
vertical S2 é <b>θ = 90°</b> e <b>x = X2</b>.</p>
<p>A deteção — a média do |ω| e a comparação de ângulos com cada troço — já vem escrita no
esqueleto. O que falta é a correção em si, e é curta: uma linha por troço.</p>
<p>Nesta sub-tarefa os troços 2 e 3, as diagonais, ficam por tratar. É precisamente essa limitação
que motiva a sub-tarefa seguinte.</p>`),

      code("locgen",
        "Sub-tarefa 7.3.6 — caso geral com transformação homogénea",
        "Generaliza a correção para qualquer troço, incluindo as diagonais, usando a biblioteca <code>htransf_2d</code>.",
        `<p>O ponto 5 do enunciado dá a ideia inteira: se te colocares num referencial <b>alinhado
com a reta</b>, estar sobre ela significa simplesmente ter <code>y = 0</code>. O problema fica
trivial nesse referencial — a dificuldade toda é ir lá e voltar.</p>
<p>É para isso que serve a <code>htransf_2d_t</code>, que o professor incluiu no projeto:</p>
<pre class="pas">htransf_2d_t H(angulo, tx, ty);   // transformação mundo ← troço
H.apply(P)      ou  H.apply(x, y)       // do troço para o mundo
H.apply_inv(P)  ou  H.apply_inv(x, y)   // do mundo para o troço</pre>
<p>Três passos, e a ordem é a que o enunciado enumera: levar a pose ao referencial do troço, anular
a componente perpendicular, trazer o ponto de volta.</p>
<p>Repara que isto <b>contém</b> o caso anterior: aplicado ao troço horizontal dá exatamente
<code>ye = Pi.y</code>, e ao vertical dá <code>xe = Pi.x</code>. Os dois primeiros casos de teste
verificam essa consistência; os das diagonais são os que a versão específica não sabia fazer.</p>`),

      {
        type: "labtask",
        kind: "assemble",
        title: "O teu <code>actions.cpp</code> — tudo junto",
        context: `<p>Código de todas as sub-tarefas, pela ordem em que as escreveste, pronto a levar
para o <code>actions.cpp</code> do projeto PlatformIO.</p>
<p><b>Checklist para quando tiveres o robô:</b> confirma primeiro a convenção de sinal do
<code>pos_center</code> na célula (25,7); afina o <code>ktrack</code> pelo ComRobot, sem
recompilar; mede o tempo real das três voltas e compara com os 15 s da simulação; e observa a pose
estimada no separador <i>User Chat</i> a derivar ao fim de algumas voltas — e depois a ser corrigida
assim que o <code>track_localization</code> entrar em ação (o LED acende quando há correção).</p>`,
        q: "Copia e leva para o PlatformIO."
      }
    ]
  };

  /* =================================================================== */
  var mod4 = {
    id: "m7-mod4", title: "7.4 · Labwork 7 — omni real: o que muda e o que não muda",
    minutes: 30, kind: "study",
    blurb: "As rotinas de controlo são as da Lab 3; o que é novo é a arquitetura ROS e a passagem ao robô real.",
    pages: [
      {
        type: "theory",
        title: "O que a Lab 7 te pede, e onde já o fizeste",
        html: `
<p>Olha para o título do enunciado da Lab 7: «<i>Implementation of basic movement routines for
controlling a Real Omnidirectional Robot's (GotoXY, FollowLine and FollowCircle)</i>». São
<b>exatamente</b> as três rotinas da Lab 3, para <b>exatamente</b> o mesmo tipo de robô, controlado
pelas mesmas três grandezas <code>V</code>, <code>Vn</code> e <code>W</code>.</p>

<div class="labctx"><b>A matemática já está feita e avaliada no M3.6.</b> O <code>gotoXY</code> com
as duas máquinas de estados, o <code>Dist2Line</code> e o <code>FollowLine</code>, o
<code>Dist2Arc</code> e o <code>FollowCircle</code> — implementaste e testaste tudo isso em Pascal,
contra a solução do professor. O que a Lab 7 acrescenta não é algoritmo: é <b>onde</b> o algoritmo
corre e <b>como</b> se põe a correr.</div>

<p>Por isso este módulo não repete as sub-tarefas de código. O que o professor te disse que pode
sair no exame é o <b>processo</b> — e esse está no módulo 7.2, com o contraste ponto por ponto
contra o do diferencial.</p>

<h4>O que muda ao passar do Pascal do SimTwo para o C++ do ROS</h4>
<ul>
  <li><b>Nada de conceptual.</b> As equações são as mesmas, os erros são os mesmos, as máquinas de
  estados são as mesmas.</li>
  <li>A pose vem por <b>tópicos ROS</b> em vez de <code>GetRobotX/Y/Theta</code>, e os comandos
  saem por um tópico de velocidade em vez de <code>SetAxisSpeedRef</code>.</li>
  <li>Os parâmetros afináveis vão para o <b>yaml</b>, não para células.</li>
  <li>Cada rotina é exposta como um <b>serviço</b>, e é chamada com os ângulos em <b>graus</b>.</li>
</ul>

<h4>Porque é que não há aqui código avaliado</h4>
<p>Por honestidade: o pacote ROS não vem nos materiais que tens — só os PDFs. Não conheço a
assinatura real do <code>SARosNavController.cpp</code>, e inventá-la daria uma sensação falsa de
fidelidade. Se a obtiveres, diz — o interpretador de C++ já cá está, é só escrever a spec.</p>

<h4>Como estudar isto para o exame</h4>
<ol>
  <li>Revê o <b>M3.6</b> — é aí que está a substância algorítmica que a Lab 7 reutiliza.</li>
  <li>Revê o <b>7.2</b> para a cadeia ROS, e o <b>7.1</b> para a do diferencial. A pergunta mais
  provável é comparativa.</li>
  <li>Se conseguires uma sessão com a VM, faz a Parte 1: é autónoma e não precisa de robô.</li>
</ol>`,
        slideRef: "LabWork_7_Real_Omni_Robot_V3_Nov2025"
      },
      {
        type: "quiz",
        title: "Ligação entre as labs do omni",
        questions: [
          {
            kind: "mcq",
            q: "Que relação há entre o <code>GoToXY</code> da Lab 7 e o <code>gotoXY</code> da Lab 3?",
            options: [
              "Nenhuma: a Lab 7 usa um algoritmo de planeamento diferente.",
              "É o mesmo algoritmo — mesmo robô omni, mesmas grandezas V, Vn e W — implementado noutra linguagem e noutra arquitetura.",
              "A Lab 7 substitui as máquinas de estados por um controlador PID.",
              "A Lab 3 é para simulação e a Lab 7 usa cinemática diferencial."
            ],
            answer: 1,
            hint: "Compara os títulos dos dois enunciados.",
            explain: "Os dois enunciados pedem literalmente as mesmas três rotinas para o mesmo tipo de robô. A Lab 3 fá-las no SimTwo em Pascal; a Lab 7 leva-as para um nó ROS, primeiro em simulação e depois no robô real. O valor acrescentado da Lab 7 é a passagem à realidade, não a matemática."
          },
          {
            kind: "flash",
            front: "Se te perguntarem no exame «como levarias o teu <code>gotoXY</code> do simulador para o robô real?», que estrutura de resposta usas?",
            back: "Três camadas. <b>Algoritmo:</b> não muda — mesmos erros de posição e orientação, mesmas máquinas de estados, mesma projeção de V e Vn no referencial do robô. <b>Interfaces:</b> a pose passa a vir de um tópico ROS e os comandos saem por outro, em vez das funções do SimTwo. <b>Deployment:</b> compilar com catkin_make no computador de bordo, configurar por yaml, arrancar com roslaunch e invocar por rosservice call. E acrescentar que no robô real aparecem efeitos que o simulador não tem — escorregamento, saturação dos motores, atrasos de comunicação."
          }
        ]
      }
    ]
  };

  C["m7"] = { modules: [mod1, mod2, mod3, mod4] };
})();
