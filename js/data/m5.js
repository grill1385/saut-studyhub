// M5 — Lab 5: EKF com laser + módulo de validação (SAUT_Loc_Validation, 16 págs — cobertura integral)
window.SAUT_CONTENT = window.SAUT_CONTENT || {};
window.SAUT_CONTENT["m5"] = { modules: [

/* ============ MÓDULO 1 — Porquê validar observações ============ */
{ id:"m5-mod1", title:"Validação de observações: porquê e onde", minutes:25, kind:"study",
  blurb:"O problema dos outliers, e a limitação de peso na função de custo (map matching). Loc_Validation, págs. 2–4.",
  pages:[
  { type:"theory", title:"O problema: ruído e outliers no mundo real",
    html:`<p>A maioria dos algoritmos de localização funciona bem com dados <b>sem ruído e sem valores inesperados (outliers)</b>. Mas na prática (slide 3):</p>
    <ul><li>Todos os sensores têm ruído associado</li>
    <li>Os ambientes reais onde os robôs se movem são <b>dinâmicos</b> — pessoas, objetos movidos, outros robôs — e produzem frequentemente <b>dados erróneos</b></li></ul>
    <div class="hl">Conclusão do professor (quase literal, boa para desenvolvimento): "o processamento e validação dos dados observados ANTES de serem enviados ao algoritmo de localização assume uma importância central e influencia a robustez e a possibilidade de uso prático do algoritmo".</div>
    <p>Ou seja: entre o sensor e o EKF/Monte Carlo/map matching há sempre um <b>módulo de validação</b>. É esse módulo que constróis na Lab 5 — e que o exame testa nas P4 e P6.</p>
    <p>Um outlier que passe para o filtro pode ser catastrófico: o ganho K "puxa" a estimativa na direção de uma medida que não corresponde a nada no mapa.</p>`,
    figures:[{src:"assets/slides/validation/page-03.png", caption:"Loc_Validation, slide 3 — Motivação", focus:"as duas fontes de problema: ruído dos sensores + ambientes dinâmicos com dados erróneos"}],
    slideRef:"SAUT_Loc_Validation, págs. 2–3" },

  { type:"theory", title:"Outliers no map matching: limitar o peso",
    html:`<p>Primeiro exemplo do deck (slide 4): rejeição de outliers na localização por <b>matching com mapa em grelha</b>. Duas estratégias sobre a função de custo:</p>
    <ul><li><b>[1] Limitar o peso</b> das observações com erro elevado na função de custo — uma observação muito errada deixa de "gritar" mais alto que as outras (função de custo saturada, tipo Tukey/Huber). É a abordagem do <i>Perfect Match</i> (Lauer et al., RoboCup).</li>
    <li><b>[2] Limitar o peso E rejeitar</b> as observações com erro demasiado grande — além de saturar, corta-se completamente acima de um limiar (Sobreira et al., CONTROLO'2014).</li></ul>
    <div class="hl">Intuição gráfica: em vez de custo quadrático (cresce sem limite com o erro), usa-se uma curva que satura — o outlier contribui no máximo com um valor fixo, ou com zero se for rejeitado. Vais rever isto no M6 (map matching é matéria da P14).</div>`,
    figures:[{src:"assets/slides/validation/page-04.png", caption:"Loc_Validation, slide 4 — Peso limitado na função de custo", focus:"as duas curvas de custo: saturada [1] vs saturada+rejeição [2] — repara onde o custo deixa de crescer"}],
    slideRef:"Loc_Validation, pág. 4" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"mcq", q:"Porque é que um único outlier pode arruinar a estimativa de um EKF sem validação?",
      options:["Porque o EKF só aceita medidas perfeitas","Porque o ganho K corrige a estimativa na direção da medida errada, deslocando a pose para longe da realidade","Porque o outlier apaga a matriz P","Porque o Matlab dá erro"], answer:1,
      hint:"O EKF confia em qualquer z que lhe entregues — a correção X_e += K·(z−z_e) não sabe distinguir.",
      explain:"O filtro assume ruído gaussiano de média nula; um outlier viola essa hipótese e a correção é feita na mesma. Daí validar ANTES de entregar ao filtro." },
    { kind:"mcq", q:"No map matching, qual é a diferença entre as estratégias [1] e [2] do slide 4?",
      options:["[1] rejeita tudo; [2] aceita tudo","[1] limita o peso das observações com erro alto; [2] limita o peso E rejeita as de erro excessivo","[1] usa mapa; [2] não usa","Nenhuma — são iguais"], answer:1,
      explain:"[1] satura a função de custo; [2] satura e corta acima de um limiar. Ambas evitam que um outlier domine a otimização." },
    { kind:"flash", front:"Onde se situa o módulo de validação no pipeline de localização, e porquê?", back:"Entre o SENSOR e o ALGORITMO de localização (EKF/MCL/matching). Porque os algoritmos assumem ruído bem-comportado — dados erróneos de ambientes dinâmicos têm de ser filtrados antes." }
  ]}
]},

