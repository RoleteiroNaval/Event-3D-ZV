import { env, pipeline } from '@xenova/transformers';

type WorkerRequest =
  | { type: 'init'; id: string }
  | { type: 'process'; id: string; imageData: string };

type ProgressPayload = {
  status?: string;
  progress?: number;
  file?: string;
};

type DepthResult = {
  depth: {
    toCanvas: () => OffscreenCanvas;
  };
};

type DepthEstimator = (image: string) => Promise<DepthResult>;

env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_TIMEOUT_MS = 35_000;

let estimatorPromise: Promise<DepthEstimator> | null = null;

const postProgress = (data: ProgressPayload) => {
  self.postMessage({ type: 'progress', data });
};

const getEstimator = () => {
  estimatorPromise ??= pipeline(
    'depth-estimation',
    'Xenova/depth-anything-small-hf',
    { progress_callback: postProgress }
  ) as unknown as Promise<DepthEstimator>;

  return estimatorPromise;
};

const wait = (ms: number) => new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error('Tempo limite da IA atingido. Usando profundidade rapida.')), ms);
});

const dataURLToBlob = (dataURL: string) => {
  const [meta, b64] = dataURL.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/png';
  const bytes = atob(b64);
  const buffer = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i);
  }

  return new Blob([buffer], { type: mime });
};

const dataURLToImageData = async (dataURL: string) => {
  const bitmap = await createImageBitmap(dataURLToBlob(dataURL));
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Nao foi possivel preparar a imagem para fallback.');
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const createFallbackDepth = (source: ImageData) => {
  const output = new ImageData(source.width, source.height);
  const centerX = source.width / 2;
  const centerY = source.height / 2;
  const maxDistance = Math.hypot(centerX, centerY);

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const index = (y * source.width + x) * 4;
      const luminance = (0.2126 * source.data[index] + 0.7152 * source.data[index + 1] + 0.0722 * source.data[index + 2]) / 255;
      const vertical = y / source.height;
      const radial = 1 - Math.hypot(x - centerX, y - centerY) / maxDistance;
      const depth = Math.max(0, Math.min(1, 0.22 + vertical * 0.42 + radial * 0.22 + luminance * 0.14));
      const value = Math.round(depth * 255);

      output.data[index] = value;
      output.data[index + 1] = value;
      output.data[index + 2] = value;
      output.data[index + 3] = 255;
    }
  }

  return output;
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type } = event.data;

  try {
    if (type === 'init') {
      await getEstimator();
      self.postMessage({ type: 'ready', id });
      return;
    }

    if (type === 'process') {
      self.postMessage({ type: 'stage', status: 'Gerando mapa de profundidade...' });

      try {
        const estimator = await Promise.race([getEstimator(), wait(MODEL_TIMEOUT_MS)]);
        const result = await estimator(event.data.imageData);
        const canvas = result.depth.toCanvas();
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Nao foi possivel ler o mapa de profundidade.');
        }

        const depth = ctx.getImageData(0, 0, canvas.width, canvas.height);
        self.postMessage({ type: 'result', id, depth });
      } catch {
        self.postMessage({ type: 'stage', status: 'IA demorou. Gerando profundidade rapida...' });
        const source = await dataURLToImageData(event.data.imageData);
        const depth = createFallbackDepth(source);
        self.postMessage({ type: 'result', id, depth });
      }
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      message: error instanceof Error ? error.message : 'Erro inesperado no worker de IA.',
    });
  }
};
