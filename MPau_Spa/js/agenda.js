document.addEventListener("DOMContentLoaded", () => {
  const C = window.AGENDA_CONFIG;
  const root = document.getElementById("agenda");
  if (!C || !root) return;

  const $ = (s) => root.querySelector(s);
  const selServicio = $("#ag-servicio"), cal = $("#ag-calendario"), mesEt = $("#ag-mes");
  const btnPrev = $("#ag-prev"), btnNext = $("#ag-next"), horasEl = $("#ag-horas");
  const resumen = $("#ag-resumen"), nombre = $("#ag-nombre"), tel = $("#ag-tel");
  const btnConfirmar = $("#ag-confirmar"), btnGuardar = $("#ag-guardar"), msg = $("#ag-msg"), ticketEl = $("#ag-ticket");
  const CLAVE = "mpau_reservas_v1";
  const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

  // "Ahora" en hora de Colombia, sin importar dónde esté el cliente.
  const ahora = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const aMin = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const deMin = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const hora12 = (h) => { const m = aMin(h), a = Math.floor(m / 60); return `${a % 12 || 12}:${String(m % 60).padStart(2, "0")} ${a < 12 ? "a. m." : "p. m."}`; };
  const fechaLarga = (f) => { const [y, m, d] = f.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); };

  const guardadas = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { return []; } };
  const guardar = (r) => { try { localStorage.setItem(CLAVE, JSON.stringify([...guardadas(), r])); } catch (e) {} };

  // Número de ticket: MP-AAMMDD-0000 (fecha de hoy + 4 dígitos al azar, sin repetir en este dispositivo).
  const nuevoTicket = () => {
    const h = ahora(), base = `MP-${String(h.getFullYear()).slice(-2)}${String(h.getMonth() + 1).padStart(2, "0")}${String(h.getDate()).padStart(2, "0")}-`;
    const usados = guardadas().map((r) => r.ticket);
    let t;
    do { t = base + String(Math.floor(Math.random() * 9000) + 1000); } while (usados.includes(t));
    return t;
  };

  const est = { servicio: C.servicios[0].id, mes: null, fecha: null, cos: null, hora: null };
  const servicio = () => C.servicios.find((s) => s.id === est.servicio);

  // Horas de inicio libres de una cosmetóloga en una fecha para el servicio elegido.
  function huecos(cos, fecha, minutos) {
    if (C.diasCerrado.includes(fecha) || cos.diasLibres.includes(fecha)) return [];
    const [y, m, d] = fecha.split("-").map(Number);
    const tramos = cos.horario[new Date(y, m - 1, d).getDay()] || [];
    const ocupadas = [...C.citasOcupadas, ...guardadas()].filter((o) => o.fecha === fecha && o.cosmetologa === cos.id);
    const limite = new Date(ahora().getTime() + C.anticipacionHoras * 3600000);
    const salida = [];
    tramos.forEach(([ini, fin]) => {
      for (let t = aMin(ini); t + minutos <= aMin(fin); t += C.pasoMinutos) {
        if (new Date(y, m - 1, d, 0, t) < limite) continue;
        if (ocupadas.some((o) => t < aMin(o.inicio) + o.minutos && t + minutos > aMin(o.inicio))) continue;
        salida.push(deMin(t));
      }
    });
    return salida;
  }
  const hayDisponibilidad = (fecha) => C.cosmetologas.some((c) => huecos(c, fecha, servicio().minutos).length);

  function pintarCalendario() {
    const hoy = ahora(), primero = new Date(est.mes.getFullYear(), est.mes.getMonth(), 1);
    const maximo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + C.diasAdelante);
    mesEt.textContent = primero.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    btnPrev.disabled = primero <= new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    btnNext.disabled = new Date(primero.getFullYear(), primero.getMonth() + 1, 1) > maximo;
    cal.innerHTML = DIAS.map((d) => `<span class="ag-dow" aria-hidden="true">${d}</span>`).join("");
    const vacios = (primero.getDay() + 6) % 7;
    for (let i = 0; i < vacios; i++) cal.insertAdjacentHTML("beforeend", "<span></span>");
    const total = new Date(primero.getFullYear(), primero.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= total; d++) {
      const fecha = iso(new Date(primero.getFullYear(), primero.getMonth(), d));
      const libre = new Date(fecha + "T00:00:00") <= maximo && hayDisponibilidad(fecha);
      const b = document.createElement("button");
      b.type = "button"; b.textContent = d; b.disabled = !libre;
      b.className = "ag-dia" + (libre ? " libre" : "") + (fecha === est.fecha ? " sel" : "") + (fecha === iso(hoy) ? " hoy" : "");
      b.setAttribute("aria-label", fechaLarga(fecha) + (libre ? ", con horas disponibles" : ", sin disponibilidad"));
      b.addEventListener("click", () => { est.fecha = fecha; est.cos = est.hora = null; pintar(); });
      cal.appendChild(b);
    }
  }

  function pintarHoras() {
    horasEl.innerHTML = "";
    if (!est.fecha) { horasEl.innerHTML = '<p class="ag-vacio">Elige un día en el calendario para ver las horas de nuestras cosmetólogas.</p>'; return; }
    let alguna = false;
    C.cosmetologas.forEach((c) => {
      const hs = huecos(c, est.fecha, servicio().minutos);
      if (!hs.length) return;
      alguna = true;
      const bloque = document.createElement("div");
      bloque.className = "ag-cos";
      bloque.innerHTML = `<h4><span class="ag-inicial">${c.nombre.trim().slice(-1)}</span>${c.nombre}</h4><div class="ag-chips"></div>`;
      hs.forEach((h) => {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = hora12(h);
        b.className = "ag-chip" + (est.cos === c.id && est.hora === h ? " sel" : "");
        b.addEventListener("click", () => { est.cos = c.id; est.hora = h; pintar(); });
        bloque.querySelector(".ag-chips").appendChild(b);
      });
      horasEl.appendChild(bloque);
    });
    if (!alguna) horasEl.innerHTML = '<p class="ag-vacio">No quedan horas libres este día. Prueba con otra fecha.</p>';
  }

  function pintarResumen() {
    const listo = est.fecha && est.cos && est.hora;
    if (!listo) { resumen.innerHTML = "<p>Aún no has elegido día y hora.</p>"; btnConfirmar.disabled = btnGuardar.disabled = true; return; }
    const c = C.cosmetologas.find((x) => x.id === est.cos);
    resumen.innerHTML = `<dl><dt>Servicio</dt><dd>${servicio().nombre}</dd><dt>Fecha</dt><dd>${fechaLarga(est.fecha)}</dd><dt>Hora</dt><dd>${hora12(est.hora)}</dd><dt>Cosmetóloga</dt><dd>${c.nombre}</dd></dl>`;
    btnConfirmar.disabled = btnGuardar.disabled = false;
  }

  function pintar() { pintarCalendario(); pintarHoras(); pintarResumen(); }

  selServicio.innerHTML = C.servicios.map((s) => `<option value="${s.id}">${s.nombre} (${s.minutos} min)</option>`).join("");
  selServicio.addEventListener("change", () => {
    est.servicio = selServicio.value; est.cos = est.hora = null;
    if (est.fecha && !hayDisponibilidad(est.fecha)) est.fecha = null;
    pintar();
  });
  btnPrev.addEventListener("click", () => { est.mes = new Date(est.mes.getFullYear(), est.mes.getMonth() - 1, 1); pintarCalendario(); });
  btnNext.addEventListener("click", () => { est.mes = new Date(est.mes.getFullYear(), est.mes.getMonth() + 1, 1); pintarCalendario(); });

  const textoWhatsApp = (r, intro) => [
    intro,
    `• Ticket: ${r.ticket}`, `• Servicio: ${r.servicio}`, `• Fecha: ${fechaLarga(r.fecha)}`, `• Hora: ${hora12(r.inicio)}`,
    `• Cosmetóloga: ${r.cosmetologaNombre}`, `• Nombre: ${r.nombre}`, r.telefono ? `• Teléfono: ${r.telefono}` : ""
  ].filter(Boolean).join("\n");
  const enviarWhatsApp = (r, intro) => window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(textoWhatsApp(r, intro))}`, "_blank", "noopener");

  function mostrarTicket(r) {
    ticketEl.hidden = false;
    ticketEl.innerHTML = `
      <p class="ag-ticket-tit">¡Tu cita quedó guardada!</p>
      <p class="ag-ticket-et">Número de ticket</p>
      <p class="ag-ticket-num" id="ag-ticket-num">${r.ticket}</p>
      <dl>
        <dt>Servicio</dt><dd>${r.servicio}</dd>
        <dt>Fecha</dt><dd>${fechaLarga(r.fecha)}</dd>
        <dt>Hora</dt><dd>${hora12(r.inicio)}</dd>
        <dt>Cosmetóloga</dt><dd>${r.cosmetologaNombre}</dd>
        <dt>A nombre de</dt><dd></dd>
      </dl>
      <p class="ag-ticket-nota">Guarda este número o toma una captura: te servirá para confirmar o cambiar tu cita.</p>
      <div class="ag-ticket-acc">
        <button type="button" class="btn" id="ag-enviar-ticket">Enviar ticket por WhatsApp</button>
        <button type="button" class="btn alt" id="ag-copiar">Copiar ticket</button>
      </div>`;
    ticketEl.querySelector("dl dd:last-of-type").textContent = r.nombre;
    ticketEl.querySelector("#ag-enviar-ticket").addEventListener("click", () => enviarWhatsApp(r, "Hola, esta es mi cita guardada en MPau Spa:"));
    ticketEl.querySelector("#ag-copiar").addEventListener("click", (e) => {
      const b = e.currentTarget;
      const listo = () => { b.textContent = "¡Copiado!"; };
      try { navigator.clipboard.writeText(r.ticket).then(listo, () => { b.textContent = r.ticket; }); } catch (err) { b.textContent = r.ticket; }
    });
    ticketEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Guarda la cita (con su ticket) y deja el formulario listo para otra reserva.
  function registrar() {
    if (!nombre.value.trim()) { msg.textContent = "Escribe tu nombre para continuar."; nombre.focus(); return null; }
    const c = C.cosmetologas.find((x) => x.id === est.cos);
    const r = {
      ticket: nuevoTicket(), fecha: est.fecha, cosmetologa: est.cos, inicio: est.hora, minutos: servicio().minutos,
      servicio: servicio().nombre, cosmetologaNombre: c.nombre, nombre: nombre.value.trim(), telefono: tel.value.trim()
    };
    guardar(r);
    msg.textContent = "";
    mostrarTicket(r);
    nombre.value = tel.value = "";
    est.cos = est.hora = null; pintar();
    return r;
  }

  btnGuardar.addEventListener("click", registrar);

  btnConfirmar.addEventListener("click", () => {
    const r = registrar();
    if (!r) return;
    enviarWhatsApp(r, "Hola, quiero agendar una cita:");
    msg.textContent = "Se abrió WhatsApp con tu solicitud. Tu cita queda confirmada cuando MPau Spa te responda.";
  });

  // Los botones "Reservar" de cada tratamiento preseleccionan el servicio.
  document.querySelectorAll("[data-servicio]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault(); est.servicio = a.dataset.servicio; selServicio.value = est.servicio;
    est.cos = est.hora = null; if (est.fecha && !hayDisponibilidad(est.fecha)) est.fecha = null;
    pintar(); document.getElementById("reservar").scrollIntoView({ behavior: "smooth" });
  }));

  est.mes = new Date(ahora().getFullYear(), ahora().getMonth(), 1);
  pintar();
});
