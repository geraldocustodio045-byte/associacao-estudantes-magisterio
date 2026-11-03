if(window.top!==window.self){try{window.top.location.href=window.self.location.href;}catch(e){}}
/* Portal da Associação — ligado ao Supabase. */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const CFG = window.AE_CONFIG || {};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl = u => /^https?:\/\//i.test(u) ? u : "#";
const fmt = d => d ? new Date(d).toLocaleDateString("pt-PT",{day:"2-digit",month:"short",year:"numeric"}) : "";
const toast = (m,ms=3500) => { const el=$("#toast"); el.textContent=m; el.classList.add("show"); clearTimeout(window.__t); window.__t=setTimeout(()=>el.classList.remove("show"),ms); };
const sb = (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase) ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY) : null;

$("#year").textContent = new Date().getFullYear();

/* Salas (quartos) do portal */
const GROUPS={a:{t:"A Associação",c:"#10264b"},i:{t:"Informação",c:"#2c5e91"},e:{t:"Estudantes",c:"#1f6b3a"},c:{t:"Contactos",c:"#7a3b8c"}};
const ROOMS={
  associacao:{g:"a",t:"Quem somos",d:"Identidade e áreas de formação",ids:["associacao"]},
  executivo:{g:"a",t:"Executivo",d:"Os membros da Direcção",ids:["executivo"]},
  quadros:{g:"a",t:"Quadros de honra e mérito",d:"Alunos de excelência",ids:["honra","merito"],hide:true},
  noticias:{g:"i",t:"Notícias e comunicados",d:"Avisos e informações oficiais",ids:["noticias"]},
  eventos:{g:"i",t:"Actividades e eventos",d:"O que vem aí",ids:["eventos"]},
  galeria:{g:"i",t:"Galeria",d:"Fotografias das actividades",ids:["galeria"]},
  conta:{g:"e",t:"Área do estudante",d:"A sua conta, pedidos e notificações",ids:["conta"]},
  assistente:{g:"e",t:"Assistente",d:"Pesquise nos serviços e regulamentos",ids:["assistente"]},
  membro:{g:"e",t:"Ser membro",d:"Peça a sua inscrição",ids:["membro"]},
  sugestoes:{g:"e",t:"Sugestões e reclamações",d:"A sua opinião conta",ids:["sugestoes"]},
  biblioteca:{g:"e",t:"Biblioteca",d:"Livros e materiais didáticos",ids:["biblioteca"]},
  documentos:{g:"e",t:"Documentos e actas",d:"Regulamentos oficiais",ids:["documentos"]},
  duvidas:{g:"e",t:"Perguntas frequentes",d:"Respostas rápidas",ids:["duvidas"],hide:true},
  contactos:{g:"c",t:"Contactos",d:"Fale connosco",ids:["contactos"]}
};
const visRooms=()=>Object.keys(ROOMS).filter(k=>!ROOMS[k].hide);
function drawDoors(){
  let n=0;
  $("#doors").innerHTML=Object.entries(GROUPS).map(([gk,g])=>{
    const ks=visRooms().filter(k=>ROOMS[k].g===gk); if(!ks.length) return "";
    return `<div class="door-group" style="--accent:${g.c}"><h3>${esc(g.t)}</h3><div class="doors">${ks.map(k=>`<a class="door" href="#${k}"><b>${String(++n).padStart(2,"0")}</b><strong>${esc(ROOMS[k].t)}</strong><small>${esc(ROOMS[k].d)}</small><span>Entrar →</span></a>`).join("")}</div></div>`;
  }).join("");
}
function showRoom(){
  let key=location.hash.slice(1); if(key==="honra"||key==="merito") key="quadros";
  const room=(ROOMS[key]&&!ROOMS[key].hide)?key:null;
  $$("[data-lobby]").forEach(el=>el.classList.toggle("room-off",!!room));
  Object.entries(ROOMS).forEach(([k,r])=>r.ids.forEach(id=>{const el=$("#"+id); if(el) el.classList.toggle("room-off",k!==room);}));
  document.body.classList.toggle("in-room",!!room);
  const bar=$("#roomBar"), nx=$("#roomNext"); bar.hidden=nx.hidden=!room;
  if(room){
    const r=ROOMS[room], g=GROUPS[r.g]; bar.style.setProperty("--accent",g.c);
    bar.innerHTML=`<div class="room-bar-in"><p class="crumbs"><a href="#inicio">Início</a> › ${esc(g.t)}</p><h1>${esc(r.t)}</h1><p>${esc(r.d)}</p><a class="back" href="#inicio">← Voltar ao início</a></div>`;
    const ks=visRooms(), i=ks.indexOf(room), p=ks[(i-1+ks.length)%ks.length], n=ks[(i+1)%ks.length];
    nx.innerHTML=`<a href="#${p}">← ${esc(ROOMS[p].t)}</a><a class="mid" href="#inicio">Todos os espaços</a><a href="#${n}">${esc(ROOMS[n].t)} →</a>`;
  }
  document.title=room?`${ROOMS[room].t} | Associação dos Estudantes`:"Associação dos Estudantes | Magistério Nº 1028 CNO";
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",showRoom);
drawDoors(); showRoom();

/* Menu e modais */
const menu=$("#mainNav"), menuToggle=$("#menuToggle");
menuToggle.addEventListener("click",()=>{const o=menu.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(o));menuToggle.textContent=o?"×":"☰";});
$$("#mainNav a").forEach(a=>a.addEventListener("click",()=>{menu.classList.remove("open");menuToggle.setAttribute("aria-expanded","false");menuToggle.textContent="☰";}));
function openModal(id){const m=$(id);m.classList.add("open");m.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";}
function closeModal(id){const m=$(id);m.classList.remove("open");m.setAttribute("aria-hidden","true");document.body.style.overflow="";}
$("#openSuggestion").addEventListener("click",()=>openModal("#suggestionModal"));
$$("[data-close-suggestion]").forEach(b=>b.addEventListener("click",()=>closeModal("#suggestionModal")));
$$("[data-open-admin]").forEach(b=>b.addEventListener("click",()=>{openModal("#adminModal");checkStaff();}));
$$("[data-open-privacy]").forEach(b=>b.addEventListener("click",()=>openModal("#privacyModal")));
$$("[data-close-privacy]").forEach(b=>b.addEventListener("click",()=>closeModal("#privacyModal")));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal("#privacyModal");});
if(CFG.WHATSAPP_NUMBER){const w=$("#waFloat");w.href=`https://wa.me/${esc(CFG.WHATSAPP_NUMBER)}?text=${encodeURIComponent("Olá, gostaria de falar com a Associação dos Estudantes.")}`;w.hidden=false;}
$$("[data-close-admin]").forEach(b=>b.addEventListener("click",()=>closeModal("#adminModal")));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal("#suggestionModal");closeModal("#adminModal");}});

