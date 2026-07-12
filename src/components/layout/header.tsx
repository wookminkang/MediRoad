import { MobileAppBar } from "./mobile-app-bar";

/**
 * 전역 헤더 (banner) — 앱바 한 줄(뒤로가기·페이지명·검색).
 *
 * 앱 쉘(640px)이라 데스크톱에서도 같은 앱바를 쓴다. 가로 내비게이션은 없앴다 —
 * 640 칸에 가로 메뉴를 밀어넣으면 찌그러지고, 내비는 하단 탭바(BottomNav)가 맡는다.
 *
 * 고정하지 않는다 — 스크롤하면 흘러가고, 목록 화면에서는 그 아래 탭 바가 top-0에 붙는다.
 */
export function Header() {
  return (
    <header
      className="relative z-40"
      style={{
        backgroundColor: "var(--seed-color-bg-layer-default)",
        borderBottom: "1px solid var(--seed-color-stroke-neutral-weak)",
      }}
    >
      <div className="flex h-14 w-full items-center px-4">
        <MobileAppBar />
      </div>
    </header>
  );
}
