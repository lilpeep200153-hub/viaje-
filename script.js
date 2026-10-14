// ---------- AJUSTES (cámbialos aquí) ----------
const CIUDAD_SALIDA = "Funza";

// Fecha y hora de salida: año-mes-díaTHH:MM:SS (hora de 24 horas)
const FECHA_VIAJE = new Date("2026-11-04T18:00:00");

// Texto que se muestra cuando llega el día
const TEXTO_DESTINO = "Italia";

const BANDERA = '<span class="bandera" role="img" aria-label="Bandera de Italia"></span>';
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Pestañas ----------
const pestanas = [...document.querySelectorAll(".pestana")];
const paneles = [...document.querySelectorAll(".panel")];

function mostrarPestana(id, { enfocar = false, actualizarHash = true } = {}) {
  pestanas.forEach((p) => {
    const activa = p.dataset.panel === id;
    p.setAttribute("aria-selected", String(activa));
    p.tabIndex = activa ? 0 : -1;
    if (activa) {
      p.scrollIntoView({ inline: "center", block: "nearest" });
      if (enfocar) p.focus();
    }
  });

  paneles.forEach((panel) => {
    panel.hidden = panel.id !== `panel-${id}`;
  });

  window.scrollTo(0, 0);

  if (actualizarHash) {
    try {
      history.replaceState(null, "", `#${id}`);
    } catch (e) {
      // Si el navegador no lo permite, no pasa nada
    }
  }
}

pestanas.forEach((p) => {
  p.addEventListener("click", () => mostrarPestana(p.dataset.panel));
});

document.querySelectorAll("[data-ir]").forEach((boton) => {
  boton.addEventListener("click", () => mostrarPestana(boton.dataset.ir));
});

// Flechas del teclado para moverse entre pestañas
document.querySelector(".navegacion").addEventListener("keydown", (e) => {
  const actual = pestanas.findIndex((p) => p.getAttribute("aria-selected") === "true");
  let nuevo = null;

  if (e.key === "ArrowRight") nuevo = (actual + 1) % pestanas.length;
  else if (e.key === "ArrowLeft") nuevo = (actual - 1 + pestanas.length) % pestanas.length;
  else if (e.key === "Home") nuevo = 0;
  else if (e.key === "End") nuevo = pestanas.length - 1;

  if (nuevo !== null) {
    e.preventDefault();
    mostrarPestana(pestanas[nuevo].dataset.panel, { enfocar: true });
  }
});

// Abrir directo en una pestaña: index.html#pistas
const hashInicial = location.hash.slice(1);
mostrarPestana(
  pestanas.some((p) => p.dataset.panel === hashInicial) ? hashInicial : "inicio",
  { actualizarHash: false }
);

// ---------- Pase de abordar ----------
// El nombre lo escribe cada persona y se queda guardado en su navegador
const inputNombre = document.getElementById("pase-nombre");
try {
  inputNombre.value = localStorage.getItem("pase-nombre") || "";
} catch (e) {
  // Si el navegador no permite guardar, no pasa nada
}
inputNombre.addEventListener("input", () => {
  try {
    localStorage.setItem("pase-nombre", inputNombre.value);
  } catch (e) {
    // Si el navegador no permite guardar, no pasa nada
  }
});
document.getElementById("pase-origen").textContent = CIUDAD_SALIDA;
document.getElementById("pase-fecha").textContent = FECHA_VIAJE.toLocaleDateString("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
document.getElementById("pase-hora").textContent = FECHA_VIAJE.toLocaleTimeString("es", {
  hour: "numeric",
  minute: "2-digit",
});

// ---------- Confeti ----------
function lanzarConfeti() {
  if (sinMovimiento) return;

  const lienzo = document.createElement("canvas");
  lienzo.className = "confeti";
  lienzo.width = window.innerWidth;
  lienzo.height = window.innerHeight;
  document.body.appendChild(lienzo);

  const ctx = lienzo.getContext("2d");
  const colores = ["#009246", "#ffffff", "#ce2b37", "#f0cf8e"];

  const piezas = Array.from({ length: 180 }, () => ({
    x: lienzo.width / 2 + (Math.random() - 0.5) * 200,
    y: lienzo.height * 0.55,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 16 - 6,
    ancho: 6 + Math.random() * 6,
    alto: 8 + Math.random() * 8,
    giro: Math.random() * Math.PI,
    vgiro: (Math.random() - 0.5) * 0.3,
    color: colores[Math.floor(Math.random() * colores.length)],
  }));

  const inicio = performance.now();

  function cuadro(ahora) {
    const t = ahora - inicio;
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);

    piezas.forEach((p) => {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.giro += p.vgiro;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 3000) / 1500);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
      ctx.restore();
    });

    if (t < 4500) {
      requestAnimationFrame(cuadro);
    } else {
      lienzo.remove();
    }
  }

  requestAnimationFrame(cuadro);
}

