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
  document.getElementById("cargando").style.display = "none";
}

function mostrarPartidos(partidos) {
  let tabla = document.querySelector("#tablaPartidos tbody");
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
  let tabla = document.querySelector("#tablaApuestas tbody");

  let html = "";

  predicciones.forEach((pr) => {
    let partido = partidos.find((p) => String(p.id) === String(pr.partido_id));

    if (!partido) return;

    let clase = "";

    // verificar si el partido ya tiene resultado
    if (partido.goles_local && partido.goles_visitante) {
      let acertoExacto =
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
  let ranking = {};

  // base: puntos acumulados
  jugadores.forEach((j) => {
    let jugador = j.jugador.trim();

    ranking[jugador] = {
      hoy: 0,
      total: Number(j.puntos || 0),
    };
  });

  predicciones.forEach((pr) => {
    let partido = partidosHoy.find(
      (p) => String(p.id) === String(pr.partido_id),
    );

    if (!partido) return;

    if (partido.goles_local === "" || partido.goles_visitante === "") return;

    let acertoExacto =
      pr.pred_local == partido.goles_local &&
      pr.pred_visitante == partido.goles_visitante;

    if (acertoExacto) {
      let jugador = pr.jugador.trim();

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
  let tabla = document.querySelector("#ranking tbody");

  tabla.innerHTML = "";

  let lista = Object.entries(ranking);

  // ordenar por total
  lista.sort((a, b) => b[1].total - a[1].total);

  lista.forEach((j, index) => {
    let medalla = "";

    if (index === 0) medalla = "🥇";
    if (index === 1) medalla = "🥈";
    if (index === 2) medalla = "🥉";

    tabla.innerHTML += `
    <tr>
      <td>${medalla} ${j[0]}</td>
      <td>${j[1].hoy}</td>
      <td>${j[1].total}</td>
    </tr>
    `;
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

setInterval(cargarDatos, 30000);
