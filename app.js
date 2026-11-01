/* Portal da Associação — ligado ao Supabase. */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const CFG = window.AE_CONFIG || {};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl = u => /^https?:\/\//i.test(u) ? u : "#";
const fmt = d => d ? new Date(d).toLocaleDateString("pt-PT",{day:"2-digit",month:"short",year:"numeric"}) : "";
const toast = m => { const el=$("#toast"); el.textContent=m; el.classList.add("show"); clearTimeout(window.__t); window.__t=setTimeout(()=>el.classList.remove("show"),3500); };
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
  submitPublic("suggestions",{kind:d.type,sender_name:(d.name||"").trim(),message:d.message.trim()},f,$("#suggestionStatus"),"Mensagem enviada à Direcção. Obrigado!");
});

/* Conteúdo público vindo da base de dados */
async function loadPublic(){
  if(!sb) return;
  const [a,e,d]=await Promise.all([
    sb.from("announcements").select("*").eq("published",true).order("published_at",{ascending:false,nullsFirst:false}).limit(9),
    sb.from("events").select("*").eq("published",true).order("event_date",{ascending:true,nullsFirst:false}).limit(8),
    sb.from("documents").select("*").eq("published",true).order("created_at",{ascending:false}).limit(20)]);
  const [g,m]=await Promise.all([
    sb.from("gallery_images").select("*").eq("published",true).order("created_at",{ascending:false}).limit(200),
    sb.from("executive_members").select("*").eq("published",true).order("sort_order",{ascending:true}).order("created_at",{ascending:true})]);
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
const TABS={
  member_requests:{label:"Inscrições",status:["pendente","aprovado","recusado"],
    line:r=>`<b>${esc(r.full_name)}</b> · ${esc(r.course)}, ${esc(r.grade)}<br>${esc(r.phone)}${r.motivation?`<br><small>${esc(r.motivation)}</small>`:""}`},
  suggestions:{label:"Mensagens",status:["recebida","em análise","respondida","arquivada"],
    line:r=>`<b>${esc(r.kind)}</b>${r.sender_name?" · "+esc(r.sender_name):""}<br>${esc(r.message)}`},
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
  const {data,error}=await sb.from(name).select("*").order("created_at",{ascending:false}).limit(100);
  let html="";
  if(t.form) html+=`<form class="admin-form" data-add="${name}">${t.form.map(([k,l,ty])=>ty==="textarea"?`<label>${l}<textarea name="${k}" rows="3" ${k==="bio"?"":"required"}></textarea></label>`:`<label>${l}<input name="${k}" type="${ty||"text"}" ${k==="title"||k==="full_name"||k==="role"?"required":""}${ty==="file"&&name==="gallery_images"?" multiple":""}${ty==="file"?' accept="'+(name==="documents"?".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx":"image/*")+'"':""}></label>`).join("")}<button class="btn btn-primary" type="submit">Adicionar (fica oculto até publicar)</button></form>`;
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
  if(files[0]){
    const file=files[0];
    if(file.size>10*1024*1024){toast("Ficheiro acima de 10 MB.");btn.disabled=false;return;}
    const bucket=tb==="documents"?"documents":"event-images";
    const url=await uploadFile(bucket,tb==="documents"?file:await shrink(file),tb==="executive_members"?"members/":"");
    if(!url){toast("Erro no envio do ficheiro.");btn.disabled=false;return;}
    if(tb==="documents")row.public_url=url; else if(tb==="executive_members")row.photo_url=url; else row.image_url=url;
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
