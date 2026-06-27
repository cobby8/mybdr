// (admin-v2)/v2/page.tsx — 그린필드 셸 동작 확인용 플레이스홀더.
//   셸·인증·라우팅이 동작하는지 확인하는 임시 화면. M3 에서 실화면으로 교체.
import { PageHead } from "@/components/admin-v2/blocks/page-head";
import { Banner } from "@/components/admin-toss";

export default function AdminV2HomePage() {
  return (
    <div>
      <PageHead
        eyebrow="ADMIN V2"
        title="v2 그린필드 셸"
        sub="셸·인증·라우팅 동작 확인용 플레이스홀더입니다. (M3 대회관리자 파일럿에서 실화면으로 교체)"
      />
      <Banner
        tone="grey"
        icon="info"
        title="v2 그린필드 셸 OK"
        desc="(admin-v2)/v2 레이아웃의 인증·AdminShell·라우팅이 정상 동작합니다."
      />
    </div>
  );
}
