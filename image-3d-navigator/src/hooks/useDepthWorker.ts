import { useCallback, useEffect, useRef, useState } from 'react';

type DepthWorkerState = {
  ready: boolean;
  progress: number;
  status: string;
  error: string | null;
};

type DepthResult = {
  depth: ImageData;
};

type WorkerMessage =
  | { type: 'progress'; data?: { progress?: number; file?: string; status?: string } }
  | { type: 'stage'; status: string }
  | { type: 'ready'; id: string }
  | { type: 'result'; id: string; depth: ImageData }
  | { type: 'error'; id?: string; message: string };

const createRequestId = () => crypto.randomUUID();

export function useDepthWorker() {
  const workerRef = useRef<Worker | null>(null);
  const readyResolverRef = useRef<(() => void) | null>(null);
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const pendingResolveRef = useRef<((value: DepthResult) => void) | null>(null);
  const pendingRejectRef = useRef<((reason?: unknown) => void) | null>(null);

  const [state, setState] = useState<DepthWorkerState>({
    ready: false,
    progress: 0,
    status: 'Aguardando...',
    error: null,
  });

  useEffect(() => {
    const worker = new Worker(new URL('../workers/depthWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      if (message.type === 'progress') {
        setState((prev) => ({
          ...prev,
          progress: Math.round(message.data?.progress ?? prev.progress),
          status: 'Baixando IA...',
        }));
        return;
      }

      if (message.type === 'stage') {
        setState((prev) => ({ ...prev, status: message.status }));
        return;
      }

      if (message.type === 'ready') {
        setState((prev) => ({
          ...prev,
          ready: true,
          status: 'IA pronta',
          progress: Math.max(prev.progress, 60),
        }));
        readyResolverRef.current?.();
        return;
      }

      if (message.type === 'result') {
        setState((prev) => ({ ...prev, status: 'Cena pronta', progress: 100 }));
        pendingResolveRef.current?.({ depth: message.depth });
        pendingResolveRef.current = null;
        pendingRejectRef.current = null;
        return;
      }

      if (message.type === 'error') {
        setState((prev) => ({
          ...prev,
          error: message.message,
          status: 'Erro no worker',
        }));
        pendingRejectRef.current?.(new Error(message.message));
        pendingResolveRef.current = null;
        pendingRejectRef.current = null;
      }
    };

    worker.onerror = (event) => {
      const message = event.message || 'Erro no worker';
      setState((prev) => ({ ...prev, error: message, status: message }));
      pendingRejectRef.current?.(new Error(message));
      pendingResolveRef.current = null;
      pendingRejectRef.current = null;
    };

    readyPromiseRef.current = new Promise((resolve) => {
      readyResolverRef.current = resolve;
    });

    worker.postMessage({ type: 'init', id: createRequestId() });
    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
      readyResolverRef.current = null;
      readyPromiseRef.current = null;
    };
  }, []);

  const waitForReady = useCallback(async () => {
    if (state.ready) return;
    await readyPromiseRef.current;
  }, [state.ready]);

  const processDataUrl = useCallback(async (imageData: string) => {
    if (!workerRef.current) {
      throw new Error('Worker nao foi inicializado');
    }

    await waitForReady();

    setState((prev) => ({
      ...prev,
      status: 'Processando imagem...',
      progress: Math.max(prev.progress, 70),
      error: null,
    }));

    return new Promise<DepthResult>((resolve, reject) => {
      pendingResolveRef.current = resolve;
      pendingRejectRef.current = reject;
      workerRef.current?.postMessage({
        type: 'process',
        id: createRequestId(),
        imageData,
      });
    });
  }, [waitForReady]);

  return {
    ...state,
    processDataUrl,
  };
}
