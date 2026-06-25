import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { RecordAppImpactPanel } from "./record-app-impact-panel";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    redirect("/admin");
  }

  return (
    <div data-skin="toss">
      <RecordAppImpactPanel />
    </div>
  );
}
