export type ColorExplorador =
  | 'rojo'
  | 'azul'
  | 'verde'
  | 'amarillo'
  | 'morado'
  | 'naranja';

export interface Explorador {
  id: number;
  apodo: string;
  color: ColorExplorador;
  estrellas: number;
  retos_superados?: number;
  intentos?: number;
}

export type Direccion = 'N' | 'E' | 'S' | 'O';

export type TipoBloqueSimple = 'avanzar' | 'izquierda' | 'derecha';
export type TipoBloque = TipoBloqueSimple | 'repetir';

export interface BloqueSimple {
  tipo: TipoBloqueSimple;
}

export interface BloqueRepetir {
  tipo: 'repetir';
  veces: number;
  cuerpo: BloqueSimple[];
}

export type BloquePrograma = BloqueSimple | BloqueRepetir;

export interface Reto {
  id: number;
  mundo_id: number;
  orden: number;
  titulo: string;
  explicacion: string;
  ancho: number;
  alto: number;
  inicio_x: number;
  inicio_y: number;
  direccion_inicial: Direccion;
  meta_x: number;
  meta_y: number;
  muros: [number, number][];
  bloques_permitidos: TipoBloque[];
  max_bloques: number;
  bloques_ideales: number;
}

export type EstadoReto = 'superado' | 'abierto' | 'bloqueado';

export interface ItemMapa {
  explorador_id: number;
  mundo: string;
  mundo_orden: number;
  reto_id: number;
  orden: number;
  titulo: string;
  estrellas: number;
  estado: EstadoReto;
}
