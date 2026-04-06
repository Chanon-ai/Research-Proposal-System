'use strict';

const RESEARCH_FORM_SETTING_GROUP = 'research_form';

const MANAGED_SETTING_KEYS = Object.freeze({
  PROPOSAL_WORKFLOW: 'proposal_workflow_config_json',
  ROLE_PAGE_ACCESS: 'research_role_page_access_config_json',
  FUNDING_BUDGET: 'funding_budget_config_json',
  BUDGET_MULTIPLIER: 'budget_multiplier_config_json',
  COMMITTEE_FEEDBACK: 'committee_feedback_config_json',
  RESEARCH_STANDARD: 'research_standard_config_json'
});

const PROPOSAL_WORKFLOW_DEFAULT = Object.freeze({
  statuses: [
    'draft',
    'pending_confirm',
    'submitted',
    'faculty_review_pending',
    'faculty_approved',
    'office_received',
    'document_checking',
    'assigned_to_committee',
    'under_review',
    'committee_valuated',
    'revision_requested',
    'resubmitted',
    'second_round_review',
    'approved',
    'rejected',
    'announced'
  ],
  inProgressStatuses: [
    'pending_confirm',
    'submitted',
    'faculty_review_pending',
    'faculty_approved',
    'office_received',
    'document_checking',
    'assigned_to_committee',
    'under_review',
    'committee_valuated',
    'resubmitted',
    'second_round_review'
  ],
  filterInProgressStatuses: [
    'submitted',
    'faculty_review_pending',
    'faculty_approved',
    'office_received',
    'document_checking',
    'assigned_to_committee',
    'under_review',
    'committee_valuated',
    'revision_requested',
    'resubmitted',
    'second_round_review'
  ],
  approvedStatuses: ['approved', 'announced'],
  readOnlyStatuses: [
    'pending_confirm',
    'submitted',
    'faculty_review_pending',
    'faculty_approved',
    'office_received',
    'document_checking',
    'assigned_to_committee',
    'under_review',
    'committee_valuated',
    'approved',
    'rejected',
    'announced'
  ],
  allowedTransitions: {
    draft: ['pending_confirm'],
    pending_confirm: ['submitted'],
    submitted: ['faculty_review_pending'],
    faculty_review_pending: ['faculty_approved'],
    faculty_approved: ['office_received'],
    office_received: ['document_checking'],
    document_checking: ['assigned_to_committee'],
    assigned_to_committee: ['under_review'],
    under_review: ['committee_valuated'],
    committee_valuated: ['approved', 'rejected', 'revision_requested'],
    revision_requested: ['resubmitted'],
    resubmitted: ['second_round_review'],
    second_round_review: ['committee_valuated'],
    approved: ['announced'],
    rejected: ['announced']
  },
  stepMap: {
    draft: 1,
    pending_confirm: 2,
    submitted: 2,
    faculty_review_pending: 3,
    faculty_approved: 4,
    office_received: 5,
    document_checking: 6,
    assigned_to_committee: 7,
    under_review: 8,
    committee_valuated: 9,
    revision_requested: 5,
    resubmitted: 6,
    second_round_review: 8,
    approved: 10,
    rejected: 10,
    announced: 10
  },
  labels: {
    admin: {
      draft: 'แบบร่าง',
      pending_confirm: 'รอการยืนยัน',
      submitted: 'ยื่นแล้ว',
      faculty_review_pending: 'รอประธานพิจารณา',
      faculty_approved: 'ประธานอนุมัติ',
      office_received: 'ส่วนบริหารรับแล้ว',
      document_checking: 'ตรวจสอบเอกสาร',
      assigned_to_committee: 'มอบหมายกรรมการแล้ว',
      under_review: 'พิจารณารอบ 1',
      committee_valuated: 'กรรมการได้ให้ความเห็นแล้ว',
      revision_requested: 'ขอแก้ไข',
      resubmitted: 'ส่งแก้ไขแล้ว',
      second_round_review: 'พิจารณารอบ 2',
      approved: 'อนุมัติ',
      rejected: 'ปฏิเสธ',
      announced: 'ประกาศผล'
    },
    researcher: {
      draft: 'แบบร่าง',
      pending_confirm: 'รอยืนยันผู้ร่วมโครงการ',
      submitted: 'ยื่นแล้ว',
      faculty_review_pending: 'รอประธานพิจารณา',
      faculty_approved: 'ประธานอนุมัติ',
      office_received: 'ส่วนบริหารรับแล้ว',
      document_checking: 'ตรวจสอบเอกสาร',
      assigned_to_committee: 'มอบหมายกรรมการแล้ว',
      under_review: 'พิจารณารอบ 1',
      committee_valuated: 'กรรมการได้ให้ความเห็นแล้ว',
      revision_requested: 'ขอแก้ไข',
      resubmitted: 'ส่งแก้ไขแล้ว',
      second_round_review: 'พิจารณารอบ 2',
      approved: 'อนุมัติ',
      rejected: 'ปฏิเสธ',
      announced: 'ประกาศผล'
    },
    badge: {
      draft: 'ร่าง',
      pending_confirm: 'รอการยืนยัน',
      submitted: 'ยื่นแล้ว',
      faculty_review_pending: 'รอคณะพิจารณา (คณะ)',
      faculty_approved: 'ผ่านการพิจารณา (คณะ)',
      office_received: 'สำนักงานรับเรื่องแล้ว',
      document_checking: 'ตรวจเอกสาร',
      assigned_to_committee: 'มอบหมายกรรมการแล้ว',
      under_review: 'พิจารณารอบ 1',
      committee_valuated: 'กรรมการได้ให้ความเห็นแล้ว',
      revision_requested: 'ขอแก้ไข',
      resubmitted: 'ส่งแก้ไขแล้ว',
      second_round_review: 'พิจารณารอบ 2',
      approved: 'อนุมัติ',
      rejected: 'ไม่อนุมัติ',
      announced: 'ประกาศผล'
    }
  },
  colors: {
    hex: {
      draft: '#9CA3AF',
      pending_confirm: '#60A5FA',
      submitted: '#3B82F6',
      faculty_review_pending: '#3B82F6',
      faculty_approved: '#34D399',
      office_received: '#38BDF8',
      document_checking: '#FACC15',
      assigned_to_committee: '#A78BFA',
      under_review: '#6366F1',
        committee_valuated: '#EF4444',
      revision_requested: '#FB923C',
      resubmitted: '#22D3EE',
      second_round_review: '#8B5CF6',
      approved: '#059669',
      rejected: '#EF4444',
      announced: '#14B8A6'
    },
    reportHex: {
      draft: '#6c757d',
      submitted: '#17a2b8',
      faculty_review_pending: '#ffc107',
      faculty_approved: '#007bff',
      office_received: '#17a2b8',
      document_checking: '#fd7e14',
      assigned_to_committee: '#007bff',
      under_review: '#e83e8c',
        committee_valuated: '#dc3545',
      revision_requested: '#dc3545',
      resubmitted: '#20c997',
      second_round_review: '#fd7e14',
      approved: '#28a745',
      rejected: '#dc3545',
      announced: '#007bff'
    },
    coreui: {
      admin: {
        draft: 'secondary', pending_confirm: 'secondary', submitted: 'info', faculty_review_pending: 'warning',
        faculty_approved: 'primary', office_received: 'primary', document_checking: 'warning', assigned_to_committee: 'info',
          under_review: 'danger', committee_valuated: 'danger', revision_requested: 'danger', resubmitted: 'info',
        second_round_review: 'warning', approved: 'success', rejected: 'danger', announced: 'primary'
      },
      badge: {
        draft: 'secondary', pending_confirm: 'secondary', submitted: 'info', faculty_review_pending: 'warning',
        faculty_approved: 'primary', office_received: 'primary', document_checking: 'warning', assigned_to_committee: 'info',
          under_review: 'warning', committee_valuated: 'danger', revision_requested: 'danger', resubmitted: 'info',
        second_round_review: 'warning', approved: 'success', rejected: 'danger', announced: 'success'
      },
      researchForm: {
        draft: 'secondary', pending_confirm: 'warning', submitted: 'info', faculty_review_pending: 'warning',
        faculty_approved: 'primary', office_received: 'primary', document_checking: 'warning', assigned_to_committee: 'info',
          under_review: 'danger', committee_valuated: 'danger', revision_requested: 'danger', resubmitted: 'info',
        second_round_review: 'warning', approved: 'success', rejected: 'danger', announced: 'primary'
      }
    }
  },
  committeeDashboard: {
    flowStatuses: [
      'assigned_to_committee',
      'under_review',
      'committee_valuated',
      'revision_requested',
      'resubmitted',
      'second_round_review',
      'announced'
    ],
    pendingStatuses: [
      'assigned_to_committee',
      'under_review',
      'second_round_review'
    ],
    reviewedStatuses: [
      'committee_valuated',
      'approved',
      'rejected'
    ],
    labels: {
      assigned_to_committee: 'รอการประเมิน',
      under_review: 'พิจารณารอบ {roundNo}',
      committee_valuated: 'ส่งผลการประเมินแล้ว',
      revision_requested: 'ขอแก้ไข',
      resubmitted: 'ส่งแก้ไขแล้ว',
      second_round_review: 'พิจารณารอบ {roundNo}',
      announced: 'ประกาศผล'
    },
    colors: {
      background: {
        assigned_to_committee: 'rgba(59, 130, 246, 0.45)',
        under_review: 'rgba(124, 58, 237, 0.45)',
          committee_valuated: 'rgba(220, 53, 69, 0.45)',
        revision_requested: 'rgba(249, 115, 22, 0.45)',
        resubmitted: 'rgba(6, 182, 212, 0.45)',
        second_round_review: 'rgba(168, 85, 247, 0.45)',
        announced: 'rgba(17, 24, 39, 0.38)'
      },
      border: {
        assigned_to_committee: 'rgba(59, 130, 246, 1)',
        under_review: 'rgba(124, 58, 237, 1)',
          committee_valuated: 'rgba(220, 53, 69, 1)',
        revision_requested: 'rgba(249, 115, 22, 1)',
        resubmitted: 'rgba(6, 182, 212, 1)',
        second_round_review: 'rgba(168, 85, 247, 1)',
        announced: 'rgba(17, 24, 39, 1)'
      }
    }
  }
});