/* Contactos */
if(CFG.WHATSAPP_NUMBER) $("#whatsLabel").innerHTML=`<a href="https://wa.me/${esc(CFG.WHATSAPP_NUMBER)}" target="_blank" rel="noopener">Conversar no WhatsApp ↗</a>`;
if(CFG.OFFICIAL_EMAIL) $("#emailLabel").innerHTML=`<a href="mailto:${esc(CFG.OFFICIAL_EMAIL)}">${esc(CFG.OFFICIAL_EMAIL)}</a>`;
if(CFG.PHONES&&CFG.PHONES.length) $("#phoneLabel").innerHTML=CFG.PHONES.map(n=>`<a href="tel:+244${esc(n)}">${esc(String(n).replace(/(\d{3})(\d{3})(\d{3})/,"$1 $2 $3"))}</a>`).join(" · ");
if(CFG.WHATSAPP_NUMBER && CFG.OFFICIAL_EMAIL && (CFG.PHONES||[]).length) $("#contactBtn").style.display="none";
else $("#contactBtn").addEventListener("click",()=>toast("Os contactos oficiais serão publicados em breve."));

/* Formulários públicos */
async function submitPublic(table,row,form,statusEl,okMsg){
  if(form.website && form.website.value) return;                 // honeypot anti-robô
  if(!sb){statusEl.textContent="O serviço ainda não está disponível. Tente mais tarde.";return;}
  if(Date.now()-(+localStorage.getItem("ae_last")||0)<30000){statusEl.textContent="Aguarde alguns segundos antes de enviar de novo.";return;}
  const btn=$("button[type=submit]",form); btn.disabled=true; statusEl.textContent="A enviar…";
  const {error}=await sb.from(table).insert(row);
  btn.disabled=false;
  if(error){statusEl.textContent=/conta_nao_verificada/.test(error.message||"")?"Tem sessão iniciada numa conta ainda por verificar. Saia da conta ou aguarde a verificação.":"Não foi possível enviar. Verifique a ligação e tente de novo.";return;}
  try{localStorage.setItem("ae_last",String(Date.now()));}catch(e){}
  form.reset(); statusEl.textContent=okMsg; toast(okMsg);
}
$("#memberForm").addEventListener("submit",e=>{
  e.preventDefault(); const f=e.currentTarget, d=Object.fromEntries(new FormData(f));
  if(!d.consent){$("#memberStatus").textContent="É necessário confirmar a declaração de consentimento.";return;}
  submitPublic("member_requests",{full_name:d.name.trim(),course:d.course.trim(),grade:d.grade.trim(),phone:d.phone.trim(),email:(d.email||"").trim(),motivation:(d.motivation||"").trim(),consent:true},f,$("#memberStatus"),"Pedido enviado à Direcção. Aguarde validação.");
});
$("#suggestionForm").addEventListener("submit",e=>{
  e.preventDefault(); const f=e.currentTarget, d=Object.fromEntries(new FormData(f));
  submitPublic("suggestions",{kind:d.type,sender_name:(d.name||"").trim(),message:d.message.trim(),...((d.contact||"").trim()?{contact:d.contact.trim()}:{})},f,$("#suggestionStatus"),"Mensagem enviada à Direcção. Obrigado!");
});

/* Conta do estudante e assistente */
let ANN=[],DOCS=[],FAQ=[];
const ST={tab:"pedidos",uid:null,profile:{}};
const ST_STATUS={"recebida":"Recebido","em análise":"Em análise","respondida":"Respondido","arquivada":"Concluído"};
function setAuthTab(t){$$("[data-auth]").forEach(b=>b.classList.toggle("active",b.dataset.auth===t));$("#loginForm").hidden=t!=="login";$("#registerForm").hidden=t!=="register";}
$$("[data-auth]").forEach(b=>b.addEventListener("click",()=>setAuthTab(b.dataset.auth)));
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();if(!sb)return;const f=e.currentTarget,d=Object.fromEntries(new FormData(f)),st=$("#loginStatus");
  st.textContent="A entrar…";const {error}=await sb.auth.signInWithPassword({email:d.email.trim(),password:d.password});f.password.value="";
  st.textContent=error?"E-mail ou palavra-passe incorrectos.":"";if(!error)refreshAccount();});
$("#registerForm").addEventListener("submit",async e=>{e.preventDefault();if(!sb)return;const f=e.currentTarget,d=Object.fromEntries(new FormData(f)),st=$("#registerStatus");
  if(d.website)return;
  if(d.password.length<8){st.textContent="A palavra-passe deve ter pelo menos 8 caracteres.";return;}
  if(d.password!==d.password2){st.textContent="As palavras-passe não coincidem.";return;}
  if(!d.consent){st.textContent="É necessário aceitar o tratamento dos dados.";return;}
  st.textContent="A criar conta…";
  const meta={full_name:d.full_name.trim(),course:d.course,grade:d.grade.trim(),class_group:(d.class_group||"").trim(),phone:(d.phone||"").trim()};
  const {data,error}=await sb.auth.signUp({email:d.email.trim(),password:d.password,options:{data:meta}});
  if(error){st.textContent=/registered|exists/i.test(error.message)?"Este e-mail já tem conta.":"Não foi possível criar a conta. Verifique os dados.";return;}
  f.reset();
  if(data.session){await sb.from("profiles").upsert({id:data.user.id,...meta});st.textContent="";refreshAccount();}
  else st.textContent="Conta criada. Se for pedida confirmação, verifique o seu e-mail e depois entre.";});
