# Product Requirements Document (PRD)

## ระบบ Identity and Access Management (IAM)

---

## 1. ภาพรวมของโครงการ (Project Overview)

| รายการ | รายละเอียด |
|--------|-----------|
| **ชื่อโครงการ** | IAM — Identity and Access Management System |
| **เวอร์ชัน** | 1.0.0 |
| **วันที่เอกสาร** | 4 มีนาคม 2026 |
| **สถานะ** | In Development |

### คำอธิบาย
ระบบ IAM เป็นแพลตฟอร์มสำหรับบริหารจัดการ **ตัวตนผู้ใช้งาน (Identity)** และ **สิทธิ์การเข้าถึง (Access Control)** แบบ Role-Based Access Control (RBAC) สำหรับองค์กร รองรับการยืนยันตัวตนหลายช่องทาง, การจัดการบัญชีผู้ใช้งาน, การกำหนดสิทธิ์แบบ granular, และการตรวจสอบความปลอดภัยของระบบ

---

## 2. Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Cache | Redis |
| Realtime | Socket.IO v4 |
| Authentication | JWT (jsonwebtoken) |
| 2FA | node-2fa (TOTP) |
| Email | Nodemailer + Google OAuth2 |
| File Storage | AWS S3 |
| OCR | Tesseract.js, node-tesseract-ocr, Google Cloud Vision |
| Face Recognition | TensorFlow.js + @vladmandic/face-api |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Logging | Winston + winston-mongodb |
| Task Scheduler | node-cron |
| Security | express-rate-limit, CORS, x-xss-protection, helmet-like middleware |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | Vue.js 2.x |
| UI Library | CoreUI Pro Vue 3 |
| State Management | Vuex |
| HTTP Client | Axios |
| Realtime | Socket.IO Client |
| OTP Input | @bachdgvn/vue-otp-input |
| Rich Text Editor | Quill |
| Calendar | v-calendar |
| Auth | Google Sign-In (vue-google-oauth2) |
| Face API | @vladmandic/face-api |

---

## 3. สถาปัตยกรรมระบบ (System Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Vue.js)                   │
│          CoreUI Pro + Vuex + Vue Router + Axios          │
└────────────────────────┬────────────────────────────────┘
                         │ REST API / Socket.IO
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)            │
│                                                         │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Accounts   │  │ Security │  │    Settings       │   │
│  │  Module     │  │  Module  │  │    Module         │   │
│  └─────────────┘  └──────────┘  └──────────────────┘   │
│                                                         │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │   JWT Auth  │  │  Redis   │  │   Audit Logger   │   │
│  │   + 2FA     │  │  Cache   │  │   (Winston)      │   │
│  └─────────────┘  └──────────┘  └──────────────────┘   │
└──────────┬──────────────────────────────────────────────┘
           │
    ┌──────┴───────┐
    │   MongoDB    │
    └──────────────┘