const ROLE_ORDER = Object.freeze(['researcher', 'committee', 'admin', 'chairman']);

const ROLE_PAGE_ACCESS_DEFAULT = Object.freeze([
  { pageKey: 'user-dashboard', label: 'หน้าหลักผู้วิจัย', path: '/userdashboard', matchMode: 'exact', roles: ['researcher', 'admin', 'chairman'] },
  { pageKey: 'user-profile', label: 'โปรไฟล์ผู้วิจัย', path: '/user/profile', matchMode: 'exact', roles: ['researcher', 'admin', 'chairman'] },
  { pageKey: 'user-history', label: 'ประวัติการยื่นโครงการ', path: '/user/history', matchMode: 'exact', roles: ['researcher', 'admin', 'chairman'] },
  { pageKey: 'user-notification', label: 'การแจ้งเตือนผู้วิจัย', path: '/user/notification', matchMode: 'exact', roles: ['researcher', 'admin', 'chairman'] },
  { pageKey: 'user-meetings', label: 'ตารางประชุมผู้วิจัย', path: '/user/meetings', matchMode: 'exact', roles: ['researcher', 'admin', 'chairman'] },
  { pageKey: 'research-form', label: 'ฟอร์มข้อเสนอโครงการ', path: '/research-form', matchMode: 'prefix', roles: ['researcher', 'committee', 'admin', 'chairman'] },
  { pageKey: 'admin-dashboard', label: 'แดชบอร์ดแอดมิน', path: '/admin/dashboard', matchMode: 'exact', roles: ['admin', 'chairman'] },
  { pageKey: 'admin-proposals', label: 'จัดการโครงการ', path: '/admin/proposals', matchMode: 'prefix', roles: ['admin', 'chairman'] },
  { pageKey: 'admin-documents', label: 'เอกสารโครงการ', path: '/admin/documents', matchMode: 'exact', roles: ['admin', 'chairman'] },
  { pageKey: 'admin-users', label: 'จัดการผู้ใช้งาน', path: '/admin/users', matchMode: 'exact', roles: ['admin', 'chairman'] },
  { pageKey: 'admin-meetings', label: 'จัดการประชุม', path: '/admin/meetings', matchMode: 'exact', roles: ['admin', 'chairman'] },
  { pageKey: 'admin-notifications', label: 'การแจ้งเตือนแอดมิน', path: '/admin/notifications', matchMode: 'exact', roles: ['admin', 'chairman'] },
  { pageKey: 'admin-reports', label: 'รายงาน', path: '/admin/reports', matchMode: 'exact', roles: ['admin', 'chairman'] },
  { pageKey: 'admin-settings', label: 'ตั้งค่าระบบ', path: '/admin/settings', matchMode: 'exact', roles: ['admin', 'chairman'], requiredRoles: ['admin', 'chairman'] },
  { pageKey: 'committee-dashboard', label: 'แดชบอร์ดคณะกรรมการ', path: '/committee/dashboard', matchMode: 'exact', roles: ['committee', 'admin', 'chairman'] },
  { pageKey: 'committee-assigned', label: 'รายการที่ได้รับมอบหมาย', path: '/committee/assigned', matchMode: 'exact', roles: ['committee', 'admin', 'chairman'] },
  { pageKey: 'committee-meetings', label: 'ประชุมคณะกรรมการ', path: '/committee/meetings', matchMode: 'exact', roles: ['committee', 'admin', 'chairman'] },
  { pageKey: 'committee-notifications', label: 'การแจ้งเตือนคณะกรรมการ', path: '/committee/notifications', matchMode: 'exact', roles: ['committee', 'admin', 'chairman'] },
  { pageKey: 'committee-proposals', label: 'หน้าอ่านข้อเสนอของกรรมการ', path: '/committee/proposals', matchMode: 'prefix', roles: ['committee', 'admin', 'chairman'] }
]);

