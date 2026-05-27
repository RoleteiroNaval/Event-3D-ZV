import * as THREE from 'three';
import { createLocalArchitectLayout } from '../lib/aiArchitect';
import type { EventBrief, EventWorldLayout, Zone } from '../types/event';
import { createArrow, createLowWall, createObjectFromSpec, createTextLabel, mat, OBJECT_LIBRARY } from './objectLibrary';

const zoneColors: Record<Zone['type'], string> = {
  palco: '#2563eb',
  pista: '#0f766e',
  vip: '#a855f7',
  wc: '#38bdf8',
  bar: '#f59e0b',
  entrada: '#facc15',
  backstage: '#64748b',
  corredor: '#facc15',
};

const floorMaterial = (zone: Zone) => {
  if (zone.type === 'pista') return mat('#1f2937', { roughness: 0.52, opacity: 0.72 });
  if (zone.type === 'corredor') return mat('#facc15', { roughness: 0.45, opacity: 0.28, emissive: '#ca8a04' });
  if (zone.type === 'vip') return mat('#581c87', { roughness: 0.7, opacity: 0.92, emissive: '#4c1d95' });
  if (zone.type === 'bar') return mat('#451a03', { roughness: 0.5 });
  if (zone.type === 'wc') return mat('#334155', { roughness: 0.75 });
  if (zone.type === 'entrada') return mat('#18181b', { roughness: 0.48 });
  return mat('#111827', { roughness: 0.6 });
};

const addZoneLabel = (group: THREE.Group, zone: Zone) => {
  const label = createTextLabel(zone.name, zoneColors[zone.type]);
  label.position.set(zone.position.x, Math.max(1.2, zone.position.y + zone.size.height + 0.65), zone.position.z);
  group.add(label);
};

const createZoneBase = (zone: Zone) => {
  const group = new THREE.Group();
  group.name = `zone-${zone.id}`;
  group.position.set(zone.position.x, 0, zone.position.z);
  group.rotation.y = THREE.MathUtils.degToRad(zone.rotation);

  if (zone.type === 'palco') {
    const stage = OBJECT_LIBRARY.palco(zone);
    stage.position.y = 0;
    group.add(stage);
    return group;
  }

  const height = zone.type === 'pista' || zone.type === 'corredor' ? 0.05 : zone.size.height;
  const y = zone.type === 'pista' || zone.type === 'corredor' ? 0.035 : height / 2;
  const base = new THREE.Mesh(new THREE.BoxGeometry(zone.size.width, height, zone.size.depth), floorMaterial(zone));
  base.name = `${zone.id}-base`;
  base.position.y = y;
  group.add(base);

  if (zone.type === 'vip') {
    group.add(createLowWall(zone.size.width, zone.size.depth, 0.9, '#312e81'));
  }

  if (zone.type === 'wc' || zone.type === 'bar' || zone.type === 'entrada' || zone.type === 'backstage') {
    group.add(createLowWall(zone.size.width, zone.size.depth, zone.type === 'bar' ? 1.2 : zone.size.height, '#111827'));
  }

  return group;
};

const addZoneObjects = (group: THREE.Group, zone: Zone) => {
  zone.objects.forEach((object) => {
    const mesh = createObjectFromSpec(object);
    mesh.position.x += zone.position.x;
    mesh.position.y += zone.position.y;
    mesh.position.z += zone.position.z;
    group.add(mesh);
  });
};

const addEmergencyExits = (group: THREE.Group, layout: EventWorldLayout) => {
  const { width_m, depth_m } = layout.venue;
  const exits = [
    { x: -width_m / 2 + 0.8, z: depth_m / 2 - 1.4, rot: Math.PI / 2 },
    { x: width_m / 2 - 0.8, z: depth_m / 2 - 1.4, rot: -Math.PI / 2 },
    { x: -width_m / 2 + 0.8, z: -depth_m / 2 + 2.2, rot: Math.PI / 2 },
    { x: width_m / 2 - 0.8, z: -depth_m / 2 + 2.2, rot: -Math.PI / 2 },
  ];

  exits.forEach((exit, index) => {
    const sign = createTextLabel('SAIDA DE EMERGENCIA', '#22c55e');
    sign.name = `emergency-exit-${index}`;
    sign.position.set(exit.x, 1.75, exit.z);
    sign.rotation.y = exit.rot;
    sign.scale.set(2.8, 0.85, 1);
    group.add(sign);

    const arrow = createArrow(`exit-arrow-${index}`, '#22c55e', 1.8);
    arrow.position.set(exit.x, 0.08, exit.z + (index < 2 ? 0.8 : -0.8));
    arrow.rotation.y = index < 2 ? Math.PI : 0;
    group.add(arrow);
  });
};

