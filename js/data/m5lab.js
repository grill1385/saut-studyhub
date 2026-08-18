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

      /* --------------------------------------------------- 0b. referência */
      {
        type: "theory",
        title: "📋 Referência — globais, funções de matriz e mapa de células",
        html: `
<p>Tudo o que precisas de ter à mão nas sub-tarefas seguintes. Nada disto se declara — já existe.</p>

<h4>Variáveis globais</h4>
<table>
  <tr><th>Nome</th><th>Tipo</th><th>O que é</th></tr>
  <tr><td><code>x, y, theta</code></td><td>double</td><td>pose <b>estimada</b> — lida e escrita por quase tudo</td></tr>
  <tr><td><code>vlin, omega</code></td><td>double</td><td>velocidades atuais (atenção: <code>vlin</code>, não <code>v</code>)</td></tr>
  <tr><td><code>truex, truey, truetheta</code></td><td>double</td><td>pose verdadeira — <b>só</b> para calcular o erro, nunca para controlo</td></tr>
  <tr><td><code>XR, P, Q, R</code></td><td>Matrix</td><td>estado 3×1, covariância 3×3, ruído modelo 2×2, ruído sensor 2×2</td></tr>
  <tr><td><code>grad_f_X, grad_f_q, grad_h_x</code></td><td>Matrix</td><td>Jacobianos 3×3, 3×2, 2×3</td></tr>
  <tr><td><code>LaserValues</code></td><td>Matrix</td><td>as distâncias dos raios; <code>Mgetv(LaserValues, i, 0)</code></td></tr>
  <tr><td><code>firstRay, lastRay</code></td><td>integer</td><td>limites do varrimento</td></tr>
  <tr><td><code>BeaconPos[j]</code></td><td>TPos</td><td><b>mapa</b>: posições conhecidas dos postes, j = 1..NBEACONS</td></tr>
  <tr><td><code>BeaconCluster[j]</code></td><td>record</td><td>campos <code>.x .y .n</code> (associação) e <code>.dist .ang</code> (medida)</td></tr>
</table>
<p>Constantes: <code>NBEACONS</code>=3, <code>NBEAMS2</code>=180, <code>dt</code>=0.04,
<code>ToMetres</code>, <code>WheelDist</code>, <code>lin_stddev</code>, <code>omega_stddev</code>,
<code>sensD_stddev</code>, <code>sensA_stddev</code>.</p>

<h4>Funções de matriz</h4>
<p><b>Não há operadores aritméticos para matrizes.</b> Nada de <code>A*B</code>, <code>A+B</code>
ou <code>-A</code> — tudo são chamadas de função.</p>
<table>
  <tr><th>Função</th><th>Faz</th></tr>
  <tr><td><code>Mzeros(m,n)</code> / <code>Meye(n)</code></td><td>matriz de zeros / identidade</td></tr>
  <tr><td><code>Madd(A,B)</code> / <code>Msub(A,B)</code></td><td>soma / subtração — sempre <b>dois</b> argumentos</td></tr>
  <tr><td><code>MMult(A,B)</code> / <code>Mtran(A)</code> / <code>Minv(A)</code></td><td>produto / transposta / inversa</td></tr>
  <tr><td><code>Msetv(M,i,j,v)</code> / <code>Mgetv(M,i,j)</code></td><td>elemento — <b>índices de base 0</b></td></tr>
  <tr><td><code>RangeToMatrix(l,c, nl,nc)</code></td><td>folha → matriz</td></tr>
  <tr><td><code>MatrixToRange(l,c, M)</code></td><td>matriz → folha</td></tr>
</table>

<h4>Mapa de células</h4>
<table>
  <tr><th>Bloco</th><th>Âncora</th><th>Dim</th><th>Células que escreves à mão</th></tr>
  <tr><td><b>XR</b> (x, y, θ)</td><td>(33,1)</td><td>3×1</td><td>(33,1)=x, (34,1)=y, (35,1)=θ</td></tr>
  <tr><td><b>P</b></td><td>(33,5)</td><td>3×3</td><td>— (só <code>MatrixToRange</code>)</td></tr>
  <tr><td><b>R</b> (ruído sensor)</td><td>(38,1)</td><td>2×2</td><td><code>Msetv(R,0,0,rSensD)</code>, <code>Msetv(R,1,1,rSensA)</code></td></tr>
  <tr><td><b>Q</b> (ruído modelo)</td><td>(38,5)</td><td>2×2</td><td>(38,5)=qV, (39,6)=qOmega</td></tr>
  <tr><td><b>P inicial</b></td><td>(33,9)</td><td>3×3</td><td>vem da <b>folha</b>, não do script — se estiver vazia o filtro arranca com incerteza nula</td></tr>
  <tr><td><b>df/dX</b></td><td>(42,1)</td><td>3×3</td><td>só (42,3) e (43,3) — o resto é a identidade da <code>Initialize</code></td></tr>
  <tr><td><b>df/dq</b></td><td>(42,5)</td><td>3×2</td><td>(42,5) (42,6) (43,5) (43,6); o (44,6)=1 vem da <code>Initialize</code></td></tr>
  <tr><td><b>dh/dX</b></td><td>(47,1)</td><td>2×3</td><td>(47,1) (47,2) (48,1) (48,2); o (47,3)=0 e (48,3)=−1 vêm da <code>Initialize</code></td></tr>
  <tr><td><b>Z</b> (medida)</td><td>(51,1)</td><td>2×1</td><td>(51,1)=dist, (52,1)=ângulo</td></tr>
  <tr><td><b>Z_E</b> (inovação)</td><td>(51,3)</td><td>2×1</td><td>(51,3)=Δdist, (52,3)=Δângulo</td></tr>
  <tr><td><b>Kf</b> (ganho)</td><td>(51,5)</td><td>3×2</td><td>— (só <code>MatrixToRange</code>)</td></tr>
</table>

<h4>Porquê a ida e volta pelas células ★</h4>
<p>Existem <b>duas representações do mesmo estado</b>, e ambas são necessárias:</p>
<ul>
  <li><code>x</code>, <code>y</code>, <code>theta</code> — escalares. É o que a odometria integra e
  o que o <code>AssociateBeacons</code> e o cálculo do <code>dBeacon</code> usam. Todo o código
  "normal" trabalha com estes.</li>
  <li><code>XR</code> — matriz 3×1. É o que a álgebra do Kalman exige, porque
  <code>Madd(XR, MMult(Kf, Z_E))</code> só opera sobre matrizes.</li>
</ul>
<p>A folha é a ponte entre as duas — e serve de dashboard ao mesmo tempo. O circuito por ciclo:</p>
<pre class="pas">odometria  →  x, y, theta        (escalares)
   ↓ SetRCValue(33..35, 1)
células (33,1)..(35,1)
   ↓ RangeToMatrix(33,1, 3,1)
XR (3×1)                          ← o MotionModel acaba aqui
   ↓ XR := Madd(XR, MMult(Kf, Z_E))     correção
   ↓ MatrixToRange(33,1, XR)
células (33,1)..(35,1)
   ↓ GetRCValue(33,1) ...
x, y, theta                       ← prontas para o ciclo seguinte</pre>
<div class="hl"><b>Erro clássico:</b> terminar o <code>EKF_Update</code> logo a seguir ao
<code>XR := Madd(...)</code>. A correção fica presa dentro do <code>XR</code>, as globais nunca são
atualizadas, e o sistema comporta-se exatamente como odometria pura — o <code>P</code> até diminui,
o que faz parecer que o filtro está a funcionar. Fecha sempre o circuito:</div>
<div class="hl"><b>«Access violation» ao arrancar o filtro?</b> É quase sempre o
<code>Minv</code> a tentar inverter uma matriz singular. Se deixaste <code>qV</code>,
<code>qOmega</code>, <code>rSensD</code> e <code>rSensA</code> a zero (os valores do esqueleto),
então <code>Q = R = 0</code>; com <code>Q = 0</code> o <code>P</code> nunca cresce, e
<code>S = H·P·Hᵀ + R</code> dá a matriz nula. Faz primeiro a sub-tarefa da sintonia e confirma
que o <code>P</code> inicial nas células (33,9)–(35,11) não está vazio.</div>
<pre class="pas">XR := Madd(XR, MMult(Kf, Z_E));
MatrixToRange(33,1, XR);
x     := GetRCValue(33,1);
y     := GetRCValue(34,1);
theta := NormalizeAngle(GetRCValue(35,1));
SetRCValue(35,1, format('%.4g', [theta]));   // re-escreve o θ já normalizado</pre>`,
        slideRef: "control.pas da cena EKF_Beacon_Laser_Students"
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
<p>Três detalhes de implementação:</p>
<ul>
  <li>Soma-se <b>0.02 m</b> à distância medida — o laser vê a <i>superfície</i> do poste, e o que
  interessa é o centro.</li>
  <li><b>Raios sem eco.</b> Quando um raio não encontra nada dentro do alcance, o SimTwo devolve
  um valor <b>negativo</b> nessa posição de <code>LaserValues</code>. Tens de os descartar com
  <code>if MeasureDist &gt; 0</code> — <i>depois</i> de somares o 0.02, como faz o professor.
  Sem esse teste projetas um ponto a distância negativa, ou seja na direção <b>oposta</b> à do
  raio, que pode calhar dentro dos 10 cm de um poste e contaminar o centróide.</li>
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

      /* --------------------------------------------------- 8. glue */
      code("locfromsensors",
        "Sub-tarefa 5.6.9 — juntar as peças: <code>LocationFromSensors</code>",
        "Escreve o <code>LocationFromSensors</code>: uma predição por ciclo e uma atualização por cada beacon efetivamente detetado.",
        `<p>É a rotina que a <b>alínea c) do enunciado</b> te manda descomentar no
<code>procedure Control</code>. Sem ela nada disto corre: o robô fica só com odometria, e vês a
estimativa afastar-se lentamente da verdade — que é exatamente o que a alínea a) te pede para
observares primeiro.</p>
<p>São cinco linhas, mas encerram a estrutura de todo o filtro:</p>
<ul>
  <li><b>Uma</b> predição por ciclo. O robô só se mexeu uma vez nestes 40 ms.</li>
  <li><b>Uma</b> atualização por cada beacon — mas só pelos que foram <b>mesmo detetados</b>.</li>
</ul>
<p>Essa segunda condição é a que separa o código que funciona do que rebenta. Um cluster que
não recebeu nenhum ponto do laser tem <code>dist</code> e <code>ang</code> a zero: é uma medida
inventada. Se a passares ao <code>EKF_Update</code>, o filtro trata-a como informação boa,
encolhe o <code>P</code> e puxa a estimativa para um sítio arbitrário. É a versão silenciosa do
problema que a <b>alínea e)</b> te pede para provocar, retirando um poste da cena.</p>
<p>Um dos casos de teste tem os três clusters vazios — o resultado tem de ser <i>só</i> a
predição, sem correção nenhuma.</p>`),

      /* --------------------------------------------------- 9. sintonia */
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

      /* ------------------------------------------- 10. experiências no SimTwo */
      {
        type: "theory",
        title: "Experiências no SimTwo — alíneas a), c), d) e e)",
        html: `
<p>Estas quatro experiências <b>não são código</b>: são as observações que o enunciado pede e que
o avaliador não pode fazer por ti, porque exigem o SimTwo a correr e a cena a ser editada.
São elas que dão as respostas de exame sobre sintonia e robustez.</p>

<h4>a) Só odometria — a linha de base</h4>
<p>Põe a estimativa inicial <b>igual à verdadeira</b> nas células (33,3), (34,3), (35,3):
<code>x = 0</code>, <code>y = 0</code>, <code>theta = 1.57</code>. Depois <b>Global RESET</b> →
<b>Chart</b> (ligar) → <b>FollowSquare</b>, e deixa fechar o quadrado todo.</p>
<p>Repara que aqui a estimativa arranca <i>certa</i>. Mesmo assim, a verde (estimada) separa-se
da vermelha (verdadeira) ao longo do percurso. É a <b>deriva</b> da odometria — escorregamento das
rodas, quantização dos encoders. Guarda esta imagem: é o problema que o EKF vem resolver, e é
diferente do da Lab 4, onde o modelo era quase perfeito e o que estava errado era a pose inicial.</p>

<h4>c) Sintonia de Q e do P inicial</h4>
<p>Com a estimativa inicial agora <b>errada</b> (<code>x = y = 0.05</code>, <code>theta = 1.57</code>),
o enunciado manda testar valores concretos. Corri-os no simulador do hub, a partir de um erro
inicial de ~0.45 m:</p>
<table class="testtab"><tbody>
<tr><td><b>lin_stddev = omega_stddev</b></td><td><b>erro médio</b></td><td><b>erro máximo</b></td></tr>
<tr><td>1E-6</td><td>6.6 mm</td><td>8.2 mm</td></tr>
<tr><td>1E-2 <i>(valor do código)</i></td><td>3.4 mm</td><td>11.6 mm</td></tr>
<tr><td>1E-1</td><td>3.8 mm</td><td>14.2 mm</td></tr>
</tbody></table>
<p>O padrão é o esperado: <code>Q</code> pequeno de mais dá uma estimativa <b>suave mas
tendenciosa</b> (erro médio maior, máximo menor — o filtro não reage); <code>Q</code> grande dá
uma estimativa <b>ágil mas ruidosa</b> (média baixa, picos maiores). O valor do meio é o
compromisso. No SimTwo o efeito é mais marcado que aqui, porque lá a deriva da odometria é real.</p>

<p>Para o <code>P</code> inicial o contraste é muito mais violento, e é no <b>transitório</b> que
se vê. Erro de posição nos primeiros ciclos, partindo dos mesmos 0.45 m:</p>
<table class="testtab"><tbody>
<tr><td><b>P inicial</b></td><td><b>ciclo 1</b></td><td><b>ciclo 5</b></td><td><b>ciclo 20</b></td></tr>
<tr><td>i) cov(x)=cov(y)=1E-4, cov(θ)=3E-4</td><td>49 mm</td><td>7 mm</td><td>1.7 mm</td></tr>
<tr><td>ii) cov(x)=cov(y)=1E-8, cov(θ)=3E-8</td><td>386 mm</td><td>304 mm</td><td>192 mm</td></tr>
</tbody></table>
<p>É a lição central da alínea: com <code>P</code> minúsculo o filtro <b>declara ter a certeza</b>
de uma pose que está errada. O ganho de Kalman fica quase nulo, ele rejeita as medidas que o
tentam corrigir, e arrasta o erro durante dezenas de ciclos. Com <code>P</code> folgado, corrige
quase de imediato. Moral: <b>P inicial deve refletir a tua ignorância real sobre a pose de
arranque</b> — na dúvida, peca por excesso.</p>

<h4>d) Beacon falso</h4>
<p>No editor de cena (Ctrl+S) acrescenta o cilindro que o enunciado dá, em (1.4, 1.0):</p>
<pre class="pas">&lt;cylinder&gt;
  &lt;ID value='BeaconFalse'/&gt;
  &lt;size x='0.1' y='0' z='0.4'/&gt;
  &lt;pos x='1.4' y='1' z='0.2'/&gt;
  &lt;color_rgb r='128' g='128' b='128'/&gt;
&lt;/cylinder&gt;</pre>
<p>Está a 0.32 m do beacon 2, que fica em (1.3, 1.3) — bem acima do limiar de 0.1 m. O módulo de
associação deve ignorá-lo por completo: nas células (1,1)–(3,3) o número de pontos de cada cluster
não se altera. <b>Duas das sub-tarefas de associação já testam este cenário</b>, incluindo uma
variante com o poste falso a apenas 12 cm do verdadeiro.</p>
<p>A experiência a fazer é <b>arrastar o poste falso</b> para cada vez mais perto do verdadeiro e
encontrar a distância a partir da qual o cluster fica contaminado. Vais ver o centróide desviar-se
e a estimativa dar um puxão. É a pergunta de exame sobre associação de dados: o limiar é um
compromisso entre apanhar todos os pontos do poste certo e não apanhar nenhum do errado.</p>

<h4>e) Retirar um beacon</h4>
<p>Ainda no editor de cena, apaga um dos três postes. O cluster correspondente passa a ter
<code>n = 0</code> e o <code>LocationFromSensors</code> deixa de fazer a atualização com ele —
por isso é que aquele <code>if</code> lá está.</p>
<p>O que observar é a <b>geometria da incerteza</b>: com dois postes o filtro ainda localiza, mas
a elipse de covariância deixa de ser aproximadamente circular. Coloca o robô em posições onde os
dois postes restantes fiquem quase alinhados com ele e repara na incerteza a crescer na direção
perpendicular. É observabilidade — o mesmo fenómeno que exploraste nos pontos 2 e 4 da Lab 4.</p>

<div class="labctx"><b>Nota sobre uma discrepância.</b> O enunciado diz que o terceiro beacon está
em <b>(0.5, 0.3)</b>, mas o código do professor tem <code>BeaconPos[3] := (0.5, -0.3)</code>. As
sub-tarefas deste módulo usam o valor do <b>código</b>, que é o que a cena carrega. Se o professor
perguntar, vale a pena teres reparado.</div>`,
        slideRef: "SAUT_LabWork_5_EKF_Beacons_SimTwo (V4, 11Nov2024), alíneas a)–e)"
      },

      /* --------------------------------------------------- 11. montagem */
      {
        type: "labtask",
        kind: "assemble",
        title: "O teu <code>NXTControl.spas</code> — tudo junto",
        context: `<p>Aqui está o código de todas as sub-tarefas, pela ordem em que as escreveste,
pronto para copiar de uma vez para o editor do SimTwo.</p>
<p>Duas notas ao colar: as rotinas auxiliares <code>LaserPointToWorld</code> e
<code>ClusterMeasure</code> foram pedidas assim para serem testáveis — no ficheiro do professor o
corpo delas vai <b>para dentro</b> do <code>procedure Control</code>, nas linhas que estavam
comentadas. E não te esqueças de <b>descomentar a chamada a
<code>LocationFromSensors()</code></b>: sem ela o EKF não corre.</p>
<p><b>Checklist antes de dar a labwork por terminada:</b> as células (1,1)–(3,3) mostram pontos
associados a cada poste; o bloco do <code>P</code> na folha cresce entre observações e encolhe a
cada atualização; e a pose estimada segue a verdadeira (<code>GetRobotX/Y/Theta</code>) ao longo
de uma volta completa ao quadrado.</p>`,
        q: "Copia e leva para o SimTwo."
      }
    ]
  };

  var mods = C["m5"].modules;
  var i = mods.findIndex(function (x) { return x.id === "m5-mod6"; });
  if (i >= 0) mods[i] = mod; else mods.push(mod);
})();