async function refreshAccount(){
  if(!sb)return;const {data:{session}}=await sb.auth.getSession();
  $("#authBox").hidden=!!session;$("#studentBox").hidden=!session;
  if(!session){ST.uid=null;return;}
  ST.uid=session.user.id;
  const {data:p}=await sb.from("profiles").select("*").eq("id",ST.uid).maybeSingle();ST.profile=p||{};
  $("#studentHello").textContent="Olá, "+(ST.profile.full_name||session.user.email)+(ST.profile.verified&&!ST.profile.suspended?" ✓ Verificado":"");
  const bn=$("#acctBanner"),pf=ST.profile;
  bn.hidden=!(pf.suspended||pf.verified===false);
  bn.textContent=pf.suspended?"A sua conta está suspensa. Contacte a Direcção.":"A sua conta aguarda verificação da Direcção. Até lá pode consultar o portal, mas ainda não pode enviar pedidos.";
  loadStudentTab(ST.tab);countUnread();
}
async function countUnread(){const {count}=await sb.from("notifications").select("id",{count:"exact",head:true}).eq("read",false);$("#unread").textContent=count?`(${count})`:"";}
async function loadStudentTab(t){
  ST.tab=t;$$("#studentTabs .tab-btn").forEach(b=>b.classList.toggle("active",b.dataset.st===t));const box=$("#studentBody"),p=ST.profile;
  if(t==="pedidos"){const {data,error}=await sb.from("suggestions").select("*").eq("user_id",ST.uid).order("created_at",{ascending:false});
    box.innerHTML=error?`<p class="muted">Erro ao carregar.</p>`:!data.length?`<p class="muted">Ainda não fez nenhum pedido.</p>`:data.map(r=>`<div class="req"><small>${esc(r.protocol||"")} · ${esc(fmt(r.created_at))}</small><b>${esc(r.kind)}</b> <span class="chip">${esc(ST_STATUS[r.status]||r.status)}</span><p>${esc(r.message)}</p>${r.reply?`<p class="reply"><b>Resposta da Direcção:</b> ${esc(r.reply)}</p>`:""}</div>`).join("");}
  if(t==="novo")box.innerHTML=`<form id="newReqForm"><label>Tipo<select name="kind"><option>Sugestão</option><option>Reclamação</option><option>Dúvida</option></select></label><label>Mensagem<textarea name="message" rows="5" required minlength="5" maxlength="1500"></textarea></label><button class="btn btn-primary" type="submit">Enviar pedido</button><p class="form-status" id="newReqStatus" aria-live="polite"></p></form>`;
  if(t==="novo"&&(p.suspended||p.verified===false))box.innerHTML=`<p class="muted">Só contas verificadas pela Direcção podem enviar pedidos.</p>`;
  if(t==="avisos"){const {data}=await sb.from("notifications").select("*").order("created_at",{ascending:false}).limit(50);
    box.innerHTML=!data||!data.length?`<p class="muted">Sem notificações.</p>`:data.map(n=>`<div class="req${n.read?"":" new"}"><small>${esc(fmt(n.created_at))}</small><b>${esc(n.title)}</b><p>${esc(n.body)}</p></div>`).join("");
    if(data&&data.some(n=>!n.read)){await sb.from("notifications").update({read:true}).eq("read",false);countUnread();}}
  if(t==="perfil")box.innerHTML=`<form id="profileForm"><label>Nome completo<input name="full_name" required maxlength="100" value="${esc(p.full_name||"")}"></label><label>Curso<input name="course" maxlength="80" value="${esc(p.course||"")}"></label><label>Classe<input name="grade" maxlength="40" value="${esc(p.grade||"")}"></label><label>Turma<input name="class_group" maxlength="20" value="${esc(p.class_group||"")}"></label><label>Telefone<input name="phone" maxlength="30" value="${esc(p.phone||"")}"></label><button class="btn btn-primary" type="submit">Guardar perfil</button><p class="form-status" id="profileStatus"></p></form><form id="pwForm"><h3>Alterar palavra-passe</h3><label>Nova palavra-passe<input type="password" name="pw" minlength="8" required autocomplete="new-password"></label><label>Confirmar<input type="password" name="pw2" minlength="8" required autocomplete="new-password"></label><button class="btn btn-primary" type="submit">Alterar</button><p class="form-status" id="pwStatus"></p></form>`;
}
$("#studentTabs").addEventListener("click",e=>{const b=e.target.closest("[data-st]");if(b)loadStudentTab(b.dataset.st);});
$("#logoutBtn").addEventListener("click",async()=>{await sb.auth.signOut();refreshAccount();});
$("#studentBody").addEventListener("submit",async e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f));
  if(f.id==="newReqForm"){const st=$("#newReqStatus");st.textContent="A enviar…";
    const {data,error}=await sb.from("suggestions").insert({kind:d.kind,sender_name:ST.profile.full_name||"",message:d.message.trim()}).select("protocol").single();
    if(error){st.textContent=/conta_nao_verificada/.test(error.message||"")?"A sua conta ainda não foi verificada pela Direcção.":"Não foi possível enviar. Tente mais tarde.";return;}
    toast("Pedido enviado. Protocolo "+(data&&data.protocol||""));loadStudentTab("pedidos");}
  if(f.id==="profileForm"){const {error}=await sb.from("profiles").update({full_name:d.full_name.trim(),course:d.course.trim(),grade:d.grade.trim(),class_group:d.class_group.trim(),phone:d.phone.trim()}).eq("id",ST.uid);
    $("#profileStatus").textContent=error?"Erro ao guardar.":"Perfil guardado.";if(!error){Object.assign(ST.profile,d);$("#studentHello").textContent="Olá, "+d.full_name.trim();}}
  if(f.id==="pwForm"){const st=$("#pwStatus");if(d.pw!==d.pw2){st.textContent="As palavras-passe não coincidem.";return;}
    const {error}=await sb.auth.updateUser({password:d.pw});st.textContent=error?"Não foi possível alterar.":"Palavra-passe alterada.";f.reset();}
});
function assistSearch(q){
  const w=norm(q).split(/[^a-z0-9]+/).filter(x=>x.length>2);if(!w.length)return [];
  const sc=t=>{t=norm(t);return w.reduce((n,x)=>n+(t.includes(x)?1:0),0);};
  return [...FAQ.map(r=>({k:"faq",s:sc(r.question)*2+sc(r.answer),r})),...LIB.map(r=>({k:"lib",s:sc([r.title,r.author,r.subject,r.description].join(" ")),r})),
    ...DOCS.map(r=>({k:"doc",s:sc((r.title||"")+" "+(r.description||"")),r})),...ANN.map(r=>({k:"ann",s:sc((r.title||"")+" "+(r.summary||"")),r}))]
    .filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,6);
}
$("#askForm").addEventListener("submit",e=>{e.preventDefault();const res=assistSearch($("#askInput").value),out=$("#askOut");
  out.innerHTML=res.length?res.map(x=>x.k==="faq"?`<div class="req"><b>${esc(x.r.question)}</b><p>${esc(x.r.answer)}</p></div>`:x.k==="ann"?`<div class="req"><b>${esc(x.r.title)}</b><p>${esc(x.r.summary)}</p><a href="#noticias">Ver em Notícias</a></div>`:`<div class="req"><b>${esc(x.r.title)}</b><p>${esc(x.k==="lib"?"Biblioteca":"Documento")}</p><a href="${esc(safeUrl(x.r.file_url||x.r.public_url))}" target="_blank" rel="noopener">Abrir</a></div>`).join(""):`<p class="muted">Não encontrei nada sobre isso. <button type="button" class="link-btn" data-ask>Envie a sua dúvida à Direcção</button></p>`;
  $$("[data-ask]",out).forEach(b=>b.addEventListener("click",()=>openModal("#suggestionModal")));});

