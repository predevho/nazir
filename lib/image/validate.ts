/**
 * 업로드 입력 검사.
 *
 * 업로드 파이프라인은 이미 브라우저에서 WebP · 긴 변 1200px로 다시 인코딩하므로
 * (`compressToWebp`) 원본이 그대로 저장되지는 않는다. 다만 그 앞단이 비어 있어서
 * 아래 경우에 브라우저가 멈추거나 알 수 없는 오류로 끝난다.
 *
 * - 수십 MB짜리 원본을 `createImageBitmap`에 그대로 넘김
 * - 1억 픽셀짜리 이미지를 canvas에 그리다 메모리 초과
 * - 이 브라우저가 못 여는 형식(맥 크롬의 HEIC 등)을 만나 디코딩 실패
 */

/** 휴대폰 사진이 보통 3~8MB라 넉넉히 잡되, 원본 RAW·스캔본은 막는다. */
export const MAX_INPUT_BYTES = 15 * 1024 * 1024;

/** canvas가 감당할 만한 상한. 8000×6000 = 4800만 화소 정도까지 허용한다. */
export const MAX_INPUT_PIXELS = 50_000_000;

/** 압축 결과가 이보다 크면 품질을 낮춰 다시 인코딩한다. */
export const MAX_OUTPUT_BYTES = 1024 * 1024;

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

export type FileCheck = { ok: true } | { ok: false; message: string };

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

/** 파일을 열기 전에 형식·용량만 본다. 픽셀 수는 디코딩 후에야 알 수 있다. */
export function checkImageFile(file: { type: string; size: number }): FileCheck {
  if (!ALLOWED.includes(file.type)) {
    // image/* 로 통과시키면 SVG처럼 canvas 결과가 브라우저마다 다른 형식까지 들어온다.
    return {
      ok: false,
      message: 'JPG · PNG · WebP · GIF 파일만 올릴 수 있습니다.',
    };
  }
  if (file.size > MAX_INPUT_BYTES) {
    return {
      ok: false,
      message: `파일이 너무 큽니다 (${mb(file.size)}). ${mb(MAX_INPUT_BYTES)} 이하로 줄여서 올려주세요.`,
    };
  }
  return { ok: true };
}

/** 디코딩한 뒤 화소 수를 본다. */
export function checkImageSize(width: number, height: number): FileCheck {
  if (width * height > MAX_INPUT_PIXELS) {
    return {
      ok: false,
      message: `이미지 해상도가 너무 큽니다 (${width}×${height}). 크기를 줄여서 올려주세요.`,
    };
  }
  return { ok: true };
}

/** 디코딩 실패를 사용자가 이해할 수 있는 말로 바꾼다. HEIC가 대부분이다. */
export function decodeErrorMessage(fileType: string): string {
  if (fileType === 'image/heic' || fileType === 'image/heif') {
    return '이 브라우저에서는 HEIC 사진을 열 수 없습니다. JPG나 PNG로 바꿔서 올려주세요.';
  }
  return '이미지를 읽지 못했습니다. 다른 파일로 시도해 주세요.';
}
