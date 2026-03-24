# Workflow Status Simulation — แผนภาพจำลองสถานะโครงการวิจัย

เอกสารนี้จำลองการไหลของสถานะโครงการวิจัย (Proposal) ตั้งแต่ต้นจนจบ
โดยใช้ชื่อสถานะภาษาไทยตามที่แสดงใน Admin Settings (Read-only)

---

## ตารางอ้างอิงสถานะ (Status Key ↔ ชื่อไทย)

| Status Key | ชื่อแสดงผล (ไทย) | ไอคอน |
|------------|-----------------|-------|
| draft | ร่าง | 📝 |
| submitted | ยื่นแล้ว | 📄 |
| faculty_review_pending | รอประธานพิจารณา | 🏫 |
| faculty_approved | ประธานอนุมัติ | ✅ |
| office_received | ส่วนบริหารรับแล้ว | 📥 |
| document_checking | ตรวจสอบเอกสาร | 📋 |
| assigned_to_committee | มอบหมายกรรมการแล้ว | 👥 |
| under_review | กรรมการได้ให้ความเห็นแล้ว | 🔍 |
| meeting_completed | ประชุมเสร็จแล้ว | 📊 |
| revision_requested | ขอแก้ไข | 🔄 |
| resubmitted | ส่งแก้ไขแล้ว | 📝 |
| second_round_review | พิจารณารอบ 2 | 🔁 |
| approved | อนุมัติ | ✅ |
| rejected | ปฏิเสธ | ❌ |
| announced | ประกาศผลแล้ว | 📢 |

---

## 1) แผนภาพ Workflow หลัก — สถานะที่อนุญาต (Read-only)

```mermaid
flowchart TD
    A["📝 ร่าง\n(draft)"] -->|"นักวิจัยกดส่ง"| B["📄 ยื่นแล้ว"]
    B -->|"Admin ส่งให้ประธาน"| C["🏫 รอประธานพิจารณา"]
    C -->|"ประธานอนุมัติ"| D["✅ ประธานอนุมัติ"]
    D -->|"Admin รับเรื่อง"| E["📥 ส่วนบริหารรับแล้ว"]
    E -->|"เริ่มตรวจ"| F["📋 ตรวจสอบเอกสาร"]
    F -->|"เอกสารครบถ้วน"| G["👥 มอบหมายกรรมการแล้ว"]
    F -->|"เอกสารไม่ครบ"| REV["🔄 ขอแก้ไข"]
    G -->|"กรรมการประเมินเสร็จ"| H["🔍 กรรมการได้ให้ความเห็นแล้ว"]
    H -->|"ปิดผลประชุม"| I["📊 ประชุมเสร็จแล้ว"]
    I -->|"คะแนนผ่าน ≥60"| APP["✅ อนุมัติ"]
    I -->|"คะแนนไม่ผ่าน + ให้แก้ไข"| REV
    I -->|"คะแนนไม่ผ่าน + ไม่ให้แก้ไข"| REJ["❌ ปฏิเสธ"]
    REV -->|"นักวิจัยส่งแก้ไข"| RESUB["📝 ส่งแก้ไขแล้ว"]
    RESUB -->|"Admin เปิดรอบ 2"| SR["🔁 พิจารณารอบ 2"]
    SR -->|"คะแนนผ่าน ≥60"| APP
    SR -->|"ไม่ผ่าน + ยังไม่ครบ maxRounds"| REV
    SR -->|"ไม่ผ่าน + ครบ maxRounds"| REJ
    APP -->|"Admin ประกาศ"| ANN["📢 ประกาศผลแล้ว"]
    REJ -->|"Admin ประกาศ"| ANN

    style A fill:#E3F2FD,stroke:#1565C0
    style B fill:#E3F2FD,stroke:#1565C0
    style C fill:#FFF9C4,stroke:#F9A825
    style D fill:#C8E6C9,stroke:#2E7D32
    style E fill:#E3F2FD,stroke:#1565C0
    style F fill:#E3F2FD,stroke:#1565C0
    style G fill:#E8EAF6,stroke:#283593
    style H fill:#E8EAF6,stroke:#283593
    style I fill:#E1BEE7,stroke:#7B1FA2
    style APP fill:#C8E6C9,stroke:#2E7D32
    style REJ fill:#FFCDD2,stroke:#C62828
    style ANN fill:#FFF9C4,stroke:#F9A825
    style REV fill:#FFE0B2,stroke:#EF6C00
    style RESUB fill:#FFE0B2,stroke:#EF6C00
    style SR fill:#E1BEE7,stroke:#7B1FA2
```