/* ============ MÓDULO 2 — Outliers no Monte Carlo ============ */
{ id:"m5-mod2", title:"Rejeição de outliers no Monte Carlo", minutes:25, kind:"study",
  blurb:"Medidas anormalmente curtas vs longas, limitar a % de rejeição e o caso de paragem. Loc_Validation, págs. 5–6. ★ Pergunta do exame (subtil!).",
  pages:[
  { type:"theory", title:"Medidas anormalmente CURTAS",
    html:`<p>No algoritmo de <b>Monte Carlo</b> (filtro de partículas — detalhado no M6), a validação trata primeiro as medidas <b>anormalmente curtas</b> (slide 5):</p>
    <ul><li>Uma medida muito mais curta que o esperado sugere algo que <b>não está no mapa</b> (uma pessoa à frente do laser, um objeto novo)</li>
    <li>Calcula-se a <b>probabilidade de a medida se dever a algo fora do mapa</b>; se essa probabilidade excede um dado valor → <b>rejeitar</b> a medida</li></ul>
    <p>Mas com duas salvaguardas fundamentais:</p>
    <ul><li><b>Limitar a rejeição a uma percentagem do total de medidas</b> — se rejeitasses "tudo o que não bate certo", o algoritmo nunca conseguiria <b>recuperar de uma falha de localização</b> (estando perdido, TODAS as medidas parecem erradas!)</li>
    <li>Se <b>muitas medidas</b> estão a ser rejeitadas, pode ser melhor <b>parar o robô e o algoritmo</b> até a situação mudar, possivelmente <b>emitindo um alarme</b></li></ul>`,
    figures:[{src:"assets/slides/validation/page-05.png", caption:"Loc_Validation, slide 5 — Rejeição no MCL (medidas curtas)", focus:"as 3 regras: probabilidade de 'fora do mapa', limite percentual de rejeição, e paragem+alarme"}],
    slideRef:"Loc_Validation, pág. 5" },

  { type:"theory", title:"Medidas anormalmente LONGAS ★ (a subtileza do exame)",
    html:`<p>Slide 6 — e aqui está a subtileza que o exame adora:</p>
    <div class="exam">Na situação (b) do slide, a <b>NÃO-rejeição das medidas anormalmente LONGAS facilita a recuperação</b> da localização estimada a partir da condição de falha. Decora a assimetria:<br>
    • curtas demais → suspeitas (algo fora do mapa) → rejeitar (com limites)<br>
    • longas demais → NÃO rejeitar → ajudam a recuperar do kidnap/falha</div>
    <p>Porquê? Uma medida longa "impossível" para a pose estimada atual é evidência de que <b>a estimativa é que está errada</b> — mantê-la permite que as partículas noutras zonas do mapa (onde a medida é plausível) ganhem peso e a estimativa salte para o sítio certo.</p>
    <p>Resultado experimental (slide 6): comparando o algoritmo com e sem rejeição de outliers, há <b>aumento da exatidão da estimativa e maior certeza</b> — a validação bem feita melhora as duas coisas.</p>`,
    figures:[{src:"assets/slides/validation/page-06.png", caption:"Loc_Validation, slide 6 — Medidas longas e recuperação", focus:"a situação (b): a medida longa 'errada' para a pose atual é a pista que permite recuperar da falha"}],
    slideRef:"Loc_Validation, pág. 6" },

  { type:"quiz", title:"Avaliação final do módulo (formato exame)", questions:[
    { kind:"mcq", q:"[Exame] No Monte Carlo com rejeição de outliers, as medidas anormalmente LONGAS devem:",
      options:["Ser sempre rejeitadas, como as curtas","NÃO ser rejeitadas — facilitam a recuperação da condição de falha","Ser substituídas pela média","Ser duplicadas"], answer:1,
      hint:"É a assimetria do slide 6 — o exame testa exatamente isto.",
      explain:"Curtas → suspeitas de obstáculo fora do mapa. Longas → evidência de que a POSE estimada está errada; mantê-las ajuda o filtro a saltar para a zona certa." },
    { kind:"mcq", q:"Porque se limita a rejeição a uma percentagem do total das medidas?",
      options:["Para poupar CPU","Porque se o robô estiver perdido TODAS as medidas parecem erradas — rejeitar tudo impediria a recuperação","Porque o laser só suporta 10% de rejeições","Para o gráfico ficar contínuo"], answer:1,
      explain:"Rejeição ilimitada + estimativa errada = ciclo vicioso sem informação para corrigir. O limite percentual garante que alguma informação passa sempre." },
    { kind:"mcq", q:"O que deve o sistema fazer se, apesar do limite, muitas medidas continuarem a ser rejeitadas?",
      options:["Aumentar a velocidade do robô","Parar o robô e o algoritmo de localização até a situação mudar, possivelmente emitindo um alarme","Apagar o mapa e recomeçar","Ignorar o problema"], answer:1,
      explain:"Slide 5: é a resposta de segurança do deck — parar + alarme quando o ambiente está incompatível com o mapa." },
    { kind:"flash", front:"A assimetria curtas/longas do MCL numa frase para o exame:", back:"Rejeitar as anormalmente CURTAS (prob. de objeto fora do mapa > limiar, com % máxima de rejeição); NÃO rejeitar as anormalmente LONGAS porque facilitam a recuperação da falha de localização." }
  ]}
]},

