"use client";

export function PanelLoadingState({ label = "불러오는 중입니다." }: { label?: string }) {
  return (
    <div data-skin="toss" className="ct-emptybox mt-4">
      {label}
    </div>
  );
}