---

## 2) แผนภาพ Transition ตามที่ Admin เห็น (Read-only Map)

```mermaid
flowchart LR
    subgraph "สถานะที่อนุญาต (Read-only)"
        S1["📄 ยื่นแล้ว"] --> S2["🏫 รอประธานพิจารณา"]
        S3["✅ ประธานอนุมัติ"] --> S4["📥 ส่วนบริหารรับแล้ว"]
        S4 --> S5["📋 ตรวจสอบเอกสาร"]
        S5 --> S6["👥 มอบหมายกรรมการแล้ว"]
        S5 --> S7["🔄 ขอแก้ไข"]
        S8["🔍 กรรมการได้ให้ความเห็นแล้ว"] --> S9["📊 ประชุมเสร็จแล้ว"]
        S9 --> S10["✅ อนุมัติ"]
        S9 --> S11["❌ ปฏิเสธ"]
        S9 --> S7
        S7 --> S12["📝 ส่งแก้ไขแล้ว"]
        S12 --> S13["🔁 พิจารณารอบ 2"]
        S13 --> S10
        S13 --> S11
        S13 --> S7
        S10 --> S14["📢 ประกาศผลแล้ว"]
        S11 --> S14
    end

    style S10 fill:#C8E6C9,stroke:#2E7D32
    style S11 fill:#FFCDD2,stroke:#C62828
    style S14 fill:#FFF9C4,stroke:#F9A825
    style S7 fill:#FFE0B2,stroke:#EF6C00
```

---

## 3) Simulation Path A — Happy Path (อนุมัติรอบ 1)

```mermaid
flowchart TD
    subgraph "เส้นทาง A: อนุมัติรอบแรก (คะแนนเฉลี่ย ≥ 60)"
        PA1["📝 ร่าง"] -->|"นักวิจัยกดส่ง\nSET submittedAt"| PA2["📄 ยื่นแล้ว"]
        PA2 -->|"Admin ส่งตรวจ"| PA3["🏫 รอประธานพิจารณา"]
        PA3 -->|"ประธานอนุมัติ\nSET facultyApprovedAt"| PA4["✅ ประธานอนุมัติ"]
        PA4 -->|"Admin รับเรื่อง\nSET officeReceivedAt"| PA5["📥 ส่วนบริหารรับแล้ว"]
        PA5 -->|"เริ่มตรวจเอกสาร"| PA6["📋 ตรวจสอบเอกสาร"]
        PA6 -->|"มอบหมาย 3 คน\nSET committeeIds"| PA7["👥 มอบหมายกรรมการแล้ว"]
        PA7 -->|"กรรมการประเมิน"| PA8["🔍 กรรมการได้ให้ความเห็นแล้ว"]
        PA8 -->|"ปิดประชุม (auto sync)"| PA9["📊 ประชุมเสร็จแล้ว"]
        PA9 -->|"เฉลี่ย 75 ≥ 60 ✅\nSET approvedAt"| PA10["✅ อนุมัติ"]
        PA10 -->|"Admin ประกาศ\nSET announcedAt"| PA11["📢 ประกาศผลแล้ว"]
    end

    style PA1 fill:#E3F2FD,stroke:#1565C0
    style PA10 fill:#C8E6C9,stroke:#2E7D32
    style PA11 fill:#FFF9C4,stroke:#F9A825
```

### Data Snapshot — Path A (แต่ละ Step)

```json
// Step 1: ร่าง
{ "currentStatus": "draft", "currentRound": 1, "committeeIds": [], "requiresRevision": false,
  "submittedAt": null, "facultyApprovedAt": null, "officeReceivedAt": null,
  "approvedAt": null, "rejectedAt": null, "announcedAt": null }

// Step 2: ยื่นแล้ว
{ "currentStatus": "submitted", "submittedAt": "2026-03-01T09:00:00" }

// Step 3: รอประธานพิจารณา
{ "currentStatus": "faculty_review_pending" }

// Step 4: ประธานอนุมัติ
{ "currentStatus": "faculty_approved", "facultyApprovedAt": "2026-03-05T14:30:00" }

// Step 5: ส่วนบริหารรับแล้ว
{ "currentStatus": "office_received", "officeReceivedAt": "2026-03-06T10:00:00" }

// Step 6: ตรวจสอบเอกสาร
{ "currentStatus": "document_checking" }

// Step 7: มอบหมายกรรมการแล้ว
{ "currentStatus": "assigned_to_committee", "committeeIds": ["C001", "C002", "C003"] }

// Step 8: กรรมการได้ให้ความเห็นแล้ว
{ "currentStatus": "under_review" }
// → ProposalReview: C001=75, C002=80, C003=70 (เฉลี่ย 75)

// Step 9: ประชุมเสร็จแล้ว (auto sync จาก Meeting)
{ "currentStatus": "meeting_completed" }

// Step 10: อนุมัติ
{ "currentStatus": "approved", "approvedAt": "2026-03-20T16:00:00" }

// Step 11: ประกาศผลแล้ว
{ "currentStatus": "announced", "announcedAt": "2026-03-25T09:00:00" }
```

