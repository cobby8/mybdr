"use client";

/**
 * 대회 요강 업로드 드롭존 (Phase 3 박제 2026-05-20).
 *
 * drag&drop + 파일 선택 + 클라이언트 사전 검증 (MIME / 크기). 서버 magic bytes 재검증은 별도.
 *
 * 박제 룰 (시안 13룰):
 * - Material Symbols Outlined (lucide-react ❌)
 * - var(--color-*) 토큰만 / 핑크·살몬·코랄 ❌
 * - rounded-[4px] 버튼 / pill 9999px ❌
 * - 720px 분기 / iOS input 16px / 버튼 44px
 * - placeholder 5단어 이내
 *
 * Props:
 * - onFile: 검증 통과한 File 전달
 * - disabled: 분석 진행 중 비활성화
 */

import { useRef, useState } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ["application/pdf", "image/png", "image/jpeg"] as const;
const ACCEPT_ATTR = ".pdf,.png,.jpg,.jpeg";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function ProspectusUploadDropzone({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(file: File): string | null {
    if (file.size > MAX_FILE_SIZE) return "파일 크기 10MB 초과";
    if (
      file.type !== "" &&
      !ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])
    ) {
      return "PDF / PNG / JPEG 만 가능";
    }
    return null;
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled) return;
    setDragOver(true);
  }

  function handleClick() {
    if (disabled) return;
    inputRef.current?.click();
  }

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        className={`
          flex min-h-[200px] cursor-pointer flex-col items-center justify-center
          rounded-[4px] border-2 border-dashed p-8 text-center transition-colors
          ${
            dragOver
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]"
          }
          ${disabled ? "pointer-events-none opacity-50" : ""}
        `}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="대회 요강 업로드"
      >
        <span
          className="material-symbols-outlined text-5xl text-[var(--color-text-muted)]"
          aria-hidden
        >
          upload_file
        </span>
        <p className="mt-3 text-base font-medium text-[var(--color-text-primary)]">
          요강 파일을 끌어다 놓으세요
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          또는 클릭하여 선택 (PDF / 이미지 / 10MB 이내)
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
