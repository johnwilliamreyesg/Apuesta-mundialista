// let rankingAnterior = {};

// async function cargarDatos() {
//   try {
//     const [partidos, predicciones, jugadores] = await Promise.all([
//       fetch(
//         "https://script.google.com/macros/s/AKfycbyXrmBpx5py6kh62qq20a96Sywv-K22iJBHRpMZvFG-htGn38x0tWobY904smTaqf3rBQ/exec?sheet=partidos",
//       ).then((r) => r.json()),
//       fetch(
//         "https://script.google.com/macros/s/AKfycbyXrmBpx5py6kh62qq20a96Sywv-K22iJBHRpMZvFG-htGn38x0tWobY904smTaqf3rBQ/exec?sheet=predicciones",
//       ).then((r) => r.json()),
//       fetch(
//         "https://script.google.com/macros/s/AKfycbyXrmBpx5py6kh62qq20a96Sywv-K22iJBHRpMZvFG-htGn38x0tWobY904smTaqf3rBQ/exec?sheet=jugadores",
//       ).then((r) => r.json()),
//     ]);

//     console.log("PARTIDOS", partidos);
//     console.log("PREDICCIONES", predicciones);
//     console.log("JUGADORES", jugadores);

//     const hoy = new Date().toLocaleDateString("sv-SE", {
//       timeZone: "America/Bogota",
//     });

//     const partidosHoy = partidos.filter((p) => p.fecha?.includes(hoy));

//     mostrarPartidos(partidosHoy);
//     mostrarApuestas(partidosHoy, predicciones);
//     calcularRanking(partidosHoy, predicciones, jugadores);
//     mostrarUltimaActualizacion();
//   } catch (error) {
//     console.error("ERROR CARGANDO DATOS:", error);
//   }
// }

// function mostrarPartidos(partidos) {
//   const tabla = document.querySelector("#tablaPartidos tbody");
//   tabla.innerHTML = "";

//   partidos.forEach((p) => {
//     tabla.innerHTML += `
// <tr>
// <td>${p.local} vs ${p.visitante}</td>
// <td>${p.goles_local}-${p.goles_visitante}</td>
// </tr>
// `;
//   });
// }

// function mostrarApuestas(partidos, predicciones) {
//   const tabla = document.querySelector("#tablaApuestas tbody");
//   let html = "";

//   predicciones.forEach((pr) => {
//     const partido = partidos.find(
//       (p) => String(p.id) === String(pr.partido_id),
//     );

//     if (!partido) return;

//     let clase = "";

//     if (partido.goles_local !== "" && partido.goles_visitante !== "") {
//       const acertoExacto =
//         Number(pr.pred_local) === Number(partido.goles_local) &&
//         Number(pr.pred_visitante) === Number(partido.goles_visitante);

//       clase = acertoExacto ? "acierto" : "fallo";
//     }

//     html += `
// <tr class="${clase}">
// <td>${pr.jugador}</td>
// <td>${partido.local} vs ${partido.visitante}</td>
// <td>${pr.pred_local}-${pr.pred_visitante}</td>
// </tr>
// `;
//   });

//   tabla.innerHTML = html;
// }

// function calcularRanking(partidosHoy, predicciones, jugadores) {
//   const ranking = {};

//   jugadores.forEach((j) => {
//     const jugador = j.jugador.trim();

//     ranking[jugador] = {
//       hoy: 0,
//       total: Number(j.puntos || 0),
//     };
//   });

//   predicciones.forEach((pr) => {
//     const partido = partidosHoy.find(
//       (p) => String(p.id) === String(pr.partido_id),
//     );

//     if (!partido) return;

//     if (partido.goles_local === "" || partido.goles_visitante === "") return;

//     const acertoExacto =
//       Number(pr.pred_local) === Number(partido.goles_local) &&
//       Number(pr.pred_visitante) === Number(partido.goles_visitante);

//     if (acertoExacto) {
//       const jugador = pr.jugador.trim();

//       if (!ranking[jugador]) {
//         ranking[jugador] = { hoy: 0, total: 0 };
//       }

//       ranking[jugador].hoy += 1;
//       ranking[jugador].total += 1;
//     }
//   });

//   mostrarRanking(ranking);
// }

// function mostrarRanking(ranking) {
//   const tabla = document.querySelector("#ranking tbody");
//   tabla.innerHTML = "";

//   const lista = Object.entries(ranking);
//   lista.sort((a, b) => b[1].total - a[1].total);
//   const max = lista[0][1].total || 1;

//   lista.forEach((j, index) => {
//     const jugador = j[0];
//     const datos = j[1];

//     let medalla = "";

//     if (index === 0) medalla = "🥇";
//     if (index === 1) medalla = "🥈";
//     if (index === 2) medalla = "🥉";

//     let clase = "";

//     if (rankingAnterior[jugador] && rankingAnterior[jugador] !== datos.total) {
//       clase = "cambioRanking";
//     }

//     tabla.innerHTML += `
// <tr class="${clase}">
// <td>${medalla} ${jugador}</td>
// <td>${datos.hoy}</td>
// <td>
//   <div class="barra-container">
//     <div class="barra-fondo">
//       <div class="barra" style="width:${(datos.total / max) * 120}px"></div>
//     </div>
//     <span class="puntos">${datos.total}</span>
//   </div>
// </td>
// </tr>
// `;
//   });

//   rankingAnterior = {};

//   lista.forEach((j) => {
//     rankingAnterior[j[0]] = j[1].total;
//   });
// }

// function mostrarUltimaActualizacion() {
//   const ahora = new Date();

//   const fecha = ahora.toLocaleDateString("es-CO", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });

//   document.getElementById("ultimaActualizacion").textContent =
//     `Última actualización: ${fecha}`;
// }

// cargarDatos();

// setInterval(cargarDatos, 30000);

// ⚙️ Cambia esta URL por la nueva que genera Apps Script al redesplegar
const BASE_URL =
  "https://script.google.com/macros/s/AKfycbwDR3V4d5-1yuRKV7b7P7Sdqun2LcE0ekc-tCBFNEHEL4ijViZ4deik-5oWB5Pc_6JZcg/exec";

let rankingAnterior = {};

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
    mostrarApuestas(partidosHoy, predicciones);
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
  let html = "";

  predicciones.forEach((pr) => {
    const partido = partidos.find(
      (p) => String(p.id) === String(pr.partido_id),
    );

    if (!partido) return;

    let clase = "";

    if (partido.goles_local !== "" && partido.goles_visitante !== "") {
      const acertoExacto =
        Number(pr.pred_local) === Number(partido.goles_local) &&
        Number(pr.pred_visitante) === Number(partido.goles_visitante);

      clase = acertoExacto ? "acierto" : "fallo";
    }

    html += `
      <tr class="${clase}">
        <td>${pr.jugador}</td>
        <td>${partido.local} vs ${partido.visitante}</td>
        <td>${pr.pred_local}-${pr.pred_visitante}</td>
      </tr>
    `;
  });

  tabla.innerHTML =
    html || `<tr><td colspan="3">Sin apuestas para hoy.</td></tr>`;
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

    const acertoExacto =
      Number(pr.pred_local) === Number(partido.goles_local) &&
      Number(pr.pred_visitante) === Number(partido.goles_visitante);

    if (acertoExacto) {
      const jugador = pr.jugador.trim();
      if (!ranking[jugador]) ranking[jugador] = { hoy: 0, total: 0 };
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