---

## 4) Simulation Path B — แก้ไขแล้วผ่านรอบ 2

```mermaid
flowchart TD
    subgraph "เส้นทาง B: คะแนนไม่ผ่านรอบ 1 → แก้ไข → ผ่านรอบ 2"
        PB1["📝 ร่าง"] --> PB2["📄 ยื่นแล้ว"]
        PB2 --> PB3["🏫 รอประธานพิจารณา"]
        PB3 --> PB4["✅ ประธานอนุมัติ"]
        PB4 --> PB5["📥 ส่วนบริหารรับแล้ว"]
        PB5 --> PB6["📋 ตรวจสอบเอกสาร"]
        PB6 --> PB7["👥 มอบหมายกรรมการแล้ว"]
        PB7 --> PB8["🔍 กรรมการได้ให้ความเห็นแล้ว"]
        PB8 --> PB9["📊 ประชุมเสร็จแล้ว\nเฉลี่ย 55 ❌ (< 60)"]
        PB9 -->|"คะแนนไม่ผ่าน ขอแก้\nSET requiresRevision=true"| PB10["🔄 ขอแก้ไข\n(รอบ 1)"]
        PB10 -->|"นักวิจัยส่งแก้ไข\nSET requiresRevision=false"| PB11["📝 ส่งแก้ไขแล้ว"]
        PB11 -->|"Admin เปิดรอบ 2\nSET currentRound=2"| PB12["🔁 พิจารณารอบ 2"]
        PB12 -->|"เฉลี่ย 70 ≥ 60 ✅\nSET approvedAt"| PB13["✅ อนุมัติ"]
        PB13 -->|"ประกาศ\nSET announcedAt"| PB14["📢 ประกาศผลแล้ว"]
    end

    style PB9 fill:#FFCDD2,stroke:#C62828
    style PB10 fill:#FFE0B2,stroke:#EF6C00
    style PB11 fill:#FFE0B2,stroke:#EF6C00
    style PB12 fill:#E1BEE7,stroke:#7B1FA2
    style PB13 fill:#C8E6C9,stroke:#2E7D32
    style PB14 fill:#FFF9C4,stroke:#F9A825
```

### Data Snapshot — Path B (เฉพาะ Step ที่ต่างจาก Path A)

```json
// Step 9: ประชุมเสร็จแล้ว — คะแนน C001=70, C002=50, C003=45 เฉลี่ย 55 (ไม่ผ่าน)
{ "currentStatus": "meeting_completed", "currentRound": 1 }

// Step 10: ขอแก้ไข
{ "currentStatus": "revision_requested", "currentRound": 1, "requiresRevision": true }

// Step 11: ส่งแก้ไขแล้ว
{ "currentStatus": "resubmitted", "currentRound": 1, "requiresRevision": false }

// Step 12: พิจารณารอบ 2 — คะแนน C001=75, C002=70, C003=65 เฉลี่ย 70
{ "currentStatus": "second_round_review", "currentRound": 2 }

// Step 13: อนุมัติ (รอบ 2)
{ "currentStatus": "approved", "currentRound": 2, "approvedAt": "2026-04-10T14:00:00" }

// Step 14: ประกาศผลแล้ว
{ "currentStatus": "announced", "currentRound": 2, "announcedAt": "2026-04-15T09:00:00" }
```

---

## 5) Simulation Path C — ปฏิเสธ (ไม่ผ่านทั้ง 2 รอบ)

