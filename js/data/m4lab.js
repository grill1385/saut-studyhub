/* ===== SAUT StudyHub — Labwork 4 reformulada (código MATLAB avaliado) =====
   Substitui o módulo m4-mod7 depois de m4.js ter sido carregado.
   Avaliação: js/matlab.js (interpretador) + js/grader.js, contra os fragmentos
   da solução do professor guardados em js/data/lab4spec.js.
*/
(function () {
  "use strict";
  var C = window.SAUT_CONTENT = window.SAUT_CONTENT || {};
  C["m4"] = C["m4"] || { modules: [] };

  function code(task, title, q, context) {
    return { type: "labtask", kind: "codeeval", task: task, title: title, q: q, context: context };
  }

  var mod = {
    id: "m4-mod7",
    title: "4.2 · Labwork 4 — EKF com beacons em Matlab (código avaliado)",
    minutes: 100,
    kind: "labwork",
    blurb: "Constróis o EKF peça a peça em MATLAB; cada peça é executada e comparada com a solução do professor.",
    pages: [

      /* --------------------------------------------------- 0. enquadramento */
      {
        type: "theory",
        title: "Como funciona esta labwork",
        html: `
<p><b>Tema:</b> localizar um robô de futebol robótico (tração diferencial, câmara rotativa no topo)
com um <b>Filtro de Kalman Estendido</b> alimentado por medidas de <b>distância</b> e <b>ângulo</b>
a beacons colocados nos cantos do campo.</p>

<p>Vais escrever o filtro <b>em MATLAB, peça a peça</b>. Em cada sub-tarefa escreves o fragmento
que no ficheiro do professor está marcado com <code>??</code>, carregas em <b>▶ Avaliar código</b>,
e o hub corre o teu fragmento e o dele <b>nos mesmos dados</b>, comparando as variáveis produzidas.</p>

<h4>Como é que o teu fragmento é executado</h4>
<p>Cada sub-tarefa tem um <i>harness</i>: um script que define as variáveis de entrada
(<code>v</code>, <code>omega</code>, <code>dt</code>, <code>P</code>, <code>xp1</code>, …), insere o
teu código, e depois lê as variáveis que devias ter calculado. Não declares as entradas — já existem.
Escreve só as linhas pedidas, exatamente como as escreverias no <code>.m</code>.</p>

<p><b>Podes escrever à tua maneira.</b> Variáveis auxiliares, <code>diag()</code> em vez de escrever a
matriz à mão, <code>while</code> em vez de <code>for</code>, <code>norm()</code> em vez de
<code>sqrt(...^2+...^2)</code> — tudo passa, desde que os <b>valores</b> batam certo.</p>

<h4>Onde é que estas tarefas te apanham</h4>
<ul>
  <li><b>Ângulos.</b> Vários casos de teste foram construídos com o robô ou o beacon em posições que
  fazem a diferença de ângulos saltar ±π. Sem <code>NormalizeAng</code> nos sítios certos, falhas.</li>
  <li><b>Transposições.</b> As fórmulas do EKF são sanduíches <code>A·P·A'</code>. Um apóstrofo a menos
  passa despercebido na leitura mas dá números diferentes — e o teste apanha.</li>
  <li><b>Constantes fixas.</b> Há casos com <code>dt</code> diferente e com desvios padrão diferentes,
  de propósito: se fixares valores no código em vez de usares as variáveis, reprovas.</li>
  <li><b>Desempenho.</b> A sub-tarefa de sintonia não compara valores: corre o filtro 300 iterações e
  exige que o erro de estimação <b>convirja</b>. Qualquer sintonia razoável passa.</li>
</ul>

<div class="labctx"><b>Ficheiros na pasta <code>Lab_4</code>:</b>
<code>ekf_1p_1p__V2.m</code> (o teu ficheiro de trabalho, com os <code>??</code>),
<code>robot_5dpo.m</code> (dinâmica do robô para o <code>ode45</code>),
<code>NormalizeAng.m</code> (normalização para (−π, π]),
<code>Tips_Labwork__4.pdf</code> (dicas do professor, com referência aos slides).
O <code>NormalizeAng</code> e o <code>ode45</code> já estão disponíveis aqui no hub — usa-os à vontade.</div>`,
        slideRef: "SAUT_LabWork_EKF_Beacons_V1_18Oct2023 + Tips_Labwork__4"
      },

      /* --------------------------------------------------- 1. motion model */
      code("motion",
        "Sub-tarefa 4.7.2 — modelo de movimento",
        "Escreve a propagação do estado estimado: a partir de <code>(xr_e, yr_e, theta_r_e)</code> e dos deslocamentos deste ciclo, calcula a pose no instante seguinte.",
        `<p>É a fase de <b>predição</b> do EKF: <code>X(k+1) = f(X(k), q)</code>. Não há aqui nenhuma
medida — só o modelo cinemático a extrapolar para onde o robô deve ter ido.</p>

<div class="labctx"><b>Convenção de notação, e vale a pena fixá-la já.</b> Ao longo de toda a
cadeia — aqui, nos Jacobianos e no Q — o professor raciocina em <b>deslocamentos por ciclo</b>,
não em velocidades:
<pre class="pas">Δd = v·dt        (avanço no ciclo, em metros)
Δθ = ω·dt        (rotação no ciclo, em radianos)</pre>
No código dele isto aparece escrito como <code>v*…*dt</code> e <code>omega*dt</code>, mas o objeto
com significado é sempre o deslocamento. Faz sentido: um filtro alimentado por <b>odometria</b>
recebe deslocamentos — os encoders contam impulsos, não velocidades. Escrever <code>delta_d</code>
e <code>delta_theta</code> como variáveis auxiliares é boa ideia, e é o que evita o tropeção
clássico na sub-tarefa 4.7.4.</div>

<p>Com essa notação o modelo é simplesmente:</p>
<pre class="pas">x'     = x     + Δd·cos(θ + Δθ/2)
y'     = y     + Δd·sin(θ + Δθ/2)
θ'     = θ     + Δθ</pre>
<p>O detalhe que separa uma implementação boa de uma medíocre é o <code>Δθ/2</code>: durante o
ciclo o robô também <b>roda</b>, e integrar o deslocamento com o ângulo <i>inicial</i> introduz um
erro de segunda ordem que se acumula em cada iteração.</p>
<p>Cuidado com a <b>ordem</b> das três linhas: duas delas precisam do valor antigo da orientação.</p>`),

      /* --------------------------------------------------- 2. grad_f_X */
      code("grad_f_x",
        "Sub-tarefa 4.7.3 — Jacobiano <code>grad_f_X</code>",
        "Escreve a matriz 3×3 <code>grad_f_X = df/dX</code>: a derivada do modelo de movimento em ordem ao estado <code>[x ; y ; theta]</code>.",
        `<p>É aqui que o filtro deixa de ser linear e passa a ser <i>estendido</i>: como não há uma
matriz de transição F, lineariza-se f em torno da estimativa atual.</p>
<p>Pensa coluna a coluna: «se o x anterior mudar 1, quanto muda o x novo? e o y? e o theta?».
Duas das colunas são triviais. A terceira é a interessante:</p>
<pre class="pas">∂x'/∂θ = −Δd·sin(θ + Δθ/2)
∂y'/∂θ = +Δd·cos(θ + Δθ/2)</pre>
<p>Repara no fator: é o <b>deslocamento</b> Δd, não um <code>dt</code> avulso. No código do
professor lês <code>-v*dt*sin(…)</code>, que é exatamente o mesmo — <code>v*dt</code> <i>é</i> o Δd.</p>
<p>E é isto que diz que um erro na <b>orientação</b> se transforma em erro de <b>posição</b>
proporcional à distância percorrida. Um robô que ande 10 m com 1° de erro de orientação acumula
~17 cm de erro lateral. É por isso que a orientação é a variável mais crítica em odometria.</p>`),

      /* --------------------------------------------------- 3. grad_f_U */
      code("grad_f_u",
        "Sub-tarefa 4.7.4 — Jacobiano <code>grad_f_U</code> = ∂f/∂[Δd ; Δθ]",
        "Escreve a matriz 3×2 <code>grad_f_U</code>: a derivada do modelo de movimento em ordem aos <b>deslocamentos</b> <code>[Δd ; Δθ]</code>.",
        `<p>Serve para levar o ruído da <b>odometria</b> — que vive no espaço 2D dos deslocamentos —
para o espaço 3D do estado. É o G da expressão <code>G·Q·G'</code>.</p>

<div class="labctx"><b>Atenção ao nome.</b> O professor chama-lhe <code>grad_f_U</code> e comenta
<code>% grad_f_U=df/dU</code>, o que sugere derivada em ordem aos <i>controlos</i> [v ; ω]. Mas não
é isso que a matriz dele é: é <b>∂f/∂[Δd ; Δθ]</b>. Na Lab 5, no SimTwo, ele corrige o nome e
chama-lhe <code>grad_f_q</code> — <i>q</i> de ruído de processo. É essa a leitura certa.</div>

<h4>Porque é que não aparece nenhum <code>dt</code>?</h4>
<p>É a pergunta natural: se <code>x' = x + v·dt·cos(·)</code>, derivar em ordem a <code>v</code>
devia deixar um <code>dt</code> lá. E deixa — só que não é em ordem a <code>v</code> que se deriva.
Reescreve f em deslocamentos e faz as contas:</p>
<pre class="pas">x' = x + Δd·cos(θ + Δθ/2)

∂x'/∂Δd = cos(θ + Δθ/2)        ← sem dt: ele já está DENTRO do Δd
∂x'/∂Δθ = −Δd·½·sin(θ + Δθ/2)  ← o Δd reaparece, mas como resto, não como fator de derivação
∂θ'/∂Δθ = 1                    ← 1, e não dt, pela mesma razão</pre>
<p>Bate certo com a matriz do professor, entrada a entrada.</p>
<p><b>E se derivasses mesmo em ordem a [v ; ω]?</b> Obterias esta matriz inteira multiplicada por
<code>dt</code>, e um <code>dt</code> no canto inferior. Também estaria correto — mas como
<code>G_vel = dt·G_desl</code>, a parcela <code>G·Q·G'</code> só dá o mesmo se usares
<code>Q_vel = Q_desl/dt²</code>. As duas formulações produzem exatamente o mesmo <code>P</code>;
o que muda é o <b>significado de Q</b>. O professor escolheu a versão em deslocamentos, e é por
isso que o Q dele se lê em «metros por ciclo», não em «metros por segundo».</p>`),

      /* --------------------------------------------------- 4. quiz */
      {
        type: "quiz",
        title: "Predição: o que é que P, Q e os Jacobianos representam",
        questions: [
          {
            kind: "mcq",
            q: "Porque é que <code>Q</code> é 2×2 e não 3×3, se o estado tem três componentes?",
            options: [
              "Por economia de cálculo — 3×3 daria o mesmo resultado mais devagar.",
              "Porque Q descreve o ruído dos <b>deslocamentos</b> [Δd ; Δθ] medidos pela odometria, e é o <code>grad_f_U</code> que o transporta para o espaço do estado.",
              "Porque a orientação não tem ruído.",
              "Porque Q só modela o ruído em x e y."
            ],
            answer: 1,
            hint: "Olha para as dimensões de <code>grad_f_U*Q*grad_f_U'</code>: 3×2 · 2×2 · 2×3.",
            explain: "Q vive no espaço dos deslocamentos por ciclo. O produto <code>G·Q·G'</code> dá uma matriz 3×3, que é a contribuição do erro de odometria para a incerteza do estado. Se escrevesses Q diretamente 3×3 estarias a modelar ruído de processo genérico — outra formulação, com outro significado."
          },
          {
            kind: "mcq",
            q: "Na terceira coluna de <code>grad_f_X</code> aparece <code>-v*dt*sin(·)</code>, ou seja <code>−Δd·sin(·)</code>. O que é que isso significa fisicamente?",
            options: [
              "Que o robô perde velocidade quando roda.",
              "Que um erro na orientação estimada se converte em erro de posição, tanto maior quanto mais o robô andar nesse ciclo.",
              "Que o seno da orientação é a componente x da velocidade.",
              "Que a orientação depende da posição em x."
            ],
            answer: 1,
            hint: "O fator é <code>Δd = v·dt</code> — a distância percorrida no ciclo.",
            explain: "É a razão pela qual a incerteza angular é a mais perigosa: multiplica-se pela distância percorrida e contamina x e y. Um robô que ande 10 m com 1° de erro de orientação acumula ~17 cm de erro lateral."
          },
          {
            kind: "flash",
            front: "Porque é que a propagação da covariância é <code>P = F·P·F' + G·Q·G'</code> e não <code>P = F·P + Q</code>?",
            back: "Porque P é uma matriz de <b>covariância</b>, não um vetor. Se X' = F·X, então cov(X') = F·cov(X)·F'. A transposição do lado direito é o que garante que o resultado continua simétrico e semidefinido positivo. O segundo termo adiciona a incerteza nova, também ela transportada em sanduíche por G."
          }
        ]
      },

      /* --------------------------------------------------- 5. P prop */
      code("p_prop",
        "Sub-tarefa 4.7.6 — propagação da covariância",
        "Escreve a linha que propaga <code>P</code> através do modelo de movimento.",
        `<p>Uma linha só, mas é a que mais gente escreve mal. Duas parcelas:</p>
<ul>
  <li>a incerteza que já tinhas, transportada pelo modelo — em <b>sanduíche</b> com o Jacobiano do estado;</li>
  <li>a incerteza nova injetada pelo erro de <b>odometria</b> deste ciclo (o erro em Δd e Δθ) — em sanduíche com o <code>grad_f_U</code>.</li>
</ul>
<p>Os testes incluem um caso com <code>P</code> não diagonal, de propósito: com P diagonal e Jacobianos
simples, esquecer uma transposição pode passar despercebido. Com correlações cruzadas, não passa.</p>`),

      /* --------------------------------------------------- 6. h(X) */
      code("h_model",
        "Sub-tarefa 4.7.7 — medida esperada <code>h(X)</code>",
        "Calcula <code>distp_e</code> e <code>theta_p_e</code>: a distância e o ângulo que o robô <b>espera</b> medir ao poste 1, dado o seu estado estimado.",
        `<p>Começa a fase de <b>atualização</b>. O filtro compara o que o sensor leu com o que ele
<i>esperava</i> ler — essa diferença é a inovação.</p>
<p>Regra de ouro: <b>h(X) só pode usar variáveis estimadas</b> (<code>xr_e</code>, <code>yr_e</code>,
<code>theta_r_e</code>) e as coordenadas conhecidas do poste. Usar a pose verdadeira
(<code>xr</code>, <code>yr</code>) seria batota — o robô real não a conhece, e o filtro pareceria
funcionar perfeitamente na simulação e falhar no robô.</p>
<p>O ângulo é medido no referencial do <b>robô</b>: é o ângulo absoluto ao poste menos a orientação
do robô, normalizado. Um dos testes coloca o poste quase exatamente atrás do robô.</p>`),

      /* --------------------------------------------------- 7. R */
      code("r_matrix",
        "Sub-tarefa 4.7.8 — matriz <code>R</code> do ruído das medidas",
        "Escreve a matriz 2×2 <code>R</code> com a incerteza das duas medidas.",
        `<p>O enunciado diz uma coisa fácil de ignorar: <i>«Assume that the standard deviation of the
distance error increases proportionally with the distance»</i>. O <code>sdv_dist_1m = 0.05</code>
está em <b>m/m</b> — é o erro por metro. A 6 m de distância o desvio padrão é 0.30 m, não 0.05 m.</p>
<p>Faz sentido físico: a câmara mede o tamanho aparente do poste, e o erro relativo mantém-se.
Consequência prática: o filtro confia mais nos postes próximos, automaticamente.</p>
<p>Dois lembretes: R guarda <b>variâncias</b> (desvios ao quadrado), e assume-se que os dois erros
são independentes (matriz diagonal). Um dos testes muda os desvios padrão — não os fixes no código.</p>`),

      /* --------------------------------------------------- 8. grad_h_X */
      code("grad_h_x",
        "Sub-tarefa 4.7.9 — Jacobiano da observação <code>grad_h_X</code>",
        "Escreve a matriz 2×3 <code>grad_h_X = dh/dX</code>: a derivada de <code>[distância ; ângulo]</code> em ordem a <code>[x ; y ; theta]</code>.",
        `<p>Seis derivadas parciais. Faz uma linha de cada vez e confirma os <b>sinais</b> — é o erro
mais comum, porque as expressões estão escritas em <code>(xp − x)</code> e derivar em ordem a
<code>x</code> troca o sinal.</p>
<p>Duas verificações rápidas de sanidade:</p>
<ul>
  <li>A distância não depende da orientação do robô → a entrada (1,3) é <b>0</b>.</li>
  <li>Se o robô rodar +1 rad, o ângulo medido ao poste diminui 1 rad → a entrada (2,3) é <b>−1</b>.</li>
</ul>
<p>E repara na assimetria de escalas: na linha da distância o denominador é <code>d</code>; na do
ângulo é <code>d²</code>. Faz sentido — a mesma deslocação lateral produz menos variação angular
quando o poste está longe.</p>`),

      /* --------------------------------------------------- 9. update */
      code("update",
        "Sub-tarefa 4.7.10 — ganho de Kalman e atualização",
        "Escreve o ganho <code>k</code>, a atualização da covariância <code>P</code> e a atualização do estado <code>X_e</code>.",
        `<p>Este bloco vem <b>já escrito</b> no ficheiro do professor — mas é o coração do filtro e cai
no exame, por isso escreve-o à mão pelo menos uma vez.</p>
<p>Três linhas com uma ordem obrigatória: a atualização de P usa o ganho, e o ganho usa o P
<b>anterior</b>. Se atualizares P primeiro, os números mudam.</p>
<p>A armadilha está na inovação. <code>z − z_e</code> tem duas componentes, e a segunda é um
<b>ângulo</b>: se a leitura for +3.05 rad e a expectativa −3.10 rad, a diferença dá 6.15 rad quando o
erro real é 0.13 rad. Sem normalizar, o filtro leva um empurrão de ~2π e a estimativa salta. Há um
caso de teste construído exatamente assim.</p>`),

      /* --------------------------------------------------- 10. tuning */
      code("tuning",
        "Sub-tarefa 4.7.11 — sintonia de <code>P</code> inicial e <code>Q</code>",
        "Escolhe <code>P</code> (3×3) e <code>Q</code> (2×2) que façam o filtro convergir.",
        `<p><b>Esta sub-tarefa não compara valores com os do professor</b> — não há resposta única.
O hub corre o filtro completo (300 iterações, com o robô simulado por <code>ode45</code> e as duas
beacons a alternarem a cada 50 ciclos) e mede o desempenho:</p>
<ul>
  <li>o <b>erro médio</b> de posição nas últimas 100 iterações tem de ficar abaixo de <b>6 cm</b>;</li>
  <li>o <b>erro máximo</b> no mesmo intervalo tem de ficar abaixo de <b>20 cm</b> (o filtro não pode
  perder-se e recuperar).</li>
</ul>
<p>O que estás mesmo a decidir:</p>
<ul>
  <li><b>P inicial</b> — quanta confiança tens na pose de arranque. O robô começa em (2, −2) mas o
  filtro assume (2.5, −2.5): há 0.7 m de erro à partida. Um P demasiado pequeno diz «tenho a
  certeza» e o filtro rejeita as medidas que o tentam corrigir.</li>
  <li><b>Q</b> — quanta confiança tens no modelo de movimento, no espaço dos <b>deslocamentos</b>
  [Δd ; Δθ]. Q grande: converge depressa mas a estimativa fica ruidosa. Q pequeno: estimativa suave
  mas lenta a reagir, e capaz de nunca apanhar o robô.</li>
</ul>
<p><b>Lê o Q do professor em unidades</b> — é o melhor teste de que percebeste a convenção.
<code>Q = diag(0.0005², 0.0005²)</code> diz: «em cada ciclo de 40 ms erro cerca de 0.5 mm no avanço
e 0.5 mrad na rotação». Plausível para odometria. Se fosse ruído de <i>velocidade</i> seriam
0.5 mm/s — otimista de mais para ser credível. É mais uma confirmação de que a leitura certa é
em deslocamentos por ciclo, e não em velocidades.</p>
<p>Faz o que o professor sugere nas dicas: parte dos valores dele, multiplica e divide por 100, e
observa o efeito nos dois indicadores. A leitura desses <i>trade-offs</i> é o que se pergunta no exame.</p>`),

      /* --------------------------------------------------- 11. loop 4 postes */
      code("loop4",
        "Sub-tarefa 4.7.12 — câmara omnidirecional: os 4 postes",
        "Escreve o ciclo que faz uma atualização do EKF por cada um dos 4 postes, no mesmo instante de amostragem.",
        `<p>Pontos 3 e 4 do enunciado: em vez de uma câmara rotativa que vê um poste de cada vez, o robô
tem uma câmara omnidirecional e vê os quatro simultaneamente.</p>
<p>A predição continua a ser <b>uma</b> por período de amostragem — o robô só se mexeu uma vez. O que
passa a haver são <b>quatro atualizações sequenciais</b>, cada uma partindo do resultado da anterior.
É esse o ponto crítico da sub-tarefa: se as quatro usarem a mesma estimativa de partida, estás a
contar a mesma informação quatro vezes e a covariância colapsa indevidamente.</p>
<p>O harness já te dá <code>xp</code>, <code>yp</code> (1×4) e <code>zs</code> (2×4, com a medida
<code>[distância ; ângulo]</code> de cada poste já simulada com ruído). O corpo do ciclo é o que
escreveste nas sub-tarefas 4.7.7 a 4.7.10, com o índice <code>j</code>.</p>
<p><b>Nota sobre o enunciado:</b> os pontos 2 e 4 pedem as variantes <i>só ângulo</i> e <i>só
distância</i>. Depois de teres isto a funcionar são uma alteração pequena — ficam-te como exercício
no MATLAB: reduz <code>z</code>, <code>z_e</code>, <code>R</code> e <code>grad_h_X</code> a uma
linha. Repara no que acontece à observabilidade em cada caso.</p>`),

      /* --------------------------------------------------- 12. entrega */
      {
        type: "labtask",
        kind: "code",
        title: "Entrega — o teu <code>ekf_1p_1p.m</code> final",
        context: `<p>Junta as peças no <code>ekf_1p_1p__V2.m</code> e corre no MATLAB a sério: o hub
valida a lógica, mas quem te mostra o filtro a trabalhar é o gráfico da trajetória verdadeira
sobreposta à estimada.</p>
<p><b>O que observar no gráfico:</b></p>
<ul>
  <li>a convergência inicial — quantos ciclos demora a estimativa a apanhar o robô a partir dos 0.7 m
  de erro de arranque;</li>
  <li>o que acontece de 50 em 50 ciclos, quando a câmara comuta de beacon;</li>
  <li>o efeito de dividir Q por 100 (estimativa suave mas lenta) e de o multiplicar por 100
  (rápida mas ruidosa);</li>
  <li>o efeito de arrancar com P grande (desvio padrão de 2.5 m — «não faço ideia de onde estou»),
  como sugerido no <code>Tips_Labwork__4.pdf</code>.</li>
</ul>
<p>Ficas assim com material para as perguntas de exame sobre sintonia e sobre o papel de cada matriz.</p>`,
        q: "Cola aqui a tua versão final do script (ou as partes que preencheste) para ficar guardada no milestone."
      }
    ]
  };

  var mods = C["m4"].modules;
  var i = mods.findIndex(function (x) { return x.id === "m4-mod7"; });
  if (i >= 0) mods[i] = mod; else mods.push(mod);
})();
