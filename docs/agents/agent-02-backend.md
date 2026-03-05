# Agent 02: Backend

## Mission
พัฒนา API และ business logic ตาม FR โดยไม่กระทบ behavior เดิม

## Input
- FR ที่อนุมัติแล้วจาก Product Owner
- PRD หลัก: `/Users/git-mfu/stack/template/docs/PRD-IAM-Enterprise.md`
- โค้ดเดิมใน `IAM/backend-node`

## Responsibility
- เพิ่ม/แก้ route, service, model เฉพาะ scope
- รักษามาตรฐาน response code และ message schema
- ครอบคลุม auth guard ที่เกี่ยวข้อง (`x-access-token`, permission checks)
- เพิ่มจุด audit log สำหรับเหตุการณ์สำคัญ

## Related Existing Areas
- `server/Project/accounts/*`
- `server/Project/security/*`
- `server/Project/settings/*`
- `server/routes/app.routes.js`

## Output
- Endpoint ที่ใช้งานได้ตาม FR
- รายการไฟล์ที่แก้พร้อมเหตุผล
- วิธีทดสอบด้วย curl/postman command

## Prompt Template
```txt
ทำเฉพาะ Backend
อ้างอิง PRD: /Users/git-mfu/stack/template/docs/PRD-IAM-Enterprise.md
FR: [FR-NEW-001, FR-NEW-002]

Scope:
- เพิ่ม endpoint: [...]
- เพิ่ม service/model: [...]
- เพิ่ม audit log: [...]

Constraints:
- แก้เฉพาะ IAM/backend-node
- ห้ามเปลี่ยน behavior เดิมนอก scope

สรุปผล 4 หัวข้อ:
1) ไฟล์ที่แก้
2) สิ่งที่เปลี่ยน
3) วิธีทดสอบ (command + expected)
4) ความเสี่ยง/ผลกระทบ
```