```mermaid
flowchart TD
    subgraph "เส้นทาง C: ไม่ผ่านทั้ง 2 รอบ → ปฏิเสธ"
        PC1["📝 ร่าง → ... → 📊 ประชุมเสร็จแล้ว\nเฉลี่ย 55 ❌ (รอบ 1)"]
        PC1 -->|"ขอแก้ไข"| PC2["🔄 ขอแก้ไข"]
        PC2 -->|"ส่งแก้ไข"| PC3["📝 ส่งแก้ไขแล้ว"]
        PC3 -->|"เปิดรอบ 2"| PC4["🔁 พิจารณารอบ 2\nคะแนนเฉลี่ย 50 ❌"]
        PC4 -->|"ไม่ผ่าน + ครบ 2 รอบ\nSET rejectedAt"| PC5["❌ ปฏิเสธ"]
        PC5 -->|"Admin ประกาศ\nSET announcedAt"| PC6["📢 ประกาศผลแล้ว"]
    end

    style PC1 fill:#E1BEE7,stroke:#7B1FA2
    style PC2 fill:#FFE0B2,stroke:#EF6C00
    style PC4 fill:#E1BEE7,stroke:#7B1FA2
    style PC5 fill:#FFCDD2,stroke:#C62828
    style PC6 fill:#FFF9C4,stroke:#F9A825
```

### Data Snapshot — Path C

```json
// Step: พิจารณารอบ 2 — คะแนน C001=55, C002=50, C003=45 เฉลี่ย 50
{ "currentStatus": "second_round_review", "currentRound": 2 }

// Step: ปฏิเสธ (ครบ maxRounds=2)
{ "currentStatus": "rejected", "currentRound": 2, "rejectedAt": "2026-04-10T14:00:00" }

// Step: ประกาศผลแล้ว
{ "currentStatus": "announced", "currentRound": 2, "announcedAt": "2026-04-15T09:00:00" }
```

---

## 6) Simulation Path D — ตรวจสอบเอกสาร → ขอแก้ไข (ก่อนถึงกรรมการ)

```mermaid
flowchart TD
    subgraph "เส้นทาง D: เอกสารไม่ครบ → ขอแก้ไข → กลับเข้าระบบ"
        PD1["📝 ร่าง → ... → 📋 ตรวจสอบเอกสาร"]
        PD1 -->|"เอกสารไม่ครบ"| PD2["🔄 ขอแก้ไข\nrequiresRevision=true\ncommitteeIds=[]"]
        PD2 -->|"นักวิจัยส่งแก้ไข"| PD3["📝 ส่งแก้ไขแล้ว\nrequiresRevision=false"]
        PD3 -->|"Admin ตรวจใหม่"| PD4["🔁 พิจารณารอบ 2\ncurrentRound=2"]
        PD4 -->|"เส้นทาง → มอบหมายกรรมการ / อนุมัติ / ปฏิเสธ"| PD5["...ต่อเส้นทาง A, B, หรือ C"]
    end

    style PD2 fill:#FFE0B2,stroke:#EF6C00
    style PD3 fill:#FFE0B2,stroke:#EF6C00
    style PD4 fill:#E1BEE7,stroke:#7B1FA2
```

---

## 7) จำลองคะแนนกรรมการ — ผลต่อสถานะถัดไป

### สมมติ: กรรมการ 3 คน, คะแนนผ่าน ≥ 60

```mermaid
flowchart TD
    MC["📊 ประชุมเสร็จแล้ว\nกรรมการ 3 คนให้คะแนนแล้ว"]

    MC --> GA
    MC --> GB
    MC --> GC
    MC --> GD
    MC --> GE

    subgraph GA["✅ กรณี A — 3/3 ผ่าน"]
        GA1["คนที่ 1: 75 ✅\nคนที่ 2: 80 ✅\nคนที่ 3: 70 ✅"]
        GA2["เฉลี่ย = 75\n→ อนุมัติ ✅"]
        GA1 --> GA2
    end

    subgraph GB["✅ กรณี B — 2/3 ผ่าน (เฉลี่ยผ่าน)"]
        GB1["คนที่ 1: 80 ✅\nคนที่ 2: 65 ✅\nคนที่ 3: 45 ❌"]
        GB2["เฉลี่ย = 63.3\n→ อนุมัติ ✅"]
        GB1 --> GB2
    end

    subgraph GC["🔄 กรณี C — 1/3 ผ่าน (เฉลี่ยไม่ผ่าน)"]
        GC1["คนที่ 1: 70 ✅\nคนที่ 2: 50 ❌\nคนที่ 3: 45 ❌"]
        GC2["เฉลี่ย = 55\n→ ขอแก้ไข 🔄"]
        GC1 --> GC2
    end

    subgraph GD["❌ กรณี D — 0/3 ผ่าน"]
        GD1["คนที่ 1: 40 ❌\nคนที่ 2: 35 ❌\nคนที่ 3: 50 ❌"]
        GD2["เฉลี่ย = 41.7\n→ ปฏิเสธ ❌"]
        GD1 --> GD2
    end

    subgraph GE["⚠️ กรณี E — พอดี 60"]
        GE1["คนที่ 1: 70 ✅\nคนที่ 2: 60 ⚠️\nคนที่ 3: 50 ❌"]
        GE2["เฉลี่ย = 60.0\n→ อนุมัติ ✅ (พอดีเกณฑ์)"]
        GE1 --> GE2
    end

    style GA fill:#C8E6C9,stroke:#2E7D32
    style GB fill:#DCEDC8,stroke:#558B2F
    style GC fill:#FFE0B2,stroke:#EF6C00
    style GD fill:#FFCDD2,stroke:#C62828
    style GE fill:#FFF9C4,stroke:#F9A825
```