// ---------- Revelación del destino ----------
function revelarDestino({ confeti = true, irAlDestino = false } = {}) {
  const destinoHTML = `${TEXTO_DESTINO} ${BANDERA}`;

  const caja = document.getElementById("destino-texto");
  caja.innerHTML = destinoHTML;
  caja.classList.add("revelado");

  const paseDestino = document.getElementById("pase-destino");
  paseDestino.innerHTML = destinoHTML;
  paseDestino.classList.add("revelado");

  document.getElementById("portada-sub").innerHTML = `Destino: ${destinoHTML}`;

  if (irAlDestino) mostrarPestana("destino");
  if (confeti) lanzarConfeti();
}

// ---------- Cuenta regresiva ----------
const elDias = document.getElementById("dias");
const elHoras = document.getElementById("horas");
const elMinutos = document.getElementById("minutos");
const elSegundos = document.getElementById("segundos");

let temporizador;

function actualizarCuenta(esInicial) {
  const falta = FECHA_VIAJE - new Date();

  if (falta <= 0) {
    clearInterval(temporizador);
    document.getElementById("titulo-cuenta").textContent = "Es hoy";
    document.getElementById("contador").hidden = true;
    revelarDestino({ confeti: true, irAlDestino: !esInicial });
    return;
  }

  const total = Math.floor(falta / 1000);
  elDias.textContent = Math.floor(total / 86400);
  elHoras.textContent = Math.floor((total % 86400) / 3600);
  elMinutos.textContent = Math.floor((total % 3600) / 60);
  elSegundos.textContent = total % 60;
}

temporizador = setInterval(() => actualizarCuenta(false), 1000);
actualizarCuenta(true);

// Para probar la revelación: abre index.html?revelar#destino
if (location.search.includes("revelar")) {
  revelarDestino({ confeti: true, irAlDestino: false });
}

// ---------- Lista de lo que no puede faltar ----------
const casillas = document.querySelectorAll("#lista input");
const progreso = document.getElementById("progreso");
const CLAVE = "maleta-marcadas";

function cargarMarcadas() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    casillas.forEach((c, i) => {
      c.checked = guardadas.includes(i);
    });
  } catch (e) {
    // Si el navegador no permite guardar, no pasa nada
  }
}

function guardarMarcadas() {
  try {
    const marcadas = [...casillas]
      .map((c, i) => (c.checked ? i : -1))
      .filter((i) => i >= 0);
    localStorage.setItem(CLAVE, JSON.stringify(marcadas));
  } catch (e) {
    // Si el navegador no permite guardar, no pasa nada
  }
}

function actualizarProgreso() {
  const n = [...casillas].filter((c) => c.checked).length;
  progreso.textContent =
    n === casillas.length
      ? "Todo listo para salir"
      : `${n} de ${casillas.length} listas`;
}

casillas.forEach((c) => {
  c.addEventListener("change", () => {
    guardarMarcadas();
    actualizarProgreso();
  });
});

cargarMarcadas();
actualizarProgreso();

// ---------- Pistas: tarjetas que giran ----------
const tarjetas = document.querySelectorAll(".tarjeta");
const progresoPistas = document.getElementById("progreso-pistas");
const cajaAdivina = document.getElementById("adivina");
const descubiertas = new Set();

function actualizarPistas() {
  const todas = descubiertas.size === tarjetas.length;
  progresoPistas.textContent = todas
    ? "Descubriste todas las pistas"
    : `Descubiertas ${descubiertas.size} de ${tarjetas.length}`;
  if (todas) {
    cajaAdivina.hidden = false;
  }
}

tarjetas.forEach((tarjeta, i) => {
  tarjeta.addEventListener("click", () => {
    const volteada = tarjeta.getAttribute("aria-pressed") === "true";
    tarjeta.setAttribute("aria-pressed", String(!volteada));
    descubiertas.add(i);
    actualizarPistas();
  });
});

actualizarPistas();

// ---------- Juego de adivinar el destino ----------
const formAdivina = document.getElementById("form-adivina");
const inputIntento = document.getElementById("intento");
const respuesta = document.getElementById("respuesta");

const cuando = FECHA_VIAJE.toLocaleString("es", {
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

const frases = [
  "Interesante apuesta... no te voy a decir si vas cerca.",
  "Mmm, sigues dándole vueltas. Eso me gusta.",
  "Mi boca está sellada. Aquí no se confirma nada.",
];

let intentos = 0;

formAdivina.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (!inputIntento.value.trim()) {
    respuesta.textContent = "Escribe tu mejor apuesta primero.";
    return;
  }

  respuesta.textContent = `${frases[intentos % frases.length]} Lo sabrás el ${cuando}.`;
  intentos++;
  inputIntento.select();
});

