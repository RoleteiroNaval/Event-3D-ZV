import type { EventBrief, EventType } from '../types/event';

type Props = {
  value: EventBrief;
  onChange: (value: EventBrief) => void;
};

const zoneItems = [
  ['palco', 'Palco'],
  ['vip', 'VIP'],
  ['wc', 'WC'],
  ['bar', 'Bar'],
  ['backstage', 'Backstage'],
] as const;

export default function EventBriefPanel({ value, onChange }: Props) {
  const update = <Key extends keyof EventBrief>(key: Key, nextValue: EventBrief[Key]) => {
    onChange({ ...value, [key]: nextValue });
  };

  const updateZone = (key: keyof EventBrief['requiredZones'], checked: boolean) => {
    onChange({
      ...value,
      requiredZones: {
        ...value.requiredZones,
        [key]: checked,
      },
    });
  };

  return (
    <section className="brief-panel">
      <div className="brief-header">
        <span className="app-kicker">Briefing arquitetonico</span>
        <h2>Monte o mockup da festa</h2>
      </div>

      <div className="brief-grid">
        <label>
          Nome do espaco
          <input value={value.venueName} onChange={(event) => update('venueName', event.target.value)} />
        </label>

        <label>
          Tipo de evento
          <select value={value.eventType} onChange={(event) => update('eventType', event.target.value as EventType)}>
            <option value="show">Show</option>
            <option value="festa">Festa</option>
            <option value="corporativo">Corporativo</option>
            <option value="casamento">Casamento</option>
          </select>
        </label>

        <label>
          Largura (m)
          <input type="number" min="10" max="120" value={value.width_m} onChange={(event) => update('width_m', Number(event.target.value))} />
        </label>

        <label>
          Profundidade (m)
          <input type="number" min="10" max="160" value={value.depth_m} onChange={(event) => update('depth_m', Number(event.target.value))} />
        </label>

        <label>
          Altura (m)
          <input type="number" min="3" max="18" value={value.height_m} onChange={(event) => update('height_m', Number(event.target.value))} />
        </label>

        <label>
          Capacidade
          <input type="number" min="30" max="10000" value={value.capacity} onChange={(event) => update('capacity', Number(event.target.value))} />
        </label>

        <label>
          Entrada
          <select value={value.entranceSide} onChange={(event) => update('entranceSide', event.target.value as EventBrief['entranceSide'])}>
            <option value="sul">Sul do palco</option>
            <option value="norte">Norte do palco</option>
            <option value="leste">Leste do palco</option>
            <option value="oeste">Oeste do palco</option>
          </select>
        </label>

        <label>
          Prioridade
          <select value={value.priority} onChange={(event) => update('priority', event.target.value as EventBrief['priority'])}>
            <option value="visao_palco">Visao do palco</option>
            <option value="conforto_vip">Conforto VIP</option>
            <option value="bar_perto_pista">Bar perto da pista</option>
          </select>
        </label>
      </div>

      <div className="zone-grid">
        {zoneItems.map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={value.requiredZones[key]}
              onChange={(event) => updateZone(key, event.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>

      <label className="style-reference">
        Estilo extraido / desejado
        <textarea value={value.styleReference} onChange={(event) => update('styleReference', event.target.value)} />
      </label>
    </section>
  );
}