```

---

## 4. โมดูลและฟีเจอร์ (Modules & Features)

### 4.1 Authentication Module

#### 4.1.1 การยืนยันตัวตน (Authentication Methods)
| ประเภท | รายละเอียด |
|--------|-----------|
| Username/Password | Standard credential login พร้อม strong password validation |
| Google OAuth2 | Sign-in ผ่าน Google ID Token (verifyIdTokenGoogle) |
| Active Directory | รองรับ LDAP/AD authentication (activedirectory) |
| JWT Token | Stateless session management |

#### 4.1.2 Two-Factor Authentication (2FA)
- ใช้ TOTP (Time-based One-Time Password) ผ่าน `node-2fa`
- Endpoints:
  - `POST /api/v1/auth/2fa/request` — ขอ OTP
  - `POST /api/v1/auth/2fa/verify` — ยืนยัน OTP

#### 4.1.3 Trusted Device Management
- ระบบจดจำ device ที่น่าเชื่อถือด้วย device fingerprint (SHA-256)
- เก็บข้อมูล: `deviceId`, `fingerprint`, `networkKey`, `userAgent`, `lastIp`, `trustedAt`, `expiresAt`
- ค่าเริ่มต้น trusted device หมดอายุใน **30 วัน** (configurable ผ่าน `TRUST_DEVICE_DAYS`)
- Endpoint: `POST /api/v1/auth/trust-device`

---

### 4.2 Account Management Module

**Base URL:** `/api/v1/`

| HTTP Method | Endpoint | Description |
|-------------|----------|-------------|
| POST | `/signin` | เข้าสู่ระบบ (Google OAuth2 + credentials) |
| GET | `/auth/me` | ดึงข้อมูลผู้ใช้งานปัจจุบัน |
| GET | `/accounts` | รายการบัญชีผู้ใช้งานทั้งหมด |
| PUT | `/accounts/:id` | แก้ไขข้อมูลบัญชีผู้ใช้งาน |
| GET | `/accounts/:id/effective-permissions` | ดึงสิทธิ์ที่มีผลจริง |
| GET | `/accounts/group/options` | รายการกลุ่มบัญชี (dropdown) |
| GET | `/accounts/status/options` | รายการสถานะบัญชี (dropdown) |
| PUT | `/accounts/:id/status` | เปลี่ยนสถานะบัญชีผู้ใช้งาน |

#### โครงสร้างข้อมูลบัญชีผู้ใช้งาน (Account Model)

```
Account {
  dateTime        : Date
  group           : ref → Setting_Account_Group
  code            : String
  email           : String
  authen[]        : [{
    type          : ref → Setting_Authen_Type
    username      : String
    password      : String (hashed)
    email         : String
    oAuthToken    : String
  }]
  userinfo {
    prefix[]      : [{ key, value }]   — รองรับหลายภาษา
    firstName[]   : [{ key, value }]   — รองรับหลายภาษา
    lastName[]    : [{ key, value }]   — รองรับหลายภาษา
    image         : String
    cardId        : String             — เลขบัตรประชาชน 13 หลัก
    birthday      : Date
    msisdn        : String             — เบอร์โทรศัพท์
    lineId        : String
    religion      : String
  }
  address[]       : [{
    type          : ref → Setting_AddressType
    address       : String
    province      : ref → Setting_Province
    district      : ref → Setting_District
    subDistrict   : ref → Setting_SubDistrict
    zipcode       : String
    gps           : { latitude, longitude }
  }]
  verification[]  : [{
    type          : ref → Setting_Verification
    dateTime, expired, code, src, status
  }]
  control {
    sso           : Boolean            — Single Sign-On flag
    limit         : Number             — จำกัดจำนวน session
    trustedDevices[] 
    device[]
  }
}
```

---

### 4.3 Security (RBAC) Module

**Base URL:** `/api/v1/security/`

#### 4.3.1 โครงสร้าง RBAC

```
Security_Type  ──→  Security_Menu  (1 type : N menus)
Security_Type  ──→  Security_Group (1 type : N groups)
Security_Group + Security_Menu ──→  Security_Permission
Security_Group ──→  Assignment ──→  Account
```

#### 4.3.2 API Endpoints — Security Type

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/security/type` | รายการประเภทความปลอดภัย |
| POST | `/security/type` | สร้างประเภทใหม่ |
| PUT | `/security/type` | แก้ไขประเภท |
| DELETE | `/security/type` | ลบประเภท |

#### 4.3.3 API Endpoints — Security Menu

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/security/menu` | รายการเมนู |
| POST | `/security/menu` | สร้างเมนูใหม่ (source: `mapped` หรือ `manual`) |
| PUT | `/security/menu` | แก้ไขเมนู |
| DELETE | `/security/menu` | ลบเมนู |

#### 4.3.4 API Endpoints — Security Group

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/security/group` | รายการกลุ่มสิทธิ์ |
| POST | `/security/group` | สร้างกลุ่มใหม่ |
| PUT | `/security/group` | แก้ไขกลุ่ม |
| DELETE | `/security/group` | ลบกลุ่ม |

#### 4.3.5 API Endpoints — Permission

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/security/permission` | รายการ permission ทั้งหมด |
| POST | `/security/permission` | สร้าง permission |
| PUT | `/security/permission` | แก้ไข permission |
| DELETE | `/security/permission` | ลบ permission |
| POST | `/security/permission/create/batch` | สร้าง permission แบบ batch |
| PUT | `/security/permission/update/batch` | อัปเดต permission แบบ batch |
| GET | `/security/permission/my` | ดึง permission ของผู้ใช้ปัจจุบัน |

#### 4.3.6 API Endpoints — Assignment

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/security/assignment` | รายการการมอบหมายกลุ่มสิทธิ์ |
| POST | `/security/assignment` | มอบหมายกลุ่มสิทธิ์ให้บัญชี |
| PUT | `/security/assignment` | แก้ไขการมอบหมาย |
| DELETE | `/security/assignment` | ยกเลิกการมอบหมาย |

#### 4.3.7 Permission Matrix

Permission แต่ละรายการประกอบด้วย permission flags ดังนี้:

| Flag | Description |
|------|-------------|
| `all` | สิทธิ์ทั้งหมด |
| `view` | ดูข้อมูล |
| `edit` | แก้ไขข้อมูล |
| `delete` | ลบข้อมูล |
| `action` | ดำเนินการพิเศษ |
| `logs` | ดู audit logs |

