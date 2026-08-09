/* ===== SAUT StudyHub — Labwork 5 reformulada (código Pascal/SimTwo avaliado) =====
   Substitui o módulo m5-mod6 depois de m5.js ter sido carregado.
   Avaliação: js/pascal.js (agora com a álgebra matricial do SimTwo) + js/grader.js,
   contra as rotinas da solução do professor guardadas em js/data/lab5spec.js.
*/
(function () {
  "use strict";
  var C = window.SAUT_CONTENT = window.SAUT_CONTENT || {};
  C["m5"] = C["m5"] || { modules: [] };

  function code(task, title, q, context) {
    return { type: "labtask", kind: "codeeval", task: task, title: title, q: q, context: context };
  }

  var mod = {
    id: "m5-mod6",
    title: "Labwork 5 — EKF com beacons detetados por laser (código avaliado)",
    minutes: 110,
    kind: "labwork",
    blurb: "O EKF completo no SimTwo: odometria diferencial, predição e atualização com matrizes, e a cadeia laser → pontos → clusters → medidas.",
    pages: [

      /* --------------------------------------------------- 0. enquadramento */
      {
        type: "theory",
        title: "Como funciona esta labwork",
        html: `
<p>Esta é a labwork onde tudo se junta. Na Lab 4 o EKF recebia medidas <i>já prontas</i>: alguém
te dava a distância e o ângulo ao poste. Aqui tens de as <b>produzir a partir do laser</b> — 360
raios em bruto, dos quais alguns calham em cima dos postes — e só depois alimentar o filtro.</p>

<p>A cadeia completa, que é a espinha dorsal do módulo:</p>
<pre class="pas">360 distâncias do laser
      ↓  (geometria: raio i → ponto no mundo)
nuvem de pontos
      ↓  (associação: cada ponto pertence a que poste?)
3 clusters, com centróide
      ↓  (cartesianas → polares no referencial do robô)
(distância, ângulo) por poste
      ↓  EKF
pose estimada</pre>

<h4>O que muda em relação à Lab 4</h4>
<ul>
  <li><b>Linguagem</b>: Pascal do SimTwo, não MATLAB.</li>
  <li><b>Robô</b>: tração diferencial (dois encoders), não o modelo unicíclo idealizado.</li>
  <li><b>Matrizes</b>: não há operadores <code>*</code> e <code>'</code>. Escreves
  <code>MMult</code>, <code>Mtran</code>, <code>Madd</code>, <code>Msub</code>, <code>Minv</code>,
  <code>Meye</code> e <code>Mzeros</code>. E as matrizes vivem na <b>folha de cálculo</b>: escreves
  entradas com <code>SetRCValue</code> e lês blocos com
  <code>RangeToMatrix(linha, coluna, nLinhas, nColunas)</code>.</li>
  <li><b>Dados reais</b>: os testes de associação usam varrimentos de laser simulados com a
  geometria verdadeira dos três postes do enunciado — (−0.3, 1.3), (1.3, 1.3) e (0.5, −0.3).</li>
</ul>

<h4>Notas sobre a avaliação</h4>
<ul>
  <li>Como o professor faz as matrizes passarem pela folha de cálculo com
  <code>format('%.4g', …)</code>, há perda para 4 algarismos significativos. A tolerância das
  sub-tarefas matriciais está folgada de propósito, para não penalizar quem construa as matrizes
  diretamente com <code>Msetv</code>.</li>
  <li>Duas sub-tarefas (<i>laser → mundo</i> e <i>cluster → medida</i>) pedem-te uma rotina
  auxiliar em vez das linhas soltas que estão dentro do <code>procedure Control</code>. É só para
  serem testáveis — o corpo é literalmente o mesmo, e depois copias para o sítio certo.</li>
  <li>A solução do professor desbloqueia ao fim de <b>3 tentativas</b>.</li>
</ul>

<div class="labctx"><b>No SimTwo:</b> abre a cena <code>EKF_Beacon_Laser_Students</code>. O
<code>procedure Control</code> corre a cada 40 ms e já tem a estrutura toda montada — as linhas
que te faltam estão comentadas com <code>//…</code>. O laser é um <code>ranger2d</code> com 360
raios, montado <b>0.14 m atrás</b> da origem do robô.</div>`,
        slideRef: "SAUT_LabWork_5_EKF_Beacons_SimTwo (V4, 11Nov2024) + Loc_Validation"
      },

      /* --------------------------------------------------- 1. odometria */
      code("predict",
        "Sub-tarefa 5.6.2 — odometria do robô diferencial",
        "Escreve o <code>predictPosition</code>: a partir dos impulsos dos dois encoders, atualiza a pose estimada <code>(x, y, theta)</code>.",
        `<p>Robô de tração diferencial, dois encoders. <code>ToMetres</code> converte impulsos em
metros; <code>WheelDist</code> é a distância entre as rodas.</p>
<p>Duas grandezas saem dos encoders:</p>
<ul>
  <li>o <b>avanço do centro</b> do robô — a média das duas rodas;</li>
  <li>a <b>rotação</b> — a diferença entre as rodas, a dividir pela distância entre elas.</li>
</ul>

<div class="labctx"><b>Nota de notação.</b> Repara que o que sai dos encoders são
<b>deslocamentos</b> — o professor chama-lhes <code>d</code> e <code>delta_theta</code> — e não
velocidades. É a mesma convenção da Lab 4: lá viste <code>Δd = v·dt</code> e <code>Δθ = ω·dt</code>
porque o modelo era escrito em velocidades, mas o objeto com significado era sempre o
deslocamento por ciclo. Aqui isso é literal: os encoders contam impulsos, e impulsos são
deslocamento. Guarda esta ideia para a sub-tarefa 5.6.7 — o Jacobiano <code>grad_f_q</code>
deriva em ordem a estes <code>[Δd ; Δθ]</code>, e é por isso que não tem nenhum <code>dt</code>
solto.</div>

<p>Depois é a mesma integração da Lab 4: o deslocamento aplica-se no <b>ângulo médio</b> do
intervalo (<code>theta + delta_theta/2</code>), não no inicial. Há um teste que faz o robô rodar
para lá de ±π, de propósito.</p>
<p>Repara que isto é a predição «crua», sem covariância — é o que o EKF vai depois envolver.</p>`),

      /* --------------------------------------------------- 2. quiz */
      {
        type: "quiz",
        title: "As matrizes no SimTwo: folha de cálculo como memória",
        questions: [
          {
            kind: "mcq",
            q: "Porque é que o professor escreve as entradas das matrizes em células (<code>SetRCValue</code>) e depois lê blocos com <code>RangeToMatrix</code>, em vez de as construir diretamente com <code>Msetv</code>?",
            options: [
              "Porque o SimTwo não permite criar matrizes em memória.",
              "Porque assim as matrizes ficam <b>visíveis na folha de cálculo</b> durante a simulação, o que permite inspecionar o filtro a correr — é uma ferramenta de depuração.",
              "Porque é mais rápido do que usar Msetv.",
              "Porque o RangeToMatrix é a única forma de criar matrizes não quadradas."
            ],
            answer: 1,
            hint: "Pensa no que vês no ecrã do SimTwo enquanto o robô anda.",
            explain: "É depuração: com P, K e os Jacobianos na folha, vês a incerteza a crescer na predição e a encolher a cada observação, em tempo real. O custo é a perda de precisão do <code>format('%.4g')</code> — cerca de 4 algarismos significativos."
          },
          {
            kind: "mcq",
            q: "Na associação, o critério é o ponto do laser estar a menos de <b>0.1 m</b> de um poste conhecido. O que acontece se aumentares esse limiar para 0.25 m?",
            options: [
              "Nada de relevante — só se apanham mais pontos do mesmo poste.",
              "Passam a entrar no cluster pontos que <b>não pertencem ao poste</b> (parede, outro objeto), o centróide desvia-se e o EKF recebe uma medida errada.",
              "O filtro fica mais robusto porque tem mais pontos.",
              "O robô deixa de detetar os postes."
            ],
            answer: 1,
            hint: "O comentário do professor no código diz «0.05 to 0.2 (0.25 already fails)».",
            explain: "É o problema clássico da associação de dados: um limiar generoso mete <i>outliers</i> dentro do cluster. Como o EKF confia no que lhe dás (R é pequeno), uma medida contaminada puxa a estimativa. É exatamente por isto que a validação de observações — o tema do M5 — existe."
          },
          {
            kind: "flash",
            front: "Porque é que a posição do ponto medido usa a pose <b>estimada</b> (x, y, theta) e não a verdadeira?",
            back: "Porque o robô não conhece a verdadeira. Toda a cadeia laser→mundo→cluster→medida é feita no referencial que o filtro <i>acredita</i> ser o seu. É por isso que a associação pode falhar quando a estimativa está muito errada — e é a razão de ser do problema do <i>kidnapped robot</i>: se a pose estimada estiver longe da real, nenhum ponto cai perto de nenhum poste conhecido e o filtro nunca recupera."
          }
        ]
      },

      /* --------------------------------------------------- 3. laser -> mundo */
      code("laser2world",
        "Sub-tarefa 5.6.4 — do laser para o mundo",
        "Escreve o <code>LaserPointToWorld</code>: dado o índice do raio <code>i</code> e a distância medida, calcula as coordenadas do ponto no referencial do <b>mundo</b>.",
        `<p>É pura geometria, e é onde mais gente se engana — porque há <b>três</b> transformações
encadeadas e é fácil esquecer uma.</p>
<ol>
  <li><b>Ângulo do raio no laser</b>: o raio <code>i</code> (de 0 a 359) aponta para
  <code>(i − NBEAMS2)·π/NBEAMS2</code>, com <code>NBEAMS2 = 180</code>. O raio 180 é o da frente.</li>
  <li><b>Rotação para o mundo</b>: o laser está alinhado com o robô, portanto soma-se
  <code>theta</code>.</li>
  <li><b>Translação</b>: a origem do laser <b>não</b> é a origem do robô — está
  <b>0.14 m atrás</b>, em <code>(x − 0.14·cos θ, y − 0.14·sin θ)</code>.</li>
</ol>
<p>Esquecer o deslocamento de 0.14 m é o erro mais comum, e é traiçoeiro: com o robô parado o
resultado parece razoável, mas assim que ele roda o cluster desloca-se e a associação começa a
falhar de forma intermitente.</p>`),

      /* --------------------------------------------------- 4. cluster -> medida */
      code("clustermeasure",
        "Sub-tarefa 5.6.5 — do cluster para a medida",
        "Escreve o <code>ClusterMeasure</code>: converte o centróide do cluster do poste <code>j</code> no par <code>(distância, ângulo)</code> que o EKF consome.",
        `<p>Curta mas essencial: é a ponte entre a perceção e o filtro.</p>
<p>O <code>BeaconCluster[j].x/.y</code> já é o centróide dos pontos do laser, em coordenadas do
<b>mundo</b>. O EKF quer o mesmo em <b>polares e no referencial do robô</b> — porque é isso que
o modelo de observação <code>h(X)</code> prevê.</p>
<p>Duas armadilhas: subtrair <code>theta</code> (é um ângulo relativo ao robô, não absoluto) e
normalizar o resultado. Há um teste com o poste atrás do robô que apanha as duas.</p>`),

      /* --------------------------------------------------- 5. associação */
      code("associate",
        "Sub-tarefa 5.6.6 — associação: dos pontos do laser aos postes",
        "Escreve o <code>AssociateBeacons</code>: percorre os raios do laser e agrupa os pontos que caem junto a cada poste conhecido, calculando o centróide de cada cluster.",
        `<p>Esta é a <b>fase de associação e validação</b> do enunciado, e conceptualmente a parte
mais interessante da labwork: o laser não te diz «este ponto é o poste 2» — só te dá 360
distâncias. És tu que decides a que é que cada ponto pertence.</p>
<p>A estratégia do professor é a mais simples possível — <i>nearest neighbour</i> com limiar fixo:
converte-se cada ponto para o mundo e, se cair a menos de 0.1 m de um poste <b>conhecido</b>,
junta-se ao cluster desse poste. Funciona porque o mapa é conhecido à partida.</p>
<p>Dois detalhes de implementação:</p>
<ul>
  <li>Soma-se <b>0.02 m</b> à distância medida — o laser vê a <i>superfície</i> do poste, e o que
  interessa é o centro.</li>
  <li>O centróide é calculado com uma <b>média incremental</b>:
  <code>x := (x·(n−1) + novo)/n</code>, com o <code>n</code> <b>já incrementado</b>. Se
  incrementares o contador depois, a média fica errada.</li>
</ul>
<p>Os testes usam varrimentos de laser simulados a partir da geometria real (três postes de 2 cm
de raio numa sala), em quatro poses diferentes. Compara-se o número de pontos <i>e</i> o centróide
de cada cluster.</p>`),

      /* --------------------------------------------------- 6. predição EKF */
      code("motionmodel",
        "Sub-tarefa 5.6.7 — predição do EKF",
        "Escreve o <code>EKF_MotionModel</code>: atualiza <code>XR</code>, os Jacobianos <code>df/dX</code> e <code>df/dq</code>, e propaga a covariância <code>P</code>.",
        `<p>É o <code>P = F·P·F' + G·Q·G'</code> da Lab 4, agora escrito com as funções matriciais do
SimTwo e com as matrizes a passarem pela folha de cálculo.</p>
<p>Trabalho já feito por ti: a <code>Initialize</code> deixou a <b>identidade</b> em
<code>df/dX</code> (células 42–44, colunas 1–3) e o <b>1</b> na posição (3,2) de <code>df/dq</code>.
Só tens de reescrever as entradas que dependem do estado, e depois ler o bloco inteiro com
<code>RangeToMatrix</code>.</p>
<p>Em <code>df/dX</code> só mudam duas entradas — as da terceira coluna, primeiras duas linhas.
Em <code>df/dq</code> mudam quatro. Todas avaliadas no ângulo médio,
<code>theta + Δθ/2</code>, que no código do professor se escreve <code>theta + 0.5·omega·dt</code>.</p>

<div class="labctx"><b>Repara no nome da matriz: <code>grad_f_q</code>, não <code>grad_f_U</code>.</b>
Aqui o professor é explícito — <i>q</i> é o vetor de ruído de processo, os <b>deslocamentos</b>
<code>[Δd ; Δθ]</code>, e não os controlos. É a mesma matriz que na Lab 4 se chamava
<code>grad_f_U</code> (nome enganador, como viste no M4.7.4). Nas expressões, onde lês
<code>vlin*dt</code> lê <b>Δd</b> e onde lês <code>omega*dt</code> lê <b>Δθ</b>: a coluna do Δd
não tem <code>dt</code> nenhum e a entrada (3,2) é <b>1</b>, precisamente porque se deriva em
ordem ao deslocamento.</div>
<p>A propagação faz-se por passos, porque não há operadores:</p>
<pre class="pas">P := MMult(grad_f_X, P);
P := MMult(P, Mtran(grad_f_X));
P := Madd(P, MMult(grad_f_q, MMult(Q, Mtran(grad_f_q))));</pre>
<p>Há um teste com <code>P</code> cheia de correlações cruzadas, feito de propósito para apanhar
uma transposição em falta — com <code>P</code> diagonal, esse erro passa despercebido.</p>`),

      /* --------------------------------------------------- 7. atualização EKF */
      code("update",
        "Sub-tarefa 5.6.8 — atualização do EKF",
        "Escreve o <code>EKF_Update</code>: <code>dh/dX</code>, ganho de Kalman, atualização de <code>P</code> e correção do estado com a inovação do poste <code>nBeacon</code>.",
        `<p>O coração do filtro. A matemática é a da Lab 4 — mesma <code>dh/dX</code> 2×3, mesmo
ganho, mesma atualização — mas agora escrita entrada a entrada na folha e com as funções
<code>M*</code>.</p>
<p>Uma diferença de convenção que vale a pena notar: o professor guarda em <code>Z_E</code>
não a medida esperada mas a <b>inovação</b> (medida − esperada). Por isso a atualização do
estado é diretamente <code>XR := Madd(XR, MMult(Kf, Z_E))</code>. Se leres o código à pressa,
o nome da variável engana.</p>
<p>E a componente angular da inovação passa por <code>NormalizeAngle</code> — sem isso, o filtro
dá um salto de ~2π sempre que o poste está por trás do robô. Há um teste com
<code>theta = 3.05</code> só para isso.</p>
<p>No fim, escreves <code>XR</code> de volta na folha e relês <code>x</code>, <code>y</code> e
<code>theta</code> das células. Parece redundante, mas é assim que o professor mantém a folha
e as variáveis sincronizadas.</p>`),

      /* --------------------------------------------------- 8. sintonia */
      code("tuning",
        "Sub-tarefa 5.6.9 — sintonia de <code>Q</code> e <code>R</code>",
        "Escreve o <code>SetupNoise</code>: preenche <code>Q</code> (2×2, no espaço dos deslocamentos <code>[Δd ; Δθ]</code>) e <code>R</code> (2×2, no espaço das medidas) a partir dos desvios padrão declarados no topo do ficheiro.",
        `<p>Como na Lab 4, <b>não se compara com o professor</b>: o hub corre o filtro completo
durante 300 ciclos — robô a andar em círculo, três postes visíveis, ruído injetado nos
<b>deslocamentos</b> de cada ciclo — e mede se a estimativa acompanha o robô.</p>
<p>Repara na coerência que se exige aqui: o <code>grad_f_q</code> que escreveste na sub-tarefa
anterior deriva em ordem a <code>[Δd ; Δθ]</code>, portanto o <code>Q</code> que o acompanha na
sanduíche <code>G·Q·G'</code> tem de ser a covariância <b>desses mesmos deslocamentos</b>. Se
pensares em Q como ruído de velocidade, as unidades deixam de bater certo com o G — e é esse o
erro conceptual que a sub-tarefa 4.7.4 da Lab 4 discute em detalhe.</p>
<p>Critérios: erro médio nas últimas 100 iterações abaixo de <b>4 cm</b>, e erro máximo abaixo de
<b>12 cm</b>. A solução do professor fica em ~3.4 mm de erro médio, portanto há bastante folga —
qualquer sintonia sensata passa.</p>
<p><b>Uma descoberta que vale a pena fazeres:</b> experimenta multiplicar <code>Q</code> e
<code>R</code> <i>ambos</i> pelo mesmo fator e volta a avaliar. O resultado não muda nada. O ganho
de Kalman depende da <b>razão</b> entre a confiança no modelo e a confiança nas medidas, não dos
valores absolutos. O que conta é o equilíbrio.</p>
<p>Outra: com três postes visíveis a cada ciclo o filtro é muito robusto — aguenta sintonias bem
más. A sintonia só se torna crítica quando a observabilidade é fraca (um só poste, ou medidas só
de ângulo, como nos pontos 2 e 4 da Lab 4).</p>
<p>Atenção ao clássico: <code>Q</code> e <code>R</code> guardam <b>variâncias</b>. As constantes do
topo do ficheiro são desvios padrão. Há um teste dedicado a apanhar essa confusão.</p>`),

      /* --------------------------------------------------- 9. entrega */
      {
        type: "labtask",
        kind: "code",
        title: "Entrega — o teu <code>NXTControl.spas</code> final",
        context: `<p>Junta tudo no projeto <code>EKF_Beacon_Laser_Students</code> e corre no SimTwo.
As duas rotinas auxiliares que escreveste aqui (<code>LaserPointToWorld</code> e
<code>ClusterMeasure</code>) voltam para dentro do <code>procedure Control</code>, nas linhas que
estavam comentadas. E não te esqueças de descomentar a chamada a
<code>LocationFromSensors()</code> — sem ela o EKF nunca chega a correr.</p>
<p><b>O que observar com o robô a andar:</b></p>
<ul>
  <li>as células (1,1)–(3,3) mostram quantos pontos foram associados a cada poste e o centróide;
  se algum ficar a zero enquanto o poste está à vista, a associação está errada;</li>
  <li>o bloco de <code>P</code> na folha: deve <b>crescer</b> entre observações e <b>encolher</b>
  a cada <code>EKF_Update</code>;</li>
  <li>a diferença entre a pose estimada e a verdadeira (<code>GetRobotX/Y/Theta</code>) ao longo de
  uma volta ao quadrado — compara com o que obtinhas só com odometria na Lab 1;</li>
  <li>o que acontece quando o robô fica virado de forma a só ver um poste: a incerteza cresce na
  direção perpendicular à linha robô–poste. É a observabilidade a manifestar-se.</li>
</ul>`,
        q: "Cola aqui a versão final do teu código (ou as rotinas que preencheste) para ficar guardada no milestone."
      }
    ]
  };

  var mods = C["m5"].modules;
  var i = mods.findIndex(function (x) { return x.id === "m5-mod6"; });
  if (i >= 0) mods[i] = mod; else mods.push(mod);
})();
