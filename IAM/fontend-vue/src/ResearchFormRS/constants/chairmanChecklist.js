const DEFAULT_CHAIRMAN_CHECKLIST_CONFIG = Object.freeze({
  templateVersion: 2,
  reviewerRole: 'chairman',
  reviewerLabel: 'ประธานสำนัก',
  cardTitleTh: 'Checklist พิจารณาข้อเสนอโครงการ',
  cardTitleEn: 'Proposal review checklist',
  cardTitle: 'Checklist พิจารณาข้อเสนอโครงการ',
  importStatus: 'complete',
  note: '',
  fundingTemplates: [
    {
      fundingTypeKey: 'new-researcher',
      fundingTypeLabel: 'ทุนนักวิจัยรุ่นใหม่',
      fundingTypeLabelEn: 'New Researcher Grant',
      sections: [
        {
          sectionKey: 'applicant_eligibility',
          sectionLabel: '1. คุณสมบัติของผู้ขอรับทุน',
          sectionLabelEn: '1. Applicant eligibility',
          description: 'ตรวจสอบคุณสมบัติของหัวหน้าโครงการตามเกณฑ์ของทุนนักวิจัยใหม่',
          descriptionEn: 'Verify that the project leader meets the eligibility criteria for the New Researcher Grant.',
          items: [
            {
              itemKey: 'academic_staff_position',
              label: 'เป็นพนักงานสายวิชาการ ตำแหน่งอาจารย์ หรือนักวิจัยของมหาวิทยาลัยแม่ฟ้าหลวง',
              labelEn: 'The applicant is an academic staff member (lecturer) or researcher at Mae Fah Luang University.'
            },
            {
              itemKey: 'qualification_alignment',
              label: 'มีคุณวุฒิสอดคล้องกับเนื้อหาของโครงการวิจัยที่เสนอ',
              labelEn: 'The applicant’s qualifications are aligned with the proposed research project.'
            },
            {
              itemKey: 'capability_and_time',
              label: 'มีศักยภาพและเวลาในการดำเนินโครงการวิจัยให้สำเร็จลุล่วงอย่างมีคุณภาพ และสามารถเผยแพร่ผลงานวิจัยได้ตามเกณฑ์ที่กำหนด',
              labelEn: 'The applicant has sufficient capability and time to complete the project with quality and publish the results per the required criteria.'
            },
            {
              itemKey: 'single_new_researcher_project',
              label: 'เสนอขอรับทุนนักวิจัยใหม่ในตำแหน่งหัวหน้าโครงการวิจัย ไม่เกิน 1 โครงการ',
              labelEn: 'The applicant submits no more than one New Researcher Grant proposal as the project leader.'
            },
            {
              itemKey: 'no_previous_new_researcher_grant',
              label: 'ไม่เคยได้รับทุนสนับสนุนการวิจัยประเภททุนนักวิจัยใหม่จากเงินรายได้มหาวิทยาลัยแม่ฟ้าหลวงมาก่อน ในตำแหน่งหัวหน้าโครงการ',
              labelEn: 'The applicant has not previously received the New Researcher Grant (MFU income) as the project leader.',
              description: 'ข้อยกเว้น: คณาจารย์หรือนักวิจัยด้านสังคมศาสตร์และมนุษยศาสตร์ สามารถขอเพิ่มได้ตามกรอบงบประมาณที่เหลือจากโครงการเดิม รวมแล้วไม่เกิน 100,000 บาท',
              descriptionEn: 'Exception: Social sciences and humanities staff/researchers may request additional support within the remaining budget of the previous project, with a total not exceeding 100,000 THB.'
            },
            {
              itemKey: 'not_on_study_leave',
              label: 'ไม่อยู่ระหว่างการลาศึกษาต่อ หรือมีแผนลาศึกษาต่อในระหว่างการรับทุน',
              labelEn: 'The applicant is not on study leave and has no study leave plan during the funding period.'
            },
            {
              itemKey: 'no_previous_other_grants',
              label: 'ไม่เคยได้รับทุนพัฒนานักวิจัย ทุนสอดคล้องยุทธศาสตร์การวิจัยและนวัตกรรม หรือทุนต่อยอดสู่ภาคอุตสาหกรรมมาก่อน นับตั้งแต่ปีงบประมาณ 2560',
              labelEn: 'The applicant has not previously received the Researcher Development Grant, Strategic Research & Innovation Alignment Grant, or Industry Extension Grant since fiscal year 2017.'
            },
            {
              itemKey: 'research_training_completed',
              label: 'หัวหน้าโครงการต้องผ่านการอบรมมาตรฐานการวิจัย หรือจริยธรรมการวิจัยในมนุษย์ที่เกี่ยวข้อง พร้อมแสดงหลักฐาน',
              labelEn: 'The project leader has completed research standards training and/or relevant human research ethics training and can provide supporting evidence.'
            }
          ]
        },
        {
          sectionKey: 'supported_project_characteristics',
          sectionLabel: '2. ลักษณะโครงการวิจัยที่ให้การสนับสนุน',
          sectionLabelEn: '2. Supported project characteristics',
          description: 'ตรวจสอบลักษณะของโครงการวิจัยและเงื่อนไขการสนับสนุนของทุนนักวิจัยใหม่',
          descriptionEn: 'Verify project characteristics and support conditions for the New Researcher Grant.',
          items: [
            {
              itemKey: 'has_project_advisor',
              label: 'ควรมีที่ปรึกษาโครงการวิจัยอย่างน้อย 1 คน ซึ่งเป็นผู้เชี่ยวชาญในสาขาที่เกี่ยวข้อง',
              labelEn: 'At least one project advisor is recommended, who is an expert in a relevant field.'
            },
            {
              itemKey: 'duration_within_one_year',
              label: 'ระยะเวลาดำเนินการไม่เกิน 1 ปี',
              labelEn: 'Project duration does not exceed 1 year.'
            },
            {
              itemKey: 'budget_within_limit',
              label: 'งบประมาณที่เสนอขอไม่เกิน 100,000 บาท และเป็นไปตามระเบียบที่มหาวิทยาลัยกำหนด',
              labelEn: 'Requested budget does not exceed 100,000 THB and complies with university regulations.'
            },
            {
              itemKey: 'clear_non_duplicate_problem',
              label: 'มีโจทย์วิจัยที่ชัดเจนและไม่ซ้ำซ้อนกับงานที่เคยมีผู้ทำมาก่อน',
              labelEn: 'The research problem is clear and not redundant with previously conducted work.'
            },
            {
              itemKey: 'feasible_objectives',
              label: 'มีวัตถุประสงค์การวิจัยที่ดำเนินการได้จริงและประเมินได้',
              labelEn: 'Research objectives are feasible and measurable.'
            },
            {
              itemKey: 'not_part_of_thesis',
              label: 'ต้องไม่เป็นส่วนหนึ่งของวิทยานิพนธ์ของผู้ขอรับทุนเพื่อสำเร็จการศึกษา',
              labelEn: 'The project must not be part of the applicant’s thesis for degree completion.'
            },
            {
              itemKey: 'publication_potential',
              label: 'มีศักยภาพสามารถตีพิมพ์ผลงานวิจัยตามเกณฑ์ที่มหาวิทยาลัยกำหนด',
              labelEn: 'The project has publication potential in accordance with university criteria.'
            }
          ]
        }
      ]
    },
    {
      fundingTypeKey: 'researcher-development',
      fundingTypeLabel: 'ทุนพัฒนานักวิจัย',
      fundingTypeLabelEn: 'Researcher Development Grant',
      sections: [
        {
          sectionKey: 'applicant_eligibility',
          sectionLabel: '1. คุณสมบัติของผู้ขอรับทุน',
          sectionLabelEn: '1. Applicant eligibility',
          description: 'ตรวจสอบคุณสมบัติของหัวหน้าโครงการตามเกณฑ์ของทุนพัฒนานักวิจัย',
          descriptionEn: 'Verify that the project leader meets the eligibility criteria for the Researcher Development Grant.',
          items: [
            {
              itemKey: 'academic_staff_position',
              label: 'เป็นพนักงานสายวิชาการ ตำแหน่งอาจารย์ หรือ นักวิจัยของมหาวิทยาลัยแม่ฟ้าหลวง',
              labelEn: 'The applicant is an academic staff member (lecturer or researcher) of Mae Fah Luang University.'
            },
            {
              itemKey: 'has_previous_new_researcher_or_other_grant',
              label: 'เคยได้รับทุนสนับสนุนการวิจัยประเภททุนนักวิจัยใหม่จากมหาวิทยาลัย และ/หรือ เคยได้รับทุนวิจัยจากแหล่งทุนใดก็ตามมาแล้ว อย่างน้อย 1 โครงการ',
              labelEn: 'The applicant has previously received a New Researcher Grant from the university and/or has received research funding from any other source for at least one project.'
            },
            {
              itemKey: 'single_researcher_development_project',
              label: 'เสนอขอรับทุนพัฒนานักวิจัยในตำแหน่งหัวหน้าโครงการวิจัย ได้ไม่เกิน 1 โครงการ',
              labelEn: 'The applicant may submit only one proposal for the Researcher Development Grant as the Principal Investigator.'
            },
            {
              itemKey: 'no_previous_researcher_development_grant',
              label: 'ไม่เคยได้รับทุนสนับสนุนการวิจัยจากจากเงินรายได้มหาวิทยาลัยแม่ฟ้าหลวง ประเภททุนพัฒนานักวิจัย (ในตำแหน่งหัวหน้าโครงการ) มาก่อน',
              labelEn: 'Never previously received a research grant from Mae Fah Luang University’s internal funding under the Researcher Development Grant category (as a principal investigator).',
              description: 'ข้อยกเว้น: คณาจารย์ นักวิจัย ด้านสังคมศาสตร์และมนุษยศาสตร์ ที่สามารถขอทุนประเภททุนพัฒนานักวิจัยเพิ่มได้ ตามกรอบงบประมาณที่เหลือจากเดิมของโครงการวิจัยที่เคยได้รับมาแล้ว ทั้งนี้ไม่เกินวงเงินงบประมาณ 200,000 บาท',
              descriptionEn: 'Exception: Social sciences and humanities staff/researchers may request additional support within the remaining budget of a previously funded project, not exceeding a total budget of 200,000 THB.'
            },
            {
              itemKey: 'no_outstanding_progress_fy2568',
              label: 'ไม่ค้างส่งรายงานความก้าวหน้าของโครงการวิจัยที่ได้รับทุนสนับสนุนการวิจัยจากเงินรายได้มหาวิทยาลัยแม่ฟ้าหลวง และทุน Basic Research ปีงบประมาณ 2568',
              labelEn: 'The applicant has no outstanding progress reports for any MFU-funded research projects or Basic Research grants from FY2025.'
            },
            {
              itemKey: 'no_outstanding_final_fy2567',
              label: 'ไม่ค้างส่งรายงานวิจัยฉบับสมบูรณ์ปีงบประมาณ 2567 (เฉพาะงบ มฟล. และทุน Basic Research)',
              labelEn: 'The applicant has no outstanding final reports from FY2024 (MFU and Basic Research grants).'
            },
            {
              itemKey: 'no_pending_projects_fy2566',
              label: 'ไม่มีงานวิจัยคงค้างปีงบประมาณ 2566 และปีก่อนหน้า (เฉพาะงบ มฟล. และทุน Basic Research)',
              labelEn: 'The applicant has no pending research projects from FY2023 or earlier (MFU and Basic Research grants only).'
            },
            {
              itemKey: 'not_on_study_leave',
              label: 'ไม่อยู่ระหว่างการศึกษาต่อ หรือมีแผนลาศึกษาต่อในระหว่างการรับทุน',
              labelEn: 'The applicant is not currently on study leave and has no plans to take such leave during the grant period.'
            },
            {
              itemKey: 'no_suspended_terminated_in_2years',
              label: 'ไม่ถูกระงับ ยกเลิก บอกเลิก หรือยุติโครงการวิจัยจากแหล่งทุนใดๆ (ภายในระยะเวลา 2 ปี ก่อนหน้าการยื่นเสนอขอ)',
              labelEn: 'The applicant has not had a project suspended, terminated, or canceled by any funding agency in the past 2 years.'
            },
            {
              itemKey: 'no_strategic_grant_since_2560',
              label: 'ไม่เคยได้รับทุนสอดคล้องยุทธศาสตร์การวิจัยและนวัตกรรม (ในตำแหน่งหัวหน้าโครงการ) มาก่อน (นับตั้งแต่ปีงบประมาณ พ.ศ.2560 จนถึงปัจจุบัน)',
              labelEn: 'The applicant has not received a Strategic Research and Innovation Grant (as PI) from FY2017 to present.'
            },
            {
              itemKey: 'research_ethics_training',
              label: 'หัวหน้าโครงการต้องผ่านการอบรมมาตรฐานการวิจัย และ/หรือ มาตรฐานจริยธรรมการวิจัยในมนุษย์ ที่เกี่ยวข้องกับโครงการวิจัย พร้อมแสดงหลักฐานการผ่านการอบรม',
              labelEn: 'The PI has completed training in research standards and/or human research ethics and must provide proof of training.'
            }
          ]
        },
        {
          sectionKey: 'project_characteristics',
          sectionLabel: '2. ลักษณะโครงการวิจัยที่ให้การสนับสนุน',
          sectionLabelEn: '2. Project characteristics',
          description: 'ตรวจสอบลักษณะโครงการวิจัยให้เป็นไปตามเกณฑ์ของทุนพัฒนานักวิจัย',
          descriptionEn: 'Verify that the proposed project meets the criteria for the Researcher Development Grant.',
          items: [
            {
              itemKey: 'duration_within_1year',
              label: 'เป็นโครงการวิจัยที่ใช้ระยะเวลาดำเนินการไม่เกิน 1 ปี',
              labelEn: 'The project must be completed within 1 year.'
            },
            {
              itemKey: 'budget_not_exceed_200k',
              label: 'งบประมาณที่เสนอขอไม่เกิน 200,000 บาท โดยมีรายการค่าใช้จ่ายในโครงการวิจัย เป็นไปตามระเบียบฯ อัตราฯ ที่มหาวิทยาลัยกำหนด',
              labelEn: 'The proposed budget must not exceed 200,000 THB, and all expenses must comply with MFU’s financial and budgeting regulations.'
            },
            {
              itemKey: 'clear_original_question',
              label: 'มีโจทย์วิจัยที่ชัดเจนและไม่ซ้ำซ้อนกับงานที่เคยมีผู้ทำมาก่อน',
              labelEn: 'The research must have a clear and original research question.'
            },
            {
              itemKey: 'objectives_feasible_measurable',
              label: 'มีวัตถุประสงค์การวิจัยที่สามารถดำเนินการได้จริง และสามารถประเมินได้',
              labelEn: 'The objectives must be feasible and measurable.'
            },
            {
              itemKey: 'publication_potential',
              label: 'มีศักยภาพสามารถตีพิมพ์ผลงานวิจัยตามเกณฑ์ที่มหาวิทยาลัยกำหนด',
              labelEn: 'The research must have potential for publication as per the university’s requirements.'
            },
            {
              itemKey: 'align_mhesi_strategies',
              label: 'เป็นโครงการวิจัยที่สอดคล้องตามนโยบายและยุทธศาสตร์ อววน.(พ.ศ.2566-2570) ตามเป้าประสงค์ของการพัฒนา 4 ด้าน',
              labelEn: 'The project must align with the strategies and policies of the Ministry of Higher Education, Science, Research and Innovation (MHESI), 2023–2027, covering the four strategic goals.'
            }
          ]
        }
      ]
    },
    {
      fundingTypeKey: 'strategic-research',
      fundingTypeLabel: 'ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์การวิจัยและนวัตกรรม',
      fundingTypeLabelEn: 'Grant aligned with national Research and Innovation strategies',
      sections: [
        {
          sectionKey: 'applicant_eligibility',
          sectionLabel: '1. คุณสมบัติของผู้ขอรับทุน',
          sectionLabelEn: '1. Applicant eligibility',
          description: 'ตรวจสอบคุณสมบัติของหัวหน้าโครงการตามเกณฑ์ของทุนวิจัยที่สอดคล้องกับยุทธศาสตร์การวิจัยและนวัตกรรม',
          descriptionEn: 'Verify that the project leader meets the eligibility criteria for the grant aligned with national research and innovation strategies.',
          items: [
            {
              itemKey: 'academic_staff_position',
              label: 'เป็นพนักงานสายวิชาการ ตำแหน่งอาจารย์ และนักวิจัยของมหาวิทยาลัยแม่ฟ้าหลวง',
              labelEn: 'The applicant is an academic staff member (lecturer or researcher) of Mae Fah Luang University.'
            },
            {
              itemKey: 'has_any_grant_at_least_1_project',
              label: 'เคยได้รับทุนวิจัยจากแหล่งทุนใดก็ตาม มาแล้ว อย่างน้อย 1 โครงการ',
              labelEn: 'Has previously received at least one research grant from any funding agency.'
            },
            {
              itemKey: 'has_researcher_development_grant_at_least_1_project',
              label: 'เคยได้รับทุนพัฒนานักวิจัยในตำแหน่งหัวหน้าโครงการวิจัย อย่างน้อย 1 โครงการ',
              labelEn: 'Has previously received at least one Researcher Development Grant as the principal investigator.'
            },
            {
              itemKey: 'single_strategic_project',
              label: 'เสนอขอรับทุนที่สอดคล้องกับยุทธศาสตร์ในตำแหน่งหัวหน้าโครงการวิจัย ได้ไม่เกิน 1 โครงการ',
              labelEn: 'May submit only one proposal for the Strategic Research and Innovation Grant as the principal investigator.'
            },
            {
              itemKey: 'no_previous_strategic_grant',
              label: 'ไม่เคยได้รับทุนสนับสนุนการวิจัยจากเงินรายได้มหาวิทยาลัยแม่ฟ้าหลวงประเภททุนที่สอดคล้องกับยุทธศาสตร์ (ในตำแหน่งหัวหน้าโครงการ) มาก่อน',
              labelEn: 'Has not previously received a grant aligned with national research and innovation strategies from Mae Fah Luang University (as the principal investigator).',
              description: 'ข้อยกเว้น: คณาจารย์ นักวิจัย ด้านสังคมศาสตร์และมนุษยศาสตร์ สามารถขอทุนประเภททุนที่สอดคล้องกับยุทธศาสตร์ ตามกรอบงบประมาณที่เหลือจากเดิมของโครงการวิจัยที่เคยได้รับมาแล้ว ทั้งนี้ไม่เกินวงเงินงบประมาณ 300,000 บาท',
              descriptionEn: 'Exception: Social sciences and humanities faculty/researchers may apply again using remaining funds from previously awarded projects, not exceeding 300,000 THB.'
            },
            {
              itemKey: 'no_outstanding_progress_fy2568',
              label: 'ไม่ค้างส่งรายงานความก้าวหน้าของโครงการวิจัยที่ได้รับทุนสนับสนุนการวิจัยจากเงินรายได้มหาวิทยาลัยแม่ฟ้าหลวง และทุน Basic Research ปีงบประมาณ 2568',
              labelEn: 'Has no outstanding progress reports for research projects funded by MFU internal grants or the Basic Research Fund for fiscal year 2025.'
            },
            {
              itemKey: 'no_outstanding_final_fy2567',
              label: 'ไม่ค้างส่งรายงานวิจัยฉบับสมบูรณ์ปีงบประมาณ 2567 (เฉพาะงบ มฟล. และทุน Basic Research)',
              labelEn: 'Has no outstanding final research reports for fiscal year 2024 (MFU internal grants and Basic Research Fund only).'
            },
            {
              itemKey: 'no_pending_projects_fy2566',
              label: 'ไม่มีงานวิจัยคงค้างปีงบประมาณ 2566 และปีก่อนหน้า (เฉพาะงบ มฟล. และทุน Basic Research)',
              labelEn: 'Has no pending or incomplete research projects from fiscal year 2023 or earlier (MFU internal grants and Basic Research Fund only).'
            },
            {
              itemKey: 'not_on_study_leave',
              label: 'ไม่อยู่ระหว่างการศึกษาต่อ หรือมีแผนลาศึกษาต่อในระหว่างการรับทุน',
              labelEn: 'Is not currently enrolled in a study program and has no plans to take educational leave during the grant period.'
            },
            {
              itemKey: 'no_suspended_terminated_in_2years',
              label: 'ไม่ถูกระงับ ยกเลิก บอกเลิกหรือยุติโครงการวิจัยจากแหล่งทุนใดๆ (ภายในระยะเวลา 2 ปี ก่อนหน้าการยื่นเสนอขอ)',
              labelEn: 'Has not had any research projects suspended, canceled, or terminated by any funding agency within the past 2 years prior to the application.'
            },
            {
              itemKey: 'research_ethics_training',
              label: 'หัวหน้าโครงการต้องผ่านการอบรมมาตรฐานการวิจัย และ/หรือ มาตรฐานจริยธรรมการวิจัยในมนุษย์ ที่เกี่ยวข้องกับโครงการวิจัย พร้อมแสดงหลักฐานการผ่านการอบรม',
              labelEn: 'The principal investigator must have completed training in research standards and/or human research ethics relevant to the proposed project and must provide proof of completion.'
            }
          ]
        },
        {
          sectionKey: 'project_characteristics',
          sectionLabel: '2. ลักษณะโครงการวิจัยที่ให้การสนับสนุน',
          sectionLabelEn: '2. Project characteristics',
          description: 'ตรวจสอบลักษณะโครงการวิจัยให้เป็นไปตามเกณฑ์ของทุนวิจัยที่สอดคล้องกับยุทธศาสตร์การวิจัยและนวัตกรรม',
          descriptionEn: 'Verify that the proposed project meets the criteria for the grant aligned with national research and innovation strategies.',
          items: [
            {
              itemKey: 'duration_within_1year',
              label: 'เป็นโครงการวิจัยที่ใช้ระยะเวลาดำเนินการไม่เกิน 1 ปี',
              labelEn: 'The project must be completed within 1 year.'
            },
            {
              itemKey: 'budget_not_exceed_300k',
              label: 'งบประมาณที่เสนอขอ ไม่เกิน 300,000 บาท โดยมีรายการค่าใช้จ่ายในโครงการวิจัย เป็นไปตามระเบียบฯ อัตราฯ ที่มหาวิทยาลัยกำหนด',
              labelEn: 'The proposed budget must not exceed 300,000 THB, and all expenses must comply with MFU’s financial and budgeting regulations.'
            },
            {
              itemKey: 'clear_original_question',
              label: 'มีโจทย์วิจัยที่ชัดเจนและไม่ซ้ำซ้อนกับงานที่เคยมีผู้ทำมาก่อน',
              labelEn: 'The research must have a clear and original research question.'
            },
            {
              itemKey: 'objectives_feasible_measurable',
              label: 'มีวัตถุประสงค์การวิจัยที่สามารถดำเนินการได้จริง และสามารถประเมินได้',
              labelEn: 'The objectives must be feasible and measurable.'
            },
            {
              itemKey: 'publication_potential',
              label: 'มีศักยภาพสามารถตีพิมพ์ผลงานวิจัยตามเกณฑ์ที่มหาวิทยาลัยกำหนด',
              labelEn: 'The research must have potential for publication as per the university’s requirements.'
            },
            {
              itemKey: 'align_mhesi_strategies',
              label: 'เป็นโครงการวิจัยที่สอดคล้องตามนโยบายและยุทธศาสตร์ อววน.(พ.ศ.2566-2570) ตามเป้าประสงค์ของการพัฒนา 4 ด้าน',
              labelEn: 'The project must align with the strategies and policies of the Ministry of Higher Education, Science, Research and Innovation (MHESI), 2023–2027, focusing on the four strategic goals.'
            }
          ]
        }
      ]
    },
    {
      fundingTypeKey: 'industry-extension',
      fundingTypeLabel: 'ทุนต่อยอดสู่ภาคอุตสาหกรรม',
      fundingTypeLabelEn: 'Industry-oriented grant development',
      sections: [
        {
          sectionKey: 'applicant_eligibility',
          sectionLabel: '1. คุณสมบัติของผู้ขอรับทุน',
          sectionLabelEn: '1. Applicant qualifications',
          description: 'ตรวจสอบคุณสมบัติของหัวหน้าโครงการตามเกณฑ์ของทุนต่อยอดสู่ภาคอุตสาหกรรม',
          descriptionEn: 'Verify that the project leader meets the eligibility criteria for the Industry-oriented grant.',
          items: [
            {
              itemKey: 'academic_staff_position',
              label: 'เป็นพนักงานสายวิชาการ ตำแหน่งอาจารย์ และนักวิจัยของมหาวิทยาลัยแม่ฟ้าหลวง',
              labelEn: 'The applicant is an academic staff member (lecturer or researcher) at Mae Fah Luang University.'
            },
            {
              itemKey: 'has_strategic_grant_at_least_1_project',
              label: 'เคยได้รับสนับสนุนประเภททุนวิจัยที่สอดคล้องกับยุทธศาสตร์การวิจัยและนวัตกรรมในตำแหน่งหัวหน้าโครงการวิจัย อย่างน้อย 1 โครงการ',
              labelEn: 'The applicant has previously received at least one Strategic Research and Innovation Grant as a principal investigator.'
            },
            {
              itemKey: 'single_industry_extension_project',
              label: 'เสนอขอรับประเภททุนต่อยอดสู่ภาคอุตสาหกรรมในตำแหน่งหัวหน้าโครงการวิจัย ได้ไม่เกิน 1 โครงการ',
              labelEn: 'The applicant may apply for no more than one project under the Industrial Research Utilization Grant as a principal investigator.'
            },
            {
              itemKey: 'no_outstanding_progress_fy2568',
              label: 'ไม่ค้างส่งรายงานความก้าวหน้าของโครงการวิจัยที่ได้รับทุนสนับสนุนการวิจัยจากเงินรายได้มหาวิทยาลัยแม่ฟ้าหลวง และทุน Basic Research ปีงบประมาณ 2568',
              labelEn: 'The applicant has no outstanding progress reports from MFU-funded or Basic Research grants for FY2025.'
            },
            {
              itemKey: 'no_outstanding_final_fy2567',
              label: 'ไม่ค้างส่งรายงานวิจัยฉบับสมบูรณ์ปีงบประมาณ 2567 (เฉพาะงบ มฟล. และทุน Basic Research)',
              labelEn: 'The applicant has no outstanding final research reports for FY2024 (MFU and Basic Research only).'
            },
            {
              itemKey: 'no_pending_projects_fy2566',
              label: 'ไม่มีงานวิจัยคงค้างปีงบประมาณ 2566 และปีก่อนหน้า (เฉพาะงบ มฟล. และทุน Basic Research)',
              labelEn: 'The applicant has no incomplete research projects from FY2023 or earlier (MFU and Basic Research only).'
            },
            {
              itemKey: 'not_on_study_leave',
              label: 'ไม่อยู่ระหว่างการศึกษาต่อ หรือมีแผนลาศึกษาต่อในระหว่างการรับทุน',
              labelEn: 'The applicant is not currently enrolled in a study program and does not plan to take study leave during the grant period.'
            },
            {
              itemKey: 'no_suspended_terminated_in_2years',
              label: 'ไม่เคยถูกระงับ ยกเลิก บอกเลิก หรือยุติโครงการวิจัยจากแหล่งทุนใดๆ (ภายในระยะเวลา 2 ปี ก่อนหน้าการยื่นเสนอขอ)',
              labelEn: 'The applicant has not had any research projects suspended, canceled, or terminated by any funding agency in the past 2 years.'
            },
            {
              itemKey: 'research_ethics_training',
              label: 'หัวหน้าโครงการต้องผ่านการอบรมมาตรฐานการวิจัย และ/หรือ มาตรฐานจริยธรรมการวิจัยในมนุษย์ที่เกี่ยวข้องกับโครงการวิจัย พร้อมแสดงหลักฐานการผ่านการอบรม',
              labelEn: 'The principal investigator has completed training in research standards and/or human research ethics relevant to the project and can provide supporting documentation.'
            }
          ]
        },
        {
          sectionKey: 'project_characteristics',
          sectionLabel: '2. ลักษณะโครงการวิจัยที่ให้การสนับสนุน',
          sectionLabelEn: '2. Supported project characteristics',
          description: 'ตรวจสอบลักษณะโครงการวิจัยให้เป็นไปตามเกณฑ์ของทุนต่อยอดสู่ภาคอุตสาหกรรม',
          descriptionEn: 'Verify that the proposed project meets the criteria for the Industry-oriented grant.',
          items: [
            {
              itemKey: 'duration_within_1year',
              label: 'เป็นโครงการวิจัยที่ใช้ระยะเวลาดำเนินการไม่เกิน 1 ปี',
              labelEn: 'The project duration must not exceed 1 year.'
            },
            {
              itemKey: 'budget_not_exceed_300k_and_cofunding_10pct',
              label: 'งบประมาณที่เสนอขอ ไม่เกิน 300,000 บาท โดยมีรายการค่าใช้จ่ายในโครงการวิจัย เป็นไปตามระเบียบฯ อัตราฯ ที่มหาวิทยาลัยกำหนด และต้องมีทุนวิจัยร่วมกับภาคเอกชน ในรูปแบบ In-cash/In-kind ไม่น้อยกว่า 10 % ของงบประมาณสนับสนุนจากมหาวิทยาลัยแม่ฟ้าหลวง',
              labelEn: 'The proposed budget must not exceed 300,000 THB, with expenses aligned to MFU’s financial regulations. The project must also include co-funding from the private sector, either in-cash or in-kind, at no less than 10% of MFU’s support.'
            },
            {
              itemKey: 'trl_4_up_for_science_tech_health',
              label: 'โครงการวิจัยด้านวิทยาศาสตร์และเทคโนโลยี และวิทยาศาสตร์สุขภาพ เป็นโครงการวิจัยที่มีความพร้อมของเทคโนโลยีระดับ 4 ขึ้นไป (TRL 4 up)',
              labelEn: 'For projects in science, technology, and health sciences, the research must demonstrate a Technology Readiness Level (TRL) of 4 or above.'
            },
            {
              itemKey: 'ip_registration_eligible',
              label: 'ผลงานวิจัยสามารถนำไปยื่นจดทะเบียนทรัพย์สินทางปัญญา (เลขคำขอ)',
              labelEn: 'The research output must be eligible for intellectual property registration (application number required).'
            },
            {
              itemKey: 'letter_of_intent_and_terms',
              label: 'มีหนังสือแสดงความประสงค์ในการร่วมทุนวิจัยและนวัตกรรม พร้อมระบุกรณีที่โครงการไม่สามารถดำเนินการให้แล้วเสร็จ ให้นักวิจัยตกลงเงื่อนไขกับผู้ร่วมทุนให้ชัดเจน ทั้งนี้เงื่อนไขทั้งหมดจะระบุในสัญญาทุนอุดหนุน',
              labelEn: 'A letter of intent from the industry co-founder must be provided, specifying the agreement to cooperate and clearly stating conditions in case the project cannot be completed. These terms will be included in the official research grant contract.'
            }
          ]
        }
      ]
    },
  ]
})

