"use client";

/**
 * 오프라인 폴백 페이지 (~offline)
 *
 * PWA에서 네트워크가 끊겼을 때 서비스워커가 이 페이지를 보여준다.
 * BDR 로고 + 안내 메시지 + 재시도 버튼으로 구성.
 */

import Image from "next/image";

export default function OfflinePage() {
  // 브라우저 새로고침으로 재연결 시도
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      {/* BDR 로고 */}
      <div className="mb-8">
        <Image
          src="/images/logo.png"
          alt="BDR"
          width={120}
          height={36}
          className="h-9 w-auto"
          priority
        />
      </div>

      {/* 오프라인 아이콘 */}
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "40px", color: "var(--color-text-muted)" }}
        >
          wifi_off
        </span>
      </div>

      {/* 안내 메시지 */}
      <h1
        className="mb-2 text-xl font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        인터넷 연결 없음
      </h1>
      <p
        className="mb-8 max-w-[320px] text-sm leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        네트워크에 연결할 수 없습니다.
        <br />
        Wi-Fi 또는 모바일 데이터를 확인한 후 다시 시도해 주세요.
      </p>

      {/* 재시도 버튼 */}
      <button
        onClick={handleRetry}
        className="flex items-center gap-2 rounded px-6 py-3 text-sm font-bold transition-colors"
        style={{
          backgroundColor: "var(--color-primary)",
          color: "var(--color-text-on-primary)",
        }}
      >
        <span className="material-symbols-outlined text-lg">refresh</span>
        다시 시도
      </button>
    </div>
  );
}
