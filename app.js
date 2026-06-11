// ⚙️ Cambia esta URL por la nueva que genera Apps Script al redesplegar
const BASE_URL =
  "https://script.google.com/macros/s/AKfycbzWBJ5KQO5bgDCmCMVGjHqUoC6j8T4nPD71wU_D6oxWVcT8z7w3wb7CFcsFXmjUQAU4Jw/exec";

let rankingAnterior = {};
let puntosGuardados = false;

// ─── JSONP helper: evita el bloqueo CORS de Apps Script ───────────────────────
function fetchSheet(sheet) {
  return new Promise((resolve, reject) => {
    const callbackName = "cb_" + sheet + "_" + Date.now();
    const script = document.createElement("script");

    script.src = `${BASE_URL}?sheet=${sheet}&callback=${callbackName}`;

    window[callbackName] = (data) => {
      resolve(data);
      delete window[callbackName];
      script.remove();
    };

    script.onerror = () => {
      reject(new Error("Error cargando sheet: " + sheet));
      delete window[callbackName];
      script.remove();
    };

    document.head.appendChild(script);
  });
}

// ─── Carga principal ──────────────────────────────────────────────────────────
async function cargarDatos() {
  try {
    const [partidos, predicciones, jugadores, apuesta] = await Promise.all([
      fetchSheet("partidos"),
      fetchSheet("predicciones"),
      fetchSheet("jugadores"),
      fetchSheet("apuesta"),
    ]);

    console.log("PARTIDOS", partidos);
    console.log("PREDICCIONES", predicciones);
    console.log("JUGADORES", jugadores);
    console.log("APUESTA", apuesta);

    const hoy = new Date().toLocaleDateString("sv-SE", {
      timeZone: "America/Bogota",
    });

    const partidosHoy = partidos.filter((p) => p.fecha?.includes(hoy));

    mostrarPartidos(partidosHoy);
    mostrarApuestaGeneral(apuesta);
    mostrarApuestas(partidos, predicciones);
    calcularRanking(partidosHoy, predicciones, jugadores);
    mostrarUltimaActualizacion();
  } catch (error) {
    console.error("ERROR CARGANDO DATOS:", error);
  }
}

// ─── Render de partidos ───────────────────────────────────────────────────────
function mostrarPartidos(partidos) {
  const tabla = document.querySelector("#tablaPartidos tbody");
  tabla.innerHTML = "";

  if (partidos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="2">No hay partidos programados para hoy.</td></tr>`;
    return;
  }

  partidos.forEach((p) => {
    tabla.innerHTML += `
      <tr>
        <td>${p.local} vs ${p.visitante}</td>
        <td>${p.goles_local !== "" ? p.goles_local + "-" + p.goles_visitante : "—"}</td>
        <td>${p.primer_gol || "—"}</td>
      </tr>
    `;
  });
}

// ─── Render de apuesta del torneo ────────────────────────────────────────────
function mostrarApuestaGeneral(apuestas) {
  const tabla = document.querySelector("#tablaApuesta tbody");

  if (!apuestas || apuestas.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5">Sin apuestas registradas.</td></tr>`;
    return;
  }

  tabla.innerHTML = apuestas
    .map(
      (a) => `
      <tr>
        <td>${a["Jugador"] ?? a["jugador"] ?? ""}</td>
        <td>${a["Campeón"] ?? a["campeon"] ?? a["Campeon"] ?? ""}</td>
        <td>${a["Subcampeón"] ?? a["subcampeon"] ?? a["Subcampeon"] ?? ""}</td>
        <td>${a["Tercero"] ?? a["tercero"] ?? ""}</td>
        <td>${a["Cuarto"] ?? a["cuarto"] ?? ""}</td>
      </tr>`,
    )
    .join("");
}

