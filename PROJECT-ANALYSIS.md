# MFU Research Proposal System — Complete Project Analysis

> **วัตถุประสงค์ของเอกสารนี้**: เพื่อให้ AI หรือนักพัฒนาคนอื่นสามารถอ่านแล้วเข้าใจโครงสร้างทั้งหมดของระบบได้อย่างครบถ้วน
>
> **Generated**: March 20, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Directory Structure](#3-project-directory-structure)
4. [Backend Architecture](#4-backend-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Dual Authentication System](#6-dual-authentication-system)
7. [Database Models & Schemas](#7-database-models--schemas)
8. [Complete API Reference](#8-complete-api-reference)
9. [Frontend Routing & Navigation](#9-frontend-routing--navigation)
10. [Vuex State Management](#10-vuex-state-management)
11. [Research Proposal Workflow](#11-research-proposal-workflow)
12. [Security & RBAC System](#12-security--rbac-system)
13. [Cross-Module Relationships](#13-cross-module-relationships)
14. [Known Issues & Technical Debt](#14-known-issues--technical-debt)

---

## 1. Project Overview

**ระบบจัดการข้อเสนองานวิจัย มหาวิทยาลัยแม่ฟ้าหลวง (MFU Research Proposal System)**

ระบบ IAM + Research Proposal Management ประกอบด้วย:
- **Backend**: Node.js Express API (port 8081/8082)
- **Frontend**: Vue.js 2 SPA with CoreUI Pro template (port 8080)
- **Database**: MongoDB Atlas (cloud)
- **Cache**: Redis (optional, non-fatal if unavailable)

### 4 User Roles
| Role | Description | Access |
|---|---|---|
| `researcher` | นักวิจัย/อาจารย์ | สร้าง-ส่ง-แก้ไขข้อเสนอ, ดู dashboard ตัวเอง |
| `committee` | กรรมการผู้ทรงคุณวุฒิ | Review/ให้คะแนนข้อเสนอ, เข้าร่วมประชุม |
| `admin` | เจ้าหน้าที่สำนักงาน | จัดการทุกอย่าง: proposals, users, meetings, reports, settings |
| `chairman` | ประธานกรรมการ | เหมือน admin (full access) |

---

## 2. Technology Stack

### Backend
| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js | v18.20.4 |
| Framework | Express.js | ^4.x |
| Database | MongoDB (Mongoose) | mongoose 5.13 / mongodb 6.12 |
| Cache | Redis | 4.5 |
| Auth (Legacy) | Google OAuth2 + x-access-token | custom |
| Auth (Modern) | JWT (jsonwebtoken) + bcryptjs | custom |
| Email | Nodemailer (Gmail SMTP) | – |
| Real-time | Socket.IO | ^4.x |
| File Upload | Multer (GridFS + disk) | – |
| Logging | Winston + winston-mongodb | – |
| API Docs | Swagger (swagger-jsdoc) | – |
| Process Manager | nodemon (dev) | – |

### Frontend
| Component | Technology | Version |
|---|---|---|
| Framework | Vue.js | 2.6.11 |
| State | Vuex | 3.1.3 |
| Router | Vue Router | 3.1.6 |
| UI Library | CoreUI Pro Vue | 3.2.3 |
| HTTP | Axios | 1.6.1 |
| i18n | vue-i18n (en/th) | 8.18.2 |
| Auth (Google) | vue-google-oauth2 | 1.5.10 |
| Rich Text | vue-quill-editor + Quill | 3.0.6 / ~2.0.3 |
| Charts | @coreui/vue-chartjs | – |
| Alerts | SweetAlert2 | 11.26.22 |
| Excel Export | xlsx | 0.18.5 |
| Date | moment.js | 2.29.4 |
| IndexedDB | idb | 8.0.3 |
| Form Validation | vuelidate | 0.7.5 |

---

## 3. Project Directory Structure

```
Research-Proposal-System/
├── docs/                          # PRD documents & agent specs
│   ├── PRD_IAM_v1.md
│   ├── PRD-IAM-Enterprise.md
│   ├── security-database-design.md
│   └── agents/                    # AI agent role definitions
│
└── IAM/
    ├── backend-node/              # ===== BACKEND (Express API) =====
    │   ├── server.js              # Entry point (HTTP server + Socket.IO)
    │   ├── package.json
    │   ├── .env                   # Environment variables
    │   ├── Dockerfile / docker-compose.yml
    │   │
    │   ├── config/                # Configuration layer
    │   │   ├── config.js          # Central config (env vars → exports)
    │   │   ├── corsAndIP.js       # CORS whitelist & IP check middleware
    │   │   ├── express.js         # App factory (middleware → routes → healthz)
    │   │   ├── logger.js          # Winston → MongoDB logging middleware
    │   │   ├── message.js         # Response code constants
    │   │   └── rateLimit.js       # Rate limiter (100 req/15min, production only)
    │   │
    │   ├── helpers/               # Utility layer
    │   │   ├── base.service.js    # Generic CRUD factory for legacy modules
    │   │   ├── initialize.js      # MongoDB connection via Mongoose
    │   │   ├── redis.js           # Redis singleton client
    │   │   ├── utils.js           # Crypto (AES-256-CBC, tokens, base64)
    │   │   ├── audit.logger.js    # Audit trail builder
    │   │   └── google/
    │   │       ├── Mail.js        # Gmail SMTP via nodemailer
    │   │       └── oAuth2.js      # Google OAuth2 + Distance Matrix
    │   │
    │   ├── middleware/            # Express middleware
    │   │   ├── authMiddleware.js  # JWT auth (authenticate + requireRole)
    │   │   ├── cacheMiddleware.js # Redis response cache
    │   │   └── middlewares.js     # Middleware stack (CORS, bodyParser, morgan, etc.)
    │   │
    │   ├── server/
    │   │   ├── routes/
    │   │   │   ├── app.routes.js  # Master route registration
    │   │   │   └── socket.js      # Socket.IO events
    │   │   │
    │   │   └── Project/           # Business modules
    │   │       ├── accounts/      # Legacy IAM (Google OAuth sign-in, 2FA, devices)
    │   │       ├── Auth/          # Modern auth (email/password, JWT, User CRUD)
    │   │       ├── security/      # RBAC (types, groups, menus, permissions, assignments)
    │   │       ├── settings/      # System settings, messages, statuses
    │   │       ├── Organization/  # Organization registry
    │   │       ├── Proposal/      # Core: proposal workflow, documents, meetings, reviews
    │   │       ├── category/      # Category lookup (NOT mounted in routes)
    │   │       └── address/       # Province/District/SubDistrict (routes commented out)
    │   │
    │   ├── scripts/               # Migration & bootstrap scripts
    │   └── swagger/               # Swagger docs config
    │
    └── fontend-vue/               # ===== FRONTEND (Vue.js SPA) =====
        ├── package.json
        ├── vue.config.js          # Dev server config (no proxy)
        ├── src/
        │   ├── main.js            # Vue app bootstrap (plugins, global components)
        │   ├── App.vue            # Root component (<router-view>)
        │   ├── i18n.js            # i18n setup (en/th)
        │   ├── store.js → store/store.js  # Vuex store (10 modules)
        │   │
        │   ├── router/
        │   │   └── index.js       # All routes + navigation guards
        │   │
        │   ├── service/
        │   │   └── api.js         # Axios instance + all API methods (~25 groups)
        │   │
        │   ├── store/modules/     # Vuex modules
        │   │   ├── Authen/        # Legacy auth (Google OAuth, 2FA, IndexedDB)
        │   │   ├── Authentication/# Research auth (email/password, localStorage)
        │   │   ├── Security/      # RBAC permission matrix
        │   │   ├── Setting/       # Settings CRUD (status, group, messages, etc.)
        │   │   ├── Accounts/      # Account management
        │   │   ├── Training/      # Training requests workflow
        │   │   ├── organization/  # Organization data
        │   │   ├── Dialog/        # Global dialogs, toasts, loading
        │   │   ├── Applications/  # (NOT registered — dead code)
        │   │   └── Payments/      # (NOT registered — dead code)
        │   │
        │   ├── views/             # CoreUI template views + page shells
        │   │   ├── pages/         # Login.vue, ResearchLogin.vue, Register.vue, 404, 500
        │   │   ├── Dashboard.vue  # Legacy dashboard
        │   │   └── (CoreUI demos) # theme, charts, widgets, tables, forms, etc.
        │   │
        │   ├── ResearchFormRS/    # ★ Research Proposal Form System (main feature)
        │   │   ├── ResearchForm.vue      # Multi-section research proposal form
        │   │   ├── Report.vue            # Report view
        │   │   ├── admin/                # Admin views (dashboard, proposals, users, etc.)
        │   │   ├── committee/            # Committee views (review, meetings)
        │   │   ├── user/                 # User views (dashboard, profile, history)
        │   │   ├── component/            # Shared form components
        │   │   │   ├── ProjectDetailsForm.vue
        │   │   │   ├── ResearchTeamForm.vue
        │   │   │   ├── FileManagement.vue
        │   │   │   ├── SignatureCard.vue
        │   │   │   ├── StatusBadge.vue
        │   │   │   ├── TextEditor.vue (Quill)
        │   │   │   ├── BudgetSectionDemo.vue
        │   │   │   ├── ResearchStandardSection.vue
        │   │   │   └── TestComponent/
        │   │   └── constants/
        │   │       └── committeeFeedback.js  # Committee feedback metadata
        │   │
        │   ├── containers/        # Layout components
        │   │   ├── TheContainer.vue    # Main layout shell
        │   │   ├── TheSidebar.vue      # Role-filtered sidebar navigation
        │   │   ├── TheHeader.vue       # Top header bar
        │   │   ├── TheHeaderDropdownAccnt.vue  # Account dropdown + logout
        │   │   └── _nav.js             # Sidebar menu items (role-based)
        │   │
        │   ├── projects/          # Legacy IAM UI components
        │   │   ├── components/
        │   │   │   ├── dialog/    # TwoFA.vue, SignIn.vue, TrustDeviceDialog.vue, etc.
        │   │   │   ├── custom/    # CPInput, CPSelect, Countdown, etc.
        │   │   │   ├── Filter/    # FilterOption, FilterOrganization
        │   │   │   ├── layout/    # Section hero, language toolbar
        │   │   │   └── Util/      # QR code, multi-language editor, etc.
        │   │   ├── views/
        │   │   │   ├── accounts/  # Account management UI
        │   │   │   ├── security/  # Permission matrix, group/menu editors
        │   │   │   ├── setting/   # Settings CRUD pages
        │   │   │   └── training/  # Training request/record pages
        │   │   ├── mixins/        # requiredValidation, routePermission
        │   │   └── utils/         # date-time, notify helpers
        │   │
        │   ├── components/
        │   │   ├── admin/AdminUsersManagement.vue
        │   │   ├── coreui/CSidebarNavDropdown*.vue
        │   │   └── ProjectHistoryDrawer.vue
        │   │
        │   ├── mixins/            # optionsMixin, currencyMixin
        │   ├── utils/db.js        # IndexedDB wrapper (idb)
        │   └── assets/            # SCSS, logos, icons
        │
        ├── public/                # Static assets, index.html
        └── tests/                 # Unit + E2E test skeletons
```

---

## 4. Backend Architecture

### Server Startup Flow
```
server.js
  → require('./config/express')
    → express() app
    → initialize.init() → Mongoose connect to MongoDB Atlas
    → middlewares(app) → bodyParser, CORS, morgan, logger, security headers
    → CORS headers for OPTIONS (Access-Control-Allow-Origin: *)
    → routes(app) → mount all API routes
    → /healthz endpoint (ready after 10s)
  → http.createServer(app)
  → Socket.IO attach
  → server.listen(PORT)
  → graceful shutdown (SIGTERM/SIGINT)
```

### Config Layer (`config/`)
| File | Purpose |
|---|---|
| `config.js` | Reads all env vars: `mongoURI`, `key` (AES), `timeout`, `tokenLength`, `tokenExpired`, `host.port` |
| `corsAndIP.js` | Production: whitelist-based CORS. Dev: `cors({ origin: '*' })` added in middlewares.js |
| `express.js` | App factory — initializes DB connection, applies middleware stack, loads routes |
| `logger.js` | Winston middleware — intercepts `res.json()` to log request/response to MongoDB `logs` collection. Truncates data >10KB. Auto-cleanup >120 days |
| `message.js` | Response codes: `20000` (Success), `40300` (Bad param), `40301` (Duplicate), `40400` (Not found) |
| `rateLimit.js` | 100 req/15min per IP. `blockMiddleware` bans IPs for 15 min. Production only |

### Helper Layer (`helpers/`)
| File | Purpose |
|---|---|
| `base.service.js` | **Generic CRUD factory** — `createBaseService(schema, populate)` returns `onAggregate`, `onQuery`, `onQuerys`, `onCreate`, `onUpdate`, `onDelete`. Used by all legacy modules |
| `initialize.js` | Mongoose connection to `cfg.mongoURI` (MongoDB Atlas). Sets `global.mongodb` |
| `redis.js` | Redis singleton client on `localhost:6379`. Graceful failure — app works without Redis |
| `utils.js` | `createTokens` (crypto.randomBytes hex), `encrypt`/`decrypt` (AES-256-CBC), `encodeBase64`/`decodeBase64`, `randomString`, `randomNumber` |
| `google/Mail.js` | Gmail SMTP with App Password. `sendMail(to, subject, text, html)` |
| `google/oAuth2.js` | Google userinfo lookup + Distance Matrix API |

### Middleware Layer (`middleware/`)
| File | Purpose |
|---|---|
| `authMiddleware.js` | **JWT auth** — `authenticate` extracts Bearer token → `jwt.verify` → loads `User` model → `req.user`. `requireRole(...roles)` for role-based access |
| `cacheMiddleware.js` | Redis response cache by URL key |
| `middlewares.js` | Full middleware stack: bodyParser (10MB), compression, CORS (dev: allow all / prod: whitelist + IP check + rate limit), morgan, winston-mongodb logger, express-validator, security headers |

### Route Registration (`server/routes/app.routes.js`)
All routes mounted under base `/api/v1`:
```
/api/v1/organization      → Organization module
/api/v1/setting           → Settings module
/api/v1/security          → Security RBAC module
/api/v1                   → Accounts module (legacy: /signin, /auth/me, /auth/2fa/*, /accounts/*)
/api/v1/auth              → Auth module (modern: /login, /register, /me, /logout, /change-password)
/api/v1/users             → User management
/api/v1/admin/users       → Admin user management (same handler)
/api/v1/proposals         → Proposal module
/api/v1/documents         → Document module
/api/v1/meetings          → Meeting module
/api/v1/reports           → Report module
/api/v1/notifications     → Notification module
```

---

## 5. Frontend Architecture

### App Bootstrap (`main.js`)
```
Vue instance
  → CoreUI Pro (full component library)
  → vue-i18n (en/th, fallback: th)
  → vue-google-oauth2 (Google Sign-In)
  → CIcon (icon component)
  → OtpInput (2FA code input)
  → QRCode component
  → moment.js on prototype
  → Global SCSS
```

### Layout Structure
```
App.vue
 └── <router-view>
      ├── /pages/* → standalone full-page views (Login, Register, 404, 500)
      └── /* → TheContainer.vue
               ├── TheSidebar.vue (role-filtered nav from _nav.js)
               ├── TheHeader.vue
               │    └── TheHeaderDropdownAccnt.vue (logout button)
               ├── <router-view> (app content)
               ├── SignIn.vue (modal)
               ├── TwoFA.vue (modal)
               ├── CenterLoading.vue
               ├── DialogMessage.vue
               └── TheFooter.vue
```

### Sidebar Navigation (`_nav.js`) — Role-Based
| Section | Menu Items | Visible To |
|---|---|---|
| **User Panel** | Dashboard, Profile, History, Notifications | researcher, chairman |
| **Admin Panel** | Dashboard, Proposals, Documents, Meetings, Notifications, Reports, Settings, Users | admin, chairman |
| **Committee Panel** | Dashboard, Meetings, Notifications | committee |
| **Research Form** | New Research Form | researcher, admin, chairman, committee |
| **Access Control** | Config, Settings, Accounts, Training, Permissions | (no role filter — legacy IAM) |

### Frontend File Map
| Area | Location | Description |
|---|---|---|
| Login pages | `views/pages/` | Login.vue (Google), ResearchLogin.vue (Email/Password + Register) |
| Research UI | `ResearchFormRS/` | Main research proposal feature — admin, committee, user views + shared components |
| Legacy IAM UI | `projects/views/` | Account management, security config, settings, training |
| Shared dialogs | `projects/components/dialog/` | TwoFA, SignIn modal, TrustDevice, Loading, Toast, Confirm |
| Custom inputs | `projects/components/custom/` | CPInput, CPSelect, CPDateInput, Countdown, etc. |
| API layer | `service/api.js` | Axios instance with ~25 method groups |
| State | `store/modules/` | 10 Vuex modules (8 active, 2 dead code) |
| Layout | `containers/` | TheContainer, TheSidebar, TheHeader, _nav.js |

---

## 6. Dual Authentication System

ระบบมี **2 ระบบ auth** ทำงานคู่กัน:

### 6.1 Legacy Auth (Google OAuth + 2FA + x-access-token)

**Flow:**
```
1. User clicks Google Sign-In → gets Google id_token
2. POST /api/v1/signin { token, authType }
3. Backend verifies Google token → finds/creates Information_Accounts
4. Generates random hex token → stores in account.control.device[]
5. Returns x-access-token + triggers 2FA email
6. POST /api/v1/auth/2fa/request → sends 6-digit code to email
7. POST /api/v1/auth/2fa/verify { code } → verifies code
8. Optional: POST /api/v1/auth/trust-device → saves device fingerprint
9. Token stored in IndexedDB (idb) + localStorage
```

**Used by:** Legacy IAM pages (accounts, security, settings, training)

**Auth check:** `x-access-token` header → lookup `Information_Accounts.control.device[].xAccessToken`

**Vuex module:** `auth` (Authen/index.js)

### 6.2 Modern Auth (Email/Password + JWT)

**Flow:**
```
1. User enters email + password on ResearchLogin page
2. POST /api/v1/auth/login { email, password }
3. Backend: bcrypt compare → generates JWT (7 days)
4. Returns { token, user } → stored in localStorage
5. Subsequent requests: Authorization: Bearer <jwt>
```

**Used by:** Research proposal pages (ResearchFormRS/*)

**Auth check:** JWT Bearer token → `authMiddleware.authenticate` → `req.user`

**Vuex module:** `Authentication` (Authentication/index.js)

### Token Handling in API (service/api.js)

```javascript
// Request interceptor sends BOTH tokens:
config.headers.Authorization = `Bearer ${researchToken || legacyToken}`;
config.headers['x-access-token'] = legacyToken;

// Response interceptor on 401:
// - Research routes → redirect to /pages/research-login
// - Legacy routes → redirect to /pages/login
// - Skip redirect for 2FA/trust-device/auth-me endpoints
```

### Route Priority Issue (Fixed)
Both systems define `GET /auth/me`. In `app.routes.js`, `accountRoutes` (legacy) is mounted at `/api/v1` **before** `authRoutes` (JWT) at `/api/v1/auth`, so the legacy handler takes priority for `/api/v1/auth/me`.

---

## 7. Database Models & Schemas

### MongoDB Atlas Database: `mfu_research_dev`

### 7.1 User (Modern Auth)
**Collection:** `users`
```
{
  fullName:    String (required)
  email:       String (required, unique, lowercase)
  password:    String (required, bcrypt hashed, min 6 chars)
  role:        Enum ['admin', 'chairman', 'committee', 'researcher'] (default: researcher)
  department:  String
  phone:       String
  isActive:    Boolean (default: true)
  isDeleted:   Boolean (default: false)
  isMFUStaff:  Boolean (auto-set if email ends in @mfu.ac.th)
  lastLogin:   Date
  createdAt:   Date (auto)
  updatedAt:   Date (auto)
}
```
Pre-save: lowercase email, bcrypt password (salt 12), detect MFU staff, validate role enum.

### 7.2 Information_Accounts (Legacy Auth)
**Collection:** `information_accounts`
```
{
  dateTime:     Date
  group:        ObjectId → Setting_Account_Group
  code:         String
  email:        String
  authen: [{
    type: ObjectId → Authen_Type,
    username, password, email, oAuthToken
  }]
  userinfo: {
    prefix:    { text, value }
    firstName: [{ lang, text }]   // multilingual
    lastName:  [{ lang, text }]
    image, cardId, birthday, msisdn, lineId, religion
  }
  address: [{
    type: ObjectId → Address_Type,
    address, province, district, subDistrict, zipcode, GPS
  }]
  verification: [{
    type: ObjectId → Setting_Verification,
    dateTime, expired, code, src, status
  }]
  control: {
    sso: Boolean
    limit: Number
    trustedDevices: [{ fingerprint, networkKey, userAgent, lastUsed }]
    device: [{ dateTime, deviceId, userAgent, ip, xAccessToken, isActive }]
  }
  status:       ObjectId → Setting_Status
}
```

### 7.3 Proposal
**Collection:** `proposals`
```
{
  proposalCode:     String (unique, required, auto-generated)
  fiscalYear:       Number (required)
  projectTitleTh:   String (required)
  projectTitleEn:   String
  applicantUserId:  ObjectId → User
  facultyId:        ObjectId
  departmentId:     ObjectId
  researchType:     String
  fundingType:      String
  fundingSubType:   String
  budgetTotal:      Number (min: 0)
  currentStatus:    Enum [15 statuses, see workflow]
  currentRound:     Number (1 or 2)
  abstractText:     String
  keywordList:      [String]
  committeeIds:     [ObjectId → User]
  requiresRevision: Boolean
  formSnapshotJson: Mixed (form data snapshot)
  submittedAt, facultyApprovedAt, officeReceivedAt, approvedAt, rejectedAt, announcedAt: Date
  isDeleted:        Boolean
  createdAt/updatedAt: Date (auto)
}
```

### 7.4 ProposalReview
**Collection:** `proposalreviews`
```
{
  proposalId:     ObjectId → Proposal (required)
  reviewerUserId: ObjectId → User (required)
  roundNo:        Number (1 or 2)
  reviewStatus:   Enum ['pending', 'in_progress', 'submitted', 'certified']
  decision:       Enum ['approve', 'reject', 'revise']
  totalScore:     Number
  summaryComment: String
  commentItems: [{
    sectionKey, commentType: Enum['positive','negative','suggestion','concern','requirement'], visibility
  }]
  scoreItems: [{ criteriaKey, score, maxScore }]
  // Unique: (proposalId, reviewerUserId, roundNo)
}
```

### 7.5 ProposalDocument
**Collection:** `proposaldocuments`
```
{
  proposalId:      ObjectId → Proposal (required)
  documentType:    String (required)
  versionGroup:    String
  version:         Number (default: 1)
  isLatest:        Boolean (default: true)
  fileName, fileOriginalName, fileMimeType, fileSize, filePath: String/Number
  uploadedByUserId: ObjectId → User
}
```

### 7.6 ProposalMeeting
**Collection:** `proposalmeetings`
```
{
  title:          String (required)
  meetingDate:    Date (required)
  startTime, endTime: String
  location, videoLink: String
  agenda:         String
  status:         Enum ['scheduled', 'completed', 'cancelled']
  proposalIds:    [ObjectId → Proposal]
  participantIds: [ObjectId → User]
  minutes:        String
  decisions:      String
  actionItems: [{ task, assignee, deadline }]
}
```

### 7.7 ProposalStatusLog
**Collection:** `proposalstatuslogs`
```
{
  proposalId:  ObjectId → Proposal
  fromStatus, toStatus: String
  actionKey:   String
  remark:      String
  roundNo:     Number
  changedBy:   ObjectId → User
  notifySent:  Boolean
}
```

### 7.8 Notification
**Collection:** `notifications`
```
{
  userId:     ObjectId → User
  proposalId: ObjectId → Proposal
  channel:    Enum ['in_app', 'email']
  eventKey:   String
  title, message: String
  payload:    Mixed
  isRead:     Boolean
  sentAt, readAt: Date
}
```

### 7.9 Security Models (RBAC)
```
Security_Type:       { title[], description[], state, created, updated }
Security_Group:      { title[], description[], state, visibleType → Security_Type }
Security_Menu:       { title[], description[], state, path (unique), type → Security_Type }
Security_Permission: { group → Security_Group, menu → Security_Menu,
                       all, view, edit, delete, action, logs (booleans)
                       // Unique: (group, menu) }
Security_Assignment: { account → Information_Accounts, group → Security_Group,
                       dataScope (self/unit/org), scopeUnits[], active
                       // Unique: (account, group) }
```

### 7.10 Settings Models
```
Setting_Messages:      { code (unique), title[], status }
Setting_Status:        { key, title[], group, state }
Setting_Group:         { key, title[], state }
Setting_Verification:  { title[], description[], state }
Setting_AuthMessage:   { title, message, dateStart, dateEnd, active }
SystemSetting:         { key (unique), value (Mixed), description, updatedBy, updatedAt }
EmailLog:              { to, subject, status, messageId, error, sentAt }
```

### 7.11 Other Models
```
Organization:          { code (unique), title[], tax, branch, contact, location, status }
Application_Category:  { title[], description[], status } (NOT mounted)
Province/District/SubDistrict: { code, title[], province/district refs } (routes commented out)
```

---

## 8. Complete API Reference

### 8.1 Legacy Auth (Accounts Module) — x-access-token

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/signin` | None (Google token) | Google OAuth sign-in |
| `GET` | `/api/v1/auth/me` | x-access-token | Get current legacy user |
| `POST` | `/api/v1/auth/2fa/request` | x-access-token | Send 2FA email code |
| `POST` | `/api/v1/auth/2fa/verify` | x-access-token | Verify 2FA code |
| `POST` | `/api/v1/auth/trust-device` | x-access-token | Trust this device |
| `GET` | `/api/v1/accounts` | x-access-token | List accounts |
| `PUT` | `/api/v1/accounts/:id` | x-access-token | Update account |
| `GET` | `/api/v1/accounts/group/options` | x-access-token | Group options |
| `GET` | `/api/v1/accounts/:id/effective-permissions` | x-access-token | Get account permissions |
| `GET` | `/api/v1/accounts/status/options` | x-access-token | Status options |
| `PUT` | `/api/v1/accounts/:id/status` | x-access-token | Change account status |

### 8.2 Modern Auth (JWT)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Register new user |
| `POST` | `/api/v1/auth/login` | None | Login (email/password) |
| `GET` | `/api/v1/auth/me` | JWT | Get current user *(shadowed by legacy)* |
| `POST` | `/api/v1/auth/logout` | JWT | Logout |
| `PUT` | `/api/v1/auth/change-password` | JWT | Change password |

### 8.3 User Management (JWT, admin/chairman only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/users/` | List users (pagination, search, filter) |
| `POST` | `/api/v1/users/` | Create user |
| `GET` | `/api/v1/users/:id` | Get user by ID |
| `PUT` | `/api/v1/users/:id` | Update user |
| `PATCH` | `/api/v1/users/:id/toggle-active` | Toggle active status |
| `PATCH` | `/api/v1/users/:id/status` | Change status with reason |
| `PATCH` | `/api/v1/users/:id/reset-password` | Reset password |
| `DELETE` | `/api/v1/users/:id` | Soft delete user |

### 8.4 Proposals (JWT)

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/v1/proposals/` | JWT | any |
| `POST` | `/api/v1/proposals/` | JWT | any |
| `GET` | `/api/v1/proposals/admin/dashboard-summary` | JWT | admin, chairman |
| `GET` | `/api/v1/proposals/committee-users` | JWT | admin, chairman |
| `GET` | `/api/v1/proposals/reviews/me` | JWT | committee, admin |
| `GET` | `/api/v1/proposals/reviews/by-proposal/:id` | JWT | admin, chairman |
| `GET` | `/api/v1/proposals/:id` | JWT | any |
| `PATCH` | `/api/v1/proposals/:id` | JWT | any |
| `DELETE` | `/api/v1/proposals/:id` | JWT | any |
| `POST` | `/api/v1/proposals/:id/submit` | JWT | any |
| `POST` | `/api/v1/proposals/:id/resubmit` | JWT | any |
| `PATCH` | `/api/v1/proposals/:id/status` | JWT | admin, chairman |
| `POST` | `/api/v1/proposals/:id/assign-committee` | JWT | admin, chairman |
| `POST` | `/api/v1/proposals/:id/reviews` | JWT | committee, admin |
| `GET` | `/api/v1/proposals/:id/reviews/me` | JWT | committee, admin |
| `GET` | `/api/v1/proposals/:id/reviews` | JWT | admin, chairman |
| `GET` | `/api/v1/proposals/:id/feedback` | JWT | any |
| `GET` | `/api/v1/proposals/:id/form-files` | JWT | any |
| `POST` | `/api/v1/proposals/:id/form-files` | JWT | any (upload, 10MB) |
| `GET` | `/api/v1/proposals/:id/form-files/:fileId` | JWT | any |
| `DELETE` | `/api/v1/proposals/:id/form-files/:fileId` | JWT | any |

### 8.5 Documents (JWT, admin/chairman)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/documents/` | List documents |
| `POST` | `/api/v1/documents/upload` | Upload document |
| `GET` | `/api/v1/documents/:id/versions` | Get version history |
| `PUT` | `/api/v1/documents/:id` | Update document |
| `DELETE` | `/api/v1/documents/:id` | Delete document |

### 8.6 Meetings (JWT)

| Method | Path | Auth | Role |
|---|---|---|---|
| `GET` | `/api/v1/meetings/` | JWT | admin, chairman, committee, researcher |
| `POST` | `/api/v1/meetings/` | JWT | admin, chairman |
| `PUT` | `/api/v1/meetings/:id` | JWT | admin, chairman |
| `PUT` | `/api/v1/meetings/:id/minutes` | JWT | admin, chairman |
| `PATCH` | `/api/v1/meetings/:id/status` | JWT | admin, chairman |
| `DELETE` | `/api/v1/meetings/:id` | JWT | admin, chairman |

### 8.7 Notifications (JWT)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/notifications/` | List (admin: all, others: own) |
| `POST` | `/api/v1/notifications/send` | Send notification (admin/chairman) |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark as read |
| `PATCH` | `/api/v1/notifications/mark-all-read` | Mark all read |
| `DELETE` | `/api/v1/notifications/:id` | Delete notification |

### 8.8 Reports (JWT, admin/chairman)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/reports/export` | Export report |

### 8.9 Security RBAC (⚠️ No Auth on CRUD endpoints)

| Method | Path | Description |
|---|---|---|
| CRUD | `/api/v1/security/type` | Security types |
| CRUD | `/api/v1/security/menu` | Menu/path definitions |
| CRUD | `/api/v1/security/group` | Security groups |
| CRUD | `/api/v1/security/permission` | Permission matrix |
| `POST` | `/api/v1/security/permission/create/batch` | Batch create |
| `PUT` | `/api/v1/security/permission/update/batch` | Batch update |
| `GET` | `/api/v1/security/permission/my` | My permissions (x-access-token) |
| CRUD | `/api/v1/security/assignment` | Account-group assignments |

### 8.10 Settings

| Method | Path | Auth | Description |
|---|---|---|---|
| CRUD | `/api/v1/setting/message` | None | Response messages |
| CRUD | `/api/v1/setting/status` | None | Status lookups |
| CRUD | `/api/v1/setting/groups` | None | Group lookups |
| CRUD | `/api/v1/setting/verification` | None | Verification type lookups |
| CRUD | `/api/v1/setting/auth/message` | None | Auth messages |
| `GET/POST/PUT/DELETE` | `/api/v1/setting/` | JWT (admin) | System settings |
| `GET` | `/api/v1/setting/email-logs` | JWT (admin) | Email logs |
| `POST` | `/api/v1/setting/test-email` | JWT (admin) | Test email |
| `POST` | `/api/v1/setting/clear-cache` | JWT (admin) | Clear Redis cache |

### 8.11 Organization

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/organization` | None | List organizations |
| `POST` | `/api/v1/organization/explorers` | None | Search organizations |
| `POST` | `/api/v1/organization` | None | Create organization |
| `PUT` | `/api/v1/organization` | None | Update organization |
| `DELETE` | `/api/v1/organization` | None | Delete organization |

---

## 9. Frontend Routing & Navigation

### 9.1 Route Map

#### Public Pages (no auth required)
| Path | Component | Description |
|---|---|---|
| `/pages/login` | Login.vue | Google OAuth + links to email login/register |
| `/pages/research-login` | ResearchLogin.vue | Email/password login + registration tabs |
| `/pages/register` | Register.vue | Standalone registration |
| `/pages/404` | Page404.vue | Not found |
| `/pages/500` | Page500.vue | Server error |

#### User Routes (researcher/chairman)
| Path | Component | Source |
|---|---|---|
| `/userdashboard` | UserDashboard | ResearchFormRS/user/ |
| `/user/profile` | UserProfile | ResearchFormRS/user/ |
| `/user/history` | UserHistory | ResearchFormRS/user/ |
| `/user/notification` | UserNotification | ResearchFormRS/user/ |

#### Admin Routes (admin/chairman)
| Path | Component | Source |
|---|---|---|
| `/admin/dashboard` | AdminDashboard | ResearchFormRS/admin/ |
| `/admin/proposals` | AdminProposalList | ResearchFormRS/admin/ |
| `/admin/proposals/:id` | AdminProposalDetail | ResearchFormRS/admin/ |
| `/admin/documents` | AdminDocuments | ResearchFormRS/admin/ |
| `/admin/users` | AdminUsers | ResearchFormRS/admin/ |
| `/admin/meetings` | AdminMeetings | ResearchFormRS/admin/ |
| `/admin/notifications` | AdminNotifications | ResearchFormRS/admin/ |
| `/admin/reports` | AdminReports | ResearchFormRS/admin/ |
| `/admin/settings` | AdminSettings | ResearchFormRS/admin/ |

#### Committee Routes (committee/admin/chairman)
| Path | Component | Source |
|---|---|---|
| `/committee/dashboard` | ReviewerDashboard | ResearchFormRS/committee/ |
| `/committee/meetings` | CommitteeMeetings | ResearchFormRS/committee/ |
| `/committee/notifications` | CommitteeNotifications | ResearchFormRS/committee/ |
| `/committee/proposals/:id` | CommitteeProposalDetail | ResearchFormRS/committee/ |

#### Research Form
| Path | Component |
|---|---|
| `/research-form/:id?` | ResearchForm (ResearchFormRS/ResearchForm.vue) |

#### Legacy IAM Routes (permission-based)
| Path | Component | Source |
|---|---|---|
| `/dashboard` | Dashboard | views/Dashboard.vue |
| `/security/permissions/group` | CreateGroup | projects/views/security/ |
| `/security/permissions/menu` | CreateMenu | projects/views/security/ |
| `/security/permissions/matrix` | PermissionMatrix | projects/views/security/ |
| `/config/message-authen` | SettingMessageAuthen | projects/views/setting/ |
| `/config/setting-message` | SettingMessage | projects/views/setting/ |
| `/config/verification` | SettingVerification | projects/views/setting/ |
| `/setting/message-status` | SettingMessageStatus | projects/views/setting/ |
| `/setting/group` | SettingGroup | projects/views/setting/ |
| `/accounts/management` | AccountManagement | projects/views/accounts/ |
| `/training/requests` | TrainingRequests | projects/views/training/ |
| `/training/records` | TrainingRecords | projects/views/training/ |

### 9.2 Navigation Guard Logic

```
router.beforeEach:
  1. Bootstrap legacy session (auth/bootstrapSession → IndexedDB → /auth/me)
  2. Restore research session (Authentication/restoreSession → localStorage → /auth/me)
  3. If route is not /pages/* and NOT authenticated → redirect to /pages/login
  4. Research routes (meta.appAuth === 'research'):
     - Must have Authentication.isAuthenticated
     - Role must match meta.roles[]
     - Auto-redirect by role: committee→/committee/dashboard, admin→/admin/dashboard, researcher→/userdashboard
  5. Legacy routes: must have XAccessToken + auth/authenticated.isAuthen
  6. Permission routes (meta.permission): check security/permission matrix
```

---

## 10. Vuex State Management

### 10.1 Module Map

| Module Key | File | Namespaced | Active | Purpose |
|---|---|---|---|---|
| `dialog` | Dialog/index.js | Yes | ✅ | Global dialogs, toasts, loading, confirm |
| `setting` | Setting/index.js | Yes | ✅ | Settings CRUD (status, group, messages, verification) + lang |
| `auth` | Authen/index.js | Yes | ✅ | Legacy Google OAuth auth + 2FA |
| `Authentication` | Authentication/index.js | Yes | ✅ | Modern email/password auth + JWT |
| `organization` | organization/index.js | Yes | ✅ | Org hierarchy data |
| `security` | Security/index.js | Yes | ✅ | RBAC permission matrix |
| `accounts` | Accounts/index.js | Yes | ✅ | Account management (legacy) |
| `training` | Training/index.js | Yes | ✅ | Training request workflow |
| `Applications` | Applications/index.js | Yes | ❌ Dead code | Not imported in store.js |
| `Payments` | Payments/index.js | Yes | ❌ Dead code | Not imported in store.js |

### 10.2 Key Module Details

#### `auth` (Legacy Auth)
```
State: {
  authenticated: { isAuthen, isOAuth }
  pendingToken: String
  isSignIn: Boolean (controls SignIn modal)
  is2FA: Boolean (controls TwoFA modal)
  profile: Object (account data)
  message: Array (auth messages)
}
Actions: bootstrapSession, signIn, twofa, twofaSend, trustDevice,
         completeSignInFlow, signOut, message, createMessage, updateMessage
```

#### `Authentication` (Research Auth)
```
State: {
  user: Object
  token: String
  isAuthenticated: Boolean
}
Actions: login, register, logout, restoreSession
Getters: isAuthenticated, currentUser, userRole, isAdmin, isMFUStaff
```

#### `security` (RBAC)
```
State: {
  matrix: Object (path → permissions)
  assignments, permissions, loaded, loading
}
Actions: fetchMyPermissions
Getters: canAccess(path, action)
Sub-modules: menu, group, permissionMatrix
```

#### `setting`
```
State: { lang: String }
Getter: setting/lang
Sub-modules: settingStatus, settingGroup, settingMessageAuthen,
             settingMessage, settingVerification
// Each sub-module: explorer, create, update, remove, toDraft
```

---

## 11. Research Proposal Workflow

### Status Flow Diagram

```
                                    ┌──────────────────┐
                              ┌────►│ revision_requested│◄────────────────┐
                              │     └────────┬─────────┘                  │
                              │              │ user แก้ไข + resubmit      │
                              │              ▼                            │
    ┌─────┐  submit  ┌──────────┐  ┌────────────┐  ┌─────────────────┐   │
    │draft│─────────►│submitted │─►│faculty_    │─►│faculty_approved │   │
    └─────┘          └──────────┘  │review_     │  └───────┬─────────┘   │
                                   │pending     │          │              │
                                   └────────────┘          ▼              │
                                              ┌────────────────┐          │
                                              │office_received │          │
                                              └───────┬────────┘          │
                                                      ▼                   │
                                              ┌────────────────┐          │
                                              │document_       │          │
                                              │checking        │          │
                                              └───────┬────────┘          │
                                                      ▼                   │
                                        ┌──────────────────────┐          │
                                        │assigned_to_committee │          │
                                        └──────────┬───────────┘          │
                                                   ▼                      │
                                        ┌──────────────────┐              │
                                        │under_review      │              │
                                        │(committee ให้     │              │
                                        │ คะแนน+ความเห็น)  │              │
                                        └──────────┬───────┘              │
                                                   ▼                      │
                                     ┌──────────────────────┐             │
                                     │meeting_completed     │             │
                                     └──────────┬───────────┘             │
                                                │                         │
                         ┌──────────────────────┼──────────────────┐      │
                         ▼                      ▼                  ▼      │
                   ┌──────────┐          ┌──────────┐    ┌────────────┐   │
                   │approved  │          │rejected  │    │revision_   │───┘
                   └────┬─────┘          └──────────┘    │requested   │
                        ▼                                └────────────┘
                  ┌──────────┐     (resubmit → second_round_review
                  │announced │      → approved/rejected/revision)
                  └──────────┘
```

### Review Process
1. Admin assigns committee members to a proposal (`POST /proposals/:id/assign-committee`)
2. Each committee member reviews independently:
   - Score by criteria (each has maxScore)
   - Comments by section (positive/negative/suggestion/concern/requirement)
   - Decision: approve / reject / revise
3. Admin sees all reviews, makes final decision
4. If "revise" → status becomes `revision_requested`, user edits and resubmits → `second_round_review` (round 2)
5. Maximum 2 rounds

### 15 Status Values
`draft`, `submitted`, `faculty_review_pending`, `faculty_approved`, `office_received`, `document_checking`, `assigned_to_committee`, `under_review`, `meeting_completed`, `revision_requested`, `resubmitted`, `second_round_review`, `approved`, `rejected`, `announced`

---

## 12. Security & RBAC System

### Permission Matrix Model

```
Security_Type (classification)
    │
    ├── Security_Group (role groups)
    │       │
    │       └── Security_Permission (what can this group do?)
    │               │
    │               ├── menu: Security_Menu (which page/path?)
    │               └── flags: all, view, edit, delete, action, logs
    │
    └── Security_Menu (pages/paths)

Security_Assignment (which account belongs to which group?)
    ├── account → Information_Accounts
    ├── group → Security_Group
    ├── dataScope: self | unit | org
    └── active: Boolean
```

### Permission Resolution
1. Load all `Security_Assignment` for an account where `active: true`
2. Get all `Security_Permission` records for those groups
3. OR-merge permissions per menu path across all groups
4. Result: `{ [path]: { all, view, edit, delete, action, logs } }`

### Frontend Permission Check
- Router guard checks `meta.permission.path` + `meta.permission.action`
- Vuex getter `security/canAccess(path, action)` checks the permission matrix
- Sidebar items can be filtered by role (via `_nav.js` `roles` array)

### ⚠️ Note: Security CRUD endpoints have NO authentication
The endpoints for managing types, groups, menus, permissions, and assignments are currently open (no auth middleware). Only `GET /security/permission/my` requires `x-access-token`.

---

## 13. Cross-Module Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                    DUAL AUTH SYSTEMS                          │
│                                                              │
│  ┌─────────────────────┐     ┌─────────────────────────┐    │
│  │  Legacy Auth         │     │  Modern Auth              │    │
│  │  (Google OAuth)      │     │  (Email/Password)         │    │
│  │                      │     │                           │    │
│  │  Information_Accounts│     │  User model               │    │
│  │  x-access-token      │     │  JWT Bearer token         │    │
│  │  IndexedDB storage   │     │  localStorage storage     │    │
│  │                      │     │                           │    │
│  │  Used by:            │     │  Used by:                 │    │
│  │  - IAM pages         │     │  - Research pages         │    │
│  │  - Security RBAC     │     │  - Proposals              │    │
│  │  - Settings          │     │  - Documents              │    │
│  │  - Accounts          │     │  - Meetings               │    │
│  │  - Training          │     │  - Notifications          │    │
│  └─────────────────────┘     │  - Reports                │    │
│                               │  - User management        │    │
│                               └─────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                 PROPOSAL ECOSYSTEM                            │
│                                                              │
│  Proposal ──────► ProposalReview (per reviewer, per round)   │
│     │                                                        │
│     ├──────────► ProposalDocument (versioned files)           │
│     │                                                        │
│     ├──────────► ProposalStatusLog (audit trail)              │
│     │                                                        │
│     ├──────────► ProposalMeeting (linked meetings)            │
│     │                                                        │
│     └──────────► Notification (workflow events)               │
│                                                              │
│  User ──────────► Proposal.applicantUserId                   │
│  User ──────────► Proposal.committeeIds[]                    │
│  User ──────────► ProposalReview.reviewerUserId              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                 SETTINGS ECOSYSTEM                            │
│                                                              │
│  Setting_Status ────► Information_Accounts.status            │
│  Setting_Status ────► Organization.status                    │
│  Setting_Group  ────► Information_Accounts.group             │
│  Setting_Verification → Account verification types           │
│  Setting_Messages ──► Response message templates             │
│  SystemSetting ─────► Key-value app configuration            │
│  EmailLog ──────────► Email send audit trail                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                 SECURITY RBAC                                │
│                                                              │
│  Information_Accounts                                        │
│       │                                                      │
│       └──► Security_Assignment                               │
│                 │                                            │
│                 └──► Security_Group                           │
│                           │                                  │
│                           └──► Security_Permission           │
│                                     │                        │
│                                     └──► Security_Menu       │
│                                           (path-based ACL)   │
└──────────────────────────────────────────────────────────────┘
```

---

## 14. Known Issues & Technical Debt

### Architecture Issues
1. **Dual auth system complexity** — Two separate auth flows (Google OAuth + 2FA vs Email/Password + JWT) with two different user models (`Information_Accounts` vs `User`), two token storage strategies (IndexedDB vs localStorage), and potential route conflicts
2. **Route shadowing** — Both auth systems define `GET /auth/me`. Legacy handler takes priority due to mount order in `app.routes.js`
3. **Security RBAC endpoints are unauthenticated** — All CRUD operations on security types/groups/menus/permissions/assignments are open endpoints
4. **Unused modules** — `category/` routes not mounted, `address/` routes all commented out, `Applications` and `Payments` Vuex modules exist but are not registered in store

### Frontend Issues
5. **Dead placeholder files** — `views/` folder has placeholder stubs (e.g., `AdminDashboard.vue` = "Coming soon...") that were created to fix compilation. Actual components are in `ResearchFormRS/` and router now correctly points to ResearchFormRS
6. **Unicode filename** — `ResearchFormRS/user/๊UserNotification.vue` has a Thai combining character `๊` prefix which could cause cross-platform issues

### Backend Issues
7. **Winston-MongoDB logger crashes** — Large response bodies (>16MB BSON limit) were crashing the process. Fixed with truncation and error handlers, but needs monitoring
8. **Redis not running** — Redis server is not installed/running locally. Non-fatal (app works without cache) but affects performance
9. **Mongoose deprecation** — Using `collection.ensureIndex` (deprecated), should use `createIndexes`
10. **Mixed env var naming** — `TOKENLANGTH` (typo for TOKEN_LENGTH) is used consistently but confusing

### Security Concerns
11. **Production CORS** — `corsAndIP.js` only allows `example.com` and `anotherdomain.com` — needs real domains
12. **Some Setting/Organization endpoints have no auth** — Anyone can create/update/delete organizations and settings
13. **JWT secret in .env** — `JWT_SECRET` is a simple string, should be rotated for production

---

## Environment Variables (.env)

```
MONGODB=mongodb+srv://[user]:[pass]@mfuresearchdev01.fjn6ydv.mongodb.net/mfu_research_dev
JWT_SECRET=mfu_research_secret_key_2025_change_in_production
JWT_EXPIRES_IN=7d
PORT=8082
KEY=center                  # AES-256-CBC encryption key
TIMEOUT=500000
TOKENLANGTH=32              # Random token length (bytes)
TOKENEXPIRED=30             # Token expiry (days)
TRANSACTIONEXPIRED=10
NODE_ENV=dev
EMAIL_USER=tharaksayasa@gmail.com
EMAIL_PASS=[Gmail App Password]
```

---

## 15. Development Progress & Recent Changes

> **Last Updated**: March 20, 2026

### 15.1 Backend Improvements

#### Robust Startup Launcher
- **File**: `backend-node/scripts/start-backend.js` (new)
- **File**: `backend-node/package.json` (`start` script updated)
- แก้ปัญหา port ค้าง (8081/8082) บน Windows — เปลี่ยนจาก `prestart: kill-port` เป็น Node launcher script ที่:
  - ตรวจ PID จาก `netstat -ano` → `taskkill /F /T`
  - รอจนพอร์ตว่างจริง (wait loop)
  - Spawn `nodemon` ผ่าน `npx.cmd` (Windows-safe)
- `npm start` เพียงคำสั่งเดียวจัดการทุกอย่าง

#### Proposal Code Generation
- **File**: `backend-node/server/Project/Proposal/services/proposal.service.js`
- เปลี่ยนจาก random/timestamp → **Daily Sequential Format**: `YYMMDDXXXX`
- ฟังก์ชัน `generateProposalCode()` — query วันนี้ → increment ลำดับ

#### Auth Route Shadowing Fix
- **File**: `backend-node/server/Project/Auth/routes/auth.route.js`
- JWT `GET /auth/me` ถูก shadow โดย legacy handler → ย้ายเป็น `GET /auth/user/me`
- Frontend `service/api.js` อัปเดตเรียก path ใหม่

#### Logger Stability
- **File**: `backend-node/config/logger.js`
- เพิ่ม transport error handler ป้องกัน uncaught exception
- Truncate response body >10KB ก่อนเขียนลง MongoDB
- ป้องกัน BSON 16MB limit crash

#### CORS Hardening
- **File**: `backend-node/config/corsAndIP.js` + `middleware/middlewares.js` + `config/express.js`
- เพิ่ม `PATCH`, `DELETE`, `OPTIONS` ใน allowedMethods
- จัดการ OPTIONS preflight ใน express.js

### 15.2 Frontend — Auth & Routing

#### Research Login/Logout Flow
- **File**: `fontend-vue/src/store/modules/Authentication/index.js`
  - Logout action: clear auth + hard redirect → `/pages/research-login`
- **File**: `fontend-vue/src/containers/TheHeaderDropdownAccnt.vue`
  - Logout dispatch → `Authentication/logout` + fallback `window.location.href`
- **File**: `fontend-vue/src/containers/TheContainer.vue`
  - Route-aware auth bootstrap (ข้าม legacy modal บน research routes)

#### Router Cleanup
- **File**: `fontend-vue/src/router/index.js`
  - Research routes → ชี้ไปยัง `ResearchFormRS/*` components จริง (ไม่ใช่ stub)
  - Root `/` redirect ตาม role
  - `guestOnly` guard สำหรับ login pages
  - Role-based redirect: committee→committee dashboard, admin→admin dashboard, researcher→userdashboard

### 15.3 Frontend — Header & Navigation

#### Notification Bell
- **File**: `fontend-vue/src/containers/TheHeader.vue`
  - เพิ่ม notification bell icon + unread badge ก่อน avatar
  - Fetch unread count จาก `/api/v1/notifications/?isRead=false`

#### Sidebar Cleanup
- **File**: `fontend-vue/src/containers/_nav.js`
  - ลบ Notifications ออกจาก User Panel (ย้ายไป header bell)
  - Legacy IAM menus ซ่อนด้วย role token

### 15.4 Frontend — UserDashboard Overhaul

**File**: `fontend-vue/src/ResearchFormRS/user/UserDashboard.vue`

#### Widget Cards (CWidgetDropdown)
- 4 cards: แบบร่าง / กำลังดำเนินการ / ขอแก้ไข / อนุมัติแล้ว
- แต่ละ card มี sparkline chart (CChartLine / CChartBar)
- ✅ **Clickable Widget Cards** — กดเพื่อกรองตาราง:
  - `@click="setFilter('draft')"` บนแต่ละ card wrapper
  - Active state: `scale(1.03)` + `outline: 3px solid #fff`
  - Inactive cards: `opacity: 0.6`
  - กดซ้ำ card เดิม → reset filter
- Stats คำนวณจากข้อมูลจริง (computed `stats`)

#### Filter System
- `activeFilter` — state เก็บ filter ปัจจุบัน (`null` = ทั้งหมด)
- `filterGroups` — mapping card key → array of statuses:
  - `draft`: `['draft']`
  - `submitted`: `['submitted', 'faculty_review_pending', 'faculty_approved', 'office_received', 'document_checking', 'assigned_to_committee', 'under_review', 'meeting_completed', 'second_round_review', 'resubmitted']`
  - `revision`: `['revision_requested']`
  - `approved`: `['approved', 'announced']`
  - `rejected`: `['rejected']`
- `filteredProposals` (computed) — กรอง proposals ตาม activeFilter
- `filterLabel` (computed) — "กรองตาม: ..." หรือ "โครงการทั้งหมด"
- Filter label + badge count + ปุ่ม "× ล้างตัวกรอง" แสดงเหนือตาราง

#### CDataTable (Advanced Table)
- `:items="filteredProposals"` (ใช้ข้อมูลที่กรองแล้ว)
- Pagination, sorter, column-filter, table-filter
- Column order: **ชื่อโครงการ → สถานะ → วันที่ยื่น → Action**
- Header text centered ทุกคอลัมน์ (`text-align:center` ใน `_style`)
- Slot content: สถานะ/วันที่/ปุ่ม จัดกลาง (`text-align:center; vertical-align:middle`)

#### Workflow Progress Bar (per row)
- `CBadge` แสดง status label + สี
- `CProgress` แสดง % ตาม workflow step:
  - draft=10%, submitted=20%, ... approved/rejected=100%
  - Animated สำหรับ statuses ที่กำลังดำเนินการ
  - Striped สำหรับ `revision_requested`
- `getProgressLabel()` — "ขั้นที่ X/10 — ..."
- Color mapping: secondary(draft), primary(in-progress), warning(revision), success(approved), danger(rejected)

### 15.5 Summary of All Modified Files

| File | Changes |
|---|---|
| `backend-node/scripts/start-backend.js` | **New** — Robust startup launcher (Windows port management) |
| `backend-node/package.json` | `start` script → launcher, removed fragile `prestart` |
| `backend-node/config/logger.js` | Error handler, body truncation |
| `backend-node/config/express.js` | OPTIONS preflight handling |
| `backend-node/config/corsAndIP.js` | Added PATCH/DELETE/OPTIONS methods |
| `backend-node/middleware/middlewares.js` | Dev CORS behavior |
| `backend-node/server/Project/Auth/routes/auth.route.js` | `/me` → `/user/me` |
| `backend-node/server/Project/Proposal/services/proposal.service.js` | Proposal code `YYMMDDXXXX` |
| `fontend-vue/src/service/api.js` | `auth.me` path updated |
| `fontend-vue/src/router/index.js` | Research routes → ResearchFormRS, guards, redirects |
| `fontend-vue/src/store/modules/Authentication/index.js` | Logout → research-login redirect |
| `fontend-vue/src/containers/TheContainer.vue` | Route-aware auth bootstrap |
| `fontend-vue/src/containers/TheHeader.vue` | Notification bell + unread badge |
| `fontend-vue/src/containers/TheHeaderDropdownAccnt.vue` | Logout dispatch fix |
| `fontend-vue/src/containers/_nav.js` | Sidebar cleanup (notification removed, IAM gated) |
| `fontend-vue/src/ResearchFormRS/user/UserDashboard.vue` | Full overhaul: widgets, table, filter, progress bars, column reorder |

### 15.6 What's NOT Changed (Preserved)
- Backend Proposal schema/model
- Auth middleware logic (both legacy + JWT)
- Admin/Committee views
- All existing API endpoints
- Security RBAC modules
- Database schemas

---

*End of analysis. This document covers the complete architecture, all API endpoints, all database models, all frontend routes, all Vuex state, the full proposal workflow, and all recent development changes of the MFU Research Proposal System.*
