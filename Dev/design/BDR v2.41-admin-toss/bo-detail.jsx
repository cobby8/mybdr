/* global React, window */
// ============================================================
// bo-detail.jsx — 백오피스 Phase 2 전용 상세/처리 화면 (Batch 1: 비즈니스)
//   PaymentDetail(결제 상세 + 환불 처리) · PlanEditor(요금제 편집기)
//   같은 셸 안에서 목록 → 상세 전환. 상단 "← 목록" 으로 복귀.
//   모든 서버 호출은 mock 시연. toss-kit / admin-pages.css 재사용.
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, Toggle, Modal } = window;

  function Field({ k, children, mono }) {
    return (
      <div className="bo-field">
        <span className="bo-field__k">{k}</span>
        <span className="bo-field__v" style={mono ? { fontFamily: "var(--ff-mono)" } : null}>{children}</span>
      </div>
    );
  }

  // ── 결제 상세 + 환불 처리 ────────────────────────────────
  window.PaymentDetail = function PaymentDetail({ row, onBack }) {
    const [pay, setPay] = useState(row);
    const [refundOpen, setRefundOpen] = useState(false);
    const [reason, setReason] = useState("주최측 취소");
    const isNeg = String(pay.amount).indexOf("-") === 0;
    const isFailed = pay.tone === "danger";
    const isRefunded = pay.badge === "환불완료";
    const canRefund = pay.tone === "ok" && !isNeg && !isRefunded;

    // 처리 타임라인 (상태에서 파생)
    const tl = [{ t: "결제 요청 접수", time: pay.date, on: true }];
    if (isFailed) {
      tl.push({ t: "카드 승인 거절 — 한도 초과", time: pay.date, on: true, tone: "danger" });
    } else {
      tl.push({ t: pay.gateway + " 승인 완료", time: pay.date, on: true });
      tl.push({ t: "정산 대기열 등록", time: "정산 주기: 주 1회(월)", on: true });
    }
    if (pay.badge === "환불대기") tl.push({ t: "환불 요청 접수 — 검토 대기", time: "방금", on: false, tone: "warn" });
    if (isRefunded) tl.push({ t: "환불 완료 — " + reason, time: "방금", on: true, tone: "ok" });

    const doRefund = () => {
      setRefundOpen(false);
      setPay(p => ({ ...p, badge: "환불완료", tone: "grey" }));
      window.adToast && window.adToast("환불 처리가 접수되었습니다 (시연)");
    };

    return (
      <div>
        <button className="ad-backlink" onClick={onBack}><Icon name="arrow-left" size={16} />결제 목록</button>

        <div className="bo-detail-head">
          <div style={{ minWidth: 0 }}>
            <div className="ts-ph__eyebrow">백오피스 · 결제 관리</div>
            <div className="ts-ph__title">{pay.name}</div>
            <div className="ts-ph__sub">{pay.sub} · 거래번호 <b style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-soft)" }}>{pay.txid}</b></div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn variant="secondary" icon="receipt" onClick={() => window.adToast && window.adToast("영수증 보기 (시연)")}>영수증</Btn>
            {canRefund && <Btn variant="danger" icon="undo-2" onClick={() => setRefundOpen(true)}>환불 처리</Btn>}
            {isFailed && <Btn icon="refresh-cw" onClick={() => window.adToast && window.adToast("재결제 요청 발송 (시연)")}>재결제 요청</Btn>}
          </div>
        </div>

        {/* 금액 요약 */}
        <div className="ts-card" style={{ marginBottom: 20 }}>
          <div className="ad-cell-muted" style={{ fontWeight: 700, marginBottom: 4 }}>결제 금액</div>
          <div className="bo-amt" data-neg={isNeg ? "true" : "false"}>{pay.amount}</div>
          <div className="bo-sumrow">
            <Badge tone={pay.tone || "grey"}>{pay.badge}</Badge>
            <span className="ad-statusline"><Icon name="credit-card" size={15} />{pay.method}</span>
            <span className="ad-statusline"><Icon name="calendar" size={15} />{pay.date}</span>
          </div>
        </div>

        <div className="ad-cols">
          {/* 결제 정보 */}
          <div className="ad-panel">
            <div className="ad-panel__title" style={{ marginBottom: 8 }}>결제 정보</div>
            <Field k="결제 항목">{pay.name}</Field>
            <Field k="결제자">{pay.sub}</Field>
            <Field k="결제 수단">{pay.method}</Field>
            <Field k="금액" mono>{pay.amount}</Field>
            <Field k="거래번호" mono>{pay.txid}</Field>
            <Field k="결제대행">{pay.gateway}</Field>
            <Field k="일시" mono>{pay.date}</Field>
          </div>

          {/* 처리 이력 */}
          <div className="ad-panel">
            <div className="ad-panel__title" style={{ marginBottom: 14 }}>처리 이력</div>
            <div className="bo-tl">
              {tl.map((s, i) => (
                <div key={i} className="bo-tl__row">
                  <div className="bo-tl__rail">
                    <span className="bo-tl__dot" data-on={s.on ? "true" : "false"} data-tone={s.tone || "primary"} />
                    <span className="bo-tl__line" />
                  </div>
                  <div className="bo-tl__body">
                    <div className="bo-tl__t">{s.t}</div>
                    <div className="bo-tl__time">{s.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 환불 처리 모달 */}
        <Modal open={refundOpen} onClose={() => setRefundOpen(false)} title="환불 처리"
          sub={pay.name + " · " + pay.sub}
          foot={<>
            <Btn variant="secondary" onClick={() => setRefundOpen(false)}>취소</Btn>
            <Btn variant="danger" icon="undo-2" onClick={doRefund}>환불 확정</Btn>
          </>}>
          <div className="ts-field">
            <label className="ts-field__label">환불 금액</label>
            <input className="ts-input" defaultValue={pay.amount} readOnly />
            <div className="ts-field__hint">전액 환불 기준입니다. 부분 환불은 금액을 직접 수정하세요.</div>
          </div>
          <div className="ts-field">
            <label className="ts-field__label">환불 사유</label>
            <select className="ts-select" value={reason} onChange={e => setReason(e.target.value)}>
              <option>주최측 취소</option>
              <option>참가자 변심</option>
              <option>중복 결제</option>
              <option>일정 변경</option>
              <option>기타</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--danger-weak)", borderRadius: 12, alignItems: "flex-start" }}>
            <Icon name="alert-triangle" size={17} color="var(--danger)" style={{ marginTop: 1, flex: "0 0 auto" }} />
            <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>환불 확정 시 결제대행사로 즉시 요청되며 되돌릴 수 없습니다. 정산 마감 후 환불은 다음 정산에서 차감됩니다.</div>
          </div>
        </Modal>
      </div>
    );
  };

  // ── 요금제 편집기 ────────────────────────────────────────
  window.PlanEditor = function PlanEditor({ row, onBack }) {
    const [name, setName] = useState(row.name);
    const [price, setPrice] = useState(row.price);
    const [desc, setDesc] = useState(row.sub);
    const [billing, setBilling] = useState("월간");
    const [pub, setPub] = useState(row.sttone !== "mute");
    const [feats, setFeats] = useState(() => (row.features || []).map(f => ({ ...f })));
    const toggleFeat = (k) => setFeats(fs => fs.map(f => f.k === k ? { ...f, on: !f.on } : f));
    const onCount = feats.filter(f => f.on).length;

    return (
      <div>
        <button className="ad-backlink" onClick={onBack}><Icon name="arrow-left" size={16} />요금제 목록</button>

        <div className="bo-detail-head">
          <div style={{ minWidth: 0 }}>
            <div className="ts-ph__eyebrow">백오피스 · 요금제 관리</div>
            <div className="ts-ph__title">요금제 편집 — {row.name}</div>
            <div className="ts-ph__sub">가입자 <b style={{ color: "var(--ink-soft)" }}>{row.subs}</b>명 이용 중 · 포함 기능 {onCount}개</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn variant="secondary" onClick={onBack}>취소</Btn>
            <Btn icon="check" onClick={() => { window.adToast && window.adToast(name + " 요금제가 저장되었습니다 (시연)"); }}>변경사항 저장</Btn>
          </div>
        </div>

        <div className="ad-cols">
          {/* 기본 정보 */}
          <div className="ad-panel">
            <div className="ad-panel__title" style={{ marginBottom: 16 }}>기본 정보</div>
            <div className="ts-field">
              <label className="ts-field__label">요금제 이름</label>
              <input className="ts-input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="bo-form-grid">
              <div className="ts-field">
                <label className="ts-field__label">월 요금</label>
                <input className="ts-input" value={price} onChange={e => setPrice(e.target.value)} placeholder="₩0 또는 무료" />
              </div>
              <div className="ts-field">
                <label className="ts-field__label">결제 주기</label>
                <div className="ts-segment">
                  {["월간", "연간"].map(b => (
                    <button key={b} type="button" className="ts-segment__btn" data-active={billing === b ? "true" : "false"} onClick={() => setBilling(b)}>{b}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="ts-field" style={{ marginBottom: 0 }}>
              <label className="ts-field__label">설명</label>
              <textarea className="ts-input" rows={3} style={{ resize: "vertical", lineHeight: 1.5 }} value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
          </div>

          {/* 노출 · 가입자 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="ad-panel">
              <div className="ad-panel__title" style={{ marginBottom: 12 }}>노출 설정</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>요금제 공개</div>
                  <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 3 }}>끄면 신규 가입에서 숨겨집니다. 기존 가입자는 유지됩니다.</div>
                </div>
                <Toggle on={pub} onChange={setPub} />
              </div>
            </div>
            <div className="ad-panel">
              <div className="ad-panel__title" style={{ marginBottom: 6 }}>가입자 현황</div>
              <div className="bo-amt" style={{ fontSize: 32 }}>{row.subs}</div>
              <div className="ad-cell-muted" style={{ fontWeight: 600 }}>현재 이 요금제 이용자 수</div>
            </div>
          </div>
        </div>

        {/* 포함 기능 */}
        <div className="ad-panel" style={{ marginTop: 20 }}>
          <div className="ad-panel__head">
            <div className="ad-panel__title">포함 기능</div>
            <Badge tone="primary">{onCount} / {feats.length} 활성</Badge>
          </div>
          <div>
            {feats.map(f => (
              <div key={f.k} className="bo-featrow">
                <span className="bo-featrow__t">{f.label}</span>
                <Toggle on={f.on} onChange={() => toggleFeat(f.k)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
})();
