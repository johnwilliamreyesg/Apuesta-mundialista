let rankingAnterior = {};

async function cargarDatos() {
  const [partidos, predicciones, jugadores] = await Promise.all([
    fetch("https://sheetdb.io/api/v1/7l6jlsm3n56yo?sheet=partidos").then((r) =>
      r.json(),
    ),
    fetch("https://sheetdb.io/api/v1/7l6jlsm3n56yo?sheet=predicciones").then(
      (r) => r.json(),
    ),
    fetch("https://sheetdb.io/api/v1/7l6jlsm3n56yo?sheet=jugadores").then((r) =>
      r.json(),
    ),
  ]);

  const hoy = new Date().toISOString().slice(0, 10);

  const partidosHoy = partidos.filter((p) => p.fecha === hoy);

  mostrarPartidos(partidosHoy);
  mostrarApuestas(partidosHoy, predicciones);
  calcularRanking(partidosHoy, predicciones, jugadores);
  mostrarUltimaActualizacion();
}

function mostrarPartidos(partidos) {
  const tabla = document.querySelector("#tablaPartidos tbody");
  tabla.innerHTML = "";

  partidos.forEach((p) => {
    tabla.innerHTML += `
<tr>
<td>${p.local} vs ${p.visitante}</td>
<td>${p.goles_local}-${p.goles_visitante}</td>
</tr>
`;
  });
}

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

  tabla.innerHTML = html;
}

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

      if (!ranking[jugador]) {
        ranking[jugador] = { hoy: 0, total: 0 };
      }

      ranking[jugador].hoy += 1;
      ranking[jugador].total += 1;
    }
  });

  mostrarRanking(ranking);
}

function mostrarRanking(ranking) {
  const tabla = document.querySelector("#ranking tbody");
  tabla.innerHTML = "";

  const lista = Object.entries(ranking);
  lista.sort((a, b) => b[1].total - a[1].total);
  const max = lista[0][1].total || 1;

  lista.forEach((j, index) => {
    const jugador = j[0];
    const datos = j[1];

    let medalla = "";

    if (index === 0) medalla = "🥇";
    if (index === 1) medalla = "🥈";
    if (index === 2) medalla = "🥉";

    let clase = "";

    if (rankingAnterior[jugador] && rankingAnterior[jugador] !== datos.total) {
      clase = "cambioRanking";
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

  rankingAnterior = {};

  lista.forEach((j) => {
    rankingAnterior[j[0]] = j[1].total;
  });
}

function mostrarUltimaActualizacion() {
  const ahora = new Date();

  const fecha = ahora.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  document.getElementById("ultimaActualizacion").textContent =
    `Última actualización: ${fecha}`;
}

cargarDatos();

setInterval(cargarDatos, 30000);
