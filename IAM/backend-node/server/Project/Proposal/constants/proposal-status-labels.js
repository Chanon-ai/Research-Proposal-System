const STATUS = require('./proposal-status');

module.exports = {
  [STATUS.DRAFT]: 'ร่าง',
  [STATUS.PENDING_CONFIRM]: 'รอการยืนยัน',
  [STATUS.SUBMITTED]: 'ยื่นแล้ว',
  [STATUS.FACULTY_REVIEW_PENDING]: 'รอคณะพิจารณา (คณะ)',
  [STATUS.FACULTY_APPROVED]: 'ผ่านการพิจารณา (คณะ)',
  [STATUS.OFFICE_RECEIVED]: 'สำนักงานรับเรื่องแล้ว',
  [STATUS.DOCUMENT_CHECKING]: 'ตรวจเอกสาร',
  [STATUS.ASSIGNED_TO_COMMITTEE]: 'มอบหมายกรรมการแล้ว',
  [STATUS.UNDER_REVIEW]: 'อยู่ระหว่างการพิจารณา',
  [STATUS.COMMITTEE_VALUATED]: 'กรรมการได้ให้ความเห็นแล้ว',
  [STATUS.LEGACY_MEETING_COMPLETED]: 'กรรมการได้ให้ความเห็นแล้ว',
  [STATUS.REVISION_REQUESTED]: 'ขอแก้ไขเพิ่มเติม',
  [STATUS.RESUBMITTED]: 'ส่งใหม่',
  [STATUS.SECOND_ROUND_REVIEW]: 'รอบพิจารณาครั้งที่ 2',
  [STATUS.APPROVED]: 'อนุมัติ',
  [STATUS.REJECTED]: 'ไม่อนุมัติ',
  [STATUS.ANNOUNCED]: 'ประกาศผลแล้ว'
};

