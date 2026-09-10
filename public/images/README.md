# 시안 이미지

Figma `나지르`(`0OWqWD2aHB1gzSNnshAlei`) → `개발자용 페이지` → `홈페이지 디자인` 에서
내보낸 이미지를 이 폴더에 둡니다. 파일이 없어도 빌드는 정상이고, 해당 자리만 비어 보입니다.

| 파일 | Figma 노드 | 원본 이름 | 크기 |
|---|---|---|---|
| `landing-hero.png` | 랜딩페이지 > `Rectangle 14` | `1.png` | 1920 × 757 |
| `landing-icon-1.png` | 랜딩페이지 > `Frame 7` > `Rectangle 24` | `icon1.png` | 181 × 160 |
| `landing-icon-2.png` | 랜딩페이지 > `Frame 17` > `Rectangle 24` | `icon2.png` | 139 × 122 |
| `landing-icon-3.png` | 랜딩페이지 > `Frame 18` > `Rectangle 24` | `icon3.png` | 181 × 160 |
| `landing-icon-4.png` | 랜딩페이지 > `Frame 19` > `Rectangle 24` | `icon4.png` | 157 × 139 |
| `landing-icon-5.png` | 랜딩페이지 > `Frame 20` > `Rectangle 24` | `icon5.png` | 169 × 149 |

## 내보내는 방법

Figma에서 해당 노드를 선택 → 우측 패널 `내보내기` → `2x` `PNG` → 내보내기.
받은 파일을 위 표의 이름으로 바꿔서 이 폴더에 넣습니다.

## 주의

- **아이콘 5개는 원본 크기가 제각각입니다**(Figma 코멘트 #3 미해결).
  코드에서는 고정 박스 + `background-size: contain`으로 흡수하므로 크기가 달라도 깨지지 않습니다.
  디자이너가 크기를 통일해 주면 그대로 교체만 하면 됩니다.
- 히어로는 최종본 여부가 확인되지 않았습니다(코멘트 #4).
- 용량이 크면 `public/fonts`처럼 전송량에 영향이 갑니다. 히어로는 1MB 아래를 권장합니다.
