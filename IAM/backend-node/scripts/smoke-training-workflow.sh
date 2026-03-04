#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8081/api/v1}"
X_ACCESS_TOKEN="${X_ACCESS_TOKEN:-}"
REQUESTER_ID="${REQUESTER_ID:-}"
APPROVER_ID="${APPROVER_ID:-}"
COURSE_ID="${COURSE_ID:-}"

if [[ -n "${1:-}" ]]; then BASE_URL="$1"; fi
if [[ -n "${2:-}" ]]; then X_ACCESS_TOKEN="$2"; fi
if [[ -n "${3:-}" ]]; then REQUESTER_ID="$3"; fi
if [[ -n "${4:-}" ]]; then APPROVER_ID="$4"; fi
if [[ -n "${5:-}" ]]; then COURSE_ID="$5"; fi

if [[ -z "$X_ACCESS_TOKEN" ]]; then
  echo "Usage:"
  echo "  X_ACCESS_TOKEN='<token>' $0 [BASE_URL] [X_ACCESS_TOKEN] [REQUESTER_ID] [APPROVER_ID] [COURSE_ID]"
  exit 1
fi

json_get() {
  node -e "
    const obj = JSON.parse(process.argv[1]);
    const path = process.argv[2].split('.');
    let cur = obj;
    for (const p of path) cur = cur?.[p];
    if (cur === undefined || cur === null) process.exit(2);
    process.stdout.write(String(cur));
  " "$1" "$2"
}

json_first_id() {
  node -e "
    const obj = JSON.parse(process.argv[1]);
    const list = Array.isArray(obj?.data) ? obj.data : (obj?.data?.data || []);
    if (!list.length || !list[0]?._id) process.exit(2);
    process.stdout.write(String(list[0]._id));
  " "$1"
}

split_response() {
  local raw="$1"
  HTTP_BODY="$(printf "%s" "$raw" | sed '$d')"
  HTTP_CODE="$(printf "%s" "$raw" | tail -n 1)"
}

http_get() {
  curl -sS -w "\n%{http_code}" -X GET "$1" \
    -H "Content-Type: application/json" \
    -H "x-access-token: $X_ACCESS_TOKEN"
}

http_post() {
  curl -sS -w "\n%{http_code}" -X POST "$1" \
    -H "Content-Type: application/json" \
    -H "x-access-token: $X_ACCESS_TOKEN" \
    -d "$2"
}

http_put() {
  curl -sS -w "\n%{http_code}" -X PUT "$1" \
    -H "Content-Type: application/json" \
    -H "x-access-token: $X_ACCESS_TOKEN" \
    -d "$2"
}

today="$(date +%F)"
start_date="$(date -v+7d +%F 2>/dev/null || date -d '+7 day' +%F)"
end_date="$(date -v+10d +%F 2>/dev/null || date -d '+10 day' +%F)"
stamp="$(date +%s)"

echo "==> Resolve requester / approver"
if [[ -z "$REQUESTER_ID" || -z "$APPROVER_ID" ]]; then
  ME_RAW="$(http_get "$BASE_URL/auth/me")"
  split_response "$ME_RAW"
  if [[ "$HTTP_CODE" != "200" ]]; then
    echo "Failed /auth/me (HTTP $HTTP_CODE)"
    echo "$HTTP_BODY"
    exit 2
  fi
  if [[ -z "$REQUESTER_ID" ]]; then REQUESTER_ID="$(json_get "$HTTP_BODY" "data._id")"; fi
  if [[ -z "$APPROVER_ID" ]]; then APPROVER_ID="$REQUESTER_ID"; fi
fi
echo "requester: $REQUESTER_ID"
echo "approver : $APPROVER_ID"

echo "==> Resolve course"
if [[ -z "$COURSE_ID" ]]; then
  COURSE_RAW="$(http_get "$BASE_URL/setting/training-courses?state=true")"
  split_response "$COURSE_RAW"
  if [[ "$HTTP_CODE" != "200" ]]; then
    echo "Failed /setting/training-courses (HTTP $HTTP_CODE)"
    echo "$HTTP_BODY"
    exit 3
  fi
  if COURSE_ID="$(json_first_id "$HTTP_BODY" 2>/dev/null)"; then
    echo "Use existing course: $COURSE_ID"
  else
    CREATE_COURSE_BODY="$(cat <<JSON
{
  "code":"AUTO-COURSE-$stamp",
  "title":[{"key":"en","value":"Automated course $today"}],
  "description":[{"key":"en","value":"created by smoke-training-workflow"}],
  "provider":"Automation",
  "category":"SMOKE",
  "durationHours":3,
  "state":true
}
JSON
)"
    CREATE_COURSE_RAW="$(http_post "$BASE_URL/setting/training-courses" "$CREATE_COURSE_BODY")"
    split_response "$CREATE_COURSE_RAW"
    if [[ "$HTTP_CODE" != "200" ]]; then
      echo "Create course failed (HTTP $HTTP_CODE)"
      echo "$HTTP_BODY"
      exit 4
    fi
    COURSE_ID="$(json_get "$HTTP_BODY" "data._id")"
    echo "Course created: $COURSE_ID"
  fi