const normalizeKey = (value) => String(value || '').trim().toLowerCase()
const normalizeText = (value) => String(value || '').trim()

const pickLocalizedValue = (source = {}, baseKey = '', locale = 'th') => {
  const obj = source && typeof source === 'object' ? source : {}
  const normalizedLocale = String(locale || '').trim().toLowerCase() === 'en' ? 'en' : 'th'
  const suffix = normalizedLocale === 'en' ? 'En' : 'Th'
  const candidates = [
    `${baseKey}${suffix}`,
    `${baseKey}_${normalizedLocale}`,
    `${baseKey}_${normalizedLocale.toUpperCase()}`,
    `${baseKey}${normalizedLocale.toUpperCase()}`
  ]
  for (const key of candidates) {
    if (obj[key] !== undefined && obj[key] !== null) {
      const text = String(obj[key]).trim()
      if (text) return text
    }
  }
  return ''
}

const mergeMissingLocalization = (runtimeConfig, fallbackConfig) => {
  const runtime = runtimeConfig && typeof runtimeConfig === 'object' ? runtimeConfig : {}
  const fallback = fallbackConfig && typeof fallbackConfig === 'object' ? fallbackConfig : {}
  const fallbackTemplates = Array.isArray(fallback.fundingTemplates) ? fallback.fundingTemplates : []
  const runtimeTemplates = Array.isArray(runtime.fundingTemplates) ? runtime.fundingTemplates : []

  const mergedTemplates = runtimeTemplates.map((tpl) => {
    const fundingTypeKey = normalizeKey(tpl && tpl.fundingTypeKey)
    const fbTpl = fallbackTemplates.find((t) => normalizeKey(t && t.fundingTypeKey) === fundingTypeKey)

    const tplNext = { ...(tpl || {}) }
    if (fbTpl) {
      const cloneItems = (arr) => (Array.isArray(arr) ? arr.map((x) => ({ ...(x || {}) })) : [])
      const cloneSections = (arr) => (Array.isArray(arr) ? arr.map((s) => ({ ...(s || {}), items: cloneItems(s && s.items) })) : [])

      if (!tplNext.fundingTypeLabelEn) tplNext.fundingTypeLabelEn = fbTpl.fundingTypeLabelEn || pickLocalizedValue(fbTpl, 'fundingTypeLabel', 'en')
      if (!tplNext.fundingTypeLabelTh) tplNext.fundingTypeLabelTh = fbTpl.fundingTypeLabelTh || pickLocalizedValue(fbTpl, 'fundingTypeLabel', 'th')

      const fbSections = Array.isArray(fbTpl.sections) ? fbTpl.sections : []
      const sections = Array.isArray(tplNext.sections) ? tplNext.sections : []

      const looksLikePlaceholderTemplate = (arr) => {
        const list = Array.isArray(arr) ? arr : []
        if (list.length === 0) return false
        return list.every((s) => {
          const key = normalizeKey(s && s.sectionKey ? s.sectionKey : '')
          const label = normalizeText(s && (s.sectionLabel || s.label) ? (s.sectionLabel || s.label) : '').toLowerCase()
          const items = Array.isArray(s && s.items) ? s.items : []
          return key.includes('import_placeholder') || label.includes('checklist template') || items.length === 0
        })
      }

      if (sections.length === 0 && fbSections.length > 0) {
        tplNext.sections = cloneSections(fbSections)
        return tplNext
      }

      if (fbSections.length > 0 && looksLikePlaceholderTemplate(sections)) {
        tplNext.sections = cloneSections(fbSections)
        return tplNext
      }

      tplNext.sections = sections.map((sec, secIndex) => {
        const sectionKey = normalizeText(sec && sec.sectionKey ? sec.sectionKey : '')
        const sectionLabel = normalizeText(sec && sec.sectionLabel ? sec.sectionLabel : '')
        let fbSec = fbSections.find((s) => normalizeText(s && s.sectionKey ? s.sectionKey : '') === sectionKey)
        if (!fbSec && sectionLabel) {
          fbSec = fbSections.find((s) => {
            const fbLabel = normalizeText(s && s.sectionLabel ? s.sectionLabel : '')
            const fbLabelTh = normalizeText(s && s.sectionLabelTh ? s.sectionLabelTh : '')
            return fbLabel === sectionLabel || fbLabelTh === sectionLabel
          })
        }
        if (!fbSec && fbSections.length === sections.length) fbSec = fbSections[secIndex]
        if (!fbSec) return sec
        const secNext = { ...(sec || {}) }
        if (!secNext.sectionLabelEn) secNext.sectionLabelEn = fbSec.sectionLabelEn || pickLocalizedValue(fbSec, 'sectionLabel', 'en')
        if (!secNext.sectionLabelTh) secNext.sectionLabelTh = fbSec.sectionLabelTh || pickLocalizedValue(fbSec, 'sectionLabel', 'th')
        if (!secNext.descriptionEn) secNext.descriptionEn = fbSec.descriptionEn || pickLocalizedValue(fbSec, 'description', 'en')
        if (!secNext.descriptionTh) secNext.descriptionTh = fbSec.descriptionTh || pickLocalizedValue(fbSec, 'description', 'th')

        const fbItems = Array.isArray(fbSec.items) ? fbSec.items : []
        const items = Array.isArray(secNext.items) ? secNext.items : []

        if (items.length === 0 && fbItems.length > 0) {
          secNext.items = cloneItems(fbItems)
          return secNext
        }

        secNext.items = items.map((it, itemIndex) => {
          const itemKey = normalizeText(it && it.itemKey ? it.itemKey : '')
          const itemLabel = normalizeText(it && it.label ? it.label : '')
          let fbItem = fbItems.find((x) => normalizeText(x && x.itemKey ? x.itemKey : '') === itemKey)
          if (!fbItem && itemLabel) {
            fbItem = fbItems.find((x) => {
              const fbLabel = normalizeText(x && x.label ? x.label : '')
              const fbLabelTh = normalizeText(x && x.labelTh ? x.labelTh : '')
              return fbLabel === itemLabel || fbLabelTh === itemLabel
            })
          }
          if (!fbItem && fbItems.length === items.length) fbItem = fbItems[itemIndex]
          if (!fbItem) return it
          const itNext = { ...(it || {}) }
          if (!itNext.labelEn) itNext.labelEn = fbItem.labelEn || pickLocalizedValue(fbItem, 'label', 'en')
          if (!itNext.labelTh) itNext.labelTh = fbItem.labelTh || pickLocalizedValue(fbItem, 'label', 'th')
          if (!itNext.descriptionEn) itNext.descriptionEn = fbItem.descriptionEn || pickLocalizedValue(fbItem, 'description', 'en')
          if (!itNext.descriptionTh) itNext.descriptionTh = fbItem.descriptionTh || pickLocalizedValue(fbItem, 'description', 'th')
          return itNext
        })
        return secNext
      })
    }
    return tplNext
  })

  return {
    ...runtime,
    cardTitle: runtime.cardTitle || fallback.cardTitle || pickLocalizedValue(fallback, 'cardTitle', 'th') || '',
    cardTitleTh: runtime.cardTitleTh || fallback.cardTitleTh || pickLocalizedValue(fallback, 'cardTitle', 'th') || '',
    cardTitleEn: runtime.cardTitleEn || fallback.cardTitleEn || pickLocalizedValue(fallback, 'cardTitle', 'en') || '',
    fundingTemplates: mergedTemplates
  }
}

