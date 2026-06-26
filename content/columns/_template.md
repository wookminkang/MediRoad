---
# id 생략 시 자동 생성(짧은 id). URL 고정하려면 직접 지정: id: hairloss-basic
title: 칼럼 제목
category: 탈모            # column_categories에 없으면 자동 등록
excerpt: 목록·검색용 1~2줄 요약(메타 설명 폴백)
summary:                 # 핵심 요약(TL;DR 불릿)
  - 첫 번째 핵심 포인트
  - 두 번째 핵심 포인트
metaTitle:               # 비우면 title 사용
metaDescription: 검색 결과에 노출될 메타 설명(150~160자 권장). 비우면 excerpt 사용
metaKeywords: [탈모, 모발, 미녹시딜]
reviewedBy: { name: 정의사, specialty: 피부과 전문의 }
author: 메디로드
tags: [탈모, 두피]
faqs:
  - { q: 질문1, a: 답변1 }
  - { q: 질문2, a: 답변2 }
references:
  - { title: 대한피부과학회, url: https://www.derma.or.kr }
relatedDepartments: [피부과]
# 썸네일: 로컬 파일 업로드  ↔  또는 thumbnail: https://...  (이미 있는 URL)
thumbnail: { file: ./images/thumb.png, alt: 대표 이미지 }
# 본문 [이미지:N] 자리에 들어갈 이미지들 (위에서부터 1,2,3…)
# 각 항목은 url | file | prompt 중 하나 사용:
#   url    : 이미 호스팅된 이미지 주소 그대로
#   file   : 로컬 파일 → ingest가 Supabase Storage에 업로드
#   prompt : 영어 프롬프트 → ingest가 OpenAI로 AI 생성 후 업로드 (OPENAI_API_KEY 필요)
images:
  - { file: ./images/1.png, alt: 첫 번째 이미지 설명 }          # [이미지:1]
  - { prompt: "flat illustration of a doctor consulting a patient in a bright clinic", alt: 진료 상담 장면 } # [이미지:2]
status: draft            # 공개하려면 published
publishedAt:             # 비우면 published 전환 시 오늘 날짜
---

## 첫 소제목

본문 문단을 마크다운으로 작성합니다. **굵게**, [링크](https://example.com) 모두 됩니다.

[이미지:1]

## 두 번째 소제목

- 리스트 항목 1
- 리스트 항목 2

본문에서 이미지를 넣고 싶은 위치에 `[이미지:2]` 처럼 번호 자리표시를 넣으면,
ingest가 위 frontmatter `images` 배열의 해당 항목 URL로 자동 치환합니다.

[이미지:2]
