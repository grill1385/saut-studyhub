/* ===== SAUT StudyHub — Labwork 3 reformulada (avaliação automática de código) =====
   Substitui o módulo m3-mod6 depois de m3.js ter sido carregado.
   As sub-tarefas de código são validadas por js/grader.js contra a solução do
   professor (js/data/lab3spec.js): compara-se o COMPORTAMENTO, não o texto.
*/
(function () {
  "use strict";
  var C = window.SAUT_CONTENT = window.SAUT_CONTENT || {};
  C["m3"] = C["m3"] || { modules: [] };

  function code(task, title, q, context) {
    return { type: "labtask", kind: "codeeval", task: task, title: title, q: q, context: context };
  }

  var mod = {
    id: "m3-mod6",
    title: "Labwork 3 — GotoXY, FollowLine e FollowCircle no robô omni (código avaliado)",
    minutes: 90,
    kind: "labwork",
    pages: [

      /* ------------------------------------------------ 0. enquadramento */
      {
        type: "theory",
        title: "Como funciona esta labwork",
        html: `
<p>Esta labwork é <b>escrita por ti e corrigida automaticamente</b>. Em cada sub-tarefa
escreves uma rotina em Pascal (a mesma sintaxe do editor do SimTwo) e carregas em
<b>▶ Avaliar código</b>. O hub transpila o teu código, corre-o em vários cenários e compara
os <b>sinais produzidos</b> — velocidades das quatro rodas, estados das máquinas, valores
devolvidos por referência — com os da solução oficial do professor.</p>

<p><b>Não precisas de escrever igual ao professor.</b> Podes usar <code>if/else</code> em vez de
<code>case</code>, outros nomes de variáveis, outra ordem de cálculo, outra formulação matemática.
O que tem de coincidir é o resultado: as mesmas rodas, os mesmos estados, a mesma trajetória.</p>

<h4>O que o avaliador testa</h4>
<ul>
  <li><b>Casos unitários</b> — uma chamada à tua rotina numa situação concreta (robô longe do
  alvo, robô a chegar, robô parado, ângulos perto de ±π) e comparação dos sinais de saída.</li>
  <li><b>Casos de histerese</b> — cenários construídos de propósito para distinguir
  <code>TOL_FINDIST</code> de <code>DIST_NEWPOSE</code>. É aqui que caem as implementações que oscilam.</li>
  <li><b>Malha fechada</b> — o hub simula o robô durante centenas de ciclos de 40 ms usando as
  velocidades que o teu código pede, e compara a trajetória com a da solução. Testa se o robô
  <i>converge</i> e <i>pára</i> onde devia.</li>
</ul>

<h4>Regras do jogo</h4>
<ul>
  <li>Mantém a <b>assinatura</b> indicada em cada sub-tarefa — é por ela que o avaliador chama a rotina.</li>
  <li>As constantes (<code>VEL_LIN_NOM</code>, <code>TOL_FINDIST</code>, <code>L1nom</code>, …) e as rotinas
  das sub-tarefas anteriores já estão disponíveis: não as voltes a declarar.</li>
  <li>As variáveis <code>xodo</code>, <code>yodo</code>, <code>thodo</code>, <code>state_Lin</code> e
  <code>state_Rot</code> são globais, tal como no <code>control.pas</code> original.</li>
  <li>A solução do professor desbloqueia ao fim de <b>3 tentativas</b>. Antes disso tens dicas
  progressivas, cada vez mais específicas.</li>
</ul>

<div class="labctx"><b>Antes de começar, no SimTwo:</b> abre a cena
<code>RobotFactoryMecanum4Wheel</code>, carrega várias vezes em <b>ResetRob</b> até a pose estimada
nas células (21,12)–(23,13) estar correta, e lê o <code>procedure Control</code> (corre a cada 40 ms)
antes de escrever seja o que for. Depois, <b>GotoXY</b> escolhe o modo de trajetória e <b>Script</b> executa.</div>`,
        slideRef: "SAUT_LabWork_3_Goto_FLine_Omni (V8Oct24) + SimTwo_Manual_v3"
      },

      /* ------------------------------------------------ 1. MotorVel */
      code("motorvel",
        "Sub-tarefa 3.6.2 — cinemática inversa da mecanum",
        "Escreve o <code>MotorVel</code>: dadas as velocidades pedidas no referencial do robô (V para a frente, Vn lateral, W angular), calcula a velocidade de cada uma das quatro rodas.",
        `<p>O robô é omnidirecional com quatro rodas mecanum. Os rolos das rodas 0 e 3 estão a
+45° e os das 1 e 2 a −45°, segundo o esquema do <code>control.pas</code>:</p>
<pre class="pas">  _ _ _      vn     _ _ _
 |_\\_\\_| (2) ^     |_/_/_| (0)
    |        |  v     |
    |--------'--&gt;-----|
  __|__             __|__
 |_/_/_| (3)       |_\\_\\_| (1)</pre>
<p>Os argumentos V, Vn e W chegam <b>normalizados</b>: têm de ser multiplicados pelas velocidades
máximas guardadas na folha de cálculo — células <b>(14,6)</b>, <b>(15,6)</b> e <b>(16,6)</b>.
Um dos testes muda essas células, por isso não podes fixar valores no código.</p>
<p>O braço da rotação para esta geometria é <code>(L1nom + L2nom)/2</code>.</p>`),

      /* ------------------------------------------------ 2. odometria */
      code("odometria",
        "Sub-tarefa 3.6.3 — odometria do robô omnidirecional",
        "Escreve o <code>SimTwoFowardKinematics</code>: a partir dos impulsos dos quatro encoders, atualiza a pose odométrica <code>(xodo, yodo, thodo)</code>.",
        `<p>É o problema inverso do anterior. <code>GetAxisOdo</code> devolve os impulsos <b>acumulados
desde a última leitura</b> de cada motor, ou seja já são incrementos.</p>
<p>Três passos:</p>
<ol>
  <li><b>Impulsos → metros</b> por roda, usando o diâmetro nominal <code>Dnom</code>, a relação de
  transmissão <code>ngear</code> e a resolução <code>Ce</code>.</li>
  <li><b>Combinar as quatro rodas</b> em <code>delta_d</code> (avanço), <code>delta_dn</code>
  (lateral) e <code>delta_th</code> (rotação) — é a matriz de cinemática direta.</li>
  <li><b>Integrar a pose</b>. Se a rotação no ciclo for desprezável
  (<code>Abs(Deg(delta_th)) &lt; 0.01</code>) basta rodar o deslocamento por <code>thodo</code>.
  Caso contrário tens de usar a fórmula do arco, avaliada no ângulo médio
  <code>thodo + delta_th/2</code> — é isso que os testes de trajetória curva verificam.</li>
</ol>
<p>Os testes chamam a rotina várias vezes seguidas com os mesmos impulsos, para que os erros de
integração se acumulem e fiquem visíveis.</p>

<div class="labctx"><b>Convenção a fixar desde já.</b> Repara que tudo aqui são
<b>deslocamentos por ciclo</b> — <code>delta_d</code>, <code>delta_dn</code>,
<code>delta_th</code> — e não velocidades. É a notação que o professor usa de forma consistente
em toda a cadeia de odometria e de EKF (M4 e M5), e não é um detalhe de estilo: quando chegares
aos Jacobianos do filtro, eles derivam em ordem a estes deslocamentos. É isso que explica, por
exemplo, o <code>grad_f_U</code> da Lab 4 não ter nenhum <code>dt</code> na primeira coluna.
Nas outras sub-tarefas deste módulo já se fala de velocidades — mas aí é legítimo, porque
<code>MotorVel</code> e <code>gotoXY</code> são mesmo comandos de velocidade enviados aos motores,
não linearizações.</div>`),

      /* ------------------------------------------------ 3. quiz conceptual */
      {
        type: "quiz",
        title: "Antes do GotoXY: porquê duas máquinas de estados?",
        questions: [
          {
            kind: "mcq",
            q: "Num robô <b>omnidirecional</b>, porque é que o controlo linear e o angular podem ser duas máquinas de estados independentes?",
            options: [
              "Porque o robô só se move em linha reta e a rotação é feita à parte, no fim.",
              "Porque a velocidade linear e a angular são graus de liberdade desacoplados: o robô pode transladar em qualquer direção sem alterar a orientação.",
              "Porque o SimTwo obriga a separar o controlo de translação do de rotação.",
              "Porque as máquinas de estados só admitem uma variável de decisão cada."
            ],
            answer: 1,
            hint: "Pensa na diferença para o robô diferencial da Lab 2: lá, para ir para um ponto, tinhas de rodar primeiro.",
            explain: "Numa mecanum V, Vn e W são independentes. Por isso a máquina linear leva o robô ao ponto (projetando a velocidade no referencial do robô) enquanto a angular, em paralelo, acerta a orientação final."
          },
          {
            kind: "mcq",
            q: "Qual é o papel de <code>DIST_NEWPOSE</code> (0.05 m) ser <b>maior</b> que <code>TOL_FINDIST</code> (0.02 m)?",
            options: [
              "É apenas uma margem de segurança para o robô não bater no alvo.",
              "Serve para o robô desacelerar mais cedo.",
              "Cria histerese: o robô pára com erro < 0.02 m e só volta a arrancar se o erro passar de 0.05 m, evitando oscilação em torno do alvo.",
              "Não tem efeito prático; são valores equivalentes."
            ],
            answer: 2,
            hint: "O que aconteceria se as duas transições usassem o mesmo limiar?",
            explain: "Com um único limiar, qualquer ruído na odometria em torno da tolerância faz o robô entrar e sair de Stop_Lin em ciclos consecutivos — o robô 'treme'. A banda morta entre 0.02 e 0.05 m elimina isso. Há testes no avaliador desenhados só para apanhar esta falha."
          },
          {
            kind: "flash",
            front: "No GotoXY omni, porque é que V e Vn são <code>VEL_LIN_NOM*cos(ang_target − thodo)</code> e <code>VEL_LIN_NOM*sin(ang_target − thodo)</code>?",
            back: "<code>ang_target</code> é a direção do alvo no referencial do MUNDO. Subtraindo <code>thodo</code> obtém-se essa direção no referencial do ROBÔ; o cosseno dá a componente frontal (V) e o seno a lateral (Vn). O módulo da velocidade mantém-se VEL_LIN_NOM, só muda a repartição pelos dois eixos."
          }
        ]
      },

      /* ------------------------------------------------ 4. gotoXY */
      code("gotoxy",
        "Sub-tarefa 3.6.5 — <code>GotoXY</code> com duas máquinas de estados",
        "Escreve o <code>gotoXY</code>: leva o robô da pose odométrica atual até <code>(xf, yf, tf)</code>, com uma máquina de estados para o movimento linear e outra para a rotação.",
        `<p>Esta é a sub-tarefa central do ponto 1 do enunciado. Estrutura pedida pelo professor:</p>
<ol>
  <li><b>Erros</b>: direção do alvo (<code>ATan2</code>), distância ao alvo, e erro de orientação
  final passado por <code>NormalizeAngle</code>.</li>
  <li><b>Máquina linear</b> com os estados <code>Go_Forward</code> / <code>De_Accel_Lin</code> /
  <code>Stop_Lin</code>. Escreve as <b>transições</b> num <code>case</code> e as <b>saídas</b>
  (V e Vn) noutro — é o padrão que o professor usa e torna o código muito mais fácil de depurar.</li>
  <li><b>Máquina angular</b> com <code>Rotation</code> / <code>De_Accel_Rot</code> /
  <code>Stop_Rot</code>, decidida pelo <b>módulo</b> do erro angular, produzindo W.</li>
  <li>No fim, <code>MotorVel(V, Vn, W, RC)</code> — já disponível.</li>
</ol>
<p>Em desaceleração a velocidade é a nominal <b>a dividir por 3</b>. O sentido de rotação
(<code>rotateToFinal</code>) é <code>RotateRight</code> (+1) se o erro angular for positivo e
<code>RotateLeft</code> (−1) caso contrário.</p>
<p><b>Dois dos dez testes são de malha fechada</b>: simulam 400 ciclos de 40 ms e verificam se o
robô chega e fica parado na pose pedida.</p>`),

      /* ------------------------------------------------ 5. Dist2Line */
      code("dist2line",
        "Sub-tarefa 3.6.6 — distância do robô à reta",
        "Escreve o <code>Dist2Line</code>: devolve por referência a distância com sinal <code>kl</code> do robô à reta definida por <code>(xi,yi)→(xf,yf)</code> e as coordenadas <code>(pix, piy)</code> do ponto da reta mais próximo do robô.",
        `<p>É a peça que falta para o ponto 2 do enunciado. Duas saídas por referência:</p>
<ul>
  <li><code>kl</code> — distância <b>com sinal</b> (positiva de um lado da reta, negativa do outro).
  O sinal é o que permite ao controlador saber para que lado corrigir.</li>
  <li><code>(pix, piy)</code> — projeção ortogonal do robô sobre a reta.</li>
</ul>
<p>Sugestão: começa pelo versor da reta <code>(ux, uy)</code>. A distância com sinal sai de um
produto externo 2D; o ponto de interseção obtém-se deslocando o robô ao longo da normal.</p>
<p>O avaliador testa retas horizontais, verticais, oblíquas e o caso em que o robô já está
exatamente em cima da reta.</p>`),

      /* ------------------------------------------------ 6. FollowLine */
      code("followline",
        "Sub-tarefa 3.6.7 — <code>FollowLine</code>",
        "Escreve o <code>FollowLine</code>: o robô segue o segmento de <code>(xi,yi)</code> para <code>(xf,yf)</code>, parando no fim com a orientação <code>tf</code>.",
        `<p>O enunciado é explícito: parte da máquina de estados do <code>GotoXY</code> e
<b>muda apenas as equações de velocidade</b> nos estados <code>Go_Forward</code> e
<code>De_Accel_Lin</code>, tendo em conta a distância do robô à reta.</p>
<p>A ideia de controlo é somar dois vetores no referencial do <b>mundo</b>:</p>
<ul>
  <li>um <b>ao longo</b> da reta, na direção <code>alfa = ATan2(yf−yi, xf−xi)</code>, com módulo
  <code>VEL_LIN_NOM</code> (ou <code>/3</code> em desaceleração);</li>
  <li>um <b>para</b> a reta, proporcional ao erro <code>(nearX − xOdo, nearY − yOdo)</code>, que
  é o que traz o robô de volta ao caminho.</li>
</ul>
<p>Só depois é que projetas a soma no referencial do robô para obter V e Vn. Atenção: o
<code>error_dist</code> das transições continua a ser a distância ao <b>ponto final</b>, não à reta.</p>
<p>Podes usar o <code>Dist2Line</code> — a versão de referência está disponível mesmo que a tua
sub-tarefa anterior tenha ficado por acabar.</p>`),

      /* ------------------------------------------------ 7. Dist2Arc */
      code("dist2arc",
        "Sub-tarefa 3.6.8 — ponto mais próximo na circunferência",
        "Escreve o <code>Dist2Arc</code>: devolve por referência o ponto <code>(pix, piy)</code> da circunferência de centro <code>(xc,yc)</code> e raio <code>R</code> mais próximo do robô.",
        `<p>Versão circular do <code>Dist2Line</code>, e bastante mais simples: o ponto mais próximo
está sempre na semirreta que vai do centro até ao robô, à distância R do centro.</p>
<p>Funciona tanto com o robô <b>fora</b> como <b>dentro</b> da circunferência — e os testes
verificam os dois casos.</p>`),

      /* ------------------------------------------------ 8. FollowCircle */
      code("followcircle",
        "Sub-tarefa 3.6.9 — <code>FollowCircle</code>",
        "Escreve o <code>FollowCircle</code>: o robô percorre a circunferência de centro <code>(xc,yc)</code> e raio <code>R</code> no sentido direto, até ao ângulo <code>angf</code>, parando com orientação <code>tf</code>.",
        `<p>Ponto 3 do enunciado. Em relação ao <code>FollowLine</code> mudam duas coisas:</p>
<ol>
  <li><b>O erro de percurso deixa de ser uma distância em linha reta</b>: é o comprimento de arco
  que falta, <code>(beta − alfa)·R</code>, onde <code>alfa</code> é o ângulo do robô visto do centro
  e <code>beta</code> o do ponto final. Como o sentido é o direto (anti-horário), se
  <code>beta &lt; alfa</code> tens de somar <code>2π</code> — senão o erro fica negativo e o robô
  pára logo no primeiro ciclo. Há um teste dedicado a este salto de ±π.</li>
  <li><b>A direção de avanço é a tangente</b> à circunferência, ou seja o ângulo radial mais
  <code>π/2</code>.</li>
</ol>
<p>O termo corretor que puxa o robô para a trajetória usa o <code>(nearX, nearY)</code> devolvido
pelo <code>Dist2Arc</code>, exatamente como no <code>FollowLine</code>. O ponto final do arco é
<code>xf = xc + R·cos(angf)</code>, <code>yf = yc + R·sin(angf)</code>.</p>`),

      /* ------------------------------------------------ 9. GotoXY sem FSM */
      code("gotoxycont",
        "Sub-tarefa 3.6.10 — <code>GotoXY</code> sem máquina de estados",
        "Reescreve o <code>GotoXY</code> como um <b>único procedimento contínuo</b>: sem <code>case</code>, sem <code>state_Lin</code>/<code>state_Rot</code>, só leis proporcionais a correr em paralelo.",
        `<div class="labctx"><b>⚠️ Aviso.</b> Esta é a tarefa 4 do enunciado, para a qual o professor
<b>não distribuiu solução de referência</b>. A solução usada aqui como oráculo foi escrita para o
StudyHub — passar neste avaliador confirma que o teu controlador converge e pára, mas
<b>não garante</b> equivalência com o que o professor espera na avaliação.</div>
<p>A pergunta de fundo é: porque é que a FSM era precisa? Não era — era precisa <i>no diferencial</i>.
Num robô omni os três graus de liberdade (V, Vn, W) são independentes, portanto não há fases
obrigatórias a sequenciar. Podes controlar posição e orientação ao mesmo tempo.</p>
<p>A tradução de cada estado para a versão contínua:</p>
<table>
  <tr><th>Na FSM</th><th>Na versão contínua</th></tr>
  <tr><td><code>Go_Forward</code> (velocidade nominal)</td><td><b>saturação</b> em <code>VEL_LIN_NOM</code></td></tr>
  <tr><td><code>De_Accel_Lin</code> (nominal /3)</td><td>desaparece — a velocidade já é <b>proporcional ao erro</b>, logo desacelera sozinha</td></tr>
  <tr><td><code>Stop_Lin</code> + histerese <code>DIST_NEWPOSE</code></td><td><b>zona morta</b> abaixo de <code>TOL_FINDIST</code></td></tr>
</table>
<p>Repara no que se perde: a histerese. Na FSM, o par <code>TOL_FINDIST</code>/<code>DIST_NEWPOSE</code>
impedia o robô de voltar a arrancar por ruído de odometria. Aqui, qualquer erro acima da zona morta
faz o robô mexer-se outra vez. Em troca ganhas um controlador de dez linhas, sem estados para depurar.</p>
<p><b>Cuidado com o ganho.</b> O <code>Control</code> corre a cada 40 ms. Com <code>K_LIN·dt</code>
perto de 1, o robô salta por cima do alvo em cada ciclo e entra em oscilação. Os valores do
esqueleto (<code>K_LIN = 5</code>, <code>K_ANG = 3</code>) dão <code>K·dt = 0.2</code> e
<code>0.12</code> — bem dentro do seguro.</p>
<p>Não precisas do <code>rotateToFinal</code>: o <b>sinal</b> de <code>error_finalrot</code> já diz
para que lado rodar, e é o <code>NormalizeAngle</code> que garante o caminho mais curto.</p>`),

      /* ------------------------------------------------ 10. entrega */
      {
        type: "labtask",
        kind: "assemble",
        title: "O teu <code>control.pas</code> — tudo junto",
        context: `<p>Aqui está o código de todas as sub-tarefas, pela ordem em que as escreveste, pronto
para copiar de uma vez para o editor do SimTwo.</p>
<p>Testa-o no simulador a sério:
o avaliador do hub verifica a lógica, mas não substitui ver o robô a mexer-se (há atrito,
escorregamento das mecanum e saturação dos motores que a simulação simplificada aqui não tem).</p>
<p><b>Checklist antes de dar por concluída a labwork:</b></p>
<ul>
  <li>ResetRob repetido até a pose estimada bater certo com a real;</li>
  <li>GotoXY testado com alvos à frente, atrás e ao lado do robô;</li>
  <li>FollowLine com o robô a começar <b>fora</b> da reta, dos dois lados;</li>
  <li>FollowCircle a fechar mais de meia volta;</li>
  <li>comparar a pose odométrica com a verdadeira (<code>GetRobotX/Y/Theta</code>) no fim de cada
  percurso — é essa diferença que motiva o EKF do M4.</li>
</ul>`,
        q: "Copia e leva para o SimTwo."
      }
    ]
  };

  var mods = C["m3"].modules;
  var i = mods.findIndex(function (x) { return x.id === "m3-mod6"; });
  if (i >= 0) mods[i] = mod; else mods.push(mod);
})();
