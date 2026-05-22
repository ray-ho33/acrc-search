# 다른 컴퓨터에서 이어하기 — Handoff Guide

> M1 시작 전에 GitHub로 작업을 옮긴 뒤 다른 컴퓨터에서 이어갈 때 보는 문서

## 1. 지금 컴퓨터에서 (한 번만) — GitHub로 올리기

### 1-1. 사전 확인
- [ ] `git` 명령이 동작하는지 확인: 터미널에서 `git --version` 입력 → 버전 출력되면 OK
- [ ] GitHub 계정 있음
- [ ] GitHub에 **새 빈 레포지토리** 생성 (예: `acrc-search`)
  - Public/Private 어느 쪽이든 OK (초기에는 Private 추천)
  - **README, .gitignore, License 추가 옵션은 모두 체크 해제** (빈 레포여야 함)

### 1-2. 명령 (순서대로, 한 줄씩)

PowerShell 또는 git bash에서 프로젝트 폴더로 이동:

```powershell
cd "C:\Users\user\Desktop\0. project_folder\새 폴더"
```

git 초기화 + 기본 브랜치명을 `main`으로:

```powershell
git init
git branch -M main
```

사용자 이름/이메일 설정 (한 번만, 이미 설정돼 있으면 skip):

```powershell
git config --global user.name "당신이름"
git config --global user.email "당신@이메일.com"
```

**[중요] 커밋 전 안전 점검** — `.env` 같은 비밀 파일이 추적 대상에 들어갔는지 확인:

```powershell
git status
```

출력에 `.env`, `*.key`, `secrets/`가 나오면 **멈추세요**. `.gitignore`를 다시 확인하고 사용자에게 알려주세요. PRD 폴더 + `.gitignore`만 보이면 정상입니다.

첫 커밋 만들기:

```powershell
git add .
git commit -m "PRD + goaljaby contracts ready, before M1 bootstrap"
```

GitHub 레포와 연결 + 푸시 (`<당신ID>`와 `<레포명>`은 본인 것으로 교체):

```powershell
git remote add origin https://github.com/<당신ID>/<레포명>.git
git push -u origin main
```

GitHub 인증 창이 뜨면 브라우저에서 로그인하면 됩니다.

### 1-3. 확인
- 브라우저에서 `https://github.com/<당신ID>/<레포명>` 열기
- PRD/ 폴더 안에 11개 파일이 모두 보이면 성공
- `.env`, `node_modules/`, `*.key` 같은 파일이 **안 보여야** 합니다. 만약 보이면 즉시 알려주세요 — 키 폐기 + 히스토리 삭제 작업이 필요합니다.

---

## 2. 다른 컴퓨터에서 — 받아서 이어가기

### 2-1. 사전 설치
- [ ] Git 설치 (`git --version` 동작 확인)
- [ ] Node.js 18+ 설치 (M2부터 필요)
- [ ] Cursor IDE 설치

### 2-2. 명령

원하는 폴더로 이동한 뒤 clone:

```bash
git clone https://github.com/<당신ID>/<레포명>.git
cd <레포명>
```

Cursor로 폴더 열기:

```bash
cursor .
```

(또는 Cursor를 직접 실행해서 `File > Open Folder`로 폴더 열기)

### 2-3. 새 Cursor 세션에서 처음 할 말

다음 문장을 그대로 복사해서 Cursor 채팅에 붙여넣으세요:

> "PRD 폴더 안의 `01_PRD.md`, `PLAN.md`, `VALIDATION.md`, `RECOVERY.md`, `PROGRESS.md`를 읽고, M1 부트스트랩부터 시작해줘. 페어 프로그래밍 학습 모드로 진행하고, 마일스톤 끝날 때마다 확인받아줘."

그러면 AI가 골 계약서를 다 읽고 M1부터 진행합니다.

### 2-4. M1 시작 전 발급해 둘 것 (PROGRESS.md 사본)
- [ ] Supabase 프로젝트 생성 + URL/ANON_KEY/SERVICE_KEY 발급
- [ ] Google AI Studio에서 `GEMINI_API_KEY` 발급
- [ ] 법제처 Open API 키 발급 (이전 레포에서 받은 거 재사용 가능)
- [ ] GitHub 레포 (이미 만들어둠)
- [ ] Vercel 계정 (M5에서 사용)

---

## 3. 양쪽 컴퓨터를 왔다 갔다 할 때

작업 끝낼 때마다:

```powershell
git add .
git commit -m "어떤 작업을 했는지 한 줄 설명"
git push
```

다른 컴퓨터에서 작업 재개할 때 **반드시** 먼저:

```bash
git pull
```

이걸 안 하면 두 컴퓨터에서 따로 작업이 쌓여서 충돌이 생깁니다.

## 4. 위험 신호 (만약 보이면 즉시 멈추기)

| 신호 | 의미 | 대응 |
|------|------|------|
| `git status`에 `.env` 보임 | 비밀 키가 곧 GitHub에 올라갈 위험 | 커밋 중단, `.gitignore` 확인 |
| GitHub 레포에 `.env` 또는 키 값 보임 | 이미 노출됨 | 즉시 모든 API 키 폐기/재발급, AI에게 보고 |
| `git push` 시 "rejected" 메시지 | 다른 컴퓨터에서 먼저 푸시함 | `git pull` 후 다시 push |
| `node_modules/` 가 GitHub에 보임 | `.gitignore`가 무시됨 | `git rm -r --cached node_modules` 후 다시 커밋 |

---

## 5. 자주 묻는 것

**Q. `git push` 했는데 인증 오류가 나요.**
→ GitHub는 비밀번호 인증을 더 이상 지원하지 않습니다. Personal Access Token(PAT) 또는 GitHub CLI(`gh auth login`)를 써야 합니다. Cursor에 "gh CLI로 GitHub 로그인하게 도와줘"라고 하시면 도와드립니다.

**Q. `.docx` 기획서 원본도 GitHub에 같이 올리고 싶어요.**
→ 기본 `.gitignore`에서 제외해뒀습니다. 같이 올리고 싶으면 `.gitignore`에서 `고충처리_자료검색_지원시스템_기획서.docx` 줄을 지우고 다시 `git add .` → `git commit` → `git push`하시면 됩니다.

**Q. 다른 컴퓨터가 Mac/Linux예요. 괜찮나요?**
→ 괜찮습니다. Next.js / Node.js / Git 모두 cross-platform. 다만 PowerShell 명령은 안 되니 bash/zsh 명령으로 바꿔야 합니다 (`cd`, `ls` 등은 동일).
