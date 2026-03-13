async function cargarDatos() {
  const partidos = await fetch(
    "https://sheetdb.io/api/v1/7l6jlsm3n56yo?sheet=partidos",
  ).then((r) => r.json());

  const predicciones = await fetch(
    "https://sheetdb.io/api/v1/7l6jlsm3n56yo?sheet=predicciones",
  ).then((r) => r.json());

  const totalPuntosJugadores = await fetch(
    "https://sheetdb.io/api/v1/7l6jlsm3n56yo?sheet=jugadores",
  ).then((r) => r.json());

  const hoy = new Date().toISOString().slice(0, 10);

  const partidosHoy = partidos.filter((p) => p.fecha === hoy);

  mostrarPartidos(partidosHoy);

  mostrarApuestas(partidosHoy, predicciones);

  calcularRanking(partidosHoy, predicciones, totalPuntosJugadores);
}

function mostrarPartidos(partidos) {
  let tabla = document.querySelector("#tablaPartidos tbody");

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

  predicciones.forEach((pr) => {
    let partido = partidos.find((p) => String(p.id) === String(pr.partido_id));

    if (!partido) return;

    tabla.innerHTML += `
<tr>
<td>${pr.jugador}</td>
<td>${partido.local} vs ${partido.visitante}</td>
<td>${pr.pred_local}-${pr.pred_visitante}</td>
</tr>
`;
  });
}

function calcularRanking(partidosHoy, predicciones, jugadores) {
  let ranking = {};

  // base: puntos acumulados
  jugadores.forEach((j) => {
    ranking[j.jugador] = {
      hoy: 0,
      total: Number(j.puntos),
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
      if (!ranking[pr.jugador]) {
        ranking[pr.jugador] = { hoy: 0, total: 0 };
      }

      ranking[pr.jugador].hoy += 1;
      ranking[pr.jugador].total += 1;
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

cargarDatos();
