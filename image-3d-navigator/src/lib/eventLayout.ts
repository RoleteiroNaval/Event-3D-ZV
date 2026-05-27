export type EventType = 'show' | 'festa' | 'casamento' | 'corporativo' | 'festival';
export type VenueType = 'galpao' | 'salao' | 'area_aberta' | 'rooftop';
export type EventZoneType =
  | 'stage'
  | 'danceFloor'
  | 'vip'
  | 'bathroom'
  | 'bar'
  | 'entrance'
  | 'backstage'
  | 'emergencyExit';

export type EventSceneBrief = {
  eventType: EventType;
  venueType: VenueType;
  audienceCapacity: number;
  dimensions: {
    widthMeters: number;
    depthMeters: number;
    heightMeters: number;
  };
  requiredZones: {
    stage: boolean;
    vipArea: boolean;
    bathrooms: boolean;
    bars: boolean;
    entrance: boolean;
    emergencyExits: boolean;
    backstage: boolean;
    danceFloor: boolean;
  };
  style: {
    theme: string;
    lighting: 'neon' | 'luxo' | 'industrial' | 'clean' | 'festival';
    decorationLevel: 'simples' | 'medio' | 'premium';
  };
};

export type EventZone = {
  id: string;
  type: EventZoneType;
  label: string;
  position: { x: number; y: number; z: number };
  size: { width: number; depth: number; height: number };
  rotation: number;
  color: string;
};

export type EventWorldLayout = {
  scale: number;
  width: number;
  depth: number;
  capacityDensity: number;
  zones: EventZone[];
  notes: string[];
};

export const defaultEventBrief: EventSceneBrief = {
  eventType: 'show',
  venueType: 'galpao',
  audienceCapacity: 500,
  dimensions: {
    widthMeters: 30,
    depthMeters: 50,
    heightMeters: 8,
  },
  requiredZones: {
    stage: true,
    vipArea: true,
    bathrooms: true,
    bars: true,
    entrance: true,
    emergencyExits: true,
    backstage: true,
    danceFloor: true,
  },
  style: {
    theme: 'festa eletronica premium',
    lighting: 'neon',
    decorationLevel: 'premium',
  },
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const zone = (
  id: string,
  type: EventZoneType,
  label: string,
  position: EventZone['position'],
  size: EventZone['size'],
  color: string,
  rotation = 0
): EventZone => ({ id, type, label, position, size, color, rotation });

export const generateEventLayout = (brief: EventSceneBrief): EventWorldLayout => {
  const width = clamp(brief.dimensions.widthMeters, 12, 120);
  const depth = clamp(brief.dimensions.depthMeters, 16, 180);
  const scale = 0.45;
  const w = width * scale;
  const d = depth * scale;
  const capacityDensity = brief.audienceCapacity / Math.max(1, width * depth);
  const zones: EventZone[] = [];
  const notes: string[] = [];

  const stageWidth = clamp(w * 0.52, 7, 18);
  const stageDepth = clamp(d * 0.14, 3, 8);
  const stageHeight = brief.eventType === 'festival' ? 2.4 : 1.4;
  const stageZ = -d * 0.42;

  if (brief.requiredZones.stage) {
    zones.push(zone('stage-main', 'stage', 'Palco Principal', { x: 0, y: stageHeight / 2, z: stageZ }, {
      width: stageWidth,
      depth: stageDepth,
      height: stageHeight,
    }, '#7c3aed'));
  }

  if (brief.requiredZones.backstage) {
    zones.push(zone('backstage', 'backstage', 'Backstage', { x: 0, y: 1.4, z: stageZ - stageDepth * 0.88 }, {
      width: stageWidth * 0.82,
      depth: clamp(stageDepth * 0.72, 2.4, 5.5),
      height: 2.8,
    }, '#27272a'));
  }

  if (brief.requiredZones.danceFloor) {
    zones.push(zone('dance-floor', 'danceFloor', 'Pista', { x: 0, y: 0.03, z: -d * 0.08 }, {
      width: clamp(w * 0.68, 8, 30),
      depth: clamp(d * 0.46, 8, 36),
      height: 0.06,
    }, '#0891b2'));
  }

  if (brief.requiredZones.vipArea) {
    const vipSide = brief.venueType === 'rooftop' ? 1 : -1;
    zones.push(zone('vip-area', 'vip', 'Area VIP', { x: vipSide * w * 0.34, y: 0.65, z: -d * 0.08 }, {
      width: clamp(w * 0.22, 4.2, 10),
      depth: clamp(d * 0.36, 6, 20),
      height: 1.3,
    }, '#d946ef'));
  }

  if (brief.requiredZones.bars) {
    zones.push(zone('bar-main', 'bar', 'Bar Principal', { x: w * 0.36, y: 0.75, z: d * 0.08 }, {
      width: clamp(w * 0.22, 4, 10),
      depth: 2.3,
      height: 1.5,
    }, '#f59e0b'));

    if (brief.audienceCapacity > 450) {
      zones.push(zone('bar-support', 'bar', 'Bar Apoio', { x: -w * 0.36, y: 0.75, z: d * 0.08 }, {
        width: clamp(w * 0.18, 3.4, 8),
        depth: 2.1,
        height: 1.4,
      }, '#f97316'));
    }
  }

  if (brief.requiredZones.bathrooms) {
    zones.push(zone('bathrooms', 'bathroom', 'Banheiros', { x: w * 0.38, y: 1.25, z: d * 0.34 }, {
      width: clamp(w * 0.2, 4, 9),
      depth: clamp(d * 0.12, 3, 7),
      height: 2.5,
    }, '#22c55e'));
  }

  if (brief.requiredZones.entrance) {
    zones.push(zone('entrance', 'entrance', 'Entrada / Credenciamento', { x: 0, y: 1.15, z: d * 0.46 }, {
      width: clamp(w * 0.36, 5, 16),
      depth: 2.4,
      height: 2.3,
    }, '#38bdf8'));
  }

  if (brief.requiredZones.emergencyExits) {
    zones.push(zone('exit-left', 'emergencyExit', 'Saida Emergencia', { x: -w * 0.49, y: 1.05, z: d * 0.16 }, {
      width: 2.6,
      depth: 1.6,
      height: 2.1,
    }, '#ef4444', Math.PI / 2));
    zones.push(zone('exit-right', 'emergencyExit', 'Saida Emergencia', { x: w * 0.49, y: 1.05, z: -d * 0.12 }, {
      width: 2.6,
      depth: 1.6,
      height: 2.1,
    }, '#ef4444', -Math.PI / 2));
  }

  if (capacityDensity > 0.75) {
    notes.push('Densidade alta: mantenha corredores laterais livres e barras fora da pista central.');
  }

  if (brief.requiredZones.vipArea && brief.requiredZones.stage) {
    notes.push('VIP posicionado com vista diagonal para o palco sem bloquear a pista.');
  }

  return { scale, width: w, depth: d, capacityDensity, zones, notes };
};
