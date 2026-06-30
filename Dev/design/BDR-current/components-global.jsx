/* global React */
/**
 * Phase E — 글로벌 공유 컴포넌트
 *
 * 8 개의 시안 (운영 src/ 마이그레이션 대상):
 *   1. PWAInstallBanner       — 모바일 하단 고정 / iOS 안내 모달
 *   2. PushPermissionPrompt   — 알림 권한 모달
 *   3. ProfileCompletionBanner — 홈 / 마이페이지 진행률 막대
 *   4. ImageUploader          — 드래그앤드롭 + 압축 진행률 (매치당 15장 제한)
 *   5. SlideMenu              — 페이지 내 보조 슬라이드 (drawer 와 분리)
 *   6. KakaoMapPlaceholder    — 인포윈도 마커 (--ok / --warn / --accent)
 *   7. PlaceAutocomplete      — 검색 결과 row + 칩
 *   8. UserDropdown           — 회원 카드 ⋮ (overflow: visible 룰)
 *
 * 룰: 토큰 var(--*) 만 / 핑크·살몬·lucide·9999px (live 외) ❌
 *     라이트·다크 둘 다 시각 분기 필수.
 */

const { useState: useStateG, useEffect: useEffectG, useRef: useRefG, useMemo: useMemoG } = React;

/* ============================================================
 * 1. PWAInstallBanner
 *   - 진입: 모든 페이지 (모바일 하단 고정)
 *   - 트리거: beforeinstallprompt (Android) 또는 iOS detection
 *   - 닫기: localStorage('mybdr.pwaDismissed')=1
 * ============================================================ */
