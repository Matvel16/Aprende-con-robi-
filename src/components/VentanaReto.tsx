import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Star,
  Trash2,
  Undo2,
} from 'lucide-react';
import { contarBloquesPrograma, ejecutarProgramaRobi, type ResultadoEjecucion } from '../robi';
import { supabase } from '../supabase';
import type {
  BloquePrograma,
  BloqueSimple,
  Direccion,
  Reto,
  TipoBloqueSimple,
} from '../types';
import { RobotSvg } from './RobotSvg';

interface VentanaRetoProps {
  reto: Reto;
  exploradorId: number;
  siguienteRetoId: number | null;
  onAbrirSiguienteReto: (retoId: number) => void;
  onVolverAlMapa: () => void;
  onIntentoGuardado: () => Promise<void>;
}

const ETIQUETA_BLOQUE: Record<TipoBloqueSimple, string> = {
  avanzar: 'Avanzar',
  izquierda: 'Girar a la izquierda',
  derecha: 'Girar a la derecha',
};

function iconoBloque(tipo: TipoBloqueSimple) {
  if (tipo === 'avanzar') {
    return <ArrowUp className="w-5 h-5 shrink-0" aria-hidden="true" />;
  }
  if (tipo === 'izquierda') {
    return <RotateCcw className="w-5 h-5 shrink-0" aria-hidden="true" />;
  }
  return <RotateCw className="w-5 h-5 shrink-0" aria-hidden="true" />;
}

