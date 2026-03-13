async function cargarDatos() {
  const partidos = await fetch(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5fKhafUlyUgea0EnaEz8MaE0sDNmkMjSW6FrJeAI2b3mHnnM_-zix4fs9HrT_-06pZavItvwISAjq/pubhtml?gid=0&single=true",
  ).then((r) => r.json());
  const predicciones = await fetch(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5fKhafUlyUgea0EnaEz8MaE0sDNmkMjSW6FrJeAI2b3mHnnM_-zix4fs9HrT_-06pZavItvwISAjq/pubhtml?gid=848995688&single=true",
  ).then((r) => r.json());

  let ranking = {};

  predicciones.forEach((p) => {
    let partido = partidos.find((x) => x.id == p.partido_id);

    let puntos = 0;

    // resultado exacto
    if (
      p.pred_local == partido.goles_local &&
      p.pred_visitante == partido.goles_visitante
    ) {
      puntos = 3;
    } else {
      // ganador correcto
      let ganadorReal = Math.sign(
        partido.goles_local - partido.goles_visitante,
      );

      let ganadorPred = Math.sign(p.pred_local - p.pred_visitante);

      if (ganadorReal == ganadorPred) {
        puntos = 1;
      }
    }

    if (!ranking[p.jugador]) {
      ranking[p.jugador] = 0;
    }

    ranking[p.jugador] += puntos;
  });

  mostrarRanking(ranking);
}

function mostrarRanking(ranking) {
  let tabla = document.querySelector("#ranking tbody");

  let lista = Object.entries(ranking);

  lista.sort((a, b) => b[1] - a[1]);

  lista.forEach((j) => {
    tabla.innerHTML += `
<tr>
<td>${j[0]}</td>
<td>${j[1]}</td>
</tr>
`;
  });
}

cargarDatos();
