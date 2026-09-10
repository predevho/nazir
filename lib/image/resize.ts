import {
  checkImageSize,
  decodeErrorMessage,
  MAX_OUTPUT_BYTES,
} from './validate';

export type Size = { width: number; height: number };

/** 비율 유지, 긴 변이 max를 초과할 때만 축소(확대 금지). 결과는 정수. */
export function computeTargetSize(width: number, height: number, max: number): Size {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * 이미지 File을 WebP Blob으로 압축. 긴 변 max까지 축소(확대 금지). 브라우저 전용.
 *
 * 결과가 MAX_OUTPUT_BYTES 를 넘으면 품질을 낮춰 한 번 더 시도한다. 사진이 아니라
 * 노이즈가 많은 스캔본이면 0.85로도 1MB를 넘길 수 있다.
 */
export async function compressToWebp(file: File, max = 1200, quality = 0.85): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(decodeErrorMessage(file.type));
  }

  const sizeCheck = checkImageSize(bitmap.width, bitmap.height);
  if (!sizeCheck.ok) {
    bitmap.close?.();
    throw new Error(sizeCheck.message);
  }

  const { width, height } = computeTargetSize(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close?.();
    throw new Error('canvas 컨텍스트를 생성할 수 없습니다.');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const encode = (q: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', q));

  let blob = await encode(quality);
  if (blob && blob.size > MAX_OUTPUT_BYTES) {
    const retry = await encode(0.7);
    if (retry) blob = retry;
  }
  if (!blob) throw new Error('이미지 압축에 실패했습니다.');
  return blob;
}