/* ============ MÓDULO 3 — Deteção de beacons no laser: BeaconPoints ============ */
{ id:"m5-mod3", title:"Deteção no laser: etapas e nº de raios (BeaconPoints)", minutes:35, kind:"study",
  blurb:"As 3 etapas sequenciais de deteção e a fórmula do nº de pontos refletidos. Loc_Validation, págs. 7–10. ★ Pergunta 6 do exame.",
  pages:[
  { type:"theory", title:"As 3 etapas sequenciais de deteção de outliers",
    html:`<p>Para o EKF com laser e <b>beacons refletores</b> (o cenário das Labs 5 e da ADIRA), a deteção de outliers faz-se em <b>etapas sequenciais</b> (slide 7) — cada etapa filtra mais fino:</p>
    <ol><li><b>Fator de reflexão:</b> se o laser fornece o fator de reflexão de cada ponto, rejeitam-se imediatamente todos os pontos <b>abaixo de um dado fator</b> (os beacons são refletores — brilham muito mais que o resto).</li>
    <li><b>Dimensões do beacon:</b> para os pontos que passam, considerando as <b>dimensões dos beacons e a distância de deteção</b>, verifica-se se cada conjunto de pontos (cluster) <b>pode corresponder a um beacon</b> — é aqui que entra a fórmula do nº de pontos (próxima página).</li>
    <li><b>Zona de proximidade probabilística:</b> finalmente, um hipotético beacon observado, para ser validado e <b>associado (matched)</b> a um beacon do mapa, tem de estar numa <b>zona de proximidade</b> do beacon com probabilidade superior a um dado valor (módulo 4).</li></ol>
    <div class="hl">Pipeline completo: reflexão → dimensão/cluster → região probabilística → só então a medida entra no EKF_Update. Sabe listar as 3 etapas por ordem.</div>`,
    figures:[{src:"assets/slides/validation/page-07.png", caption:"Loc_Validation, slide 7 — Etapas sequenciais", focus:"a ordem das 3 etapas: reflexão → dimensões → proximidade probabilística"}],
    slideRef:"Loc_Validation, pág. 7" },

  { type:"theory", title:"Quantos pontos deve o laser ver num beacon? ★",
    html:`<p>Slide 8 — beacon <b>cilíndrico</b> de raio <code>B_radius</code> detetado a uma distância <code>r</code>. O ângulo sob o qual o laser "vê" o beacon é:</p>
    <span class="formula">α = 2·arcsin(B_radius / r)</span>
    <p>Se o laser tem resolução angular <code>θ_Res</code> (ângulo entre raios consecutivos), o número de pontos esperado é:</p>
    <span class="formula">n_pontos = α / θ_Res = 2·arcsin(B_radius/r) / θ_Res</span>
    <div class="exam">P6 do exame — função <b>BeaconPoints</b>: aparece na forma <code>floor(arcsin(diam/dist)·N_raios/(2π))</code>. É a MESMA fórmula: diam=2·B_radius (para ângulos pequenos 2·arcsin(R/r) ≈ arcsin(2R/r)) e θ_Res = 2π/N_raios. Reconhece as duas formas!</div>
    <p><b>Correção prática (slide 9):</b> em situações reais o nº de pontos é <b>ligeiramente superior</b> ao previsto pelo modelo, dado que o feixe do laser <b>não é exatamente pontual</b> (tem largura própria — apanha o beacon "de raspão" nas bordas).</p>
    <p><b>Validação experimental (slide 10):</b> os resultados confirmam o modelo — a contagem de pontos por cluster em função da distância segue a curva prevista, e serve de teste de aceitação: um cluster com nº de pontos muito diferente do esperado para aquela distância <b>não é um beacon</b>.</p>`,
    figures:[{src:"assets/slides/validation/page-08.png", caption:"Loc_Validation, slide 8 — Geometria do nº de pontos", focus:"o triângulo retângulo: sin(α/2) = B_radius/r — daí o arcsin"},
             {src:"assets/slides/validation/page-09.png", caption:"Slide 9 — Feixe não pontual", focus:"porque a contagem real é ligeiramente superior ao modelo"},
             {src:"assets/slides/validation/page-10.png", caption:"Slide 10 — Resultados experimentais", focus:"a curva nº de pontos vs distância usada como critério de validação"}],
    slideRef:"Loc_Validation, págs. 8–10" },

  { type:"quiz", title:"Checkpoint — BeaconPoints (formato exame)", questions:[
    { kind:"input", q:"[P6 exame] Beacon da Lab 5: diâmetro 5 cm (B_radius = 0,025 m), detetado a r = 1 m, laser com θ_Res = 1° (π/180 rad). Quantos pontos prevê o modelo n = 2·arcsin(0,025/1)/θ_Res? (arredonda para baixo, nº inteiro)",
      answer: 2, tolerance: 0,
      hint:"2·arcsin(0,025) = 2·1,432° = 2,86° → divide por 1°/ponto e faz floor.",
      explain:"floor(2,86) = 2 pontos (na prática 3–4, porque o feixe não é pontual — slide 9). A 0,5 m seriam ~5-6 pontos: mais perto → mais pontos." },
    { kind:"mcq", q:"Qual é a ORDEM correta das etapas de deteção de outliers no laser (slide 7)?",
      options:["Proximidade → reflexão → dimensões","Fator de reflexão → dimensões do cluster → zona de proximidade probabilística","Dimensões → proximidade → reflexão","Qualquer ordem funciona igual"], answer:1,
      hint:"Da mais barata/grosseira para a mais fina.",
      explain:"1º corta-se pelo fator de reflexão (barato), 2º valida-se o tamanho do cluster, 3º o matching probabilístico com o mapa." },
    { kind:"mcq", q:"Porque é que o nº de pontos real é ligeiramente superior ao previsto por 2·arcsin(B_radius/r)/θ_Res?",
      options:["O beacon vibra","O feixe do laser não é exatamente pontual (tem largura) e apanha as bordas do beacon","Os encoders interferem","O modelo está errado"], answer:1,
      explain:"Slide 9: o feixe tem largura própria → raios que passariam 'de raspão' ainda refletem. O critério de validação deve tolerar essa folga." },
    { kind:"flash", front:"Escreve a fórmula BeaconPoints nas duas formas (deck e exame).", back:"Deck: n = 2·arcsin(B_radius/r)/θ_Res. Exame (P6): floor(arcsin(diam/dist)·N_raios/(2π)). São equivalentes: diam=2·B_radius, θ_Res=2π/N_raios. Treina a conversão!" }
  ]}
]},

