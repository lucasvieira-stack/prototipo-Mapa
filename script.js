const CATEGORIAS = {
  rampa: "Rampa", calcada: "Calçada", tatil: "Piso tátil",
  banheiro: "Banheiro adaptado", travessia: "Travessia de pedestres", transporte: "Ponto de ônibus"
};
const ROTULO = { ok: "Acessível", parcial: "Parcialmente acessível", barreira: "Barreira" };
const SIMBOLO = { ok: "✓", parcial: "!", barreira: "✕" };
const CENTRO = [-23.5917, -48.0531];
const CHAVE = "mapa-acessibilidade-pontos";

const EXEMPLOS = [
  { id: 1, lat: -23.5917, lng: -48.0531, cat: "rampa", status: "ok", desc: "Rampa com corrimão e inclinação adequada na entrada da praça." },
  { id: 2, lat: -23.5935, lng: -48.0505, cat: "calcada", status: "barreira", desc: "Calçada com buraco e raiz de árvore que bloqueia cadeira de rodas." },
  { id: 3, lat: -23.5898, lng: -48.0562, cat: "tatil", status: "parcial", desc: "Piso tátil interrompido antes da faixa de pedestres." },
  { id: 4, lat: -23.5952, lng: -48.0549, cat: "travessia", status: "ok", desc: "Semáforo sonoro e rebaixamento de calçada nos dois lados." },
  { id: 5, lat: -23.5880, lng: -48.0515, cat: "transporte", status: "barreira", desc: "Ponto de ônibus sem plataforma nem espaço para cadeira de rodas." }
];

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return JSON.parse(bruto);
  } catch (e) { /* armazenamento indisponível */ }
  return EXEMPLOS.map(p => ({ ...p }));
}
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(pontos)); } catch (e) {}
}

let pontos = carregar();
const marcadores = new Map();
let pendente = null, marcadorPendente = null;

const mapa = L.map("mapa").setView(CENTRO, 15);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: "&copy; colaboradores do OpenStreetMap"
}).addTo(mapa);

const $ = id => document.getElementById(id);
const selCat = $("cat"), filtroCat = $("filtro-cat");
Object.entries(CATEGORIAS).forEach(([k, v]) => {
  selCat.add(new Option(v, k));
  filtroCat.add(new Option(v, k));
});

function icone(p) {
  return L.divIcon({
    className: "", iconSize: [30, 30], iconAnchor: [15, 15],
    html: `<div class="pino ${p.status}"><span>${SIMBOLO[p.status]}</span></div>`
  });
}
function esc(t) { const d = document.createElement("div"); d.textContent = t; return d.innerHTML; }

function filtrados() {
  const ativos = [...document.querySelectorAll("[data-status]:checked")].map(c => c.dataset.status);
  const cat = filtroCat.value;
  return pontos.filter(p => ativos.includes(p.status) && (!cat || p.cat === cat));
}

function desenhar() {
  marcadores.forEach(m => m.remove());
  marcadores.clear();
  const lista = $("lista");
  lista.innerHTML = "";
  const visiveis = filtrados();
  visiveis.forEach(p => {
    const m = L.marker([p.lat, p.lng], { icon: icone(p), title: `${CATEGORIAS[p.cat]}: ${ROTULO[p.status]}` }).addTo(mapa);
    m.bindPopup(`<strong>${CATEGORIAS[p.cat]}</strong><br>${ROTULO[p.status]}<br>${esc(p.desc)}`);
    marcadores.set(p.id, m);
    const li = document.createElement("li");
    li.innerHTML = `<button type="button"><strong>${SIMBOLO[p.status]} ${CATEGORIAS[p.cat]} – ${ROTULO[p.status]}</strong>${esc(p.desc)}</button>`;
    li.firstChild.addEventListener("click", () => { mapa.flyTo([p.lat, p.lng], 17); m.openPopup(); });
    lista.appendChild(li);
  });
  $("contador").textContent = `(${visiveis.length})`;
  $("vazio").hidden = visiveis.length > 0;
}

function fecharForm() {
  $("form").hidden = true; $("form").reset();
  $("dica").hidden = false;
  if (marcadorPendente) { marcadorPendente.remove(); marcadorPendente = null; }
  pendente = null;
}

mapa.on("click", e => {
  pendente = e.latlng;
  if (marcadorPendente) marcadorPendente.remove();
  marcadorPendente = L.circleMarker(pendente, { radius: 9, color: "#0F4C5C", weight: 3, fillColor: "#F2C14E", fillOpacity: 1 }).addTo(mapa);
  $("form").hidden = false;
  $("dica").hidden = true;
  $("desc").focus();
});

$("form").addEventListener("submit", e => {
  e.preventDefault();
  if (!pendente) return;
  pontos.push({
    id: Date.now(), lat: pendente.lat, lng: pendente.lng,
    cat: selCat.value, status: $("status").value, desc: $("desc").value.trim()
  });
  salvar(); fecharForm(); desenhar();
});
$("cancelar").addEventListener("click", fecharForm);
$("restaurar").addEventListener("click", () => {
  pontos = EXEMPLOS.map(p => ({ ...p }));
  salvar(); desenhar();
});
document.querySelectorAll("[data-status]").forEach(c => c.addEventListener("change", desenhar));
filtroCat.addEventListener("change", desenhar);

desenhar();
