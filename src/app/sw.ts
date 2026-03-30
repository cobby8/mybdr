import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, CacheFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// sw.ts는 webpack이 SW 컨텍스트로 컴파일 — ServiceWorkerGlobalScope 타입은 lib.webworker.d.ts에 있음
// 타입스크립트 일반 컨텍스트에서는 WorkerGlobalScope로 대체
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const self: any;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 인증/로그아웃/OAuth 콜백 → 절대 캐시 금지 (Set-Cookie가 SW 캐시에서 strip됨)
    {
      matcher: /^\/api\/auth\//,
      handler: new NetworkOnly(),
    },
    // 인증/보안 웹 API → 절대 캐시 금지
    {
      matcher: /^\/api\/web\/auth\//,
      handler: new NetworkOnly(),
    },
    // 실시간 점수 → 절대 캐시 금지
    {
      matcher: /^\/api\/v1\/games\/live\//,
      handler: new NetworkOnly(),
    },
    // 일반 API → Network First (10초 타임아웃 → 캐시 폴백)
    {
      matcher: /^\/api\//,
      handler: new NetworkFirst({ networkTimeoutSeconds: 10 }),
    },
    // 이미지/정적 에셋 → Cache First (7일)
    {
      matcher: /\.(?:png|jpg|jpeg|webp|svg|ico)$/,
      handler: new CacheFirst({
        cacheName: "images",
        plugins: [],
      }),
    },
    // 나머지 → defaultCache (Next.js 정적 에셋 포함)
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// ─────────────────────────────────────────────────────────────
// 웹 푸시 알림 핸들러
// ─────────────────────────────────────────────────────────────

// push 이벤트: 서버에서 보낸 푸시 메시지를 받아 시스템 알림으로 표시
self.addEventListener("push", (event: { data?: { json(): unknown; text(): string }; waitUntil(p: Promise<unknown>): void }) => {
  // 페이로드가 없으면 무시
  if (!event.data) return;

  // 서버에서 보낸 JSON 파싱 (title, body, url, icon)
  const data = event.data.json() as {
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
  };

  const title = data.title ?? "MyBDR";
  const options: NotificationOptions & { data?: { url: string } } = {
    body: data.body ?? "",
    icon: data.icon ?? "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    // data에 url을 저장해두면 notificationclick에서 꺼내 쓸 수 있다
    data: { url: data.url ?? "/notifications" },
  };

  // waitUntil: 알림이 표시될 때까지 SW가 종료되지 않도록 보장
  event.waitUntil(self.registration.showNotification(title, options));
});

// notificationclick 이벤트: 알림을 클릭하면 해당 URL로 이동
self.addEventListener("notificationclick", (event: { notification: Notification & { data?: { url?: string } }; waitUntil(p: Promise<unknown>): void }) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/notifications";

  // 이미 열린 탭이 있으면 그 탭으로 포커스, 없으면 새 탭 열기
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList: Array<{ url: string; focus(): Promise<unknown> }>) => {
        // 같은 origin의 탭이 있으면 그 탭에서 이동
        for (const client of clientList) {
          if (new URL(client.url).origin === self.location.origin) {
            return client.focus();
          }
        }
        // 열린 탭이 없으면 새 창 열기
        return self.clients.openWindow(targetUrl);
      }
    )
  );
});