### ตารางจำลองคะแนน

```
┌─────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────────┐
│ กรณี     │ กรรมการ 1  │ กรรมการ 2  │ กรรมการ 3  │ เฉลี่ย     │ ผ่าน?     │ สถานะถัดไป              │
├─────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────────────────┤
│ A       │ 75       │ 80       │ 70       │ 75.0     │ ✅ ผ่าน   │ → อนุมัติ              │
│ B       │ 80       │ 65       │ 45       │ 63.3     │ ✅ ผ่าน   │ → อนุมัติ              │
│ C       │ 70       │ 50       │ 45       │ 55.0     │ ❌ ไม่ผ่าน │ → ขอแก้ไข (ถ้ารอบ<2)   │
│ D       │ 40       │ 35       │ 50       │ 41.7     │ ❌ ไม่ผ่าน │ → ปฏิเสธ               │
│ E       │ 70       │ 60       │ 50       │ 60.0     │ ✅ ผ่าน   │ → อนุมัติ (พอดีเกณฑ์)   │
├─────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────────────────┤
│ F (ร2)  │ 75       │ 70       │ 65       │ 70.0     │ ✅ ผ่าน   │ → อนุมัติ (รอบ 2)      │
│ G (ร2)  │ 55       │ 50       │ 45       │ 50.0     │ ❌ ไม่ผ่าน │ → ปฏิเสธ (ครบ 2 รอบ)   │
└─────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────────────────┘
```

---

## 8) วงรอบแก้ไข (Revision Loop — maxRounds=2)

```mermaid
flowchart TD
    R1["📊 ประชุมเสร็จแล้ว\nคะแนนเฉลี่ย < 60 (รอบ 1)"]
    R1 -->|"Admin: ขอแก้ไข\nrequiresRevision = true"| R2["🔄 ขอแก้ไข (รอบ 1)"]
    R2 -->|"นักวิจัยส่งแก้\nrequiresRevision = false"| R3["📝 ส่งแก้ไขแล้ว"]
    R3 -->|"Admin เปิดรอบ 2\ncurrentRound = 2"| R4["🔁 พิจารณารอบ 2"]

    R4 --> CHECK{"คะแนนเฉลี่ยรอบ 2 ≥ 60?"}
    CHECK -->|"✅ ผ่าน"| R5["✅ อนุมัติ"]
    CHECK -->|"❌ ไม่ผ่าน"| CHECK2{"ครบ maxRounds (2) หรือยัง?"}
    CHECK2 -->|"✅ ครบแล้ว"| R6["❌ ปฏิเสธ\n(หมดสิทธิ์แก้ไข)"]
    CHECK2 -->|"❌ ยังไม่ครบ\n(ถ้า maxRounds > 2)"| R7["🔄 ขอแก้ไข (รอบถัดไป)"]

    R6 -.->|"กรณีพิเศษ:\nAdmin อนุญาตแก้ไขหลังปฏิเสธ"| R8["🔄 ขอแก้ไข (พิเศษ)"]

    style R5 fill:#C8E6C9,stroke:#2E7D32
    style R6 fill:#FFCDD2,stroke:#C62828
    style R2 fill:#FFE0B2,stroke:#EF6C00
    style R7 fill:#FFE0B2,stroke:#EF6C00
    style R8 fill:#E1BEE7,stroke:#7B1FA2
    style CHECK fill:#E3F2FD,stroke:#1565C0
    style CHECK2 fill:#E3F2FD,stroke:#1565C0
```

---

## 9) ใครทำอะไรได้ (Role-Action) — ภาษาไทย

