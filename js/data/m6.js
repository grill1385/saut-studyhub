window.SAUT_CONTENT = window.SAUT_CONTENT || {};
window.SAUT_CONTENT["m6"] = { modules: [

/* ==================== MÓDULO 1 ==================== */
{
  id:"m6-mod1", title:"Localização probabilística e o filtro de partículas", minutes:40, kind:"study",
  blurb:"Porque é que uma gaussiana não chega, Bayes, grelha de Markov e o algoritmo MCL. Prob_Localization, págs. 2–13.",
  pages:[

  { type:"theory", title:"Porque é que o EKF não chega",
    html:`<p>O filtro que construíste no M4 e no M5 assume que a crença sobre a pose é uma <b>gaussiana</b>: um só pico, uma média, uma covariância. É uma aproximação excelente enquanto o robô sabe mais ou menos onde está.</p>
    <p>Falha em duas situações concretas:</p>
    <ul><li><b>Localização global</b> — o robô é ligado e não faz ideia de onde está. A crença correta é praticamente uniforme sobre o mapa todo, e uma gaussiana não representa isso.</li>
    <li><b>Kidnap</b> — alguém pega no robô e põe-no noutro sítio. A crença correta passa a ser "estou em A <i>ou</i> em C". Uma gaussiana tem <b>uma</b> média: não sabe dizer "ou".</li></ul>
    <p>A localização probabilística larga essa hipótese. Em vez de propagar dois números (média e covariância), calcula ou aproxima a <b>distribuição de probabilidade inteira</b> da localização em cada instante.</p>
    <p>Ingredientes (slide 2):</p>
    <ul><li>a distribuição inicial p(l) em t=0</li>
    <li>o modelo probabilístico de cada sensor</li>
    <li>os dados adquiridos por cada sensor</li>
    <li>o modelo probabilístico do movimento do robô</li>
    <li>um mapa do ambiente</li></ul>
    <div class="hl">Repara na expressão que o slide repete duas vezes: <i>"not necessarily linear and Gaussian"</i>. É a única diferença face a tudo o que fizeste até aqui — e é ela que justifica o capítulo todo.</div>`,
    figures:[{src:"assets/slides/problocal/page-02.png", caption:"Slide 2 — Os cinco ingredientes da localização probabilística",
      focus:"as duas ocorrências de 'not necessarily Linear and Gaussian' — nos modelos de sensor e de movimento"}],
    slideRef:"SAUT_Prob_Localization, pág. 2" },

  { type:"theory", title:"Bayes: a mesma predição-atualização, noutra linguagem",
    html:`<p>A pergunta é sempre a mesma: <i>qual é a probabilidade de o robô estar na posição l, dada a medida s?</i></p>
    <span class="formula">p(l|s) = p(s|l) · p(l) / p(s)</span>
    <ul><li><b>p(l)</b> — o <i>prior</i>: aquilo em que eu acreditava antes desta medida</li>
    <li><b>p(s|l)</b> — o <b>modelo do sensor</b>: se eu estivesse em l, que probabilidade teria de observar isto?</li>
    <li><b>p(l|s)</b> — o <i>posterior</i>: a crença atualizada</li>
    <li><b>p(s)</b> — normalização, para a distribuição somar 1</li></ul>
    <div class="hl">Isto <b>é</b> a fase de atualização do EKF. No EKF o prior é N(X̂⁻, P⁻) e a verosimilhança é N(h(X), R); como ambas são gaussianas, o posterior também é gaussiano e toda a fórmula colapsa no ganho K e na inovação. Foi por isso que nunca tiveste de escrever um integral.<br>Deixa cair a hipótese gaussiana e deixas de poder resumir a crença a dois números: passas a ter de <b>transportar a função toda</b>. É daí que nascem as grelhas e as partículas.</div>`,
    figures:[{src:"assets/slides/problocal/page-04.png", caption:"Slide 4 — p(l|s): a pergunta central",
      focus:"a leitura de cada termo da fórmula de Bayes — qual é o prior e qual é o modelo do sensor"}],
    slideRef:"SAUT_Prob_Localization, págs. 3–5" },

  { type:"theory", title:"Ação e perceção: quem faz o quê",
    html:`<p>O slide 6 divide o ciclo em duas fases, e a divisão é exatamente a que já conheces:</p>
    <ul><li><b>Ação / Predição</b> — usa sensores <b>propriocetivos</b> (encoders, giroscópios): medem movimento sem depender de nada externo ao robô.</li>
    <li><b>Perceção / Atualização</b> — usa sensores <b>exterocetivos</b> (sonar, bússolas, câmaras): medem posição, mas dependem de algo externo.</li></ul>
    <p>É a mesma arquitetura do M1 → M4: a odometria prediz e deriva, os sensores externos corrigem. Só muda a representação da crença.</p>
    <p><b>Localização de Markov em grelha</b> (slide 7): discretiza-se o mapa em células e cada célula guarda uma probabilidade. A predição é uma <i>convolução</i> da grelha com o modelo de movimento — espalha e desfoca. A atualização é uma multiplicação célula a célula pela verosimilhança do sensor — aperta.</p>
    <div class="hl">O custo é o problema: a grelha é em (x, y, θ), portanto tridimensional. Refinar a resolução para metade multiplica a memória por oito, e a maior parte dessas células tem probabilidade praticamente nula. É esse desperdício que motiva o filtro de partículas da página seguinte.</div>`,
    figures:[{src:"assets/slides/problocal/page-07.png", caption:"Slide 7 — Markov com mapa em grelha",
      focus:"a grelha de probabilidades a evoluir: onde ela espalha (predição) e onde ela aperta (atualização)"}],
    slideRef:"SAUT_Prob_Localization, págs. 6–8" },

  { type:"quiz", title:"Checkpoint — o que muda face ao EKF", questions:[
    { kind:"mcq", q:"Qual é a limitação da gaussiana do EKF que motiva a localização probabilística?",
      options:["É lenta a calcular","Tem uma só média, logo não representa 'estou em A ou em C'","Não funciona com sensores laser","Exige um mapa conhecido"], answer:1,
      hint:"Pensa no robô ligado num sítio desconhecido, ou no kidnap.",
      explain:"Uma gaussiana é unimodal. Localização global e kidnap exigem crenças multimodais — várias hipóteses em simultâneo — e isso uma gaussiana não sabe exprimir." },
    { kind:"mcq", q:"Na fase de Ação/Predição usam-se sensores:",
      options:["Exterocetivos (laser, câmara)","Propriocetivos (encoders, giroscópios)","Ambos em simultâneo","Nenhum — a predição é só o modelo"], answer:1,
      hint:"Quem é que mede movimento sem depender de nada fora do robô?",
      explain:"Propriocetivos. É a mesma divisão do M0: a odometria (propriocetiva) prediz, os sensores externos (exterocetivos) corrigem." },
    { kind:"mcq", q:"Porque é que a localização de Markov em grelha se torna cara?",
      options:["A convolução é numericamente instável","A grelha é em (x, y, θ) e quase todas as células têm probabilidade desprezável","Precisa de mais sensores","Não converge"], answer:1,
      hint:"Quantas dimensões tem a grelha, e quanto dela é útil?",
      explain:"É uma grelha 3D e gasta memória e cálculo em zonas onde a probabilidade é nula. As partículas resolvem isso concentrando-se onde a probabilidade está." },
    { kind:"flash", front:"Os cinco ingredientes da localização probabilística.",
      back:"Distribuição inicial p(l); modelo probabilístico de cada sensor; dados dos sensores; modelo probabilístico do movimento; mapa do ambiente." }
  ]},

  { type:"theory", title:"O filtro de partículas: amostras em vez de função",
    html:`<p>A ideia (slide 9): <b>a função densidade de probabilidade da pose é representada por um conjunto de partículas, e não por uma função.</b></p>
    <p>Cada partícula é uma <b>hipótese completa de pose</b> — um (x, y, θ) concreto — mais um peso. Mil partículas são mil candidatos a "onde o robô está". Onde elas se aglomeram, a probabilidade é alta; onde não há nenhuma, a probabilidade é zero.</p>
    <p>O slide sublinha três propriedades:</p>
    <ul><li>é um algoritmo <b>recursivo</b> baseado na regra de Bayes</li>
    <li>propaga as partículas na fase de ação e atualiza-as na fase de perceção</li>
    <li>a exatidão depende do <b>número de partículas</b> — com atenção ao peso computacional</li></ul>
    <div class="hl">A vantagem sobre a grelha é de alocação de recursos. A grelha gasta memória uniformemente, incluindo em regiões vazias. As partículas migram sozinhas para onde a probabilidade está: é uma discretização <i>adaptativa</i>, que se concentra onde interessa.</div>`,
    figures:[{src:"assets/slides/problocal/page-09.png", caption:"Slide 9 — Filtro de partículas: a definição",
      focus:"a frase 'represented by a set of particles and not a function' e a dependência do número de partículas"}],
    slideRef:"SAUT_Prob_Localization, pág. 9" },

  { type:"theory", title:"O algoritmo MCL linha a linha ★",
    html:`<p>O professor numera as linhas do algoritmo e depois refere-se a elas por número — vale a pena fixar a estrutura:</p>
    <ul><li><b>Linha 1</b> — recebe o conjunto anterior de partículas, os sinais de entrada para o modelo de movimento, as medidas dos sensores e o mapa.</li>
    <li><b>Linha 2</b> — o novo conjunto começa vazio.</li>
    <li><b>Linhas 3 a 7 — MOVIMENTO E INCORPORAÇÃO DE MEDIDAS</b>: cada partícula é movida para uma nova localização com o modelo de movimento e, depois, recebe uma probabilidade/peso para essa localização através do modelo dos sensores.</li>
    <li><b>Linhas 8 a 11 — RESAMPLING</b>: gerando M números aleatórios, as novas partículas são escolhidas proporcionalmente ao seu peso.</li></ul>
    <p>Compara com o ciclo do EKF: as linhas 3–7 são a predição e a atualização, feitas <i>por partícula</i> em vez de sobre uma média. As linhas 8–11 são o que <b>não tem equivalente</b> no EKF.</p>
    <div class="hl"><b>A armadilha:</b> o modelo de movimento aplicado a cada partícula tem de ser <b>ruidoso</b>. Se aplicares o modelo determinístico, todas as partículas se deslocam rigidamente em bloco, a nuvem nunca se espalha e o filtro fica incapaz de representar incerteza a crescer. O ruído por partícula é o análogo do Q do EKF — é ele que faz P crescer na predição.</div>`,
    figures:[{src:"assets/slides/problocal/page-10.png", caption:"Slide 10 — MCL, versão básica",
      focus:"a numeração das linhas 1 a 11 — é por estes números que o slide seguinte se refere aos blocos"},
      {src:"assets/slides/problocal/page-11.png", caption:"Slide 11 — O que faz cada bloco de linhas",
      focus:"a separação entre o bloco 3–7 (movimento + pesos) e o bloco 8–11 (resampling)"}],
    slideRef:"SAUT_Prob_Localization, págs. 10–11" },

  { type:"theory", title:"Da nuvem de partículas a uma pose",
    html:`<p>O filtro dá-te uma nuvem, mas o controlador quer um (x, y, θ). O slide 12 dá três formas de extrair a função densidade a partir das partículas:</p>
    <ul><li><b>(b)</b> assumir uma gaussiana e calcular a média e o desvio-padrão</li>
    <li><b>(c)</b> calcular um histograma</li>
    <li><b>(d)</b> usar um <i>kernel</i> gaussiano: cada partícula é o centro de uma gaussiana, e a escolha do desvio-padrão suaviza a curva resultante</li></ul>
    <div class="hl">Repara na ironia da opção (b): assumir uma gaussiana deita fora exatamente a multimodalidade que justificou usar partículas. Se o robô ainda tem três hipóteses, a média delas é um ponto onde o robô <b>de certeza não está</b>.<br>Usa (b) só depois de convergires; usa (c) ou (d) enquanto puder haver mais do que uma hipótese em jogo.</div>
    <p>O slide 13 mostra o efeito do número de partículas. Poucas e a distribuição fica grosseira e pode perder a hipótese certa; muitas e o custo dispara. É o parâmetro de afinação central do MCL, tal como Q e R eram os do EKF.</p>`,
    figures:[{src:"assets/slides/problocal/page-12.png", caption:"Slide 12 — Extrair a pdf das partículas",
      focus:"comparar (b), (c) e (d): repara em como só (c) e (d) conseguem mostrar mais do que um pico"},
      {src:"assets/slides/problocal/page-13.png", caption:"Slide 13 — Influência do número de partículas",
      focus:"como a distribuição estimada degrada quando o número de partículas desce"}],
    slideRef:"SAUT_Prob_Localization, págs. 12–13" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"O que representa UMA partícula no MCL?",
      options:["Uma medida do sensor","Uma hipótese completa de pose (x, y, θ) com um peso associado","Uma célula do mapa","Um beacon detetado"], answer:1,
      hint:"Se tens 1000 partículas, tens 1000 do quê?",
      explain:"Cada partícula é um candidato completo a pose. A distribuição é dada pela densidade das partículas no espaço, e o peso mede quão bem essa hipótese explica as medidas." },
    { kind:"mcq", q:"Nas linhas 3–7 do algoritmo, cada partícula é movida e depois recebe um peso. Esse peso vem de:",
      options:["Do modelo de movimento","Do modelo dos sensores — a probabilidade de observar as medidas a partir daquela pose","Do número de partículas","Da distância ao centro do mapa"], answer:1,
      hint:"O peso responde a: 'se o robô estivesse AQUI, faria sentido eu ter medido isto?'",
      explain:"O peso é a verosimilhança p(z|x) dada pelo modelo do sensor. O modelo de movimento faz a outra metade: move a partícula." },
    { kind:"mcq", q:"Se aplicares o modelo de movimento SEM ruído a cada partícula, o que acontece?",
      options:["O filtro converge mais depressa","A nuvem desloca-se rigidamente e nunca se espalha, deixando de representar incerteza crescente","Os pesos ficam todos iguais a zero","Nada — o ruído é opcional"], answer:1,
      hint:"O que é que no EKF fazia o P crescer na predição?",
      explain:"O ruído por partícula é o análogo do Q. Sem ele a nuvem não dispersa, e o filtro perde a capacidade de exprimir que a odometria está a acumular erro." },
    { kind:"flash", front:"MCL: o que fazem os blocos de linhas 3–7 e 8–11?",
      back:"3–7: movimento de cada partícula pelo modelo de movimento (ruidoso) + atribuição de peso pelo modelo do sensor. 8–11: resampling — M números aleatórios escolhem as novas partículas proporcionalmente ao peso." }
  ]}

  ]
},

