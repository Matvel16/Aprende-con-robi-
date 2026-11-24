import { useCallback, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { VentanaMapa } from './components/VentanaMapa';
import { VentanaQuienJuega } from './components/VentanaQuienJuega';
import { VentanaReto } from './components/VentanaReto';
import { supabase } from './supabase';
import type {
  ColorExplorador,
  Direccion,
  EstadoReto,
  Explorador,
  ItemMapa,
  Reto,
  TipoBloque,
} from './types';

const CLAVE_EXPLORADOR_STORAGE = 'mision_robi_explorador';

function leerIdExploradorGuardado(): number | null {
  try {
    const valor = window.localStorage.getItem(CLAVE_EXPLORADOR_STORAGE);
    if (!valor) return null;
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
      window.localStorage.removeItem(CLAVE_EXPLORADOR_STORAGE);
      return null;
    }
    return id;
  } catch {
    return null;
  }
}

function guardarIdExplorador(id: number) {
  try {
    window.localStorage.setItem(CLAVE_EXPLORADOR_STORAGE, String(id));
  } catch {
    // Ignorar si localStorage no está disponible
  }
}

function borrarIdExplorador() {
  try {
    window.localStorage.removeItem(CLAVE_EXPLORADOR_STORAGE);
  } catch {
    // Ignorar si localStorage no está disponible
  }
}

