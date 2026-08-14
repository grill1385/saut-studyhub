const { JSDOM } = require("jsdom");
const fs=require("fs"), path=require("path");
const ROOT=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
const dom=new JSDOM(html,{runScripts:"outside-only",url:"file:///hub/index.html",pretendToBeVisual:true});
const w=dom.window; const store={}; w.confirm=()=>true;
store["saut_progress_v1"]=JSON.stringify({activeMilestone:"m5",freeMode:true,milestones:{}});
Object.defineProperty(w,"localStorage",{value:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:()=>{},clear:()=>{}},configurable:true});
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).forEach(s=>w.eval(fs.readFileSync(path.join(ROOT,s),"utf8")));
w.document.execCommand = () => true;
const app=()=>w.document.querySelector("#app").innerHTML;
const wait=()=>new Promise(r=>setTimeout(r,60));
let fails=0; const ok=(c,m)=>{console.log((c?"  ✔ ":"  ✘ ")+m); if(!c)fails++;};

const lab=w.SAUT_CONTENT.m5.modules.find(m=>m.id==="m5-mod6");
console.log("páginas do m5-mod6:");
lab.pages.forEach((p,i)=>console.log("   M5.6."+(i+1)+"  "+(p.type+"/"+(p.kind||"-")).padEnd(18)+(p.task||p.title||"").replace(/<[^>]+>/g,"").slice(0,58)));
const iAsm = lab.pages.findIndex(p=>p.kind==="assemble");
ok(iAsm>=0, "página de montagem presente");

(async()=>{
  w.location.hash="#/m5/mod/m5-mod6"; w.dispatchEvent(new w.Event("hashchange"));
  // escrever o codigo de duas sub-tarefas
  const spec=w.SAUT_LABSPEC["m5-mod6"];
  for(const [pi,task] of [[1,"predict"],[3,"laser2world"]]){
    w.document.querySelectorAll(".pdot")[pi].dispatchEvent(new w.Event("click"));
    w.document.querySelector("textarea.code-eval").value = spec[task].solution;
    w.document.querySelector(".q-eval").onclick(); await wait();
  }
  // ir para a pagina de montagem
  w.document.querySelectorAll(".pdot")[iAsm].dispatchEvent(new w.Event("click"));
  const ta = w.document.querySelector("#asm-ta");
  ok(!!ta, "textarea de montagem renderiza");
  const t = ta.value;
  ok(/predictPosition/.test(t), "inclui o código do predictPosition já escrito");
  ok(/LaserPointToWorld/.test(t), "inclui o código do LaserPointToWorld já escrito");
  ok(/ainda por escrever/.test(t), "marca as sub-tarefas ainda por fazer");
  ok(t.indexOf("predictPosition") < t.indexOf("LaserPointToWorld"), "respeita a ordem das sub-tarefas");
  ok(/^\/\//m.test(t), "usa comentários de Pascal (//)");
  ok(/de 7 sub-tarefas/.test(app())||/de \d+ sub-tarefas/.test(app()), "mostra o contador de progresso");
  ok(!!w.document.querySelector(".q-copy"), "botão de copiar presente");
  w.document.querySelector(".q-copy").onclick();
  ok(/copiado/.test(app()), "copiar dá feedback");

  // Lab 4 usa comentarios de MATLAB
  w.location.hash="#/m4/mod/m4-mod7"; w.dispatchEvent(new w.Event("hashchange"));
  const lab4=w.SAUT_CONTENT.m4.modules.find(m=>m.id==="m4-mod7");
  const i4=lab4.pages.findIndex(p=>p.kind==="assemble");
  w.document.querySelectorAll(".pdot")[i4].dispatchEvent(new w.Event("click"));
  ok(/^%/m.test(w.document.querySelector("#asm-ta").value), "Lab 4 usa comentários de MATLAB (%)");

  console.log("\n"+(fails?"### "+fails+" FALHAS":">>> página de montagem OK"));
  process.exit(fails?1:0);
})();
