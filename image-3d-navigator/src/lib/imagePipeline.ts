export type ImageQualityReport = {
  brightness: number;
  contrast: number;
  sharpness: number;
  score: number;
  issues: string[];
  recommendations: string[];
};

export type LoadedImage = {
  image: HTMLImageElement;
  objectUrl: string;
  dataUrl: string;
  report: ImageQualityReport;
};

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MAX_IMAGE_SIDE = 4096;
const ANALYSIS_SIZE = 256;

const supportedSignatures = [
  { mime: 'image/jpeg', test: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', test: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: 'image/webp', test: (b: Uint8Array) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
];

export const validateImageFile = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    return 'Envie um arquivo de imagem valido.';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'A imagem precisa ter no maximo 12 MB para este MVP.';
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const detected = supportedSignatures.find((signature) => signature.test(bytes));

  if (!detected) {
    return 'Use uma imagem JPG, PNG ou WebP valida.';
  }

  return null;
};

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Nao foi possivel preparar a imagem no navegador.');
  }

  return { canvas, ctx };
};

export const imageToDataUrl = (image: HTMLImageElement) => {
  const { canvas, ctx } = createCanvas(image.naturalWidth, image.naturalHeight);
  ctx.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
};

export const createApproximateDepthMap = (image: HTMLImageElement) => {
  const { canvas, ctx } = createCanvas(image.naturalWidth, image.naturalHeight);
  ctx.drawImage(image, 0, 0);
  const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
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

export const analyzeImageQuality = (image: HTMLImageElement): ImageQualityReport => {
  const aspect = image.naturalWidth / image.naturalHeight;
  const width = aspect >= 1 ? ANALYSIS_SIZE : Math.max(1, Math.round(ANALYSIS_SIZE * aspect));
  const height = aspect >= 1 ? Math.max(1, Math.round(ANALYSIS_SIZE / aspect)) : ANALYSIS_SIZE;
  const { ctx } = createCanvas(width, height);
  ctx.drawImage(image, 0, 0, width, height);

  const pixels = ctx.getImageData(0, 0, width, height).data;
  const luminance = new Float32Array(width * height);
  let sum = 0;

  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const value = (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) / 255;
    luminance[p] = value;
    sum += value;
  }

  const brightness = sum / luminance.length;
  let variance = 0;

  for (let i = 0; i < luminance.length; i += 1) {
    variance += (luminance[i] - brightness) ** 2;
  }

  const contrast = Math.sqrt(variance / luminance.length);
  let edgeEnergy = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const center = luminance[y * width + x];
      edgeEnergy += Math.abs(center - luminance[y * width + x - 1]);
      edgeEnergy += Math.abs(center - luminance[(y - 1) * width + x]);
    }
  }

  const sharpness = Math.min(1, edgeEnergy / (width * height * 0.18));
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (brightness < 0.18) {
    issues.push('Imagem escura');
    recommendations.push('Use uma foto com mais luz ou aumente a exposicao.');
  }

  if (brightness > 0.88) {
    issues.push('Imagem muito clara');
    recommendations.push('Evite fotos estouradas, porque o mapa de profundidade perde detalhes.');
  }

  if (contrast < 0.12) {
    issues.push('Baixo contraste');
    recommendations.push('Fotos com bordas, moveis e planos bem definidos geram mundos melhores.');
  }

  if (sharpness < 0.2) {
    issues.push('Pouca nitidez');
    recommendations.push('Evite imagens borradas ou muito comprimidas.');
  }

  const score = Math.max(
    0,
    Math.min(100, Math.round((brightness > 0.18 && brightness < 0.88 ? 35 : 16) + contrast * 160 + sharpness * 35))
  );

  return {
    brightness: Math.round(brightness * 100),
    contrast: Math.round(contrast * 100),
    sharpness: Math.round(sharpness * 100),
    score,
    issues,
    recommendations,
  };
};

export const loadImageFile = async (file: File): Promise<LoadedImage> => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = objectUrl;

  try {
    await image.decode();

    if (image.naturalWidth > MAX_IMAGE_SIDE || image.naturalHeight > MAX_IMAGE_SIDE) {
      throw new Error('A imagem precisa ter no maximo 4096 px em cada lado.');
    }

    const report = analyzeImageQuality(image);
    const dataUrl = imageToDataUrl(image);

    return { image, objectUrl, dataUrl, report };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
};
