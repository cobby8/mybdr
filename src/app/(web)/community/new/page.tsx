"use client";

/**
 * NewPostPage — /community/new (BDR v2.23 CU3 박제 · 5-step 마법사)
 *
 * 이유(왜):
 *   - 시안 CU3(CommunityNew) = 5-step 마법사. CU4(CommunityEdit) 와 BC5 룰에 따라
 *     동일 컴포넌트(CommunityWizard) 를 공유한다. new = mode="new".
 *   - createPostAction 시그니처·데이터 흐름은 wizard 내부에서 0 변경 보존.
 *
 * 방법(어떻게):
 *   - 본 페이지는 wizard 를 mode="new" 로 호출하는 얇은 래퍼.
 *   - 기존 단일 form / 이미지 URL 첨부 / createPostAction 은 모두 wizard 로 이관(보존).
 *
 * 시안 출처: Dev/design/BDR-current/screens/CommunityNew.jsx (CU3)
 * 박제 등급: A
 */

import { CommunityWizard } from "../_components/community-wizard";

export default function NewPostPage() {
  // mode="new" — createPostAction 호출 (wizard 내부)
  return <CommunityWizard mode="new" />;
}