const normalizeItem = (item = {}, index = 0) => ({
  itemKey: String(item.itemKey || item.key || `item_${index + 1}`).trim() || `item_${index + 1}`,
  label: String(item.label || item.title || `รายการที่ ${index + 1}`).trim() || `รายการที่ ${index + 1}`,
  labelTh: pickLocalizedValue(item, 'label', 'th'),
  labelEn: pickLocalizedValue(item, 'label', 'en'),
  description: String(item.description || '').trim(),
  descriptionTh: pickLocalizedValue(item, 'description', 'th'),
  descriptionEn: pickLocalizedValue(item, 'description', 'en'),
  required: Boolean(item.required)
})

const normalizeSection = (section = {}, index = 0) => ({
  sectionKey: String(section.sectionKey || section.key || `section_${index + 1}`).trim() || `section_${index + 1}`,
  sectionLabel: String(section.sectionLabel || section.label || `หัวข้อ ${index + 1}`).trim() || `หัวข้อ ${index + 1}`,
  sectionLabelTh: pickLocalizedValue(section, 'sectionLabel', 'th'),
  sectionLabelEn: pickLocalizedValue(section, 'sectionLabel', 'en'),
  description: String(section.description || '').trim(),
  descriptionTh: pickLocalizedValue(section, 'description', 'th'),
  descriptionEn: pickLocalizedValue(section, 'description', 'en'),
  items: (Array.isArray(section.items) ? section.items : []).map(normalizeItem)
})