/* Galeria por actividades */
let GAL=[],galAlbum=null;
function renderGallery(){
  const box=$("#galleryGrid"); if(!GAL.length) return;
  const OTHER="Outras fotografias", groups={};
  GAL.forEach(r=>{const k=(r.album||"").trim()||OTHER;(groups[k]=groups[k]||[]).push(r);});
  const names=Object.keys(groups).sort((a,b)=>a===OTHER?1:b===OTHER?-1:new Date(groups[b][0].created_at)-new Date(groups[a][0].created_at));
  if(galAlbum&&!groups[galAlbum]) galAlbum=null;
  const photo=r=>`<button type="button" class="g-item" data-src="${esc(safeUrl(r.image_url))}" data-cap="${esc(r.caption)}" aria-label="Ver imagem"><img src="${esc(safeUrl(r.image_url))}" alt="${esc(r.caption)}" loading="lazy"></button>`;
  if(names.length===1&&!galAlbum){box.className="gallery-grid";box.innerHTML=groups[names[0]].map(photo).join("");return;}
  if(galAlbum){box.className="gallery-grid";
    box.innerHTML=`<button type="button" class="gal-back">← Todas as actividades</button><h3 class="album-title">${esc(galAlbum)}</h3>`+groups[galAlbum].map(photo).join("");return;}
  box.className="albums-grid";
  box.innerHTML=names.map(k=>{const L=groups[k],n=L.length;
    return `<button type="button" class="album-card" data-open="${esc(k)}"><img src="${esc(safeUrl(L[0].image_url))}" alt="" loading="lazy"><div><strong>${esc(k)}</strong><small>${n} fotografia${n>1?"s":""} · ${esc(fmt(L[0].created_at))}</small></div></button>`;}).join("");
}
/* Quadros de Honra e Mérito, Perguntas frequentes */
function honorCard(r){
  const ini=r.full_name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const avg=(r.average!==null&&r.average!==undefined&&r.average!=="")?`Média final: ${String(r.average).replace(".",",")}`:"";
  return `<article class="honor-card ${esc(r.board)}">${r.photo_url?`<img src="${esc(safeUrl(r.photo_url))}" alt="${esc(r.full_name)}" loading="lazy">`:`<div class="team-ph" aria-hidden="true">${esc(ini)}</div>`}<div class="honor-body"><span class="badge-hm">${r.board==="honra"?"Quadro de Honra":"Quadro de Mérito"}</span><h3>${esc(r.full_name)}</h3><p class="role">${esc([r.grade,r.school_year].filter(Boolean).join(" · "))}</p>${avg?`<p class="avg">${avg}</p>`:""}${r.note?`<p class="bio">${esc(r.note)}</p>`:""}</div></article>`;
}
function renderHonor(rows){
  for(const b of ["honra","merito"]){
    const list=rows.filter(r=>r.board===b);
    $("#"+b).hidden=!list.length;
    if(list.length) $("#"+b+"Grid").innerHTML=list.map(honorCard).join("");
  }
  const any=!$("#honra").hidden||!$("#merito").hidden;
  ROOMS.quadros.hide=!any; $("#navQuadros").setAttribute("href","#quadros"); $("#navQuadros").hidden=!any; drawDoors(); showRoom();
}
function renderFaq(rows){
  $("#duvidas").hidden=!rows.length; $("#navDuvidas").hidden=!rows.length; ROOMS.duvidas.hide=!rows.length; drawDoors(); showRoom();
  if(rows.length) $("#faqList").innerHTML=rows.map(r=>`<details class="faq-item"><summary>${esc(r.question)}</summary><p>${esc(r.answer)}</p></details>`).join("");
}
$$("[data-ask]").forEach(b=>b.addEventListener("click",()=>openModal("#suggestionModal")));

/* Biblioteca */
const LIB_CATS=["Livros","Manuais escolares","Fichas e exercícios","Planos de aula","Provas e exames","Apontamentos","Legislação e regulamentos","Modelos e formulários","Ligações úteis","Outros"];
const LIB_ICON={"Livros":"LIV","Manuais escolares":"MAN","Fichas e exercícios":"FIC","Planos de aula":"PLA","Provas e exames":"PRO","Apontamentos":"APO","Legislação e regulamentos":"LEI","Modelos e formulários":"MOD","Ligações úteis":"LNK","Outros":"OUT"};
let LIB=[],libShown=12;
$("#libCat").innerHTML=["Todas",...LIB_CATS].map(c=>`<option>${esc(c)}</option>`).join("");
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function renderLib(){
  if(!LIB.length) return;
  const q=norm($("#libSearch").value), c=$("#libCat").value;
  const list=LIB.filter(r=>(c==="Todas"||r.category===c)&&(!q||norm([r.title,r.author,r.subject,r.grade,r.description].join(" ")).includes(q)));
  $("#libCount").textContent=`${list.length} de ${LIB.length} recursos`;
  $("#libList").innerHTML=list.length?list.slice(0,libShown).map(r=>`<a class="document-row" href="${esc(safeUrl(r.file_url))}" target="_blank" rel="noopener"><div class="doc-icon">${LIB_ICON[r.category]||"DOC"}</div><div class="doc-info"><strong>${esc(r.title)}</strong><small>${esc([r.category,r.subject,r.grade,r.author].filter(Boolean).join(" · "))}</small></div><span class="doc-state">Abrir</span></a>`).join(""):`<p class="muted">Nenhum recurso encontrado.</p>`;
  $("#libMore").hidden=list.length<=libShown;
}
$("#libSearch").addEventListener("input",()=>{libShown=12;renderLib();});
$("#libCat").addEventListener("change",()=>{libShown=12;renderLib();});
$("#libMore").addEventListener("click",()=>{libShown+=24;renderLib();});

