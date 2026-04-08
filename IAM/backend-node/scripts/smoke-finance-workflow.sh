#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8081/api/v1}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
FINANCE_TOKEN="${FINANCE_TOKEN:-}"
PROPOSAL_ID="${PROPOSAL_ID:-}"
FINANCE_OFFICER_ID="${FINANCE_OFFICER_ID:-}"
SUMMARY_COMMENT="${SUMMARY_COMMENT:-Budget checked by smoke test}"

if [[ -n "${1:-}" ]]; then BASE_URL="$1"; fi
if [[ -n "${2:-}" ]]; then ADMIN_TOKEN="$2"; fi
if [[ -n "${3:-}" ]]; then FINANCE_TOKEN="$3"; fi
if [[ -n "${4:-}" ]]; then PROPOSAL_ID="$4"; fi
if [[ -n "${5:-}" ]]; then FINANCE_OFFICER_ID="$5"; fi

if [[ -z "$ADMIN_TOKEN" || -z "$FINANCE_TOKEN" || -z "$PROPOSAL_ID" ]]; then
  echo "Usage:"
  echo "  ADMIN_TOKEN='<admin token>' FINANCE_TOKEN='<finance token>' PROPOSAL_ID='<proposal id>' $0 [BASE_URL] [ADMIN_TOKEN] [FINANCE_TOKEN] [PROPOSAL_ID] [FINANCE_OFFICER_ID]"
  exit 1
fi

json_get() {
  node -e "
    const obj = JSON.parse(process.argv[1]);
    const path = process.argv[2].split('.');
    let cur = obj;
    for (const p of path) cur = cur?.[p];
    if (cur === undefined || cur === null) process.exit(2);
    process.stdout.write(typeof cur === 'string' ? cur : JSON.stringify(cur));
  " "$1" "$2"
}

split_response() {
  local raw="$1"
  HTTP_BODY="$(printf "%s" "$raw" | sed '$d')"
  HTTP_CODE="$(printf "%s" "$raw" | tail -n 1)"
}

http_get_with_token() {
  local url="$1"
  local token="$2"
  curl -sS -w "\n%{http_code}" -X GET "$url" \
    -H "Content-Type: application/json" \
    -H "x-access-token: $token"
}

http_post_with_token() {
  local url="$1"
  local token="$2"
  local body="$3"
  curl -sS -w "\n%{http_code}" -X POST "$url" \
    -H "Content-Type: application/json" \
    -H "x-access-token: $token" \
    -d "$body"
}

echo "==> Resolve finance officer id"
if [[ -z "$FINANCE_OFFICER_ID" ]]; then
  USERS_RAW="$(http_get_with_token "$BASE_URL/proposals/committee-users?role=finance_officer" "$ADMIN_TOKEN")"
  split_response "$USERS_RAW"
  if [[ "$HTTP_CODE" != "200" ]]; then
    echo "Failed to list finance officers (HTTP $HTTP_CODE)"
    echo "$HTTP_BODY"
    exit 2
  fi
  FINANCE_OFFICER_ID="$(node -e "
    const obj = JSON.parse(process.argv[1]);
    const list = Array.isArray(obj?.data) ? obj.data : (obj?.data?.data || []);
    if (!list.length || !list[0]?._id) process.exit(2);
    process.stdout.write(String(list[0]._id));
  " "$HTTP_BODY")"
fi
echo "financeOfficerId: $FINANCE_OFFICER_ID"

echo "==> 1) Verify proposal is reachable by admin"
DETAIL_RAW="$(http_get_with_token "$BASE_URL/proposals/$PROPOSAL_ID" "$ADMIN_TOKEN")"
split_response "$DETAIL_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Failed to load proposal detail (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 3
fi

CURRENT_STATUS="$(json_get "$HTTP_BODY" "data.currentStatus")"
echo "currentStatus: $CURRENT_STATUS"
if [[ "$CURRENT_STATUS" != "office_received" && "$CURRENT_STATUS" != "finance_budget_checking" ]]; then
  echo "Proposal must be in office_received or finance_budget_checking before assignment"
  exit 4
fi

echo "==> 2) Assign finance officer"
ASSIGN_BODY="{\"financeOfficerIds\":[\"$FINANCE_OFFICER_ID\"]}"
ASSIGN_RAW="$(http_post_with_token "$BASE_URL/proposals/$PROPOSAL_ID/assign-finance-officer" "$ADMIN_TOKEN" "$ASSIGN_BODY")"
split_response "$ASSIGN_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Assign finance officer failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 5
fi

