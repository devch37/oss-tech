#!/usr/bin/env bash
# OpenAI API 키가 동작하는지 점검한다. 키 값은 화면에 출력하지 않는다.
#
# 사용법:
#   ./scripts/dev/check-openai-key.sh          # 키 유효성 + 설정된 모델 사용 가능 여부 (무료 호출)
#   ./scripts/dev/check-openai-key.sh --ping   # 위 + 아주 작은 실제 호출로 크레딧/과금 상태까지 확인 (비용 1센트 미만)
#
# 키는 환경변수 OPENAI_API_KEY 또는 프로젝트 루트 .env 에서 읽는다.
# 종료 코드: 0 = 정상, 1 = 키/크레딧 문제, 2 = 키 없음/자리표시자

set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API="${OPENAI_API_BASE_URL:-https://api.openai.com}"
PING=0
[ "${1:-}" = "--ping" ] && PING=1

read_env() { # <변수명> — .env 에서 한 줄만 파싱 (source 하지 않음)
  [ -f "$ROOT/.env" ] && grep -E "^$1=" "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '\r"'"'"' '
}

KEY="${OPENAI_API_KEY:-}"; SOURCE="환경변수"
if [ -z "$KEY" ]; then KEY="$(read_env OPENAI_API_KEY)"; SOURCE=".env"; fi
MODEL="${OPENAI_MODEL:-$(read_env OPENAI_MODEL)}"; MODEL="${MODEL:-gpt-5-mini}"

if [ -z "$KEY" ]; then
  echo "✗ OPENAI_API_KEY 가 비어 있습니다. .env 에 키를 넣거나 환경변수로 전달하세요."
  exit 2
fi
case "$KEY" in
  sk-xxxx*|*your_key*|*xxxx*)
    echo "✗ OPENAI_API_KEY 가 아직 자리표시자($SOURCE)입니다. 발급받은 실제 키로 바꿔 주세요."
    exit 2 ;;
esac

echo "키 출처: $SOURCE (길이 ${#KEY}자, 앞 3자리 ${KEY:0:3}…)   모델: $MODEL"
echo

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
json() { python3 -c "import json,sys; d=json.load(open('$TMP/$1.json')); print($2)" 2>/dev/null; }

# 1) 인증 + 모델 목록 (무료) ─────────────────────────────────────────────────
code="$(curl -s -m 20 -o "$TMP/models.json" -w '%{http_code}' -H "Authorization: Bearer $KEY" "$API/v1/models" 2>/dev/null || echo 000)"
case "$code" in
  200)
    n="$(json models "len(d['data'])")"
    echo "✓ 인증 성공 — 사용 가능한 모델 ${n}개"
    if json models "[m['id'] for m in d['data']]" | grep -q "'$MODEL'"; then
      echo "✓ 설정한 모델($MODEL)을 사용할 수 있습니다."
    else
      echo "⚠ 설정한 모델($MODEL)이 이 키의 모델 목록에 없습니다. OPENAI_MODEL 을 확인하세요."
    fi ;;
  401) echo "✗ 401 — 키가 틀렸거나 폐기됐습니다. 새로 발급해 .env 를 고치세요."; exit 1 ;;
  000) echo "✗ 연결 실패 — 네트워크를 확인하세요."; exit 1 ;;
  *)   echo "✗ HTTP $code: $(json models "d.get('error',{}).get('message','')")"; exit 1 ;;
esac

# 2) 크레딧/과금 (선택, 아주 작은 실제 호출) ─────────────────────────────────
if [ "$PING" -eq 0 ]; then
  echo
  echo "ℹ 키가 유효해도 크레딧이 없으면 호출이 실패합니다. 크레딧까지 확인하려면: $0 --ping"
  exit 0
fi

echo
echo "실제 호출로 과금 상태 확인 중 (토큰 수십 개, 비용 1센트 미만)…"
code="$(curl -s -m 60 -o "$TMP/ping.json" -w '%{http_code}' \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d "{\"model\":\"$MODEL\",\"input\":\"ping\",\"max_output_tokens\":64}" "$API/v1/responses" 2>/dev/null || echo 000)"
err_code="$(json ping "d.get('error',{}).get('code','')")"
case "$code" in
  200) echo "✓ 호출 성공 — 크레딧이 있고 이 모델로 요청을 처리할 수 있습니다."; exit 0 ;;
  429)
    case "$err_code" in
      credit_balance_exhausted|insufficient_quota)
        echo "✗ 크레딧이 없습니다 ($err_code). ChatGPT 구독과 별개이므로 API 크레딧을 충전해야 합니다."
        echo "  https://platform.openai.com/settings/organization/billing"
        exit 1 ;;
      *spend_limit_exceeded|*usage_limit_exceeded)
        echo "✗ 설정한 지출/사용 한도에 도달했습니다 ($err_code). 한도 설정을 확인하세요."
        echo "  https://platform.openai.com/settings/organization/limits"
        exit 1 ;;
      *) echo "✗ 429 (${err_code:-rate limit}) — 잠시 후 다시 시도하세요: $(json ping "d['error']['message']")"; exit 1 ;;
    esac ;;
  400|404) echo "✗ HTTP $code — 모델/요청 문제: $(json ping "d.get('error',{}).get('message','')")"; exit 1 ;;
  401) echo "✗ 401 — 키가 올바르지 않습니다."; exit 1 ;;
  *)   echo "✗ HTTP $code: $(json ping "d.get('error',{}).get('message','')")"; exit 1 ;;
esac