/* Conteúdo público vindo da base de dados */
async function loadPublic(){
  if(!sb) return;
  const [a,e,d]=await Promise.all([
    sb.from("announcements").select("*").eq("published",true).order("published_at",{ascending:false,nullsFirst:false}).limit(9),
    sb.from("events").select("*").eq("published",true).order("event_date",{ascending:true,nullsFirst:false}).limit(8),
    sb.from("documents").select("*").eq("published",true).order("created_at",{ascending:false}).limit(20)]);
  const [g,m,l,h,f]=await Promise.all([
    sb.from("gallery_images").select("*").eq("published",true).order("created_at",{ascending:false}).limit(1000),
    sb.from("executive_members").select("*").eq("published",true).order("sort_order",{ascending:true}).order("created_at",{ascending:true}),
    sb.from("library_resources").select("*").eq("published",true).order("created_at",{ascending:false}).limit(1000),
    sb.from("honor_roll").select("*").eq("published",true).eq("consent",true).order("sort_order",{ascending:true}).order("created_at",{ascending:true}),
    sb.from("faq_items").select("*").eq("published",true).order("sort_order",{ascending:true}).order("created_at",{ascending:true})]);
  LIB=l.data||[]; renderLib();
  FAQ=f.data||[]; renderHonor(h.data||[]); renderFaq(f.data||[]);
  if(m.data?.length){
    $("#teamGrid").innerHTML=m.data.map(r=>`<article class="team-card">${r.photo_url?`<img src="${esc(safeUrl(r.photo_url))}" alt="${esc(r.full_name)}" loading="lazy">`:`<div class="team-ph" aria-hidden="true">${esc(r.full_name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase())}</div>`}<h3>${esc(r.full_name)}</h3><p class="role">${esc(r.role)}</p>${r.bio?`<p class="bio">${esc(r.bio)}</p>`:""}</article>`).join("");
  }
  GAL=g.data||[]; renderGallery();
  ANN=a.data||[]; DOCS=d.data||[];
  const col=["blue","gold","green"];
  if(a.data?.length){
    $("#newsGrid").innerHTML=a.data.map((r,i)=>`<article class="news-card${i===0?" featured":""}"><div class="news-visual visual-${col[i%3]}"><span>COMUNICADO</span><b>AE</b></div><div class="card-body"><p class="meta">${esc(fmt(r.published_at||r.created_at))}</p><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p></div></article>`).join("");
    $("#demoNotice")?.remove();
  }
  if(e.data?.length){
    $("#eventsGrid").innerHTML=e.data.map(r=>{const dt=r.event_date?new Date(r.event_date):null;
      return `<article class="event-card"><div class="event-date"><b>${dt?String(dt.getDate()).padStart(2,"0"):"—"}</b><span>${dt?dt.toLocaleDateString("pt-PT",{month:"short"}).toUpperCase():"DATA"}</span></div><div><span class="tag">${esc(r.location||"EVENTO")}</span><h3>${esc(r.title)}</h3><p>${esc(r.details)}</p>${r.image_url?`<img class="event-img" src="${esc(safeUrl(r.image_url))}" alt="" loading="lazy">`:""}</div></article>`;}).join("");
  }
  if(d.data?.length){
    $("#documentList").innerHTML=d.data.map(r=>`<a class="document-row" href="${esc(safeUrl(r.public_url))}" target="_blank" rel="noopener"><div class="doc-icon">DOC</div><div class="doc-info"><strong>${esc(r.title)}</strong><small>${esc(r.description)}</small></div><span class="doc-state">Abrir</span></a>`).join("");
  }
}
loadPublic();

