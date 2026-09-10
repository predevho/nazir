'use client';
import { useRef, useState } from 'react';
import { compressToWebp } from '@/lib/image/resize';
import { checkImageFile, MAX_INPUT_BYTES } from '@/lib/image/validate';
import { uploadEntityPhoto, removeEntityPhoto, type PhotoKind } from '@/lib/image/upload';

type Props = {
  kind: PhotoKind;
  id: string;
  value: string;
  onChange: (url: string) => void;
};

export function PhotoField({ kind, id, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setError('');
    const check = checkImageFile(file);
    if (!check.ok) {
      setError(check.message);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setBusy(true);
    try {
      const blob = await compressToWebp(file);
      const url = await uploadEntityPhoto(kind, id, blob);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    setError('');
    setBusy(true);
    try {
      await removeEntityPhoto(kind, id);
    } catch {
      setError('Storage 파일 삭제에 실패했지만 사진 연결은 해제했습니다.');
    } finally {
      onChange('');
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-20 h-20 shrink-0 rounded-sm overflow-hidden bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
        {value ? (
          <img src={value} alt="미리보기" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[11px] text-ds-text/40">사진 없음</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="text-[12px] text-ds-text/70 file:mr-2 file:min-h-[32px] file:px-3 file:border file:border-ds-key2/30 file:bg-transparent file:text-ds-key2 file:rounded-sm file:text-[12px] file:cursor-pointer"
        />
        <div className="flex items-center gap-2">
          {busy && <span className="text-[11px] text-ds-text/50">처리 중…</span>}
          {value && !busy && (
            <button type="button" onClick={handleRemove} className="text-[12px] text-red-400/80 hover:text-red-400">
              사진 제거
            </button>
          )}
        </div>
        <span className="text-[11px] text-ds-text/40">
          JPG · PNG · WebP · GIF, {Math.round(MAX_INPUT_BYTES / 1024 / 1024)}MB 이하.
          올리면 자동으로 가로세로 1200px WebP로 줄여 저장합니다.
        </span>
        {error && <span className="text-[11px] text-red-400">{error}</span>}
      </div>
    </div>
  );
}
