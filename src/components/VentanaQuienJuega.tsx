import { type FormEvent, useState } from 'react';
import {
  AlertCircle,
  Check,
  KeyRound,
  RefreshCw,
  Star,
  UserPlus,
} from 'lucide-react';
import { COLORES_EXPLORADOR, obtenerInfoColor } from '../colores';
import { supabase } from '../supabase';
import type { ColorExplorador, Explorador } from '../types';

interface VentanaQuienJuegaProps {
  exploradorGuardado: Explorador | null;
  cargando: boolean;
  errorCarga: string | null;
  onReintentarCarga: () => void;
  onElegirExplorador: (explorador: Explorador) => void;
  onExploradorCreado: (explorador: Explorador) => Promise<void> | void;
}

type ModoFormulario = 'ninguno' | 'nuevo' | 'apodo';

export function VentanaQuienJuega({
  exploradorGuardado,
  cargando,
  errorCarga,
  onReintentarCarga,
  onElegirExplorador,
  onExploradorCreado,
}: VentanaQuienJuegaProps) {
  const [modoFormulario, setModoFormulario] =
    useState<ModoFormulario>('ninguno');

  // Estado formulario "Soy nuevo"
  const [apodo, setApodo] = useState('');
  const [colorElegido, setColorElegido] = useState<ColorExplorador | null>(
    null,
  );
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);

  // Estado formulario "Ya tengo apodo"
  const [apodoExistente, setApodoExistente] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  function abrirFormularioNuevo() {
    setModoFormulario('nuevo');
    setErrorFormulario(null);
    setErrorBusqueda(null);
  }

  function abrirFormularioApodo() {
    setModoFormulario('apodo');
    setErrorFormulario(null);
    setErrorBusqueda(null);
  }

  function cancelarFormulario() {
    setModoFormulario('ninguno');
    setApodo('');
    setColorElegido(null);
    setErrorFormulario(null);
    setApodoExistente('');
    setErrorBusqueda(null);
  }

  function validarFormularioNuevo(): string | null {
    if (/\s/.test(apodo)) {
      return 'Tu apodo no puede tener espacios.';
    }
    if (apodo.length < 3 || apodo.length > 12) {
      return 'Escribe entre 3 y 12 letras o números.';
    }
    if (!/^[\p{L}\p{N}]+$/u.test(apodo)) {
      return 'Usa solo letras y números, sin símbolos.';
    }
    if (!colorElegido) {
      return 'Elige un color para empezar.';
    }
    return null;
  }

  async function manejarEnvioNuevo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorFormulario(null);

    const errorValidacion = validarFormularioNuevo();
    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    if (!colorElegido) return;

    setGuardando(true);
    try {
      const { data, error } = await supabase
        .from('exploradores')
        .insert({ apodo, color: colorElegido })
        .select('id, apodo, color, estrellas')
        .single();

      if (error) {
        setErrorFormulario(error.message);
        return;
      }

      if (!data) {
        setErrorFormulario('No se pudo guardar tu apodo. Intenta de nuevo.');
        return;
      }

      const nuevoExplorador: Explorador = {
        id: data.id,
        apodo: data.apodo,
        color: data.color as ColorExplorador,
        estrellas: data.estrellas ?? 0,
        retos_superados: 0,
        intentos: 0,
      };

      setApodo('');
      setColorElegido(null);
      setModoFormulario('ninguno');
      await onExploradorCreado(nuevoExplorador);
    } catch (err) {
      setErrorFormulario(
        err instanceof Error ? err.message : 'Ocurrió un problema al guardar.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function manejarBusquedaApodo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorBusqueda(null);

    const apodoLimpio = apodoExistente.trim();
    if (!apodoLimpio || /\s/.test(apodoLimpio)) {
      setErrorBusqueda('Escribe tu apodo sin espacios.');
      return;
    }

    setBuscando(true);
    try {
      let { data, error } = await supabase
        .from('vista_exploradores')
        .select('id, apodo, color, estrellas, retos_superados, intentos')
        .eq('apodo', apodoLimpio)
        .maybeSingle();

      if (!error && !data && /^[\p{L}\p{N}]+$/u.test(apodoLimpio)) {
        const resIlike = await supabase
          .from('vista_exploradores')
          .select('id, apodo, color, estrellas, retos_superados, intentos')
          .ilike('apodo', apodoLimpio)
          .limit(1)
          .maybeSingle();
        data = resIlike.data;
        error = resIlike.error;
      }

      if (error) {
        setErrorBusqueda(error.message);
        return;
      }

      if (!data) {
        setErrorBusqueda(
          'No encontramos ese apodo. Revisa cómo lo escribiste',
        );
        return;
      }

      const encontrado: Explorador = {
        id: data.id,
        apodo: data.apodo,
        color: data.color as ColorExplorador,
        estrellas: data.estrellas ?? 0,
        retos_superados: data.retos_superados ?? 0,
        intentos: data.intentos ?? 0,
      };

      setApodoExistente('');
      setModoFormulario('ninguno');
      onElegirExplorador(encontrado);
    } catch (err) {
      setErrorBusqueda(
        err instanceof Error ? err.message : 'Ocurrió un problema al buscar.',
      );
    } finally {
      setBuscando(false);
    }
  }

  return (
    <section aria-labelledby="titulo-quien-juega" className="space-y-8">
      <div>
        <h1
          id="titulo-quien-juega"
          className="font-display text-3xl sm:text-4xl font-semibold text-tinta mb-2"
        >
          ¿Quién juega?
        </h1>
        <p className="text-tinta-suave max-w-[48ch]">
          {exploradorGuardado
            ? 'Toca tu tarjeta para entrar a tus misiones.'
            : 'Crea un apodo nuevo o entra con el tuyo.'}
        </p>
      </div>

      {errorCarga && (
        <div
          role="alert"
          className="p-5 rounded-xl bg-papel border-2 border-ladrillo text-tinta flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="w-6 h-6 text-ladrillo shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-base sm:text-lg break-words">{errorCarga}</p>
          </div>
          <button
            type="button"
            onClick={onReintentarCarga}
            className="min-h-12 px-5 py-2.5 rounded-xl border-2 border-tinta bg-papel text-tinta font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer hover:bg-white"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {cargando && !errorCarga && (
        <p className="text-tinta-suave py-4">Buscando tu ficha...</p>
      )}

      {/* Si hay un id guardado válido, mostramos SOLO su tarjeta */}
      {!cargando && !errorCarga && exploradorGuardado && (
        <div className="max-w-md">
          {(() => {
            const infoColor = obtenerInfoColor(exploradorGuardado.color);
            const inicial = exploradorGuardado.apodo.slice(0, 1).toUpperCase();
            return (
              <button
                type="button"
                onClick={() => onElegirExplorador(exploradorGuardado)}
                className="w-full min-h-32 p-6 rounded-xl bg-papel border-2 border-tinta border-b-4 text-left flex items-center gap-5 hover:bg-white active:translate-y-0.5 transition-transform duration-150 cursor-pointer"
              >
                <div
                  className="w-16 h-16 rounded-xl border-2 border-tinta flex items-center justify-center font-display text-3xl font-semibold shrink-0"
                  style={{
                    backgroundColor: infoColor.fondoHex,
                    color: infoColor.textoHex,
                  }}
                  aria-hidden="true"
                >
                  {inicial}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="font-display text-2xl font-semibold text-tinta truncate">
                    {exploradorGuardado.apodo}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base text-tinta-suave">
                    <span>Color {infoColor.nombre.toLowerCase()}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-tinta tabular-nums">
                      <Star
                        className="w-5 h-5 text-estrella fill-estrella shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {exploradorGuardado.estrellas}{' '}
                        {exploradorGuardado.estrellas === 1
                          ? 'estrella'
                          : 'estrellas'}
                      </span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })()}
        </div>
      )}

      {/* Si no hay id guardado, mostramos "Soy nuevo" y "Ya tengo apodo" */}
      {!cargando && !exploradorGuardado && (
        <div className="space-y-6">
          {modoFormulario === 'ninguno' && (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={abrirFormularioNuevo}
                className="min-h-14 px-6 py-3 rounded-xl bg-boligrafo text-white font-semibold text-lg hover:bg-boligrafo-oscuro transition-colors duration-150 inline-flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer"
              >
                <UserPlus className="w-5 h-5" aria-hidden="true" />
                <span>Soy nuevo</span>
              </button>

              <button
                type="button"
                onClick={abrirFormularioApodo}
                className="min-h-14 px-6 py-3 rounded-xl border-2 border-tinta bg-papel text-tinta font-semibold text-lg hover:bg-white transition-colors duration-150 inline-flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer"
              >
                <KeyRound className="w-5 h-5" aria-hidden="true" />
                <span>Ya tengo apodo</span>
              </button>
            </div>
          )}

          {modoFormulario === 'nuevo' && (
            <div className="bg-papel border-2 border-tinta rounded-xl p-6 sm:p-8 max-w-2xl">
              <h2 className="font-display text-2xl font-semibold text-tinta mb-5">
                Crea tu ficha
              </h2>

              <form
                onSubmit={(e) => void manejarEnvioNuevo(e)}
                noValidate
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="campo-apodo"
                    className="block font-semibold text-tinta mb-2"
                  >
                    Tu apodo
                  </label>
                  <input
                    id="campo-apodo"
                    type="text"
                    value={apodo}
                    onChange={(e) => setApodo(e.target.value)}
                    maxLength={12}
                    autoComplete="off"
                    autoCapitalize="none"
                    placeholder="Ej. Luna10"
                    className="w-full min-h-12 px-4 py-2.5 rounded-lg bg-white border-2 border-tinta text-tinta text-lg placeholder:text-tinta-suave/60"
                  />
                  <p className="mt-2 text-base text-tinta-suave">
                    No escribas tu nombre real: inventa un apodo
                  </p>
                </div>

                <fieldset>
                  <legend className="font-semibold text-tinta mb-3">
                    Elige tu color
                  </legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {COLORES_EXPLORADOR.map((opcion) => {
                      const seleccionado = colorElegido === opcion.id;
                      return (
                        <button
                          key={opcion.id}
                          type="button"
                          aria-pressed={seleccionado}
                          onClick={() => setColorElegido(opcion.id)}
                          className={`min-h-14 px-4 py-2.5 rounded-xl border-2 font-semibold text-base sm:text-lg inline-flex items-center gap-3 transition-colors duration-150 cursor-pointer ${
                            seleccionado
                              ? 'border-tinta bg-white ring-2 ring-boligrafo'
                              : 'border-carton-borde bg-papel hover:border-tinta hover:bg-white'
                          }`}
                        >
                          <span
                            className="w-7 h-7 rounded-lg border-2 border-tinta inline-flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: opcion.fondoHex,
                              color: opcion.textoHex,
                            }}
                            aria-hidden="true"
                          >
                            {seleccionado && (
                              <Check className="w-4 h-4 stroke-[3]" />
                            )}
                          </span>
                          <span className="text-tinta whitespace-nowrap">
                            {opcion.nombre}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={cancelarFormulario}
                    disabled={guardando}
                    className="min-h-12 px-6 py-2.5 rounded-xl border-2 border-tinta bg-papel text-tinta font-semibold text-lg hover:bg-cuadricula/60 disabled:opacity-60 transition-colors duration-150 whitespace-nowrap cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="min-h-12 px-7 py-2.5 rounded-xl bg-boligrafo text-white font-semibold text-lg hover:bg-boligrafo-oscuro disabled:opacity-60 transition-colors duration-150 whitespace-nowrap cursor-pointer"
                  >
                    {guardando ? 'Guardando...' : 'Empezar'}
                  </button>
                </div>
              </form>

              {errorFormulario && (
                <div
                  role="alert"
                  className="mt-6 p-4 rounded-xl bg-papel border-2 border-ladrillo text-tinta flex items-start gap-3"
                >
                  <AlertCircle
                    className="w-6 h-6 text-ladrillo shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-base sm:text-lg text-tinta break-words">
                    {errorFormulario}
                  </p>
                </div>
              )}
            </div>
          )}

          {modoFormulario === 'apodo' && (
            <div className="bg-papel border-2 border-tinta rounded-xl p-6 sm:p-8 max-w-xl">
              <h2 className="font-display text-2xl font-semibold text-tinta mb-5">
                Entra con tu apodo
              </h2>

              <form
                onSubmit={(e) => void manejarBusquedaApodo(e)}
                noValidate
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="campo-apodo-existente"
                    className="block font-semibold text-tinta mb-2"
                  >
                    Escribe tu apodo
                  </label>
                  <input
                    id="campo-apodo-existente"
                    type="text"
                    value={apodoExistente}
                    onChange={(e) => setApodoExistente(e.target.value)}
                    maxLength={12}
                    autoComplete="off"
                    autoCapitalize="none"
                    placeholder="Ej. Luna10"
                    className="w-full min-h-12 px-4 py-2.5 rounded-lg bg-white border-2 border-tinta text-tinta text-lg placeholder:text-tinta-suave/60"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={cancelarFormulario}
                    disabled={buscando}
                    className="min-h-12 px-6 py-2.5 rounded-xl border-2 border-tinta bg-papel text-tinta font-semibold text-lg hover:bg-cuadricula/60 disabled:opacity-60 transition-colors duration-150 whitespace-nowrap cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={buscando}
                    className="min-h-12 px-7 py-2.5 rounded-xl bg-boligrafo text-white font-semibold text-lg hover:bg-boligrafo-oscuro disabled:opacity-60 transition-colors duration-150 whitespace-nowrap cursor-pointer"
                  >
                    {buscando ? 'Buscando...' : 'Entrar'}
                  </button>
                </div>
              </form>

              {errorBusqueda && (
                <div
                  role="alert"
                  className="mt-6 p-4 rounded-xl bg-papel border-2 border-ladrillo text-tinta flex items-start gap-3"
                >
                  <AlertCircle
                    className="w-6 h-6 text-ladrillo shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-base sm:text-lg text-tinta break-words">
                    {errorBusqueda}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