const FUNDING_BUDGET_DEFAULT = Object.freeze([
  {
    key: 'new-researcher',
    label: 'ทุนนักวิจัยรุ่นใหม่',
    budgetLimit: 100000,
    subOptions: [{ key: 'qualification-alignment', label: 'สอดคล้องกับคุณวุฒิ/สาขาวิชา/ภาระงาน' }]
  },
  {
    key: 'researcher-development',
    label: 'ทุนพัฒนานักวิจัย',
    budgetLimit: 200000,
    subOptions: [
      { key: 'economic-development', label: 'เศรษฐกิจสร้างสรรค์และการแข่งขัน' },
      { key: 'social-environment', label: 'สังคมและสิ่งแวดล้อม' },
      { key: 'science-technology', label: 'วิทยาศาสตร์ เทคโนโลยี และนวัตกรรม' },
      { key: 'human-resources', label: 'กำลังคนและสถาบันวิจัย' }
    ]
  },
  { key: 'strategic-research', label: 'ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์', budgetLimit: 300000, subOptions: [] },
  {
    key: 'industry-extension',
    label: 'ทุนต่อยอดสู่ภาคอุตสาหกรรม',
    budgetLimit: 300000,
    subOptions: [{ key: 'competitiveness', label: 'การเพิ่มขีดความสามารถการแข่งขัน' }]
  }
]);

