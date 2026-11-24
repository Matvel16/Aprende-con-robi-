import type { BloquePrograma, BloqueSimple, Direccion, Reto } from './types';

export interface PasoRobi {
  pasoNumero: number;
  x: number;
  y: number;
  direccion: Direccion;
  numeroBloque: number;
  choco: boolean;
}

export type ResultadoEjecucion = 'logrado' | 'choque' | 'corto';

export interface SimulacionRobi {
  pasos: PasoRobi[];
  resultado: ResultadoEjecucion;
  pasoChoque: number | null;
}

const GIRAR_IZQUIERDA: Record<Direccion, Direccion> = {
  E: 'N',
  N: 'O',
  O: 'S',
  S: 'E',
};

const GIRAR_DERECHA: Record<Direccion, Direccion> = {
  E: 'S',
  S: 'O',
  O: 'N',
  N: 'E',
};

const DELTA_DIRECCION: Record<Direccion, { dx: number; dy: number }> = {
  N: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  S: { dx: 0, dy: 1 },
  O: { dx: -1, dy: 0 },
};

export function contarBloquesPrograma(programa: BloquePrograma[]): number {
  let total = 0;
  for (const bloque of programa) {
    total += 1;
    if (bloque.tipo === 'repetir') {
      total += bloque.cuerpo.length;
    }
  }
  return total;
}

export function ejecutarProgramaRobi(
  reto: Pick<
    Reto,
    | 'ancho'
    | 'alto'
    | 'inicio_x'
    | 'inicio_y'
    | 'direccion_inicial'
    | 'meta_x'
    | 'meta_y'
    | 'muros'
  >,
  programa: BloquePrograma[],
): SimulacionRobi {
  let x = reto.inicio_x;
  let y = reto.inicio_y;
  let direccion: Direccion = reto.direccion_inicial;

  const murosSet = new Set(
    (reto.muros ?? []).map(([mx, my]) => `${mx},${my}`),
  );

  const pasos: PasoRobi[] = [];
  let pasoNumero = 0;
  let resultado: ResultadoEjecucion | null = null;
  let pasoChoque: number | null = null;

  function ejecutarBloqueSimple(bloque: BloqueSimple, numeroBloque: number) {
    if (resultado !== null) return;

    pasoNumero += 1;

    if (bloque.tipo === 'izquierda') {
      direccion = GIRAR_IZQUIERDA[direccion];
      pasos.push({
        pasoNumero,
        x,
        y,
        direccion,
        numeroBloque,
        choco: false,
      });
      return;
    }

    if (bloque.tipo === 'derecha') {
      direccion = GIRAR_DERECHA[direccion];
      pasos.push({
        pasoNumero,
        x,
        y,
        direccion,
        numeroBloque,
        choco: false,
      });
      return;
    }

    const { dx, dy } = DELTA_DIRECCION[direccion];
    const siguienteX = x + dx;
    const siguienteY = y + dy;

    const fueraDeCuadricula =
      siguienteX < 0 ||
      siguienteX >= reto.ancho ||
      siguienteY < 0 ||
      siguienteY >= reto.alto;
    const hayMuro = murosSet.has(`${siguienteX},${siguienteY}`);

    if (fueraDeCuadricula || hayMuro) {
      pasos.push({
        pasoNumero,
        x,
        y,
        direccion,
        numeroBloque,
        choco: true,
      });
      resultado = 'choque';
      pasoChoque = pasoNumero;
      return;
    }

    x = siguienteX;
    y = siguienteY;

    pasos.push({
      pasoNumero,
      x,
      y,
      direccion,
      numeroBloque,
      choco: false,
    });

    if (x === reto.meta_x && y === reto.meta_y) {
      resultado = 'logrado';
    }
  }

  let numeroBloqueActual = 0;

  for (const bloque of programa) {
    if (resultado !== null) break;

    numeroBloqueActual += 1;

    if (bloque.tipo === 'repetir') {
      const numeroInicioCuerpo = numeroBloqueActual;
      for (let vuelta = 0; vuelta < bloque.veces; vuelta += 1) {
        if (resultado !== null) break;
        for (let idx = 0; idx < bloque.cuerpo.length; idx += 1) {
          if (resultado !== null) break;
          ejecutarBloqueSimple(bloque.cuerpo[idx], numeroInicioCuerpo + 1 + idx);
        }
      }
      numeroBloqueActual += bloque.cuerpo.length;
    } else {
      ejecutarBloqueSimple(bloque, numeroBloqueActual);
    }
  }

  return {
    pasos,
    resultado: resultado ?? 'corto',
    pasoChoque,
  };
}