#### Business Rule
- Permission จะมีเฉพาะคู่ `group-menu` ที่ `group.visibleType === menu.type` เท่านั้น
- เมื่อมีการ create/update/delete ของ type/menu/group ระบบจะ `syncPermissions()` อัตโนมัติ

---

### 4.4 Settings Module

**Base URL:** `/api/v1/setting/`

| Sub-module | Endpoints | Description |
|-----------|-----------|-------------|
| Message | CRUD `/message` | ข้อความระบบ (multi-language) |
| Status | CRUD `/status` | สถานะบัญชีผู้ใช้งาน |
| Group | CRUD `/groups` | กลุ่มบัญชีผู้ใช้งาน |
| Verification | CRUD `/verification` | ประเภทการยืนยันตัวตน |
| Auth Message | CRUD `/auth/message` | ข้อความสำหรับ authentication flow |

---

### 4.5 Advanced Features

#### 4.5.1 Face Recognition
- ใช้ TensorFlow.js + face-api.js (`@vladmandic/face-api`)
- รองรับ models: SSD MobileNetV1, Face Landmark 68, Tiny Face Detector, Age-Gender Model
- ทำงานทั้ง backend (tfjs-node) และ frontend (browser)

#### 4.5.2 OCR — Thai ID Card Reader
- `@privageapp/thai-national-id-reader` — Read Thai National ID Card
- `tesseract.js` / `node-tesseract-ocr` — General OCR
- `@google-cloud/vision` — Google Cloud Vision API
- ใช้ `puppeteer` สำหรับ automation และ screenshot

#### 4.5.3 Real-time Notification
- Socket.IO v4 สำหรับ push notification แบบ real-time
- รองรับ CORS credentials

#### 4.5.4 Email Service
- Nodemailer + Google OAuth2 (ไม่ใช้ password สำหรับ smtp)
- ไฟล์: `helpers/google/Mail.js`, `helpers/google/oAuth2.js`

#### 4.5.5 File Storage
- AWS S3 สำหรับเก็บไฟล์และรูปภาพ
- AWS SDK v3 (@aws-sdk/client-s3) + aws-sdk v2

---

## 5. ความปลอดภัย (Security Requirements)

### 5.1 Rate Limiting
- จำกัด **100 requests / 15 นาที** ต่อ IP
- IP ที่เกินจะถูกบล็อก **15 นาที** โดยอัตโนมัติ
- Production ใช้ Redis-based blocking

### 5.2 IP Whitelisting
- กำหนด `allowedDomains` และ `allowedIPs` ใน CORS config
- Middleware `ipCheckMiddleware` ตรวจสอบทุก request ใน Production

### 5.3 Security Headers
| Header | Library |
|--------|---------|
| XSS Protection | x-xss-protection |
| No MIME Sniff | dont-sniff-mimetype |
| IE No Open | ienoopen |
| No Cache | nocache |
| Disable x-powered-by | express built-in |

### 5.4 Password Policy
- ความยาว 8–20 ตัวอักษร
- ต้องมีตัวเลข, ตัวพิมพ์เล็ก, ตัวพิมพ์ใหญ่, และอักขระพิเศษ (`!@#$%^&*` ฯลฯ)

### 5.5 Audit Logging
- บันทึก module, action, ip, userAgent ทุก operation สำคัญ
- บันทึกผ่าน Winston → MongoDB

### 5.6 JWT Authentication
- Token expiry: กำหนดผ่าน `TOKENEXPIRED` environment variable (หน่วยวัน)
- Token length: `TOKENLANGTH` environment variable

### 5.7 Session Limit
- จำกัดจำนวน concurrent session ต่อบัญชี (field `control.limit`)
- รองรับ Single Sign-On (SSO) flag

---

## 6. Data Models สำคัญ (Key Database Models)

### MongoDB Collections

| Collection | Description |
|-----------|-------------|
| `Account` | บัญชีผู้ใช้งานหลัก |
| `Setting_Account_Group` | กลุ่มบัญชีผู้ใช้งาน |
| `Setting_Authen_Type` | ประเภทการ authenticate (local, google, AD ฯลฯ) |
| `Setting_AddressType` | ประเภทที่อยู่ |
| `Setting_Province` | จังหวัด |
| `Setting_District` | อำเภอ/เขต |
| `Setting_SubDistrict` | ตำบล/แขวง |
| `Setting_Verification` | ประเภทการยืนยันตัวตน |
| `Setting_Status` | สถานะบัญชี |
| `Setting_Message` | ข้อความระบบ |
| `Setting_Auth_Message` | ข้อความ authentication |
| `Security_Type` | ประเภท scope ของระบบ security |
| `Security_Menu` | เมนู/Route ที่ต้องควบคุมสิทธิ์ |
| `Security_Group` | กลุ่มสิทธิ์ (Role) |
| `Security_Permission` | การกำหนดสิทธิ์ต่อ group-menu |
| `Security_Assignment` | การมอบหมาย group ให้บัญชีผู้ใช้ |