// ─── Render de apuestas ───────────────────────────────────────────────────────
function mostrarApuestas(partidos, predicciones) {
  const tabla = document.querySelector("#tablaApuestas tbody");
  const hoy = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Bogota",
  });
  let html = "";

  predicciones.forEach((pr) => {
    const partido = partidos.find(
      (p) => String(p.id) === String(pr.partido_id),
    );
    if (!partido) return;

    const abierto = partido.estado?.trim().toLowerCase() === "abierto";
    const esHoy = partido.fecha?.includes(hoy);

    if (!abierto && !esHoy) return;

    let clase = "";
    if (
      !abierto &&
      partido.goles_local !== "" &&
      partido.goles_visitante !== ""
    ) {
      const acertoExacto =
        Number(pr.pred_local) === Number(partido.goles_local) &&
        Number(pr.pred_visitante) === Number(partido.goles_visitante);
      clase = acertoExacto ? "acierto" : "fallo";
    }

    let clasePrimerGol = "";
    if (!abierto && partido.primer_gol && pr.primer_gol) {
      clasePrimerGol =
        pr.primer_gol.trim().toLowerCase() ===
        partido.primer_gol.trim().toLowerCase()
          ? "acierto-gol"
          : "fallo-gol";
    }

    const valLocal =
      pr.pred_local !== undefined && pr.pred_local !== "" ? pr.pred_local : "";
    const valVisitante =
      pr.pred_visitante !== undefined && pr.pred_visitante !== ""
        ? pr.pred_visitante
        : "";
    const valGol = pr.primer_gol || "";

    const tienePred = valLocal !== "" && valVisitante !== "";

    const tdPrediccion = abierto
      ? `<td>
           <input type="number" class="inp-local" min="0" max="20" value="${valLocal}" placeholder="L">
           &nbsp;-&nbsp;
           <input type="number" class="inp-visitante" min="0" max="20" value="${valVisitante}" placeholder="V">
         </td>`
      : `<td>${tienePred ? valLocal + "-" + valVisitante : '<span class="sin-apuesta">No apostó</span>'}</td>`;

    const tdPrimerGol = abierto
      ? `<td>
           <select class="inp-primer-gol">
             <option value="">— equipo —</option>
             <option value="${partido.local}"  ${valGol === partido.local ? "selected" : ""}>${partido.local}</option>
             <option value="${partido.visitante}" ${valGol === partido.visitante ? "selected" : ""}>${partido.visitante}</option>
           </select>
         </td>`
      : `<td class="${clasePrimerGol}">${valGol || "—"}</td>`;

    const tdAccion = abierto
      ? `<td><button class="btn-guardar" onclick="guardarPrediccion(${pr._row}, '${pr.jugador}', this)">Guardar</button></td>`
      : `<td>—</td>`;

    html += `
      <tr class="${clase}">
        <td>${pr.jugador}</td>
        <td>${partido.local} vs ${partido.visitante}</td>
        ${tdPrediccion}
        ${tdPrimerGol}
        ${tdAccion}
      </tr>
    `;
  });

  tabla.innerHTML =
    html || `<tr><td colspan="5">Sin apuestas disponibles.</td></tr>`;
}

