import type { EventBrief, EventWorldLayout, LightingType, Object3D, Zone, ZoneType } from '../types/event';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const materialSet = (floor: string, walls: string, lighting: LightingType) => ({
  floor,
  walls,
  lighting,
});

const zone = (
  id: string,
  type: ZoneType,
  name: string,
  position: Zone['position'],
  size: Zone['size'],
  options: {
    capacity?: number;
    sightLineToStage?: boolean;
    accessPoints?: Zone['accessPoints'];
    minCorridorWidth_m?: number;
    materials?: Zone['materials'];
    objects?: Object3D[];
    rotation?: number;
  } = {}
): Zone => ({
  id,
  type,
  name,
  position,
  size,
  rotation: options.rotation ?? 0,
  capacity: options.capacity,
  sightLineToStage: options.sightLineToStage ?? type !== 'palco',
  accessPoints: options.accessPoints ?? [{ x: position.x, z: position.z }],
  minCorridorWidth_m: options.minCorridorWidth_m ?? 1.2,
  materials: options.materials ?? materialSet('piso_preto_fosco', 'parede_preta', 'quente'),
  objects: options.objects ?? [],
});

const stageObjects = (width: number, depth: number): Object3D[] => [
  { type: 'caixa_som', position: { x: -width / 2 - 0.7, y: 1.8, z: 0 }, scale: 1.2 },
  { type: 'caixa_som', position: { x: width / 2 + 0.7, y: 1.8, z: 0 }, scale: 1.2 },
  { type: 'luz', position: { x: -width * 0.32, y: 3.8, z: -depth * 0.35 }, scale: 1 },
  { type: 'luz', position: { x: 0, y: 3.8, z: -depth * 0.35 }, scale: 1 },
  { type: 'luz', position: { x: width * 0.32, y: 3.8, z: -depth * 0.35 }, scale: 1 },
  { type: 'grade', position: { x: 0, y: 0.65, z: depth / 2 + 0.7 }, scale: 1 },
];

const vipObjects = (width: number, depth: number): Object3D[] => [
  { type: 'sofa', position: { x: -width * 0.25, y: 0.45, z: -depth * 0.18 }, scale: 1 },
  { type: 'sofa', position: { x: width * 0.2, y: 0.45, z: depth * 0.22 }, scale: 0.9 },
  { type: 'mesa', position: { x: 0, y: 0.42, z: 0 }, scale: 1 },
  { type: 'planta', position: { x: -width * 0.42, y: 0.5, z: depth * 0.38 }, scale: 0.9 },
  { type: 'planta', position: { x: width * 0.42, y: 0.5, z: -depth * 0.38 }, scale: 0.9 },
  { type: 'grade', position: { x: 0, y: 0.7, z: -depth / 2 }, scale: 1 },
];

const barObjects = (width: number): Object3D[] => [
  { type: 'balcao', position: { x: 0, y: 0.65, z: 0 }, scale: Math.max(0.8, width / 6) },
  { type: 'luz', position: { x: -width * 0.3, y: 2.4, z: -0.4 }, scale: 0.7 },
  { type: 'luz', position: { x: width * 0.3, y: 2.4, z: -0.4 }, scale: 0.7 },
  { type: 'planta', position: { x: -width * 0.48, y: 0.5, z: 1 }, scale: 0.65 },
  { type: 'planta', position: { x: width * 0.48, y: 0.5, z: 1 }, scale: 0.65 },
];

const wcObjects = (width: number, depth: number, count: number): Object3D[] => (
  Array.from({ length: count }, (_, index) => ({
    type: 'grade' as const,
    position: {
      x: -width * 0.38 + index * Math.min(1.1, width / Math.max(1, count - 1)),
      y: 0.5,
      z: -depth * 0.25,
    },
    scale: 0.55,
  }))
);

