# 시안 이미지

Figma `나지르`(`0OWqWD2aHB1gzSNnshAlei`) → `개발자용 페이지` → `홈페이지 디자인` 에서
노드째 내보낸 뒤 WebP로 변환한 파일들입니다.

| 파일 | Figma 노드 | 내보낸 크기 | 용량 |
|---|---|---|---|
| `landing-hero.webp` | 랜딩페이지 > `Rectangle 14` | 1920 × 757 (1x) | 357 KB |
| `landing-icon-1.webp` | 랜딩페이지 > `Frame 7` > `Rectangle 24` | 362 × 320 (2x) | 32 KB |
| `landing-icon-2.webp` | 랜딩페이지 > `Frame 17` > `Rectangle 24` | 278 × 244 (2x) | 29 KB |
| `landing-icon-3.webp` | 랜딩페이지 > `Frame 18` > `Rectangle 24` | 362 × 320 (2x) | 31 KB |
| `landing-icon-4.webp` | 랜딩페이지 > `Frame 19` > `Rectangle 24` | 314 × 278 (2x) | 23 KB |
| `landing-icon-5.webp` | 랜딩페이지 > `Frame 20` > `Rectangle 24` | 338 × 298 (2x) | 30 KB |

합계 약 500 KB.

## 교체하는 방법

1. Figma에서 해당 노드 선택 → 우측 `내보내기` → 배율 지정(히어로 1x, 아이콘 2x) → `PNG`
2. 받은 PNG를 WebP로 변환하고 위 이름으로 이 폴더에 넣습니다.

```bash
node -e 'require("sharp")(process.argv[1]).webp({quality:84}).toFile(process.argv[2])' 입력.png 출력.webp
```

## 주의

- **히어로에는 검정 20% 오버레이가 이미 반영돼 있습니다.**
  원본 `1.png`은 2904×3871 세로 포스터이고 시안이 그걸 잘라 쓰는 구조라
  노드째 내보냈습니다. 그 결과 시안의 오버레이 레이어까지 함께 구워졌습니다
  (내보낸 PNG의 채널 최대값 204 = 255×0.8로 확인).
  **코드에서 오버레이를 또 얹으면 이중으로 어두워집니다** — `app/(site)/page.tsx` 참고.
- **아이콘 5개는 원본 크기가 제각각입니다**(181×160 ~ 139×122, Figma 코멘트 #3 미해결).
  코드에서 고정 박스 + `background-size: contain`으로 흡수하므로 깨지지는 않습니다.
  디자이너가 크기를 통일해 주면 그대로 교체만 하면 됩니다.
- 히어로는 최종본 여부가 확인되지 않았습니다(코멘트 #4).
