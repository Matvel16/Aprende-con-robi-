# Misión Robi: contexto del proyecto

## Problema

Niños de 10 años que nunca le han dado instrucciones a una máquina. En clase la idea de «programa» queda abstracta. La app propone retos cortos: el niño arma un programa con bloques para llevar al robot Robi hasta una estrella, lo ve ejecutarse paso a paso, descubre su error, gana estrellas y abre el reto siguiente. Quien usa la app tiene 10 años: textos cortos, letra grande, botones grandes y nunca un regaño.

## Requerimientos funcionales

- RF-01. El niño elige su apodo o crea uno nuevo con un color. La app valida el apodo (3 a 12 letras o números, que no exista) y lo lleva a su mapa.
- RF-02. El niño ve su mapa. La app muestra tres números (estrellas, retos superados, intentos) y los retos de cada mundo con su estado: superado (con estrellas), abierto o bloqueado.
- RF-03. El niño abre un reto abierto o superado y arma un programa tocando bloques. La app muestra la cuadrícula, la explicación, solo los bloques permitidos y el contador «N de M bloques».
- RF-04. El niño pulsa Ejecutar. La app mueve a Robi bloque a bloque, resalta el bloque que ejecuta y dice si llegó, chocó (en qué paso) o se quedó corto.
- RF-05. La app guarda el intento. Si superó el reto por primera vez, la base de datos suma estrellas y se abre el reto siguiente. Si el reto está bloqueado o el programa pasa del máximo, la base de datos lo rechaza con un mensaje.

## Reglas de negocio

- RN-01. Las estrellas nunca se escriben a mano. Solo cambian cuando se inserta una fila en `intentos`; la base de datos las calcula y las suma sola.
- RN-02. Un reto bloqueado no se puede intentar. La base de datos rechaza el intento con el mensaje «Ese reto está bloqueado: primero supera «título»».
- RN-03. Un reto da estrellas solo la primera vez: 3 si usó `bloques_ideales` o menos, 2 si usó más. La base de datos pone `estrellas_ganadas`.
- RN-04. Sin datos personales: solo apodo y color. La app nunca pide nombre real, edad, foto, colegio ni correo.

## Datos (ya existen en Supabase; no crear tablas ni datos)

- `mundos`: id, nombre, concepto, orden.
- `retos`: id, mundo_id, orden, titulo, explicacion, ancho, alto, inicio_x, inicio_y, direccion_inicial ('N','E','S','O'), meta_x, meta_y, muros (jsonb: lista de [x, y]), bloques_permitidos (lista de 'avanzar','izquierda','derecha','repetir'), max_bloques, bloques_ideales.
- `exploradores`: id, apodo, color ('rojo','azul','verde','amarillo','morado','naranja'), estrellas, creado_en. La app solo inserta apodo y color.
- `intentos`: id, explorador_id, reto_id, programa (jsonb), bloques_usados, logrado, estrellas_ganadas, creado_en. La app solo inserta explorador_id, reto_id, programa y logrado; el trigger calcula bloques_usados y estrellas_ganadas.
- Vista `vista_exploradores`: id, apodo, color, estrellas, retos_superados, intentos. Se usa en V1 y V2.
- Vista `vista_mapa`: explorador_id, mundo, mundo_orden, reto_id, orden, titulo, estrellas, estado ('superado','abierto','bloqueado'). Se usa en V2 filtrando por explorador_id.
- Triggers: `al_crear_explorador` valida el apodo; `al_registrar_intento` aplica RN-01, RN-02 y RN-03 y suma las estrellas al explorador.

## Formato del programa (columna `programa`)

Lista JSON de bloques, en orden. Repetir lleva `veces` (2 a 9) y un `cuerpo` con 1 a 4 bloques simples (sin Repetir adentro):

    [{"tipo":"avanzar"},
     {"tipo":"repetir","veces":3,"cuerpo":[{"tipo":"avanzar"},{"tipo":"izquierda"}]}]

Cada bloque cuenta 1, incluido Repetir y cada bloque de su cuerpo.

## Cómo se ejecuta un programa (en el navegador)

- Cuadrícula de `ancho` x `alto`. La casilla (0,0) es la de arriba a la izquierda; x crece a la derecha, y crece hacia abajo.
- Direcciones: N = arriba, E = derecha, S = abajo, O = izquierda.
- Avanzar: Robi pasa a la casilla siguiente en su dirección. Si esa casilla es un muro o está fuera de la cuadrícula, Robi choca: el programa se detiene y el intento es fallido («chocó en el paso K»).
- Girar a la izquierda / a la derecha: Robi cambia de dirección sin moverse (izquierda: E→N→O→S→E; derecha: E→S→O→N→E).
- Repetir N veces: ejecuta su cuerpo N veces seguidas.
- En cuanto Robi pisa la meta, el intento es logrado y no se ejecutan los bloques que sobran.
- Si se acaban los bloques sin llegar, el intento es fallido («se quedó a mitad de camino»).
- Un paso cada 0,5 s, resaltando el bloque que se ejecuta. Con «reducir movimiento» activo, Robi salta de casilla sin animación.

## Ventanas

- V1 ¿Quién juega?: tarjetas grandes con el apodo, el color y las estrellas de cada explorador (de `vista_exploradores`). Tocar una tarjeta abre V2 para ese explorador. Botón «Soy nuevo» que muestra el formulario: apodo, seis colores, aviso «No escribas tu nombre real: inventa un apodo» y botones «Cancelar» y «Empezar». Al crear, abre V2 con el explorador nuevo.
- V2 Mapa de misiones: «Hola, [apodo]», tres números (RF-02) y, por mundo, los retos con su estado. Superado: estrellas ganadas. Abierto: resaltado. Bloqueado: candado, no se puede tocar. Botón «Cambiar de explorador» que vuelve a V1.
- V3 Reto: título y explicación, cuadrícula con Robi, muros y estrella; paleta con solo los bloques permitidos; «Mi programa» con los bloques numerados, contador «N de M bloques», botones «Borrar último», «Borrar todo» y «Ejecutar». Al terminar la ejecución guarda el intento y muestra el resultado: si lo logró, las estrellas que devolvió la base de datos y los botones «Siguiente reto» y «Volver al mapa»; si no, el paso donde falló, sin regañar. Botón «Volver al mapa».

Navegación: V1 → V2 → V3 → V2. El explorador elegido se guarda en el estado de la app.

## Arquitectura

- App web solo de cliente: React, Vite y TypeScript. Sin servidor propio.
- Datos con `@supabase/supabase-js`, usando la publishable key (pública; la seguridad la ponen las políticas RLS).
- Configuración en `src/config.ts`, que lee `import.meta.env.VITE_SUPABASE_URL` y `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`.
- La ejecución del programa (mover a Robi) vive en un archivo aparte, `src/robi.ts`, sin React: recibe el reto y el programa y devuelve la lista de pasos y el resultado.
- Después de guardar cualquier cosa, la app vuelve a cargar los datos.
