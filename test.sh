#!/bin/bash
# DocuSense — full endpoint test script
#
# Requires: curl, jq (brew install jq / sudo apt install jq / sudo dnf install jq)
# Requires: a real PDF/TXT file to upload -- set TEST_FILE below.
#
# Run section by section (recommended the first time), or the whole file at
# once once you trust it: bash test-all-endpoints.sh
#
# Uses cookies.txt to persist the httpOnly refresh cookie across curl calls,
# the same way a real browser would.

set -e

BASE="http://localhost:5000/api/v1"
TEST_FILE="./sample.pdf"   # <-- point this at a real PDF/DOCX/TXT on your machine
COOKIE_JAR="./cookies.txt"

hr_email="hr_$(date +%s)@test.com"
emp_email="emp_$(date +%s)@test.com"
password="password123"

echo "================================================================"
echo "HEALTH CHECK"
echo "================================================================"
curl -s "$BASE/health"; echo

echo "================================================================"
echo "AUTH -- register HR"
echo "================================================================"
HR_REGISTER=$(curl -s -c "$COOKIE_JAR" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"HR Person\",\"email\":\"$hr_email\",\"password\":\"$password\",\"role\":\"HR\"}")
echo "$HR_REGISTER" | jq .
HR_TOKEN=$(echo "$HR_REGISTER" | jq -r '.data.accessToken')

echo "================================================================"
echo "AUTH -- register Employee"
echo "================================================================"
EMP_REGISTER=$(curl -s -c "$COOKIE_JAR" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Employee Person\",\"email\":\"$emp_email\",\"password\":\"$password\",\"role\":\"EMPLOYEE\"}")
echo "$EMP_REGISTER" | jq .
EMP_TOKEN=$(echo "$EMP_REGISTER" | jq -r '.data.accessToken')
EMP_ID=$(echo "$EMP_REGISTER" | jq -r '.data.user.id')

echo "================================================================"
echo "AUTH -- login (re-login as HR to prove login works independently)"
echo "================================================================"
HR_LOGIN=$(curl -s -c "$COOKIE_JAR" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$hr_email\",\"password\":\"$password\"}")
echo "$HR_LOGIN" | jq .
HR_TOKEN=$(echo "$HR_LOGIN" | jq -r '.data.accessToken')

echo "================================================================"
echo "AUTH -- me"
echo "================================================================"
curl -s "$BASE/auth/me" -H "Authorization: Bearer $HR_TOKEN" | jq .

echo "================================================================"
echo "AUTH -- refresh (uses the httpOnly cookie saved in cookies.txt)"
echo "================================================================"
curl -s -b "$COOKIE_JAR" -X POST "$BASE/auth/refresh" | jq .

echo "================================================================"
echo "AUTH -- forgot-password (check server terminal for the [DEV] log line if SMTP isn't configured)"
echo "================================================================"
curl -s -X POST "$BASE/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$hr_email\"}" | jq .
echo "^ copy the token from your server's terminal log, then run manually:"
echo 'curl -X POST '"$BASE"'/auth/reset-password -H "Content-Type: application/json" -d "{\"token\":\"<paste>\",\"newPassword\":\"newpassword123\"}"'

echo "================================================================"
echo "AUTH -- Google Sign-In (browser only, cannot be curl'd meaningfully)"
echo "================================================================"
echo "Open in a real browser: $BASE/auth/google"

echo "================================================================"
echo "HR -- directory search"
echo "================================================================"
curl -s "$BASE/hr/directory/search?q=Employee" -H "Authorization: Bearer $HR_TOKEN" | jq .

echo "================================================================"
echo "HR -- create group"
echo "================================================================"
GROUP=$(curl -s -X POST "$BASE/hr/groups" \
  -H "Authorization: Bearer $HR_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Group\",\"memberIds\":[\"$EMP_ID\"]}")
echo "$GROUP" | jq .
GROUP_ID=$(echo "$GROUP" | jq -r '.data.group._id')

echo "================================================================"
echo "HR -- list groups"
echo "================================================================"
curl -s "$BASE/hr/groups" -H "Authorization: Bearer $HR_TOKEN" | jq .

echo "================================================================"
echo "HR -- get one group"
echo "================================================================"
curl -s "$BASE/hr/groups/$GROUP_ID" -H "Authorization: Bearer $HR_TOKEN" | jq .

echo "================================================================"
echo "HR -- update group"
echo "================================================================"
curl -s -X PATCH "$BASE/hr/groups/$GROUP_ID" \
  -H "Authorization: Bearer $HR_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Renamed Test Group"}' | jq .

echo "================================================================"
echo "DOCUMENTS -- upload (HR)"
echo "================================================================"
if [ -f "$TEST_FILE" ]; then
  UPLOAD=$(curl -s -X POST "$BASE/documents" \
    -H "Authorization: Bearer $HR_TOKEN" \
    -F "title=Test Document" \
    -F "file=@$TEST_FILE")
  echo "$UPLOAD" | jq .
  DOC_ID=$(echo "$UPLOAD" | jq -r '.data.document._id')
else
  echo "SKIPPED -- set TEST_FILE at the top of this script to a real file path"
  exit 1
fi

echo "================================================================"
echo "DOCUMENTS -- list my uploads (HR)"
echo "================================================================"
curl -s "$BASE/documents" -H "Authorization: Bearer $HR_TOKEN" | jq .

