#!/usr/bin/env bash
# GitHub 토큰이 실제로 동작하는지 점검한다. 토큰 값은 화면에 출력하지 않는다.
#
# 사용법 (둘 중 하나):
#   ./scripts/dev/check-github-token.sh                 # 프로젝트 루트의 .env 에서 GITHUB_TOKEN 을 읽음
#   GITHUB_TOKEN=... ./scripts/dev/check-github-token.sh # 환경변수로 직접 전달 (셸 히스토리에 남으니 .env 권장)
#
# 종료 코드: 0 = 정상, 1 = 토큰 문제, 2 = 토큰 없음/자리표시자

set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API="${GITHUB_API_BASE_URL:-https://api.github.com}"

# ── 토큰 읽기 (.env 는 source 하지 않고 해당 줄만 파싱) ──────────────────────
TOKEN="${GITHUB_TOKEN:-}"
SOURCE="환경변수"
if [ -z "$TOKEN" ] && [ -f "$ROOT/.env" ]; then
  TOKEN="$(grep -E '^GITHUB_TOKEN=' "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '\r"'"'"' ')"
  SOURCE=".env"
fi

if [ -z "$TOKEN" ]; then
  echo "✗ GITHUB_TOKEN 이 비어 있습니다. .env 에 값을 넣거나 환경변수로 전달하세요."
  exit 2
fi
case "$TOKEN" in
  ghp_xxxx*|*your_token*|*xxxx*)
    echo "✗ GITHUB_TOKEN 이 아직 자리표시자($SOURCE)입니다. 발급받은 실제 토큰으로 바꿔 주세요."
    exit 2
    ;;
esac

echo "토큰 출처: $SOURCE (길이 ${#TOKEN}자, 앞 4자리 ${TOKEN:0:4}…)"
echo

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# call <이름> <경로> : 상태코드를 stdout 으로, 헤더/본문은 $TMP/<이름>.{hdr,json} 에 저장
call() {
  curl -s -m 20 -o "$TMP/$1.json" -D "$TMP/$1.hdr" -w '%{http_code}' \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$API$2" 2>/dev/null || echo "000"
}
header() { grep -i "^$2:" "$TMP/$1.hdr" 2>/dev/null | head -1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//'; }
json()   { python3 -c "import json,sys; d=json.load(open('$TMP/$1.json')); print($2)" 2>/dev/null; }

FAIL=0

# 1) 인증 + 한도 ────────────────────────────────────────────────────────────
code="$(call rate /rate_limit)"
if [ "$code" = "200" ]; then
  limit="$(json rate "d['resources']['core']['limit']")"
  remaining="$(json rate "d['resources']['core']['remaining']")"
  s_limit="$(json rate "d['resources']['search']['limit']")"
  if [ "$limit" = "60" ]; then
    echo "✗ 인증이 적용되지 않았습니다 (core 한도 60회/시간 = 비인증 상태). 토큰이 잘못됐을 수 있습니다."
    FAIL=1
  else
    echo "✓ 인증 성공 — core 한도 ${limit}회/시간 (남은 ${remaining}회), search 한도 ${s_limit}회/분"
  fi
elif [ "$code" = "401" ]; then
  echo "✗ 401 Bad credentials — 토큰이 틀렸거나, 만료/폐기됐습니다."
  FAIL=1
elif [ "$code" = "403" ]; then
  echo "✗ 403 — 한도 초과이거나 접근이 거부됐습니다: $(json rate "d.get('message','')")"
  FAIL=1
else
  echo "✗ /rate_limit 응답 이상 (HTTP $code). 네트워크/프록시를 확인하세요."
  FAIL=1
fi

# 토큰이 무효면 이후 검사는 의미가 없다
if [ "$FAIL" -ne 0 ]; then
  echo
  echo "결과: 실패 — 토큰을 다시 발급해 .env 의 GITHUB_TOKEN 을 교체하세요."
  exit 1
fi

# 2) 권한 / 만료 ────────────────────────────────────────────────────────────
scopes="$(header rate x-oauth-scopes)"
expires="$(header rate github-authentication-token-expiration)"
if [ -n "$expires" ]; then
  echo "  · 만료일: $expires"
else
  echo "  · 만료일: 헤더 없음 (만료 없는 토큰이거나 확인 불가 — 만료일을 걸어 두는 것을 권장)"
fi
if [ -n "$scopes" ]; then
  echo "  · 클래식 토큰 스코프: $scopes"
  case ",$scopes," in
    *,\ repo,*|*,repo,*) echo "  ⚠ 'repo' 스코프는 비공개 레포까지 접근할 수 있습니다. 공개 데이터만 읽으므로 스코프 없는 토큰으로 교체하세요." ;;
  esac
else
  echo "  · 스코프 헤더 없음 (Fine-grained 토큰이거나 스코프 없는 토큰 — 권장 상태)"
fi

# 3) 계정 ───────────────────────────────────────────────────────────────────
code="$(call user /user)"
if [ "$code" = "200" ]; then
  echo "  · 토큰 소유 계정: $(json user "d['login']")"
fi

# 4) 크롤러가 실제로 쓰는 호출 ───────────────────────────────────────────────
code="$(call search '/search/repositories?q=topic:frontend&sort=stars&order=desc&per_page=1')"
if [ "$code" = "200" ]; then
  echo "✓ 레포 검색 (/search/repositories) — 1위: $(json search "d['items'][0]['full_name']") ★$(json search "d['items'][0]['stargazers_count']")"
else
  echo "✗ 레포 검색 실패 (HTTP $code): $(json search "d.get('message','')")"; FAIL=1
fi

code="$(call commits '/repos/react/react/commits?per_page=1')"
if [ "$code" = "200" ]; then
  echo "✓ 공개 레포 읽기 (/repos/{owner}/{repo}/commits)"
else
  echo "✗ 공개 레포 읽기 실패 (HTTP $code): $(json commits "d.get('message','')")"; FAIL=1
fi

code="$(call contents '/repos/react/react/contents/package.json')"
if [ "$code" = "200" ]; then
  echo "✓ 파일 내용 읽기 (/contents) — 의존성 파싱에 사용"
else
  echo "✗ 파일 내용 읽기 실패 (HTTP $code): $(json contents "d.get('message','')")"; FAIL=1
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "결과: 정상 — 크롤링에 사용할 수 있습니다."
  exit 0
fi
echo "결과: 일부 호출 실패 — 위 메시지를 확인하세요."
exit 1
