# Click Tycoon Simulator (Roblox)

바로 출시해서 Robux로 수익화할 수 있는 **영어 버전 클리커 시뮬레이터** 게임입니다.
UI는 전부 코드로 만들어지므로, 스크립트 3개만 넣으면 바로 플레이할 수 있습니다.

## 게임 내용 (영어 UI)

- **CLICK!** 버튼 → 코인 획득 (클릭할 때 `+N` 이펙트)
- **Upgrade** → 코인으로 클릭 파워 강화 (가격 점점 상승)
- **Rebirth** → 코인/업그레이드를 초기화하는 대신 영구 코인 배율 +50%
- 리더보드(Coins, Rebirths), 자동 저장(DataStore), 오토클릭 해킹 방지

## 수익화 구조

| 종류 | 이름 | 효과 | 추천 가격 |
|---|---|---|---|
| Game Pass | 2x Coins | 코인 영구 2배 | 99 R$ |
| Game Pass | Auto Clicker | 초당 5회 자동 클릭 (AFK 가능) | 149 R$ |
| Game Pass | VIP | 코인 +50%, 머리 위 VIP 태그 | 249 R$ |
| Developer Product | Pile of Coins | 코인 2,500 × 환생 배율 | 25 R$ |
| Developer Product | Bag of Coins | 코인 20,000 × 환생 배율 | 75 R$ |
| Developer Product | Vault of Coins | 코인 150,000 × 환생 배율 | 199 R$ |
| Developer Product | Instant Rebirth | 코인 없이 즉시 환생 | 49 R$ |

Developer Product는 반복 구매가 가능해서 꾸준한 수익원이 되고, 구매는 영수증 ID로 기록해 **중복 지급/누락이 없도록** 처리합니다.
추가로 Premium 유저가 플레이하면 **Premium Payouts**가 자동으로 지급됩니다.

## 설치 방법 (Roblox Studio, 복사-붙여넣기)

1. Roblox Studio → **New → Baseplate** 생성
2. 아래처럼 3개를 만들고 각 파일 내용을 그대로 붙여넣기

   | 위치 (Explorer) | 종류 | 이름 | 파일 |
   |---|---|---|---|
   | ReplicatedStorage | **ModuleScript** | `Config` | `src/shared/Config.lua` |
   | ServerScriptService | **Script** | `GameServer` | `src/server/GameServer.server.lua` |
   | StarterPlayer → StarterPlayerScripts | **LocalScript** | `ClientUI` | `src/client/ClientUI.client.lua` |

3. **File → Publish to Roblox** 로 게임 저장
4. **Game Settings → Security → Enable Studio Access to API Services** 켜기 (Studio에서 저장 테스트용)
5. ▶ Play 로 테스트

> Rojo를 쓴다면 이 폴더에서 `rojo serve` 하면 됩니다 (`default.project.json` 포함).

## 수익화 연결하기 (중요)

1. [Creator Dashboard](https://create.roblox.com/dashboard/creations) → 내 게임 → **Monetization**
2. **Passes**에서 Game Pass 3개 생성 → 가격 설정 & **Item for Sale** 켜기 → ID 복사
3. **Developer Products**에서 상품 4개 생성 → 가격 설정 → ID 복사
4. `Config` 모듈의 `Id = 0` 부분을 복사한 ID로 바꾸기
5. 다시 Publish

ID가 0인 상품은 상점에서 `Set ID`로 표시되고 구매가 막혀 있으니, 설정이 빠진 곳을 쉽게 찾을 수 있습니다.
가격은 상점에 자동으로 `R$ 99`처럼 표시됩니다.

## 출시 체크리스트

- [ ] Game Settings → **Permissions → Public** 으로 공개
- [ ] 게임 이름/설명 영어로 작성 (예: *"Click your way to billions! Upgrade, rebirth and become the richest clicker!"*)
- [ ] 아이콘(512×512)과 썸네일 업로드
- [ ] **Experience Questionnaire**(연령 등급 설문) 완료 — 안 하면 노출이 제한됨
- [ ] 필요하면 Private Server 판매 켜기 (추가 수익)

## 밸런스 조정

`Config.lua` 상단 숫자만 바꾸면 됩니다.

- `UpgradeBaseCost`, `UpgradeCostGrowth` — 업그레이드 가격
- `RebirthBaseCost`, `RebirthCostGrowth`, `RebirthMultiplierBonus` — 환생 난이도/보상
- `AutoClicksPerSecond` — Auto Clicker 패스 성능
- `Products.*.Coins` — 코인 팩 지급량

## 참고

- Robux → 현금 환전(DevEx)은 Roblox 정책상 조건(나이, 보유 Earned Robux 등)을 충족해야 합니다.
- 실제 수익은 유입량에 따라 달라지므로, 출시 후 Sponsored Ads나 SNS 홍보를 함께 하는 것을 권장합니다.