const BUDGET_MULTIPLIER_DEFAULT = Object.freeze([
  { categoryKey: 'compensation', categoryLabel: 'หมวดค่าตอบแทน', multipliers: [{ label: 'จำนวน (คน)', value: 1, maxValue: null, isAdmin: false }, { label: 'จำนวน (ครั้ง/ด.)', value: 1, maxValue: null, isAdmin: false }, { label: 'อัตรา (บาท)', value: 5000, maxValue: null, isAdmin: true }] },
  { categoryKey: 'operating', categoryLabel: 'หมวดค่าใช้สอย', multipliers: [{ label: 'จำนวน (คน/ชิ้น)', value: 1, maxValue: null, isAdmin: false }, { label: 'จำนวน (วัน/ครั้ง)', value: 1, maxValue: null, isAdmin: false }, { label: 'อัตรา (บาท)', value: 5000, maxValue: null, isAdmin: true }] },
  { categoryKey: 'travel', categoryLabel: 'หมวดค่าเดินทาง', multipliers: [{ label: 'จำนวน (คน)', value: 1, maxValue: null, isAdmin: false }, { label: 'จำนวน (วัน/เที่ยว)', value: 1, maxValue: null, isAdmin: false }, { label: 'อัตรา (บาท)', value: 5000, maxValue: null, isAdmin: true }] },
  { categoryKey: 'material', categoryLabel: 'หมวดค่าวัสดุ', multipliers: [{ label: 'จำนวน', value: 1, maxValue: null, isAdmin: false }, { label: 'ตัวคูณ (ถ้ามี)', value: 1, maxValue: null, isAdmin: false }, { label: 'ราคา/หน่วย', value: 5000, maxValue: null, isAdmin: true }] },
  { categoryKey: 'utility', categoryLabel: 'หมวดค่าสาธารณูปโภค', multipliers: [{ label: 'จำนวน (เดือน)', value: 1, maxValue: null, isAdmin: false }, { label: 'จำนวน (หน่วย)', value: 1, maxValue: null, isAdmin: false }, { label: 'อัตรา (บาท)', value: 5000, maxValue: null, isAdmin: true }] },
  { categoryKey: 'equipment', categoryLabel: 'หมวดครุภัณฑ์', multipliers: [{ label: 'จำนวน (รายการ)', value: 1, maxValue: null, isAdmin: false }, { label: 'ตัวคูณ (ถ้ามี)', value: 1, maxValue: null, isAdmin: false }, { label: 'ราคา/ชุด', value: 5000, maxValue: null, isAdmin: true }] },
  { categoryKey: 'other', categoryLabel: 'หมวดอื่นๆ', multipliers: [{ label: 'จำนวน', value: 1, maxValue: null, isAdmin: false }, { label: 'หน่วย', value: 1, maxValue: null, isAdmin: false }, { label: 'ราคา/หน่วย', value: 0, maxValue: null, isAdmin: false }] }
]);

