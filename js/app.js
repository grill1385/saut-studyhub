/* ===== SAUT StudyHub — motor v3 (códigos de referência + Stats + Grafo) ===== */
(function(){
"use strict";
const META = window.SAUT_META, CONTENT = window.SAUT_CONTENT || {};
const TOPICS = window.SAUT_TOPICS || [], GRAPH = window.SAUT_GRAPH || {nodes:[],links:[]};
const LSKEY = "saut_progress_v1";
const $ = s => document.querySelector(s);
const app = $("#app");

/* ---------- estado ---------- */
let S = load();
function load(){
  try{ const j = JSON.parse(localStorage.getItem(LSKEY)); if(j && j.milestones) return j; }catch(e){}
  return { activeMilestone:"m0", freeMode:false, milestones:{} };
}
function save(){ localStorage.setItem(LSKEY, JSON.stringify(S)); }
function msState(id){ S.milestones[id] = S.milestones[id] || {completed:false, modules:{}}; return S.milestones[id]; }
function modState(msId, modId){
  const ms = msState(msId);
  ms.modules[modId] = ms.modules[modId] || {page:0, seen:[], quiz:{}, completed:false};
  return ms.modules[modId];
}

/* ---------- helpers de progresso ---------- */
function getModules(msId){ return (CONTENT[msId] && CONTENT[msId].modules) || []; }
function isStub(msId){ return getModules(msId).length === 0; }
function moduleById(modId){
  for(const m of META){ const mods = getModules(m.id); const mi = mods.findIndex(x=>x.id===modId);
    if(mi>=0) return {msId:m.id, ms:m, mod:mods[mi], mi}; }
  return null;
}
function pageQuizIds(page, pi){
  if(page.type === "quiz") return page.questions.map((q,qi)=>`p${pi}q${qi}`);
  if(page.type === "labtask") return [`p${pi}q0`];
  return [];
}
function modProgress(msId, mod){
  const st = modState(msId, mod.id);
  let total = 0, done = 0;
  mod.pages.forEach((pg,pi)=>{
    total++; if(st.seen.includes(pi)) done++;
    pageQuizIds(pg,pi).forEach(qid=>{ total++; if(st.quiz[qid] && st.quiz[qid].ok) done++; });
  });
  return total? done/total : 0;
}
function modComplete(msId, mod){
  const st = modState(msId, mod.id);
  for(let pi=0; pi<mod.pages.length; pi++){
    if(!st.seen.includes(pi)) return false;
    for(const qid of pageQuizIds(mod.pages[pi],pi)) if(!(st.quiz[qid] && st.quiz[qid].ok)) return false;
  }
  return true;
}
function msProgress(msId){
  const mods = getModules(msId); if(!mods.length) return 0;
  return mods.reduce((a,m)=>a+modProgress(msId,m),0)/mods.length;
}
function msComplete(msId){
  const mods = getModules(msId);
  return mods.length>0 && mods.every(m=>modComplete(msId,m));
}
function refreshCompletion(){
  META.forEach(m=>{ msState(m.id).completed = msComplete(m.id); });
  save();
}
function msUnlocked(idx){
  if(S.freeMode || idx===0) return true;
  return msState(META[idx-1].id).completed;
}
function modUnlocked(msId, mi){
  if(S.freeMode || mi===0) return true;
  const mods = getModules(msId);
  return modComplete(msId, mods[mi-1]);
}

/* ---------- códigos de referência ---------- */
function codeMs(m){ return m.num; }                                  // M4
function codeMod(m, mi){ return `${m.num}.${mi+1}`; }                // M4.3
function codePage(m, mi, pi){ return `${m.num}.${mi+1}.${pi+1}`; }   // M4.3.2
function codeQ(m, mi, pi, qi){ return `${codePage(m,mi,pi)}-Q${qi+1}`; } // M4.3.2-Q1
function chip(code, title){ return `<span class="code-chip" data-code="${code}" title="${title||"Clica para copiar — usa este código para me pedires explicações"}">#${code}</span>`; }
function copyText(t){
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).catch(()=>fallbackCopy(t)); }
  else fallbackCopy(t);
}
function fallbackCopy(t){
  const ta = document.createElement("textarea"); ta.value = t; ta.style.position="fixed"; ta.style.opacity="0";
  document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); }catch(e){} ta.remove();
}
function bindChips(root){
  (root||document).querySelectorAll(".code-chip").forEach(c=>{
    c.onclick = e=>{ e.stopPropagation(); copyText(c.dataset.code);
      const old = c.textContent; c.textContent = "✓ copiado"; c.classList.add("copied");
      setTimeout(()=>{ c.textContent = old; c.classList.remove("copied"); }, 1200); };
  });
}

