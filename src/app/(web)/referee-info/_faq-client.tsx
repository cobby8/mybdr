"use client";

import { useState } from "react";

/* ============================================================
 * RefereeInfoFaq — accordion 클라이언트 컴포넌트
 *
 * 이유(왜):
 *   page.tsx는 metadata export를 위해 서버 컴포넌트여야 한다.
 *   FAQ accordion 토글은 useState가 필요하므로 별도 클라이언트
 *   컴포넌트로 분리. 시안 RefereeInfo.jsx L128-145 그대로 박제.
 * ============================================================ */

interface FaqItem {
  q: string;
  a: string;
}

export default function RefereeInfoFaq({ faqs }: { faqs: FaqItem[] }) {
  // 첫 항목을 기본 펼침 (시안 useState(0) 동일)
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {faqs.map((f, i) => (
        <div
          key={i}
          style={{
            // 마지막 항목 제외 하단 구분선
            borderBottom:
              i < faqs.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <button
            type="button"
            onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "16px 22px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
            aria-expanded={openFaq === i}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>{f.q}</span>
            {/* 펼침 시 화살표 회전 (Material Symbols Outlined) */}
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 20,
                color: "var(--ink-dim)",
                transform: openFaq === i ? "rotate(180deg)" : "none",
                transition: "transform .2s",
              }}
            >
              expand_more
            </span>
          </button>
          {openFaq === i && (
            <div
              style={{
                padding: "0 22px 18px",
                fontSize: 13,
                color: "var(--ink-soft)",
                lineHeight: 1.7,
              }}
            >
              {f.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
