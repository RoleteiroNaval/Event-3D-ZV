import { useEffect, useRef, useState } from 'react';
import demoImageUrl from './assets/hero.png';
import EventBriefPanel from './components/EventBriefPanel';
import ThreeViewer from './components/ThreeViewer';
import type { ImageQualityReport } from './lib/imagePipeline';
import { createApproximateDepthMap, loadImageFile, validateImageFile } from './lib/imagePipeline';
import type { EventBrief } from './types/event';
import { defaultEventBrief } from './types/event';

type WorkerMessage =
  | { type: 'progress'; data?: { progress?: number; file?: string; status?: string } }
  | { type: 'stage'; status: string }
  | { type: 'ready'; id: string }
  | { type: 'result'; id: string; depth: ImageData }
  | { type: 'error'; id?: string; message: string };

type ProcessingStage = 'idle' | 'loading-image' | 'loading-ai' | 'depth' | 'world' | 'done' | 'error';

const READY_TIMEOUT_MS = 12_000;
const PROCESSING_FALLBACK_MS = 32_000;

const stageLabels: Record<ProcessingStage, string> = {
  idle: 'Aguardando imagem',
  'loading-image': 'Lendo imagem',
  'loading-ai': 'Carregando IA',
  depth: 'Estimando profundidade',
  world: 'Construindo mundo 3D',
  done: 'Cena pronta',
  error: 'Erro',
};