// ─── Guardar predicción via JSONP ─────────────────────────────────────────────
function guardarPrediccion(row, jugador, btn) {
  const fila = btn.closest("tr");
  const predLocal = fila.querySelector(".inp-local").value;
  const predVisitante = fila.querySelector(".inp-visitante").value;
  const primerGol = fila.querySelector(".inp-primer-gol")?.value || "";

  if (predLocal === "" || predVisitante === "") {
    alert("Ingresa el marcador completo antes de guardar.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Guardando...";

  const callbackName = "cb_save_" + Date.now();
  const script = document.createElement("script");
  script.src =
    `${BASE_URL}?action=updatePrediccion` +
    `&row=${encodeURIComponent(row)}` +
    `&jugador=${encodeURIComponent(jugador)}` +
    `&pred_local=${encodeURIComponent(predLocal)}` +
    `&pred_visitante=${encodeURIComponent(predVisitante)}` +
    `&primer_gol=${encodeURIComponent(primerGol)}` +
    `&callback=${callbackName}`;

  window[callbackName] = (resp) => {
    delete window[callbackName];
    script.remove();
    btn.disabled = false;
    if (resp && resp.ok) {
      btn.textContent = "✓ Guardado";
      btn.style.background = "#28a745";
      setTimeout(() => {
        btn.textContent = "Guardar";
        btn.style.background = "";
      }, 2500);
    } else {
      btn.textContent = "Error";
      btn.style.background = "#dc3545";
      setTimeout(() => {
        btn.textContent = "Guardar";
        btn.style.background = "";
      }, 3000);
      alert("Error al guardar: " + (resp?.error || "Intenta de nuevo."));
    }
  };

  script.onerror = () => {
    delete window[callbackName];
    script.remove();
    btn.disabled = false;
    btn.textContent = "Error";
    setTimeout(() => {
      btn.textContent = "Guardar";
    }, 3000);
    alert("Error de conexión. Verifica tu internet.");
  };

  document.head.appendChild(script);
}

// ─── Cálculo de ranking ───────────────────────────────────────────────────────
function calcularRanking(partidosHoy, predicciones, jugadores) {
  const ranking = {};

  jugadores.forEach((j) => {
    const jugador = j.jugador.trim();
    ranking[jugador] = {
      hoy: 0,
      total: Number(j.puntos || 0),
    };
  });

  predicciones.forEach((pr) => {
    const partido = partidosHoy.find(
      (p) => String(p.id) === String(pr.partido_id),
    );

    if (!partido) return;
    if (partido.goles_local === "" || partido.goles_visitante === "") return;

    // Sin predicción ingresada → no puntúa
    if (pr.pred_local === "" || pr.pred_local === null || pr.pred_local === undefined ||
        pr.pred_visitante === "" || pr.pred_visitante === null || pr.pred_visitante === undefined) return;

    const acertoExacto =
      Number(pr.pred_local) === Number(partido.goles_local) &&
      Number(pr.pred_visitante) === Number(partido.goles_visitante);

    const jugador = pr.jugador.trim();
    if (!ranking[jugador]) ranking[jugador] = { hoy: 0, total: 0 };

    if (acertoExacto) {
      ranking[jugador].hoy += 3;
      ranking[jugador].total += 3;
    }

    if (
      partido.primer_gol &&
      pr.primer_gol &&
      pr.primer_gol.trim().toLowerCase() ===
        partido.primer_gol.trim().toLowerCase()
    ) {
      ranking[jugador].hoy += 1;
      ranking[jugador].total += 1;
    }
  });

  mostrarRanking(ranking);
}

// ─── Render de ranking ────────────────────────────────────────────────────────
function mostrarRanking(ranking) {
  const tabla = document.querySelector("#ranking tbody");
  tabla.innerHTML = "";

  const lista = Object.entries(ranking);
  lista.sort((a, b) => b[1].total - a[1].total);
  const max = lista[0]?.[1].total || 1;

  lista.forEach((j, index) => {
    const jugador = j[0];
    const datos = j[1];

    let medalla = "";
    if (index === 0) medalla = "🥇";
    if (index === 1) medalla = "🥈";
    if (index === 2) medalla = "🥉";

    let clase = "";
    if (
      rankingAnterior[jugador] !== undefined &&
      rankingAnterior[jugador] !== datos.total
    ) {
      clase = datos.total > rankingAnterior[jugador] ? "subio" : "bajo";
    }

    tabla.innerHTML += `
      <tr class="${clase}">
        <td>${medalla} ${jugador}</td>
        <td>${datos.hoy}</td>
        <td>
          <div class="barra-container">
            <div class="barra-fondo">
              <div class="barra" style="width:${(datos.total / max) * 120}px"></div>
            </div>
            <span class="puntos">${datos.total}</span>
          </div>
        </td>
      </tr>
    `;
  });

  // Guardar estado actual para la próxima comparación
  rankingAnterior = {};
  lista.forEach((j) => {
    rankingAnterior[j[0]] = j[1].total;
  });

  // Mostrar botón de guardar jornada si hay puntos del día sin persistir
  const divAccion = document.getElementById("accionPuntos");
  const hayPuntosHoy = lista.some(([, d]) => d.hoy > 0);

  if (hayPuntosHoy && !puntosGuardados) {
    divAccion.innerHTML = `
      <button id="btn-guardar-puntos" class="btn-guardar-jornada"
              onclick="guardarPuntos(${JSON.stringify(lista.map(([j, d]) => ({ jugador: j, total: d.total })))})">
        Guardar puntos de la jornada
      </button>`;
  } else if (puntosGuardados) {
    divAccion.innerHTML = `<p class="puntos-ok">✓ Puntos de la jornada guardados</p>`;
  } else {
    divAccion.innerHTML = "";
  }
}

// ─── Persistir puntos en jugadores sheet ──────────────────────────────────────
function guardarPuntos(jugadoresConTotal) {
  if (puntosGuardados) return;

  const btn = document.getElementById("btn-guardar-puntos");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  let completados = 0;
  let errores = 0;
  const total = jugadoresConTotal.length;

  jugadoresConTotal.forEach(({ jugador, total: puntos }) => {
    const cbName = "cb_pts_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    script.src =
      `${BASE_URL}?action=updatePuntos` +
      `&jugador=${encodeURIComponent(jugador)}` +
      `&puntos=${encodeURIComponent(puntos)}` +
      `&callback=${cbName}`;

    window[cbName] = (resp) => {
      delete window[cbName];
      script.remove();
      completados++;
      if (!resp?.ok) errores++;

      if (completados === total) {
        if (errores === 0) {
          puntosGuardados = true;
          document.getElementById("accionPuntos").innerHTML =
            `<p class="puntos-ok">✓ Puntos de la jornada guardados</p>`;
        } else {
          btn.disabled = false;
          btn.textContent = "Reintentar";
        }
      }
    };

    script.onerror = () => {
      delete window[cbName];
      script.remove();
      completados++;
      errores++;
      if (completados === total) {
        btn.disabled = false;
        btn.textContent = "Error — Reintentar";
      }
    };

    document.head.appendChild(script);
  });
}

// ─── Última actualización ─────────────────────────────────────────────────────
function mostrarUltimaActualizacion() {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const hora = ahora.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  document.getElementById("ultimaActualizacion").textContent =
    `Última actualización: ${fecha} a las ${hora}`;
}

// ─── Arranque ─────────────────────────────────────────────────────────────────
cargarDatos();
setInterval(cargarDatos, 60000); // cada 60 segundos (antes 30s — ahorra requests)