/* Área da Direcção */
function contactLink(c){
  c=(c||"").trim(); if(!c) return `<small class="dim">Sem contacto para resposta</small>`;
  if(c.includes("@")) return `<a href="mailto:${esc(c)}">Responder por e-mail: ${esc(c)}</a>`;
  let d=c.replace(/\D/g,""); if(d.length===9) d="244"+d;
  if(d.length>=11) return `<a href="https://wa.me/${d}" target="_blank" rel="noopener">Responder no WhatsApp: ${esc(c)}</a>`;
  return `<small>Contacto: ${esc(c)}</small>`;
}
const TABS={
  member_requests:{label:"Inscrições",status:["pendente","aprovado","recusado"],
    line:r=>`<b>${esc(r.full_name)}</b> · ${esc(r.course)}, ${esc(r.grade)}<br>${contactLink(r.phone)}${r.email?"<br>"+contactLink(r.email):""}${r.motivation?`<br><small>${esc(r.motivation)}</small>`:""}`},
  suggestions:{label:"Mensagens",status:["recebida","em análise","respondida","arquivada"],
    line:r=>`<b>${esc(r.kind)}</b>${r.sender_name?" · "+esc(r.sender_name):""}<br>${esc(r.message)}<br>${contactLink(r.contact)}${r.protocol?`<br><small>Protocolo ${esc(r.protocol)}</small>`:""}${r.reply?`<br><small>Resposta: ${esc(r.reply)}</small>`:""}`},
  profiles:{label:"Estudantes",noDelete:true,search:true,
    line:r=>`<b>${esc(r.full_name||"(sem nome)")}</b> <span class="chip">${r.suspended?"Suspensa":r.verified?"Verificado":"Por verificar"}</span><br><small>${esc([r.course,r.grade,r.class_group&&"Turma "+r.class_group].filter(Boolean).join(" · "))}</small>${r.phone?`<br>${contactLink(r.phone)}`:""}`,
    actions:r=>r.suspended?`<button type="button" class="btn-sm" data-vs="restore" data-id="${r.id}" data-v="${!!r.verified}">Reactivar</button>`:`${r.verified?"":`<button type="button" class="btn-sm" data-vs="verify" data-id="${r.id}" data-v="false">Verificar</button>`}<button type="button" class="btn-sm danger" data-vs="suspend" data-id="${r.id}" data-v="${!!r.verified}">Suspender</button>`},
  announcements:{label:"Comunicados",publish:true,
    form:[["title","Título"],["summary","Texto do comunicado","textarea"]],line:r=>`<b>${esc(r.title)}</b><br><small>${esc(r.summary)}</small>`},
  events:{label:"Actividades",publish:true,
    form:[["title","Título"],["details","Detalhes","textarea"],["event_date","Data e hora","datetime-local"],["location","Local"],["file","Imagem (opcional)","file"]],
    line:r=>`<b>${esc(r.title)}</b>${r.event_date?" · "+esc(fmt(r.event_date)):""}<br><small>${esc(r.details)}</small>`},
  gallery_images:{label:"Galeria",publish:true,
    form:[["album","Actividade ou álbum (ex.: Dia do Estudante)"],["caption","Legenda (opcional)"],["file","Imagens (pode escolher várias)","file"]],
    line:r=>`<img class="thumb" src="${esc(safeUrl(r.image_url))}" alt=""> ${esc(r.caption)}<br><small>${esc(r.album||"Sem actividade")}</small>`},
  executive_members:{label:"Executivo",publish:true,
    form:[["full_name","Nome completo"],["role","Cargo (ex.: Presidente)"],["bio","Biografia","textarea"],["sort_order","Ordem de apresentação (1, 2, 3, 4)","number"],["file","Fotografia (opcional)","file"]],
    line:r=>`${r.photo_url?`<img class="thumb" src="${esc(safeUrl(r.photo_url))}" alt="">`:""}<b>${esc(r.full_name)}</b> · ${esc(r.role)} <small>(ordem ${esc(r.sort_order)})</small><br><small>${esc(r.bio)}</small>`},
  library_resources:{label:"Biblioteca",publish:true,
    form:[["category","Categoria","select",LIB_CATS],["title","Título (opcional se enviar ficheiros: usa-se o nome de cada ficheiro)"],["author","Autor (opcional)"],["subject","Disciplina (opcional)"],["grade","Classe (opcional)"],["description","Descrição (opcional)","textarea"],["file","Ficheiros (pode escolher vários)","file"],["file_url","…ou link (https://…) (opcional)","url"]],
    line:r=>`<b>${esc(r.title)}</b><br><small>${esc([r.category,r.subject,r.grade,r.author].filter(Boolean).join(" · "))}</small>`},
  honor_roll:{label:"Quadros",publish:true,
    form:[["board","Quadro","select",["Quadro de Honra","Quadro de Mérito"]],["full_name","Nome do aluno"],["grade","Classe e curso (opcional)"],["school_year","Ano lectivo (opcional), ex.: 2025/2026"],["average","Média final (opcional, de 0 a 20)","number"],["note","Motivo ou destaque (opcional)","textarea"],["sort_order","Ordem de apresentação (1, 2, 3…)","number"],["consent","Autorização do aluno ou encarregado para publicar","select",["Sim, há autorização","Ainda não"]],["file","Fotografia (opcional, só com autorização)","file"]],
    line:r=>`${r.photo_url?`<img class="thumb" src="${esc(safeUrl(r.photo_url))}" alt="">`:""}<b>${esc(r.full_name)}</b> · ${r.board==="honra"?"Honra":"Mérito"}${r.average!==null&&r.average!==undefined?" · média "+esc(r.average):""}<br><small>${esc([r.grade,r.school_year].filter(Boolean).join(" · "))}${r.consent?"":" · SEM AUTORIZAÇÃO: não aparece no site"}</small>`},
  faq_items:{label:"Dúvidas",publish:true,
    form:[["question","Pergunta"],["answer","Resposta","textarea"],["sort_order","Ordem (opcional)","number"]],
    line:r=>`<b>${esc(r.question)}</b><br><small>${esc(r.answer)}</small>`},
  documents:{label:"Documentos",publish:true,
    form:[["title","Título"],["description","Descrição"],["file","Ficheiro (PDF, até 10 MB)","file"],["public_url","…ou link público (https://…)","url"]],
    line:r=>`<b>${esc(r.title)}</b><br><small>${esc(r.public_url)}</small>`}
};
let currentTab="member_requests";
const show=(id,on)=>{$(id).hidden=!on;};

async function checkStaff(){
  if(!sb){$("#adminStatus").textContent="Serviço não configurado.";return;}
  const {data:{session}}=await sb.auth.getSession();
  if(!session){show("#adminLogin",true);show("#adminPanel",false);return;}
  const {data}=await sb.from("staff_roles").select("role").eq("user_id",session.user.id).maybeSingle();
  if(!data){$("#adminStatus").textContent="Esta conta não tem permissão de Direcção.";show("#adminLogin",true);show("#adminPanel",false);return;}
  show("#adminLogin",false);show("#adminPanel",true);
  $("#adminTabs").innerHTML=Object.entries(TABS).map(([k,t])=>`<button type="button" class="tab-btn" data-tab="${k}">${t.label}</button>`).join("");
  loadTab(currentTab);
}
$("#adminLogin").addEventListener("submit",async e=>{
  e.preventDefault(); if(!sb) return; const d=Object.fromEntries(new FormData(e.currentTarget));
  $("#adminStatus").textContent="A entrar…";
  const {error}=await sb.auth.signInWithPassword({email:d.email.trim(),password:d.password});
  e.currentTarget.password.value="";
  if(error){$("#adminStatus").textContent="E-mail ou palavra-passe incorrectos.";return;}
  $("#adminStatus").textContent=""; checkStaff();
});
$("#adminLogout").addEventListener("click",async()=>{await sb.auth.signOut();checkStaff();});