function PWAInstallBanner({ defaultOpen = true, onDismiss, onInstall, platform = 'android' }) {
  const [open, setOpen] = useStateG(defaultOpen);
  const [iosGuide, setIosGuide] = useStateG(false);

  if (!open) return null;
  const isIos = platform === 'ios';

  const dismiss = () => { setOpen(false); onDismiss && onDismiss(); };
  const install = () => {
    if (isIos) { setIosGuide(true); return; }
    onInstall && onInstall();
  };

  return (
    <React.Fragment>
      <div role="region" aria-label="앱 설치 안내" style={{
        position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 95,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--sh-md)',
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          flex: '0 0 auto', width: 44, height: 44,
          borderRadius: 8, background: 'var(--accent)', color: '#fff',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em',
        }}>BDR</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>홈 화면에 MyBDR 추가</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>
            앱처럼 빠르게 · 알림 받기 · 오프라인 일정 확인
          </div>
        </div>
        <button className="btn btn--accent btn--sm" onClick={install} style={{ minHeight: 36 }}>
          {isIos ? '안내' : '설치'}
        </button>
        <button onClick={dismiss} aria-label="닫기" style={{
          background: 'transparent', border: 0, color: 'var(--ink-mute)', cursor: 'pointer',
          padding: 4, fontSize: 18, lineHeight: 1,
        }}>×</button>
      </div>

      {iosGuide && (
        <div className="modal-backdrop" onClick={() => setIosGuide(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal__head">
              <div className="modal__title">iOS 홈 화면 추가</div>
              <button className="modal__close" onClick={() => setIosGuide(false)}>×</button>
            </div>
            <div className="modal__body">
              <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 14, color: 'var(--ink-soft)' }}>
                <li>Safari 하단 <b style={{ color: 'var(--ink)' }}>공유</b> 버튼 (□↑) 탭</li>
                <li>메뉴에서 <b style={{ color: 'var(--ink)' }}>홈 화면에 추가</b> 선택</li>
                <li>우측 상단 <b style={{ color: 'var(--ink)' }}>추가</b> 탭</li>
              </ol>
              <div style={{
                marginTop: 14, padding: 12, background: 'var(--bg-alt)',
                borderRadius: 6, fontSize: 12, color: 'var(--ink-mute)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>ⓘ</span>
                <span>Chrome / 다른 브라우저로는 추가 불가 — Safari 만 지원합니다.</span>
              </div>
            </div>
            <div className="modal__foot">
              <button className="btn btn--primary" onClick={() => { setIosGuide(false); dismiss(); }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

/* ============================================================
 * 2. PushPermissionPrompt
 *   - 진입: 첫 매치 신청 직후 / 첫 코트 예약 직후 (1회)
 *   - 닫기: localStorage('mybdr.pushAsked')=1
 * ============================================================ */
function PushPermissionPrompt({ open, onAllow, onLater, reason = 'match' }) {
  if (!open) return null;
  const reasons = {
    match:  { title: '매치 알림 받기', desc: '신청한 매치의 마감·픽업·결과를 즉시 알려드려요.' },
    booking:{ title: '예약 알림 받기', desc: '코트 예약 확정·취소·1시간 전 리마인드를 보내드려요.' },
    team:   { title: '팀 알림 받기',   desc: '팀 초대·매치 신청·공지를 놓치지 않도록 알려드려요.' },
  };
  const r = reasons[reason] || reasons.match;
  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal__body" style={{ padding: '24px 20px 8px', textAlign: 'center' }}>
          <div style={{
            margin: '0 auto 14px', width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent-soft)', color: 'var(--accent)',
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 19, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{r.title}</div>
          <div style={{ marginTop: 8, fontSize: 13.5, color: 'var(--ink-mute)', lineHeight: 1.55 }}>{r.desc}</div>
          <div style={{
            marginTop: 16, padding: '10px 12px', background: 'var(--bg-alt)',
            borderRadius: 6, fontSize: 11.5, color: 'var(--ink-dim)', textAlign: 'left',
          }}>
            ⓘ 브라우저 권한 요청이 표시됩니다. 언제든 <b style={{ color: 'var(--ink-soft)' }}>설정 › 알림</b>에서 변경할 수 있어요.
          </div>
        </div>
        <div className="modal__foot" style={{ flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
          <button className="btn btn--accent btn--xl" onClick={onAllow}>알림 허용</button>
          <button className="btn btn--ghost" onClick={onLater} style={{ border: 0 }}>나중에</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 3. ProfileCompletionBanner
 *   - 진입: 홈 상단 (프로필 미완성 시), /profile 상단
 *   - 단계: 프사 / 닉 / 활동지역 / 포지션 / 자기소개 / 알림 — 6 단계
 * ============================================================ */
function ProfileCompletionBanner({ steps, dismissed, onGo, onDismiss }) {
  const total = steps.length;
  const done  = steps.filter(s => s.done).length;
  const pct   = Math.round(done / total * 100);
  const next  = steps.find(s => !s.done);
  if (dismissed || done === total) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--cafe-blue-hair)',
      borderLeft: '3px solid var(--cafe-blue)',
      borderRadius: 'var(--radius-card)',
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>프로필 완성도</span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, fontSize: 13, color: 'var(--cafe-blue-deep)' }}>{pct}%</span>
          <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>· {done}/{total} 단계 완료</span>
        </div>
        <div style={{
          height: 6, background: 'var(--bg-alt)', borderRadius: 3,
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0, right: `${100 - pct}%`,
            background: 'var(--cafe-blue)', transition: 'right .25s',
          }} />
        </div>
        {next && (
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 8 }}>
            다음: <b style={{ color: 'var(--ink)' }}>{next.label}</b>
            {next.reward && <span style={{ marginLeft: 6, color: 'var(--accent)' }}>· {next.reward}</span>}
          </div>
        )}
      </div>
      {next && (
        <button className="btn btn--primary btn--sm" onClick={() => onGo && onGo(next.id)}>
          이어하기
        </button>
      )}
      <button onClick={onDismiss} aria-label="닫기" style={{
        background: 'transparent', border: 0, color: 'var(--ink-mute)',
        cursor: 'pointer', padding: 4, fontSize: 16, lineHeight: 1,
      }}>×</button>
    </div>
  );
}

/* ============================================================
 * 4. ImageUploader
 *   - 진입: 매치 결과·갤러리·게시글 작성·코트 등록·팀 엠블럼
 *   - 룰: 매치당 15장 제한 / 압축 진행률 표시 / WebP 변환
 *   - 드래그앤드롭 + 클릭 + 카메라 (모바일) 모두 지원
 * ============================================================ */
function ImageUploader({ max = 15, items = [], onChange, hint }) {
  const [drag, setDrag] = useStateG(false);
  const [progress, setProgress] = useStateG(null); // { name, pct }
  const inputRef = useRefG(null);

  const remain = Math.max(0, max - items.length);
  const onPick = (files) => {
    const list = Array.from(files || []).slice(0, remain);
    if (!list.length) return;
    // simulated compression
    let i = 0;
    const next = items.slice();
    const tick = () => {
      if (i >= list.length) { setProgress(null); onChange && onChange(next); return; }
      const f = list[i];
      const id = `img-${Date.now()}-${i}`;
      let pct = 0;
      const t = setInterval(() => {
        pct += 12 + Math.random() * 18;
        if (pct >= 100) {
          clearInterval(t);
          next.push({ id, name: f.name, size: f.size, url: URL.createObjectURL ? URL.createObjectURL(f) : null });
          i++; tick();
        } else {
          setProgress({ name: f.name, pct: Math.min(99, Math.round(pct)) });
        }
      }, 60);
    };
    tick();
  };
  const remove = (id) => onChange && onChange(items.filter(x => x.id !== id));

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(e.dataTransfer.files); }}
        onClick={() => remain > 0 && inputRef.current && inputRef.current.click()}
        style={{
          border: `2px dashed ${drag ? 'var(--cafe-blue)' : 'var(--border-strong)'}`,
          background: drag ? 'var(--cafe-blue-soft)' : 'var(--bg-alt)',
          borderRadius: 'var(--radius-card)',
          padding: '24px 16px',
          textAlign: 'center',
          cursor: remain > 0 ? 'pointer' : 'not-allowed',
          opacity: remain > 0 ? 1 : .55,
          transition: 'border-color .15s, background .15s',
        }}
      >
        <div style={{ fontSize: 28, color: 'var(--ink-dim)', marginBottom: 6 }}>＋</div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
          {drag ? '여기에 놓아주세요' : '이미지 끌어 놓기 또는 클릭'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>
          {hint || `JPG · PNG · WebP · HEIC · 1장당 10MB · 최대 ${max}장`}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)' }}>
          {items.length} / {max}
        </div>
        <input
          ref={inputRef} type="file" accept="image/*" multiple capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => onPick(e.target.files)}
        />
      </div>

      {progress && (
        <div style={{
          marginTop: 10, padding: '10px 12px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            압축 중… <span style={{ color: 'var(--ink-mute)' }}>{progress.name}</span>
          </div>
          <div style={{
            width: 120, height: 6, background: 'var(--bg-alt)',
            borderRadius: 3, overflow: 'hidden', position: 'relative',
          }}>
            <div style={{ position: 'absolute', inset: 0, right: `${100 - progress.pct}%`, background: 'var(--accent)', transition: 'right .1s' }} />
          </div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)', minWidth: 32, textAlign: 'right' }}>{progress.pct}%</div>
        </div>
      )}

      {items.length > 0 && (
        <div style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(86px, 1fr))',
          gap: 8,
        }}>
          {items.map((it) => (
            <div key={it.id} style={{
              position: 'relative', paddingTop: '100%',
              background: 'var(--bg-alt)', border: '1px solid var(--border)',
              borderRadius: 6, overflow: 'hidden',
            }}>
              {it.url
                ? <img src={it.url} alt={it.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
                : <div style={{
                    position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                    color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)', fontSize: 10,
                    background: 'repeating-linear-gradient(135deg, var(--bg-alt) 0 6px, var(--bg-card) 6px 12px)',
                  }}>{(it.name || '').slice(0, 14)}</div>
              }
              <button onClick={() => remove(it.id)} aria-label="삭제" style={{
                position: 'absolute', top: 4, right: 4,
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(0,0,0,.65)', color: '#fff',
                border: 0, cursor: 'pointer', fontSize: 13, lineHeight: 1,
              }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * 5. SlideMenu — 페이지 내 보조 슬라이드
 *   - drawer (전역 햄버거) 와 분리: 페이지 안쪽에서만 사용
 *   - 진입: 필터 / 정렬 / 시즌 선택 등 컨텍스트 전환
 *   - 위치: bottom (모바일) / right (데스크톱) 자동 분기
 * ============================================================ */
function SlideMenu({ open, onClose, title, children, side = 'auto', footer }) {
  useEffectG(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && onClose && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;
  const isBottom = side === 'bottom' || (side === 'auto' && typeof window !== 'undefined' && window.innerWidth < 720);

  return (
    <div className="slide-menu-root" style={{
      position: 'fixed', inset: 0, zIndex: 92,
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,.45)',
        animation: 'drawer-fade .15s ease',
      }} />
      <aside role="dialog" aria-modal="true" aria-label={title} style={isBottom ? {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        borderTopLeftRadius: 14, borderTopRightRadius: 14,
        maxHeight: '78vh', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--sh-lg)',
        animation: 'slidemenu-up .22s cubic-bezier(.2,.8,.2,1)',
      } : {
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: 380, maxWidth: '92vw',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border)',
        boxShadow: 'var(--sh-lg)',
        display: 'flex', flexDirection: 'column',
        animation: 'drawer-slide .2s cubic-bezier(.2,.8,.2,1)',
      }}>
        {isBottom && (
          <div style={{ padding: '10px 0 4px', display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
          </div>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{title}</div>
          <button onClick={onClose} aria-label="닫기" style={{
            background: 'transparent', border: 0, color: 'var(--ink-mute)',
            cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>{children}</div>
        {footer && <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>{footer}</div>}
      </aside>
      <style>{`
        @keyframes slidemenu-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
 * 6. KakaoMapPlaceholder
 *   - 운영: kakao maps SDK 로 교체 (디자인은 동일한 포맷)
 *   - 마커 색: var(--ok) 활발 / var(--warn) 적당 / var(--accent) 브랜드
 *   - 인포윈도: 카드 (var(--bg-card)) + 화살표 + 토큰
 * ============================================================ */
function KakaoMapPlaceholder({ markers = [], selectedId, onSelect, height = 320, level = 5 }) {
  const sel = markers.find(m => m.id === selectedId) || null;
  return (
    <div style={{
      position: 'relative', width: '100%', height,
      background:
        'linear-gradient(135deg, color-mix(in oklab, var(--cafe-blue-soft) 60%, var(--bg-alt)) 0%, var(--bg-alt) 100%)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
    }}>
      {/* grid streets */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(0deg, color-mix(in oklab, var(--border) 80%, transparent) 1px, transparent 1px), ' +
          'linear-gradient(90deg, color-mix(in oklab, var(--border) 80%, transparent) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at center, #000 60%, transparent 100%)',
      }}/>
      {/* "river" diagonal */}
      <div aria-hidden="true" style={{
        position: 'absolute', left: '-10%', right: '-10%', top: '58%',
        height: 26, transform: 'rotate(-6deg)',
        background: 'color-mix(in oklab, var(--cafe-blue-soft) 80%, transparent)',
        opacity: .9,
      }}/>

      {/* markers */}
      {markers.map((m) => {
        const color = m.tone === 'active' ? 'var(--ok)' : m.tone === 'moderate' ? 'var(--warn)' : 'var(--accent)';
        const isSel = m.id === selectedId;
        return (
          <button key={m.id} onClick={() => onSelect && onSelect(m.id)} title={m.name}
            style={{
              position: 'absolute', left: `${m.x}%`, top: `${m.y}%`,
              transform: 'translate(-50%, -100%)',
              background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
              zIndex: isSel ? 3 : 2,
            }}>
            <div style={{
              width: isSel ? 30 : 24, height: isSel ? 38 : 30,
              filter: isSel ? 'drop-shadow(0 4px 6px rgba(0,0,0,.25))' : 'drop-shadow(0 2px 3px rgba(0,0,0,.15))',
              transition: 'all .15s',
            }}>
              <svg viewBox="0 0 30 38" width="100%" height="100%">
                <path d="M15 0C6.7 0 0 6.5 0 14.5C0 25 15 38 15 38C15 38 30 25 30 14.5C30 6.5 23.3 0 15 0Z" fill={color}/>
                <circle cx="15" cy="14" r="6" fill="#fff"/>
                {m.label && <text x="15" y="18" textAnchor="middle" fontFamily="var(--ff-mono)" fontWeight="800" fontSize="10" fill={color}>{m.label}</text>}
              </svg>
            </div>
          </button>
        );
      })}

      {/* infowindow */}
      {sel && (
        <div style={{
          position: 'absolute', left: `${sel.x}%`, top: `${sel.y}%`,
          transform: 'translate(-50%, calc(-100% - 44px))',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: 'var(--sh-md)',
          minWidth: 200, maxWidth: 260,
          padding: 12,
          zIndex: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span className="badge" style={{
              background: sel.tone === 'active' ? 'var(--ok)' : sel.tone === 'moderate' ? 'var(--warn)' : 'var(--accent)',
              color: '#fff', borderColor: 'transparent',
            }}>{sel.tone === 'active' ? '활발' : sel.tone === 'moderate' ? '적당' : '브랜드'}</span>
            {typeof sel.distance === 'number' && (
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>
                {sel.distance < 1 ? `${Math.round(sel.distance * 1000)}m` : `${sel.distance.toFixed(1)}km`}
              </span>
            )}
          </div>
          <div style={{ marginTop: 6, fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{sel.name}</div>
          {sel.subtitle && <div style={{ marginTop: 2, fontSize: 12, color: 'var(--ink-mute)' }}>{sel.subtitle}</div>}
          {sel.meta && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--ink-soft)' }}>
              {sel.meta.map((mt, i) => <span key={i} style={{ padding: '2px 6px', background: 'var(--bg-alt)', borderRadius: 4 }}>{mt}</span>)}
            </div>
          )}
          {/* arrow */}
          <div aria-hidden="true" style={{
            position: 'absolute', left: '50%', bottom: -7, transform: 'translateX(-50%) rotate(45deg)',
            width: 12, height: 12,
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }} />
        </div>
      )}

      {/* zoom controls */}
      <div style={{
        position: 'absolute', right: 10, top: 10,
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 6, overflow: 'hidden', boxShadow: 'var(--sh-xs)',
      }}>
        <button title="확대" style={zoomBtn}>＋</button>
        <div style={{ height: 1, background: 'var(--border)' }} />
        <button title="축소" style={zoomBtn}>−</button>
      </div>
      {/* attribution */}
      <div style={{
        position: 'absolute', left: 10, bottom: 8,
        fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)',
        background: 'color-mix(in oklab, var(--bg-card) 80%, transparent)',
        padding: '2px 6px', borderRadius: 3,
      }}>map · placeholder · level {level}</div>
    </div>
  );
}
const zoomBtn = {
  width: 28, height: 28, background: 'transparent', border: 0,
  color: 'var(--ink-soft)', cursor: 'pointer', fontSize: 14, fontWeight: 700,
};

/* ============================================================
 * 7. PlaceAutocomplete
 *   - 진입: 회원가입 활동 지역 / 코트 검색 / 매치 장소
 *   - 입력 → 결과 row + 선택된 칩 (다중 선택 지원)
 * ============================================================ */
function PlaceAutocomplete({ value = [], onChange, max = 3, placeholder = '동/구/지역명 입력 (예 강남구)' }) {
  const [q, setQ] = useStateG('');
  const [open, setOpen] = useStateG(false);
  const candidates = [
    { id: 'gangnam-gu',  name: '강남구',  region: '서울특별시',  kind: '구' },
    { id: 'songpa-gu',   name: '송파구',  region: '서울특별시',  kind: '구' },
    { id: 'mapo-gu',     name: '마포구',  region: '서울특별시',  kind: '구' },
    { id: 'yeoksam-1',   name: '역삼1동', region: '서울 강남구', kind: '동' },
    { id: 'jamsil-2',    name: '잠실2동', region: '서울 송파구', kind: '동' },
    { id: 'bundang-gu',  name: '분당구',  region: '경기 성남시', kind: '구' },
    { id: 'haeundae-gu', name: '해운대구', region: '부산광역시',  kind: '구' },
  ];
  const selectedIds = value.map(v => v.id);
  const filtered = useMemoG(() => {
    if (!q.trim()) return [];
    return candidates.filter(c =>
      !selectedIds.includes(c.id) &&
      (c.name.includes(q) || c.region.includes(q))
    ).slice(0, 6);
  }, [q, selectedIds.join('|')]);

  const add = (c) => {
    if (value.length >= max) return;
    onChange && onChange([...value, c]);
    setQ(''); setOpen(false);
  };
  const remove = (id) => onChange && onChange(value.filter(v => v.id !== id));

  return (
    <div style={{ position: 'relative' }}>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {value.map((v) => (
            <span key={v.id} className="badge badge--soft" style={{ paddingRight: 4, gap: 4 }}>
              <span style={{ fontSize: 11 }}>{v.name}</span>
              <button onClick={() => remove(v.id)} aria-label="제거" style={{
                background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer',
                padding: 0, width: 16, height: 16, fontSize: 13, lineHeight: 1, opacity: .7,
              }}>×</button>
            </span>
          ))}
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)', alignSelf: 'center' }}>
            {value.length}/{max}
          </span>
        </div>
      )}
      <input
        className="input"
        type="text"
        value={q}
        placeholder={placeholder}
        disabled={value.length >= max}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--sh-md)',
          zIndex: 30,
          maxHeight: 280, overflowY: 'auto',
          padding: 4,
        }}>
          {filtered.map((c) => (
            <button key={c.id} onMouseDown={(e) => { e.preventDefault(); add(c); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '8px 10px', background: 'transparent', border: 0, cursor: 'pointer',
                borderRadius: 4, textAlign: 'left',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-alt)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{
                width: 26, height: 26, flex: '0 0 auto', borderRadius: 4,
                background: 'var(--cafe-blue-soft)', color: 'var(--cafe-blue-deep)',
                display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
                fontFamily: 'var(--ff-mono)',
              }}>{c.kind}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                  {highlight(c.name, q)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{c.region}</div>
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)' }}>+</span>
            </button>
          ))}
        </div>
      )}
      {open && q.trim() && filtered.length === 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', padding: '14px 12px',
          fontSize: 12, color: 'var(--ink-mute)', textAlign: 'center', zIndex: 30,
        }}>
          "{q}" 결과 없음 — 동/구 이름을 다시 확인해주세요.
        </div>
      )}
    </div>
  );
}
function highlight(text, q) {
  if (!q) return text;
  const i = text.indexOf(q);
  if (i < 0) return text;
  return (
    <React.Fragment>
      {text.slice(0, i)}
      <mark style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: 0, borderRadius: 2 }}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </React.Fragment>
  );
}

/* ============================================================
 * 8. UserDropdown — 회원 카드 ⋮ 메뉴
 *   - 02 §10-7 룰: 부모 카드 overflow: visible (jersey/dormant 신청 뱃지와 동일)
 *   - 액션: 쪽지·차단·신고·매니저 위임 (역할별 분기)
 * ============================================================ */
function UserDropdown({ user, role = 'member', viewerRole = 'captain', onAction }) {
  const [open, setOpen] = useStateG(false);
  const ref = useRefG(null);
  useEffectG(() => {
    if (!open) return;
    const onClickOut = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
  }, [open]);

  const baseActions = [
    { id: 'message', label: '쪽지 보내기',  icon: '💬' },
    { id: 'profile', label: '프로필 보기',  icon: '👤' },
  ];
  const captainActions = viewerRole === 'captain' && role !== 'captain' ? [
    { id: 'promote', label: '주장 위임',     icon: '👑' },
    { id: 'kick',    label: '팀에서 내보내기', icon: '🚪', danger: true },
  ] : [];
  const safety = [
    { id: 'block',  label: '차단',           icon: '🛡', danger: true },
    { id: 'report', label: '신고',           icon: '⚠️', danger: true },
  ];
  const groups = [baseActions, captainActions, safety].filter(g => g.length);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button onClick={() => setOpen(o => !o)} aria-label={`${user?.name || '회원'} 메뉴`} style={{
        background: 'transparent', border: 0, color: 'var(--ink-mute)',
        cursor: 'pointer', padding: 4, borderRadius: 4,
        width: 28, height: 28, display: 'grid', placeItems: 'center',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-alt)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5"  r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
        </svg>
      </button>
      {open && (
        <div className="dropdown" style={{ top: 'calc(100% + 4px)', right: 0, minWidth: 180 }}>
          {groups.map((g, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />}
              {g.map((a) => (
                <button key={a.id}
                  className={`dropdown__item${a.danger ? ' dropdown__item--danger' : ''}`}
                  onClick={() => { setOpen(false); onAction && onAction(a.id, user); }}>
                  <span style={{ fontSize: 14, opacity: .85 }}>{a.icon}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  PWAInstallBanner,
  PushPermissionPrompt,
  ProfileCompletionBanner,
  ImageUploader,
  SlideMenu,
  KakaoMapPlaceholder,
  PlaceAutocomplete,
  UserDropdown,
});
