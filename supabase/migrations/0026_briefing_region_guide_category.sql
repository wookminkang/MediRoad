-- 메디브리핑 새 카테고리: 지역 병원 찾기 (region-guide)
-- GEO 타깃("○○ 요양병원 추천해줘" 류 AI 검색 질의)용 지역 안내 원고가 들어간다.
-- columns.category가 column_categories(id) FK라서, 이 마이그레이션이
-- 첫 region-guide 원고 발행(scripts/seed-geo-briefing.cjs)보다 반드시 먼저 적용돼야 한다.
insert into column_categories (id, name, sort_order)
values ('region-guide', '지역 병원 찾기', 18)
on conflict (id) do nothing;