const COMMITTEE_FEEDBACK_DEFAULT = Object.freeze({
  lowScoreThreshold: 1,
  criteriaMap: {
    '1': { criteriaKey: '1', sectionKey: 'problem_significance', sectionNo: 6, sectionLabel: 'หัวข้อ 6 ความสำคัญของปัญหาและแนวคิด', rubricLabel: 'ความสำคัญและความชัดเจนของโจทย์วิจัย/คำถามวิจัย', target: 'projectDetails' },
    '2': { criteriaKey: '2', sectionKey: 'objectives', sectionNo: 7, sectionLabel: 'หัวข้อ 7 วัตถุประสงค์', rubricLabel: 'วัตถุประสงค์ของโครงการ', target: 'projectDetails' },
    '3': { criteriaKey: '3', sectionKey: 'literature_review', sectionNo: 8, sectionLabel: 'หัวข้อ 8 ทบทวนวรรณกรรม', rubricLabel: 'การทบทวนวรรณกรรม', target: 'projectDetails' },
    '4': { criteriaKey: '4', sectionKey: 'research_methodology', sectionNo: 10, sectionLabel: 'หัวข้อ 10 วิธีดำเนินการวิจัย', rubricLabel: 'กระบวนการและวิธีการ', target: 'projectDetails' },
    '5': { criteriaKey: '5', sectionKey: 'work_plan', sectionNo: 12, sectionLabel: 'หัวข้อ 12 แผนการดำเนินงาน', rubricLabel: 'แผนการดำเนินงาน', target: 'projectDetails' },
    '6': { criteriaKey: '6', sectionKey: 'expected_outcomes', sectionNo: 14, sectionLabel: 'หัวข้อ 14 ผลลัพธ์ที่คาดว่าจะได้รับ', rubricLabel: 'ผลลัพธ์ของโครงการวิจัย', target: 'projectDetails' },
    '7': { criteriaKey: '7', sectionKey: 'integration', sectionNo: 15, sectionLabel: 'หัวข้อ 15 การบูรณาการงานวิจัย', rubricLabel: 'การบูรณาการงานวิจัย', target: 'projectDetails' },
    '8': { criteriaKey: '8', sectionKey: 'transfer_level', sectionNo: 16, sectionLabel: 'หัวข้อ 16 ระดับการถ่ายทอดสู่สังคม', rubricLabel: 'ระดับการถ่ายทอดสังคม', target: 'projectDetails' },
    '9': { criteriaKey: '9', sectionKey: 'budget', sectionNo: 17, sectionLabel: 'หัวข้อ 17 งบประมาณโครงการ', rubricLabel: 'งบประมาณ', target: 'projectDetails' },
    '10': { criteriaKey: '10', sectionKey: 'research_team', sectionNo: null, sectionLabel: 'คณะผู้วิจัย', rubricLabel: 'คุณสมบัติของคณะผู้วิจัย', target: 'researchTeam' },
    '11': { criteriaKey: '11', sectionKey: 'strategic_alignment', sectionNo: 2, sectionLabel: 'หัวข้อ 2 ประเภททุนและความสอดคล้องกับแผนงานที่มหาวิทยาลัยกำหนด', rubricLabel: 'ความสอดคล้องกับแผนงานที่มหาวิทยาลัยกำหนด', target: 'projectDetails' }
  },
  fallbackMessages: {
    general: 'โปรดตรวจสอบและปรับปรุงข้อมูลในหัวข้อนี้ตามข้อเสนอแนะจากคณะกรรมการ',
    sectionPrefix: 'โปรดปรับปรุง{sectionLabel}ตามข้อเสนอแนะของคณะกรรมการ'
  }
});

