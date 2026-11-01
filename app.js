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
$$('a[href^="#"]').forEach(a=>a.addEventListener("click",e=>{const t=$(a.getAttribute("href"));if(t){e.preventDefault();t.scrollIntoView({behavior:"smooth"});history.replaceState(null,"",a.getAttribute("href"));}}));

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
  if(error){statusEl.textContent="Não foi possível enviar. Verifique a ligação e tente de novo.";return;}
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
  const first=!$("#honra").hidden?"#honra":(!$("#merito").hidden?"#merito":null);
  const n=$("#navQuadros"); if(first){n.setAttribute("href",first);n.hidden=false;} else n.hidden=true;
}
function renderFaq(rows){
  $("#duvidas").hidden=!rows.length; $("#navDuvidas").hidden=!rows.length;
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
    sb.from("gallery_images").select("*").eq("published",true).order("created_at",{ascending:false}).limit(200),
    sb.from("executive_members").select("*").eq("published",true).order("sort_order",{ascending:true}).order("created_at",{ascending:true}),
    sb.from("library_resources").select("*").eq("published",true).order("created_at",{ascending:false}).limit(1000),
    sb.from("honor_roll").select("*").eq("published",true).eq("consent",true).order("sort_order",{ascending:true}).order("created_at",{ascending:true}),
    sb.from("faq_items").select("*").eq("published",true).order("sort_order",{ascending:true}).order("created_at",{ascending:true})]);
  LIB=l.data||[]; renderLib();
  renderHonor(h.data||[]); renderFaq(f.data||[]);
  if(m.data?.length){
    $("#teamGrid").innerHTML=m.data.map(r=>`<article class="team-card">${r.photo_url?`<img src="${esc(safeUrl(r.photo_url))}" alt="${esc(r.full_name)}" loading="lazy">`:`<div class="team-ph" aria-hidden="true">${esc(r.full_name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase())}</div>`}<h3>${esc(r.full_name)}</h3><p class="role">${esc(r.role)}</p>${r.bio?`<p class="bio">${esc(r.bio)}</p>`:""}</article>`).join("");
  }
  if(g.data?.length){
    $("#galleryGrid").innerHTML=g.data.map(r=>`<button type="button" class="g-item" data-src="${esc(safeUrl(r.image_url))}" data-cap="${esc(r.caption)}" aria-label="Ver imagem"><img src="${esc(safeUrl(r.image_url))}" alt="${esc(r.caption)}" loading="lazy"></button>`).join("");
  }
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
    line:r=>`<b>${esc(r.kind)}</b>${r.sender_name?" · "+esc(r.sender_name):""}<br>${esc(r.message)}<br>${contactLink(r.contact)}`},
  announcements:{label:"Comunicados",publish:true,
    form:[["title","Título"],["summary","Texto do comunicado","textarea"]],line:r=>`<b>${esc(r.title)}</b><br><small>${esc(r.summary)}</small>`},
  events:{label:"Actividades",publish:true,
    form:[["title","Título"],["details","Detalhes","textarea"],["event_date","Data e hora","datetime-local"],["location","Local"],["file","Imagem (opcional)","file"]],
    line:r=>`<b>${esc(r.title)}</b>${r.event_date?" · "+esc(fmt(r.event_date)):""}<br><small>${esc(r.details)}</small>`},
  gallery_images:{label:"Galeria",publish:true,
    form:[["caption","Legenda (opcional)"],["file","Imagens (pode escolher várias)","file"]],
    line:r=>`<img class="thumb" src="${esc(safeUrl(r.image_url))}" alt=""> ${esc(r.caption)}`},
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
  if(!data){await sb.auth.signOut();$("#adminStatus").textContent="Esta conta não tem permissão de Direcção.";show("#adminLogin",true);show("#adminPanel",false);return;}
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
  let html="";
  if(t.form) html+=`<form class="admin-form" data-add="${name}">${t.form.map(([k,l,ty,opts])=>ty==="select"?`<label>${l}<select name="${k}">${opts.map(o=>`<option>${esc(o)}</option>`).join("")}</select></label>`:ty==="textarea"?`<label>${l}<textarea name="${k}" rows="3" ${k==="bio"||/opcional/.test(l)?"":"required"}></textarea></label>`:`<label>${l}<input name="${k}" type="${ty||"text"}"${ty==="number"?' step="any"':""} ${(k==="title"&&name!=="library_resources")||k==="full_name"||k==="role"||k==="question"?"required":""}${ty==="file"&&(name==="gallery_images"||name==="library_resources")?" multiple":""}${ty==="file"?' accept="'+(name==="documents"||name==="library_resources"?".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx":"image/*")+'"':""}></label>`).join("")}<button class="btn btn-primary" type="submit">Adicionar (fica oculto até publicar)</button></form>`;
  if(error) html+=`<p class="form-status">Erro ao carregar dados.</p>`;
  else if(!data.length) html+=`<p class="muted">Sem registos.</p>`;
  else html+=data.map(r=>`<div class="admin-row"><div class="admin-info">${t.line(r)}<br><small class="dim">${esc(fmt(r.created_at))}</small></div><div class="admin-actions">${
    t.status?`<select data-status="${r.id}">${t.status.map(s=>`<option${s===r.status?" selected":""}>${s}</option>`).join("")}</select>`:""}${
    t.publish?`<button type="button" class="btn-sm" data-pub="${r.id}" data-on="${r.published}">${r.published?"Ocultar":"Publicar"}</button>`:""
    }<button type="button" class="btn-sm danger" data-del="${r.id}">Apagar</button></div></div>`).join("");
  $("#adminBody").innerHTML=html;
}
$("#adminTabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b)loadTab(b.dataset.tab);});
$("#adminBody").addEventListener("click",async e=>{
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
      const {error}=await sb.from(tb).insert({image_url:url,caption:row.caption||""});
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
$("#galleryGrid").addEventListener("click",e=>{const b=e.target.closest(".g-item");if(!b)return;
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