/* ==================== MÓDULO 2 ==================== */
{
  id:"m6-mod2", title:"Resampling, recuperação de falhas e kidnap", minutes:35, kind:"study",
  blurb:"O efeito perverso do resampling, low variance sampling, partículas aleatórias e filtro rápido/lento. Prob_Localization, págs. 14–21.",
  pages:[

  { type:"theory", title:"O resampling tem um efeito perverso",
    html:`<p>O slide 14 aponta um problema que não é óbvio: <i>"the resampling made by the previous way gives rise that a stopped robot without sensors have increasingly sure of its localization, i.e. the particles tend to concentrate"</i>.</p>
    <p>Porquê? O resampling é <b>amostragem com reposição</b>. Mesmo com todos os pesos iguais, por puro acaso algumas partículas são escolhidas duas vezes e outras nenhuma. Repete o processo mil vezes e a diversidade só pode descer — é um caminho sem retorno. Chama-se <i>particle depletion</i>.</p>
    <div class="hl">O sintoma é alarmante: o robô está <b>parado</b>, não recebe informação nenhuma, e mesmo assim a nuvem aperta — ou seja, ele fica cada vez <b>mais confiante</b>. Informação a aparecer do nada é sinal de que o estimador está errado. Compara com o EKF: lá, um robô parado sem medidas vê o P crescer (Q soma-se sempre), que é o comportamento honesto.</div>
    <p>Duas soluções, ambas no slide:</p>
    <ul><li>deixar de fazer resampling e de integrar medidas <b>quando o robô está parado</b>; e, quando anda, usar um método de resampling baseado na <b>variância dos pesos</b> das partículas</li>
    <li>usar <b>low variance sampling</b></li></ul>`,
    figures:[{src:"assets/slides/problocal/page-14.png", caption:"Slide 14 — Problemas associados ao resampling",
      focus:"a frase sobre o robô parado ficar cada vez mais certo da sua localização"}],
    slideRef:"SAUT_Prob_Localization, pág. 14" },

  { type:"theory", title:"Low variance resampling",
    html:`<p>O mecanismo (slide 15): alinham-se as partículas numa régua, cada uma ocupando uma largura proporcional ao seu peso. Escolhe-se <b>um único ponto aleatório</b> de partida e percorre-se a régua com um <b>passo constante de 1/M</b>, selecionando a partícula correspondente a cada passo.</p>
    <p>As duas vantagens que o slide lista:</p>
    <ul><li>percorre todo o espaço das partículas de forma mais <b>sistemática</b></li>
    <li><b>se todas as partículas tiverem o mesmo peso, o conjunto resultante é o mesmo</b></li></ul>
    <div class="hl">A segunda propriedade é a que interessa: mata diretamente o efeito perverso da página anterior. Pesos iguais significam "não aprendi nada de novo", e o algoritmo responde não mudando nada. Sem informação, sem alteração da crença.<br>Como bónus, gasta <b>um</b> número aleatório em vez de M.</div>`,
    figures:[{src:"assets/slides/problocal/page-15.png", caption:"Slide 15 — Low variance resampling",
      focus:"a régua com larguras proporcionais aos pesos e o passo constante 1/M a partir de um único ponto aleatório"}],
    slideRef:"SAUT_Prob_Localization, pág. 15" },

  { type:"quiz", title:"Checkpoint — resampling", questions:[
    { kind:"mcq", q:"Porque é que um robô PARADO, com o resampling básico, fica cada vez mais 'certo' da sua localização?",
      options:["Porque os sensores acumulam medidas","Porque a amostragem com reposição destrói diversidade a cada ciclo, mesmo com pesos iguais","Porque o modelo de movimento tem erro zero","Porque o mapa é conhecido"], answer:1,
      hint:"O que acontece à variedade de partículas se sorteares com reposição muitas vezes seguidas?",
      explain:"É particle depletion: a cada sorteio algumas partículas duplicam e outras desaparecem. A diversidade só desce, e a nuvem aperta sem que tenha entrado informação nova." },
    { kind:"mcq", q:"Qual é a propriedade do low variance resampling que resolve esse problema?",
      options:["Usa mais partículas","Com pesos todos iguais, devolve exatamente o mesmo conjunto","Elimina as partículas de peso baixo","Duplica as partículas de peso alto"], answer:1,
      hint:"O que deve acontecer à crença quando não há informação nova?",
      explain:"Sem informação nova (pesos iguais) o conjunto não muda. A crença só se altera quando há motivo para isso." },
    { kind:"flash", front:"Low variance resampling: como funciona e quantos números aleatórios gasta?",
      back:"Partículas alinhadas com largura proporcional ao peso; um único ponto aleatório de partida; passo constante de 1/M ao longo da régua. Gasta 1 número aleatório, não M." }
  ]},

  { type:"theory", title:"O exemplo unidimensional das portas",
    html:`<p>O slide 16 é a melhor imagem mental do capítulo. Um corredor com portas, e o robô só sabe distinguir "porta" de "parede":</p>
    <ul><li><b>a)</b> partículas distribuídas aleatoriamente — não se sabe nada</li>
    <li><b>b)</b> observa uma porta: as partículas junto das portas ficam sobrevalorizadas pelo modelo do sensor</li>
    <li><b>c)</b> nova distribuição de partículas e aplicação do modelo de movimento — ficam <b>três zonas</b> de maior densidade</li>
    <li><b>d)</b> observa outra porta: nova sobrevalorização</li>
    <li><b>e)</b> aplicado o movimento, a zona de maior densidade coincide agora com a localização real do robô</li></ul>
    <div class="hl">O que aqui interessa é o passo (c). Depois da <b>primeira</b> porta o robô continua sem saber onde está — há três portas e a crença é legitimamente <b>trimodal</b>. Um EKF não conseguiria sequer representar este estado intermédio: teria de escolher uma das três, ou pôr a média algures entre elas, num sítio onde o robô não está.<br>É a combinação da segunda observação <i>com o movimento entre as duas</i> que desfaz a ambiguidade.</div>`,
    figures:[{src:"assets/slides/problocal/page-16.png", caption:"Slide 16 — Exemplo unidimensional: as portas",
      focus:"o passo (c): as três zonas de densidade elevada — a crença multimodal que uma gaussiana não sabe exprimir"}],
    slideRef:"SAUT_Prob_Localization, pág. 16" },

  { type:"theory", title:"Recuperação de falhas e o problema do kidnap ★",
    html:`<p>O slide 17 é direto: <i>na forma apresentada, o filtro de partículas <b>não recupera</b> de um kidnap nem de uma má estimativa inicial</i>, porque ao fim de algum tempo todas as partículas estão numa só zona, junto da posição real anterior.</p>
    <p>A razão é estrutural: o resampling <b>só escolhe de entre o que já existe</b>. Se não há nenhuma partícula na zona nova, nenhum sorteio a pode criar. A probabilidade nessa zona é exatamente zero e fica zero para sempre.</p>
    <p>A solução: <b>colocar sempre algumas partículas aleatoriamente</b> ao longo do espaço de navegação. Ficam duas perguntas — quantas, e como distribuí-las.</p>
    <p>Um número fixo funciona, mas o slide diz que dá melhores resultados <b>variar esse número</b> em função da probabilidade média das medidas atuais, que pode ser aproximada pela <b>média dos pesos das partículas</b>:</p>
    <span class="formula">peso médio baixo ⇒ o robô pode estar perdido ⇒ lançar mais partículas aleatórias</span>
    <p>E há um refinamento importante: por causa do ruído do sensor ou de uma grande dispersão das partículas, esse valor deve ser filtrado com <b>um filtro rápido e outro lento</b>, atuando em função dos dois resultados.</p>
    <div class="hl"><b>A lógica do rápido vs lento:</b> o filtro lento é a tua linha de base — "como as coisas costumam estar". O rápido segue o que se passa agora. Quando o rápido cai muito abaixo do lento, alguma coisa mudou <i>agora</i> e vale a pena injetar partículas. Comparas duas escalas de tempo em vez de um limiar fixo, e assim o critério adapta-se sozinho a ambientes com mais ou menos ruído.</div>
    <p class="exam">Esta é a pergunta de exame deste milestone: o filtro de partículas resolve o kidnap, mas <b>só</b> com injeção de partículas aleatórias. Sem isso não recupera.</p>`,
    figures:[{src:"assets/slides/problocal/page-17.png", caption:"Slide 17 — Recuperação de falhas",
      focus:"a justificação de por que razão o filtro básico não recupera, e o critério baseado no peso médio"},
      {src:"assets/slides/problocal/page-18.png", caption:"Slide 18 — Recuperação de falhas, ilustração",
      focus:"as partículas a reaparecerem espalhadas pelo mapa depois da falha"}],
    slideRef:"SAUT_Prob_Localization, págs. 17–19" },

  { type:"theory", title:"Um sensor bom demais, e o mundo a mexer-se",
    html:`<p><b>Sensor quase perfeito</b> (slide 20). Se o modelo probabilístico do sensor for muito próximo do determinístico, o filtro <b>pode não funcionar</b>: ao mínimo desvio da estimativa, quase todas as partículas ficam com peso zero.</p>
    <p>É contraintuitivo — um sensor melhor estraga o filtro. Mas faz sentido: se o modelo diz "a esta pose corresponde exatamente esta medida", qualquer partícula que não esteja em cima da pose verdadeira é declarada impossível, e a nuvem inteira colapsa.</p>
    <p>Duas soluções do slide:</p>
    <ul><li><b>aumentar artificialmente o ruído</b> do modelo do sensor, incluindo nele outras fontes de erro</li>
    <li>colocar parte das partículas numa localização <b>derivada do modelo de observações</b> — ou seja, em sítios onde as observações encaixam no mapa</li></ul>
    <p><b>Ambientes dinâmicos</b> (slide 21). Com muitas pessoas à volta do robô, há dificuldades adicionais. Duas vias:</p>
    <ul><li>estimar também a posição e velocidade das pessoas e obstáculos imprevistos — difícil, porque aumenta muito a dimensão do estado, que passa a ser variante no tempo</li>
    <li>fazer um <b>pré-processamento</b> das medidas, eliminando as que resultam de objetos não presentes no mapa (<i>outliers</i>)</li></ul>
    <div class="hl">Esta segunda via é exatamente o módulo de validação do <b>M5</b>. Volta a ver o <code>#M5.2</code>: é lá que está a assimetria de exame — rejeitar as medidas anormalmente <b>curtas</b> (algo fora do mapa) mas <b>não</b> as anormalmente longas, porque estas ajudam a recuperar da falha de localização. Os dois capítulos são a mesma discussão vista de lados opostos.</div>`,
    figures:[{src:"assets/slides/problocal/page-20.png", caption:"Slide 20 — Melhorias adicionais",
      focus:"a explicação de por que razão um sensor demasiado exato leva quase todas as partículas a peso zero"}],
    slideRef:"SAUT_Prob_Localization, págs. 20–21" },

  { type:"quiz", title:"Avaliação final do módulo (formato exame)", questions:[
    { kind:"mcq", q:"[Exame] Porque é que o filtro de partículas na forma básica NÃO recupera de um kidnap?",
      options:["Porque perde o mapa","Porque o resampling só escolhe de entre partículas que já existem, e na zona nova não há nenhuma","Porque os encoders saturam","Porque o número de partículas é fixo"], answer:1,
      hint:"O resampling cria partículas novas ou só redistribui as que há?",
      explain:"O resampling reamostra o conjunto existente. Se a probabilidade numa região é zero, mantém-se zero para sempre. Daí a necessidade de injetar partículas aleatórias." },
    { kind:"mcq", q:"Que indicador se usa para decidir QUANTAS partículas aleatórias injetar?",
      options:["O número de ciclos desde o arranque","A média dos pesos das partículas, filtrada por um filtro rápido e um lento","A distância percorrida","A variância do mapa"], answer:1,
      hint:"O que é que fica baixo quando nenhuma hipótese explica bem as medidas?",
      explain:"A média dos pesos aproxima a probabilidade média das medidas atuais. Baixa = o robô pode estar perdido. Compara-se um filtro rápido com um lento para distinguir uma queda real de ruído." },
    { kind:"mcq", q:"Um sensor com modelo quase determinístico (muito exato) pode partir o filtro de partículas porque:",
      options:["Consome demasiada CPU","Ao mínimo desvio quase todas as partículas ficam com peso zero","Não fornece ângulo","Obriga a mais resampling"], answer:1,
      hint:"O que acontece ao peso de uma partícula que não está exatamente na pose certa?",
      explain:"Um modelo demasiado apertado declara impossível tudo o que não coincide. A solução é aumentar artificialmente o ruído do modelo, incluindo nele outras fontes de erro." },
    { kind:"flash", front:"Kidnap: EKF vs filtro de partículas — quem recupera e porquê?",
      back:"O EKF não recupera: a crença é unimodal e o ganho puxa sempre em torno de uma só média. O filtro de partículas recupera, MAS só se injetar partículas aleatórias — o resampling sozinho nunca cria hipóteses novas." }
  ]}

  ]
},