// ---------- Juego: el gran reto del viajero ----------
const juego = document.getElementById("juego");
const CLAVE_RECORD = "reto-record";

const PREGUNTAS = [
  { p: "¿Qué documento casi siempre piden para subir a un avión internacional?", o: ["Pasaporte", "Carnet de biblioteca", "Recibo de luz"], c: 0 },
  { p: "¿Con cuánta anticipación conviene llegar al aeropuerto en un vuelo internacional?", o: ["Unos 10 minutos", "Unas 3 horas", "Un día entero"], c: 1 },
  { p: "Para que quepa más en la maleta, ¿qué conviene hacer con la ropa?", o: ["Enrollarla", "Llevar todo el clóset", "Meterla sin doblar"], c: 0 },
  { p: "¿Qué es un itinerario?", o: ["El plan de lo que harás y cuándo", "Un tipo de maleta", "Una moneda extranjera"], c: 0 },
  { p: "¿Qué conviene hacer con una foto de tus documentos antes de viajar?", o: ["Guardarla aparte, por si acaso", "Publicarla en redes", "Borrarla del celular"], c: 0 },
  { p: "Para caminar todo el día sin sufrir, ¿qué zapatos eliges?", o: ["Cómodos y ya estrenados", "Nuevos, sin estrenar", "Los más elegantes"], c: 0 },
  { p: "¿Qué es el jet lag?", o: ["El cansancio por cambiar de huso horario", "Un tipo de vuelo", "Un snack de avión"], c: 0 },
  { p: "Para comer rico en un lugar nuevo, ¿qué consejo funciona mejor?", o: ["Buscar donde come la gente del lugar", "Pedir siempre lo mismo", "Cenar siempre en el hotel"], c: 0 },
];

const SIMBOLOS = ["✈️", "🧳", "📷", "🗺️", "🎫", "🧭", "🎒", "☀️"];

const PALABRAS = [
  { w: "MALETA", pista: "Ahí va todo lo que llevas" },
  { w: "PASAPORTE", pista: "Tu documento más importante al viajar" },
  { w: "AVENTURA", pista: "Lo que se vive cuando no todo está planeado" },
  { w: "EQUIPAJE", pista: "Todo lo que cargas contigo" },
  { w: "AEROPUERTO", pista: "Donde despegan los aviones" },
  { w: "ITINERARIO", pista: "El plan del viaje, día por día" },
];

const MAXIMO = PREGUNTAS.length * 10 + 60 + PALABRAS.length * 10;
const puntos = { trivia: 0, memoria: 0, palabras: 0 };