/* ---------- router ---------- */
window.addEventListener("hashchange", route);
function nav(h){ location.hash = h; }
function route(){
  hideSearch();
  const p = location.hash.replace(/^#\/?/,"").split("/").filter(Boolean);
  refreshCompletion();
  if(p.length===0) return renderDashboard();
  if(p[0]==="stats") return renderStats();
  if(p[0]==="graph") return renderGraph();
  if(p.length===1) return renderMilestone(p[0]);
  if(p[1]==="mod" && p[2]) return renderModule(p[0], p[2]);
  renderDashboard();
}

/* ---------- dashboard ---------- */
const PRIO_CLR = {"ALTA+":"var(--p-altaplus)","ALTA":"var(--p-alta)","MÉDIA-ALTA":"var(--p-medalta)","MÉDIA":"var(--p-media)","BAIXA-MÉDIA":"var(--p-baixamedia)","BAIXA":"var(--p-baixa)"};
function renderDashboard(){
  const globalPct = Math.round(META.reduce((a,m)=>a+msProgress(m.id),0)/META.length*100);
  let cards = META.map((m,idx)=>{
    const unlocked = msUnlocked(idx), done = msState(m.id).completed;
    const pct = Math.round(msProgress(m.id)*100);
    const stub = isStub(m.id);
    const icon = done? "✅" : (!unlocked? "🔒" : (m.id===S.activeMilestone? "▶️" : ""));
    return `<div class="ms-card ${unlocked?"":"locked"} ${m.id===S.activeMilestone?"active-ms":""}" data-ms="${m.id}" data-locked="${!unlocked}">
      <span class="state-icon">${icon}</span>
      <div class="ms-num">${m.num} · ${m.tempo} ${chip(codeMs(m))}</div>
      <h3>${m.title}</h3>
      <div class="desc">${m.short}${stub? " <i>(conteúdo em construção)</i>":""}</div>
      <span class="badge" style="background:${PRIO_CLR[m.prio]}">${m.prio}</span>
      ${!unlocked? '<span class="badge lock">bloqueado</span>':""}
      <div class="mini-bar"><div style="width:${pct}%"></div></div>
      <div class="mini-label">${pct}% concluído</div>
    </div>`;
  }).join("");
  app.innerHTML = `<div class="hero">
      <h1>Sistemas Autónomos — Época Especial</h1>
      <p>8 milestones · 16 conjuntos de slides · 7 Lab Works. Segue a ordem; os temas <b style="color:var(--p-altaplus)">ALTA+</b>/<b style="color:var(--p-alta)">ALTA</b> são os que mais caem no exame.</p>
      <div class="global-bar"><div style="width:${globalPct}%"></div></div>
      <div class="mini-label">Progresso global: ${globalPct}% · <a class="inline-link" href="#/stats">📊 ver stats</a> · <a class="inline-link" href="#/graph">🕸 grafo de conhecimento</a></div>
    </div>
    <div class="ms-grid">${cards}</div>
    <p class="mini-label" style="margin-top:1rem">💬 Dúvidas? Cada milestone, módulo, subpágina e exercício tem um código (ex.: <b>#M4.3.2-Q1</b>). Clica no código para copiar e cola-o num chat com o Claude para pedires uma explicação.</p>`;
  app.querySelectorAll(".ms-card").forEach(c=>{
    c.onclick = ()=>{
      if(c.dataset.locked==="true"){ toast(c, "Completa o milestone anterior primeiro (ou ativa o Modo livre em ⚙)."); return; }
      S.activeMilestone = c.dataset.ms; save(); nav("#/"+c.dataset.ms);
    };
  });
  bindChips(app);
}
function toast(el,msg){ el.animate([{outline:"2px solid var(--err)"},{outline:"none"}],{duration:900}); const d=document.createElement("div"); d.className="mini-label"; d.style.color="var(--err)"; d.textContent=msg; el.appendChild(d); setTimeout(()=>d.remove(),2600); }

/* ---------- página de milestone ---------- */
function renderMilestone(msId){
  const idx = META.findIndex(m=>m.id===msId);
  if(idx<0) return renderDashboard();
  if(!msUnlocked(idx) ){ nav("#/"); return; }
  const m = META[idx], mods = getModules(msId);
  S.activeMilestone = msId; save();

  if(!mods.length){
    app.innerHTML = crumb(m)+`<div class="panel congrats"><span class="emoji">🚧</span>
      <h3>Conteúdo em construção</h3><p>Os módulos deste milestone ainda vão ser gerados numa próxima sessão de trabalho.<br>Consulta o plano em <code>PLANO_IMPLEMENTACAO.md</code>.</p>
      ${msPanel(m)}</div>`;
    return;
  }

  const segs = mods.map((mod,mi)=>{
    const p = Math.round(modProgress(msId,mod)*100);
    return `<div class="seg ${mod.kind==="labwork"?"lab":""}" data-mi="${mi}" title="${mod.title}">
      <div class="fill" style="transform:scaleX(${p/100})"></div></div>`;
  }).join("");

  let resumeBtn = "";
  const firstIncomplete = mods.find(mo=>!modComplete(msId,mo));
  if(firstIncomplete){
    const st = modState(msId, firstIncomplete.id);
    resumeBtn = `<button class="btn primary big-cta" id="btn-resume">▶ ${st.seen.length? "Continuar onde ficaste":"Começar o progresso"} — ${firstIncomplete.title}</button>`;
  } else {
    resumeBtn = `<div class="congrats"><span class="emoji">🏆</span><h3>Milestone completo!</h3>
      ${idx<META.length-1? `<p>Desbloqueaste o ${META[idx+1].num} — ${META[idx+1].title}.</p><button class="btn ok big-cta" onclick="location.hash='#/${META[idx+1].id}'">Ir para ${META[idx+1].num} →</button>`:"<p>Terminaste todos os milestones. Boa sorte no exame! 🎓</p>"}</div>`;
  }

  const list = mods.map((mod,mi)=>{
    const unlocked = modUnlocked(msId,mi), done = modComplete(msId,mod);
    const st = modState(msId,mod.id);
    const pct = Math.round(modProgress(msId,mod)*100);
    const ico = mod.kind==="labwork"? "🧪" : "📖";
    return `<div class="mod-item ${unlocked?"":"locked"} ${done?"done":""} ${mod.kind==="labwork"?"lab":""}" data-mod="${mod.id}" data-locked="${!unlocked}">
      <span class="mod-ico">${done?"✅":ico}</span>
      <div class="mod-info"><b>${mi+1}. ${mod.title} ${chip(codeMod(m,mi))}</b><span>~${mod.minutes} min · ${mod.pages.length} subpáginas</span></div>
      <span class="mod-state">${done? "Concluído" : unlocked? (st.seen.length? pct+"% — pág. "+(st.page+1) : "Por começar") : "🔒 Bloqueado"}</span>
    </div>`;
  }).join("");

  app.innerHTML = crumb(m) + `
    <div class="ms-head"><div><h1>${m.num} — ${m.title} ${chip(codeMs(m))}</h1>
      <div class="meta-row"><span>⏱ ${m.tempo}</span><span class="badge" style="background:${PRIO_CLR[m.prio]}">${m.prio}</span></div></div>
      <input id="ms-search" type="search" placeholder="Pesquisar neste milestone…" style="padding:.5rem .9rem;border-radius:20px;border:1px solid var(--border);background:var(--panel);color:var(--txt);width:260px">
    </div>
    <div id="ms-search-out"></div>
    ${msPanel(m)}
    <div class="panel"><h4>Progresso de estudo</h4>
      <div class="seg-bar">${segs}</div><div class="seg-tip" id="seg-tip">Passa o rato sobre a barra para veres o conteúdo de cada módulo.</div>
      <div class="center">${resumeBtn}</div></div>
    <div class="panel"><h4>Módulos</h4><div class="mod-list">${list}</div></div>`;

  app.querySelectorAll(".seg").forEach(sg=>{
    sg.onmouseenter = ()=>{ const mo=mods[+sg.dataset.mi]; $("#seg-tip").innerHTML = `<b>${mo.title}</b> — ${mo.blurb||""} <i>(${Math.round(modProgress(msId,mo)*100)}%)</i>`; };
    sg.onclick = ()=>{ if(modUnlocked(msId,+sg.dataset.mi)) nav(`#/${msId}/mod/${mods[+sg.dataset.mi].id}`); };
  });
  app.querySelectorAll(".mod-item").forEach(it=>{
    it.onclick = ()=>{ if(it.dataset.locked==="true"){ toast(it,"Completa o módulo anterior primeiro (ou Modo livre em ⚙)."); return; } nav(`#/${msId}/mod/${it.dataset.mod}`); };
  });
  const rb = $("#btn-resume");
  if(rb && firstIncomplete) rb.onclick = ()=>nav(`#/${msId}/mod/${firstIncomplete.id}`);
  const msi = $("#ms-search");
  if(msi) msi.oninput = ()=>renderSearch(msi.value, msId, $("#ms-search-out"));
  bindChips(app);
}
function crumb(m){ return `<div class="crumbs"><a onclick="location.hash='#/'">Dashboard</a> / ${m? m.num+" — "+m.title : ""}</div>`; }
function msPanel(m){
  return `<div class="panel"><h4>Sobre este milestone</h4>
    <p><b>Lab Work:</b> ${m.lab}</p><p><b>Objetivo:</b> ${m.objetivo}</p>
    <p><b>Slides:</b></p><ul>${m.decks.map(d=>`<li>${d}</li>`).join("")}</ul>
    <p class="exam" style="margin-top:.6rem">${m.exame}</p></div>`;
}

/* ---------- viewer de módulo ---------- */
function renderModule(msId, modId){
  const m = META.find(x=>x.id===msId); if(!m) return renderDashboard();
  const mods = getModules(msId);
  const mi = mods.findIndex(x=>x.id===modId); if(mi<0) return renderMilestone(msId);
  const mod = mods[mi];
  const st = modState(msId, modId);
  if(st.page >= mod.pages.length) st.page = mod.pages.length-1;
  drawPage();

  function drawPage(){
    const pi = st.page, pg = mod.pages[pi];
    if(!st.seen.includes(pi)) st.seen.push(pi);
    save();

    const dots = mod.pages.map((p,i)=>{
      const qids = pageQuizIds(p,i);
      const okq = qids.length && qids.every(q=>st.quiz[q]&&st.quiz[q].ok);
      return `<span class="pdot ${st.seen.includes(i)?"seen":""} ${okq?"okq":""} ${i===pi?"cur":""}" data-i="${i}" title="${p.title||"pág. "+(i+1)} (#${codePage(m,mi,i)})"></span>`;
    }).join("");

    let body = "";
    if(pg.type==="theory") body = theoryHTML(pg, pi);
    else if(pg.type==="quiz") body = quizHTML(pg, pi);
    else if(pg.type==="labtask") body = labtaskHTML(pg, pi);

    const done = modComplete(msId,mod);
    app.innerHTML = crumb(m) + `
      <div class="viewer-head">
        <h2>${mod.kind==="labwork"?"🧪":"📖"} ${mod.title} ${chip(codeMod(m,mi))}</h2>
        <span class="page-ind">Subpágina ${pi+1} / ${mod.pages.length} · ~${mod.minutes} min · ${chip(codePage(m,mi,pi))}</span>
      </div>
      <div class="page-dots">${dots}</div>
      <div class="page-box">${body}</div>
      <div class="pager">
        <button class="btn" id="pg-prev" ${pi===0?"disabled":""}>← Anterior</button>
        <div class="mid">${done? "✅ Módulo concluído" : "Vê todas as páginas e acerta todos os exercícios para concluir."}</div>
        ${pi===mod.pages.length-1
          ? `<button class="btn ${done?"ok":""}" id="pg-finish">${done? "Terminar módulo ✓":"Voltar ao milestone"}</button>`
          : `<button class="btn primary" id="pg-next">Seguinte →</button>`}
      </div>`;

    $("#pg-prev").onclick = ()=>{ if(st.page>0){ st.page--; save(); drawPage(); } };
    const nx = $("#pg-next"); if(nx) nx.onclick = ()=>{ st.page++; save(); drawPage(); };
    const fin = $("#pg-finish"); if(fin) fin.onclick = ()=>{ refreshCompletion(); nav("#/"+msId); };
    app.querySelectorAll(".pdot").forEach(d=> d.onclick = ()=>{ st.page=+d.dataset.i; save(); drawPage(); });
    app.querySelectorAll(".figure img").forEach(im=> im.onclick = ()=> im.classList.toggle("zoomed"));
    bindQuiz(pg, pi);
    bindChips(app);
  }

  /* ----- html builders ----- */
  function theoryHTML(pg, pi){
    const figs = (pg.figures||[]).map(f=>`<div class="figure"><img src="${f.src}" alt="">
      <div class="cap">${f.caption||""}</div>${f.focus? `<div class="focus">${f.focus}</div>`:""}</div>`).join("");
    return `<h3>${pg.title}</h3>${pg.html||""}${figs}${pg.slideRef? `<div class="slide-ref">📄 Fonte: ${pg.slideRef}</div>`:""}`;
  }
  function quizHTML(pg, pi){
    const qs = pg.questions.map((q,qi)=>{
      const qid = `p${pi}q${qi}`, stq = st.quiz[qid]||{};
      const qc = chip(codeQ(m,mi,pi,qi));
      if(q.kind==="mcq"){
        return `<div class="q-block" data-qid="${qid}" data-qi="${qi}"><div class="q-txt">${qi+1}. ${q.q} ${qc}</div>
          <div class="q-opts">${q.options.map((o,oi)=>`<div class="q-opt ${stq.ok&&oi===q.answer?"right":""}" data-oi="${oi}">${String.fromCharCode(65+oi)}) ${o}</div>`).join("")}</div>
          <div class="q-actions">${q.hint?`<button class="btn small q-hint">💡 Dica</button>`:""}</div>
          <div class="q-feedzone">${stq.ok?`<div class="q-feed good">✔ Correto. ${q.explain||""}</div>`:""}</div></div>`;
      }
      if(q.kind==="input"){
        return `<div class="q-block" data-qid="${qid}" data-qi="${qi}"><div class="q-txt">${qi+1}. ${q.q} ${qc}</div>
          <div class="q-input"><input type="text" ${stq.ok?"disabled":""} value="${stq.ok?(stq.val??q.answer):""}" placeholder="resposta…">
          <span class="q-unit">${q.unit||""}</span><button class="btn small primary q-check" ${stq.ok?"disabled":""}>Verificar</button>
          ${q.hint?`<button class="btn small q-hint">💡 Dica</button>`:""}</div>
          <div class="q-feedzone">${stq.ok?`<div class="q-feed good">✔ Correto. ${q.explain||""}</div>`:""}</div></div>`;
      }
      return `<div class="q-block" data-qid="${qid}" data-qi="${qi}"><div class="q-txt">${qi+1}. Flashcard — recall ativo ${qc}</div>
        <div class="flash"><div class="card-face"><div><span class="lbl">${stq.flipped?"RESPOSTA":"PERGUNTA (clica para virar)"}</span>${stq.flipped? q.back : q.front}</div></div></div>
        <div class="q-actions ${stq.flipped?"":"hidden"}">
          <button class="btn small ok f-ok" ${stq.ok?"disabled":""}>${stq.ok?"✔ Sabia":"Acertei"}</button>
          <button class="btn small f-no">Falhei — rever depois</button></div>
        <div class="q-feedzone"></div></div>`;
    }).join("");
    return `<h3>${pg.title||"Avaliação contínua"}</h3><p style="color:var(--muted)">Responde para consolidar. Precisas de acertar tudo para concluir o módulo.</p>${qs}`;
  }
  function labtaskHTML(pg, pi){
    const qid = `p${pi}q0`, stq = st.quiz[qid]||{};
    const qc = chip(codeQ(m,mi,pi,0));
    let inputArea;
    if(pg.kind==="mcq"){
      inputArea = `<div class="q-opts">${pg.options.map((o,oi)=>`<div class="q-opt ${stq.ok&&oi===pg.answer?"right":""}" data-oi="${oi}">${String.fromCharCode(65+oi)}) ${o}</div>`).join("")}</div>`;
    } else {
      inputArea = `<div class="q-input"><input type="text" ${stq.ok?"disabled":""} value="${stq.ok?(stq.val??pg.answer):""}" placeholder="o teu input…">
        <span class="q-unit">${pg.unit||""}</span><button class="btn small primary q-check" ${stq.ok?"disabled":""}>Submeter</button></div>`;
    }
    return `<h3>${pg.title}</h3>
      ${pg.context? `<div class="labctx">${pg.context}</div>`:""}
      <div class="q-block" data-qid="${qid}" data-qi="0" data-labtask="1">
        <div class="q-txt">${pg.q} ${qc}</div>${inputArea}
        <div class="q-actions">
          <button class="btn small q-hint">💡 Dica</button>
          <button class="btn small danger q-sol">SOLUÇÃO DIRETA</button>
        </div>
        <div class="q-feedzone">${stq.ok?`<div class="q-feed good">✔ ${stq.viaSolution?"Resolvido com solução direta.":"Correto!"} </div>${pg.solution?`<div class="q-feed hint">${pg.solution}</div>`:""}`:""}</div>
      </div>`;
  }

  /* ----- interação quiz ----- */
  function bindQuiz(pg, pi){
    app.querySelectorAll(".q-block").forEach(blk=>{
      const qid = blk.dataset.qid, qi = +blk.dataset.qi;
      const isLab = blk.dataset.labtask==="1";
      const q = isLab? pg : pg.questions[qi];
      const fz = blk.querySelector(".q-feedzone");
      const hints = isLab? (q.hints||[]) : (q.hint? [q.hint]:[]);
      let hintIdx = st.quiz[qid]?.hints||0;

      blk.querySelectorAll(".q-opt").forEach(opt=>{
        opt.onclick = ()=>{
          if(st.quiz[qid]?.ok) return;
          const oi = +opt.dataset.oi;
          blk.querySelectorAll(".q-opt").forEach(o=>o.classList.remove("sel"));
          opt.classList.add("sel");
          if(oi === q.answer){
            st.quiz[qid] = Object.assign({},st.quiz[qid],{ok:true}); save();
            opt.classList.add("right");
            fz.innerHTML = `<div class="q-feed good">✔ Correto! ${q.explain||""}</div>${isLab&&q.solution?`<div class="q-feed hint">${q.solution}</div>`:""}`;
            refreshCompletion();
          } else {
            opt.classList.add("wrong");
            const h = hints[Math.min(hintIdx, hints.length-1)];
            fz.innerHTML = `<div class="q-feed bad">✘ Não é essa. ${h? "💡 "+h : "Tenta outra vez."}</div>`;
            hintIdx++; st.quiz[qid] = Object.assign({},st.quiz[qid],{ok:false,hints:hintIdx}); save();
          }
        };
      });
      const chk = blk.querySelector(".q-check");
      if(chk) chk.onclick = ()=>{
        const inp = blk.querySelector("input");
        const val = inp.value.trim();
        let ok = false;
        if(typeof q.answer === "number"){
          const num = parseFloat(val.replace(",","."));
          ok = !isNaN(num) && Math.abs(num - q.answer) <= (q.tolerance||0);
        } else {
          const norm = s => String(s).toLowerCase().replace(/\s+/g,"").replace(/[;.]$/,"");
          const answers = Array.isArray(q.answer)? q.answer : [q.answer];
          ok = answers.some(a=>norm(val)===norm(a));
        }
        if(ok){
          st.quiz[qid] = {ok:true, val:inp.value.trim()}; save();
          inp.disabled = true; chk.disabled = true;
          fz.innerHTML = `<div class="q-feed good">✔ Correto! ${q.explain||""}</div>${isLab&&q.solution?`<div class="q-feed hint">${q.solution}</div>`:""}`;
          refreshCompletion();
        } else {
          const h = hints[Math.min(hintIdx, hints.length-1)];
          fz.innerHTML = `<div class="q-feed bad">✘ Não está certo. ${h? "💡 "+h : "Revê a página anterior."}</div>`;
          hintIdx++; st.quiz[qid] = Object.assign({},st.quiz[qid],{ok:false,hints:hintIdx}); save();
        }
      };
      const inp0 = blk.querySelector("input");
      if(inp0 && chk) inp0.onkeydown = e=>{ if(e.key==="Enter") chk.click(); };
      const hb = blk.querySelector(".q-hint");
      if(hb) hb.onclick = ()=>{
        const h = hints[Math.min(hintIdx, hints.length-1)] || "Sem mais dicas — revê a teoria.";
        fz.innerHTML = `<div class="q-feed hint">💡 ${h}</div>`;
        hintIdx++; st.quiz[qid] = Object.assign({ok:false},st.quiz[qid],{hints:hintIdx}); save();
      };
      const sb = blk.querySelector(".q-sol");
      if(sb) sb.onclick = ()=>{
        st.quiz[qid] = {ok:true, viaSolution:true}; save(); refreshCompletion();
        renderModule(msId, modId);
      };
      const fl = blk.querySelector(".flash");
      if(fl) fl.onclick = ()=>{
        st.quiz[qid] = Object.assign({ok:false},st.quiz[qid]); st.quiz[qid].flipped = !st.quiz[qid].flipped; save();
        renderModule(msId, modId);
      };
      const fok = blk.querySelector(".f-ok");
      if(fok) fok.onclick = e=>{ e.stopPropagation(); st.quiz[qid]=Object.assign({},st.quiz[qid],{ok:true}); save(); refreshCompletion(); renderModule(msId,modId); };
      const fno = blk.querySelector(".f-no");
      if(fno) fno.onclick = e=>{ e.stopPropagation(); st.quiz[qid]=Object.assign({},st.quiz[qid],{ok:false,flipped:false}); save(); fz.innerHTML=`<div class="q-feed hint">Sem stress — volta a este flashcard antes de terminar o módulo (tens de o marcar como sabido para concluir).</div>`; };
    });
  }
}

