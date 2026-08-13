export type Size = { width: number; height: number };

/** 비율 유지, 긴 변이 max를 초과할 때만 축소(확대 금지). 결과는 정수. */
export function computeTargetSize(width: number, height: number, max: number): Size {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** 이미지 File을 WebP Blob으로 압축. 긴 변 max까지 축소(확대 금지). 브라우저 전용. */
export async function compressToWebp(file: File, max = 1200, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = computeTargetSize(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 컨텍스트를 생성할 수 없습니다.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality)
  );
  if (!blob) throw new Error('이미지 압축에 실패했습니다.');
  return blob;
}