```mermaid
flowchart LR
    subgraph RESEARCHER["👤 นักวิจัย"]
        NV1["ร่าง ➜ ยื่นแล้ว\n(กดส่งโครงการ)"]
        NV2["ขอแก้ไข ➜ ส่งแก้ไขแล้ว\n(กดส่งแก้ไข)"]
    end

    subgraph COMMITTEE["👥 กรรมการ"]
        KM1["กรรมการได้ให้ความเห็นแล้ว\n(บันทึกคะแนน/ความเห็น)"]
        KM2["⚠️ ไม่เปลี่ยนสถานะโครงการ\nเปลี่ยนเฉพาะ ProposalReview"]
    end

    subgraph ADMIN["🔑 Admin / ประธาน"]
        AD1["ยื่นแล้ว ➜ รอประธานพิจารณา"]
        AD2["รอประธานพิจารณา ➜ ประธานอนุมัติ"]
        AD3["ประธานอนุมัติ ➜ ส่วนบริหารรับแล้ว"]
        AD4["ส่วนบริหารรับแล้ว ➜ ตรวจสอบเอกสาร"]
        AD5["ตรวจสอบเอกสาร ➜ มอบหมายกรรมการแล้ว / ขอแก้ไข"]
        AD6["กรรมการได้ให้ความเห็นแล้ว ➜ ประชุมเสร็จแล้ว"]
        AD7["ประชุมเสร็จแล้ว ➜ อนุมัติ / ปฏิเสธ / ขอแก้ไข"]
        AD8["ส่งแก้ไขแล้ว ➜ พิจารณารอบ 2"]
        AD9["พิจารณารอบ 2 ➜ อนุมัติ / ปฏิเสธ / ขอแก้ไข"]
        AD10["อนุมัติ ➜ ประกาศผลแล้ว"]
        AD11["ปฏิเสธ ➜ ประกาศผลแล้ว"]
    end

    subgraph SYSTEM["⚙️ ระบบ (อัตโนมัติ)"]
        SYS1["ปิดผลประชุม ➜\nมอบหมายกรรมการแล้ว/กรรมการได้ให้ความเห็น\n→ ประชุมเสร็จแล้ว\n(sync อัตโนมัติ)"]
    end

    style RESEARCHER fill:#E3F2FD,stroke:#1565C0
    style COMMITTEE fill:#FFF9C4,stroke:#F9A825
    style ADMIN fill:#E8EAF6,stroke:#283593
    style SYSTEM fill:#F3E5F5,stroke:#6A1B9A
```

---

## 10) State Diagram — ภาพรวมทุก Transition พร้อม Field Changes

```mermaid
stateDiagram-v2
    [*] --> ร่าง : สร้างโครงการ

    ร่าง --> ยื่นแล้ว : submitProposal()\nSET submittedAt
    ยื่นแล้ว --> รอประธานพิจารณา : changeStatus()
    รอประธานพิจารณา --> ประธานอนุมัติ : changeStatus()\nSET facultyApprovedAt
    ประธานอนุมัติ --> ส่วนบริหารรับแล้ว : changeStatus()\nSET officeReceivedAt
    ส่วนบริหารรับแล้ว --> ตรวจสอบเอกสาร : changeStatus()
    ตรวจสอบเอกสาร --> มอบหมายกรรมการแล้ว : assignCommittee()\nSET committeeIds
    ตรวจสอบเอกสาร --> ขอแก้ไข : changeStatus()\nSET requiresRevision=true
    มอบหมายกรรมการแล้ว --> กรรมการได้ให้ความเห็นแล้ว : changeStatus()
    กรรมการได้ให้ความเห็นแล้ว --> ประชุมเสร็จแล้ว : syncFromMeeting() AUTO
    ประชุมเสร็จแล้ว --> อนุมัติ : changeStatus()\nSET approvedAt\n(เฉลี่ย ≥ 60)
    ประชุมเสร็จแล้ว --> ขอแก้ไข : changeStatus()\nSET requiresRevision=true\n(เฉลี่ย < 60)
    ประชุมเสร็จแล้ว --> ปฏิเสธ : changeStatus()\nSET rejectedAt
    ขอแก้ไข --> ส่งแก้ไขแล้ว : resubmitProposal()\nSET requiresRevision=false
    ส่งแก้ไขแล้ว --> พิจารณารอบ2 : changeStatus()\nSET currentRound++
    พิจารณารอบ2 --> อนุมัติ : changeStatus()\nSET approvedAt
    พิจารณารอบ2 --> ปฏิเสธ : changeStatus()\nSET rejectedAt
    พิจารณารอบ2 --> ขอแก้ไข : changeStatus()\nSET requiresRevision=true
    อนุมัติ --> ประกาศผลแล้ว : changeStatus()\nSET announcedAt
    ปฏิเสธ --> ประกาศผลแล้ว : changeStatus()\nSET announcedAt
    ปฏิเสธ --> ขอแก้ไข : changeStatus()\n(กรณีพิเศษ)
    ประกาศผลแล้ว --> [*]
```