---

## 7. Frontend Structure

### 7.1 Layout Containers
| Container | Description |
|-----------|-------------|
| `TheContainer` | Layout หลักสำหรับ admin |
| `TheContainer_Landing` | Layout สำหรับหน้า landing |
| `TheContainer_Project` | Layout สำหรับ project views |

### 7.2 Project Views
| View | Path | Description |
|------|------|-------------|
| Login | `/projects/views/Login.vue` | หน้า login หลัก |
| Account Management | `/projects/views/accounts/Management.vue` | จัดการบัญชีผู้ใช้งาน |
| Account Permissions Modal | `/projects/views/accounts/AccountPermissionsModal.vue` | Modal แสดงสิทธิ์ของบัญชี |
| Permission Management | `/projects/views/security/PermissionManagement.vue` | จัดการ permission |
| Permission Matrix | `/projects/views/security/PermissionMatrix.vue` | ตาราง permission matrix |
| Create Group | `/projects/views/security/CreateGroup.vue` | สร้างกลุ่มสิทธิ์ |

### 7.3 State Management (Vuex)
- Store แบบ modular ใน `src/store/modules/`
- รองรับ multi-language (th/en) ผ่าน `src/store/lang/`

---

## 8. Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Port ของ server |
| `MONGODB` | MongoDB connection string |
| `KEY` | JWT secret key |
| `TOKENEXPIRED` | อายุ JWT (หน่วยวัน) |
| `TOKENLANGTH` | ความยาว token |
| `TIMEOUT` | Session timeout |
| `TRANSACTIONEXPIRED` | Transaction timeout (หน่วยนาที) |
| `BASE_SERVER_URL` | URL หลักของ server |
| `TRUST_DEVICE_DAYS` | จำนวนวันที่ device ได้รับความเชื่อถือ (default: 30) |
| `NODE_ENV` | `development` / `production` |

---

## 9. API Base Path

| Module | Base Path |
|--------|-----------|
| Authentication / Accounts | `/api/v1/` |
| Security (RBAC) | `/api/v1/security/` |
| Settings | `/api/v1/setting/` |

---

## 10. Non-Functional Requirements

| ด้าน | ข้อกำหนด |
|------|---------|
| **Performance** | Cache ผ่าน Redis, Response compression (compression middleware) |
| **Scalability** | Stateless JWT, Socket.IO สำหรับ horizontal scaling |
| **Availability** | Graceful shutdown รองรับ SIGTERM/SIGINT |
| **Security** | Rate limiting, IP blocking, 2FA, Trusted Devices, Audit Logs |
| **Observability** | Winston logging → MongoDB, Morgan HTTP access logs |
| **API Documentation** | Swagger UI พร้อม JSDoc annotations |
| **Multi-language** | รองรับ Thai / English ในข้อมูลผู้ใช้และข้อความระบบ |
| **Data Validation** | Strong password, email format, Thai national ID (13 digit), phone number |

---

## 11. Deployment

| Mode | Command |
|------|---------|
| Development | `pnpm start` (nodemon + dotenv) |
| Test | `pnpm serve:test` |
| Production | `pnpm serve:prod` |

- Backend รันด้วย HTTP server (รองรับ HTTPS ด้วย Let's Encrypt — commented out)
- Frontend build ด้วย `vue-cli-service build`

---

## 12. ความสัมพันธ์ระหว่างโมดูล (Module Relationships)

```
Settings Module
    ├── Account Groups    ──→  Account Module (group ref)
    ├── Statuses          ──→  Account Module (status ref)
    ├── Auth Types        ──→  Account Module (authen[].type)
    ├── Address Types     ──→  Account Module (address[].type)
    └── Verification Types ──→ Account Module (verification[].type)

Security Module
    ├── Security Type ──→ Security Menu (scoping)
    ├── Security Type ──→ Security Group (scoping)
    ├── Security Group + Security Menu ──→ Security Permission
    └── Security Group + Account ──→ Security Assignment

Account Module
    └── Effective Permissions ──→ Security Assignment + Security Permission
```

---

*เอกสารนี้สร้างโดยการวิเคราะห์ source code อัตโนมัติ — อัปเดตล่าสุด: 4 มีนาคม 2026*
