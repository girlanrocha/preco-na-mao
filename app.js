const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cats=[["🛒","Mercados"],["✚","Farmácias"],["🍴","Alimentação"],["⛽","Combustíveis"],["🧱","Construção"],["✂️","Beleza"],["💙","Saúde"],["🛠️","Serviços"],["🛍️","Lojas"],["•••","Outros"]];
const companies=[
{id:1,name:"Mercado Central",cat:"Mercados",icon:"🛒",city:"Vila Pavão",desc:"Mercado, mercearia e ofertas da semana.",wa:"",featured:true,badge:"OFERTAS ESPECIAIS"},
{id:2,name:"Farmácia Saúde+",cat:"Farmácias",icon:"✚",city:"Vila Pavão",desc:"Atendimento, perfumaria e cuidados pessoais.",wa:"",featured:true,badge:"CUPOM DISPONÍVEL"},
{id:3,name:"Casa & Construção",cat:"Construção",icon:"🏠",city:"Vila Pavão",desc:"Materiais para sua obra e reforma.",wa:"",featured:true,badge:"EM DESTAQUE"},
{id:4,name:"Sabor da Praça",cat:"Alimentação",icon:"🍴",city:"Vila Pavão",desc:"Refeições, lanches e atendimento local.",wa:""},
{id:5,name:"Auto Center VP",cat:"Serviços",icon:"🔧",city:"Vila Pavão",desc:"Serviços automotivos e manutenção.",wa:""},
{id:6,name:"Bella Studio",cat:"Beleza",icon:"✂️",city:"Vila Pavão",desc:"Beleza e cuidados pessoais.",wa:""}];
const offers=[["🛒","Oferta da Semana","Mercado Central","Espaço reservado para promoção do estabelecimento."],["💊","Destaque da Farmácia","Farmácia Saúde+","Espaço para divulgar promoção ou serviço."],["🧱","Material em oferta","Casa & Construção","Espaço para promoção de materiais e serviços."]];
const coupons=[["10% OFF","Farmácia Saúde+","VP10","Cupom demonstrativo. Defina participantes e validade."],["R$ 5 OFF","Sabor da Praça","VP5","Cupom demonstrativo conforme regras do estabelecimento."]];
const infos=[["Farmácia de plantão","Publique aqui a farmácia de plantão e os horários confirmados."],["Horário do comércio","Informe horários especiais, feriados e funcionamento do comércio local."],["Avisos e serviços","Espaço para informações úteis de interesse da população."]];
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
function toast(m){let t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function page(id){$$(".page").forEach(x=>x.classList.toggle("active",x.id===id));$$(".nav").forEach(x=>x.classList.toggle("on",x.dataset.page===id));scrollTo(0,0);if(id==="searchPage")search("")}
$$(".nav").forEach(b=>b.onclick=()=>page(b.dataset.page));$$("[data-go]").forEach(b=>b.onclick=()=>page(b.dataset.go));
$("#categories").innerHTML=cats.map(([i,n])=>`<button class="cat" data-cat="${n}"><span>${i}</span>${n}</button>`).join("");
$$(".cat").forEach(b=>b.onclick=()=>{page("guide");guide(b.dataset.cat)});
function feature(c){return `<article class="feature"><div class="cover">${c.icon}</div><div class="feature-body"><h3>${esc(c.name)}</h3><p>📍 ${esc(c.city)}</p><span class="badge">${esc(c.badge)}</span><a class="wa no-wa" href="#">WhatsApp</a></div></article>`}
$("#featured").innerHTML=companies.filter(c=>c.featured).map(feature).join("");
function card(c){return `<article class="card business"><div class="ico">${c.icon}</div><div><h3>${esc(c.name)}</h3><p>${esc(c.cat)} • 📍 ${esc(c.city)}</p><p>${esc(c.desc)}</p></div><div class="actions"><a class="no-wa" href="#">WhatsApp</a><button onclick="toast('${esc(c.name)} • ${esc(c.cat)}')">Ver empresa</button></div></article>`}
function bind(){ $$(".no-wa").forEach(a=>a.onclick=e=>{e.preventDefault();toast("Cadastre o WhatsApp do estabelecimento no painel.")}) }
function guide(cat="Todos"){let names=["Todos",...cats.map(x=>x[1])];$("#filters").innerHTML=names.map(n=>`<button class="${n===cat?"active":""}" data-f="${n}">${n}</button>`).join("");let a=cat==="Todos"?companies:companies.filter(c=>c.cat===cat);$("#guideList").innerHTML=a.length?a.map(card).join(""):`<div class="empty">Nenhuma empresa cadastrada.</div>`;$$("[data-f]").forEach(b=>b.onclick=()=>guide(b.dataset.f));bind()}
function norm(v){return String(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function search(q){q=norm(q);let a=!q?companies:companies.filter(c=>norm(c.name+" "+c.cat+" "+c.desc).includes(q));$("#searchResults").innerHTML=a.length?a.map(card).join(""):`<div class="empty">Nenhum resultado encontrado.</div>`;bind()}
$("#globalSearch").oninput=e=>search(e.target.value);$("#homeSearch").oninput=e=>{if(e.target.value.trim().length>1){page("searchPage");$("#globalSearch").value=e.target.value;search(e.target.value);$("#globalSearch").focus()}}
$("#offerList").innerHTML=offers.map(o=>`<article class="card business"><div class="ico">${o[0]}</div><div><h3>${o[1]}</h3><p><b>${o[2]}</b></p><p>${o[3]}</p></div></article>`).join("");
$("#couponList").innerHTML=coupons.map(c=>`<article class="card coupon"><span class="value">${c[0]}</span><h3>${c[1]}</h3><p>${c[3]}</p><p>Código:</p><span class="code">${c[2]}</span></article>`).join("");
$("#infoList").innerHTML=infos.map(i=>`<article class="card"><h3>📢 ${i[0]}</h3><p>${i[1]}</p></article>`).join("");
$("#advertise").onclick=()=>toast("Em breve: área comercial do VP Compras.");$("#menuBtn").onclick=()=>page("guide");$("#infoBtn").onclick=()=>page("info");
guide();search("");bind();
