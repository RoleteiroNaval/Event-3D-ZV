import type { EventBrief, EventWorldLayout } from '../types/event';
import { generateArchitecturalLayout } from './layoutGenerator';

export const AI_ARCHITECT_SYSTEM_PROMPT = `Voce e um arquiteto de eventos e designer de ambientes 3D.

TAREFA: Analise o croqui/imagem e o briefing e retorne APENAS um JSON EventWorldLayout valido.

REGRAS OBRIGATORIAS:
- Palco: minimo 4m de profundidade, 1m de altura, centralizado, com 3m de recuo de seguranca.
- VIP: 15% da capacidade total, elevado 0,3m, com visao desobstruida e acesso controlado.
- WC: 1 unidade a cada 50 pessoas, minimo 2m de corredor, longe do palco.
- Pista: 0,5m2 por pessoa em pe, corredor principal de 2,5m ate a saida.
- Bar: lateral da pista, nunca bloqueando visao do palco.
- Circulacao: todos os pontos devem ter 2 rotas de fuga, corredores >= 1,2m.
- Escala: 1 unidade Three.js = 1 metro real.
- A imagem e referencia de estilo e organizacao visual, nao deve virar geometria deformada.

Retorne apenas JSON, sem explicacoes.`;

export const buildArchitectPrompt = (brief: EventBrief) => `${AI_ARCHITECT_SYSTEM_PROMPT}

BRIEFING:
${JSON.stringify(brief, null, 2)}

SCHEMA:
EventWorldLayout {
  metadata: { venueName, totalArea_m2, capacity, eventType, styleReference },
  venue: { width_m, depth_m, height_m, shape },
  zones: Zone[]
}`;

export const createLocalArchitectLayout = (brief: EventBrief): EventWorldLayout => {
  return generateArchitecturalLayout(brief);
};
