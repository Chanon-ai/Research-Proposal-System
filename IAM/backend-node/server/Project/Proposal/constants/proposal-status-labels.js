const STATUS = require('./proposal-status');

module.exports = {
  [STATUS.DRAFT]: 'ร่าง',
  [STATUS.PENDING_CONFIRM]: 'รอการยืนยัน',
  [STATUS.SUBMITTED]: 'ยื่นแล้ว',
  [STATUS.FACULTY_REVIEW_PENDING]: 'ประธานกำลังพิจารณา',
  [STATUS.FACULTY_APPROVED]: 'ประธานอนุมัติ',
  [STATUS.FACULTY_REJECTED]: 'ประธานไม่อนุมัติ',
  [STATUS.OFFICE_RECEIVED]: 'ส่วนบริหารรับแล้ว',
  [STATUS.FINANCE_BUDGET_CHECKING]: 'เจ้าหน้าที่กำลังตรวจสอบงบประมาณ',
  [STATUS.MEETING_IN_PROGRESS]: 'กำลังจัดการประชุม',
  [STATUS.DOCUMENT_CHECKING]: 'ตรวจเอกสาร',
  [STATUS.ASSIGNED_TO_COMMITTEE]: 'มอบหมายกรรมการแล้ว',
  [STATUS.UNDER_REVIEW]: 'อยู่ระหว่างการพิจารณา',
  [STATUS.COMMITTEE_VALUATED]: 'กรรมการได้ให้ความเห็นแล้ว',
  [STATUS.MEETING_COMPLETED]: 'ส่วนบริหารกำลังจัดเตรียมผล',
  [STATUS.LEGACY_MEETING_COMPLETED]: 'ส่วนบริหารกำลังจัดเตรียมผล',
  [STATUS.REVISION_REQUESTED]: 'ขอแก้ไขเพิ่มเติม',
  [STATUS.RESUBMITTED]: 'ส่งใหม่',
  [STATUS.SECOND_ROUND_REVIEW]: 'รอบพิจารณาครั้งที่ 2',
  [STATUS.APPROVED]: 'อนุมัติ',
  [STATUS.REJECTED]: 'ไม่อนุมัติ',
  [STATUS.ANNOUNCED]: 'ประกาศผลแล้ว'
};