async function loadTab(name){
  currentTab=name; const t=TABS[name];
  $$("#adminTabs .tab-btn").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  const {data,error}=await sb.from(name).select("*").order("created_at",{ascending:false}).limit(300);
  let html=`<p><button type="button" class="btn-sm" data-export>Exportar tudo em CSV (cópia de segurança)</button></p>`;
  if(t.search)html+=`<p><input id="adminFind" class="admin-find" placeholder="Pesquisar por nome, curso ou turma…" aria-label="Pesquisar"></p><p class="muted">${(data||[]).filter(r=>!r.verified&&!r.suspended).length} por verificar</p>`;
  if(t.form) html+=`<form class="admin-form" data-add="${name}">${t.form.map(([k,l,ty,opts])=>ty==="select"?`<label>${l}<select name="${k}">${opts.map(o=>`<option>${esc(o)}</option>`).join("")}</select></label>`:ty==="textarea"?`<label>${l}<textarea name="${k}" rows="3" ${k==="bio"||/opcional/.test(l)?"":"required"}></textarea></label>`:`<label>${l}<input name="${k}" type="${ty||"text"}"${k==="album"?' list="albumList" maxlength="120"':""}${ty==="number"?' step="any"':""} ${(k==="title"&&name!=="library_resources")||k==="full_name"||k==="role"||k==="question"?"required":""}${ty==="file"&&(name==="gallery_images"||name==="library_resources")?" multiple":""}${ty==="file"?' accept="'+(name==="documents"||name==="library_resources"?".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx":"image/*")+'"':""}></label>`).join("")}<button class="btn btn-primary" type="submit">Adicionar (fica oculto até publicar)</button>${name==="gallery_images"?`<datalist id="albumList">${[...new Set((data||[]).map(r=>r.album).filter(Boolean))].map(a=>`<option value="${esc(a)}">`).join("")}</datalist>`:""}</form>`;
  if(error) html+=`<p class="form-status">Erro ao carregar dados.</p>`;
  else if(!data.length) html+=`<p class="muted">Sem registos.</p>`;
  else html+=data.map(r=>`<div class="admin-row"><div class="admin-info">${t.line(r)}<br><small class="dim">${esc(fmt(r.created_at))}</small></div><div class="admin-actions">${
    t.status?`<select data-status="${r.id}">${t.status.map(s=>`<option${s===r.status?" selected":""}>${s}</option>`).join("")}</select>`:""}${
    t.publish?`<button type="button" class="btn-sm" data-pub="${r.id}" data-on="${r.published}">${r.published?"Ocultar":"Publicar"}</button>`:""
    }${name==="suggestions"?`<button type="button" class="btn-sm" data-reply="${r.id}">Responder</button>`:""}${name==="gallery_images"?`<button type="button" class="btn-sm" data-move="${r.id}" data-album="${esc(r.album||"")}">Mudar actividade</button>`:""}${t.actions?t.actions(r):""}${t.noDelete?"":`<button type="button" class="btn-sm danger" data-del="${r.id}">Apagar</button>`}</div></div>`).join("");
  $("#adminBody").innerHTML=html;
}
$("#adminTabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)loadTab(b.dataset.tab);});
function toCsv(rows){
  if(!rows.length) return "";
  const cols=Object.keys(rows[0]);
  const q=v=>{let t=(v===null||v===undefined)?"":String(v); if(/^[=+\-@\t\r]/.test(t)) t="'"+t; return '"'+t.replace(/"/g,'""')+'"';};
  return [cols.join(","),...rows.map(r=>cols.map(c=>q(r[c])).join(","))].join("\r\n");
}
async function exportTab(){
  toast("A preparar o ficheiro…");
  let all=[],from=0;
  for(;;){
    const {data,error}=await sb.from(currentTab).select("*").order("created_at",{ascending:true}).range(from,from+999);
    if(error){toast("Erro ao exportar.");return;}
    if(!data||!data.length) break;
    all=all.concat(data); if(data.length<1000) break; from+=1000;
  }
  if(!all.length){toast("Sem registos para exportar.");return;}
  const b=new Blob(["\ufeff"+toCsv(all)],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(b);
  a.download=`${currentTab}-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  toast(`${all.length} registos exportados.`);
}
$("#adminBody").addEventListener("click",async e=>{
  if(e.target.closest("[data-export]")){await exportTab();return;}
  const vs=e.target.closest("[data-vs]");
  if(vs){const v=vs.dataset.v==="true",a=vs.dataset.vs;
    const {error}=await sb.rpc("set_student_status",{p_user:vs.dataset.id,p_verified:a==="verify"||v,p_suspended:a==="suspend"});
    toast(error?"Erro ao actualizar a conta.":"Estado da conta actualizado.");loadTab(currentTab);return;}
  const rp=e.target.closest("[data-reply]");
  if(rp){const t=prompt("Resposta ao estudante:");if(!t||!t.trim())return;
    const {error}=await sb.from("suggestions").update({reply:t.trim().slice(0,2000),status:"respondida",replied_at:new Date().toISOString()}).eq("id",rp.dataset.reply);
    toast(error?"Erro ao responder.":"Resposta guardada. O estudante será notificado.");loadTab(currentTab);return;}
  const mv=e.target.closest("[data-move]");
  if(mv){const a=prompt("Nome da actividade (deixe vazio para tirar):",mv.dataset.album);if(a===null)return;
    const {error}=await sb.from("gallery_images").update({album:a.trim().slice(0,120)}).eq("id",mv.dataset.move);
    toast(error?"Erro ao mudar.":"Actividade actualizada.");loadTab(currentTab);loadPublic();return;}
  const pub=e.target.closest("[data-pub]"), del=e.target.closest("[data-del]");
  if(pub){const on=pub.dataset.on!=="true";const up={published:on};if(on&&currentTab==="announcements")up.published_at=new Date().toISOString();
    const {error}=await sb.from(currentTab).update(up).eq("id",pub.dataset.pub);toast(error?"Erro ao actualizar.":"Actualizado.");loadTab(currentTab);loadPublic();}
  if(del&&confirm("Apagar este registo definitivamente?")){const {error}=await sb.from(currentTab).delete().eq("id",del.dataset.del);toast(error?"Erro ao apagar.":"Apagado.");loadTab(currentTab);loadPublic();}
});
$("#adminBody").addEventListener("change",async e=>{
  const s=e.target.closest("[data-status]"); if(!s)return;
  const {error}=await sb.from(currentTab).update({status:s.value}).eq("id",s.dataset.status);toast(error?"Erro ao actualizar.":"Estado guardado.");
});
async function shrink(file){
  if(!file.type.startsWith("image/")||file.type==="image/gif") return file;
  try{const b=await createImageBitmap(file),sc=Math.min(1,1600/Math.max(b.width,b.height)),c=document.createElement("canvas");
    c.width=Math.round(b.width*sc);c.height=Math.round(b.height*sc);c.getContext("2d").drawImage(b,0,0,c.width,c.height);
    const bl=await new Promise(r=>c.toBlob(r,"image/jpeg",.82));
    return bl?new File([bl],file.name.replace(/\.\w+$/,"")+".jpg",{type:"image/jpeg"}):file;}catch(e){return file;}
}
async function uploadFile(bucket,file,prefix=""){
  const ext=(file.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"");
  const path=`${prefix}${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const up=await sb.storage.from(bucket).upload(path,file,{contentType:file.type||undefined});
  return up.error?null:sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
$("#adminBody").addEventListener("submit",async e=>{
  const f=e.target.closest("[data-add]"); if(!f)return; e.preventDefault();
  const tb=f.dataset.add, btn=$("button[type=submit]",f), row={}, files=[];
  for(const [k,v] of new FormData(f)){ if(v instanceof File){ if(v.size) files.push(v); } else if(v!=="") row[k]=v; }
  if(row.event_date)row.event_date=new Date(row.event_date).toISOString();
  if(tb==="honor_roll"){row.board=(row.board||"").includes("Honra")?"honra":"merito";row.consent=(row.consent||"").startsWith("Sim");}
  btn.disabled=true;
  if(tb==="gallery_images"){
    if(!files.length){toast("Escolha pelo menos uma imagem.");btn.disabled=false;return;}
    if(files.length>50){toast("Máximo de 50 imagens de cada vez.");btn.disabled=false;return;}
    let ok=0;
    for(let n=0;n<files.length;n++){
      toast(`A enviar imagem ${n+1} de ${files.length}…`);
      const url=await uploadFile("event-images",await shrink(files[n]),"gallery/");
      if(!url) continue;
      const {error}=await sb.from(tb).insert({image_url:url,caption:row.caption||"",...(row.album?{album:row.album.trim()}:{})});
      if(!error) ok++;
    }
    toast(`${ok} de ${files.length} imagens publicadas.`);
    btn.disabled=false; loadTab(currentTab); loadPublic(); return;
  }
  if(tb==="library_resources"){
    const base={category:row.category||"Livros",author:row.author||"",subject:row.subject||"",grade:row.grade||"",description:row.description||""};
    if(!files.length){
      if(!row.title||!row.file_url){toast("Indique o título e o link, ou escolha ficheiros.");btn.disabled=false;return;}
      const {error}=await sb.from(tb).insert({...base,title:row.title,file_url:row.file_url});
      toast(error?"Erro: verifique os campos (o link deve começar por https://).":"Adicionado à biblioteca.");
      btn.disabled=false; if(!error)loadTab(currentTab); loadPublic(); return;
    }
    if(files.length>50){toast("Máximo de 50 ficheiros de cada vez.");btn.disabled=false;return;}
    let ok=0, big=0;
    for(let n=0;n<files.length;n++){
      const fl=files[n];
      if(fl.size>25*1024*1024){big++;continue;}
      toast(`A enviar ${n+1} de ${files.length}…`);
      const url=await uploadFile("documents",fl,"library/");
      if(!url) continue;
      const title=(files.length===1&&row.title)?row.title:fl.name.replace(/\.[^.]+$/,"").replace(/[_]+/g," ").trim();
      const {error}=await sb.from(tb).insert({...base,title,file_url:url});
      if(!error) ok++;
    }
    toast(`${ok} de ${files.length} publicados.${big?` ${big} com mais de 25 MB foram ignorados (use um link).`:""}`);
    btn.disabled=false; loadTab(currentTab); loadPublic(); return;
  }
  if(files[0]){
    const file=files[0];
    if(file.size>10*1024*1024){toast("Ficheiro acima de 10 MB.");btn.disabled=false;return;}
    const bucket=tb==="documents"?"documents":"event-images";
    const url=await uploadFile(bucket,tb==="documents"?file:await shrink(file),tb==="executive_members"?"members/":tb==="honor_roll"?"honor/":"");
    if(!url){toast("Erro no envio do ficheiro.");btn.disabled=false;return;}
    if(tb==="documents")row.public_url=url; else if(tb==="executive_members"||tb==="honor_roll")row.photo_url=url; else row.image_url=url;
  }
  if(tb==="documents"&&!row.public_url){toast("Escolha um ficheiro ou indique um link.");btn.disabled=false;return;}
  const {error}=await sb.from(tb).insert(row);
  btn.disabled=false;
  toast(error?"Erro: verifique os campos (o link deve começar por https://).":"Adicionado. Use «Publicar» para o mostrar no site.");
  if(!error)loadTab(currentTab);
});

/* Galeria: ver imagem em ecrã inteiro */
const lb=$("#lightbox");
$("#galleryGrid").addEventListener("click",e=>{
  const al=e.target.closest("[data-open]");if(al){galAlbum=al.dataset.open;renderGallery();window.scrollTo(0,0);return;}
  if(e.target.closest(".gal-back")){galAlbum=null;renderGallery();return;}
  const b=e.target.closest(".g-item");if(!b)return;
  $("img",lb).src=b.dataset.src;$("p",lb).textContent=b.dataset.cap;lb.hidden=false;document.body.style.overflow="hidden";});
const closeLb=()=>{lb.hidden=true;document.body.style.overflow="";};
lb.addEventListener("click",closeLb);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!lb.hidden)closeLb();});

/* App instalável (PWA) */
let installEv=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEv=e;$("#installBtn").hidden=false;});
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const isStandalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone;
if(isIOS&&!isStandalone){$("#installBtn").hidden=false;}
$("#installBtn").addEventListener("click",async()=>{if(isIOS&&!installEv){toast("Toque em Partilhar (quadrado com seta) e depois em «Adicionar ao ecrã principal».",9000);return;}if(!installEv)return;installEv.prompt();await installEv.userChoice;installEv=null;$("#installBtn").hidden=true;});
window.addEventListener("appinstalled",()=>{$("#installBtn").hidden=true;});
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

/* Menu agrupado e animações suaves */
$$(".nav-gbtn").forEach(b=>b.addEventListener("click",()=>{const g=b.parentElement,o=g.classList.contains("open");$$(".nav-group").forEach(x=>x.classList.remove("open"));if(!o)g.classList.add("open");}));
$$("#mainNav a").forEach(a=>a.addEventListener("click",()=>$$(".nav-group").forEach(x=>x.classList.remove("open"))));
document.addEventListener("click",e=>{if(!e.target.closest(".nav-group"))$$(".nav-group").forEach(x=>x.classList.remove("open"));});

refreshAccount();

$("#adminBody").addEventListener("input",e=>{if(e.target.id!=="adminFind")return;const q=norm(e.target.value);$$(".admin-row",$("#adminBody")).forEach(r=>{r.hidden=!!q&&!norm(r.textContent).includes(q);});});