/* ---------- STATS ---------- */
function statsXP(){
  let pages=0, quizOk=0, modsDone=0, msDone=0, flash=0, labs=0;
  META.forEach(m=>{
    const mods = getModules(m.id);
    mods.forEach(mod=>{
      const st = modState(m.id, mod.id);
      pages += st.seen.length;
      mod.pages.forEach((pg,pi)=>pageQuizIds(pg,pi).forEach(qid=>{ if(st.quiz[qid]&&st.quiz[qid].ok){ quizOk++; if(pg.type==="quiz"&&pg.questions[+qid.split("q")[1]]?.kind==="flash") flash++; } }));
      if(modComplete(m.id,mod)){ modsDone++; if(mod.kind==="labwork") labs++; }
    });
    if(msState(m.id).completed) msDone++;
  });
  const xp = pages*10 + quizOk*25 + modsDone*100 + msDone*400;
  const level = Math.floor(Math.sqrt(xp/120)) + 1;
  const nextXp = 120*Math.pow(level,2);
  return {pages, quizOk, modsDone, msDone, labs, xp, level, nextXp};
}
function topicPct(t){
  if(t.ms) return isStub(t.ms)? null : Math.round(msProgress(t.ms)*100);
  let sum=0, n=0;
  (t.modules||[]).forEach(id=>{ const f = moduleById(id); if(f){ sum += modProgress(f.msId, f.mod); n++; } });
  return n? Math.round(sum/n*100) : 0;
}
function renderStats(){
  const s = statsXP();
  const lvlPct = Math.min(100, Math.round(s.xp/s.nextXp*100));
  const areas = TOPICS.map(a=>{
    const rows = a.topics.map(t=>{
      const pct = topicPct(t);
      const locked = pct===null;
      const cls = locked? "tstat locked" : pct===100? "tstat full" : pct>0? "tstat part" : "tstat";
      return `<div class="${cls}">
        <div class="tname">${locked?"🔒":pct===100?"🏅":pct>0?"⚔️":"⬜"} ${t.name}</div>
        <div class="tbar"><div style="width:${locked?0:pct}%"></div></div>
        <div class="tpct">${locked? "em construção" : pct+"%"}</div></div>`;
    }).join("");
    const avg = Math.round(a.topics.reduce((acc,t)=>acc+(topicPct(t)||0),0)/a.topics.length);
    return `<div class="panel"><h4>${a.area} <span class="mini-label">(${avg}%)</span></h4>${rows}</div>`;
  }).join("");
  app.innerHTML = `<div class="crumbs"><a onclick="location.hash='#/'">Dashboard</a> / 📊 Stats</div>
    <div class="hero"><h1>📊 As tuas stats</h1>
      <div class="xp-card panel">
        <div class="xp-level">Nível <b>${s.level}</b></div>
        <div class="global-bar"><div style="width:${lvlPct}%"></div></div>
        <div class="mini-label">${s.xp} XP · próximo nível aos ${s.nextXp} XP</div>
        <div class="xp-badges">
          <span class="xpb">📖 ${s.pages} subpáginas vistas</span>
          <span class="xpb">✅ ${s.quizOk} exercícios certos</span>
          <span class="xpb">📦 ${s.modsDone} módulos completos</span>
          <span class="xpb">🧪 ${s.labs} labworks feitas</span>
          <span class="xpb">🏆 ${s.msDone}/8 milestones</span>
        </div>
      </div></div>
    ${areas}
    <p class="mini-label">XP: subpágina vista ×10 · exercício certo ×25 · módulo completo ×100 · milestone ×400. Tópicos 🔒 ainda não têm conteúdo gerado na plataforma.</p>`;
}

