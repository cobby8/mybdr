import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mybdr.kr"),
  title: "MyBDR - Basketball Tournament Platform",
  description: "농구 경기와 대회를 쉽고 빠르게 찾고, 즐기세요",
  openGraph: {
    title: "MyBDR - Basketball Daily Routine",
    description: "농구 경기와 대회를 쉽고 빠르게 찾고, 즐기세요",
    images: [{ url: "/images/logo.png", width: 600, height: 600, alt: "BDR Logo" }],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: "MyBDR - Basketball Daily Routine",
    description: "농구 경기와 대회를 쉽고 빠르게 찾고, 즐기세요",
    images: ["/images/logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyBDR",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // iOS safe area 지원 (홈 인디케이터 영역)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