/* ============ MÓDULO 4 — Validação probabilística e matching ============ */
{ id:"m5-mod4", title:"Validação probabilística: região χ² e validate_laser_measure", minutes:35, kind:"study",
  blurb:"Matching com o beacon mais provável, distância de Mahalanobis/χ², elipses no referencial global e os resultados ADIRA. Loc_Validation, págs. 11–15. ★ Pergunta 4 do exame.",
  pages:[
  { type:"theory", title:"A versão simples: validate_laser_measure ★",
    html:`<p>A forma mais direta de validar (a que o código da Lab 5 e a P4 do exame usam): comparar a <b>distância medida</b> com a <b>distância esperada</b> ao beacon conhecido, dentro de uma tolerância:</p>
    <pre><code>function validate_laser_measure(dist_medida, xB, yB: double): boolean;
begin
  dist_esperada := Dist(xB - x_e, yB - y_e);   // dist. da pose ESTIMADA ao beacon do mapa
  result := abs(dist_medida - dist_esperada) < TOL;   // ex.: TOL = 0.05 m
end;</code></pre>
    <div class="exam">P4 do exame: escrever/completar esta função. Os ingredientes: (1) distância esperada usa a pose ESTIMADA e a posição CONHECIDA do beacon no mapa; (2) valida se |medida − esperada| &lt; tolerância (ex.: 0,05 m). Sabe-a de cor, incluindo o abs().</div>
    <p>O mesmo teste pode (e deve) ser feito ao ângulo, com NormalizeAngle na diferença. Esta é a "zona de proximidade" da etapa 3 na versão determinística — a versão probabilística vem a seguir.</p>`,
    slideRef:"Loc_Validation, pág. 7 (etapa 3) + código Lab 5 + P4 do exame" },

  { type:"theory", title:"A versão probabilística: beacon mais provável + χ²",
    html:`<p>Slide 11 — a validação rigorosa usa a distribuição de probabilidade da observação:</p>
    <ol><li>Para cada observação, determina-se o <b>beacon mais provável</b> (o que minimiza a inovação normalizada)</li>
    <li>Com esse beacon, calcula-se a forma quadrática da inovação — a <b>distância de Mahalanobis</b>:</li></ol>
    <span class="formula">d² = (z − z_e)ᵀ · S⁻¹ · (z − z_e), &nbsp; com S = ∇h·P·∇hᵀ + R</span>
    <p>Se <code>d²</code> excede um valor crítico da <b>distribuição χ² com 2 graus de liberdade</b> (2 gdl porque z = [distância; ângulo]), a observação é <b>rejeitada</b>.</p>
    <div class="hl">Repara na elegância: o limiar adapta-se sozinho — se P é grande (pose incerta), S é grande e aceita-se mais; se P é pequena, o teste aperta. É a versão "inteligente" do TOL fixo de 0,05 m. E usa exatamente o S da P5 do exame!</div>`,
    figures:[{src:"assets/slides/validation/page-11.png", caption:"Loc_Validation, slide 11 — Região de validação probabilística", focus:"a forma quadrática com S⁻¹ e o limiar χ² com 2 graus de liberdade"}],
    slideRef:"Loc_Validation, pág. 11" },

  { type:"theory", title:"Elipses no referencial global e resultados ADIRA",
    html:`<p><b>Slides 12–13:</b> para <b>desenhar</b> a região de validação no mapa (elipses), converte-se a observação (distância, ângulo) para coordenadas cartesianas globais através de uma função g(z, X); a covariância resultante obtém-se propagando com o Jacobiano de g:</p>
    <span class="formula">Σ_global = ∇g · S · ∇gᵀ</span>
    <p>— cada beacon do mapa fica com uma <b>elipse de aceitação</b> à sua volta: observações fora da elipse são outliers (mesma lógica geométrica da P13!).</p>
    <p><b>Slides 14–15 — resultados no demonstrador Produtech/ADIRA</b> (robô industrial real), 3 testes comparados para posição E orientação:</p>
    <ul><li><b>test5</b> — SEM validação prévia: estimativa com saltos e erros grandes</li>
    <li><b>test6</b> — validação pelas <b>dimensões</b> dos beacons: já muito melhor</li>
    <li><b>test8</b> — dimensões <b>+ região probabilística</b>: a melhor estimativa, suave e precisa</li></ul>
    <div class="hl">Mensagem final do deck: cada camada de validação acrescenta robustez mensurável — no robô real a diferença entre test5 e test8 é a diferença entre inutilizável e industrial.</div>`,
    figures:[{src:"assets/slides/validation/page-13.png", caption:"Loc_Validation, slide 13 — Elipses de aceitação", focus:"cada beacon do mapa com a sua região esperada de observações — fora da elipse = outlier"},
             {src:"assets/slides/validation/page-14.png", caption:"Slide 14 — Resultados ADIRA (posição)", focus:"compara test5 (sem validação) com test8 (validação completa): a diferença na suavidade da estimativa"}],
    slideRef:"Loc_Validation, págs. 12–15" },

  { type:"quiz", title:"Avaliação final do módulo (formato exame)", questions:[
    { kind:"mcq", q:"[P4 exame] Na função validate_laser_measure, a medida é considerada válida quando:",
      options:["dist_medida < dist_esperada","abs(dist_medida − dist_esperada) < tolerância (ex.: 0,05 m), com a esperada calculada da pose estimada ao beacon do mapa","dist_medida > 0","O beacon está visível na câmara"], answer:1,
      hint:"Comparação com tolerância, e cuidado com o abs().",
      explain:"|medida − esperada| < TOL. A esperada usa a pose ESTIMADA e a posição CONHECIDA do beacon — nunca a pose real (não existe no robô!)." },
    { kind:"input", q:"Distância medida = 2,13 m; beacon do mapa a 2,06 m da pose estimada; TOL = 0,05 m. A medida é validada? (responde: sim ou nao)",
      answer:["nao","não"],
      hint:"|2,13 − 2,06| = 0,07 — compara com 0,05.",
      explain:"0,07 > 0,05 → rejeitada. Se TOL fosse 0,1 m seria aceite — a escolha da tolerância é o compromisso robustez/disponibilidade de medidas." },
    { kind:"mcq", q:"Na validação probabilística, porque se usa a distribuição χ² com 2 graus de liberdade?",
      options:["Porque há 2 beacons","Porque a observação tem 2 componentes (distância e ângulo) — a forma quadrática (z−z_e)ᵀS⁻¹(z−z_e) soma 2 gaussianas normalizadas","Porque o robô tem 2 rodas","Por convenção histórica"], answer:1,
      explain:"z∈ℝ² → a distância de Mahalanobis ao quadrado segue χ² com 2 gdl sob a hipótese de a medida ser válida." },
    { kind:"mcq", q:"Vantagem do limiar χ²/Mahalanobis sobre o TOL fixo de 0,05 m:",
      options:["É mais rápido de calcular","Adapta-se à incerteza: com P grande aceita mais (não mata a recuperação), com P pequena aperta o teste","Não precisa do mapa","Elimina o ruído do sensor"], answer:1,
      explain:"S = ∇hP∇hᵀ+R entra no teste — a região de aceitação cresce e encolhe com a incerteza da pose. O TOL fixo não sabe disso." },
    { kind:"flash", front:"Resultados ADIRA: ordena test5, test6, test8 e diz o que cada um valida.", back:"test5 = sem validação (pior); test6 = validação por dimensões dos beacons; test8 = dimensões + região probabilística (melhor). Cada camada de validação melhora posição E orientação." }
  ]}
]},