export const generateArchitecturalLayout = (brief: EventBrief): EventWorldLayout => {
  const width = clamp(brief.width_m, 10, 120);
  const depth = clamp(brief.depth_m, 10, 160);
  const height = clamp(brief.height_m, 3, 18);
  const totalArea = width * depth;
  const stageWidth = clamp(width * 0.58, 8, 22);
  const stageDepth = clamp(depth * 0.22, 4, 10);
  const stageZ = -depth / 2 + stageDepth / 2 + 1.8;
  const vipCapacity = Math.max(8, Math.round(brief.capacity * 0.15));
  const wcUnits = Math.max(2, Math.ceil(brief.capacity / 50));
  const zones: Zone[] = [];

  if (brief.requiredZones.palco) {
    zones.push(zone('palco_01', 'palco', 'Palco Principal', { x: 0, y: 0.6, z: stageZ }, {
      width: stageWidth,
      depth: stageDepth,
      height: 1.2,
    }, {
      sightLineToStage: false,
      accessPoints: [{ x: -stageWidth * 0.4, z: stageZ + stageDepth / 2 }, { x: stageWidth * 0.4, z: stageZ + stageDepth / 2 }],
      minCorridorWidth_m: 3,
      materials: materialSet('madeira_preta', 'cortina_preta', 'rgb'),
      objects: stageObjects(stageWidth, stageDepth),
    }));
  }

  if (brief.requiredZones.backstage) {
    zones.push(zone('backstage_01', 'backstage', 'Bastidores / Apoio Tecnico', { x: 0, y: 1.3, z: -depth / 2 + 1.2 }, {
      width: clamp(stageWidth * 0.88, 6, width - 4),
      depth: 2.4,
      height: 2.6,
    }, {
      sightLineToStage: false,
      materials: materialSet('piso_tecnico', 'parede_tecnica', 'fria'),
      objects: [
        { type: 'balcao', position: { x: -2, y: 0.6, z: 0 }, scale: 0.8 },
        { type: 'caixa_som', position: { x: 2, y: 0.6, z: 0 }, scale: 0.65 },
      ],
    }));
  }

  zones.push(zone('pista_01', 'pista', 'Area Publico', { x: 0, y: 0.025, z: -0.4 }, {
    width: clamp(width * 0.62, 7, width - 5),
    depth: clamp(depth * 0.48, 6, depth - stageDepth - 6),
    height: 0.05,
  }, {
    capacity: Math.floor((brief.capacity - vipCapacity) * 0.86),
    minCorridorWidth_m: 2.5,
    materials: materialSet('concreto_escuro', 'sem_parede', 'rgb'),
  }));

  zones.push(zone('corredor_principal', 'corredor', 'Circulacao Publico', { x: 0, y: 0.035, z: depth * 0.12 }, {
    width: 2.5,
    depth: depth * 0.74,
    height: 0.04,
  }, {
    minCorridorWidth_m: 2.5,
    materials: materialSet('seta_amarela', 'sem_parede', 'quente'),
  }));

  if (brief.requiredZones.vip) {
    const vipWidth = clamp(width * 0.24, 4, 8);
    const vipDepth = clamp(depth * 0.34, 5, 10);
    zones.push(zone('vip_01', 'vip', 'Area VIP', { x: width / 2 - vipWidth / 2 - 1.2, y: 0.35, z: depth * 0.13 }, {
      width: vipWidth,
      depth: vipDepth,
      height: 0.7,
    }, {
      capacity: vipCapacity,
      sightLineToStage: true,
      accessPoints: [{ x: width / 2 - vipWidth - 0.8, z: depth * 0.22 }],
      materials: materialSet('carpete_roxo', 'vidro_fume', 'rgb'),
      objects: vipObjects(vipWidth, vipDepth),
    }));
  }

  if (brief.requiredZones.wc) {
    const wcWidth = clamp(width * 0.18, 3.5, 6);
    const wcDepth = clamp(depth * 0.28, 4, 8);
    zones.push(zone('wc_01', 'wc', 'WC', { x: -width / 2 + wcWidth / 2 + 1, y: 1.25, z: depth * 0.16 }, {
      width: wcWidth,
      depth: wcDepth,
      height: 2.5,
    }, {
      capacity: wcUnits,
      sightLineToStage: false,
      accessPoints: [{ x: -width / 2 + wcWidth + 1.2, z: depth * 0.16 }],
      minCorridorWidth_m: 2,
      materials: materialSet('ceramica_cinza', 'divisoria_cinza', 'fria'),
      objects: wcObjects(wcWidth, wcDepth, wcUnits),
    }));
  }

  if (brief.requiredZones.bar) {
    const barWidth = clamp(width * 0.2, 4, 7);
    zones.push(zone('bar_01', 'bar', 'Bar 01', { x: -width / 2 + barWidth / 2 + 1, y: 0.7, z: -depth * 0.08 }, {
      width: barWidth,
      depth: 2.6,
      height: 1.4,
    }, {
      materials: materialSet('madeira_escura', 'pedra_preta', 'quente'),
      objects: barObjects(barWidth),
    }));
    zones.push(zone('bar_02', 'bar', 'Bar 02', { x: width / 2 - barWidth / 2 - 1, y: 0.7, z: -depth * 0.08 }, {
      width: barWidth,
      depth: 2.6,
      height: 1.4,
    }, {
      materials: materialSet('madeira_escura', 'pedra_preta', 'quente'),
      objects: barObjects(barWidth),
    }));
  }

  zones.push(zone('entrada_01', 'entrada', 'Entrada Principal / Check-in', { x: 0, y: 1.05, z: depth / 2 - 1.4 }, {
    width: clamp(width * 0.34, 5, 10),
    depth: 2.4,
    height: 2.1,
  }, {
    materials: materialSet('piso_preto', 'painel_preto', 'quente'),
    objects: [
      { type: 'balcao', position: { x: 0, y: 0.65, z: -0.25 }, scale: 1 },
      { type: 'grade', position: { x: -2.2, y: 0.5, z: 1.4 }, scale: 0.8 },
      { type: 'grade', position: { x: 2.2, y: 0.5, z: 1.4 }, scale: 0.8 },
    ],
  }));

  return {
    metadata: {
      venueName: brief.venueName,
      totalArea_m2: totalArea,
      capacity: brief.capacity,
      eventType: brief.eventType,
      styleReference: brief.styleReference,
    },
    venue: {
      width_m: width,
      depth_m: depth,
      height_m: height,
      shape: 'retangular',
    },
    zones,
  };
};