const addFlowArrows = (group: THREE.Group, layout: EventWorldLayout) => {
  const publicPath = createArrow('public-flow-arrow', '#facc15', layout.venue.depth_m * 0.34);
  publicPath.position.set(-layout.venue.width_m * 0.22, 0.1, layout.venue.depth_m * 0.08);
  publicPath.rotation.y = Math.PI;
  group.add(publicPath);

  const publicPathRight = createArrow('public-flow-arrow-right', '#facc15', layout.venue.depth_m * 0.28);
  publicPathRight.position.set(layout.venue.width_m * 0.22, 0.1, layout.venue.depth_m * 0.04);
  publicPathRight.rotation.y = Math.PI;
  group.add(publicPathRight);

  const vipFlow = createArrow('vip-flow-arrow', '#c084fc', layout.venue.depth_m * 0.22);
  vipFlow.position.set(layout.venue.width_m * 0.33, 0.12, layout.venue.depth_m * 0.2);
  vipFlow.rotation.y = Math.PI * 0.86;
  group.add(vipFlow);
};

const addVenueShell = (group: THREE.Group, layout: EventWorldLayout) => {
  const { width_m, depth_m, height_m } = layout.venue;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width_m, depth_m), mat('#18181b', { roughness: 0.58 }));
  floor.name = 'venue-floor-real-scale';
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const wallHeight = Math.min(3.2, height_m * 0.55);
  const wallThickness = 0.24;
  const wallMat = mat('#111827', { roughness: 0.65 });

  const north = new THREE.Mesh(new THREE.BoxGeometry(width_m, wallHeight, wallThickness), wallMat);
  north.position.set(0, wallHeight / 2, -depth_m / 2);
  const south = north.clone();
  south.position.z = depth_m / 2;
  const west = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, depth_m), wallMat);
  west.position.set(-width_m / 2, wallHeight / 2, 0);
  const east = west.clone();
  east.position.x = width_m / 2;
  group.add(north, south, west, east);

  for (const x of [-width_m / 2 + 1, width_m / 2 - 1]) {
    for (const z of [-depth_m / 2 + 1, depth_m / 2 - 1]) {
      const uplight = new THREE.PointLight(0xfbbf24, 0.7, 5);
      uplight.position.set(x, 1.4, z);
      group.add(uplight);
    }
  }
};

const collectColliders = (layout: EventWorldLayout) => (
  layout.zones
    .filter((zone) => !['pista', 'corredor'].includes(zone.type))
    .map((zone) => new THREE.Box3(
      new THREE.Vector3(
        zone.position.x - zone.size.width / 2,
        0,
        zone.position.z - zone.size.depth / 2
      ),
      new THREE.Vector3(
        zone.position.x + zone.size.width / 2,
        Math.max(1, zone.size.height + zone.position.y),
        zone.position.z + zone.size.depth / 2
      )
    ))
);

export const createEventMockup = (brief: EventBrief) => {
  const layout = createLocalArchitectLayout(brief);
  const group = new THREE.Group();
  group.name = 'realistic-event-architectural-mockup';

  addVenueShell(group, layout);
  addFlowArrows(group, layout);
  addEmergencyExits(group, layout);

  layout.zones.forEach((item) => {
    const zoneGroup = createZoneBase(item);
    group.add(zoneGroup);
    addZoneObjects(group, item);
    addZoneLabel(group, item);
  });

  return {
    group,
    layout,
    colliders: collectColliders(layout),
    bounds: {
      halfWidth: layout.venue.width_m / 2,
      halfDepth: layout.venue.depth_m / 2,
    },
  };
};