---

## 11) สรุป Field ที่เปลี่ยนในแต่ละ Transition

| จาก | ไป | Fields ที่เปลี่ยน | Function |
|-----|-----|-------------------|----------|
| ร่าง | ยื่นแล้ว | `currentStatus`, `submittedAt` | `submitProposal()` |
| ยื่นแล้ว | รอประธานพิจารณา | `currentStatus` | `changeProposalStatus()` |
| รอประธานพิจารณา | ประธานอนุมัติ | `currentStatus`, `facultyApprovedAt` | `changeProposalStatus()` |
| ประธานอนุมัติ | ส่วนบริหารรับแล้ว | `currentStatus`, `officeReceivedAt` | `changeProposalStatus()` |
| ส่วนบริหารรับแล้ว | ตรวจสอบเอกสาร | `currentStatus` | `changeProposalStatus()` |
| ตรวจสอบเอกสาร | มอบหมายกรรมการแล้ว | `currentStatus`, `committeeIds` | `assignCommittee()` |
| ตรวจสอบเอกสาร | ขอแก้ไข | `currentStatus`, `requiresRevision=true` | `changeProposalStatus()` |
| มอบหมายกรรมการแล้ว | กรรมการได้ให้ความเห็นแล้ว | `currentStatus` | `changeProposalStatus()` |
| กรรมการได้ให้ความเห็นแล้ว | ประชุมเสร็จแล้ว | `currentStatus` | `syncProposalStatusFromMeeting()` |
| ประชุมเสร็จแล้ว | อนุมัติ | `currentStatus`, `approvedAt` | `changeProposalStatus()` |
| ประชุมเสร็จแล้ว | ขอแก้ไข | `currentStatus`, `requiresRevision=true` | `changeProposalStatus()` |
| ประชุมเสร็จแล้ว | ปฏิเสธ | `currentStatus`, `rejectedAt` | `changeProposalStatus()` |
| ขอแก้ไข | ส่งแก้ไขแล้ว | `currentStatus`, `requiresRevision=false` | `resubmitProposal()` |
| ส่งแก้ไขแล้ว | พิจารณารอบ 2 | `currentStatus`, `currentRound++` | `changeProposalStatus()` |
| พิจารณารอบ 2 | อนุมัติ | `currentStatus`, `approvedAt` | `changeProposalStatus()` |
| พิจารณารอบ 2 | ปฏิเสธ | `currentStatus`, `rejectedAt` | `changeProposalStatus()` |
| พิจารณารอบ 2 | ขอแก้ไข | `currentStatus`, `requiresRevision=true` | `changeProposalStatus()` |
| อนุมัติ | ประกาศผลแล้ว | `currentStatus`, `announcedAt` | `changeProposalStatus()` |
| ปฏิเสธ | ประกาศผลแล้ว | `currentStatus`, `announcedAt` | `changeProposalStatus()` |
| ปฏิเสธ | ขอแก้ไข | `currentStatus`, `requiresRevision=true` | `changeProposalStatus()` |

---

## 12) Policy Validation — ตรวจสอบก่อนเปลี่ยนสถานะ

