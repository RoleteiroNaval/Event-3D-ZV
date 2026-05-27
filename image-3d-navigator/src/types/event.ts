export type EventType = 'show' | 'festa' | 'corporativo' | 'casamento';
export type VenueShape = 'retangular' | 'L' | 'irregular';
export type ZoneType = 'palco' | 'pista' | 'vip' | 'wc' | 'bar' | 'entrada' | 'backstage' | 'corredor';
export type ObjectType = 'sofa' | 'mesa' | 'balcao' | 'caixa_som' | 'luz' | 'grade' | 'planta';
export type LightingType = 'quente' | 'fria' | 'rgb' | 'spot';

export interface EventWorldLayout {
  metadata: {
    venueName: string;
    totalArea_m2: number;
    capacity: number;
    eventType: EventType;
    styleReference: string;
  };
  venue: {
    width_m: number;
    depth_m: number;
    height_m: number;
    shape: VenueShape;
  };
  zones: Zone[];
}

export interface Zone {
  id: string;
  type: ZoneType;
  name: string;
  position: { x: number; y: number; z: number };
  size: { width: number; depth: number; height: number };
  rotation: number;
  capacity?: number;
  sightLineToStage: boolean;
  accessPoints: { x: number; z: number }[];
  minCorridorWidth_m: number;
  materials: {
    floor: string;
    walls: string;
    lighting: LightingType;
  };
  objects: Object3D[];
}

export interface Object3D {
  type: ObjectType;
  position: { x: number; y: number; z: number };
  scale: number;
}

export interface EventBrief {
  venueName: string;
  eventType: EventType;
  width_m: number;
  depth_m: number;
  height_m: number;
  capacity: number;
  entranceSide: 'norte' | 'sul' | 'leste' | 'oeste';
  priority: 'visao_palco' | 'conforto_vip' | 'bar_perto_pista';
  requiredZones: {
    palco: boolean;
    vip: boolean;
    wc: boolean;
    bar: boolean;
    backstage: boolean;
  };
  styleReference: string;
}

export const defaultEventBrief: EventBrief = {
  venueName: 'Evento Teste',
  eventType: 'show',
  width_m: 25,
  depth_m: 20,
  height_m: 6,
  capacity: 150,
  entranceSide: 'sul',
  priority: 'visao_palco',
  requiredZones: {
    palco: true,
    vip: true,
    wc: true,
    bar: true,
    backstage: true,
  },
  styleReference: 'planta 3D de evento premium, piso escuro, palco com luz RGB azul e roxa, bares laterais, VIP com luz violeta e sinalizacao de emergencia verde',
};
