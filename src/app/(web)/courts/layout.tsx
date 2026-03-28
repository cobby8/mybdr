import Script from "next/script";

/**
 * Courts 레이아웃 -- 카카오맵 SDK를 이 영역에서만 로드한다.
 *
 * 왜 여기서만? 카카오맵 SDK는 ~200KB 크기라서 전체 사이트에 넣으면
 * 다른 페이지에서도 불필요하게 다운로드된다. courts 하위에서만 로드.
 *
 * autoload=false: kakao.maps.load() 콜백 안에서 수동 초기화 (타이밍 제어)
 * libraries=services,clusterer: 주소검색 + 마커 클러스터링
 */
export default function CourtsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&libraries=services,clusterer&autoload=false`}
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
