import { redirect } from "next/navigation";

export default function TournamentAdminIndexPage() {
  redirect("/tournament-admin/tournaments");
}
