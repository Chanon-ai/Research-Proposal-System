# PRD: IAM System (Enterprise)

## 1. Document Control
- Product: IAM (Identity and Access Management)
- Version: v0.1 (Repo-based draft)
- Source code references:
  - `/Users/git-mfu/stack/template/IAM/backend-node/server/routes/app.routes.js`
  - `/Users/git-mfu/stack/template/IAM/backend-node/server/Project/accounts/accounts.routes.js`
  - `/Users/git-mfu/stack/template/IAM/backend-node/server/Project/security/security.routes.js`
  - `/Users/git-mfu/stack/template/IAM/backend-node/server/Project/settings/settings.routes.js`
  - `/Users/git-mfu/stack/template/IAM/backend-node/server/Project/accounts/service/account.js`
  - `/Users/git-mfu/stack/template/IAM/backend-node/server/Project/security/service/permission.js`
  - `/Users/git-mfu/stack/template/IAM/fontend-vue/src/service/api.js`

## 2. Executive Summary
ระบบ IAM นี้มีเป้าหมายเพื่อรวมศูนย์การยืนยันตัวตนและการกำหนดสิทธิ์การเข้าถึงสำหรับผู้ใช้ในองค์กร โดยครอบคลุมการเข้าสู่ระบบ, 2FA, trusted device, การจัดการบัญชีผู้ใช้, การจัดการกลุ่มสิทธิ์, permission matrix และ master settings ที่เกี่ยวข้อง

## 3. Business Objectives
- ลดความเสี่ยงด้านการเข้าถึงข้อมูลเกินสิทธิ์
- เพิ่มความสามารถในการตรวจสอบย้อนหลัง (auditability)
- ทำให้การจัดการบัญชีผู้ใช้และสิทธิ์ทำได้จากศูนย์กลาง
- รองรับการขยายโมดูลใหม่โดยยังใช้โมเดล permission เดิมได้

