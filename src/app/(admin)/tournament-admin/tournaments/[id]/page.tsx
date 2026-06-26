import { getTournamentWorkspaceProps } from "./_components/tournament-detail-data";
import { OperateWorkspace } from "./_components/OperateWorkspace";

export const dynamic = "force-dynamic";

export default async function TournamentAdminOperatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const props = await getTournamentWorkspaceProps(id);

  return (
    <div data-skin="toss">
      <OperateWorkspace {...props} />
    </div>
  );
}
