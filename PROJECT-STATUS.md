# สถานะโปรเจค Research Proposal System

อัปเดตล่าสุด: 20 มีนาคม 2026
แหล่งข้อมูลที่ใช้สรุป: โครงสร้างโปรเจค, เอกสารวิเคราะห์ระบบ, และ Git commits ล่าสุด

## Snapshot ปัจจุบัน
- Branch ปัจจุบัน: `main`
- Git working tree: สะอาด (ไม่มีไฟล์ค้างแก้ใน local ณ ตอนที่สรุป)
- ภาพรวมระบบ: Backend (Node.js/Express) + Frontend (Vue 2/CoreUI) พร้อมโครงสร้าง IAM และโมดูลฟอร์มข้อเสนองานวิจัย

## สิ่งที่ทำเพิ่มล่าสุด (จาก commit ล่าสุด)

### 1) ปรับ UI เป็น Dark Theme ต่อเนื่องในฝั่ง Frontend
- หน้า Research Form ถูกปรับเป็นโหมดมืด
- คอมโพเนนต์หลักที่เกี่ยวข้องกับฟอร์มวิจัยถูกปรับธีม เช่น
  - `ResearchForm.vue`
  - `BudgetSectionDemo.vue`
  - `FileManagement.vue`
  - `ProjectDetailsForm.vue`
  - `ResearchStandardSection.vue`
  - `ResearchTeamForm.vue`
  - `SignatureCard.vue`
  - `TestComponent/Section12.vue`

### 2) ปรับ Dark Theme ของหน้า Profile และ Notification Popup
- ปรับพื้นหลัง card/form/panel และสีข้อความให้เข้าธีมมืดทั้งระบบในหน้าผู้ใช้
- ไฟล์ที่เกี่ยวข้อง เช่น
  - `UserProfile.vue`
  - `UserHistory.vue`
  - `UserNotification.vue`
  - `TheHeader.vue`
  - `TheHeaderDropdownNotif.vue`
  - `projects/styles/global.scss`

### 3) ปรับ UX และ Responsive เพิ่มเติม
- ปรับปุ่ม autosave เป็นไอคอน
- ปรับรองรับการยืด/ยุบหน้าจอให้ดีขึ้นในส่วนฟอร์มวิจัย
- ปรับสีเฉพาะบาง section เช่น ข้อ 12 และข้อ 17

### 4) จัดระเบียบโค้ดบางส่วน
- มี commit ที่พับ/เก็บโค้ดตัวอย่างในบางไฟล์ เช่น `_nav.js`, `main.js`

## สถานะความคืบหน้า (เชิงงาน)
- งานฝั่ง Frontend Theme/UX: เดินหน้าเร็วและมีการปรับจริงหลายไฟล์ต่อเนื่อง
- งานฝั่ง Backend: โครงสร้างพร้อมใช้งานตามเอกสารวิเคราะห์ แต่รอบ commit ล่าสุดเน้น Frontend เป็นหลัก
- งาน Test/Docs ของรอบล่าสุด: ยังไม่เห็นหลักฐาน commit ที่เพิ่ม automated test ใหม่โดยตรงสำหรับการปรับธีมรอบนี้

## ประเด็นที่ควรตรวจสอบต่อ
- พบไฟล์ชื่อผิดปกติในโฟลเดอร์ผู้ใช้: `IAM/fontend-vue/src/ResearchFormRS/user/๊UserNotification.vue`
  - เสี่ยงเกิดไฟล์ซ้ำ/นำเข้าไฟล์ผิดตัว/ปัญหาบนบางระบบไฟล์
  - ควรตรวจว่าไฟล์นี้ตั้งใจสร้างหรือเกิดจากการพิมพ์ชื่อผิด

## ข้อเสนอแนะลำดับถัดไป
1. ตรวจและเคลียร์ไฟล์ชื่อผิดปกติ (`๊UserNotification.vue`) ให้เหลือไฟล์ canonical เดียว
2. รัน regression test ฝั่ง Frontend สำหรับหน้าที่ปรับธีม (Research Form, Profile, Notification)
3. เก็บภาพ Before/After และ checklist UAT ของ Dark Theme เพื่อปิดงานรอบนี้อย่างเป็นทางการ
4. หากจะเดินเฟสถัดไป ให้แยกเป็นรอบ Backend/Frontend/Test+Docs ตามแนวทางใน `AI-WORKFLOW.md`

## อ้างอิง commit ล่าสุดที่ใช้สรุป
- `348ff31` เปลี่ยนหน้า Research เป็นโหมดมืด
- `819909a` ปรับ dark theme หน้าโปรไฟล์และ popup แจ้งเตือน
- `bae7e2f` ปรับ autosave icon + responsive
- `5e01457` พับเก็บโค้ดตัวอย่าง
- `5737570` ปรับสีข้อ 12 (อัปโหลดเอกสาร)
- `f35a853` แต่งสีข้อ 17