/* ==================== MÓDULO 3 ==================== */
{
  id:"m6-mod3", title:"Map matching: o algoritmo Perfect Match", minutes:35, kind:"study",
  blurb:"Localização absoluta sem beacons: função de custo, robustez a outliers, RPROP e matrizes pré-calculadas. Map_Matching, págs. 2–11.",
  pages:[

  { type:"theory", title:"Localização absoluta sem beacons",
    html:`<p>Até aqui, toda a localização absoluta que viste precisava de <b>beacons</b> — marcos artificiais colocados de propósito em posições conhecidas (M4 e M5). Isso é infraestrutura: alguém tem de os instalar e medir.</p>
    <p>O <b>map matching</b> dispensa-os. Usa o mapa que já existe — paredes, linhas pintadas no chão — e faz outra pergunta: <i>qual é a pose que faz as minhas medidas encaixarem melhor no mapa?</i></p>
    <p>O slide 3 dá dois exemplos de medidas de distância:</p>
    <ul><li><b>laser range finder</b> — distância às paredes</li>
    <li><b>distância a linhas obtidas por processamento de imagem</b></li></ul>
    <div class="hl">O segundo caso é o dos <b>landmarks lineares</b> que aparecem no mapa de exame: no futebol robótico o "mapa" são as linhas pintadas do campo, e a câmara do robô deteta pontos sobre essas linhas. Não há um beacon único e identificável — há uma nuvem de pontos que tem de encaixar num desenho conhecido.</div>`,
    figures:[{src:"assets/slides/mapmatch/page-03.png", caption:"Slide 3 — Exemplos de medidas de distância",
      focus:"os dois casos: laser contra paredes, e pontos de linhas obtidos por imagem — os landmarks lineares"}],
    slideRef:"SAUT_Loc_Map_Matching, págs. 2–3" },

  { type:"theory", title:"As medidas no referencial global",
    html:`<p>Cada medida tem coordenadas <b>s<sub>i</sub></b> no referencial do robô. Para as passar ao referencial global, com a pose <b>p</b> e a orientação φ:</p>
    <span class="formula">p + [ cos φ &nbsp; −sin φ ; &nbsp; sin φ &nbsp; cos φ ] · s<sub>i</sub></span>
    <p>Não há nada de novo aqui: é a mesma rotação que usaste na alínea (b) da Lab 5 para converter cada raio do laser em coordenadas do mundo, incluindo o cuidado com o offset do sensor.</p>
    <div class="hl">O que muda é o passo seguinte. Na Lab 5, depois de converter, procuravas <b>um beacon</b> e validavas essa medida. Aqui não vais procurar nada: vais atirar <b>todos</b> os pontos ao mapa de uma vez e medir o desencaixe global.</div>`,
    figures:[{src:"assets/slides/mapmatch/page-04.png", caption:"Slide 4 — Coordenadas das medidas",
      focus:"a matriz de rotação e a soma da posição p — a transformação robô→global"}],
    slideRef:"SAUT_Loc_Map_Matching, pág. 4" },

  { type:"theory", title:"A função de custo ★",
    html:`<p>Se a estimativa de pose estiver errada, cada ponto transformado cai a uma certa distância <b>d</b> da característica mais próxima do mapa. Somando o quadrado dessa distância para todos os n pontos medidos, obtém-se a função de custo a minimizar:</p>
    <span class="formula">E = Σ<sub>i=1..n</sub> ( d ( p + R(φ) · s<sub>i</sub> ) )²</span>
    <p>A localização passa a ser um <b>problema de otimização</b>: encontrar (p, φ) que minimiza E.</p>
    <div class="hl"><b>A diferença de fundo face ao EKF.</b> O EKF corrige a pose com uma fórmula fechada — o ganho — a partir de meia dúzia de medidas de beacons já validadas e <i>associadas</i>: ele precisa de saber qual beacon é qual.<br>O map matching não tem passo de associação nenhum. A distância é ao mapa <b>como um todo</b>, portanto a pergunta "que beacon é este ponto?" nunca se põe. Em troca, deixa de haver solução fechada: é preciso <b>procurar</b> o mínimo.</div>`,
    figures:[{src:"assets/slides/mapmatch/page-05.png", caption:"Slide 5 — Situação com estimativa de pose incorreta",
      focus:"os pontos medidos deslocados face ao mapa, e a distância de erro de cada um até à característica mais próxima"}],
    slideRef:"SAUT_Loc_Map_Matching, pág. 5" },

  { type:"theory", title:"Limitar o peso dos outliers",
    html:`<p>O slide 6 avisa: o erro quadrático (ou o valor absoluto) é o habitual, mas <b>não é o mais apropriado quando há outliers</b>. Um único ponto a 2 m do mapa contribui com 4 para o custo e domina uma centena de pontos bons.</p>
    <p>Uma forma de limitar o peso máximo de cada ponto:</p>
    <span class="formula">err = 1 − c² / ( c² + d² )</span>
    <p>Lê a função pelos extremos: com d=0 dá 0; com d a crescer tende para 1 e <b>satura</b>. O parâmetro c define o joelho da curva — a partir de que distância um ponto deixa de contar mais por estar mais longe.</p>
    <div class="hl">Compara com o que fizeste no M5. Ali, a validação era <b>binária</b>: a medida passava no teste do χ² ou era rejeitada. Aqui todos os pontos entram, mas nenhum pode gritar mais alto do que um certo limite.<br>É a mesma preocupação — não deixar um outlier arrastar a estimativa — resolvida com um peso contínuo em vez de uma decisão. Menos sensível ao valor exato do parâmetro, e sem o risco de deitar fora uma medida boa.</div>`,
    figures:[{src:"assets/slides/mapmatch/page-06.png", caption:"Slide 6 — Função de custo robusta a outliers",
      focus:"o gráfico comparativo: a tracejado o erro quadrático a crescer sem limite, a cheio a função saturada"}],
    slideRef:"SAUT_Loc_Map_Matching, pág. 6" },

  { type:"quiz", title:"Checkpoint — a função de custo", questions:[
    { kind:"mcq", q:"[P14 exame] O que é que o Perfect Match minimiza?",
      options:["A distância ao beacon mais próximo","A soma das distâncias (ao quadrado) de cada ponto medido à característica mais próxima do mapa","O erro de odometria acumulado","O número de partículas"], answer:1,
      hint:"Quantos pontos entram na conta, e distância a quê?",
      explain:"Todos os pontos medidos entram, e a distância é ao mapa como um todo. A pose estimada é a que faz a nuvem de pontos encaixar melhor no mapa." },
    { kind:"mcq", q:"Qual é a vantagem do map matching sobre o EKF com beacons?",
      options:["É mais preciso em todas as situações","Dispensa infraestrutura (beacons) e não precisa de associação de dados — usa o mapa que já existe","Não precisa de odometria","Não tem parâmetros a afinar"], answer:1,
      hint:"O que é que tens de instalar e medir para usar beacons?",
      explain:"Usa características que já existem (paredes, linhas) e nunca pergunta 'que marco é este', porque a distância é ao mapa inteiro. Em troca perde a solução fechada e tem de procurar o mínimo." },
    { kind:"input", q:"Na função err = 1 − c²/(c² + d²), quanto vale o erro de um ponto com d = 0? (número)",
      answer:0, tolerance:0.001,
      hint:"Substitui d=0: c²/(c²+0) = 1.",
      explain:"err = 1 − 1 = 0. Um ponto que cai exatamente em cima do mapa não contribui para o custo, como seria de esperar." },
    { kind:"flash", front:"Porque é que o erro quadrático puro é má ideia com outliers?",
      back:"Cresce sem limite: um ponto a 2 m contribui 4, dominando dezenas de pontos bons. A função 1 − c²/(c²+d²) satura em 1, limitando o peso máximo de cada ponto." }
  ]},

  { type:"theory", title:"RPROP: descer sem escolher um passo",
    html:`<p>A minimização é feita por <b>Resilient Propagation (RPROP)</b>. A característica distintiva: usa apenas o <b>sinal</b> do gradiente, nunca a sua magnitude.</p>
    <p>Cada parâmetro tem o seu próprio passo Δ, atualizado assim:</p>
    <ul><li>se o sinal de ∂E/∂ω se <b>manteve</b> face à iteração anterior (produto &gt; 0) → estás a descer bem → <b>aumenta</b> o passo (Δ · η⁺, limitado a Δ<sub>max</sub>)</li>
    <li>se o sinal <b>mudou</b> (produto &lt; 0) → passaste por cima do mínimo → <b>reduz</b> o passo (Δ · η⁻, limitado a Δ<sub>min</sub>)</li>
    <li>depois desloca-se ω contra o sinal do gradiente, exatamente Δ</li></ul>
    <div class="hl">Porque é que isto é a escolha certa <i>aqui</i>: o custo é construído a partir de uma matriz de distâncias pré-calculada e discretizada, portanto as <b>magnitudes</b> dos gradientes são mal escaladas e pouco fiáveis — mas o <b>sinal</b> aguenta-se. Além disso não há taxa de aprendizagem para afinar: cada parâmetro descobre o seu passo sozinho.</div>`,
    figures:[{src:"assets/slides/mapmatch/page-07.png", caption:"Slide 7 — O algoritmo RPROP",
      focus:"as duas condições sobre o produto dos gradientes consecutivos — sinal mantido aumenta o passo, sinal trocado reduz"}],
    slideRef:"SAUT_Loc_Map_Matching, págs. 7–8" },

  { type:"theory", title:"O truque da velocidade: pré-calcular tudo",
    html:`<p>O slide 9 di-lo sem rodeios: <i>"the pre-processing of the distances and gradients matrices leads to a very fast algorithm!"</i></p>
    <p><b>Matriz de distâncias.</b> Para cada célula do mapa, calcula-se <b>uma vez</b>, offline, a distância à característica mais próxima. Em execução, avaliar d() para um ponto medido deixa de ser uma pesquisa sobre o mapa e passa a ser uma <b>consulta a uma tabela</b> — tempo constante por ponto, independentemente do tamanho do mapa.</p>
    <p><b>Matrizes de gradientes.</b> Pré-calculam-se também as derivadas da distância, com operadores de Sobel:</p>
    <span class="formula">grad x: [ −1 0 +1 ; −2 0 +2 ; −1 0 +1 ] &nbsp;&nbsp; grad y: [ −1 −2 −1 ; 0 0 0 ; +1 +2 +1 ]</span>
    <p>Na forma genérica [ lo mo ro ; lm p rm ; lu mu ru ]:</p>
    <span class="formula">gradient.x = ( −lo + ro − 2lm + 2rm − lu + ru ) / 8<br>gradient.y = ( −lo + lu − 2mo + 2mu − ro + ru ) / 8</span>
    <p>Assim o RPROP também obtém o seu gradiente por consulta, e não por diferenciação numérica em execução.</p>
    <div class="hl">É este o motivo dos <b>menos de 4 ms</b> que aparecem nos resultados. O preço: memória para as três matrizes e um passo de pré-processamento — e a exigência de o mapa ser <b>estático</b>. Se o mapa mudar, tudo isto tem de ser recalculado.</div>`,
    figures:[{src:"assets/slides/mapmatch/page-09.png", caption:"Slide 9 — Matriz de distâncias pré-calculada",
      focus:"o mapa transformado num campo de distâncias: cada célula guarda a distância à característica mais próxima"},
      {src:"assets/slides/mapmatch/page-11.png", caption:"Slide 11 — Gradientes em x e em y num campo de futebol robótico",
      focus:"como os gradientes apontam para as linhas do campo — é esta a informação que guia o RPROP"}],
    slideRef:"SAUT_Loc_Map_Matching, págs. 9–11" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"O RPROP usa do gradiente:",
      options:["A magnitude, para escalar o passo","Apenas o sinal — o passo é adaptado consoante o sinal se mantém ou troca","A segunda derivada","O valor absoluto médio"], answer:1,
      hint:"O que acontece ao passo quando o sinal do gradiente troca entre iterações?",
      explain:"Só o sinal. Sinal mantido = a descer bem = aumenta o passo; sinal trocado = passaste do mínimo = reduz. As magnitudes vindas de uma matriz discretizada não seriam fiáveis." },
    { kind:"mcq", q:"Porque é que o Perfect Match consegue correr em menos de 4 ms?",
      options:["Usa poucos pontos medidos","As matrizes de distâncias e de gradientes são pré-calculadas: avaliar o custo é consultar tabelas","Corre em GPU","Aproxima o mapa por retas"], answer:1,
      hint:"O que é que foi feito offline, antes do robô andar?",
      explain:"O trabalho pesado foi feito uma vez, offline. Em execução, d() e os gradientes são consultas em tempo constante. O preço é memória e a exigência de o mapa ser estático." },
    { kind:"mcq", q:"Que operador se usa para pré-calcular as matrizes de gradientes?",
      options:["Laplaciano","Sobel","Transformada de Hough","Filtro de mediana"], answer:1,
      hint:"As máscaras [−1 0 +1; −2 0 +2; −1 0 +1] são conhecidas do processamento de imagem.",
      explain:"São as máscaras de Sobel para as derivadas em x e y, aplicadas à matriz de distâncias e divididas por 8." },
    { kind:"flash", front:"Perfect Match: as três matrizes pré-calculadas e o que cada uma dá.",
      back:"Matriz de distâncias (d de cada célula à característica mais próxima do mapa) + gradiente em x + gradiente em y (Sobel/8). Em execução tudo se resolve por consulta, daí os <4 ms." }
  ]}

  ]
},