```mermaid
flowchart TD
    REQ["Admin กดเปลี่ยนสถานะ"]
    REQ --> CHECK_TRANS{"สถานะปลายทางอยู่ใน\nสถานะที่อนุญาต?"}
    CHECK_TRANS -->|"❌ ไม่อยู่"| ERR1["Error: ไม่อนุญาตให้เปลี่ยน"]
    CHECK_TRANS -->|"✅ อยู่"| CHECK_TARGET{"เปลี่ยนไปเป็น?"}

    CHECK_TARGET -->|"อนุมัติ"| VAL_APP["ตรวจ:\n1. กรรมการ ≥ 3 คน\n2. คะแนนเฉลี่ย ≥ 60"]
    CHECK_TARGET -->|"ปฏิเสธ"| VAL_REJ["ตรวจ:\n1. กรรมการ ≥ 3 คน"]
    CHECK_TARGET -->|"ขอแก้ไข\n(จาก ประชุมเสร็จแล้ว)"| VAL_REV["ตรวจ:\n1. อนุญาตแก้ไขหลังประชุม = true"]
    CHECK_TARGET -->|"พิจารณารอบ 2"| VAL_ROUND["ตรวจ:\n1. รอบปัจจุบัน < maxRounds"]
    CHECK_TARGET -->|"อื่นๆ"| PASS["ผ่าน ไม่ต้อง validate"]

    VAL_APP -->|"✅ ผ่าน"| SAVE["บันทึก + สร้าง StatusLog + Notification"]
    VAL_APP -->|"❌ ไม่ผ่าน"| ERR2["Error: กรรมการไม่ครบ / คะแนนไม่ถึง"]
    VAL_REJ -->|"✅ ผ่าน"| SAVE
    VAL_REJ -->|"❌ ไม่ผ่าน"| ERR3["Error: กรรมการยังไม่ครบ"]
    VAL_REV -->|"✅ ผ่าน"| SAVE
    VAL_REV -->|"❌ ไม่ผ่าน"| ERR4["Error: ไม่อนุญาตแก้ไขหลังประชุม"]
    VAL_ROUND -->|"✅ ผ่าน"| SAVE
    VAL_ROUND -->|"❌ ไม่ผ่าน"| ERR5["Error: ครบรอบแก้ไขแล้ว"]
    PASS --> SAVE

    style ERR1 fill:#FFCDD2,stroke:#C62828
    style ERR2 fill:#FFCDD2,stroke:#C62828
    style ERR3 fill:#FFCDD2,stroke:#C62828
    style ERR4 fill:#FFCDD2,stroke:#C62828
    style ERR5 fill:#FFCDD2,stroke:#C62828
    style SAVE fill:#C8E6C9,stroke:#2E7D32
```

---

## 13) Timeline เปรียบเทียบ 3 เส้นทาง

```
เส้นทาง A: อนุมัติรอบ 1 (Happy Path)
═══════════════════════════════════════════════════════════════════
ร่าง → ยื่นแล้ว → รอประธานพิจารณา → ประธานอนุมัติ
  → ส่วนบริหารรับแล้ว → ตรวจสอบเอกสาร → มอบหมายกรรมการแล้ว
  → กรรมการได้ให้ความเห็นแล้ว → ประชุมเสร็จแล้ว → อนุมัติ → ประกาศผลแล้ว
                                                    ▲ เฉลี่ย 75 ≥ 60

เส้นทาง B: แก้ไขแล้วผ่านรอบ 2
═══════════════════════════════════════════════════════════════════
ร่าง → ... → ประชุมเสร็จแล้ว (เฉลี่ย 55 < 60)
  → ขอแก้ไข → ส่งแก้ไขแล้ว → พิจารณารอบ 2 (เฉลี่ย 70 ≥ 60)
  → อนุมัติ → ประกาศผลแล้ว

เส้นทาง C: ปฏิเสธ (ไม่ผ่านทั้ง 2 รอบ)
═══════════════════════════════════════════════════════════════════
ร่าง → ... → ประชุมเสร็จแล้ว (เฉลี่ย 55 < 60)
  → ขอแก้ไข → ส่งแก้ไขแล้ว → พิจารณารอบ 2 (เฉลี่ย 50 < 60)
  → ปฏิเสธ (ครบ 2 รอบ) → ประกาศผลแล้ว
```

---

## 14) สรุปแผนภาพทั้งหมดในเอกสารนี้

| แผนภาพ | Section | เนื้อหา |
|---------|---------|---------|
| Workflow หลัก | §1 | เส้นทางทั้งหมดตั้งแต่ร่างถึงประกาศผลแล้ว |
| Read-only Map | §2 | สถานะที่อนุญาตตามที่ Admin เห็น |
| Path A (อนุมัติรอบ 1) | §3 | Happy Path พร้อม Data Snapshot |
| Path B (แก้ไข → ผ่านรอบ 2) | §4 | Revision path พร้อม Data Snapshot |
| Path C (ปฏิเสธ) | §5 | ไม่ผ่านทั้ง 2 รอบ |
| Path D (เอกสารไม่ครบ) | §6 | ขอแก้ไขก่อนถึงกรรมการ |
| คะแนนกรรมการ | §7 | จำลอง 7 กรณีคะแนน + ตาราง |
| วงรอบแก้ไข | §8 | Revision loop (maxRounds=2) |
| Role-Action | §9 | ใครทำอะไรได้ที่สถานะไหน |
| State Diagram | §10 | ภาพรวมทุก transition + field changes |
| Transition Table | §11 | ตาราง 20 transitions |
| Policy Validation | §12 | ตรวจสอบก่อนเปลี่ยนสถานะ |
| Timeline | §13 | เปรียบเทียบ 3 เส้นทาง |