/* ---------- GRAFO DE CONHECIMENTO (força dinâmica, estilo Obsidian) ---------- */
function nodeState(n){
  if(n.ms && isStub(n.ms)) return "stub";
  const mods = (n.modules||[]).map(moduleById).filter(Boolean);
  if(!mods.length) return "stub";
  if(mods.every(f=>modComplete(f.msId, f.mod))) return "done";
  if(mods.some(f=>modProgress(f.msId, f.mod)>0)) return "partial";
  return "locked";
}
function renderGraph(){
  const W=1000, H=620, PAD=52, R=22;
  // estado da simulação (posições iniciais = layout do graph.js, reescalado)
  const nodes = GRAPH.nodes.map(n=>({ref:n, id:n.id, x:PAD+(n.x/1240)*(W-2*PAD), y:PAD+(n.y/760)*(H-2*PAD), vx:0, vy:0}));
  const byId = {}; nodes.forEach(n=>byId[n.id]=n);
  const links = GRAPH.links.filter(([a,b])=>byId[a]&&byId[b]);

  const edgesSvg = links.map(([a,b],i)=>`<line class="gedge" id="ge${i}" data-a="${a}" data-b="${b}"/>`).join("");
  const nodesSvg = nodes.map(n=>{
    const stt = nodeState(n.ref);
    return `<g class="gnode ${stt}" data-id="${n.id}">
      <circle r="${R}"></circle>
      ${stt==="stub"||stt==="locked"? '<text class="glock" y="5">🔒</text>':""}
      <text class="glabel" y="${R+16}">${n.ref.label}</text></g>`;
  }).join("");

  app.innerHTML = `<div class="crumbs"><a onclick="location.hash='#/'">Dashboard</a> / 🕸 Grafo de conhecimento</div>
    <div class="graph-wrap">
      <div class="graph-legend">
        <span><i class="dotleg done"></i> dominado</span><span><i class="dotleg partial"></i> em progresso</span>
        <span><i class="dotleg locked"></i> bloqueado</span><span><i class="dotleg stub"></i> conteúdo por gerar</span>
        <span class="mini-label">arrasta os nós · clica para abrir</span></div>
      <div class="graph-box"><svg id="ksvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <g id="gedges">${edgesSvg}</g><g id="gnodes">${nodesSvg}</g></svg></div>
      <div id="gpanel" class="gpanel hidden"></div>
    </div>`;

  const svg = $("#ksvg"), panel = $("#gpanel");
  const lineEls = links.map((_,i)=>$("#ge"+i));
  const nodeEls = {}; svg.querySelectorAll(".gnode").forEach(g=>nodeEls[g.dataset.id]=g);

  function draw(){
    links.forEach(([a,b],i)=>{ const A=byId[a], B=byId[b], L=lineEls[i];
      L.setAttribute("x1",A.x); L.setAttribute("y1",A.y); L.setAttribute("x2",B.x); L.setAttribute("y2",B.y); });
    nodes.forEach(n=> nodeEls[n.id].setAttribute("transform",`translate(${n.x},${n.y})`));
  }
  const clamp=(v,lo,hi)=>v<lo?lo:v>hi?hi:v;

  /* ----- física ----- */
  let hot=1, running=false, drag=null;
  const raf = window.requestAnimationFrame? window.requestAnimationFrame.bind(window) : (fn=>setTimeout(fn,16));
  function step(){
    for(let i=0;i<nodes.length;i++){
      const a=nodes[i];
      for(let j=i+1;j<nodes.length;j++){
        const b=nodes[j];
        let dx=a.x-b.x, dy=a.y-b.y; let d2=dx*dx+dy*dy;
        if(d2<1){ dx=(Math.random()-.5); dy=(Math.random()-.5); d2=1; }
        const f=2400/d2, d=Math.sqrt(d2), fx=f*dx/d, fy=f*dy/d;
        a.vx+=fx; a.vy+=fy; b.vx-=fx; b.vy-=fy;
      }
    }
    links.forEach(([ai,bi])=>{
      const a=byId[ai], b=byId[bi];
      const dx=b.x-a.x, dy=b.y-a.y, d=Math.max(1,Math.sqrt(dx*dx+dy*dy));
      const f=0.02*(d-105), fx=f*dx/d, fy=f*dy/d;
      a.vx+=fx; a.vy+=fy; b.vx-=fx; b.vy-=fy;
    });
    nodes.forEach(n=>{
      n.vx+=(W/2-n.x)*0.0012; n.vy+=(H/2-n.y)*0.0012;      // gravidade suave ao centro
      if(drag && drag.n===n){ n.vx=0; n.vy=0; return; }     // nó agarrado: segue o rato
      n.vx*=0.82; n.vy*=0.82;
      n.x=clamp(n.x+n.vx, PAD, W-PAD); n.y=clamp(n.y+n.vy, PAD, H-PAD); // todos sempre visíveis
    });
    hot*=0.986;
  }
  function loop(){
    if(!document.body.contains(svg)){ running=false; return; } // saiu da página → para
    if(hot>0.004 || drag){ step(); draw(); raf(loop); }
    else running=false;                                        // dorme; kick() reacorda
  }
  function kick(h){ hot=Math.max(hot,h||1); if(!running){ running=true; raf(loop); } }

  /* ----- drag (pointer events) + clique ----- */
  function toSvg(ev){ const r=svg.getBoundingClientRect();
    return { x:(ev.clientX-r.left)*W/(r.width||W), y:(ev.clientY-r.top)*H/(r.height||H) }; }
  let movedTotal=0;
  svg.querySelectorAll(".gnode").forEach(g=>{
    g.addEventListener("pointerdown", ev=>{
      const n=byId[g.dataset.id]; if(!n) return;
      drag={n, g}; movedTotal=0; g.classList.add("dragging");
      try{ g.setPointerCapture(ev.pointerId); }catch(e){}
      ev.preventDefault(); kick(0.3);
    });
    g.addEventListener("click", ()=>{ if(movedTotal<=6) openPanel(g.dataset.id); });
  });
  const endDrag = ()=>{ if(drag){ drag.g.classList.remove("dragging"); drag=null; kick(0.35); } };
  svg.addEventListener("pointermove", ev=>{
    if(!drag) return;
    const p=toSvg(ev);
    movedTotal += Math.abs(p.x-drag.n.x)+Math.abs(p.y-drag.n.y);
    drag.n.x=clamp(p.x, PAD, W-PAD); drag.n.y=clamp(p.y, PAD, H-PAD);
    drag.n.vx=drag.n.vy=0; kick(0.3);
  });
  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", endDrag);
  svg.addEventListener("pointerleave", ev=>{ if(drag && ev.target===svg) endDrag(); });

  /* ----- painel ----- */
  function openPanel(id){
    const n = GRAPH.nodes.find(x=>x.id===id); if(!n) return;
    const stt = nodeState(n);
    svg.querySelectorAll(".gedge").forEach(e=>e.classList.toggle("hot", e.dataset.a===id||e.dataset.b===id));
    svg.querySelectorAll(".gnode").forEach(x=>x.classList.toggle("sel", x.dataset.id===id));
    const modBtns = (n.modules||[]).map(mid=>{ const f=moduleById(mid);
      return f? `<button class="btn small gmod-go" data-h="#/${f.msId}/mod/${mid}">${codeMod(f.ms,f.mi)} · ${f.mod.title.slice(0,38)}</button>`:""; }).join("");
    if(stt==="done" || stt==="partial"){
      panel.innerHTML = `<button class="gclose" id="gclose">✕</button>
        <h3>${stt==="done"?"✅":"⚔️"} ${n.label}</h3>${n.summary||"<p>—</p>"}
        ${n.fig? `<div class="figure"><img src="${n.fig}" alt=""></div>`:""}
        <div class="gmods">${modBtns}</div>`;
    } else if(stt==="stub"){
      const msRef = n.ms? META.find(m=>m.id===n.ms) : null;
      panel.innerHTML = `<button class="gclose" id="gclose">✕</button>
        <h3>🔒 ${n.label}</h3><p>Este conteúdo ainda não foi gerado na plataforma.</p>
        <p class="mini-label">Vai pertencer ao milestone <b>${msRef? msRef.num+" — "+msRef.title : "?"}</b> (em construção).</p>`;
    } else {
      panel.innerHTML = `<button class="gclose" id="gclose">✕</button>
        <h3>🔒 ${n.label}</h3><p>Para desbloqueares este conhecimento, completa:</p>
        <div class="gmods">${modBtns}</div>`;
    }
    panel.classList.remove("hidden");
    const cl = $("#gclose"); if(cl) cl.onclick = ()=>{ panel.classList.add("hidden");
      svg.querySelectorAll(".gedge.hot").forEach(e=>e.classList.remove("hot"));
      svg.querySelectorAll(".gnode.sel").forEach(x=>x.classList.remove("sel")); };
    panel.querySelectorAll(".gmod-go").forEach(b=> b.onclick = ()=>nav(b.dataset.h));
    panel.querySelectorAll(".figure img").forEach(im=> im.onclick = ()=> im.classList.toggle("zoomed"));
  }

  draw(); kick(1);   // arranque: a física acomoda o layout e adormece
}