## 4. Scope
### In Scope
- Authentication:
  - `POST /api/v1/signin`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/2fa/request`
  - `POST /api/v1/auth/2fa/verify`
  - `POST /api/v1/auth/trust-device`
- Accounts:
  - `GET /api/v1/accounts`
  - `PUT /api/v1/accounts/:id`
  - `GET /api/v1/accounts/group/options`
  - `GET /api/v1/accounts/:id/effective-permissions`
  - `GET /api/v1/accounts/status/options`
  - `PUT /api/v1/accounts/:id/status`
- Security:
  - `type/menu/group/permission/assignment` CRUD
  - batch permission update/create
  - `GET /api/v1/security/permission/my`
- Settings:
  - `message`, `status`, `groups`, `verification`, `auth/message`

### Out of Scope
- ระบบ HR/Employment เชิงธุรกิจเต็มรูปแบบ
- รายงาน BI เชิงลึก
- External IAM federation ที่นอกเหนือ flow ปัจจุบัน

## 5. Personas
- IAM Admin: จัดการ menu/group/permission/assignment
- Security Admin: ดูแล auth policy, 2FA message, verification rules
- Account Admin: ดูแลบัญชีผู้ใช้และสถานะบัญชี
- End User: sign in และใช้งานระบบตามสิทธิ์

## 6. Current Product Flows (As-Is)
1. ผู้ใช้ส่ง Google ID token เพื่อ sign in
2. ระบบตรวจ account และสถานะบัญชี
3. ระบบสร้าง session token (`x-access-token`) และผูกกับอุปกรณ์
4. ถ้าไม่ใช่ trusted device ต้องยืนยัน 2FA
5. ระบบตรวจสิทธิ์ด้วย permission matrix + data scope (`self`, `unit`, `org`)
6. ผู้ดูแลระบบจัดการสิทธิ์ผ่าน security/settings modules

## 7. Functional Requirements

### 7.1 Authentication
- FR-AUTH-001: ระบบต้องรองรับ sign in ด้วย Google ID token
- FR-AUTH-002: ระบบต้องรองรับ endpoint `auth/me` สำหรับข้อมูลผู้ใช้ปัจจุบัน
- FR-AUTH-003: ระบบต้องรองรับการขอและยืนยัน 2FA
- FR-AUTH-004: ระบบต้องรองรับ trusted device พร้อมวันหมดอายุ
- FR-AUTH-005: ระบบต้องบล็อกการ sign in หากสถานะบัญชีไม่อนุญาต

### 7.2 Accounts
- FR-ACC-001: ระบบต้องแสดงรายการบัญชีผู้ใช้ได้
- FR-ACC-002: ระบบต้องแก้ไขข้อมูลบัญชีผู้ใช้ได้
- FR-ACC-003: ระบบต้องเปลี่ยนสถานะบัญชีได้ตาม transition rule
- FR-ACC-004: ระบบต้องคืน effective permissions ของบัญชีได้

### 7.3 Security
- FR-SEC-001: ระบบต้องรองรับ CRUD สำหรับ Type
- FR-SEC-002: ระบบต้องรองรับ CRUD สำหรับ Menu
- FR-SEC-003: ระบบต้องรองรับ CRUD สำหรับ Group
- FR-SEC-004: ระบบต้องรองรับ CRUD สำหรับ Permission
- FR-SEC-005: ระบบต้องรองรับ batch create/update ของ Permission
- FR-SEC-006: ระบบต้องรองรับ CRUD สำหรับ Assignment
- FR-SEC-007: ระบบต้องรองรับ endpoint `permission/my` เพื่อประเมิน `allowed`

### 7.4 Settings
- FR-SET-001: ระบบต้องรองรับ CRUD สำหรับ Setting Message
- FR-SET-002: ระบบต้องรองรับ CRUD สำหรับ Message Status
- FR-SET-003: ระบบต้องรองรับ CRUD สำหรับ Setting Groups
- FR-SET-004: ระบบต้องรองรับ CRUD สำหรับ Verification
- FR-SET-005: ระบบต้องรองรับ CRUD สำหรับ Auth Message

## 8. Permission Model
- Action flags:
  - `all`, `view`, `edit`, `delete`, `action`, `logs`
- Data scope:
  - `self`, `unit`, `org`
- Access decision:
  - อนุญาตเมื่อผ่านทั้ง menu permission และ data scope

## 9. Non-Functional Requirements (Enterprise Baseline)
- Availability: >= 99.9% monthly
- Performance:
  - API ทั่วไป p95 < 500ms
  - permission check p95 < 300ms
- Security:
  - ใช้ token ใน header `x-access-token`
  - รองรับ 2FA และ trusted device fingerprint
- Audit:
  - บันทึกเหตุการณ์สำคัญอย่างน้อย login, 2FA verify, trust-device, permission update, status change
- Observability:
  - structured logs, error monitoring, traceable request context
- Reliability:
  - มีมาตรฐาน error response และรองรับ failure handling

## 10. Data Entities (High-Level)
- Account
- Account Status
- Device Session (`control.device`)
- Trusted Device (`control.trustedDevices`)
- Type
- Menu
- Group
- Permission
- Assignment
- Setting Message
- Auth Message
- Verification

## 11. Acceptance Criteria (Sample)
- AC-001:
  - Given ผู้ใช้มี Google token ถูกต้อง
  - When เรียก `POST /api/v1/signin`
  - Then ระบบต้องตอบ token session และค่าฟิลด์ `require2FA`
- AC-002:
  - Given ไม่มี trusted device ที่ match
  - When sign in สำเร็จ
  - Then `require2FA` ต้องเป็น `true`
- AC-003:
  - Given ผู้ใช้ไม่มีสิทธิ์ `edit` ใน path เป้าหมาย
  - When เรียก `GET /api/v1/security/permission/my` พร้อม action=edit
  - Then `allowed` ต้องเป็น `false`
- AC-004:
  - Given Admin ส่ง permission batch update
  - When เรียก `PUT /api/v1/security/permission/update/batch`
  - Then ระบบต้องอัปเดตข้อมูลครบหรือคืน error ที่ตรวจสอบได้

## 12. UAT Scenarios
- Login success/fail
- 2FA request/verify success/fail
- Trust device และ re-login บนอุปกรณ์เดิม
- Account status transition และผลต่อการเข้าใช้งาน
- Permission matrix ต่อ route/action
- Data scope self/unit/org กับ target account/unit
- CRUD ครบทุกโมดูล security/settings

## 13. Risks and Gaps
- มี legacy naming บางจุดที่ควรปรับมาตรฐานภายหลัง
- ต้องกำหนดนโยบาย token lifecycle ให้ชัด (expiry/refresh/revoke)
- ต้องกำหนด SLA, SLO และ operational runbook ร่วมกับ Infra/SecOps

## 14. Traceability Template (For New Modules)
ใช้ตารางนี้เมื่อเพิ่มโมดูลใหม่:

| Goal | FR ID | API Endpoint | UI Route | Test Case ID |
|---|---|---|---|---|
| ตัวอย่าง: จำกัดสิทธิ์รายหน่วยงาน | FR-NEW-001 | `GET /api/v1/...` | `/new/module` | TC-NEW-001 |