/* ==================== MÓDULO 4 ==================== */
{
  id:"m6-mod4", title:"Mau condicionamento, fusão com odometria e localização global", minutes:35, kind:"study",
  blurb:"Corredores sem informação, a 2.ª derivada como variância, fusão à Kalman e recuperação por múltiplas hipóteses. Map_Matching, págs. 12–25.",
  pages:[

  { type:"theory", title:"Quando a função de custo não chega",
    html:`<p>Minimizar o custo dá sempre um resultado — mas nem sempre um resultado <b>informativo</b>. O slide 12 identifica duas situações:</p>
    <ul><li>a função de custo é <b>muito plana</b>, por exemplo por haver muito poucos pontos medidos: não há informação relevante sobre <b>nenhum</b> dos parâmetros</li>
    <li>a função de custo tem a forma de um <b>vale</b> segundo uma direção, com duas encostas na direção perpendicular: só se consegue extrair informação sobre o ângulo e sobre a coordenada <b>perpendicular ao vale</b></li></ul>
    <div class="hl">O caso do vale tem um exemplo físico imediato: um robô a meio de um <b>corredor reto e comprido</b>. Deslizar ao longo do corredor quase não altera o encaixe das medidas nas paredes — o custo é plano nessa direção. O robô sabe a que distância está de cada parede e sabe a sua orientação, mas <b>não sabe onde está ao longo do corredor</b>.<br>E o ponto essencial: a estimativa não está "errada" — aquela componente é <b>não observável</b> com os dados disponíveis. Nenhum algoritmo melhor a recuperaria.</div>
    <p>O slide fecha com a chave: <b>a segunda derivada da função de custo dá-nos essa informação.</b></p>`,
    figures:[{src:"assets/slides/mapmatch/page-12.png", caption:"Slide 12 — Função de custo mal condicionada",
      focus:"as duas superfícies: a plana (nenhuma informação) e a em vale (informação só na direção perpendicular)"}],
    slideRef:"SAUT_Loc_Map_Matching, pág. 12" },

  { type:"theory", title:"Da segunda derivada à variância",
    html:`<p>A heurística que relaciona a variância da estimativa global com a segunda derivada do custo:</p>
    <span class="formula">σ²<sub>px</sub> = K<sub>x</sub> / (∂²E/∂p<sub>x</sub>²) &nbsp;&nbsp; σ²<sub>py</sub> = K<sub>y</sub> / (∂²E/∂p<sub>y</sub>²) &nbsp;&nbsp; σ²<sub>φ</sub> = K<sub>φ</sub> / (∂²E/∂φ²)</span>
    <p>Lê-a pelos extremos:</p>
    <ul><li>segunda derivada <b>grande</b> = vale apertado = o custo pune-te muito por te afastares = a estimativa é fiável = <b>variância pequena</b></li>
    <li>segunda derivada <b>pequena</b> = superfície plana = podias estar em qualquer lado ali à volta = <b>variância enorme</b></li></ul>
    <div class="hl">É isto que transforma uma estimativa <i>pontual</i> em algo <b>fundível</b>. Sem variância não há como pesar duas fontes — é a mesma lição do exemplo Lego no <code>#M4.6</code>: cada fonte tem de entregar pose <b>e</b> incerteza, senão o bloco de fusão não tem com que trabalhar.<br>E repara na elegância: no corredor, a variância ao longo do corredor sai automaticamente enorme, e a fusão vai então confiar na odometria nessa direção — que é exatamente o que se deve fazer.</div>`,
    figures:[{src:"assets/slides/mapmatch/page-13.png", caption:"Slide 13 — Heurística da variância a partir da 2.ª derivada",
      focus:"as três expressões e a hipótese sobre a variância da odometria"}],
    slideRef:"SAUT_Loc_Map_Matching, pág. 13" },

  { type:"theory", title:"Fusão com a odometria",
    html:`<p>Uma forma simplificada de fundir a estimativa global com a odometria é uma <b>média ponderada pelas respetivas variâncias</b> (slide 14):</p>
    <span class="formula">r<sub>x</sub> = ( σ²<sub>px</sub>·r̂<sub>x</sub> + σ²<sub>r̂x</sub>·p<sub>x</sub> ) / ( σ²<sub>px</sub> + σ²<sub>r̂x</sub> )</span>
    <span class="formula">σ²<sub>rx</sub> = ( σ²<sub>px</sub> · σ²<sub>r̂x</sub> ) / ( σ²<sub>px</sub> + σ²<sub>r̂x</sub> )</span>
    <p>com r̂ a estimativa da odometria e σ²<sub>r̂</sub> a sua variância.</p>
    <div class="hl">Reconhece a fórmula: <b>é a atualização escalar do filtro de Kalman.</b> O peso que multiplica cada fonte é exatamente o ganho de Kalman escrito de outra maneira — a fonte com <b>menor</b> variância domina, e a variância resultante é <b>menor que qualquer uma das duas</b> (repara na segunda fórmula: é sempre inferior ao mínimo). Fundir duas medidas independentes melhora sempre.<br>Ou seja: chegaste ao Kalman por outro caminho, sem matrizes e sem Jacobianos, porque aqui cada coordenada é tratada em separado.</div>`,
    figures:[{src:"assets/slides/mapmatch/page-14.png", caption:"Slide 14 — Fusão com a odometria",
      focus:"a média ponderada e a expressão da variância resultante — compara com o ganho de Kalman escalar do #M4.1"}],
    slideRef:"SAUT_Loc_Map_Matching, pág. 14" },

  { type:"quiz", title:"Checkpoint — condicionamento e fusão", questions:[
    { kind:"mcq", q:"Um robô num corredor reto e comprido, a localizar-se por map matching. O que acontece?",
      options:["A estimativa diverge","O custo é plano ao longo do corredor: a posição nessa direção é não observável, e a variância correspondente sai enorme","O algoritmo rejeita todas as medidas","O ângulo fica indeterminado"], answer:1,
      hint:"Deslizar ao longo do corredor altera o encaixe das medidas nas paredes?",
      explain:"É o caso do vale. Distância às paredes e orientação ficam bem determinadas; a posição ao longo do corredor não. A 2.ª derivada nessa direção é quase nula e a variância dispara — o que é a resposta honesta." },
    { kind:"mcq", q:"Segunda derivada da função de custo GRANDE numa direção significa:",
      options:["Estimativa pouco fiável nessa direção","Estimativa fiável nessa direção — variância pequena","Presença de outliers","Necessidade de mais partículas"], answer:1,
      hint:"Vale apertado ou superfície plana?",
      explain:"Vale apertado: afastar-se um pouco já custa muito, logo o mínimo está bem definido. σ² = K/(∂²E/∂p²) sai pequena." },
    { kind:"input", q:"Fusão escalar com σ²_matching = 4 e σ²_odometria = 4. Qual é a variância resultante σ² = (σ²a·σ²b)/(σ²a+σ²b)?",
      answer:2, tolerance:0.01,
      hint:"(4×4)/(4+4).",
      explain:"16/8 = 2. Metade de cada uma: fundir duas fontes independentes com a mesma incerteza reduz a variância para metade." },
    { kind:"flash", front:"Porque é que a fusão do Perfect Match com a odometria é 'o Kalman por outro caminho'?",
      back:"A média ponderada pelas variâncias é exatamente a atualização escalar do KF: o peso é o ganho de Kalman, a fonte de menor variância domina, e a variância resultante é menor que qualquer uma das duas." }
  ]},

  { type:"theory", title:"Resultados: quanto custa cada abordagem",
    html:`<p>O slide 15 compara os <b>tempos de processamento</b> com o filtro de partículas (Monte Carlo), em milissegundos, e mostra um exemplo com o robô a andar a <b>2 m/s</b>. Na figura, a evolução da estimativa considerando <b>só o matching</b> (tracejado) e <b>fundida com a odometria</b> (linha cheia).</p>
    <p>O slide 16 é o resultado do futebol robótico: <b>menos de 4 ms</b> num Intel Centrino M a 1,6 GHz.</p>
    <p>O slide 17 mostra outra aplicação — um robô de vigilância, com laser rotativo, mapa 3D e um corte a altura fixa para obter o mapa 2D usado no matching.</p>
    <div class="hl">Duas leituras que interessam:<br><b>1.</b> O Perfect Match ganha em tempo porque o trabalho pesado foi feito <i>offline</i> (as matrizes). O MCL paga por partícula, em <i>execução</i>, a cada ciclo. É um compromisso de memória contra tempo.<br><b>2.</b> Repara na figura do slide 15: é a <b>fusão com a odometria</b>, e não o matching sozinho, que dá a estimativa suave. O matching puro salta, porque cada ciclo é uma otimização independente da anterior — não tem memória.</div>
    <p>E o processador em causa é de meados dos anos 2000. O mérito é do algoritmo, não do hardware.</p>`,
    figures:[{src:"assets/slides/mapmatch/page-15.png", caption:"Slide 15 — Comparação com o filtro de partículas e efeito da fusão",
      focus:"a diferença entre a linha tracejada (só matching, aos saltos) e a cheia (fundida com odometria, suave)"},
      {src:"assets/slides/mapmatch/page-17.png", caption:"Slide 17 — Robô de vigilância: mapa 3D cortado a altura fixa",
      focus:"como um mapa 3D é reduzido a um mapa 2D utilizável pelo matching"}],
    slideRef:"SAUT_Loc_Map_Matching, págs. 15–17" },

  { type:"theory", title:"Improved Perfect Match: rejeitar em vez de limitar",
    html:`<p>A versão melhorada (slide 18) faz duas alterações:</p>
    <ul><li>a fusão entre a odometria e a estimativa global passa a ser feita <b>como no filtro de Kalman</b>, em vez da média ponderada ad hoc</li>
    <li>a função de custo é modificada para <b>rejeitar outliers</b>: medidas com erro em valor absoluto superior a <b>A</b> são simplesmente rejeitadas</li></ul>
    <p>Os slides 19 a 22 mostram o contraste: uma falha do algoritmo original, os erros absolutos num varrimento do laser, e o mesmo com o algoritmo melhorado usando <b>A = 0,5 m</b>.</p>
    <div class="hl">Repara na mudança de filosofia face ao módulo anterior. A função <span class="formula">1 − c²/(c²+d²)</span> <b>limita</b> o peso de um ponto mau, mas ele continua a contar. O corte em A <b>elimina-o</b>.<br>São as duas atitudes que já viste no M5 — peso limitado versus rejeição — e o algoritmo melhorado acaba por usar as duas em série: satura primeiro, corta acima de A. É exatamente a mesma arquitetura em camadas dos testes test5/test6/test8 do <code>#M5.4</code>.</div>`,
    figures:[{src:"assets/slides/mapmatch/page-19.png", caption:"Slide 19 — Falha no algoritmo original",
      focus:"a situação em que a estimativa original derrapa"},
      {src:"assets/slides/mapmatch/page-21.png", caption:"Slide 21 — Algoritmo melhorado",
      focus:"a mesma situação com rejeição de outliers acima de A"}],
    slideRef:"SAUT_Loc_Map_Matching, págs. 18–22" },

  { type:"theory", title:"Localização global por múltiplas hipóteses",
    html:`<p>Tudo o que vimos até aqui pressupõe que o robô sabe <b>mais ou menos</b> onde está. O slide 23 trata do caso em que deixou de saber — o algoritmo de Miguel Pinto et al.:</p>
    <ul><li>em cada ciclo analisa-se uma <b>possível falha</b> da localização, baseada na divergência elevada entre os dados medidos e o que deveria ser medido dada a pose estimada</li>
    <li>se essa diferença <b>se mantiver durante algum tempo</b>, dispara um algoritmo de recuperação</li>
    <li>a recuperação lança um número fixo de localizações possíveis (aleatórias ou predefinidas) — <i>"algo semelhante a um pequeno filtro de partículas"</i></li>
    <li>comparando a evolução das várias hipóteses, eliminam-se as que têm um <i>matching</i> muito baixo e <b>fundem-se</b> as que estão demasiado próximas</li>
    <li>se uma delas mantiver durante algum tempo um bom encaixe e claramente melhor que as outras, assume-se que é a correta e volta-se ao estado normal</li></ul>
    <p>O slide 25 dá um critério concreto de seleção: escolher a hipótese que por <b>9 vezes</b> teve o melhor valor da função de custo.</p>
    <div class="hl">Vale a pena ver a convergência de ideias deste milestone inteiro. Isto é um <b>filtro de partículas com meia dúzia de partículas</b>, em que cada "partícula" é uma estimativa completa do Perfect Match em vez de uma pose isolada.<br>E o critério das 9 vezes é o mesmo instinto do filtro rápido/lento do <code>#M6.2</code>: nunca decidir com base num único ciclo, porque um ciclo isolado pode ser ruído.</div>`,
    figures:[{src:"assets/slides/mapmatch/page-24.png", caption:"Slide 24 — Hipóteses iniciais e as que sobram passado algum tempo",
      focus:"o conjunto inicial espalhado e a eliminação/fusão progressiva das hipóteses"},
      {src:"assets/slides/mapmatch/page-25.png", caption:"Slide 25 — Critério de seleção da hipótese correta",
      focus:"o critério das 9 melhores avaliações consecutivas da função de custo"}],
    slideRef:"SAUT_Loc_Map_Matching, págs. 23–25" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Na versão Improved do Perfect Match, medidas com erro absoluto acima de A são:",
      options:["Ponderadas com peso reduzido","Simplesmente rejeitadas","Substituídas pela média","Guardadas para o ciclo seguinte"], answer:1,
      hint:"Limitar o peso e rejeitar são coisas diferentes.",
      explain:"São rejeitadas. É a diferença face à função saturada 1−c²/(c²+d²), que limita mas mantém o ponto. O algoritmo melhorado usa as duas camadas." },
    { kind:"mcq", q:"O algoritmo de localização global dispara a recuperação quando:",
      options:["A odometria acumula 1 m de erro","A divergência entre o medido e o esperado se mantém elevada durante algum tempo","O robô para","O número de pontos medidos desce"], answer:1,
      hint:"Um único ciclo mau chega para declarar falha?",
      explain:"Tem de persistir. Um ciclo isolado com divergência alta pode ser ruído ou uma pessoa a passar; só a persistência justifica lançar hipóteses novas." },
    { kind:"mcq", q:"Em que é que o algoritmo de múltiplas hipóteses se parece com um filtro de partículas?",
      options:["Usa milhares de amostras","Mantém várias hipóteses em paralelo, elimina as fracas e funde as próximas — mas cada hipótese é uma estimativa completa de matching","Usa resampling de baixa variância","Precisa de beacons"], answer:1,
      hint:"O que é uma 'partícula' neste algoritmo?",
      explain:"É um filtro de partículas com pouquíssimas partículas, cada uma sendo uma estimativa completa do Perfect Match. O próprio slide lhe chama 'algo semelhante a um pequeno filtro de partículas'." },
    { kind:"flash", front:"Porque é que o matching sozinho dá uma estimativa aos saltos e a fusão com odometria não?",
      back:"Cada ciclo de matching é uma otimização independente — não tem memória do ciclo anterior. A odometria fornece a continuidade temporal; a fusão pesa as duas pelas variâncias." }
  ]}

  ]
},

