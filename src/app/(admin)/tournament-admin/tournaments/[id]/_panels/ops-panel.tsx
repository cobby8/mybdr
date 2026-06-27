"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Icon, SkelTable } from "@/components/admin-toss";
import type { RecordingMode } from "@/lib/tournaments/recording-mode";
import { RecordingModeTriggerClient } from "../_components/recording-mode-trigger";
import AdminsPanel from "./admins-panel";
import RecordersPanel from "./recorders-panel";
import "../matches/matches-admin.css";

type OpsPanelProps = {
  tournamentId: string;
  defaultMode: RecordingMode;
  matchStats: {
    total: number;
    paper: number;
    flutter: number;
    manual: number;
    inProgress: number;
  };
};

type AdminRow = { id: string; role: string };
type RecorderRow = { id: string; is_active: boolean };

const MODE_LABEL: Record<RecordingMode, string> = {
  flutter: "기록앱",
  paper: "전자기록지",
  manual: "수기",
};

export default function OpsPanel({ tournamentId, defaultMode, matchStats }: OpsPanelProps) {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [recorders, setRecorders] = useState<RecorderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [adminRes, recorderRes] = await Promise.all([
        fetch(`/api/web/tournaments/${tournamentId}/admins`),
        fetch(`/api/web/tournaments/${tournamentId}/recorders`),
      ]);
      if (adminRes.ok) setAdmins((await adminRes.json()) as AdminRow[]);
      if (recorderRes.ok) setRecorders((await recorderRes.json()) as RecorderRow[]);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeRecorderCount = useMemo(
    () => recorders.filter((recorder) => recorder.is_active).length,
    [recorders],
  );
  const adminCount = admins.length;

  return (
    <div className="op-ops-panel op-panel-flow">
      <div className="op-role-grid">
        <RoleMetric
          icon="shield"
          label="운영진"
          value={loading ? "-" : `${adminCount}명`}
          sub="권한 관리"
        />
        <RoleMetric
          icon="flag"
          label="심판"
          value="콘솔"
          sub="심판 관리자에서 배정"
        />
        <RoleMetric
          icon="pencil"
          label="기록원"
          value={loading ? "-" : `${activeRecorderCount}명`}
          sub="경기별 기록 배정"
        />
      </div>

      <section className="ts-card ts-card--flat op-ops-card">
        <div className="op-ops-head">
          <span className="ct-headicon"><Icon name="shield" size={18} /></span>
          <div>
            <h3>운영진</h3>
            <p>대회 운영 권한을 가진 관리자를 추가하거나 제거합니다.</p>
          </div>
        </div>
        {loading ? <SkelTable rows={3} /> : <AdminsPanel />}
      </section>

      <section className="ts-card ts-card--flat op-ops-card">
        <div className="op-ops-head">
          <span className="ct-headicon"><Icon name="pencil" size={18} /></span>
          <div>
            <h3>기록원</h3>
            <p>기록원을 지정하고 경기별 기록 담당자를 배정합니다.</p>
          </div>
        </div>
        {loading ? <SkelTable rows={4} /> : <RecordersPanel />}
      </section>

      <section className="ts-card ts-card--flat op-ops-card">
        <div className="op-ops-head op-ops-head--split">
          <div className="op-ops-head__main">
            <span className="ct-headicon"><Icon name="megaphone" size={18} /></span>
            <div>
              <h3>참가팀 공지사항</h3>
              <p>공지 저장 API가 연결되면 이 자리에서 참가팀 알림까지 운영합니다.</p>
            </div>
          </div>
          <Btn
            variant="secondary"
            size="sm"
            icon="globe"
            onClick={() => {
              window.history.replaceState(null, "", "#site");
              window.dispatchEvent(new HashChangeEvent("hashchange"));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            사이트 관리
          </Btn>
        </div>
        <textarea
          className="ts-textarea op-notice-textarea"
          value={notice}
          onChange={(event) => setNotice(event.target.value)}
          placeholder="예: 2일차 경기 시간이 변경되었습니다."
        />
        <label className="ct-checkrow op-ops-disabled">
          <input type="checkbox" checked disabled readOnly />
          <span>참가팀 즉시 발송은 공지 저장 API 연결 후 활성화</span>
        </label>
      </section>

      <section className="ts-card ts-card--flat op-ops-card">
        <div className="op-ops-head op-ops-head--split">
          <div className="op-ops-head__main">
            <span className="ct-headicon"><Icon name="sliders-horizontal" size={18} /></span>
            <div>
              <h3>경기 운영 · 기록 모드</h3>
              <p>
                대회 기본: <b>{MODE_LABEL[defaultMode]}</b> · 매치별 override 가능
              </p>
            </div>
          </div>
          <div className="op-recording-summary">
            <span>전체 {matchStats.total}경기</span>
            <span>진행중 {matchStats.inProgress}경기</span>
          </div>
        </div>
        <RecordingModeTriggerClient
          tournamentId={tournamentId}
          defaultMode={defaultMode}
          matchStats={matchStats}
        />
      </section>
    </div>
  );
}

function RoleMetric({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="ct-metric op-role-metric">
      <Icon name={icon} size={18} color="var(--primary)" />
      <div>
        <div className="ct-metric__lbl">{label}</div>
        <div className="ct-metric__val">{value}</div>
        <p>{sub}</p>
      </div>
    </div>
  );
}