const RESEARCH_STANDARD_DEFAULT = Object.freeze({
  statuses: { approved: 'approved', pending: 'pending' },
  groups: {
    human: {
      key: 'human',
      title: 'มีการทำวิจัยในมนุษย์',
      pendingNeedsDate: false,
      exampleDocKey: 'humanEthicsCertificate',
      options: [
        { value: 'approved', label: 'มีหนังสือรับรองจริยธรรมการวิจัยในมนุษย์ (แนบสำเนา 1 ชุด)' },
        { value: 'pending', label: 'ไม่มีหนังสือรับรองจริยธรรมการวิจัยในมนุษย์ อยู่ระหว่างเสนอคณะกรรมการวิจัยจริยธรรมการวิจัยในมนุษย์พิจารณา' }
      ]
    },
    animal: {
      key: 'animal',
      title: 'มีการใช้สัตว์ทดลอง',
      pendingNeedsDate: false,
      exampleDocKey: 'animalEthicsCertificate',
      options: [
        { value: 'approved', label: 'มีหนังสือรับรองจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์ (แนบสำเนา 1 ชุด)' },
        { value: 'pending', label: 'ไม่มีหนังสือรับรองจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์ อยู่ระหว่างเสนอคณะกรรมการจรรยาบรรณสัตว์เพื่องานทางวิทยาศาสตร์' }
      ]
    },
    plant: {
      key: 'plant',
      title: 'มีการเก็บ จัดหา หรือรวบรวมพันธุ์พืชพื้นเมืองทั่วไปและพันธุ์พืชป่าหรือส่วนหนึ่งส่วนใดของพันธุ์พืช เพื่อการศึกษา ทดลอง หรือวิจัย ตามมาตรา 53 แห่งพระราชบัญญัติคุ้มครองพันธุ์พืช พ.ศ. 2542',
      pendingNeedsDate: false,
      exampleDocKey: 'section53Notification',
      options: [
        { value: 'approved', label: 'มีหนังสือแจ้งการเก็บ จัดหา หรือรวบรวมพันธุ์พืชฯ ตามมาตรา 53 แห่งพระราชบัญญัติคุ้มครองพันธุ์พืช พ.ศ. 2542 (แนบสำเนา 1 ชุด)' },
        { value: 'pending', label: 'ไม่มีหนังสือแจ้งการเก็บ จัดหา หรือรวบรวมพันธุ์พืชฯ อยู่ระหว่างดำเนินการ' }
      ]
    }
  },
  urls: {
    section53Notification: 'https://research.mfu.ac.th/rs-variousresearch/rs-plant-species.html',
    section53FormsPage: 'https://www.doa.go.th/pvp/?page_id=13853',
    humanEthicsCertificate: 'https://ec.mfu.ac.th/ec-index.html',
    animalEthicsCertificate: 'https://research.mfu.ac.th/rs-variousresearch/rs-manual-animal.html'
  }
});

const MANAGED_DEFAULTS = Object.freeze({
  [MANAGED_SETTING_KEYS.PROPOSAL_WORKFLOW]: {
    description: 'Research proposal workflow config for ResearchFormRS',
    group: RESEARCH_FORM_SETTING_GROUP,
    value: PROPOSAL_WORKFLOW_DEFAULT
  },
  [MANAGED_SETTING_KEYS.ROLE_PAGE_ACCESS]: {
    description: 'Role based page access for ResearchFormRS routes',
    group: RESEARCH_FORM_SETTING_GROUP,
    value: ROLE_PAGE_ACCESS_DEFAULT
  },
  [MANAGED_SETTING_KEYS.FUNDING_BUDGET]: {
    description: 'Funding types and budget limits for ResearchFormRS',
    group: RESEARCH_FORM_SETTING_GROUP,
    value: FUNDING_BUDGET_DEFAULT
  },
  [MANAGED_SETTING_KEYS.BUDGET_MULTIPLIER]: {
    description: 'Budget multiplier config for ResearchFormRS budget sections',
    group: RESEARCH_FORM_SETTING_GROUP,
    value: BUDGET_MULTIPLIER_DEFAULT
  },
  [MANAGED_SETTING_KEYS.COMMITTEE_FEEDBACK]: {
    description: 'Committee feedback section mapping for ResearchFormRS',
    group: RESEARCH_FORM_SETTING_GROUP,
    value: COMMITTEE_FEEDBACK_DEFAULT
  },
  [MANAGED_SETTING_KEYS.RESEARCH_STANDARD]: {
    description: 'Research standard section config for ResearchFormRS',
    group: RESEARCH_FORM_SETTING_GROUP,
    value: RESEARCH_STANDARD_DEFAULT
  }
});