/* ==================== MÓDULO 5 ==================== */
{
  id:"m6-mod5", title:"SLAM: o problema e os modelos de mapa", minutes:30, kind:"study",
  blurb:"O problema do ovo e da galinha, online vs offline, modelos de sensor e os três tipos de mapa. SLAM, págs. 4–15 do PDF.",
  pages:[

  { type:"theory", title:"O problema do ovo e da galinha ★",
    html:`<p>O slide põe os dois problemas lado a lado:</p>
    <ul><li><b>Mapping</b> — <i>what is the world around me?</i> Observar de várias posições, integrar as medidas para produzir o mapa. <b>Assume conhecimento perfeito da posição.</b></li>
    <li><b>Localization</b> — <i>where am I in the world?</i> Observar, relacionar as leituras com um modelo do mundo, calcular a localização relativa a esse modelo. <b>Assume um modelo do mundo conhecido.</b></li></ul>
    <p>Cada um assume o outro resolvido. O <b>SLAM</b> é a saída: construir o mapa <i>enquanto</i> se estima a pose do robô relativamente a esse mapa.</p>
    <div class="hl">Repara em como tudo o que fizeste até ao M5 vive do lado confortável. Na Lab 4 as coordenadas dos beacons estavam escritas no código; na Lab 5 estavam no <code>BeaconPos[]</code>; no map matching o mapa era o campo de futebol.<br>Tira o mapa e desaparece <b>toda</b> a referência absoluta. Ficas só com medidas relativas entre uma pose que não conheces e características que também não conheces. É por isso que o SLAM é qualitativamente mais difícil, e não apenas mais um filtro.</div>`,
    figures:[{src:"assets/slides/slam/page-04.png", caption:"Slide 3/37 — Mapping, Localization e o problema circular",
      focus:"as duas linhas 'assumes perfect knowledge of position' e 'assumes a known world model' — é aí que está o círculo"}],
    slideRef:"SAUT_SLAM, pág. 4 do PDF (rodapé 3/37)" },

  { type:"theory", title:"Entradas, saídas, e online vs offline",
    html:`<p>No SLAM o robô move-se num ambiente desconhecido, <b>habitualmente assumido estático</b>. As entradas do algoritmo:</p>
    <ul><li><b>odometria</b> — o movimento do robô</li>
    <li><b>observações</b> de características próximas (para landmarks) ou <b>laser scans</b> (para occupancy grid mapping)</li></ul>
    <p>E estima-se:</p>
    <ul><li>o <b>mapa</b> — de características ou occupancy grid</li>
    <li>a <b>pose</b> do robô, e aqui há uma bifurcação importante:
      <ul><li><b>online SLAM</b> — a posição <i>atual</i> do robô</li>
      <li><b>offline SLAM</b> — o <b>caminho completo</b>, usando os dados atuais para corrigir estimativas passadas</li></ul></li></ul>
    <div class="hl">A distinção online/offline pesa mais do que parece. No offline, um <i>loop closure</i> hoje pode corrigir um erro cometido há dez minutos, porque a trajetória inteira está no estado e pode ser reescrita. O online não tem para onde voltar: só tem a pose atual no vetor de estado, e o passado já foi comprometido.<br>Guarda esta distinção — ela volta no fim do módulo 6, na discussão entre <i>filtering</i> e <i>smoothing</i>.</div>`,
    figures:[{src:"assets/slides/slam/page-06.png", caption:"Slide 5/37 — O problema do SLAM ilustrado",
      focus:"a pose do robô e as características do mapa a serem estimadas em simultâneo, ambas com incerteza"}],
    slideRef:"SAUT_SLAM, págs. 5–6 do PDF (rodapé 4–5/37)" },

  { type:"theory", title:"Incerteza, movimento e sensores",
    html:`<p>O slide 7/37 põe a questão de forma limpa: se a informação sensorial fosse perfeita e consistente, o SLAM seria apenas <b>sobrepor dados</b> à medida que o robô se move. Não é. O movimento do robô é intrinsecamente incerto — e a solução é usar <b>probabilidades</b>.</p>
    <p><b>Modelo de movimento</b> (8/37). Em 3D a configuração precisa de 6 parâmetros (3 de translação, 3 de rotação); em superfícies planas ficam 3 graus de liberdade, (x, y, θ). Dois modelos típicos: <b>odometria</b> (dados dos encoders para estimar a variação de posição) e <b>dead reckoning</b> (avançar a partir de uma posição anterior com velocidades conhecidas ou estimadas ao longo do tempo).</p>
    <p><b>Sensores</b> (9/37): internos (encoders, acelerómetros, giroscópios, bússolas), de proximidade (sonar por tempo de voo, radar, laser, infravermelhos), visuais (câmaras) e satélite (GPS). É a taxonomia do M0 outra vez.</p>
    <p><b>Beam sensor model</b> (10/37). A tarefa central é determinar <b>P(z|x)</b> — a probabilidade da medida z dada a posição x, a chamada <i>likelihood</i>. As fontes de ruído listadas:</p>
    <ul><li>incerteza na medição da distância a um obstáculo conhecido</li>
    <li>incerteza na posição dos obstáculos conhecidos</li>
    <li>posição de obstáculos adicionais</li>
    <li><b>se o obstáculo é falhado</b></li></ul>
    <div class="hl">Repara na última fonte. "Whether obstacle is missed" não é uma perturbação gaussiana — é um <b>acontecimento discreto</b>: ou o raio apanha o obstáculo ou passa ao lado e devolve o alcance máximo. É por isso que o modelo do feixe é uma <b>mistura</b> de distribuições e não uma gaussiana só, e é também por isso que o R único do teu EKF é uma aproximação. Encaixa diretamente com a validação do M5.</div>`,
    figures:[{src:"assets/slides/slam/page-11.png", caption:"Slide 10/37 — Beam sensor model",
      focus:"as quatro fontes de ruído, em especial a última: falhar o obstáculo é um evento discreto, não ruído gaussiano"}],
    slideRef:"SAUT_SLAM, págs. 8–11 do PDF (rodapé 7–10/37)" },

  { type:"quiz", title:"Checkpoint — o problema do SLAM", questions:[
    { kind:"mcq", q:"Porque é que mapping e localization formam um problema circular?",
      options:["Ambos precisam de laser","Mapping assume a posição conhecida e localization assume o mapa conhecido","Ambos usam o filtro de Kalman","Ambos são NP-difíceis"], answer:1,
      hint:"Lê as duas hipóteses que cada um faz.",
      explain:"É o ovo e a galinha: precisas do mapa para te localizares e da tua posição para mapear. O SLAM resolve os dois em simultâneo." },
    { kind:"mcq", q:"A diferença entre online SLAM e offline SLAM está em:",
      options:["O número de sensores","O que se estima: só a pose atual (online) ou o caminho completo, corrigindo o passado (offline)","Usar ou não odometria","O tipo de mapa"], answer:1,
      hint:"O que é que o offline consegue corrigir e o online não?",
      explain:"O offline (full SLAM) tem a trajetória inteira no estado, portanto um loop closure pode reescrever estimativas antigas. O online só tem a pose atual." },
    { kind:"mcq", q:"No beam sensor model, 'whether obstacle is missed' é uma fonte de ruído especial porque:",
      options:["É desprezável","É um evento discreto, não uma perturbação gaussiana — obriga o modelo a ser uma mistura de distribuições","Só ocorre com sonar","Depende da odometria"], answer:1,
      hint:"O raio apanha o obstáculo ou devolve o alcance máximo. Isso é uma curva em sino?",
      explain:"É binário: acerta ou passa ao lado. Por isso o modelo do feixe é uma mistura, e por isso um R gaussiano único é sempre uma aproximação." },
    { kind:"flash", front:"SLAM: quais são as entradas e o que se estima?",
      back:"Entradas: odometria (movimento) + observações de features ou laser scans. Estima-se: o mapa (features ou occupancy grid) E a pose — atual (online) ou o caminho completo (offline)." }
  ]},

  { type:"theory", title:"Os desafios e as ferramentas probabilísticas",
    html:`<p><b>Desafios</b> (11/37), na lista do próprio slide: processamento sensorial, posição inicial desconhecida, navegação, exploração, <b>loop closure</b>, escalabilidade e fusão de dados em cenários multi-robô.</p>
    <p><b>Frameworks probabilísticos</b> (12/37) para representar a pose e o mapa:</p>
    <ul><li><b>Filtros de Kalman</b> — assume tudo gaussiano, modelos aproximadamente lineares</li>
    <li><b>Abordagens discretas</b> — representação topológica ou baseada em grelha/métrica → <i>global localization, recovery</i></li>
    <li><b>Filtros de partículas</b> — representação por amostras → <i>global localization, recovery</i></li>
    <li><b>Multi-hipótese</b> — vários filtros de Kalman → <i>global localization, recovery</i></li></ul>
    <div class="hl">Repara na coluna que se repete. A anotação <i>"global localization, recovery"</i> aparece nas abordagens discretas, nas de partículas e nas multi-hipótese — e <b>não</b> aparece no filtro de Kalman.<br>É a mesma limitação que já viste duas vezes neste milestone: uma gaussiana tem uma média, logo não recupera de um kidnap. Vais reencontrá-la, escrita por extenso, nas conclusões do EKF-SLAM.</div>`,
    figures:[{src:"assets/slides/slam/page-13.png", caption:"Slide 12/37 — Frameworks para representar sistemas com densidades de probabilidade",
      focus:"quais as abordagens que trazem a anotação 'global localization, recovery' — e qual é a que não traz"}],
    slideRef:"SAUT_SLAM, págs. 12–13 do PDF (rodapé 11–12/37)" },

  { type:"theory", title:"Três modelos de mapa ★",
    html:`<p>O slide 13/37 organiza-os numa tabela que vale a pena saber de cor:</p>
    <ul><li><b>Grid-Based</b> — coleção de pixels discretizados de obstáculo/espaço livre. Resolução: localização discreta. Complexidade: <b>tamanho da grelha</b>.</li>
    <li><b>Feature-Based</b> — coleção de posições de landmarks com incerteza correlacionada. Resolução: localização arbitrária (contínua). Complexidade: <b>número de landmarks</b>.</li>
    <li><b>Topological</b> — coleção de nós e das suas interligações. Resolução: localiza aos nós. Complexidade: <b>mínima</b>.</li></ul>
    <p><b>Solução híbrida</b> (14/37): características locais extraídas de um mapa em grelha local; criam-se <i>local map frames</i> ao atingir o limite de complexidade; a topologia consiste nesses frames ligados entre si. É escalável — permite mapear regiões grandes mantendo informação detalhada localmente.</p>
    <div class="hl">Esta escolha não é decorativa: <b>determina o algoritmo</b>. Feature-based leva ao EKF-SLAM; grid-based leva ao FastSLAM/GMapping. E a razão está na coluna da complexidade — o EKF custa com o quadrado do número de landmarks, o que torna impensável tratar cada célula de uma grelha como um landmark. É esta a ponte para o módulo seguinte.</div>`,
    figures:[{src:"assets/slides/slam/page-14.png", caption:"Slide 13/37 — Os três modelos de mapa e a tabela comparativa",
      focus:"a linha da complexidade computacional: tamanho da grelha vs número de landmarks vs mínima"},
      {src:"assets/slides/slam/page-15.png", caption:"Slide 14/37 — Solução híbrida",
      focus:"local map frames em grelha, ligados por uma estrutura topológica"}],
    slideRef:"SAUT_SLAM, págs. 14–15 do PDF (rodapé 13–14/37)" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Qual modelo de mapa tem complexidade computacional proporcional ao NÚMERO DE LANDMARKS?",
      options:["Grid-based","Feature-based","Topological","Híbrido"], answer:1,
      hint:"Qual deles guarda posições de marcos com incerteza correlacionada?",
      explain:"Feature-based. O grid-based escala com o tamanho da grelha e o topológico tem complexidade mínima (localiza apenas aos nós)." },
    { kind:"mcq", q:"Porque é que o EKF-SLAM não se usa com mapas em grelha?",
      options:["A grelha não tem incerteza","Tratar cada célula como landmark é computacionalmente insustentável e a associação de dados entre células vizinhas é impossível","O laser não serve para grelhas","A grelha não é probabilística"], answer:1,
      hint:"O custo do EKF cresce com o quadrado do número de elementos no estado.",
      explain:"São as duas razões do slide 23/37: demasiado caro, e como distinguir um ponto da grelha do seu vizinho na associação de dados?" },
    { kind:"flash", front:"Os três modelos de mapa e a complexidade de cada um.",
      back:"Grid-based: pixels ocupado/livre, complexidade = tamanho da grelha. Feature-based: landmarks com incerteza correlacionada, complexidade = nº de landmarks. Topological: nós e ligações, complexidade mínima, localiza só aos nós." }
  ]}

  ]
},