echo "==> 3) Verify assignment state"
VERIFY_ASSIGN_RAW="$(http_get_with_token "$BASE_URL/proposals/$PROPOSAL_ID" "$ADMIN_TOKEN")"
split_response "$VERIFY_ASSIGN_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Reload proposal after assign failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 6
fi
node -e "
  const obj = JSON.parse(process.argv[1]);
  const proposal = obj?.data || obj;
  const assigned = (proposal?.financeAssignment?.assignedFinanceOfficerIds || []).map(String);
  const status = String(proposal?.currentStatus || '');
  const assignStatus = String(proposal?.financeAssignment?.status || '');
  const financeId = String(process.argv[2]);
  if (status !== 'finance_budget_checking') process.exit(2);
  if (assignStatus !== 'pending') process.exit(3);
  if (!assigned.includes(financeId)) process.exit(4);
" "$HTTP_BODY" "$FINANCE_OFFICER_ID"
echo "Assignment OK"

echo "==> 4) Verify finance officer can see assigned proposal"
FINANCE_LIST_RAW="$(http_get_with_token "$BASE_URL/proposals?limit=200" "$FINANCE_TOKEN")"
split_response "$FINANCE_LIST_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Finance list query failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 7
fi
node -e "
  const obj = JSON.parse(process.argv[1]);
  const proposalId = String(process.argv[2]);
  const list = Array.isArray(obj?.data?.proposals) ? obj.data.proposals : (Array.isArray(obj?.data?.data) ? obj.data.data : (Array.isArray(obj?.data) ? obj.data : []));
  const found = list.some(x => String(x?._id) === proposalId);
  process.exit(found ? 0 : 2);
" "$HTTP_BODY" "$PROPOSAL_ID"
echo "Finance list visibility OK"

echo "==> 5) Save draft review"
DRAFT_BODY="{\"summaryComment\":\"$SUMMARY_COMMENT\",\"isSubmit\":false}"
DRAFT_RAW="$(http_post_with_token "$BASE_URL/proposals/$PROPOSAL_ID/finance-review" "$FINANCE_TOKEN" "$DRAFT_BODY")"
split_response "$DRAFT_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Finance draft save failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 8
fi

echo "==> 6) Verify draft persisted"
FINANCE_DETAIL_RAW="$(http_get_with_token "$BASE_URL/proposals/$PROPOSAL_ID" "$FINANCE_TOKEN")"
split_response "$FINANCE_DETAIL_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Finance detail query failed after draft (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 9
fi
node -e "
  const obj = JSON.parse(process.argv[1]);
  const proposal = obj?.data || obj;
  const comment = String(proposal?.financeAssignment?.summaryComment || '');
  const status = String(proposal?.currentStatus || '');
  const assignStatus = String(proposal?.financeAssignment?.status || '');
  const expected = String(process.argv[2]);
  if (status !== 'finance_budget_checking') process.exit(2);
  if (assignStatus !== 'pending') process.exit(3);
  if (comment !== expected) process.exit(4);
" "$HTTP_BODY" "$SUMMARY_COMMENT"
echo "Draft persistence OK"

echo "==> 7) Submit finance review"
SUBMIT_BODY="{\"summaryComment\":\"$SUMMARY_COMMENT\",\"isSubmit\":true}"
SUBMIT_RAW="$(http_post_with_token "$BASE_URL/proposals/$PROPOSAL_ID/finance-review" "$FINANCE_TOKEN" "$SUBMIT_BODY")"
split_response "$SUBMIT_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Finance submit failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 10
fi

echo "==> 8) Verify final status moved to document_checking"
FINAL_RAW="$(http_get_with_token "$BASE_URL/proposals/$PROPOSAL_ID" "$ADMIN_TOKEN")"
split_response "$FINAL_RAW"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Final proposal reload failed (HTTP $HTTP_CODE)"
  echo "$HTTP_BODY"
  exit 11
fi
node -e "
  const obj = JSON.parse(process.argv[1]);
  const proposal = obj?.data || obj;
  const status = String(proposal?.currentStatus || '');
  const assignStatus = String(proposal?.financeAssignment?.status || '');
  const submittedBy = String(proposal?.financeAssignment?.submittedBy || '');
  const comment = String(proposal?.financeAssignment?.summaryComment || '');
  const expectedComment = String(process.argv[2]);
  if (status !== 'document_checking') process.exit(2);
  if (assignStatus !== 'submitted') process.exit(3);
  if (!submittedBy) process.exit(4);
  if (comment !== expectedComment) process.exit(5);
" "$HTTP_BODY" "$SUMMARY_COMMENT"
echo "Final status OK"

echo
echo "Smoke finance workflow test passed."