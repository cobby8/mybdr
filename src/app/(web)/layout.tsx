import { Header } from "@/components/shared/header";
import { Footer } from "@/components/layout/Footer";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferFilterProvider } from "@/contexts/prefer-filter-context";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      {/* PreferFilterProvider: 전역 선호 필터 상태를 (web) 레이아웃 전체에 공유 */}
      <PreferFilterProvider>
        <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
          <Header />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 lg:pb-6">
            {children}
          </main>
          <div className="footer-mobile-space">
            <Footer />
          </div>
        </div>
      </PreferFilterProvider>
    </SWRProvider>
  );
}