/* ==================== MÓDULO 6 ==================== */
{
  id:"m6-mod6", title:"EKF-SLAM, FastSLAM e alternativas", minutes:40, kind:"study",
  blurb:"O teu EKF da Lab 4 com o estado a crescer, associação de dados, loop closure, UKF, scan matching e FastSLAM. SLAM, págs. 17–36 do PDF.",
  pages:[

  { type:"theory", title:"Reconhece este EKF? É o teu ★",
    html:`<p>O slide 16/37 apresenta o EKF para localização, com o mapa dado. Estado e entradas:</p>
    <span class="formula">x(k) = [ x<sub>r</sub>(k), y<sub>r</sub>(k), θ<sub>r</sub>(k) ]<sup>T</sup> &nbsp;&nbsp; u(k) = [ u<sub>1</sub>(k), u<sub>2</sub>(k) ]<sup>T</sup></span>
    <p>e o modelo de processo:</p>
    <span class="formula">x(k+1) = [ cos(θ<sub>r</sub> + u<sub>2</sub>T/2)·u<sub>1</sub>T + x<sub>r</sub> ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; sin(θ<sub>r</sub> + u<sub>2</sub>T/2)·u<sub>1</sub>T + y<sub>r</sub> ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; u<sub>2</sub>T + θ<sub>r</sub> ] + ν(k)</span>
    <p>Olha com atenção: é <b>exatamente</b> o teu <code>predictPosition</code>, com discretização centrada (o <code>u₂T/2</code> dentro do cos e do sin), com T em vez de dt e com u₁, u₂ em vez de v, ω.</p>
    <p>E o modelo de observação para o landmark j (17/37):</p>
    <span class="formula">h<sub>j</sub>(x) = [ √( (x<sub>j</sub>−x<sub>r</sub>)² + (y<sub>j</sub>−y<sub>r</sub>)² ) ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; atan2( y<sub>j</sub>−y<sub>r</sub>, x<sub>j</sub>−x<sub>r</sub> ) − θ<sub>r</sub> ]</span>
    <p>que é o <code>h(M_B, X)</code> do <code>#M4.3</code>, letra por letra, incluindo o −θ<sub>r</sub> que converte para o referencial do robô.</p>
    <div class="hl">O slide termina com <i>"now it's just linearize and calculate the matrices..."</i> — e tu já fizeste isso, em Matlab na Lab 4 e em Pascal na Lab 5. O capítulo do SLAM arranca precisamente de onde estás. O que se segue é <b>uma</b> alteração.</div>`,
    figures:[{src:"assets/slides/slam/page-17.png", caption:"Slide 16/37 — EKF para localização: estado, entradas e modelo de processo",
      focus:"o termo u2·T/2 dentro do cos e do sin — é a discretização centrada da Lab 1"},
      {src:"assets/slides/slam/page-18.png", caption:"Slide 17/37 — O modelo de medida h_j(x)",
      focus:"a distância e o ângulo menos theta_r: é o h(M_B,X) do M4 sem uma vírgula de diferença"}],
    slideRef:"SAUT_SLAM, págs. 17–18 do PDF (rodapé 16–17/37)" },

  { type:"theory", title:"EKF-SLAM: o estado cresce com o mapa",
    html:`<p>A alteração é esta: no EKF-SLAM tanto a posição do robô como a das características têm de ser estimadas, portanto <b>entram todas no vetor de estado</b>:</p>
    <span class="formula">x = [ x<sub>r</sub>, y<sub>r</sub>, θ<sub>r</sub>, x<sub>l1</sub>, y<sub>l1</sub>, x<sub>l2</sub>, y<sub>l2</sub>, … , x<sub>ln</sub>, y<sub>ln</sub> ]<sup>T</sup></span>
    <p>Detalhes do slide que importam:</p>
    <ul><li>o estado <b>começa só com 3 componentes</b> (a pose)</li>
    <li>quando o robô vê uma característica nova <b>um número mínimo de vezes</b>, associa-a ao estado</li>
    <li>ao linearizar, o Jacobiano de f passa a ter dimensão <b>3 + 2n</b></li></ul>
    <p>Três consequências para interiorizar:</p>
    <ul><li><b>Custo.</b> P é (3+2n)×(3+2n) e as multiplicações de matrizes custam com o quadrado. É a origem do <i>"computationally expensive when using many landmarks"</i> do slide 25/37.</li>
    <li><b>Correlações.</b> O slide 19/37 diz que o erro do caminho do robô <b>correlaciona</b> os erros do mapa. Dois landmarks vistos da mesma pose errada ficam errados <i>em conjunto</i>. Os blocos fora da diagonal de P guardam isso — e são eles que fazem o loop closure funcionar.</li>
    <li><b>O "número mínimo de vezes"</b> não é um detalhe de implementação. Promover uma deteção espúria a elemento do estado polui o mapa de forma <b>permanente</b>: ao contrário de uma medida má, que passa, um landmark falso fica lá para sempre a atrair associações erradas.</li></ul>`,
    figures:[{src:"assets/slides/slam/page-19.png", caption:"Slide 18/37 — O vetor de estado do EKF-SLAM",
      focus:"o estado a começar com 3 componentes e a crescer 2 por cada landmark mapeado"},
      {src:"assets/slides/slam/page-20.png", caption:"Slide 19/37 — O erro do caminho correlaciona os erros do mapa",
      focus:"as elipses de incerteza dos landmarks a crescerem em conjunto com a do robô"}],
    slideRef:"SAUT_SLAM, págs. 19–20 do PDF (rodapé 18–19/37)" },

  { type:"quiz", title:"Checkpoint — EKF-SLAM (formato exame)", questions:[
    { kind:"input", q:"Um robô diferencial com EKF-SLAM tem 7 landmarks já mapeados. Qual é a dimensão do vetor de estado (3 + 2n)?",
      answer:17, tolerance:0,
      hint:"3 para a pose (x, y, θ) e 2 por cada landmark.",
      explain:"3 + 2×7 = 17. E a matriz P é 17×17 — daí o custo crescer tão depressa com o número de landmarks." },
    { kind:"mcq", q:"O que muda no EKF-SLAM face ao EKF de localização que implementaste na Lab 4?",
      options:["O modelo de movimento passa a ser não-linear","As posições dos landmarks passam a fazer parte do vetor de estado, em vez de serem constantes conhecidas","Deixa de haver fase de predição","Passa a usar partículas"], answer:1,
      hint:"Na Lab 4, o BeaconPos estava escrito no código. E aqui?",
      explain:"É a única alteração estrutural. O modelo de movimento e o h(x) são idênticos; o que muda é o mapa deixar de ser um dado e passar a ser incógnita." },
    { kind:"mcq", q:"Porque é que as correlações entre o robô e os landmarks (blocos fora da diagonal de P) são importantes?",
      options:["Aceleram o cálculo","São elas que permitem que um loop closure corrija o mapa TODO e não só a pose atual","Evitam a divergência","Substituem a associação de dados"], answer:1,
      hint:"Dois landmarks vistos da mesma pose errada estão errados de forma independente?",
      explain:"Estão errados em conjunto, e P guarda essa dependência. Ao corrigir a pose com uma reobservação, a correção propaga-se por todos os landmarks correlacionados." },
    { kind:"flash", front:"EKF-SLAM: qual é o vetor de estado e qual a sua dimensão?",
      back:"x = [xr, yr, θr, xl1, yl1, ..., xln, yln]ᵀ, dimensão 3+2n. Começa com 3 e cresce 2 por cada landmark visto um número mínimo de vezes. P é (3+2n)², daí o custo quadrático." }
  ]},

  { type:"theory", title:"Associação de dados e loop closure ★",
    html:`<p>O slide 20/37 é claro: <b>a associação de dados é um grande problema</b>. No mundo real, a correspondência entre observações e landmarks é desconhecida. Para cada medida há que decidir: associá-la a um landmark anterior, ou assumi-la como nova.</p>
    <p>E o slide 21/37 avisa: <i>"picking wrong data associations can have catastrophic consequences!"</i></p>
    <div class="hl">Vale a pena perceber <b>porquê</b> é catastrófico e não apenas mau. Uma medida ruidosa dilui-se: erra para um lado, depois para o outro, e a média sobrevive. Uma associação errada não se dilui — <b>solda dois sítios diferentes num só</b>. O filtro passa a acreditar numa restrição geométrica falsa e não há informação futura que a desfaça, porque ela já entrou na estrutura de P.</div>
    <p><b>Loop closure.</b> O erro cresce à medida que o robô avança, mas com o fecho de ciclo — associação de dados ao regressar a posições antigas — as covariâncias e incertezas podem ser <b>dramaticamente reduzidas ao longo de todo o caminho do robô</b>.</p>
    <p>Nota a expressão: <i>"along all the robot path"</i>, não apenas agora. Só é possível por causa das correlações da página anterior: ao reconhecer um landmark antigo, a correção entra pelos blocos fora da diagonal e reescreve tudo o que estava correlacionado com ele.</p>`,
    figures:[{src:"assets/slides/slam/page-21.png", caption:"Slide 20/37 — Associação de dados",
      focus:"a ambiguidade: que observação corresponde a que landmark já mapeado"},
      {src:"assets/slides/slam/page-22.png", caption:"Slide 21/37 — Consequências de uma associação errada e efeito do loop closure",
      focus:"o mapa deformado por uma associação errada, e o mapa a colapsar para a forma correta após o fecho de ciclo"}],
    slideRef:"SAUT_SLAM, págs. 21–23 do PDF (rodapé 20–22/37)" },

  { type:"theory", title:"Onde se usa e onde falha o EKF-SLAM",
    html:`<p><b>Utilização</b> (23/37). Usa-se em SLAM baseado em características. <b>Não</b> se usa em SLAM baseado em grelha (tratando cada ponto da grelha como característica), por duas razões: é computacionalmente demasiado caro, e a associação de dados é difícil — como distinguir um ponto da grelha do seu vizinho?</p>
    <p>E a síntese que vale a pena decorar tal como está:</p>
    <ul><li><b>Localization</b> — o estado é a localização do robô</li>
    <li><b>Mapping</b> — o estado é a localização dos marcos</li>
    <li><b>SLAM</b> — o estado combina os dois</li></ul>
    <p><b>Conclusões</b> (24/37), quase todas negativas — e é isso que as torna material de exame:</p>
    <ul><li><b>não resolve</b> a localização global nem o problema do robô raptado (recuperação)</li>
    <li>associação de dados de <b>hipótese única</b></li>
    <li><b>deixa de ser ótimo</b>, podendo mesmo divergir para não-linearidades grandes</li>
    <li><i>however, works pretty well even when some assumptions are violated</i></li></ul>
    <div class="hl">A primeira alínea fecha o círculo deste milestone. O EKF-SLAM não recupera de um kidnap <b>pela mesma razão</b> que o EKF de localização não recuperava e que o filtro de partículas recuperava: a crença é unimodal. Uma gaussiana tem uma média, e nenhuma quantidade de medidas a faz saltar para outro sítio do mapa.<br>Já sabias isto desde o módulo 2 — agora vês que se aplica igualmente quando o mapa também é desconhecido.</div>
    <p>Nas aplicações práticas (25/37): usa-se com <i>range finder</i> e visão, dá alta precisão, e é computacionalmente caro com muitos landmarks.</p>`,
    figures:[{src:"assets/slides/slam/page-25.png", caption:"Slide 24/37 — Conclusões do EKF-SLAM",
      focus:"as quatro alíneas — em especial a primeira (não resolve kidnap) e a última (mesmo assim funciona bem)"}],
    slideRef:"SAUT_SLAM, págs. 24–26 do PDF (rodapé 23–25/37)" },

  { type:"theory", title:"As alternativas ao EKF puro",
    html:`<p><b>Multi-Hypothesis EKF</b> (26/37). A crença é representada por <b>múltiplas hipóteses</b>, cada uma seguida por um filtro de Kalman. Problemas adicionais: a associação de dados (que observação corresponde a que hipótese?) e a gestão de hipóteses (quando adicionar, quando eliminar).</p>
    <p>É literalmente o algoritmo de localização global do <code>#M6.4</code>, transposto para o SLAM — e resolve o kidnap exatamente pela razão que o EKF simples não resolvia: várias médias em vez de uma.</p>
    <p><b>UKF-SLAM</b> (27/37). Em vez de linearizar o modelo no ponto de estimativa atual usando a derivada nesse ponto, <b>amostra vários pontos de operação</b> e cria o modelo linear que melhor se ajusta a esses pontos. Consequências:</p>
    <ul><li>eficiente — mesma complexidade do EKF, com um fator constante de atraso</li>
    <li>melhor linearização que o EKF</li>
    <li><b>sem derivadas</b> — não são precisos Jacobianos</li>
    <li>ainda assim, não é ótimo</li></ul>
    <p style="color:var(--muted)">Ou seja: todo aquele trabalho dos ∇f e ∇h da Lab 4 desaparece. Em troca, avaliam-se várias amostras do modelo por ciclo.</p>
    <p><b>Scan Matching</b> (28/37). A abordagem mais simples: usa o laser e faz correspondência <b>entre varrimentos consecutivos</b>. Encontrando a correspondência de máxima verosimilhança, o caminho e o mapa obtêm-se sobrepondo os vários varrimentos. Se a sensorização for suficientemente exata, <b>a odometria não é necessária</b> — embora deva ser usada para aumentar a velocidade e a precisão do registo.</p>
    <span class="formula">x̂<sub>t</sub> = arg max { p(z<sub>t</sub> | x<sub>t</sub>, m̂<sub>t−1</sub>) · p(x<sub>t</sub> | u<sub>t−1</sub>, x̂<sub>t−1</sub>) }</span>
    <div class="hl">Repara nesta expressão: o primeiro fator é o <b>modelo do sensor</b> e o segundo o <b>modelo de movimento</b>. É o Bayes do <code>#M6.1</code> — mas em vez de propagar a distribuição toda, fica-se pelo <b>máximo</b>. Trocar a distribuição pelo seu máximo é o que faz o scan matching ser rápido e é também o que lhe tira a capacidade de exprimir várias hipóteses.</div>`,
    figures:[{src:"assets/slides/slam/page-27.png", caption:"Slide 26/37 — Multi-Hypothesis EKF",
      focus:"várias hipóteses seguidas em paralelo, cada uma com o seu filtro de Kalman"},
      {src:"assets/slides/slam/page-29.png", caption:"Slide 28/37 — Scan Matching",
      focus:"a expressão do argmax: modelo do sensor vezes modelo de movimento"}],
    slideRef:"SAUT_SLAM, págs. 27–29 do PDF (rodapé 26–28/37)" },

  { type:"theory", title:"FastSLAM, GMapping e o fim da história",
    html:`<p><b>FastSLAM: associação de dados por partícula</b> (29/37). A associação é feita numa base <b>por partícula</b>: escolher a correspondência mais provável, ou escolher uma associação aleatória ponderada pelas verosimilhanças das observações; se a probabilidade for demasiado baixa, cria-se um novo landmark.</p>
    <div class="hl">É aqui que está a elegância do FastSLAM. No EKF-SLAM uma associação errada é catastrófica porque há <b>uma só</b> hipótese e ela contamina tudo. No FastSLAM cada partícula toma a sua própria decisão de associação: uma associação errada mata <b>uma partícula</b>, que perde peso e desaparece no resampling. O filtro no seu conjunto sobrevive.<br>É a resposta direta ao "single hypothesis data association" que aparecia nas limitações do EKF-SLAM.</div>
    <p><b>FastSLAM com odometria melhorada</b> (30/37): o scan matching dá uma correção de pose localmente consistente; pré-corrigem-se sequências curtas de odometria com scan matching e usam-se essas como entrada do FastSLAM. São precisas <b>menos partículas</b>, porque o erro na entrada é menor.</p>
    <p><b>GMapping</b> (32/37) — FastSLAM para mapas em grelha:</p>
    <ul><li>o posterior do caminho do robô é um filtro de partículas, e <b>cada partícula representa uma trajetória possível</b></li>
    <li>cada partícula mantém <b>o seu próprio mapa</b>, que atualiza assumindo poses conhecidas</li>
    <li>cada partícula sobrevive com probabilidade proporcional à verosimilhança das observações face ao <i>seu</i> mapa</li>
    <li>problema: mapas grandes por partícula, logo o número de partículas tem de ser pequeno</li>
    <li>solução: melhorar a estimativa de pose com scan matching antes de aplicar o filtro de partículas</li></ul>
    <p><b>Filtragem vs otimização</b> (35/37). Os métodos baseados em filtros estimam <i>online</i> apenas a pose atual e o mapa (EKF, FastSLAM) e dominaram a literatura do SLAM. As abordagens baseadas em <b>otimização</b>, que resolvem o full-SLAM (mapa e trajetória completa), só se tornaram populares com algoritmos eficientes que <b>exploram a esparsidade</b> inerente ao problema, tipicamente com minimização de erros por mínimos quadrados.</p>
    <p>É a distinção online/offline do módulo 5, agora com os nomes que aparecem na literatura: <i>filtering</i> e <i>smoothing</i>.</p>`,
    figures:[{src:"assets/slides/slam/page-30.png", caption:"Slide 29/37 — FastSLAM: associação de dados por partícula",
      focus:"cada partícula com a sua própria decisão de associação"},
      {src:"assets/slides/slam/page-33.png", caption:"Slide 32/37 — GMapping",
      focus:"cada partícula a carregar a sua própria trajetória E o seu próprio mapa"}],
    slideRef:"SAUT_SLAM, págs. 30–36 do PDF (rodapé 29–35/37)" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Porque é que uma associação de dados errada é 'catastrófica' e não apenas 'má'?",
      options:["Porque aumenta o tempo de cálculo","Porque solda dois sítios diferentes num só e essa restrição falsa entra na estrutura de P, não se diluindo com medidas futuras","Porque apaga o mapa","Porque obriga a reiniciar o filtro"], answer:1,
      hint:"Uma medida ruidosa erra para os dois lados e a média sobrevive. E uma associação errada?",
      explain:"Não se dilui: cria uma restrição geométrica falsa que passa a fazer parte das correlações. Nenhuma informação futura a desfaz." },
    { kind:"mcq", q:"O que resolve o FastSLAM que o EKF-SLAM não resolve, quanto à associação de dados?",
      options:["Elimina a necessidade de associação","Faz a associação por partícula: uma associação errada mata uma partícula em vez de contaminar o filtro todo","Usa sempre o landmark mais próximo","Adia a associação para o fim"], answer:1,
      hint:"O EKF-SLAM é criticado por 'single hypothesis data association'.",
      explain:"Cada partícula decide por si. A que erra perde peso e desaparece no resampling; as que acertaram sobrevivem. É a resposta direta à limitação de hipótese única." },
    { kind:"mcq", q:"O UKF-SLAM distingue-se do EKF-SLAM porque:",
      options:["Usa partículas","Amostra vários pontos de operação e ajusta um modelo linear a eles, dispensando Jacobianos","Não precisa de mapa","É ótimo"], answer:1,
      hint:"O que é que desaparece: as derivadas ou o mapa?",
      explain:"Dispensa as derivadas (não precisa de Jacobianos), linearizando melhor por amostragem. Mesma complexidade do EKF com um fator constante — e continua a não ser ótimo." },
    { kind:"mcq", q:"No GMapping, o que é que CADA partícula transporta?",
      options:["Só uma pose","Uma trajetória possível E o seu próprio mapa em grelha","Só um landmark","A matriz de covariância completa"], answer:1,
      hint:"Porque é que o slide diz que o número de partículas tem de ser pequeno?",
      explain:"Cada partícula carrega uma trajetória e o mapa correspondente. É por isso que a memória por partícula é grande e o número de partículas tem de ser reduzido — daí o pré-processamento por scan matching." },
    { kind:"flash", front:"EKF-SLAM: as quatro conclusões do slide 24/37.",
      back:"1) Não resolve localização global nem kidnap; 2) associação de dados de hipótese única; 3) deixa de ser ótimo, podendo divergir com não-linearidades grandes; 4) mesmo assim funciona bem quando algumas hipóteses são violadas." }
  ]}

  ]
},

