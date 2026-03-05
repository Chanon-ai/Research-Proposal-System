# IAM Sub-Agents (from PRD-IAM-Enterprise)

เอกสารชุดนี้แยกจาก PRD หลัก:
- `/Users/git-mfu/stack/template/docs/PRD-IAM-Enterprise.md`

## Agent List
- `agent-01-product-owner.md`
- `agent-02-backend.md`
- `agent-03-frontend.md`
- `agent-04-security-iam.md`
- `agent-05-data-model.md`
- `agent-06-qa-uat.md`
- `agent-07-release-ops.md`

## Suggested Execution Order
1. Product Owner: แตก scope และ FR ที่จะทำในรอบนั้น
2. Data Model: ยืนยัน schema/contract ก่อนลงมือ
3. Backend: ทำ API และ business rules
4. Security IAM: ตรวจ authz/authn และ audit
5. Frontend: ผูก UI + API + route permission
6. QA/UAT: ทดสอบตาม AC/UAT scenarios
7. Release/Ops: rollout plan + monitoring + handoff

## Common Output Format (ทุก Agent ต้องส่ง)
1. ไฟล์ที่แก้
2. สิ่งที่เปลี่ยน
3. วิธีทดสอบ (command + expected result)
4. ความเสี่ยง/ผลกระทบ