export default function App() {
  const [exploradorGuardado, setExploradorGuardado] =
    useState<Explorador | null>(null);
  const [cargandoExplorador, setCargandoExplorador] = useState(true);
  const [errorExplorador, setErrorExplorador] = useState<string | null>(null);

  const [exploradorActivo, setExploradorActivo] = useState<Explorador | null>(
    null,
  );
  const [mapa, setMapa] = useState<ItemMapa[]>([]);
  const [cargandoMapa, setCargandoMapa] = useState(false);
  const [errorMapa, setErrorMapa] = useState<string | null>(null);

  const [retoActivo, setRetoActivo] = useState<Reto | null>(null);
  const [cargandoReto, setCargandoReto] = useState(false);
  const [errorReto, setErrorReto] = useState<string | null>(null);

  const cargarExploradorGuardado = useCallback(async () => {
    const idGuardado = leerIdExploradorGuardado();
    if (!idGuardado) {
      setExploradorGuardado(null);
      setCargandoExplorador(false);
      setErrorExplorador(null);
      return;
    }

    setCargandoExplorador(true);
    setErrorExplorador(null);

    try {
      const { data, error } = await supabase
        .from('vista_exploradores')
        .select('id, apodo, color, estrellas, retos_superados, intentos')
        .eq('id', idGuardado)
        .maybeSingle();

      if (error) {
        setErrorExplorador(error.message);
        return;
      }

      if (!data) {
        borrarIdExplorador();
        setExploradorGuardado(null);
        return;
      }

      setExploradorGuardado({
        id: data.id,
        apodo: data.apodo,
        color: data.color as ColorExplorador,
        estrellas: data.estrellas ?? 0,
        retos_superados: data.retos_superados ?? 0,
        intentos: data.intentos ?? 0,
      });
    } catch (err) {
      setErrorExplorador(
        err instanceof Error ? err.message : 'No pudimos cargar tu ficha.',
      );
    } finally {
      setCargandoExplorador(false);
    }
  }, []);

  const cargarDatosMapa = useCallback(async (exploradorId: number) => {
    setCargandoMapa(true);
    setErrorMapa(null);

    try {
      const [expRes, mapaRes] = await Promise.all([
        supabase
          .from('vista_exploradores')
          .select('id, apodo, color, estrellas, retos_superados, intentos')
          .eq('id', exploradorId)
          .single(),
        supabase
          .from('vista_mapa')
          .select(
            'explorador_id, mundo, mundo_orden, reto_id, orden, titulo, estrellas, estado',
          )
          .eq('explorador_id', exploradorId)
          .order('mundo_orden', { ascending: true })
          .order('orden', { ascending: true }),
      ]);

      if (expRes.error) {
        setErrorMapa(expRes.error.message);
        return;
      }

      if (mapaRes.error) {
        setErrorMapa(mapaRes.error.message);
        return;
      }

      if (expRes.data) {
        const actualizado: Explorador = {
          id: expRes.data.id,
          apodo: expRes.data.apodo,
          color: expRes.data.color as ColorExplorador,
          estrellas: expRes.data.estrellas ?? 0,
          retos_superados: expRes.data.retos_superados ?? 0,
          intentos: expRes.data.intentos ?? 0,
        };
        setExploradorActivo(actualizado);
        setExploradorGuardado(actualizado);
      }

      const itemsMapa: ItemMapa[] = (mapaRes.data ?? []).map((fila) => ({
        explorador_id: fila.explorador_id,
        mundo: fila.mundo,
        mundo_orden: fila.mundo_orden,
        reto_id: fila.reto_id,
        orden: fila.orden,
        titulo: fila.titulo,
        estrellas: fila.estrellas ?? 0,
        estado: fila.estado as EstadoReto,
      }));

      setMapa(itemsMapa);
    } catch (err) {
      setErrorMapa(
        err instanceof Error ? err.message : 'No pudimos cargar el mapa.',
      );
    } finally {
      setCargandoMapa(false);
    }
  }, []);

  useEffect(() => {
    void cargarExploradorGuardado();
  }, [cargarExploradorGuardado]);

  async function seleccionarExplorador(explorador: Explorador) {
    guardarIdExplorador(explorador.id);
    setExploradorGuardado(explorador);
    setExploradorActivo(explorador);
    setRetoActivo(null);
    setErrorReto(null);
    await cargarDatosMapa(explorador.id);
  }

  async function manejarExploradorCreado(nuevoExplorador: Explorador) {
    await seleccionarExplorador(nuevoExplorador);
  }

  async function abrirReto(retoId: number) {
    setCargandoReto(true);
    setErrorReto(null);

    try {
      const { data, error } = await supabase
        .from('retos')
        .select(
          'id, mundo_id, orden, titulo, explicacion, ancho, alto, inicio_x, inicio_y, direccion_inicial, meta_x, meta_y, muros, bloques_permitidos, max_bloques, bloques_ideales',
        )
        .eq('id', retoId)
        .single();

      if (error) {
        setErrorReto(error.message);
        return;
      }

      if (!data) {
        setErrorReto('No encontramos ese reto.');
        return;
      }

      const retoCargado: Reto = {
        id: data.id,
        mundo_id: data.mundo_id,
        orden: data.orden,
        titulo: data.titulo,
        explicacion: data.explicacion,
        ancho: data.ancho,
        alto: data.alto,
        inicio_x: data.inicio_x,
        inicio_y: data.inicio_y,
        direccion_inicial: data.direccion_inicial as Direccion,
        meta_x: data.meta_x,
        meta_y: data.meta_y,
        muros: Array.isArray(data.muros) ? (data.muros as [number, number][]) : [],
        bloques_permitidos: Array.isArray(data.bloques_permitidos)
          ? (data.bloques_permitidos as TipoBloque[])
          : [],
        max_bloques: data.max_bloques,
        bloques_ideales: data.bloques_ideales,
      };

      setRetoActivo(retoCargado);
    } catch (err) {
      setErrorReto(
        err instanceof Error ? err.message : 'No pudimos abrir el reto.',
      );
    } finally {
      setCargandoReto(false);
    }
  }

  async function manejarIntentoGuardado() {
    if (!exploradorActivo) return;
    await cargarDatosMapa(exploradorActivo.id);
  }

  function volverAlMapa() {
    setRetoActivo(null);
    setErrorReto(null);
  }

  function salirDeExplorador() {
    borrarIdExplorador();
    setRetoActivo(null);
    setErrorReto(null);
    setExploradorActivo(null);
    setExploradorGuardado(null);
    setMapa([]);
    setErrorExplorador(null);
  }

  const mapaOrdenado = [...mapa].sort((a, b) => {
    if (a.mundo_orden !== b.mundo_orden) {
      return a.mundo_orden - b.mundo_orden;
    }
    return a.orden - b.orden;
  });

  const indiceRetoActual = retoActivo
    ? mapaOrdenado.findIndex((item) => item.reto_id === retoActivo.id)
    : -1;
  const siguienteRetoId =
    indiceRetoActual >= 0 && indiceRetoActual + 1 < mapaOrdenado.length
      ? mapaOrdenado[indiceRetoActual + 1].reto_id
      : null;

  return (
    <div className="min-h-screen flex flex-col text-tinta">
      <header className="bg-papel/95 border-b-2 border-cuadricula">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-tinta whitespace-nowrap shrink-0">
            Misión Robi
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        {!exploradorActivo && (
          <VentanaQuienJuega
            exploradorGuardado={exploradorGuardado}
            cargando={cargandoExplorador}
            errorCarga={errorExplorador}
            onReintentarCarga={() => void cargarExploradorGuardado()}
            onElegirExplorador={(exp) => void seleccionarExplorador(exp)}
            onExploradorCreado={manejarExploradorCreado}
          />
        )}

        {exploradorActivo && !retoActivo && (
          <div className="space-y-6">
            {cargandoReto && (
              <p className="text-tinta-suave font-semibold">Abriendo reto...</p>
            )}

            {errorReto && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-papel border-2 border-ladrillo text-tinta flex items-start gap-3"
              >
                <AlertCircle
                  className="w-6 h-6 text-ladrillo shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="break-words">{errorReto}</p>
              </div>
            )}

            <VentanaMapa
              explorador={exploradorActivo}
              mapa={mapa}
              cargando={cargandoMapa}
              error={errorMapa}
              onReintentar={() => void cargarDatosMapa(exploradorActivo.id)}
              onAbrirReto={(retoId) => void abrirReto(retoId)}
              onSalir={salirDeExplorador}
            />
          </div>
        )}

        {exploradorActivo && retoActivo && (
          <VentanaReto
            key={retoActivo.id}
            reto={retoActivo}
            exploradorId={exploradorActivo.id}
            siguienteRetoId={siguienteRetoId}
            onAbrirSiguienteReto={(id) => void abrirReto(id)}
            onVolverAlMapa={volverAlMapa}
            onIntentoGuardado={manejarIntentoGuardado}
          />
        )}
      </main>
    </div>
  );
}