function limpiar(t) {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

function mezclar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pantalla(html) {
  juego.innerHTML = `<div class="juego-caja">${html}</div>`;
}

function barra(n, total) {
  return `<div class="barra"><span style="width:${(n / total) * 100}%"></span></div>`;
}

function inicioJuego() {
  puntos.trivia = puntos.memoria = puntos.palabras = 0;
  pantalla(`
    <p class="etapa">3 pruebas · ${PREGUNTAS.length + SIMBOLOS.length + PALABRAS.length} retos</p>
    <h3>¿Listo para ganarte tu título?</h3>
    <p>Preguntas de viajero, un juego de memoria y palabras revueltas. Al final te llevas tu título.</p>
    <button class="boton" id="j-empezar">Empezar</button>`);
  document.getElementById("j-empezar").addEventListener("click", prueba1);
}

// Prueba 1: preguntas
function prueba1() {
  let i = 0;

  function mostrar() {
    const q = PREGUNTAS[i];
    const opciones = mezclar(q.o.map((t, k) => ({ t, ok: k === q.c })));
    pantalla(`
      <p class="etapa">Prueba 1 de 3 · pregunta ${i + 1} de ${PREGUNTAS.length}</p>
      ${barra(i, PREGUNTAS.length)}
      <h3>${q.p}</h3>
      <div class="opciones">
        ${opciones.map((o) => `<button class="opcion" data-ok="${o.ok}">${o.t}</button>`).join("")}
      </div>
      <p class="aviso" id="j-aviso" aria-live="polite"></p>`);

    const botones = [...juego.querySelectorAll(".opcion")];
    botones.forEach((b) => {
      b.addEventListener("click", () => {
        const acerto = b.dataset.ok === "true";
        botones.forEach((x) => {
          x.disabled = true;
          if (x.dataset.ok === "true") x.classList.add("acierto");
        });
        if (acerto) puntos.trivia += 10;
        else b.classList.add("fallo");
        document.getElementById("j-aviso").textContent = acerto
          ? "¡Correcto!"
          : "Casi. La respuesta correcta quedó marcada.";
        setTimeout(() => {
          i++;
          if (i < PREGUNTAS.length) mostrar();
          else prueba2();
        }, 1400);
      });
    });
  }

  mostrar();
}

// Prueba 2: memoria
function prueba2() {
  const cartas = mezclar([...SIMBOLOS, ...SIMBOLOS]);
  let abiertas = [];
  let intentos = 0;
  let parejas = 0;
  let bloqueo = false;

  pantalla(`
    <p class="etapa">Prueba 2 de 3 · encuentra las parejas</p>
    <p class="aviso" id="j-info" aria-live="polite">Intentos: 0 · Parejas: 0 de ${SIMBOLOS.length}</p>
    <div class="memoria">
      ${cartas.map((s, k) => `<button class="carta" data-s="${s}" aria-label="Carta ${k + 1}"><span>${s}</span></button>`).join("")}
    </div>`);

  const info = document.getElementById("j-info");

  juego.querySelectorAll(".carta").forEach((c) => {
    c.addEventListener("click", () => {
      if (bloqueo || c.classList.contains("abierta")) return;
      c.classList.add("abierta");
      abiertas.push(c);
      if (abiertas.length < 2) return;

      intentos++;
      const [a, b] = abiertas;
      abiertas = [];

      if (a.dataset.s === b.dataset.s) {
        a.classList.add("par");
        b.classList.add("par");
        parejas++;
      } else {
        bloqueo = true;
        setTimeout(() => {
          a.classList.remove("abierta");
          b.classList.remove("abierta");
          bloqueo = false;
        }, 800);
      }

      info.textContent = `Intentos: ${intentos} · Parejas: ${parejas} de ${SIMBOLOS.length}`;

      if (parejas === SIMBOLOS.length) {
        puntos.memoria = Math.max(10, 60 - Math.max(0, intentos - 10) * 5);
        setTimeout(prueba3, 1100);
      }
    });
  });
}

// Prueba 3: palabras revueltas
function prueba3() {
  let i = 0;

  function mostrar() {
    const p = PALABRAS[i];
    let revuelta;
    do {
      revuelta = mezclar(p.w.split("")).join("");
    } while (revuelta === p.w);

    pantalla(`
      <p class="etapa">Prueba 3 de 3 · palabra ${i + 1} de ${PALABRAS.length}</p>
      ${barra(i, PALABRAS.length)}
      <h3 class="revuelta" aria-label="Letras revueltas">${revuelta.split("").join(" ")}</h3>
      <p>Pista: ${p.pista}.</p>
      <form id="j-form">
        <input type="text" id="j-resp" placeholder="Escribe la palabra" autocomplete="off" aria-label="Tu respuesta">
        <button type="submit" class="boton">Comprobar</button>
        <button type="button" class="boton secundario" id="j-saltar">Saltar</button>
      </form>
      <p class="aviso" id="j-aviso" aria-live="polite"></p>`);

    const resp = document.getElementById("j-resp");
    const aviso = document.getElementById("j-aviso");
    resp.focus();

    function siguiente() {
      i++;
      if (i < PALABRAS.length) mostrar();
      else resultado();
    }

    document.getElementById("j-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (limpiar(resp.value) === p.w) {
        puntos.palabras += 10;
        aviso.textContent = "¡Eso es!";
        setTimeout(siguiente, 900);
      } else {
        aviso.textContent = "Todavía no. Inténtalo otra vez o salta.";
        resp.select();
      }
    });

    document.getElementById("j-saltar").addEventListener("click", siguiente);
  }

  mostrar();
}

// Resultado
function resultado() {
  const total = puntos.trivia + puntos.memoria + puntos.palabras;
  let record = total;

  try {
    const anterior = Number(localStorage.getItem(CLAVE_RECORD)) || 0;
    record = Math.max(anterior, total);
    localStorage.setItem(CLAVE_RECORD, String(record));
  } catch (e) {
    // Si el navegador no permite guardar, no pasa nada
  }

  const titulo =
    total >= 170 ? "Viajero experto" : total >= 110 ? "Viajero con experiencia" : "Viajero en entrenamiento";

  pantalla(`
    <p class="etapa">Reto completado</p>
    <div class="titulo-viajero">
      <small>Título otorgado a</small>
      <strong id="j-nombre"></strong>
      <span>${titulo}</span>
    </div>
    <p>Puntos: <strong>${total}</strong> de ${MAXIMO} · Tu mejor marca: ${record}</p>
    <p class="aviso">Preguntas ${puntos.trivia} · Memoria ${puntos.memoria} · Palabras ${puntos.palabras}</p>
    <button class="boton" id="j-otra">Jugar otra vez</button>`);

  document.getElementById("j-nombre").textContent = inputNombre.value.trim() || "Viajero";
  document.getElementById("j-otra").addEventListener("click", inicioJuego);
}

inicioJuego();