fi

echo "==> 1) Create training request"
CREATE_REQ_BODY="$(cat <<JSON
{
  "requester":"$REQUESTER_ID",
  "course":"$COURSE_ID",
  "title":[{"key":"en","value":"Training request smoke $today"}],
  "reason":[{"key":"en","value":"Automated workflow smoke test"}],
  "trainingStart":"$start_date",
  "trainingEnd":"$end_date",
  "steps":[{"order":1,"approver":"$APPROVER_ID"}]
}
JSON
)"
CREATE_REQ_RAW="$(http_post "$BASE_URL/training/requests" "$CREATE_REQ_BODY")"
split_response "$CREATE_REQ_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Create request failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 5
fi
REQUEST_ID="$(json_get "$HTTP_BODY" "data._id")"
echo "Request created: $REQUEST_ID"

echo "==> 2) Submit request"
SUBMIT_BODY="{\"_id\":\"$REQUEST_ID\",\"requesterId\":\"$REQUESTER_ID\",\"note\":\"submit by smoke\"}"
SUBMIT_RAW="$(http_put "$BASE_URL/training/requests/submit" "$SUBMIT_BODY")"
split_response "$SUBMIT_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Submit failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 6
fi
echo "Submit OK"

echo "==> 3) Approve request"
APPROVE_BODY="{\"_id\":\"$REQUEST_ID\",\"approverId\":\"$APPROVER_ID\",\"note\":\"approve by smoke\"}"
APPROVE_RAW="$(http_put "$BASE_URL/training/requests/approve" "$APPROVE_BODY")"
split_response "$APPROVE_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Approve failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 7
fi
echo "Approve OK"

echo "==> 4) Complete request"
COMPLETE_BODY="{\"_id\":\"$REQUEST_ID\",\"actorId\":\"$REQUESTER_ID\",\"recordStatus\":\"completed\",\"score\":95,\"resultNote\":\"passed by smoke\"}"
COMPLETE_RAW="$(http_put "$BASE_URL/training/requests/complete" "$COMPLETE_BODY")"
split_response "$COMPLETE_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Complete failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 8
fi
echo "Complete OK"

echo "==> 5) Verify record"
RECORDS_RAW="$(http_get "$BASE_URL/training/records?requestId=$REQUEST_ID")"
split_response "$RECORDS_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Query records failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 9
fi
node -e "
  const obj = JSON.parse(process.argv[1]);
  const reqId = process.argv[2];
  const list = Array.isArray(obj?.data) ? obj.data : (obj?.data?.data || []);
  const found = list.find(x => String(x?.request?._id || x?.request) === reqId);
  if (!found) process.exit(2);
  if (String(found.status) !== 'completed') process.exit(3);
" "$HTTP_BODY" "$REQUEST_ID"
echo "Record OK"

echo "==> 6) Verify actions"
ACTIONS_RAW="$(http_get "$BASE_URL/training/actions?requestId=$REQUEST_ID")"
split_response "$ACTIONS_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Query actions failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 10
fi
node -e "
  const obj = JSON.parse(process.argv[1]);
  const list = Array.isArray(obj?.data) ? obj.data : (obj?.data?.data || []);
  const acts = list.map(x => x?.action);
  const need = ['submit','approve','complete'];
  const ok = need.every(a => acts.includes(a));
  if (!ok) process.exit(2);
" "$HTTP_BODY"
echo "Actions OK"

echo "==> 7) Verify audit"
AUDIT_RAW="$(http_get "$BASE_URL/audit/logs?module=training&resourceId=$REQUEST_ID")"
split_response "$AUDIT_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Audit query failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 11
fi
node -e "
  const obj = JSON.parse(process.argv[1]);
  const list = Array.isArray(obj?.data) ? obj.data : (obj?.data?.data || []);
  if (!list.length) process.exit(2);
" "$HTTP_BODY"
echo "Audit OK"

echo
echo "Smoke training workflow test passed."
