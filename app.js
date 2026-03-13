async function cargarDatos() {
  const partidos = await fetch(
    "https://sheetdb.io/api/v1/7l6jlsm3n56yo?sheet=partidos",
  ).then((r) => r.json());

  const predicciones = await fetch(
    "https://sheetdb.io/api/v1/7l6jlsm3n56yo?sheet=predicciones",
  ).then((r) => r.json());

  const hoy = new Date().toISOString().slice(0, 10);

  const partidosHoy = partidos.filter((p) => p.fecha === hoy);

  mostrarPartidos(partidosHoy);

  mostrarApuestas(partidosHoy, predicciones);

  calcularRanking(partidos, partidosHoy, predicciones);
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

function calcularRanking(partidos, partidosHoy, predicciones) {
  let ranking = {};

  predicciones.forEach((pr) => {
    let partido = partidos.find((p) => String(p.id) === String(pr.partido_id));

    if (!partido) return;

    let puntos = 0;

    if (
      pr.pred_local == partido.goles_local &&
      pr.pred_visitante == partido.goles_visitante
    ) {
      puntos = 3;
    } else {
      let ganadorReal = Math.sign(
        partido.goles_local - partido.goles_visitante,
      );
      let ganadorPred = Math.sign(pr.pred_local - pr.pred_visitante);

      if (ganadorReal == ganadorPred) {
        puntos = 1;
      }
    }

    if (!ranking[pr.jugador]) {
      ranking[pr.jugador] = { hoy: 0, total: 0 };
    }

    ranking[pr.jugador].total += puntos;

    let esPartidoHoy = partidosHoy.find(
      (p) => String(p.id) === String(pr.partido_id),
    );

    if (esPartidoHoy) {
      ranking[pr.jugador].hoy += puntos;
    }
  });

  mostrarRanking(ranking);
}

function mostrarRanking(ranking) {
  let tabla = document.querySelector("#ranking tbody");

  let lista = Object.entries(ranking);

  lista.sort((a, b) => b[1].total - a[1].total);

  lista.forEach((j) => {
    tabla.innerHTML += `
<tr>
<td>${j[0]}</td>
<td>${j[1].hoy}</td>
<td>${j[1].total}</td>
</tr>
`;
  });
}

cargarDatos();