/* ---------- pesquisa ---------- */
let INDEX = null;
function buildIndex(){
  if(INDEX) return INDEX;
  INDEX = [];
  const strip = h => (h||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  META.forEach(m=>{
    getModules(m.id).forEach((mod,mi)=>{
      mod.pages.forEach((pg,pi)=>{
        let txt = strip(pg.html) + " " + (pg.title||"");
        if(pg.type==="quiz") txt += " " + pg.questions.map(q=>strip(q.q)+" "+strip(q.front||"")+" "+strip(q.back||"")).join(" ");
        if(pg.type==="labtask") txt += " " + strip(pg.q) + " " + strip(pg.context);
        INDEX.push({ms:m.id, msTitle:m.num+" — "+m.title, mod:mod.id, modTitle:mod.title, pi, code:codePage(m,mi,pi), pgTitle:pg.title||("pág. "+(pi+1)), txt});
      });
    });
  });
  return INDEX;
}
function renderSearch(qstr, msFilter, outEl){
  qstr = (qstr||"").trim();
  if(qstr.length<2){ outEl.innerHTML=""; return; }
  const terms = qstr.toLowerCase().split(/\s+/);
  const hits = buildIndex().filter(e=>(!msFilter||e.ms===msFilter) && terms.every(t=>e.txt.toLowerCase().includes(t) || e.pgTitle.toLowerCase().includes(t) || e.modTitle.toLowerCase().includes(t) || e.code.toLowerCase().includes(t))).slice(0,20);
  const snip = (txt)=>{
    const i = txt.toLowerCase().indexOf(terms[0]);
    let s = txt.slice(Math.max(0,i-50), i+90);
    terms.forEach(t=>{ s = s.replace(new RegExp("("+t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")","gi"),"<mark>$1</mark>"); });
    return "…"+s+"…";
  };
  outEl.innerHTML = `<div class="sr-box">${hits.length? hits.map(h=>
    `<div class="sr-item" data-h="${h.ms}|${h.mod}|${h.pi}"><b>${h.pgTitle}</b> <span class="code-chip">#${h.code}</span>
     <div class="sr-path">${h.msTitle} › ${h.modTitle} › subpágina ${h.pi+1}</div>
     <div class="sr-snip">${snip(h.txt)}</div></div>`).join("")
    : "<p style='color:var(--muted)'>Sem resultados"+(msFilter?" neste milestone":"")+".</p>"}</div>`;
  outEl.querySelectorAll(".sr-item").forEach(it=>{
    it.onclick = ()=>{
      const [ms,mod,pi] = it.dataset.h.split("|");
      modState(ms,mod).page = +pi; save();
      outEl.innerHTML=""; $("#global-search").value="";
      nav(`#/${ms}/mod/${mod}`);
    };
  });
}
const gs = $("#global-search"), gsOut = $("#search-results");
gs.oninput = ()=>{ if(gs.value.trim().length>=2){ gsOut.classList.remove("hidden"); renderSearch(gs.value,null,gsOut);} else hideSearch(); };
function hideSearch(){ gsOut.classList.add("hidden"); gsOut.innerHTML=""; }

/* ---------- definições / topbar ---------- */
const bStats=$("#btn-stats"); if(bStats) bStats.onclick = ()=>nav("#/stats");
const bGraph=$("#btn-graph"); if(bGraph) bGraph.onclick = ()=>nav("#/graph");
$("#btn-settings").onclick = ()=>{ $("#free-mode").checked = !!S.freeMode; $("#settings-modal").classList.remove("hidden"); };
$("#btn-close-settings").onclick = ()=>{ $("#settings-modal").classList.add("hidden"); route(); };
$("#free-mode").onchange = e=>{ S.freeMode = e.target.checked; save(); };
$("#btn-export").onclick = ()=>{
  const blob = new Blob([JSON.stringify(S,null,2)],{type:"application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "saut_progresso_"+new Date().toISOString().slice(0,10)+".json"; a.click();
};
$("#btn-import").onclick = ()=> $("#import-file").click();
$("#import-file").onchange = e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{ try{ const j = JSON.parse(r.result); if(j.milestones){ S=j; save(); alert("Progresso importado!"); route(); } else alert("Ficheiro inválido."); }catch(err){ alert("Erro ao ler o ficheiro."); } };
  r.readAsText(f);
};
$("#btn-reset").onclick = ()=>{ if(confirm("Apagar TODO o progresso? Esta ação não pode ser anulada.")){ localStorage.removeItem(LSKEY); S=load(); route(); } };

route();
})();