const MANAGED_KEY_SET = new Set(Object.keys(MANAGED_DEFAULTS));
const PUBLIC_KEY_SET = new Set(Object.keys(MANAGED_DEFAULTS));
const KNOWN_BUDGET_CATEGORY_KEYS = new Set(['compensation', 'operating', 'travel', 'material', 'utility', 'equipment', 'other']);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseJsonish(value) {
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  }
  if (value && typeof value === 'object') return value;
  return null;
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function normalizeFundingTypeKeys(value) {
  const source = Array.isArray(value) ? value : [];
  const seen = new Set();
  return source.reduce((result, item) => {
    const normalized = normalizeSlug(item);
    if (!normalized || seen.has(normalized)) return result;
    seen.add(normalized);
    result.push(normalized);
    return result;
  }, []);
}

function toNumber(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toOptionalNonNegativeNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, numeric);
}

function normalizeFundingBudgetConfig(rawValue) {
  const parsed = parseJsonish(rawValue);
  if (!Array.isArray(parsed)) return clone(FUNDING_BUDGET_DEFAULT);

  const normalized = parsed.map((item) => ({
    key: normalizeSlug(item && (item.key !== undefined ? item.key : item.value)),
    label: String(item && (item.label !== undefined ? item.label : (item.name !== undefined ? item.name : '')) || '').trim(),
    budgetLimit: Math.max(0, toNumber(item && item.budgetLimit, 0)),
    subOptions: (Array.isArray(item && item.subOptions) ? item.subOptions : []).map((subOption) => ({
      key: normalizeSlug(subOption && (subOption.key !== undefined ? subOption.key : subOption.value)),
      label: String(subOption && (subOption.label !== undefined ? subOption.label : (subOption.name !== undefined ? subOption.name : '')) || '').trim()
    })).filter((subOption) => subOption.key || subOption.label)
  })).filter((item) => item.key || item.label);

  return normalized.length > 0 ? normalized : clone(FUNDING_BUDGET_DEFAULT);
}

function normalizeBudgetMultiplierConfig(rawValue) {
  const parsed = parseJsonish(rawValue);
  if (!Array.isArray(parsed)) return clone(BUDGET_MULTIPLIER_DEFAULT);

  const normalized = parsed.map((category) => {
    const categoryKey = normalizeSlug(category && (category.categoryKey !== undefined ? category.categoryKey : category.key));
    return {
      categoryKey: KNOWN_BUDGET_CATEGORY_KEYS.has(categoryKey) ? categoryKey : '',
      categoryLabel: String(category && (category.categoryLabel !== undefined ? category.categoryLabel : category.label) || '').trim(),
      multipliers: (Array.isArray(category && category.multipliers) ? category.multipliers : []).map((multiplier) => ({
        label: String(multiplier && multiplier.label !== undefined ? multiplier.label : '').trim(),
        value: Math.max(0, toNumber(multiplier && multiplier.value, 0)),
        maxValue: toOptionalNonNegativeNumber(multiplier && multiplier.maxValue, null),
        isAdmin: Boolean(multiplier && multiplier.isAdmin)
      })).filter((multiplier) => multiplier.label),
      itemOverrides: (Array.isArray(category && category.itemOverrides) ? category.itemOverrides : []).map((itemOverride) => ({
        matchText: String(itemOverride && itemOverride.matchText !== undefined ? itemOverride.matchText : '').trim(),
        applyToAllFundingTypes: itemOverride && itemOverride.applyToAllFundingTypes !== undefined
          ? Boolean(itemOverride.applyToAllFundingTypes)
          : true,
        fundingTypeKeys: normalizeFundingTypeKeys(itemOverride && itemOverride.fundingTypeKeys),
        multipliers: (Array.isArray(itemOverride && itemOverride.multipliers) ? itemOverride.multipliers : []).map((multiplier) => ({
          label: String(multiplier && multiplier.label !== undefined ? multiplier.label : '').trim(),
          value: Math.max(0, toNumber(multiplier && multiplier.value, 0)),
          maxValue: toOptionalNonNegativeNumber(multiplier && multiplier.maxValue, null),
          isAdmin: Boolean(multiplier && multiplier.isAdmin)
        })).filter((multiplier) => multiplier.label)
      })).filter((itemOverride) => itemOverride.matchText && itemOverride.multipliers.length > 0)
    };
  }).filter((category) => category.categoryKey && category.multipliers.length > 0);

  return normalized.length > 0 ? normalized : clone(BUDGET_MULTIPLIER_DEFAULT);
}