echo "================================================================"
echo "DOCUMENTS -- get one (HR, owner)"
echo "================================================================"
curl -s "$BASE/documents/$DOC_ID" -H "Authorization: Bearer $HR_TOKEN" | jq .

echo "================================================================"
echo "DOCUMENTS -- update guidelines"
echo "================================================================"
curl -s -X PATCH "$BASE/documents/$DOC_ID/guidelines" \
  -H "Authorization: Bearer $HR_TOKEN" -H "Content-Type: application/json" \
  -d '{"guidelines":"Read section 2 before your first shift."}' | jq .

echo "================================================================"
echo "DOCUMENTS -- download URL (HR, owner)"
echo "================================================================"
curl -s "$BASE/documents/$DOC_ID/download" -H "Authorization: Bearer $HR_TOKEN" | jq .

echo "================================================================"
echo "ACCESS -- grant to the employee, lifetime"
echo "================================================================"
GRANT=$(curl -s -X POST "$BASE/documents/$DOC_ID/access" \
  -H "Authorization: Bearer $HR_TOKEN" -H "Content-Type: application/json" \
  -d "{\"targetType\":\"USER\",\"targetId\":\"$EMP_ID\",\"accessType\":\"LIFETIME\"}")
echo "$GRANT" | jq .
ACCESS_ID=$(echo "$GRANT" | jq -r '.data.access._id')

echo "================================================================"
echo "ACCESS -- list access for this document (audit view)"
echo "================================================================"
curl -s "$BASE/documents/$DOC_ID/access" -H "Authorization: Bearer $HR_TOKEN" | jq .

echo "================================================================"
echo "DOCUMENTS -- list shared with me (Employee)"
echo "================================================================"
curl -s "$BASE/documents/mine" -H "Authorization: Bearer $EMP_TOKEN" | jq .

echo "================================================================"
echo "DOCUMENTS -- get one (Employee, via access grant)"
echo "================================================================"
curl -s "$BASE/documents/$DOC_ID" -H "Authorization: Bearer $EMP_TOKEN" | jq .

echo "================================================================"
echo "DOCUMENTS -- download URL (Employee, via access grant)"
echo "================================================================"
curl -s "$BASE/documents/$DOC_ID/download" -H "Authorization: Bearer $EMP_TOKEN" | jq .

echo "================================================================"
echo "RAG -- status (poll until READY -- may need to wait a few seconds and re-run)"
echo "================================================================"
curl -s "$BASE/documents/$DOC_ID/rag-status" -H "Authorization: Bearer $HR_TOKEN" | jq .
echo "If not READY yet, wait 5-10s and re-run the line above before continuing."

echo "================================================================"
echo "RAG -- ask a real question (Employee)"
echo "================================================================"
curl -s -X POST "$BASE/documents/$DOC_ID/chat" \
  -H "Authorization: Bearer $EMP_TOKEN" -H "Content-Type: application/json" \
  -d '{"question":"What is this document about?"}' | jq .

echo "================================================================"
echo "RAG -- the guardrail: an unrelated/off-topic question"
echo "================================================================"
curl -s -X POST "$BASE/documents/$DOC_ID/chat" \
  -H "Authorization: Bearer $EMP_TOKEN" -H "Content-Type: application/json" \
  -d '{"question":"What is 2+3?"}' | jq .
echo "^ expect wasAnswerable: false here"

echo "================================================================"
echo "RAG -- chat history"
echo "================================================================"
curl -s "$BASE/documents/$DOC_ID/chat/history" -H "Authorization: Bearer $EMP_TOKEN" | jq .

echo "================================================================"
echo "ACCESS -- revoke, then confirm the employee loses access"
echo "================================================================"
curl -s -o /dev/null -w "revoke status: %{http_code}\n" -X DELETE \
  "$BASE/documents/$DOC_ID/access/$ACCESS_ID" -H "Authorization: Bearer $HR_TOKEN"

curl -s "$BASE/documents/$DOC_ID/download" -H "Authorization: Bearer $EMP_TOKEN" | jq .
echo "^ expect a 404 DOCUMENT_NOT_FOUND here now"

echo "================================================================"
echo "DOCUMENTS -- delete (soft-delete, cascades to revoke remaining access)"
echo "================================================================"
curl -s -o /dev/null -w "delete status: %{http_code}\n" -X DELETE \
  "$BASE/documents/$DOC_ID" -H "Authorization: Bearer $HR_TOKEN"

curl -s "$BASE/documents" -H "Authorization: Bearer $HR_TOKEN" | jq .
echo "^ the deleted document should no longer appear"

echo "================================================================"
echo "HR -- delete group (cascades to revoke its access grants too)"
echo "================================================================"
curl -s -o /dev/null -w "delete group status: %{http_code}\n" -X DELETE \
  "$BASE/hr/groups/$GROUP_ID" -H "Authorization: Bearer $HR_TOKEN"

echo "================================================================"
echo "AUTH -- logout"
echo "================================================================"
curl -s -b "$COOKIE_JAR" -X POST "$BASE/auth/logout" -H "Authorization: Bearer $HR_TOKEN" | jq .

echo "================================================================"
echo "DONE. Every endpoint has now been exercised at least once."
echo "================================================================"