const normalizeFundingTemplate = (template = {}, index = 0) => ({
  fundingTypeKey: normalizeKey(template.fundingTypeKey || template.key || template.fundingKey || `funding_${index + 1}`),
  fundingTypeLabel: String(template.fundingTypeLabel || template.label || template.name || `ทุนที่ ${index + 1}`).trim() || `ทุนที่ ${index + 1}`,
  fundingTypeLabelTh: pickLocalizedValue(template, 'fundingTypeLabel', 'th'),
  fundingTypeLabelEn: pickLocalizedValue(template, 'fundingTypeLabel', 'en'),
  sections: (Array.isArray(template.sections) ? template.sections : []).map(normalizeSection)
})

function buildNormalizedChairmanChecklistConfigCore(rawConfig = {}) {
  const source = rawConfig && typeof rawConfig === 'object' ? rawConfig : {}
  const fundingTemplates = (Array.isArray(source.fundingTemplates) ? source.fundingTemplates : DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.fundingTemplates)
    .map(normalizeFundingTemplate)
    .filter((template) => template.fundingTypeKey)

  return {
    templateVersion: Number(source.templateVersion) || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.templateVersion,
    reviewerRole: String(source.reviewerRole || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.reviewerRole).trim() || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.reviewerRole,
    reviewerLabel: String(source.reviewerLabel || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.reviewerLabel).trim() || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.reviewerLabel,
    cardTitle: String(source.cardTitle || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.cardTitle).trim() || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.cardTitle,
    cardTitleTh: pickLocalizedValue(source, 'cardTitle', 'th') || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.cardTitleTh,
    cardTitleEn: pickLocalizedValue(source, 'cardTitle', 'en') || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.cardTitleEn,
    importStatus: String(source.importStatus || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.importStatus).trim() || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.importStatus,
    note: String(source.note || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.note).trim() || DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.note,
    fundingTemplates: fundingTemplates.length > 0 ? fundingTemplates : DEFAULT_CHAIRMAN_CHECKLIST_CONFIG.fundingTemplates.map(normalizeFundingTemplate)
  }
}