/* ============ MÓDULO 5 — O EKF no código SimTwo: ruído Q, R e P ============ */
{ id:"m5-mod5", title:"O EKF no código da Lab 5: qV, qOmega, rSensD, rSensA", minutes:30, kind:"study",
  blurb:"As fases do EKF no código SimTwo e a inicialização das covariâncias — a ponte direta para a Labwork 5, tarefa (c).",
  pages:[
  { type:"theory", title:"As fases do EKF no código da Lab 5",
    html:`<p>No código base da Lab 5 (SimTwo), o EKF que construíste em Matlab no M4 aparece assim (tarefa c do enunciado):</p>
    <ul><li><b>Fase de PREDIÇÃO:</b> procedimentos <code>PredictPosition(.)</code> e <code>EKF_MotionModel(.)</code> — o pose_update + a propagação de P com ∇f_X e ∇f_U</li>
    <li><b>Fase de ATUALIZAÇÃO:</b> procedimento <code>EKF_Update(.)</code> — z_e = h(X_e), S, ganho K, correção de X_e e P</li>
    <li>A chamada está em <code>LocationFromSensors</code> dentro do <code>Control()</code> (vem comentada — descomenta-la é a tarefa c)</li></ul>
    <div class="exam">O exame pergunta a que fase pertence cada procedimento: PredictPosition/EKF_MotionModel → predição; EKF_Update → atualização. Associação direta, memoriza os nomes.</div>
    <p>Compara o código com as equações dos slides do M4 — é o mesmo filtro, agora em Pascal e com o laser real a alimentar as observações validadas.</p>`,
    slideRef:"Enunciado Lab 5, tarefa (c) + código base SimTwo" },

  { type:"theory", title:"Inicializar o ruído: de desvios-padrão a covariâncias",
    html:`<p>A tarefa (c) pede para preencher, no <code>Initialize</code>:</p>
    <pre><code>qV     := lin_stddev * lin_stddev;       // variância do ruído de v  (modelo)
qOmega := omega_stddev * omega_stddev;   // variância do ruído de ω  (modelo)
rSensD := sensD_stddev * sensD_stddev;   // = 0.005² = 2.5E-5  (sensor, distância)
rSensA := sensA_stddev * sensA_stddev;   // = 0.009² = 8.1E-5  (sensor, ângulo)</code></pre>
    <div class="hl">Regra de ouro: as matrizes Q e R guardam <b>VARIÂNCIAS</b> (σ²), mas os enunciados dão <b>desvios-padrão</b> (σ). Elevar ao quadrado é o passo que toda a gente esquece — e que o exame explora.</div>
    <p><b>Afinar Q</b> (constantes lin_stddev/omega_stddev, testar 1E-6, 1E-2 e 1E-1 num quadrado completo):</p>
    <ul><li>Q minúsculo (1E-6): o filtro confia cegamente na odometria — reage tarde às medidas, estimativa "teimosa"</li>
    <li>Q enorme (1E-1): confia só nas medidas — estimativa nervosa, salta com o ruído do laser</li>
    <li>O bom valor equilibra velocidade de convergência e sensibilidade ao ruído (é a pergunta Q vs R outra vez!)</li></ul>
    <p><b>Inicializar P</b> (em ResetEstimation): i) cov(x)=cov(y)=1E-4, cov(θ)=3E-4 → correção inicial rápida; ii) 1E-8/3E-8 → o filtro "acredita" que já sabe a pose e demora muito mais a corrigir a estimativa inicial errada (0,05, 0,05).</p>`,
    slideRef:"Enunciado Lab 5, tarefa (c)" },

  { type:"quiz", title:"Avaliação final do módulo", questions:[
    { kind:"input", q:"Com sensD_stddev = 0,005 m, qual é o valor de rSensD (em notação tipo 2.5e-5)?",
      answer:["2.5e-5","0.000025","2.5e-05"],
      hint:"Variância = desvio-padrão ao quadrado.",
      explain:"0,005² = 2,5×10⁻⁵ m². E rSensA = 0,009² = 8,1×10⁻⁵ rad². Nunca entregues σ onde o filtro espera σ²!" },
    { kind:"mcq", q:"Com P inicial em 1E-8 (caso ii) e estimativa inicial errada, o que se observa?",
      options:["Convergência imediata","O filtro corrige muito devagar — P minúsculo diz-lhe que a pose 'já está certa' e o ganho K fica pequeno","O filtro diverge sempre","P não influencia nada"], answer:1,
      hint:"K = P∇hᵀS⁻¹ — o que acontece a K com P≈0?",
      explain:"P pequeno → K pequeno → correções fracas. Com P=1E-4/3E-4 a correção inicial é rápida. P inicial deve refletir a tua REAL incerteza." },
    { kind:"mcq", q:"Testando Q com 1E-6 vs 1E-1, qual é o comportamento esperado?",
      options:["1E-6: estimativa nervosa; 1E-1: teimosa","1E-6: confia na odometria (reage tarde às medidas); 1E-1: confia nas medidas (estimativa ruidosa/nervosa)","Não há diferença","1E-1 desliga o laser"], answer:1,
      explain:"Q pequeno = 'o meu modelo é ótimo' → ignora medidas; Q grande = 'o meu modelo é péssimo' → cola-se às medidas e ao ruído delas." },
    { kind:"flash", front:"PredictPosition, EKF_MotionModel, EKF_Update — associa às fases do EKF.", back:"PredictPosition + EKF_MotionModel = fase de PREDIÇÃO (motion model + propagação de P). EKF_Update = fase de ATUALIZAÇÃO (h, S, K, correção). Pergunta direta de exame." }
  ]}
]},

