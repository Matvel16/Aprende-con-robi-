import { AlertCircle, Lock, LogOut, Play, RefreshCw, Star } from 'lucide-react';
import { obtenerInfoColor } from '../colores';
import type { Explorador, ItemMapa } from '../types';

interface VentanaMapaProps {
  explorador: Explorador;
  mapa: ItemMapa[];
  cargando: boolean;
  error: string | null;
  onReintentar: () => void;
  onAbrirReto: (retoId: number) => void;
  onSalir: () => void;
}

interface GrupoMundo {
  nombre: string;
  orden: number;
  retos: ItemMapa[];
}

export function VentanaMapa({
  explorador,
  mapa,
  cargando,
  error,
  onReintentar,
  onAbrirReto,
  onSalir,
}: VentanaMapaProps) {
  const infoColor = obtenerInfoColor(explorador.color);

  const gruposMap = new Map<string, GrupoMundo>();
  const mapaOrdenado = [...mapa].sort((a, b) => {
    if (a.mundo_orden !== b.mundo_orden) {
      return a.mundo_orden - b.mundo_orden;
    }
    return a.orden - b.orden;
  });

  for (const item of mapaOrdenado) {
    const clave = `${item.mundo_orden}-${item.mundo}`;
    const existente = gruposMap.get(clave);
    if (existente) {
      existente.retos.push(item);
    } else {
      gruposMap.set(clave, {
        nombre: item.mundo,
        orden: item.mundo_orden,
        retos: [item],
      });
    }
  }

  const mundos = Array.from(gruposMap.values()).sort(
    (a, b) => a.orden - b.orden,
  );

  return (
    <section aria-labelledby="titulo-hola-explorador" className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl border-2 border-tinta flex items-center justify-center font-display text-2xl font-semibold shrink-0"
            style={{
              backgroundColor: infoColor.fondoHex,
              color: infoColor.textoHex,
            }}
            aria-hidden="true"
          >
            {explorador.apodo.slice(0, 1).toUpperCase()}
          </div>
          <h1
            id="titulo-hola-explorador"
            className="font-display text-3xl sm:text-4xl font-semibold text-tinta"
          >
            Hola, {explorador.apodo}
          </h1>
        </div>

        <button
          type="button"
          onClick={onSalir}
          className="min-h-12 px-5 py-2.5 rounded-xl border-2 border-tinta bg-papel text-tinta font-semibold text-base sm:text-lg hover:bg-white inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          <span>Salir</span>
        </button>
      </div>

      {/* Tres números del explorador (RF-02) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-papel border-2 border-tinta rounded-xl px-5 py-4 flex items-center justify-between sm:block">
          <span className="text-tinta-suave font-semibold block">Estrellas</span>
          <span className="font-display text-3xl font-semibold text-tinta tabular-nums inline-flex items-center gap-2 sm:mt-1">
            <Star
              className="w-6 h-6 text-estrella fill-estrella shrink-0"
              aria-hidden="true"
            />
            <span>{explorador.estrellas ?? 0}</span>
          </span>
        </div>

        <div className="bg-papel border-2 border-tinta rounded-xl px-5 py-4 flex items-center justify-between sm:block">
          <span className="text-tinta-suave font-semibold block">
            Retos superados
          </span>
          <span className="font-display text-3xl font-semibold text-tinta tabular-nums block sm:mt-1">
            {explorador.retos_superados ?? 0}
          </span>
        </div>

        <div className="bg-papel border-2 border-tinta rounded-xl px-5 py-4 flex items-center justify-between sm:block">
          <span className="text-tinta-suave font-semibold block">Intentos</span>
          <span className="font-display text-3xl font-semibold text-tinta tabular-nums block sm:mt-1">
            {explorador.intentos ?? 0}
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-5 rounded-xl bg-papel border-2 border-ladrillo text-tinta flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="w-6 h-6 text-ladrillo shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-base sm:text-lg break-words">{error}</p>
          </div>
          <button
            type="button"
            onClick={onReintentar}
            className="min-h-12 px-5 py-2.5 rounded-xl border-2 border-tinta bg-papel text-tinta font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer hover:bg-white"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {cargando && !error && (
        <p className="text-tinta-suave py-4">Cargando mapa de misiones...</p>
      )}

      {!cargando && !error && mundos.length === 0 && (
        <p className="text-tinta-suave py-4">
          Todavía no hay retos en tu mapa.
        </p>
      )}

      {!cargando && !error && mundos.length > 0 && (
        <div className="space-y-8">
          {mundos.map((mundo) => (
            <div
              key={`${mundo.orden}-${mundo.nombre}`}
              className="bg-papel border-2 border-carton-borde rounded-xl p-6 sm:p-8"
            >
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-tinta mb-5">
                {mundo.nombre}
              </h2>

              <ul className="space-y-4">
                {mundo.retos.map((reto) => {
                  if (reto.estado === 'bloqueado') {
                    return (
                      <li key={reto.reto_id}>
                        <div
                          aria-disabled="true"
                          className="w-full min-h-16 px-5 py-4 rounded-xl border-2 border-cuadricula bg-papel/70 text-tinta-suave flex flex-wrap items-center justify-between gap-4 select-none"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="w-10 h-10 rounded-lg border-2 border-cuadricula bg-white flex items-center justify-center font-display text-xl font-semibold text-tinta-suave tabular-nums shrink-0">
                              {reto.orden}
                            </span>
                            <span className="font-semibold text-lg truncate">
                              {reto.titulo}
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-2 font-semibold text-base whitespace-nowrap shrink-0">
                            <Lock className="w-5 h-5" aria-hidden="true" />
                            <span>Bloqueado</span>
                          </span>
                        </div>
                      </li>
                    );
                  }

                  const esAbierto = reto.estado === 'abierto';

                  return (
                    <li key={reto.reto_id}>
                      <button
                        type="button"
                        onClick={() => onAbrirReto(reto.reto_id)}
                        className={`w-full min-h-16 px-5 py-4 rounded-xl border-2 border-b-4 text-left flex flex-wrap items-center justify-between gap-4 transition-transform duration-150 active:translate-y-0.5 cursor-pointer ${
                          esAbierto
                            ? 'border-boligrafo bg-white ring-2 ring-boligrafo/20 hover:bg-white'
                            : 'border-tinta bg-papel hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span
                            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-display text-xl font-semibold tabular-nums shrink-0 ${
                              esAbierto
                                ? 'border-boligrafo bg-boligrafo text-white'
                                : 'border-tinta bg-carton text-tinta'
                            }`}
                          >
                            {reto.orden}
                          </span>
                          <span className="font-semibold text-lg sm:text-xl text-tinta truncate">
                            {reto.titulo}
                          </span>
                        </div>

                        {esAbierto ? (
                          <span className="inline-flex items-center gap-2 font-semibold text-boligrafo whitespace-nowrap shrink-0">
                            <Play className="w-5 h-5 fill-boligrafo" aria-hidden="true" />
                            <span>Abierto</span>
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-3 whitespace-nowrap shrink-0">
                            <span
                              className="inline-flex items-center gap-1"
                              aria-label={`${reto.estrellas} de 3 estrellas`}
                            >
                              {[1, 2, 3].map((n) => (
                                <Star
                                  key={n}
                                  className={`w-6 h-6 ${
                                    n <= reto.estrellas
                                      ? 'text-estrella fill-estrella'
                                      : 'text-cuadricula fill-cuadricula/40'
                                  }`}
                                  aria-hidden="true"
                                />
                              ))}
                            </span>
                            <span className="font-semibold text-base text-tinta">
                              Superado
                            </span>
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