export default function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [depth, setDepth] = useState<ImageData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageReport, setImageReport] = useState<ImageQualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [status, setStatus] = useState('Aguardando imagem...');
  const [error, setError] = useState<string | null>(null);
  const [eventBrief, setEventBrief] = useState<EventBrief>(defaultEventBrief);
  const workerRef = useRef<Worker | null>(null);
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const readyResolveRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeRequestRef = useRef<string | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  const waitForReadyOrContinue = (ready: Promise<void>) => (
    Promise.race([
      ready,
      new Promise<void>((resolve) => {
        setTimeout(resolve, READY_TIMEOUT_MS);
      }),
    ])
  );

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const initWorker = () => {
    if (workerRef.current && readyPromiseRef.current) {
      return { worker: workerRef.current, ready: readyPromiseRef.current };
    }

    const worker = new Worker(new URL('./workers/depthWorker.ts', import.meta.url), {
      type: 'module',
    });

    const ready = new Promise<void>((resolve) => {
      readyResolveRef.current = resolve;
    });

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      if (message.type === 'progress') {
        const rawProgress = message.data?.progress ?? 0;
        const progressValue = Math.max(12, Math.min(58, Math.round(rawProgress)));
        setProgress(progressValue);
        setStage('loading-ai');

        if (message.data?.status === 'progress') {
          setStatus(`Baixando IA${message.data.file ? `: ${message.data.file}` : ''} (${progressValue}%)`);
        }
        return;
      }

      if (message.type === 'stage') {
        setStage('depth');
        setStatus(message.status);
        setProgress((current) => Math.max(current, 70));
        return;
      }

      if (message.type === 'ready') {
        setStage('depth');
        setStatus('IA pronta. Analisando profundidade...');
        setProgress((current) => Math.max(current, 62));
        readyResolveRef.current?.();
        return;
      }

      if (message.type === 'result') {
        if (activeRequestRef.current && message.id !== activeRequestRef.current) return;
        if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
        setStage('world');
        setStatus('Construindo mundo 3D navegavel...');
        setProgress(92);

        requestAnimationFrame(() => {
          setDepth(message.depth);
          setStage('done');
          setStatus('Cena pronta.');
          setProgress(100);
          setLoading(false);
        });
        return;
      }

      if (message.type === 'error') {
        if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
        setError(message.message);
        setStage('error');
        setStatus('Falha no processamento.');
        setLoading(false);
      }
    };

    worker.onerror = () => {
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
      setError('O worker de IA encontrou uma falha inesperada.');
      setStage('error');
      setLoading(false);
    };

    worker.postMessage({ type: 'init', id: 'init' });
    workerRef.current = worker;
    readyPromiseRef.current = ready;

    return { worker, ready };
  };

  const handleFile = async (file: File) => {
    const validationError = await validateImageFile(file);
    if (validationError) {
      setError(validationError);
      setStage('error');
      return;
    }

    setLoading(true);
    setError(null);
    setDepth(null);
    setImageReport(null);
    setProgress(6);
    setStage('loading-image');
    setStatus('Carregando e analisando imagem...');

    try {
      if (imageUrl) URL.revokeObjectURL(imageUrl);

      const loaded = await loadImageFile(file);
      setImage(loaded.image);
      setImageUrl(loaded.objectUrl);
      setImageReport(loaded.report);

      setStage('loading-ai');
      setStatus('Iniciando IA local...');
      setProgress(16);

      const { worker, ready } = initWorker();
      await waitForReadyOrContinue(ready);

      setStage('depth');
      setStatus('Enviando imagem para o modelo de profundidade...');
      setProgress(72);

      const requestId = crypto.randomUUID();
      activeRequestRef.current = requestId;

      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = window.setTimeout(() => {
        if (activeRequestRef.current !== requestId) return;

        setStage('world');
        setStatus('IA demorou. Usando profundidade rapida para criar o mundo 3D...');
        setProgress(94);
        setDepth(createApproximateDepthMap(loaded.image));
        setStage('done');
        setStatus('Cena pronta com profundidade rapida.');
        setProgress(100);
        setLoading(false);
      }, PROCESSING_FALLBACK_MS);

      worker.postMessage({
        type: 'process',
        id: requestId,
        imageData: loaded.dataUrl,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nao foi possivel processar a imagem.');
      setStage('error');
      setLoading(false);
    }
  };

  const handleDemoImage = async () => {
    try {
      const response = await fetch(demoImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'demo-image-3d.png', { type: blob.type || 'image/png' });
      await handleFile(file);
    } catch {
      setError('Nao foi possivel carregar a imagem demo.');
      setStage('error');
    }
  };

  const resetScene = () => {
    setDepth(null);
    setImage(null);
    setImageReport(null);
    setProgress(0);
    setStage('idle');
    setStatus('Aguardando imagem...');
    setError(null);
    activeRequestRef.current = null;

    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (image && depth && !loading) {
    return (
      <ThreeViewer
        image={image}
        depthData={depth}
        imageReport={imageReport}
        eventBrief={eventBrief}
        onReset={resetScene}
      />
    );
  }

  return (
    <main className="app-shell">
      <div className="upload-wrap">
        <div className="app-title">
          <span className="app-kicker">MVP local de mundo 3D</span>
          <h1>Image to 3D</h1>
          <p>Transforme uma foto em um ambiente navegavel com IA no navegador.</p>
        </div>

        <EventBriefPanel value={eventBrief} onChange={setEventBrief} />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            event.currentTarget.classList.add('border-violet-500');
          }}
          onDragLeave={(event) => {
            event.currentTarget.classList.remove('border-violet-500');
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.currentTarget.classList.remove('border-violet-500');
            const file = event.dataTransfer.files[0];
            if (file) void handleFile(file);
          }}
          className="drop-zone"
        >
          <div className="drop-icon" aria-hidden="true">3D</div>
          <p className="drop-title">Arraste uma imagem de ambiente</p>
          <p className="drop-subtitle">Interiores, ruas, paisagens e fotos com planos de profundidade funcionam melhor.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            className="demo-button"
            onClick={(event) => {
              event.stopPropagation();
              void handleDemoImage();
            }}
          >
            Testar com imagem demo
          </button>
        </div>

        {(loading || error || imageReport) && (
          <section className="process-panel">
            {loading && (
              <>
                <div className="process-status">
                  <div className="spinner" />
                  <span>{status}</span>
                </div>
                <div className="pipeline-steps">
                  {(['loading-image', 'loading-ai', 'depth', 'world'] as ProcessingStage[]).map((item) => (
                    <span key={item} className={stage === item ? 'is-active' : ''}>
                      {stageLabels[item]}
                    </span>
                  ))}
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="process-note">
                  A primeira execucao baixa o modelo de IA. Depois o navegador usa cache local.
                </p>
              </>
            )}

            {imageReport && (
              <div className="quality-report">
                <div>
                  <strong>Score da imagem</strong>
                  <span>{imageReport.score}/100</span>
                </div>
                <div>
                  <strong>Luz</strong>
                  <span>{imageReport.brightness}%</span>
                </div>
                <div>
                  <strong>Contraste</strong>
                  <span>{imageReport.contrast}%</span>
                </div>
                <div>
                  <strong>Nitidez</strong>
                  <span>{imageReport.sharpness}%</span>
                </div>
              </div>
            )}

            {imageReport && imageReport.recommendations.length > 0 && (
              <p className="process-note">{imageReport.recommendations[0]}</p>
            )}

            {error && (
              <div className="error-message">
                <strong>Erro:</strong> {error}
              </div>
            )}
          </section>
        )}

        <div className="feature-grid">
          {[
            { icon: 'AI', label: 'Profundidade', sub: 'Depth Anything' },
            { icon: '3D', label: 'Mundo gerado', sub: 'Malha + textura' },
            { icon: 'GLB', label: 'Exportavel', sub: 'Padrao 3D' },
          ].map((item) => (
            <div key={item.label} className="feature-card">
              <div className="feature-icon">{item.icon}</div>
              <div className="feature-label">{item.label}</div>
              <div className="feature-sub">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
