# 폰트 파일 배치 안내

## 현재 상태 (배치 완료)

| 파일 | 용량 | 상태 |
|---|---|---|
| `HeirOfLight-Regular.otf` | 814KB | 로드 확인 |
| `HeirOfLight-Bold.otf` | 828KB | 로드 확인 |
| `GriunGossi-Regular.woff2` | 2.68MB | 로드 확인 |

합계 4.3MB. 아래는 재설치·교체가 필요할 때의 안내입니다.

---

이 폴더에 폰트 파일을 넣으면 사이트가 시안 폰트로 렌더링됩니다.
`app/globals.css`의 `@font-face`가 아래 **정확한 파일명**을 참조하므로,
다운로드한 파일을 아래 이름으로 **바꿔서** 넣어 주세요.

확장자는 `.woff2` / `.otf` / `.ttf` 중 아무거나 됩니다.
CSS가 `woff2 → otf → ttf` 순으로 찾고 없으면 다음으로 넘어갑니다.

| 넣을 파일명 | 원본 폰트 | weight |
|---|---|---|
| `HeirOfLight-Regular.(woff2\|otf\|ttf)` | 빛의 계승자 Regular | 400 |
| `HeirOfLight-Bold.(woff2\|otf\|ttf)` | 빛의 계승자 Bold | 700 |
| `GriunGossi-Regular.(woff2\|otf\|ttf)` | 그리운 고씨네 | 400 |

---

## 1. 빛의 계승자 (Heir of Light)

**산돌구름에서는 받을 수 없습니다.** 산돌구름은 구독 서비스(40,000원~)라
개별 무료 다운로드를 제공하지 않습니다. 폰트 소개 페이지일 뿐입니다.

실제 배포처는 게임 공식 사이트입니다. 구 사이트(`heiroflight.gamevil.com`)의
`폰트 다운로드` 메뉴는 지금 신작 프로모션 페이지로 리다이렉트되므로,
아래 zip을 직접 받는 것이 확실합니다.

```
https://hive-fn.qpyou.cn/webdev/heiroflighteclipse/download/heiroflight_fonts.zip
```

zip 용량 2.4MB, 안에 TTF와 OTF가 **둘 다** 들어 있습니다.

| zip 내부 경로 | 용량 | → 바꿀 이름 |
|---|---|---|
| `빛의 계승자 Regular/OTF(Mac용)/HeirofLightOTFRegular.otf` | 814KB | `HeirOfLight-Regular.otf` |
| `빛의 계승자 Regular/TTF(Window용)/HeirofLightRegular.ttf` | 1.39MB | `HeirOfLight-Regular.ttf` |
| `빛의 계승자 Bold/OTF(Mac용)/HeirofLightOTFBold.otf` | 828KB | `HeirOfLight-Bold.otf` |
| `빛의 계승자 Bold/TTF(Window용)/HeirofLightBold.ttf` | 1.44MB | `HeirOfLight-Bold.ttf` |

**OTF를 권장합니다.** TTF의 60% 크기이고 웹에서 동작은 동일합니다.
(파일명의 `OTF`는 Figma에 잡힌 `Heir of Light OTF`와 같은 파일입니다.)

### 라이선스 — 확인 필요

라이선스 원문상 금지 항목은 3가지입니다.

1. 서체 자체의 유료 판매
2. 서체의 수정, 편집 및 재배포
3. 콘솔/PC/포터블/온라인/모바일 **게임**에 임베딩

웹 임베딩을 금지하는 조항은 원문에 없습니다. 다만 산돌구름과 눈누의
라이선스 요약표가 둘 다 이렇게 표기하고 있습니다.

| 카테고리 | 허용 여부 |
|---|---|
| 웹사이트 (웹페이지, 배너, 메일) | 사용 가능 |
| **임베딩 (웹사이트 및 프로그램 서버 내 폰트 탑재)** | **조건부 허용** |

`public/fonts/`에 올려 브라우저가 내려받게 하는 방식이 바로 이 "임베딩"에
해당합니다. 두 사이트 모두 "조건부 허용은 원본 라이선스를 확인 후 이용"하라고
안내하고 있으므로, **배포 전 저작권자에게 한 번 확인하는 것이 안전합니다.**

- 문의: 컴투스 1588-7155 / <https://www.com2us.com/ko/about/game-business>

확인이 어렵거나 답이 늦으면, 서브셋 없이 원본 파일 그대로 서빙하는 것이
"수정·재배포"에 해당하지 않는다는 점은 분명하므로 그 형태를 유지하는 편이 낫습니다.
(= 아래 woff2 변환·서브셋은 확인 전까지 보류)

## 2. 그리운 고씨네 (Griun Gossi)

이쪽은 **임베딩도 "사용 가능"** 으로 명시돼 있어 제약이 없습니다.
라이선스 원문: "폰트 파일의 수정, 개작, 유상 판매를 제외하고는 제한 없이 사용 가능".

눈누가 woff2를 직접 호스팅하고 있어서 이 파일 하나만 받으면 됩니다.

```
https://cdn.jsdelivr.net/gh/projectnoonnu/2510-1@1.0/Griun_Gossi-Rg.woff2
```

→ `GriunGossi-Regular.woff2` 로 저장.

- 소개 페이지: <https://noonnu.cc/font_page/1673>
- 원 배포처: <https://blog.naver.com/chriskohgo/224016988087>

---

## 용량 최적화 (라이선스 확인 후에)

빛의 계승자 OTF 2개면 약 1.6MB입니다. 첫 화면에서 부담되는 크기라
woff2 변환을 하면 대략 1/3로 줄어듭니다.

```bash
pip install fonttools brotli && fonttools ttLib.woff2 compress public/fonts/HeirOfLight-Regular.otf
```

단, 변환·서브셋은 "폰트 파일의 수정"으로 해석될 여지가 있습니다.
위 라이선스 확인이 끝난 뒤에 진행하세요.

---

## 확인 방법

```bash
npm run dev
```

브라우저 devtools → Network → Font 탭에서 `HeirOfLight-Regular` 요청이 200이면 정상입니다.
아무 요청도 없으면 파일명이 위 표와 다른 것이고, 404가 뜨면 확장자가 CSS와 안 맞는 것입니다.

파일을 안 넣어도 빌드와 렌더링은 정상이며, 대체 폰트(`Gowun Batang`)로 표시됩니다.
