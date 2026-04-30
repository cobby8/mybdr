// 시안 출처: Dev/design/BDR v2/screens/CreateTeam.jsx
// - server wrapper: 세션 체크 → 클라이언트 폼(NewTeamForm)으로 위임
// - v2 박제 본체는 ./new-team-form.tsx → ./_v2/team-form.tsx (4스텝 stepper + B옵션 영문 팀명 보존)
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { NewTeamForm } from "./new-team-form";

// SEO: 팀 생성 페이지 메타데이터
export const metadata: Metadata = {
  title: "팀 만들기 | MyBDR",
  description: "나만의 농구 팀을 만들고 팀원을 모집하세요.",
};

export default async function NewTeamPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  return <NewTeamForm />;
}
