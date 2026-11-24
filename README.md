# Misión Robi

Aplicación web educativa para niños y niñas de 10 años que están dando sus primeros pasos en programación. A través de retos cortos, el jugador arma una secuencia de instrucciones con bloques para guiar al robot Robi por un tablero cuadriculado hasta llegar a la estrella, ve la ejecución paso a paso y desbloquea nuevos desafíos.

## Las tres ventanas

1. **¿Quién juega? (V1)**: muestra las tarjetas de cada explorador con su apodo, color y estrellas acumuladas, y permite crear un jugador nuevo sin pedir datos personales.
2. **Mapa de misiones (V2)**: presenta el saludo al jugador, sus tres contadores (estrellas, retos superados e intentos) y los retos agrupados por mundo según su estado (superado, abierto o bloqueado).
3. **Reto (V3)**: muestra el tablero con Robi, los muros y la estrella, la paleta con los bloques permitidos (`Avanzar`, `Girar a la izquierda`, `Girar a la derecha` y `Repetir`), el programa numerado, la ejecución paso a paso y el resultado guardado.

## Variables de entorno

La aplicación se conecta a Supabase desde el navegador mediante `@supabase/supabase-js` usando estas dos variables (configuradas en `src/config.ts`):

- `VITE_SUPABASE_URL`: URL del proyecto en Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: llave pública (`publishable key`) del proyecto en Supabase.

Puedes copiar `.env.example` a `.env` y colocar tus valores si deseas usar otra instancia.

## Cómo ejecutar en local

```bash
npm install
npm run dev
```
