<template>
  <div class="project-details-form">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">1-19 รายละเอียดโครงการ</h5>
      </div>
      <div class="card-body">

        <div class="section mb-4">
          <h6 class="section-title">1. ชื่อโครงการ <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="form-group">
            <label class="sub-label">ชื่อโครงการ (ภาษาไทย)</label>
            <input v-model="form.projectNameThai" type="text" class="form-control"
              placeholder="กรุณากรอกชื่อโครงการภาษาไทย" @input="filterThaiInput" required :disabled="isReadOnly">
            <small v-if="!isReadOnly" class="form-text text-muted">กรุณากรอกเป็นภาษาไทยเท่านั้น</small>
          </div>
          <div class="form-group">
            <label class="sub-label">ชื่อโครงการ (ภาษาอังกฤษ)</label>
            <input v-model="form.projectNameEnglish" type="text" class="form-control"
              placeholder="Project Title in English" @input="filterEnglishInput" required :disabled="isReadOnly">
            <small v-if="!isReadOnly" class="form-text text-muted">กรุณากรอกเป็นภาษาอังกฤษเท่านั้น</small>
          </div>
        </div>

        <div class="section mb-4">
          <h6 class="section-title">2. ประเภททุน <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="funding-options">

            <div class="form-check mb-3">
              <input v-model="form.fundingType" type="radio" class="form-check-input" id="fund1" value="new-researcher" :disabled="isReadOnly">
              <label for="fund1" :class="{'text-muted': isReadOnly && form.fundingType !== 'new-researcher'}"><strong>ทุนนักวิจัยรุ่นใหม่</strong></label>
              
              <div v-if="form.fundingType === 'new-researcher'" class="sub-options">
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub1-1" value="basic-research" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub1-1">โครงการวิจัยพื้นฐาน (Basic Research) เพื่อสร้างองค์ความรู้ใหม่ในสาขาวิชาเฉพาะทาง</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub1-2" value="applied-research" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub1-2">โครงการวิจัยประยุกต์ (Applied Research) เพื่อพัฒนาเทคโนโลยีหรือนวัตกรรมใหม่</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub1-3" value="interdisciplinary" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub1-3">โครงการวิจัยข้ามสาขา (Interdisciplinary Research) เพื่อแก้ไขปัญหาซับซ้อนที่ต้องใช้ความรู้หลายสาขา</label>
                </div>
              </div>
            </div>

            <div class="form-check mb-3">
              <input v-model="form.fundingType" type="radio" class="form-check-input" id="fund2" value="researcher-development" :disabled="isReadOnly">
              <label for="fund2" :class="{'text-muted': isReadOnly && form.fundingType !== 'researcher-development'}"><strong>ทุนพัฒนานักวิจัย</strong></label>
              
              <div v-if="form.fundingType === 'researcher-development'" class="sub-options">
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub2-1" value="economic-development" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub2-1">การพัฒนาเศรษฐกิจไทยด้วยเศรษฐกิจสร้างคุณค่าและเศรษฐกิจสร้างสรรค์ ให้มีความสามารถในการแข่งขันและพึ่งพาตนเองได้อย่างยั่งยืน</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub2-2" value="social-environment" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub2-2">การยกระดับสังคมและสิ่งแวดล้อม ให้มีการพัฒนาอย่างยั่งยืน สามารถแก้ไข ปัญหาท้าทายและปรับตัวให้ทันต่อพลวัตการเปลี่ยนแปลงของโลก</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub2-3" value="science-technology" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub2-3">การพัฒนาวิทยาศาสตร์ เทคโนโลยี การวิจัยและนวัตกรรม ระดับขั้นแนวหน้าที่ก้าวหน้าล้ำยุค เพื่อสร้างโอกาสใหม่และความพร้อม ของประเทศในอนาคต</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub2-4" value="human-resources" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub2-4">การพัฒนากำลังคนและสถาบัน ด้านวิทยาศาสตร์ วิจัยและนวัตกรรม ให้เป็นฐานการขับเคลื่อนการพัฒนาเศรษฐกิจและสังคมของประเทศ</label>
                </div>
              </div>
            </div>

            <div class="form-check mb-3">
              <input v-model="form.fundingType" type="radio" class="form-check-input" id="fund3" value="strategic-research" :disabled="isReadOnly">
              <label for="fund3" :class="{'text-muted': isReadOnly && form.fundingType !== 'strategic-research'}"><strong>ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์</strong></label>
            </div>

            <div class="form-check mb-3">
              <input v-model="form.fundingType" type="radio" class="form-check-input" id="fund4" value="industry-extension" :disabled="isReadOnly">
              <label for="fund4" :class="{'text-muted': isReadOnly && form.fundingType !== 'industry-extension'}"><strong>ทุนต่อยอดสู่ภาคอุตสาหกรรม</strong></label>
              
              <div v-if="form.fundingType === 'industry-extension'" class="sub-options">
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub3-1" value="product-development" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub3-1">การวิจัยและพัฒนาผลิตภัณฑ์ใหม่ (Product R&D) เพื่อเพิ่มมูลค่าทางการตลาด</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub3-2" value="process-innovation" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub3-2">การพัฒนากระบวนการผลิต (Process Innovation) เพื่อเพิ่มประสิทธิภาพและลดต้นทุน</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub3-3" value="technology-transfer" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub3-3">การถ่ายทอดเทคโนโลยี (Technology Transfer) เพื่อสร้างนวัตกรรมทางอุตสาหกรรม</label>
                </div>
                <div class="form-check">
                  <input v-model="form.fundingSubType" type="radio" class="form-check-input" id="sub3-4" value="competitiveness" :disabled="isReadOnly">
                  <label class="form-check-label" for="sub3-4">การวิจัยเพื่อเพิ่มขีดความสามารถการแข่งขัน (Competitiveness Enhancement)</label>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="section mb-4">
          <h6 class="section-title">3. ความร่วมมือ <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="form-group">
            <select v-model="form.collaboration" class="form-control" required :disabled="isReadOnly">
              <option value="none">ไม่มี</option>
              <option value="yes">มี</option>
            </select>
          </div>
          <div v-if="form.collaboration === 'yes'" class="form-group mt-3">
            <label>ระบุหน่วยงานที่ร่วมมือ <span v-if="!isReadOnly" class="text-danger">*</span></label>
            <input v-model="form.collaborationAgency" type="text" class="form-control" placeholder="กรุณาระบุหน่วยงานที่ร่วมมือ" required :disabled="isReadOnly">
          </div>
        </div>

        <div class="section mb-4">
          <h6 class="section-title">4. ประเภทงานวิจัย <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="form-group">
            <select v-model="form.researchType" class="form-control" required :disabled="isReadOnly">
              <option value="">-- กรุณาเลือก --</option>
              <option value="science-technology">ด้านวิทยาศาสตร์และเทคโนโลยี</option>
              <option value="health-science">ด้านวิทยาศาสตร์สุขภาพ</option>
              <option value="social-humanities">ด้านสังคมศาสตร์และมนุษย์ศาสตร์</option>
            </select>
          </div>
        </div>

        <div class="section mb-4">
          <h6 class="section-title">5. คำสำคัญ (Keywords) <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.keywords" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">6. ความสำคัญของปัญหาและแนวคิด <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.problemSignificance" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">7. วัตถุประสงค์ <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.objectives" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">8. ทบทวนวรรณกรรม <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.literatureReview" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">9. เอกสารอ้างอิง <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.references" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">10. วิธีดำเนินการวิจัย <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.researchMethodology" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">11. ขอบเขตการวิจัย <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.researchScope" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">12. แผนการดำเนินงาน <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <Section12 v-model="form.workPlan" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">13. ผลงานตามระยะเวลาการรายงาน <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.milestones" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">14. ผลลัพธ์ที่คาดว่าจะได้รับ <span v-if="!isReadOnly" class="text-danger">*</span></h6>

          <div v-if="!form.fundingType" class="alert alert-warning">
            <i class="cil-info me-2"></i> กรุณาเลือก "ประเภททุน" ในหัวข้อที่ 2 เพื่อเลือกผลลัพธ์
          </div>

          <div v-if="form.fundingType === 'new-researcher'" class="sub-options">
            <h6 class="sub-section-title">14.1 ทุนนักวิจัยรุ่นใหม่</h6>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="internationalConference" class="form-check-input" id="outcome1-1" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome1-1">นำเสนอในการประชุมวิชาการระดับนานาชาติ (Proceedings)</label>
            </div>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="scopusJournal" class="form-check-input" id="outcome1-2" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome1-2">ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.</label>
            </div>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="tciJournal" class="form-check-input" id="outcome1-3" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome1-3">ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น</label>
            </div>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="patent" class="form-check-input" id="outcome1-4" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome1-4">อนุสิทธิบัตร/สิทธิบัตร</label>
            </div>
          </div>

          <div v-if="form.fundingType === 'researcher-development'" class="sub-options">
            <h6 class="sub-section-title">14.2 ทุนพัฒนานักวิจัย</h6>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="scopusJournal" class="form-check-input" id="outcome2-1" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome2-1">ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.</label>
            </div>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="tciJournal" class="form-check-input" id="outcome2-2" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome2-2">ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น</label>
            </div>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="patent" class="form-check-input" id="outcome2-3" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome2-3">อนุสิทธิบัตร/สิทธิบัตร</label>
            </div>
          </div>

          <div v-if="form.fundingType === 'strategic-research'" class="sub-options">
            <h6 class="sub-section-title">14.3 ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์</h6>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="scopusJournal" class="form-check-input" id="outcome3-1" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome3-1">ตีพิมพ์วารสารนานาชาติฐานข้อมูล ก.พ.อ.</label>
            </div>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="tciJournal" class="form-check-input" id="outcome3-2" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome3-2">ตีพิมพ์วารสาร TCI กลุ่ม 1 เท่านั้น</label>
            </div>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="patent" class="form-check-input" id="outcome3-3" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome3-3">อนุสิทธิบัตร/สิทธิบัตร</label>
            </div>
          </div>

          <div v-if="form.fundingType === 'industry-extension'" class="sub-options">
            <h6 class="sub-section-title">14.4 ทุนต่อยอดสู่ภาคอุตสาหกรรม</h6>
            <div class="form-check mb-2">
              <input v-model="form.selectedOutcome" type="radio" value="ipRegistration" class="form-check-input" id="outcome4-1" :disabled="isReadOnly">
              <label class="form-check-label" for="outcome4-1">การยื่นขอจดทะเบียนทรัพย์สินทางปัญญา (มีเลขคำขอฯ)</label>
            </div>
          </div>
        </div>

        <div class="section mb-4">
          <h6 class="section-title">15. การบูรณาการงานวิจัย <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <TextEditor v-model="form.integration" :is-read-only="isReadOnly" />
        </div>

        <div class="section mb-4">
          <h6 class="section-title">16. ระดับการถ่ายทอดสู่สังคม <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <div class="funding-options">
            <div class="form-check mb-3">
              <input v-model="form.transferLevel" type="radio" class="form-check-input" id="transfer1" value="national-international" :disabled="isReadOnly">
              <label class="form-check-label" for="transfer1">สามารถนำไปถ่ายทอดเป็นต้นแบบและแนวทางได้ในระดับภูมิภาค ประเทศ หรือ นานาชาติ</label>
            </div>
            <div class="form-check mb-3">
              <input v-model="form.transferLevel" type="radio" class="form-check-input" id="transfer2" value="community-provincial" :disabled="isReadOnly">
              <label class="form-check-label" for="transfer2">สามารถนำไปถ่ายทอดเป็นต้นแบบและแนวทางได้เฉพาะกลุ่มอาชีพ ชุมชน หรือจังหวัด</label>
            </div>
            <div class="form-check mb-3">
              <input v-model="form.transferLevel" type="radio" class="form-check-input" id="transfer3" value="none" :disabled="isReadOnly">
              <label class="form-check-label" for="transfer3">ไม่มีการนำไปถ่ายทอดสู่สังคม</label>
            </div>
          </div>
        </div>

        <div class="section mb-4">
          <h6 class="section-title">17. งบประมาณโครงการ <span v-if="!isReadOnly" class="text-danger">*</span></h6>
          <BudgetSectionDemo v-model="form.budget" :is-read-only="isReadOnly" @update:modelValue="handleBudgetUpdate" />
        </div>

        <div class="section mb-4">
          <ResearchStandardSection v-model="form.researchStandard" :is-read-only="isReadOnly" />
        </div>

      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResearchTeamForm',
  props: {
    isReadOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      projectLeader: {
        name: '',
        affiliation: '',
        phone: '',
        email: '',
        proportion: 100
      },
      coResearchers: [],
      advisors: []
    }
  },
  computed: {
    totalProportion() {
      let total = Number(this.projectLeader.proportion) || 0;
      this.coResearchers.forEach(researcher => {
        total += Number(researcher.proportion) || 0;
      });
      return total;
    }
  },
  watch: {
    projectLeader: {
      handler() {
        this.$emit('team-changed');
      },
      deep: true
    },
    coResearchers: {
      handler() {
        let coTotal = 0;
        this.coResearchers.forEach(r => {
          coTotal += Number(r.proportion) || 0;
        });

        // คำนวณสัดส่วนที่เหลือให้หัวหน้าโครงการ โดยบังคับว่าต้องไม่ต่ำกว่า 1
        this.projectLeader.proportion = Math.max(1, 100 - coTotal);

        this.$emit('team-changed');
      },
      deep: true
    },
    advisors: {
      handler() {
        this.$emit('team-changed');
      },
      deep: true
    }
  },
  methods: {
    // บล็อกการพิมพ์อักษร e, E, เครื่องหมายบวก, ลบ และจุดทศนิยม
    allowOnlyNumbers(event) {
      if (['e', 'E', '-', '+', '.'].includes(event.key)) {
        event.preventDefault();
      }
    },
    getMaxProportion(currentIndex) {
      let otherTotal = 0;
      this.coResearchers.forEach((r, idx) => {
        if (idx !== currentIndex) {
          otherTotal += Number(r.proportion) || 0;
        }
      });
      
      const max = 100 - otherTotal - 1; 
      return max < 1 ? 1 : max;
    },
    validateProportion(index) {
      const maxAllowed = this.getMaxProportion(index);
      let val = this.coResearchers[index].proportion;
      
      if (val === '') return;

      val = Number(val);
      if (val > maxAllowed) {
        this.coResearchers[index].proportion = maxAllowed;
      } else if (val < 1) {
        this.coResearchers[index].proportion = 1;
      }
    },
    addCoResearcher() {
      this.coResearchers.push({
        name: '',
        affiliation: '',
        phone: '',
        email: '',
        proportion: ''
      });
      this.$emit('team-changed');
    },
    removeCoResearcher(index) {
      this.coResearchers.splice(index, 1);
      this.$emit('team-changed');
    },
    addAdvisor() {
      this.advisors.push({
        name: '',
        affiliation: '',
        phone: '',
        email: ''
      });
      this.$emit('team-changed');
    },
    removeAdvisor(index) {
      this.advisors.splice(index, 1);
      this.$emit('team-changed');
    },
    getFormData() {
      return {
        projectLeader: this.projectLeader,
        coResearchers: this.coResearchers,
        advisors: this.advisors,
        isProportionValid: this.totalProportion === 100
      };
    }
  }
}
</script>