function normalizeRolePageAccessConfig(rawValue) {
  const parsed = parseJsonish(rawValue);
  if (!Array.isArray(parsed)) return clone(ROLE_PAGE_ACCESS_DEFAULT);

  const normalized = parsed.map((row) => {
    const roles = Array.isArray(row && row.roles) ? row.roles : [];
    const requiredRoles = Array.isArray(row && row.requiredRoles) ? row.requiredRoles : [];
    const mergedRoles = ROLE_ORDER.filter((role) => {
      return roles.includes(role) || requiredRoles.includes(role);
    });

    return {
      pageKey: String(row && row.pageKey !== undefined ? row.pageKey : '').trim(),
      label: String(row && row.label !== undefined ? row.label : '').trim(),
      path: String(row && row.path !== undefined ? row.path : '').trim(),
      matchMode: String(row && row.matchMode || '').trim().toLowerCase() === 'prefix' ? 'prefix' : 'exact',
      roles: mergedRoles,
      requiredRoles: ROLE_ORDER.filter((role) => requiredRoles.includes(role))
    };
  }).filter((row) => row.pageKey && row.path);

  return normalized.length > 0 ? normalized : clone(ROLE_PAGE_ACCESS_DEFAULT);
}

function normalizeObjectOrDefault(rawValue, fallbackValue) {
  const parsed = parseJsonish(rawValue);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return clone(fallbackValue);
  return parsed;
}

function normalizeManagedSettingValue(key, rawValue) {
  switch (key) {
    case MANAGED_SETTING_KEYS.FUNDING_BUDGET:
      return normalizeFundingBudgetConfig(rawValue);
    case MANAGED_SETTING_KEYS.BUDGET_MULTIPLIER:
      return normalizeBudgetMultiplierConfig(rawValue);
    case MANAGED_SETTING_KEYS.ROLE_PAGE_ACCESS:
      return normalizeRolePageAccessConfig(rawValue);
    case MANAGED_SETTING_KEYS.PROPOSAL_WORKFLOW:
      return normalizeObjectOrDefault(rawValue, PROPOSAL_WORKFLOW_DEFAULT);
    case MANAGED_SETTING_KEYS.COMMITTEE_FEEDBACK:
      return normalizeObjectOrDefault(rawValue, COMMITTEE_FEEDBACK_DEFAULT);
    case MANAGED_SETTING_KEYS.RESEARCH_STANDARD:
      return normalizeObjectOrDefault(rawValue, RESEARCH_STANDARD_DEFAULT);
    default:
      return rawValue;
  }
}

function getManagedDefaultEntries(options = {}) {
  const requestedGroup = String(options.group || '').trim();
  const publicOnly = Boolean(options.publicOnly);

  return Object.keys(MANAGED_DEFAULTS)
    .filter((key) => !publicOnly || PUBLIC_KEY_SET.has(key))
    .filter((key) => !requestedGroup || MANAGED_DEFAULTS[key].group === requestedGroup)
    .map((key) => ({
      key,
      description: MANAGED_DEFAULTS[key].description,
      group: MANAGED_DEFAULTS[key].group,
      value: JSON.stringify(clone(MANAGED_DEFAULTS[key].value))
    }));
}

function normalizeManagedSettingInput(payload = {}) {
  const key = String(payload.key || '').trim();
  if (!MANAGED_KEY_SET.has(key)) {
    return {
      key,
      value: payload.value,
      description: payload.description,
      group: payload.group
    };
  }

  const definition = MANAGED_DEFAULTS[key];
  const normalizedValue = normalizeManagedSettingValue(key, payload.value);
  return {
    key,
    value: JSON.stringify(normalizedValue),
    description: payload.description !== undefined ? payload.description : definition.description,
    group: definition.group
  };
}

function isPublicSettingKey(key) {
  return PUBLIC_KEY_SET.has(String(key || '').trim());
}

module.exports = {
  MANAGED_SETTING_KEYS,
  RESEARCH_FORM_SETTING_GROUP,
  getManagedDefaultEntries,
  normalizeManagedSettingInput,
  isPublicSettingKey
};