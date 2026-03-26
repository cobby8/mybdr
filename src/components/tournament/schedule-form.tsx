"use client";

import { PlaceAutocomplete, type PlaceSelection } from "@/components/shared/place-autocomplete";

const inputCls =
  "w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50";
const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

export interface ScheduleFormData {
  startDate: string;
  endDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  venueName: string;
  venueAddress: string;
  city: string;
}

interface Props {
  data: ScheduleFormData;
  onChange: (field: keyof ScheduleFormData, value: string) => void;
}

export function ScheduleForm({ data, onChange }: Props) {
  // Google Places 검색 결과에서 장소를 선택했을 때
  // 장소명 -> venueName, 주소 -> venueAddress 자동 채움
  function handlePlaceSelect(place: PlaceSelection) {
    onChange("venueName", place.name);
    onChange("venueAddress", place.address);
    // 주소에서 도시명 자동 추출 (예: "서울특별시 강남구" -> "서울")
    const cityMatch = place.address.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/);
    if (cityMatch) {
      onChange("city", cityMatch[1]);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">일정 / 장소</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>대회 시작일</label>
          <input
            type="date"
            className={inputCls}
            value={data.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>대회 종료일</label>
          <input
            type="date"
            className={inputCls}
            value={data.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>참가 접수 시작</label>
          <input
            type="date"
            className={inputCls}
            value={data.registrationStartAt}
            onChange={(e) => onChange("registrationStartAt", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>참가 접수 마감</label>
          <input
            type="date"
            className={inputCls}
            value={data.registrationEndAt}
            onChange={(e) => onChange("registrationEndAt", e.target.value)}
          />
        </div>
      </div>

      {/* 장소 검색: Google Places Autocomplete 연동 */}
      {/* 검색하면 드롭다운이 나오고, 선택하면 경기장 이름+주소+도시가 자동 채워짐 */}
      <div>
        <label className={labelCls}>
          경기장 검색
          <span className="ml-1 text-xs" style={{ color: "var(--color-text-disabled)" }}>
            (Google 장소 검색)
          </span>
        </label>
        <PlaceAutocomplete
          value={data.venueName}
          onChange={(val) => onChange("venueName", val)}
          onSelect={handlePlaceSelect}
          placeholder="경기장 이름 검색 (예: 잠실체육관)"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>주소</label>
        <input
          className={inputCls}
          value={data.venueAddress}
          onChange={(e) => onChange("venueAddress", e.target.value)}
          placeholder="상세 주소 (자동 입력 또는 직접 입력)"
        />
      </div>
      <div>
        <label className={labelCls}>도시</label>
        <input
          className={inputCls}
          value={data.city}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="서울, 부산 등 (자동 입력 또는 직접 입력)"
        />
      </div>
    </div>
  );
}