<style scoped>
.research-team-form {
  margin-bottom: 20px;
}

.section-title {
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 4px;
}

.co-researcher-item, .advisor-item {
  border-left: 4px solid #007bff;
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
}

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 0px;
  overflow: hidden;
}

.card-header {
  border: none;
  font-weight: 600;
}

.card-body {
  padding: 25px;
}

.form-group label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-control {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 14px;
}

.bg-light {
  background-color: #e9ecef !important;
  cursor: not-allowed;
}

.form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.text-danger {
  color: #dc3545 !important;
  font-weight: bold;
}

.btn-outline-primary {
  border: 2px solid #007bff;
  color: #333333;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: white;
}

.btn-outline-primary:hover {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-danger {
  background-color: #dc3545;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background-color: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.btn-sm {
  padding: 8px 12px;
  font-size: 12px;
}

.text-muted {
  color: #6c757d !important;
  font-style: italic;
}

.text-center {
  text-align: center;
}

.py-3 {
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
}

.mb-3 {
  margin-bottom: 1rem !important;
}

.mb-4 {
  margin-bottom: 1.5rem !important;
}

.mr-2 {
  margin-right: 0.5rem !important;
}

.ml-2 {
  margin-left: 0.5rem !important;
}

.w-100 {
  width: 100% !important;
}

@media (max-width: 768px) {
  .card-body {
    padding: 15px;
  }
  
  .form-control {
    padding: 10px 12px;
    font-size: 16px;
  }
  
  .section-title {
    font-size: 16px;
    padding: 8px 12px;
  }
}
</style>