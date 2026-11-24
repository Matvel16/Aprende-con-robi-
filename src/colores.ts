import type { ColorExplorador } from './types';

export interface OpcionColor {
  id: ColorExplorador;
  nombre: string;
  fondoHex: string;
  textoHex: string;
}

export const COLORES_EXPLORADOR: OpcionColor[] = [
  { id: 'rojo', nombre: 'Rojo', fondoHex: '#D63B2F', textoHex: '#FFFFFF' },
  { id: 'azul', nombre: 'Azul', fondoHex: '#1D5FD6', textoHex: '#FFFFFF' },
  { id: 'verde', nombre: 'Verde', fondoHex: '#1E8E4E', textoHex: '#FFFFFF' },
  { id: 'amarillo', nombre: 'Amarillo', fondoHex: '#FACC15', textoHex: '#16243B' },
  { id: 'morado', nombre: 'Morado', fondoHex: '#7C3AED', textoHex: '#FFFFFF' },
  { id: 'naranja', nombre: 'Naranja', fondoHex: '#EA580C', textoHex: '#FFFFFF' },
];

export function obtenerInfoColor(color: string): OpcionColor {
  return (
    COLORES_EXPLORADOR.find((c) => c.id === color) ?? COLORES_EXPLORADOR[1]
  );
}
