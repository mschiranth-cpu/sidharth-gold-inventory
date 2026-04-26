/**
 * Resize + crop an image File to a square JPEG data URL.
 * Used for profile avatars to keep payload tiny (~25–60 KB at 256x256/0.85).
 */
export interface ResizeOptions {
  /** Final square size in CSS pixels. Defaults to 256. */
  size?: number;
  /** JPEG quality 0–1. Defaults to 0.85. */
  quality?: number;
}

export async function resizeImageToDataUrl(
  file: File,
  opts: ResizeOptions = {},
): Promise<string> {
  const size = opts.size ?? 256;
  const quality = opts.quality ?? 0.85;

  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image');
  }

  // Read into HTMLImageElement
  const dataUrl: string = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error('Failed to read image file'));
    fr.readAsDataURL(file);
  });

  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Failed to decode image'));
    i.src = dataUrl;
  });

  // Center-crop to square
  const minDim = Math.min(img.width, img.height);
  const sx = (img.width - minDim) / 2;
  const sy = (img.height - minDim) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

  return canvas.toDataURL('image/jpeg', quality);
}
