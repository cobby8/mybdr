import { getTournamentWorkspaceProps } from "../_components/tournament-detail-data";
import { TournamentWorkspace } from "../_components/TournamentWorkspace";

export const dynamic = "force-dynamic";

export default async function TournamentAdminEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const props = await getTournamentWorkspaceProps(id, `/tournament-admin/tournaments/${id}/edit`);

  return (
    <div data-skin="toss">
      <TournamentWorkspace {...props} />
    </div>
  );
}