export function VentanaReto({
  reto,
  exploradorId,
  siguienteRetoId,
  onAbrirSiguienteReto,
  onVolverAlMapa,
  onIntentoGuardado,
}: VentanaRetoProps) {
  const [programa, setPrograma] = useState<BloquePrograma[]>([]);
  const [vecesRepetir, setVecesRepetir] = useState<number>(2);
  const [editandoRepetir, setEditandoRepetir] = useState<boolean>(false);

  const [posX, setPosX] = useState<number>(reto.inicio_x);
  const [posY, setPosY] = useState<number>(reto.inicio_y);
  const [direccion, setDireccion] = useState<Direccion>(reto.direccion_inicial);
  const [choco, setChoco] = useState<boolean>(false);
  const [bloqueActivo, setBloqueActivo] = useState<number | null>(null);

  const [ejecutando, setEjecutando] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [resultado, setResultado] = useState<ResultadoEjecucion | null>(null);
  const [pasoChoque, setPasoChoque] = useState<number | null>(null);
  const [estrellasGanadas, setEstrellasGanadas] = useState<number | null>(null);
  const [avisoPrograma, setAvisoPrograma] = useState<string | null>(null);
  const [errorSupabase, setErrorSupabase] = useState<string | null>(null);

  const canceladoRef = useRef(false);

  useEffect(() => {
    canceladoRef.current = false;
    return () => {
      canceladoRef.current = true;
    };
  }, []);

  const totalBloques = contarBloquesPrograma(programa);
  const limiteAlcanzado = totalBloques >= reto.max_bloques;
  const ocupado = ejecutando || guardando;

  const ultimoBloque = programa[programa.length - 1];
  const repetirAbierto =
    editandoRepetir && ultimoBloque?.tipo === 'repetir' ? ultimoBloque : null;
  const cuerpoRepetirLleno =
    repetirAbierto !== null && repetirAbierto.cuerpo.length >= 4;

  const murosSet = new Set(
    (reto.muros ?? []).map(([mx, my]) => `${mx},${my}`),
  );

  function reiniciarTablero() {
    setPosX(reto.inicio_x);
    setPosY(reto.inicio_y);
    setDireccion(reto.direccion_inicial);
    setChoco(false);
    setBloqueActivo(null);
    setResultado(null);
    setPasoChoque(null);
    setEstrellasGanadas(null);
    setAvisoPrograma(null);
    setErrorSupabase(null);
  }

  function agregarBloqueSimple(tipo: TipoBloqueSimple) {
    if (ocupado || limiteAlcanzado) return;
    reiniciarTablero();

    const nuevoSimple: BloqueSimple = { tipo };

    if (editandoRepetir && ultimoBloque?.tipo === 'repetir') {
      if (ultimoBloque.cuerpo.length >= 4) {
        setAvisoPrograma('Dentro de Repetir caben hasta 4 bloques.');
        return;
      }
      setPrograma((prev) => {
        const copia = [...prev];
        const ultimo = copia[copia.length - 1];
        if (ultimo && ultimo.tipo === 'repetir') {
          copia[copia.length - 1] = {
            ...ultimo,
            cuerpo: [...ultimo.cuerpo, nuevoSimple],
          };
        }
        return copia;
      });
      return;
    }

    setPrograma((prev) => [...prev, nuevoSimple]);
  }

  function agregarRepetir() {
    if (ocupado || limiteAlcanzado || editandoRepetir) return;
    reiniciarTablero();
    setPrograma((prev) => [
      ...prev,
      { tipo: 'repetir', veces: vecesRepetir, cuerpo: [] },
    ]);
    setEditandoRepetir(true);
  }

  function cerrarRepetir() {
    if (ocupado) return;
    if (repetirAbierto && repetirAbierto.cuerpo.length === 0) {
      setAvisoPrograma('Pon al menos 1 bloque dentro de Repetir.');
      return;
    }
    setAvisoPrograma(null);
    setEditandoRepetir(false);
  }

  function borrarUltimo() {
    if (ocupado || programa.length === 0) return;
    reiniciarTablero();

    if (editandoRepetir && ultimoBloque?.tipo === 'repetir') {
      if (ultimoBloque.cuerpo.length > 0) {
        setPrograma((prev) => {
          const copia = [...prev];
          const ultimo = copia[copia.length - 1];
          if (ultimo && ultimo.tipo === 'repetir') {
            copia[copia.length - 1] = {
              ...ultimo,
              cuerpo: ultimo.cuerpo.slice(0, -1),
            };
          }
          return copia;
        });
        return;
      }
      setPrograma((prev) => prev.slice(0, -1));
      setEditandoRepetir(false);
      return;
    }

    setPrograma((prev) => prev.slice(0, -1));
  }

  function borrarTodo() {
    if (ocupado || programa.length === 0) return;
    setPrograma([]);
    setEditandoRepetir(false);
    reiniciarTablero();
  }

  async function manejarEjecutar() {
    if (ocupado || programa.length === 0) return;

    const hayRepetirVacio = programa.some(
      (b) => b.tipo === 'repetir' && b.cuerpo.length === 0,
    );
    if (hayRepetirVacio) {
      setAvisoPrograma('Pon al menos 1 bloque dentro de Repetir.');
      return;
    }

    setEditandoRepetir(false);
    reiniciarTablero();

    const simulacion = ejecutarProgramaRobi(reto, programa);
    setEjecutando(true);

    const reducirMovimiento =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducirMovimiento) {
      const ultimoPaso = simulacion.pasos[simulacion.pasos.length - 1];
      if (ultimoPaso) {
        setPosX(ultimoPaso.x);
        setPosY(ultimoPaso.y);
        setDireccion(ultimoPaso.direccion);
        setChoco(ultimoPaso.choco);
        setBloqueActivo(ultimoPaso.numeroBloque);
      }
    } else {
      for (const paso of simulacion.pasos) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (canceladoRef.current) return;
        setPosX(paso.x);
        setPosY(paso.y);
        setDireccion(paso.direccion);
        setChoco(paso.choco);
        setBloqueActivo(paso.numeroBloque);
      }
    }

    if (canceladoRef.current) return;
    setEjecutando(false);
    setGuardando(true);

    try {
      const { data, error } = await supabase
        .from('intentos')
        .insert({
          explorador_id: exploradorId,
          reto_id: reto.id,
          programa,
          logrado: simulacion.resultado === 'logrado',
        })
        .select('id, logrado, estrellas_ganadas')
        .single();

      if (canceladoRef.current) return;

      if (error) {
        setErrorSupabase(error.message);
        return;
      }

      setResultado(simulacion.resultado);
      setPasoChoque(simulacion.pasoChoque);
      setEstrellasGanadas(data?.estrellas_ganadas ?? 0);

      await onIntentoGuardado();
    } catch (err) {
      if (canceladoRef.current) return;
      setErrorSupabase(
        err instanceof Error
          ? err.message
          : 'No pudimos guardar tu intento.',
      );
    } finally {
      if (!canceladoRef.current) {
        setGuardando(false);
      }
    }
  }

  // Construimos la lista visual numerada de bloques
  let contadorNumero = 0;
  const bloquesNumerados = programa.map((bloque, idx) => {
    contadorNumero += 1;
    const numeroPrincipal = contadorNumero;
    if (bloque.tipo === 'repetir') {
      const cuerpoNumerado = bloque.cuerpo.map((sub, subIdx) => {
        contadorNumero += 1;
        return {
          bloque: sub,
          numero: contadorNumero,
          key: `${idx}-${subIdx}`,
        };
      });
      return {
        tipo: 'repetir' as const,
        veces: bloque.veces,
        numero: numeroPrincipal,
        cuerpo: cuerpoNumerado,
        esUltimo: idx === programa.length - 1,
        key: `${idx}`,
      };
    }
    return {
      tipo: bloque.tipo,
      numero: numeroPrincipal,
      key: `${idx}`,
    };
  });

  const filas = Array.from({ length: reto.alto }, (_, y) => y);
  const columnas = Array.from({ length: reto.ancho }, (_, x) => x);

  return (
    <section aria-labelledby="titulo-reto" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1
            id="titulo-reto"
            className="font-display text-3xl sm:text-4xl font-semibold text-tinta"
          >
            {reto.orden}. {reto.titulo}
          </h1>
          <p className="text-tinta-suave max-w-[58ch]">{reto.explicacion}</p>
        </div>

        <button
          type="button"
          onClick={onVolverAlMapa}
          disabled={ocupado}
          className="min-h-12 px-5 py-2.5 rounded-xl border-2 border-tinta bg-papel text-tinta font-semibold text-base sm:text-lg hover:bg-white disabled:opacity-50 inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span>Volver al mapa</span>
        </button>
      </div>

      {/* Disposición de dos zonas: tablero a la izquierda, bloques y programa a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Zona izquierda: Cuadrícula de Robi */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-papel border-2 border-tinta rounded-xl p-4 sm:p-6">
            <div
              className="w-full max-w-[540px] mx-auto grid gap-1.5 p-2.5 sm:p-3 rounded-xl bg-carton/40 border-2 border-carton-borde"
              style={{
                gridTemplateColumns: `repeat(${reto.ancho}, minmax(0, 1fr))`,
              }}
              role="grid"
              aria-label={`Tablero de ${reto.ancho} por ${reto.alto} casillas`}
            >
              {filas.map((y) =>
                columnas.map((x) => {
                  const esMuro = murosSet.has(`${x},${y}`);
                  const esMeta = x === reto.meta_x && y === reto.meta_y;
                  const estaRobi = x === posX && y === posY;

                  return (
                    <div
                      key={`${x}-${y}`}
                      role="gridcell"
                      aria-label={
                        estaRobi
                          ? `Casilla ${x},${y} con Robi`
                          : esMeta
                            ? `Casilla ${x},${y} con estrella`
                            : esMuro
                              ? `Casilla ${x},${y} con muro`
                              : `Casilla ${x},${y}`
                      }
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center relative ${
                        esMuro
                          ? 'bg-tinta border-tinta'
                          : esMeta
                            ? 'bg-estrella/20 border-estrella'
                            : 'bg-papel border-cuadricula'
                      }`}
                    >
                      {esMuro && (
                        <div
                          className="w-3/5 h-1.5 rounded-full bg-tinta-suave/60"
                          aria-hidden="true"
                        />
                      )}

                      {esMeta && !estaRobi && (
                        <Star
                          className="w-[65%] h-[65%] text-estrella fill-estrella"
                          aria-hidden="true"
                        />
                      )}

                      {esMeta && estaRobi && (
                        <Star
                          className="w-[45%] h-[45%] text-estrella fill-estrella absolute top-0.5 right-0.5 opacity-80"
                          aria-hidden="true"
                        />
                      )}

                      {estaRobi && (
                        <div className="w-[86%] h-[86%] z-10">
                          <RobotSvg direccion={direccion} choco={choco} />
                        </div>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>

          {/* Resultado de la ejecución (PARTE C) */}
          {resultado === 'logrado' && (
            <div
              role="status"
              className="p-6 rounded-xl bg-white border-2 border-tinta space-y-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-tinta">
                  ¡Robi llegó!
                </h2>
                {estrellasGanadas !== null && estrellasGanadas > 0 && (
                  <span className="inline-flex items-center gap-1">
                    {Array.from({ length: estrellasGanadas }).map((_, idx) => (
                      <Star
                        key={idx}
                        className="w-7 h-7 text-estrella fill-estrella"
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                )}
              </div>

              {estrellasGanadas !== null && estrellasGanadas > 0 ? (
                <p className="text-tinta font-semibold">
                  Ganaste{' '}
                  <span className="tabular-nums">{estrellasGanadas}</span>{' '}
                  {estrellasGanadas === 1 ? 'estrella' : 'estrellas'}.
                </p>
              ) : (
                <p className="text-tinta-suave font-semibold">
                  Ya habías superado este reto
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {siguienteRetoId !== null && (
                  <button
                    type="button"
                    onClick={() => onAbrirSiguienteReto(siguienteRetoId)}
                    className="min-h-12 px-6 py-2.5 rounded-xl bg-boligrafo text-white font-semibold text-lg hover:bg-boligrafo-oscuro cursor-pointer"
                  >
                    Siguiente reto
                  </button>
                )}
                <button
                  type="button"
                  onClick={onVolverAlMapa}
                  className="min-h-12 px-6 py-2.5 rounded-xl border-2 border-tinta bg-papel text-tinta font-semibold text-lg hover:bg-cuadricula/50 cursor-pointer"
                >
                  Volver al mapa
                </button>
              </div>
            </div>
          )}

          {resultado === 'choque' && (
            <div
              role="status"
              className="p-5 rounded-xl bg-papel border-2 border-ladrillo text-tinta flex items-start gap-3"
            >
              <AlertCircle
                className="w-6 h-6 text-ladrillo shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="font-semibold">
                Casi: Robi chocó en el paso {pasoChoque}. Revisa ese bloque
              </p>
            </div>
          )}

          {resultado === 'corto' && (
            <div
              role="status"
              className="p-5 rounded-xl bg-papel border-2 border-boligrafo text-tinta flex items-start gap-3"
            >
              <AlertCircle
                className="w-6 h-6 text-boligrafo shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="font-semibold">
                Robi se quedó a mitad de camino. Agrega bloques
              </p>
            </div>
          )}
        </div>

        {/* Zona derecha: Paleta de bloques y Mi programa */}
        <div className="lg:col-span-5 space-y-6">
          {/* Paleta */}
          <div className="bg-papel border-2 border-carton-borde rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-semibold text-tinta">
                Bloques
              </h2>
              <span className="font-semibold text-tinta tabular-nums">
                {totalBloques} de {reto.max_bloques} bloques
              </span>
            </div>

            {limiteAlcanzado && (
              <p className="font-semibold text-ladrillo">
                Ya usaste todos los bloques
              </p>
            )}

            <div className="flex flex-col gap-3">
              {reto.bloques_permitidos
                .filter((b): b is TipoBloqueSimple => b !== 'repetir')
                .map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => agregarBloqueSimple(tipo)}
                    disabled={ocupado || limiteAlcanzado || cuerpoRepetirLleno}
                    className="min-h-12 px-4 py-2.5 rounded-xl border-2 border-tinta bg-white text-tinta font-semibold text-lg hover:bg-cuadricula/40 disabled:opacity-45 inline-flex items-center gap-3 cursor-pointer text-left"
                  >
                    {iconoBloque(tipo)}
                    <span>{ETIQUETA_BLOQUE[tipo]}</span>
                  </button>
                ))}

              {reto.bloques_permitidos.includes('repetir') && (
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="selector-repetir-veces"
                    className="sr-only"
                  >
                    Cantidad de veces para repetir
                  </label>
                  <select
                    id="selector-repetir-veces"
                    value={vecesRepetir}
                    onChange={(e) => setVecesRepetir(Number(e.target.value))}
                    disabled={ocupado || limiteAlcanzado || editandoRepetir}
                    className="min-h-12 px-3 py-2 rounded-xl border-2 border-tinta bg-white text-tinta font-semibold text-lg tabular-nums disabled:opacity-45"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>
                        {n} veces
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={agregarRepetir}
                    disabled={ocupado || limiteAlcanzado || editandoRepetir}
                    className="flex-1 min-h-12 px-4 py-2.5 rounded-xl border-2 border-tinta bg-carton text-tinta font-semibold text-lg hover:bg-carton/80 disabled:opacity-45 inline-flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
                  >
                    <Repeat className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>Repetir</span>
                  </button>
                </div>
              )}

              {editandoRepetir && (
                <button
                  type="button"
                  onClick={cerrarRepetir}
                  disabled={ocupado}
                  className="min-h-12 px-5 py-2.5 rounded-xl bg-boligrafo text-white font-semibold text-lg hover:bg-boligrafo-oscuro disabled:opacity-50 cursor-pointer"
                >
                  Cerrar repetir
                </button>
              )}
            </div>
          </div>

          {/* Mi programa */}
          <div className="bg-papel border-2 border-tinta rounded-xl p-5 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-tinta">
              Mi programa
            </h2>

            {bloquesNumerados.length === 0 ? (
              <p className="text-tinta-suave py-3">
                Toca los bloques de arriba para armar tu programa.
              </p>
            ) : (
              <ol className="space-y-2.5">
                {bloquesNumerados.map((item) => {
                  if (item.tipo === 'repetir') {
                    const estaAbierto = editandoRepetir && item.esUltimo;
                    return (
                      <li
                        key={item.key}
                        className={`rounded-xl border-2 p-3 space-y-2 ${
                          estaAbierto
                            ? 'border-boligrafo bg-white'
                            : 'border-carton-borde bg-carton/25'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 font-semibold text-tinta">
                          <span className="inline-flex items-center gap-2">
                            <span className="tabular-nums text-boligrafo">
                              {item.numero}.
                            </span>
                            <Repeat className="w-5 h-5" aria-hidden="true" />
                            <span>Repetir {item.veces} veces</span>
                          </span>
                          {estaAbierto && (
                            <span className="text-boligrafo font-semibold">
                              Abierto
                            </span>
                          )}
                        </div>

                        {item.cuerpo.length === 0 ? (
                          <p className="text-tinta-suave pl-6">
                            Agrega hasta 4 bloques aquí.
                          </p>
                        ) : (
                          <ol className="space-y-1.5 pl-6">
                            {item.cuerpo.map((sub) => {
                              const activo = bloqueActivo === sub.numero;
                              return (
                                <li
                                  key={sub.key}
                                  className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2.5 font-semibold ${
                                    activo
                                      ? 'border-boligrafo bg-estrella/35 text-tinta'
                                      : 'border-cuadricula bg-papel text-tinta'
                                  }`}
                                >
                                  <span className="tabular-nums text-boligrafo">
                                    {sub.numero}.
                                  </span>
                                  {iconoBloque(sub.bloque.tipo)}
                                  <span>{ETIQUETA_BLOQUE[sub.bloque.tipo]}</span>
                                </li>
                              );
                            })}
                          </ol>
                        )}
                      </li>
                    );
                  }

                  const activo = bloqueActivo === item.numero;
                  return (
                    <li
                      key={item.key}
                      className={`px-4 py-2.5 rounded-xl border-2 flex items-center gap-3 font-semibold ${
                        activo
                          ? 'border-boligrafo bg-estrella/35 text-tinta'
                          : 'border-cuadricula bg-white text-tinta'
                      }`}
                    >
                      <span className="tabular-nums text-boligrafo">
                        {item.numero}.
                      </span>
                      {iconoBloque(item.tipo)}
                      <span>{ETIQUETA_BLOQUE[item.tipo]}</span>
                    </li>
                  );
                })}
              </ol>
            )}

            {avisoPrograma && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-papel border-2 border-ladrillo text-tinta flex items-start gap-3"
              >
                <AlertCircle
                  className="w-6 h-6 text-ladrillo shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p>{avisoPrograma}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={borrarUltimo}
                disabled={ocupado || programa.length === 0}
                className="min-h-12 px-4 py-2.5 rounded-xl border-2 border-tinta bg-papel text-tinta font-semibold hover:bg-white disabled:opacity-45 inline-flex items-center gap-2 cursor-pointer"
              >
                <Undo2 className="w-5 h-5" aria-hidden="true" />
                <span>Borrar último</span>
              </button>

              <button
                type="button"
                onClick={borrarTodo}
                disabled={ocupado || programa.length === 0}
                className="min-h-12 px-4 py-2.5 rounded-xl border-2 border-tinta bg-papel text-tinta font-semibold hover:bg-white disabled:opacity-45 inline-flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-5 h-5" aria-hidden="true" />
                <span>Borrar todo</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => void manejarEjecutar()}
              disabled={ocupado || programa.length === 0}
              className="w-full min-h-14 px-6 py-3 rounded-xl bg-boligrafo text-white font-semibold text-xl hover:bg-boligrafo-oscuro disabled:opacity-45 inline-flex items-center justify-center gap-3 cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white" aria-hidden="true" />
              <span>
                {ejecutando
                  ? 'Robi en camino...'
                  : guardando
                    ? 'Guardando...'
                    : 'Ejecutar'}
              </span>
            </button>

            {errorSupabase && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-papel border-2 border-ladrillo text-tinta flex items-start gap-3"
              >
                <AlertCircle
                  className="w-6 h-6 text-ladrillo shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="break-words">{errorSupabase}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