const DEFAULT_NORMALIZED_CHAIRMAN_CHECKLIST_CONFIG = buildNormalizedChairmanChecklistConfigCore(DEFAULT_CHAIRMAN_CHECKLIST_CONFIG)

function buildNormalizedChairmanChecklistConfig(rawConfig = {}) {
  const runtime = buildNormalizedChairmanChecklistConfigCore(rawConfig)
  return mergeMissingLocalization(runtime, DEFAULT_NORMALIZED_CHAIRMAN_CHECKLIST_CONFIG)
}

let CHAIRMAN_CHECKLIST_CONFIG = buildNormalizedChairmanChecklistConfig(DEFAULT_CHAIRMAN_CHECKLIST_CONFIG)

export const CHAIRMAN_CHECKLIST_SETTING_KEY = 'chairman_checklist_config_json'

export function normalizeChairmanChecklistConfig(rawConfig) {
  return buildNormalizedChairmanChecklistConfig(rawConfig)
}

export function getDefaultChairmanChecklistConfig() {
  return buildNormalizedChairmanChecklistConfig(DEFAULT_CHAIRMAN_CHECKLIST_CONFIG)
}

export function setChairmanChecklistRuntimeConfig(rawConfig) {
  CHAIRMAN_CHECKLIST_CONFIG = buildNormalizedChairmanChecklistConfig(rawConfig)
}

export function getChairmanChecklistConfig() {
  return CHAIRMAN_CHECKLIST_CONFIG
}

export function getChairmanChecklistTemplate(fundingTypeKey) {
  const normalizedFundingTypeKey = normalizeKey(fundingTypeKey)
  const templates = CHAIRMAN_CHECKLIST_CONFIG.fundingTemplates || []
  return templates.find((template) => template.fundingTypeKey === normalizedFundingTypeKey) || templates[0] || null
}
