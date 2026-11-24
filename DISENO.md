# Guía de diseño

Adaptada y resumida de la skill «frontend-design» de Anthropic
(github.com/anthropics/skills, licencia Apache 2.0). Cambios: traducida al español, recortada y
aplicada a una app para niños de 10 años.

## Antes de programar: un plan corto

Escribe un plan de diseño propio para esta app y revísalo antes de tocar código:

- Color: 4 a 6 colores con nombre y código hex.
- Letra: una o dos familias de Google Fonts, cada una con su papel. No uses Inter, Roboto, Arial ni
la fuente del sistema. Que se lean bien a los 10 años.
- Disposición: cómo se reparte la pantalla y cómo se alinea el contenido.
- Un elemento memorable: una sola cosa que distinga la app. Todo lo demás, sobrio.

Saca las ideas del mundo de la app: el cuaderno cuadriculado de matemáticas de un niño colombiano,
las fichas de un juego de mesa y un robot hecho con una caja de cartón. Si una parte del plan saldría
igual para cualquier otra app, cámbiala.

## Lo que delata una app hecha por IA (evítalo)

- Contenido picado en tarjetas idénticas, todas con el mismo radio y la misma sombra gris.
- Degradados de adorno y fondos crema con un acento terracota.
- Etiquetas en MAYÚSCULAS con letras separadas encima de cada título.
- Una sola palabra del título en otro color o en cursiva.
- Números 01, 02, 03 cuando el contenido no es una secuencia.
- Animaciones de entrada en cada sección y efectos al pasar el mouse por todas las tarjetas.
- Una flecha «→» al final de cada botón y emojis como íconos.

## Reglas

- Gasta la audacia en un solo lugar. Antes de terminar, quita un adorno.
- La única animación importante es Robi moviéndose: es el contenido, no un adorno.
- Líneas de texto de menos de 60 caracteres y una escala de tamaños clara.
- Las líneas, bordes y números informan algo; si solo decoran, sobran.

## Para niños de 10 años

- Letra de 18 px o más en el texto y botones de 48 px de alto o más: se usa con el dedo en una tableta.
- Frases de máximo 12 palabras. Nada de palabras técnicas en pantalla (ni «JSON», ni «error 400»).
- El estado nunca depende solo del color: superado, abierto y bloqueado llevan también palabra o ícono.
- Nunca regañar ni usar rojo de alarma para un intento fallido: equivocarse es parte de programar.
  «Casi: Robi chocó en el paso 4» en lugar de «Error».
- Sin sonidos automáticos, sin enlaces a otras páginas, sin publicidad y sin chat.

## Piso de calidad

- Funciona en celular y en tableta, el foco del teclado se ve, el contraste se lee bien y respeta
«reducir movimiento».

## Textos

- Español claro y en voz activa, tuteando al niño. Nombra las cosas como las nombra él, no como las
nombra el código.
- Cada botón dice lo que hace: «Ejecutar», «Borrar último», «Siguiente reto». El mismo nombre en todo
el flujo.
- Un error dice qué pasó y cómo arreglarlo, sin disculparse. Una pantal