/* ==================== MÓDULO 7 — MINI-TESTE ==================== */
{
  id:"m6-mod7", title:"Mini-teste final — Localização avançada e SLAM", minutes:25, kind:"labwork",
  blurb:"Sem Lab dedicada: seis questões de síntese sobre MCL, map matching e SLAM.",
  pages:[

  { type:"theory", title:"Como funciona este mini-teste",
    html:`<p>O M6 não tem laboratório próprio — é matéria teórica que sustenta as Labs 4 e 5 e que cai no exame escrito. Em vez de um labwork, este módulo é um <b>mini-teste de síntese</b>, no formato do M0.</p>
    <p>Seis questões que atravessam os seis módulos. Cada uma tem dicas em escada e o botão <b>SOLUÇÃO DIRETA</b>, mas usa-o só depois de tentares — a questão conta como concluída na mesma, mas fica marcada.</p>
    <div class="hl">Sugestão: faz este mini-teste <b>de papel e caneta ao lado</b>, sem voltar aos módulos. Se precisares de reler, isso já te diz qual é o módulo a rever antes do exame — que é a informação mais útil que este teste te pode dar.</div>`,
    slideRef:"—" },

  { type:"labtask", title:"Questão 1 — Kidnap",
    context:"<p>Um robô com filtro de partículas está bem localizado há vários minutos. Alguém pega nele e coloca-o noutra sala.</p>",
    q:"O que acontece se o algoritmo NÃO injetar partículas aleatórias?",
    kind:"mcq",
    options:["Recupera ao fim de alguns ciclos, porque o resampling redistribui as partículas",
             "Não recupera: não há partículas na sala nova e o resampling só escolhe de entre as existentes",
             "Recupera se aumentar o número total de partículas",
             "O filtro diverge numericamente"],
    answer:1,
    hints:["O resampling cria hipóteses novas, ou só redistribui as que existem?","A probabilidade numa zona sem partículas é exatamente zero — e o que é que a faz deixar de o ser?"],
    solution:"O resampling reamostra o conjunto existente, portanto uma região com probabilidade zero mantém-se a zero para sempre. A recuperação exige injeção de partículas aleatórias, em número variável em função da média dos pesos (filtrada com um filtro rápido e um lento)." },

  { type:"labtask", title:"Questão 2 — Resampling",
    context:"<p>Um robô está imobilizado. O filtro continua a correr, e todas as partículas têm pesos iguais.</p>",
    q:"Com low variance resampling, o que acontece ao conjunto de partículas?",
    kind:"mcq",
    options:["Concentra-se progressivamente, como no resampling básico",
             "Mantém-se exatamente igual — é a propriedade que resolve o problema do robô parado",
             "Dispersa-se aleatoriamente",
             "Metade das partículas é eliminada"],
    answer:1,
    hints:["Qual das duas vantagens listadas no slide 15 se aplica a pesos iguais?"],
    solution:"Com pesos iguais o low variance resampling devolve o mesmo conjunto. Sem informação nova, a crença não se altera — que é o comportamento correto e o que corrige o efeito perverso do resampling básico." },

  { type:"labtask", title:"Questão 3 — Perfect Match",
    context:"<p>Estás a implementar o Perfect Match. Tens n pontos medidos pelo laser, já convertidos para o referencial global.</p>",
    q:"Escreve o nome da estrutura pré-calculada que permite obter d() para cada ponto em tempo constante (duas palavras, ex.: matriz de ...):",
    kind:"input",
    answer:["matriz de distancias","matriz de distâncias","distance matrix","matriz distancias"],
    hints:["O slide 9 diz que o pré-processamento dela e das de gradientes leva a um algoritmo muito rápido.","Para cada célula do mapa guarda-se a distância à característica mais próxima."],
    solution:"A <b>matriz de distâncias</b>: para cada célula do mapa guarda-se, offline, a distância à característica mais próxima. Em execução, avaliar d() é uma consulta. Juntam-se-lhe as matrizes de gradientes em x e y (Sobel/8) para alimentar o RPROP." },

  { type:"labtask", title:"Questão 4 — Mau condicionamento",
    context:"<p>Um robô localiza-se por map matching num corredor reto e comprido, com paredes de ambos os lados e sem portas nem esquinas à vista.</p>",
    q:"O que diz a segunda derivada da função de custo sobre a estimativa?",
    kind:"mcq",
    options:["É grande em todas as direções: a estimativa é fiável",
             "É quase nula ao longo do corredor: essa componente é não observável e a variância correspondente sai enorme",
             "É negativa: a estimativa divergiu",
             "Não se aplica — só serve para o filtro de partículas"],
    answer:1,
    hints:["Deslizar ao longo do corredor altera muito o encaixe das medidas nas paredes?","Vale ou planalto? E o que dá σ² = K/(∂²E/∂p²) quando o denominador é minúsculo?"],
    solution:"É o caso do vale. Ao longo do corredor o custo é plano, logo ∂²E/∂p² ≈ 0 e σ² dispara. A estimativa não está errada — a componente é não observável. A variância enorme faz depois a fusão confiar na odometria nessa direção, que é o comportamento desejado." },

  { type:"labtask", title:"Questão 5 — Dimensão do estado no EKF-SLAM",
    context:"<p>Um robô diferencial faz EKF-SLAM. Já mapeou 12 landmarks.</p>",
    q:"Quantos elementos tem a matriz de covariância P? (dimensão total, ex.: para 3x3 responde 9)",
    kind:"input",
    answer:729, tolerance:0,
    hints:["Primeiro a dimensão do estado: 3 + 2n.","3 + 2×12 = 27. P é 27×27."],
    solution:"O estado tem 3 + 2×12 = 27 componentes, logo P é 27×27 = <b>729</b> elementos. Com 100 landmarks seriam 203×203 ≈ 41 mil — é esta a razão de o EKF-SLAM ser descrito como computacionalmente caro com muitos landmarks, e de não se usar com mapas em grelha." },

  { type:"labtask", title:"Questão 6 — Síntese: quem recupera do kidnap",
    context:"<p>Percorreste três famílias de algoritmos neste milestone: EKF (e EKF-SLAM), filtro de partículas e map matching com múltiplas hipóteses.</p>",
    q:"Qual é a propriedade que separa os que recuperam de um kidnap dos que não recuperam?",
    kind:"mcq",
    options:["Usarem laser em vez de beacons",
             "Conseguirem representar a crença com MAIS DE UMA hipótese — uma gaussiana tem uma só média",
             "Terem mapa conhecido",
             "Correrem a mais de 25 Hz"],
    answer:1,
    hints:["Porque é que o slide 12/37 do SLAM anota 'global localization, recovery' em três frameworks e não no filtro de Kalman?"],
    solution:"É a <b>multimodalidade</b>. O EKF e o EKF-SLAM têm crença unimodal: uma média e uma covariância, logo não conseguem saltar para outro sítio do mapa. O filtro de partículas (com injeção aleatória), as abordagens discretas e as multi-hipótese conseguem manter várias hipóteses vivas e escolher mais tarde.<br><br>🏁 <b>Mini-teste concluído!</b> Com este módulo o M6 fica completo e o M7 desbloqueia." }

  ]
}

]};
