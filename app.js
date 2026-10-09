/* Portal da Associação — demonstração front-end.
   Sem configuração de backend, os formulários ficam apenas neste dispositivo. */
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const toast = (message) => {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(window.__toastTimer); window.__toastTimer = setTimeout(()=>el.classList.remove("show"), 3500);
};
$("#year").textContent = new Date().getFullYear();
const menu = $("#mainNav"), menuToggle = $("#menuToggle");
menuToggle.addEventListener("click",()=>{const open=menu.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(open));menuToggle.textContent=open?"×":"☰";});
$$('#mainNav a').forEach(a=>a.addEventListener("click",()=>{menu.classList.remove("open");menuToggle.setAttribute("aria-expanded","false");menuToggle.textContent="☰";}));
function openModal(id){const m=$(id);m.classList.add("open");m.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";}
function closeModal(id){const m=$(id);m.classList.remove("open");m.setAttribute("aria-hidden","true");document.body.style.overflow="";}
$("#openSuggestion").addEventListener("click",()=>openModal("#suggestionModal"));
$$("[data-close-suggestion]").forEach(b=>b.addEventListener("click",()=>closeModal("#suggestionModal")));
$$("[data-open-admin]").forEach(b=>b.addEventListener("click",()=>openModal("#adminModal")));
$$("[data-close-admin]").forEach(b=>b.addEventListener("click",()=>closeModal("#adminModal")));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal("#suggestionModal");closeModal("#adminModal");}});
function saveLocal(key, record){try{const rows=JSON.parse(localStorage.getItem(key)||"[]");rows.push({...record,submittedAt:new Date().toISOString(),mode:"local-demo"});localStorage.setItem(key,JSON.stringify(rows));return true;}catch(e){return false;}}
$("#memberForm").addEventListener("submit",e=>{
  e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form).entries());
  if(!data.consent){$("#memberStatus").textContent="É necessário confirmar a declaração de consentimento.";return;}
  const ok=saveLocal("ae1028_member_requests",data);
  $("#memberStatus").textContent=ok?"Demonstração: pedido guardado apenas neste dispositivo. Ainda não foi enviado à Direcção.":"Não foi possível guardar neste dispositivo.";
  if(ok){form.reset();toast("Pedido guardado localmente — não enviado online.");}
});
$("#suggestionForm").addEventListener("submit",e=>{
  e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form).entries());
  const ok=saveLocal("ae1028_suggestions",data);
  $("#suggestionStatus").textContent=ok?"Demonstração: mensagem guardada apenas neste dispositivo. Ainda não chegou à Direcção.":"Não foi possível guardar neste dispositivo.";
  if(ok){form.reset();toast("Mensagem guardada localmente — não enviada online.");}
});
$("#contactBtn").addEventListener("click",()=>toast("Contactos por configurar: insira o número oficial e o e-mail no ficheiro app.js antes de publicar."));
// Para configurar um WhatsApp oficial, substitua o número abaixo pelo formato internacional sem +, espaços ou traços.
// Exemplo de formato: 2449XXXXXXXX — não publique um número pessoal sem autorização.
const WHATSAPP_NUMBER = "";
const OFFICIAL_EMAIL = "";
if(WHATSAPP_NUMBER){$("#whatsLabel").innerHTML=`<a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" rel="noopener">Conversar no WhatsApp ↗</a>`;}
if(OFFICIAL_EMAIL){$("#emailLabel").innerHTML=`<a href="mailto:${OFFICIAL_EMAIL}">${OFFICIAL_EMAIL}</a>`;}
// Teclas de navegação / acessibilidade
$$('a[href^="#"]').forEach(a=>a.addEventListener("click",e=>{const target=$(a.getAttribute("href"));if(target){e.preventDefault();target.scrollIntoView({behavior:"smooth"});history.replaceState(null,"",a.getAttribute("href"));}}));
