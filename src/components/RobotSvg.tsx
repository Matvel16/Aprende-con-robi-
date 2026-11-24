import type { Direccion } from '../types';

interface RobotSvgProps {
  direccion: Direccion;
  choco?: boolean;
}

const ROTACION_POR_DIRECCION: Record<Direccion, number> = {
  N: 0,
  E: 90,
  S: 180,
  O: 270,
};

const NOMBRE_DIRECCION: Record<Direccion, string> = {
  N: 'arriba',
  E: 'la derecha',
  S: 'abajo',
  O: 'la izquierda',
};

export function RobotSvg({ direccion, choco = false }: RobotSvgProps) {
  const rotacion = ROTACION_POR_DIRECCION[direccion];

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full block transition-transform duration-200"
      style={{ transform: `rotate(${rotacion}deg)` }}
      role="img"
      aria-label={`Robi mirando hacia ${NOMBRE_DIRECCION[direccion]}`}
    >
      {/* Orejas / solapas laterales de cartón */}
      <rect
        x="8"
        y="38"
        width="10"
        height="24"
        rx="3"
        fill="#B99768"
        stroke="#16243B"
        strokeWidth="3.5"
      />
      <rect
        x="82"
        y="38"
        width="10"
        height="24"
        rx="3"
        fill="#B99768"
        stroke="#16243B"
        strokeWidth="3.5"
      />

      {/* Cabeza cuadrada de cartón */}
      <rect
        x="18"
        y="22"
        width="64"
        height="62"
        rx="10"
        fill="#DFC39D"
        stroke="#16243B"
        strokeWidth="4"
      />

      {/* Doblez / cinta del cartón atrás */}
      <line
        x1="34"
        y1="68"
        x2="66"
        y2="68"
        stroke="#B99768"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Flecha / visor delantero que indica hacia dónde mira */}
      <polygon
        points="50,6 39,22 61,22"
        fill={choco ? '#D95F2B' : '#1D5FD6'}
        stroke="#16243B"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Franja oscura de ojos */}
      <rect
        x="26"
        y="30"
        width="48"
        height="22"
        rx="6"
        fill="#16243B"
      />

      {/* Ojos */}
      {choco ? (
        <>
          <path
            d="M34 36 L42 46 M42 36 L34 46"
            stroke="#F9FBFC"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M58 36 L66 46 M66 36 L58 46"
            stroke="#F9FBFC"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="38" cy="41" r="6" fill="#F9FBFC" />
          <circle cx="38" cy="39" r="2.6" fill="#1D5FD6" />
          <circle cx="62" cy="41" r="6" fill="#F9FBFC" />
          <circle cx="62" cy="39" r="2.6" fill="#1D5FD6" />
        </>
      )}

      {/* Antena en la parte superior central */}
      <line
        x1="50"
        y1="62"
        x2="50"
        y2="76"
        stroke="#16243B"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle
        cx="50"
        cy="60"
        r="6"
        fill={choco ? '#D95F2B' : '#EAB308'}
        stroke="#16243B"
        strokeWidth="3"
      />
    </svg>
  );
}