/* ============ MÓDULO 6 — Labwork 5 guiado ============ */
{ id:"m5-mod6", title:"Labwork 5 — EKF laser + validação no SimTwo (guiado)", minutes:75, kind:"labwork",
  blurb:"Resolução guiada da Lab 5: do FollowSquare só-odometria ao EKF robusto com beacons falsos.",
  pages:[
  { type:"theory", title:"Enquadramento e plataforma",
    html:`<p><b>Tema:</b> localização de um robô diferencial com <b>laser scan</b> e 3 beacons cilíndricos (Ø 5 cm) em (−0,3, 1,3), (1,3, 1,3) e (0,5, 0,3) — deteção, clustering, validação e EKF completo.</p>
    <p><b>Plataforma:</b> <b>SimTwo</b> — pasta <code>Lab_5/SimTwo64_LabWork__5_EKF_-_stud</code> (código base com as partes em falta; a versão completa está em <code>SimTwo64_LabWork__5_EKF</code> para conferires no fim).</p>
    <p><b>Geometria do laser (crucial para a tarefa b):</b></p>
    <ul><li>O vetor de dados começa na medida correspondente a <b>−180°</b>; passo entre raios = <b>1°</b></li>
    <li>O referencial do laser está <b>centrado e alinhado com o do robô</b> (X para a frente), mas a <b>14 cm</b> de distância (offset à frente do centro das rodas)</li></ul>
    <p><b>Módulos necessários:</b> todos os anteriores deste milestone + M4 completo (o EKF é o mesmo).</p>
    <p><b>Utilidades no código:</b> <code>Dist(x,y)</code> (distância à origem), <code>NormalizeAngle()</code>, estrutura <code>TClusterPos</code> e variáveis <code>BeaconCluster</code>/<code>BeaconPos</code>.</p>`,
    slideRef:"SAUT_LabWork_5_EKF_Beacons_SimTwo_V4_11Nov2024.pdf" },

  { type:"theory", title:"Enunciado e etapas — clica COMEÇAR",
    html:`<p>Tarefas do enunciado:</p>
    <ol><li><b>(a)</b> Estimação inicial = pose real (0, 0, 1,57) nas células (33,3)–(35,3); Global RESET → Chart ON → FollowSquare; observar real (vermelho) vs estimada (verde) <b>só com o motion model</b></li>
    <li><b>(b)</b> Implementar a deteção e validação dos beacons no ciclo do laser (<code>for i := firstRay to LastRay</code>); mostrar nas células (1,1)–(3,3) o nº de pontos por beacon e as coordenadas globais</li>
    <li><b>(c)</b> Descomentar <code>LocationFromSensors</code>; preencher qV, qOmega, rSensD, rSensA; estimação inicial ERRADA (0,05, 0,05, 1,57); afinar Q e comparar inicializações de P</li>
    <li><b>(d)</b> Inserir um beacon FALSO no editor de cena (Ctrl+S) e testar a robustez da validação</li>
    <li><b>(e)</b> Remover um dos 3 beacons e observar a evolução da estimação</li></ol>
    <p>Faz cada etapa no SimTwo antes de responder. Carrega em <b>Seguinte</b> para COMEÇAR.</p>`,
    slideRef:"Enunciado Lab 5" },

  { type:"labtask", title:"Sub-tarefa (a) — Só com o motion model",
    context:"<p>Correste o FollowSquare com a estimação inicial correta e SEM atualização por laser (só predição).</p>",
    q:"O que observas no gráfico ao completar o quadrado?",
    kind:"mcq",
    options:["As curvas real e estimada coincidem perfeitamente","A estimada (verde) afasta-se progressivamente da real (vermelha) — erro acumulado da odometria, pior nas curvas","A estimada fica parada","A real desaparece"],
    answer:1,
    hints:["É o dead-reckoning do M1 outra vez — o que acontece ao erro sem correção externa?","Presta atenção ao que acontece a cada canto do quadrado (rotações!)."],
    solution:"A estimativa diverge da real, sobretudo após as rotações nos cantos (Δθ grande → erro de discretização + derrapagem). É a demonstração visual de porque precisas do EKF: predição sem atualização acumula erro sem limite." },

  { type:"labtask", title:"Sub-tarefa (b1) — Do raio i ao ângulo do feixe",
    context:"<p>No ciclo do laser, cada índice i corresponde a um ângulo no referencial do laser. O vetor começa em −180° e o passo é 1°.</p>",
    q:"Qual é a expressão do ângulo do raio i (em graus) no referencial do laser?",
    kind:"mcq",
    options:["ang = i","ang = −180 + i·1","ang = 180 − i","ang = i·2π"],
    answer:1,
    hints:["'The laser data vector starts with a distance measure correspondent to −180º. The beam angle step is 1º.'"],
    solution:"ang = −180° + i (com i a começar em firstRay=0). Em radianos: −π + i·π/180. Para coordenadas globais: ângulo_global = NormalizeAngle(ang_laser + θ_estimado)." },

  { type:"labtask", title:"Sub-tarefa (b2) — Do feixe às coordenadas globais",
    context:"<p>Para converter a medida (i, d) em coordenadas globais, além do ângulo, há um detalhe geométrico do robô da Lab 5.</p>",
    q:"Que offset tens de somar, e onde, ao converter para o referencial global?",
    kind:"mcq",
    options:["Nenhum — o laser está no centro do robô","O laser está 14 cm à frente do centro das rodas: primeiro calcula o ponto no referencial do robô (x=0,14+d·cos(ang), y=d·sin(ang)) e só depois rodas/transladas para o global com a pose estimada","Soma-se 14 cm à distância d diretamente","Subtrai-se 14 cm ao y global"],
    answer:1,
    hints:["O offset é no eixo X do ROBÔ (para a frente), não na distância medida nem no referencial global.","Ordem: ref. laser → ref. robô (somar 0,14 em x) → ref. global (rotação por θ_e + translação por (x_e, y_e))."],
    solution:"Ponto no ref. do robô: (0,14 + d·cos(ang), d·sin(ang)); depois global: x_g = x_e + px·cos(θ_e) − py·sin(θ_e), y_g = y_e + px·sin(θ_e) + py·cos(θ_e). Esquecer o offset de 14 cm desloca TODOS os beacons detetados 14 cm — a validação rejeita tudo e o EKF nunca atualiza." },

  { type:"labtask", title:"Sub-tarefa (b3) — Clustering e contagem",
    context:"<p>Agrupas os pontos consecutivos com alta reflexão em clusters (BeaconCluster) e mostras o nº de pontos por beacon nas células (1,1)–(3,3). O robô está a ~0,5 m de um beacon (Ø 5 cm, passo 1°).</p>",
    q:"Quantos pontos esperas nesse cluster segundo o modelo n = 2·arcsin(0,025/0,5)/1°? (nº inteiro, floor)",
    kind:"input", answer: 5, tolerance: 1,
    hints:["arcsin(0,05) = 2,866° → ×2 = 5,73°.","floor(5,73/1) = 5 (na prática 6–7, feixe não pontual)."],
    solution:"n = 2·arcsin(0,025/0,5)/1° = 5,73 → <b>5 pontos</b> (aceita-se 4–6 pela largura do feixe). Usa esta contagem esperada como critério: clusters com nº de pontos incompatível com a distância → rejeitados (etapa 2 da validação)." },

  { type:"labtask", title:"Sub-tarefa (c1) — Preencher o ruído",
    context:"<p>No Initialize, com sensD_stddev = 0,005 m e sensA_stddev = 0,009 rad definidos no const.</p>",
    q:"Escreve a linha do rSensA (formato: rSensA:=sensA_stddev*sensA_stddev):",
    kind:"input",
    answer:["rsensa:=sensa_stddev*sensa_stddev","rsensa:=sensa_stddev^2","rsensa:=sqr(sensa_stddev)"],
    hints:["R guarda variâncias — quadrado do desvio-padrão.","Em Pascal: sqr(x) ou x*x."],
    solution:"<code>rSensA := sensA_stddev * sensA_stddev;</code> (= 8,1E-5). Igual para rSensD (2,5E-5), qV e qOmega com lin_stddev/omega_stddev. σ → σ², sempre." },

  { type:"labtask", title:"Sub-tarefa (c2) — Afinar Q e P",
    context:"<p>Com a estimação inicial ERRADA (0,05, 0,05, 1,57), testaste Q ∈ {1E-6, 1E-2, 1E-1} e P inicial nos casos i) 1E-4/3E-4 e ii) 1E-8/3E-8.</p>",
    q:"Qual é a combinação que converge mais depressa para a pose real SEM ficar ruidosa?",
    kind:"mcq",
    options:["Q=1E-6 com P=1E-8 (tudo mínimo)","Q intermédio (1E-2) com P=1E-4/3E-4 — P realista permite a correção inicial e Q equilibra modelo vs medidas","Q=1E-1 com P=1E-8","Qualquer uma — as covariâncias são decorativas"],
    answer:1,
    hints:["P inicial minúsculo com estimativa errada = filtro 'convencido' do erro (K pequeno).","Q enorme = estimativa nervosa; Q minúsculo = correção lenta."],
    solution:"P=1E-4/3E-4 (reflete a incerteza real da estimativa errada) + Q intermédio. Observa no SimTwo: com ii) a correção inicial é visivelmente mais lenta; com Q=1E-1 a estimativa treme com o ruído do laser. É a matéria Q vs R do exame em ação." },

  { type:"labtask", title:"Sub-tarefa (d) — Beacon falso",
    context:"<p>Inseriste no editor de cena (Ctrl+S) o cilindro 'BeaconFalse' (Ø 10 cm!) em (1,4, 1, 0,2) e correste o FollowSquare.</p>",
    q:"Com o módulo de validação bem implementado, o que acontece?",
    kind:"mcq",
    options:["O EKF diverge de imediato","O beacon falso é rejeitado (dimensões erradas p/ a distância e/ou fora da zona de proximidade dos beacons do mapa) e a estimativa mantém-se correta","O robô para com alarme obrigatoriamente","O beacon falso substitui o mais próximo"],
    answer:1,
    hints:["Dois filtros apanham-no: Ø 10 cm ≠ 5 cm → nº de pontos ~dobro do esperado; e (1,4, 1) não está na zona de nenhum beacon do mapa.","Sem validação, o que aconteceria? Experimenta comentar a validação e vê!"],
    solution:"A validação rejeita-o: o cluster tem ~2× mais pontos do que um beacon de 5 cm àquela distância (etapa 2) e a posição não faz matching com nenhum beacon do mapa (etapa 3 / validate_laser_measure). Teste extra instrutivo: desliga a validação e observa o EKF a ser arrastado — é o test5 vs test8 da ADIRA em miniatura." },

  { type:"labtask", title:"Sub-tarefa (e) — Remover um beacon",
    context:"<p>Removeste um dos 3 beacons da cena e correste o percurso completo.</p>",
    q:"O que acontece à estimação do EKF?",
    kind:"mcq",
    options:["Deixa de funcionar por completo","Continua a funcionar com os 2 beacons restantes, mas com correções menos frequentes e P maior (pior em certas direções/zonas do percurso)","Fica melhor — menos dados, menos ruído","O robô para"],
    answer:1,
    hints:["O EKF atualiza com as medidas que TEM — menos beacons = menos correções, não zero correções.","Pensa na geometria: em certas zonas do quadrado o robô pode ficar temporariamente sem ver nenhum beacon."],
    solution:"Degradação graciosa: com 2 beacons o filtro corrige menos vezes e a incerteza cresce mais entre correções — nota o erro maior nos troços onde o beacon removido era o mais visível. É a 'indisponibilidade temporária' da localização absoluta (M4.6): a odometria aguenta o barco até à próxima medida válida.<br><br>🏁 <b>Labwork 5 concluída!</b> Dominaste o pipeline completo: laser → deteção → validação → EKF. Desbloqueaste o <b>M6 — Localização avançada</b> (Monte Carlo + map matching), onde a rejeição de outliers do módulo 2 volta em força. As funções validate_laser_measure e BeaconPoints (P4 e P6) devem sair-te DE COR — escreve-as em papel uma última vez antes de avançar." },
  { type:"labtask", kind:"code",
    title:"💾 Guarda o teu código da Lab 5",
    context:"<p>Cola o teu ciclo de deteção/validação dos beacons (laser), os parâmetros de ruído do Initialize e alterações ao EKF_Update. Fica guardado neste milestone — consultável em <b>M5 → 📄 O teu código guardado</b>.</p>",
    q:"Snippet da Lab 5 (Pascal/SimTwo):" }

]}
]};
