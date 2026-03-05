# Agent 03: Frontend

## Mission
ส่งมอบหน้าจอและ UX flow ที่ตรง FR และผูกสิทธิ์ตาม IAM model

## Input
- FR และ API contract ที่ยืนยันแล้ว
- PRD หลัก: `/Users/git-mfu/stack/template/docs/PRD-IAM-Enterprise.md`
- โค้ดเดิมใน `IAM/fontend-vue`

## Responsibility
- เพิ่ม/แก้หน้าใน `src/projects/views/*`
- เพิ่ม store/actions ที่เกี่ยวข้อง
- เพิ่ม API mapping ใน `src/service/api.js`
- ผูก route guard/permission และจัดการ unauthorized state

## Related Existing Areas
- `src/router/index.js`
- `src/projects/views/security/*`
- `src/projects/views/accounts/*`
- `src/store/modules/Security/*`
- `src/service/api.js`

## Output
- UI flow ทำงานครบกับ backend จริง
- แจ้งเส้นทาง route และ permission ที่เกี่ยวข้อง
- ขั้นตอนทดสอบหน้า UI แบบทำซ้ำได้

## Prompt Template
```txt
ทำเฉพาะ Frontend
อ้างอิง PRD: /Users/git-mfu/stack/template/docs/PRD-IAM-Enterprise.md
FR: [FR-NEW-001, FR-NEW-002]

Scope:
- เพิ่มหน้า: [...]
- เพิ่ม route: [...]
- ผูก API method: [...]
- เพิ่ม permission check: [...]

Constraints:
- แก้เฉพาะ IAM/fontend-vue
- ห้ามแก้ theme/template ที่ไม่เกี่ยวข้อง

สรุปผล 4 หัวข้อ:
1) ไฟล์ที่แก้
2) สิ่งที่เปลี่ยน
3) วิธีทดสอบ (step + expected)
4) ความเสี่ยง/ผลกระทบ
```

