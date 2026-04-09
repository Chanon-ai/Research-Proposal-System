<template>
  <div class="page-wrapper">
    <div id="report-area" ref="reportContainer" class="report-container">
      <div class="first-page">
        <div class="checkbox-line">
          <span
            v-for="option in fundingTypeDisplayOptions"
            :key="option.value"
            class="checkbox-item"
          >
            {{ check(form.budgetType === option.value) }} {{ option.label }}
          </span>
        </div>

        <div class="section">
          <div class="section-title">{{ reportText.section1Title }}</div>
          <div class="group-title">
            <div>
              <strong>{{ reportText.languageThai }}</strong>
              <div class="line">{{ form.titleTH }}</div>
            </div>
            <div>
              <strong>{{ reportText.languageEnglish }}</strong>
              <div class="line">{{ form.titleEN }}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">{{ reportText.section2Title }}</div>
          <template v-for="group in strategySections">
            <div :key="`${group.key}-title`" class="group-title">{{ group.title }}</div>
            <div
              v-for="option in group.options"
              :key="`${group.key}-${option.value}`"
              class="option"
            >
              <span>{{ check(form.selectedStrategy === option.value) }}</span>
              {{ option.label }}
            </div>
          </template>
        </div>
      </div>

      <div class="other-pages">
        <div class="section">
          <div class="section-title">{{ reportText.partATitle }}</div>
          <div class="sub-title">{{ reportText.researchTeamTitle }}</div>

          <div class="field-line">{{ reportText.mainResearcherTitle }}</div>
          <div class="field-line">
            {{ reportText.nameLabel }}
            <span class="dot-line">{{ researchers.mainResearcher.name }}</span>
          </div>
          <div class="field-line">
            {{ reportText.affiliationLabel }}
            <span class="dot-line">{{ researchers.mainResearcher.affiliation }}</span>
          </div>
          <div class="field-line">
            {{ reportText.phoneLabel }}
            <span class="dot-line">{{ researchers.mainResearcher.phone }}</span>
          </div>
          <div class="field-line">
            {{ reportText.emailLabel }}
            <span class="dot-line">{{ researchers.mainResearcher.email }}</span>
          </div>
          <div class="field-line">
            {{ reportText.workloadPercentLabel }}
            <span class="dot-line">{{ researchers.mainResearcher.code }}</span>
          </div>

          <div v-for="(co, index) in researchers.coResearchers" :key="`co-${index}`">
            <div class="field-line">{{ coResearcherTitle(index) }}</div>
            <div class="field-line">
              {{ reportText.nameLabel }}
              <span class="dot-line">{{ co.name }}</span>
            </div>
            <div class="field-line">
              {{ reportText.affiliationLabel }}
              <span class="dot-line">{{ co.affiliation }}</span>
            </div>
            <div class="field-line">
              {{ reportText.phoneLabel }}
              <span class="dot-line">{{ co.phone }}</span>
            </div>
            <div class="field-line">
              {{ reportText.emailLabel }}
              <span class="dot-line">{{ co.email }}</span>
            </div>
            <div class="field-line">
              {{ reportText.workloadPercentLabel }}
              <span class="dot-line">{{ co.code }}</span>
            </div>
          </div>

          <div class="section">
            <div class="sub-title">{{ reportText.advisorTitle }}</div>
            <div v-for="(advisor, index) in researchers.advisors" :key="`advisor-${index}`">
              <div class="field-line">
                {{ reportText.nameLabel }}
                <span class="dot-line">{{ advisor.name }}</span>
              </div>
              <div class="field-line">
                {{ reportText.affiliationLabel }}
                <span class="dot-line">{{ advisor.affiliation }}</span>
              </div>
              <div class="field-line">
                {{ reportText.phoneLabel }}
                <span class="dot-line">{{ advisor.phone }}</span>
              </div>
              <div class="field-line">
                {{ reportText.emailLabel }}
                <span class="dot-line">{{ advisor.email }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="sub-title">{{ reportText.section3Title }}</div>
          <div class="field-line">{{ form.cooperationDetail || '-' }}</div>
        </div>

        <div class="section">
          <div class="sub-title">{{ reportText.section4Title }}</div>
          <div class="field-line">{{ displayResearchType }}</div>
        </div>

        <div class="section" v-for="field in contentSections" :key="field.model">
          <div class="sub-title">{{ field.title }}</div>
          <div class="field-line" v-html="form[field.model]"></div>
        </div>

        <div class="section" v-if="form.activities && form.activities.length">
          <div class="sub-title">{{ reportText.section12Title }}</div>
          <div class="group-title ms-3">{{ researchDurationText }}</div>
          <table class="gantt-print-table">
            <thead>
              <tr>
                <th class="col-activity" rowspan="2">{{ reportText.activityHeader }}</th>
                <th :colspan="maxMonths">{{ reportText.monthHeader }} ({{ totalYearsText }})</th>
                <th class="col-owner" rowspan="2">{{ reportText.ownerHeader }}</th>
              </tr>
              <tr>
                <th v-for="m in maxMonths" :key="m" :style="{ width: monthWidth + 'px' }">{{ m }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(act, index) in form.activities" :key="index">
                <td class="col-activity">{{ act.name }}</td>
                <td
                  v-for="(month, i) in act.months"
                  :key="i"
                  :style="{ width: monthWidth + 'px', backgroundColor: month ? '#444' : 'transparent' }"
                />
                <td class="col-owner">{{ act.owner }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="sub-title">{{ reportText.section13Title }}</div>
          <div class="field-line" v-html="form.progressReport"></div>
        </div>

        <div class="section">
          <div class="sub-title">{{ reportText.section14Title }}</div>
          <template v-for="group in expectedOutcomeGroups">
            <div :key="`${group.key}-title`" class="group-title">{{ group.title }}</div>
            <div
              v-for="option in group.options"
              :key="`${group.key}-${option.value}`"
              class="option"
            >
              <span>{{ check(hasSelectedOutcome(option.value)) }}</span>
              {{ option.label }}
            </div>
          </template>
        </div>

        <div class="section">
          <div class="sub-title">{{ reportText.section15Title }}</div>
          <div class="field-line" v-html="form.integration"></div>
        </div>

        <div class="section">
          <div class="sub-title">{{ reportText.section16Title }}</div>
          <div v-for="option in socialTransferOptions" :key="option.value" class="option">
            <span>{{ check(form.socialTransfer === option.value) }}</span>
            {{ option.label }}
          </div>
        </div>

        <div class="section budget-section budget-section-page">
          <div class="sub-title">{{ reportText.section17Title }}</div>
          <div v-if="form.budgetData && form.budgetData.categories && form.budgetData.categories.length" class="budget-table-section mt-4">
            <table class="budget-print-table budget-report-table">
              <thead>
                <tr>
                  <th v-for="header in budgetTableHeaders" :key="header">{{ header }}</th>
                </tr>
              </thead>
              <tbody v-for="(cat, ci) in form.budgetData.categories" :key="`budget-cat-${ci}`">
                <tr v-for="(row, ri) in cat.rows" :key="`budget-row-${ci}-${ri}`">
                  <td>{{ cat.title }}</td>
                  <td>{{ ri + 1 }}. {{ row.name }}</td>
                  <td class="text-start multiplier-cell">
                    <div v-if="row.multipliers && row.multipliers.length">
                      <div v-for="(multiplier, mi) in row.multipliers" :key="`budget-multiplier-${ci}-${ri}-${mi}`">
                        {{ formatMultiplier(multiplier) }}
                      </div>
                    </div>
                    <span v-else>-</span>
                  </td>
                  <td class="text-end fw-bold">{{ formatNumber(row.total) }}</td>
                  <td class="text-end">{{ formatNumber(row.p1) }}</td>
                  <td class="text-end">{{ formatNumber(row.p2) }}</td>
                  <td class="text-end">{{ formatNumber(row.p3) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="budget-grand-total mt-3">
              {{ reportText.grandTotalLabel }} {{ formatNumber(form.budgetData.grandTotal) }} {{ reportText.currencyUnit }}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="sub-title">{{ researchStandardText.sectionTitle }}</div>
          <div class="option">
            <span>{{ check(isResearchStandardNoneSelected) }}</span>
            {{ researchStandardText.noneMessage }}
          </div>
          <template v-for="group in researchStandardReportItems">
            <div :key="`${group.key}-title`" class="option">
              <span>{{ check(group.enabled) }}</span>
              {{ group.title }}
            </div>
            <div v-for="option in group.options" :key="`${group.key}-${option.value}`" class="sub-option">
              <span>{{ check(group.status === option.value) }}</span>
              {{ option.label }}
              <template v-if="group.status === option.value && option.value === researchStandardStatuses.pending">
                {{ researchStandardText.submittedDateLabel }} {{ group.submittedDate || '-' }}
              </template>
            </div>
          </template>
        </div>

        <div class="section">
          <div class="sub-title">{{ reportText.section19Title }}</div>
          <div class="field-line" v-html="form.remark || '-'"></div>
        </div>

        <div class="section">
          <div class="sub-title">{{ reportText.section20Title }}</div>
          <div class="signature-page-in-section">
            <div class="signature-row">
              <div class="signature-box">
                <div class="sign-label">{{ reportText.mainResearcherSignatureLabel }}</div>
                <img v-if="researchers.mainResearcher.signature" :src="researchers.mainResearcher.signature" class="sign-img" />
                <div class="dot-line-sign">({{ researchers.mainResearcher.name || reportText.signaturePlaceholder }})</div>
                <div>{{ reportText.dateLabel }} {{ researchers.mainResearcher.signatureDate || reportText.datePlaceholder }}</div>
              </div>

              <div class="signature-box" v-if="researchers.advisors.length">
                <div class="sign-label">{{ reportText.advisorSignatureLabel }}</div>
                <img v-if="researchers.advisors[0].signature" :src="researchers.advisors[0].signature" class="sign-img" />
                <div class="dot-line-sign">({{ researchers.advisors[0].name || reportText.signaturePlaceholder }})</div>
                <div>{{ reportText.dateLabel }} {{ researchers.advisors[0].signatureDate || reportText.datePlaceholder }}</div>
              </div>
            </div>

            <div class="signature-row" v-for="(co, index) in researchers.coResearchers" :key="`report-co-${index}`">
              <div class="signature-box">
                <div class="sign-label">{{ coResearcherSignatureLabel(index) }}</div>
                <img v-if="co.signature" :src="co.signature" class="sign-img" />
                <div class="dot-line-sign">({{ co.name || reportText.signaturePlaceholder }})</div>
                <div>{{ reportText.dateLabel }} {{ co.signatureDate || reportText.datePlaceholder }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  RESEARCH_STANDARD_STATUSES,
  RESEARCH_STANDARD_TEXT,
  RESEARCH_STANDARD_TEXT_EN,
  RESEARCH_STANDARD_GROUPS_EN,
  getResearchStandardGroupList,
  getResearchStandardGroupMeta,
  normalizeResearchStandardStatus
} from '@/ResearchFormRS/constants/researchStandard'
import { loadResearchFormRuntimeConfigs } from '@/ResearchFormRS/utils/researchConfigRuntime'

export default {
  name: 'ResearchReport',
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      runtimeConfigVersion: 0
    }
  },
  async created() {
    await loadResearchFormRuntimeConfigs()
    this.runtimeConfigVersion += 1
  },
  methods: {
    check(condition) {
      return condition ? '☑' : '☐'
    },
    formatNumber(value) {
      return Number(value || 0).toLocaleString(this.reportLocale)
    },
    formatMultiplier(multiplier) {
      var rawValue = multiplier && multiplier.value !== undefined ? multiplier.value : (multiplier && multiplier.val)
      var value = rawValue !== undefined && rawValue !== null && rawValue !== '' ? rawValue : 0
      var label = multiplier && multiplier.label ? multiplier.label : ''
      if (label) {
        return label + ': ' + this.formatNumber(value)
      }
      return this.formatNumber(value)
    },
    formatMultipliers(multipliers) {
      if (!Array.isArray(multipliers) || !multipliers.length) return ''
      return multipliers.map(this.formatMultiplier).join(' x ')
    },
    researchStandardGroupMeta(groupKey) {
      if (this.isEnglishLocale) {
        return RESEARCH_STANDARD_GROUPS_EN[String(groupKey || '').trim()] || null
      }
      return getResearchStandardGroupMeta(groupKey)
    },
    normalizeResearchStandardDate(value) {
      const raw = String(value || '').trim()
      if (!raw) return ''
      return raw.length >= 10 ? raw.slice(0, 10) : raw
    },
    getLegacyResearchStandardDetail(groupKey) {
      const source = this.form && typeof this.form === 'object' ? this.form : {}
      if (groupKey === 'human') return source.humanDetail || {}
      if (groupKey === 'animal') return source.animalDetail || {}
      if (groupKey === 'plant') return source.plantDetail || {}
      return {}
    },
    buildResearchStandardGroupState(groupKey) {
      const source = this.form && typeof this.form === 'object' ? this.form : {}
      const meta = this.researchStandardGroupMeta(groupKey)
      if (!meta) return null

      const section18 = source.section18 && typeof source.section18 === 'object' ? source.section18 : {}
      const currentSection = section18[groupKey] && typeof section18[groupKey] === 'object' ? section18[groupKey] : {}
      const legacyDetail = this.getLegacyResearchStandardDetail(groupKey)
      const legacySelection = Array.isArray(source.researchStandard) ? source.researchStandard : []

      const enabled = typeof currentSection.enabled === 'boolean'
        ? currentSection.enabled
        : (legacySelection.includes(groupKey) || Boolean(source[meta.legacy.enabledKey]))

      let status = normalizeResearchStandardStatus(currentSection.status || source[meta.legacy.statusKey])
      if (!status) {
        if (legacyDetail && legacyDetail.hasCert) status = this.researchStandardStatuses.approved
        else if (legacyDetail && legacyDetail.isPending) status = this.researchStandardStatuses.pending
      }

      const submittedDate = this.normalizeResearchStandardDate(
        currentSection.submittedDate || source[meta.legacy.submittedDateKey] || legacyDetail.applyDate
      )

      return {
        key: meta.key,
        title: meta.title,
        enabled: Boolean(enabled),
        status: enabled ? status : '',
        submittedDate,
        options: Array.isArray(meta.options) ? meta.options : []
      }
    },
    exportFileName() {
      const title = String(this.form.titleTH || this.form.titleEN || 'Research_Proposal_RS1')
        .replace(/[\\/:*?"<>|]/g, ' ')
        .trim()
      return title || 'Research_Proposal_RS1'
    },
    buildPrintableHtml(reportHtml, title, styleNodes) {
      return `<!doctype html>
<html lang="${this.reportHtmlLang}">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    ${styleNodes}
    <style>
      @page { size: A4; margin: 14mm 12mm 16mm 12mm; }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff !important;
        color: #000000;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .export-btn {
        display: none !important;
      }
      .page-wrapper,
      .report-container {
        box-shadow: none !important;
        background: #ffffff !important;
      }
      .report-container {
        width: auto !important;
        min-height: auto !important;
        border-radius: 0 !important;
      }
      .first-page,
      .other-pages {
        padding: 0 2mm 4mm 2mm !important;
      }
    </style>
  </head>
  <body>
    <div class="page-wrapper">${reportHtml}</div>
  </body>
</html>`
    },
    waitForIframeLoad(iframe, timeoutMs = 1500) {
      return new Promise((resolve) => {
        let isDone = false
        const finish = () => {
          if (isDone) return
          isDone = true
          resolve()
        }
        const timer = window.setTimeout(finish, timeoutMs)
        iframe.onload = () => {
          window.clearTimeout(timer)
          finish()
        }
      })
    },
    async printWithHiddenIframe(printableHtml) {
      const iframe = document.createElement('iframe')
      iframe.setAttribute('aria-hidden', 'true')
      iframe.setAttribute('tabindex', '-1')
      iframe.style.position = 'fixed'
      iframe.style.bottom = '0'
      iframe.style.right = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.style.opacity = '0'
      iframe.style.visibility = 'hidden'
      iframe.style.pointerEvents = 'none'

      document.body.appendChild(iframe)
      try {
        const frameWindow = iframe.contentWindow
        if (!frameWindow || !frameWindow.document) {
          throw new Error('Print iframe is not ready')
        }

        const frameDocument = frameWindow.document
        frameDocument.open()
        frameDocument.write(printableHtml)
        frameDocument.close()

        await this.waitForIframeLoad(iframe)
        await new Promise(resolve => window.setTimeout(resolve, 350))

        frameWindow.focus()
        frameWindow.print()
      } finally {
        window.setTimeout(() => {
          try {
            if (iframe && iframe.parentNode) {
              iframe.parentNode.removeChild(iframe)
            }
          } catch (_) { void _ }
        }, 1200)
      }
    },
    async printWithPopupFallback(printableHtml) {
      const popup = window.open('', '_blank')
      if (!popup) {
        throw new Error('Browser blocked print window')
      }

      popup.document.open()
      popup.document.write(printableHtml)
      popup.document.close()
      popup.focus()
      await new Promise(resolve => window.setTimeout(resolve, 350))
      popup.print()
    },
    async generatePDF() {
      const element = this.$refs.reportContainer
      const button = this.$refs.exportButton || null
      if (!element || typeof element.querySelectorAll !== 'function') {
        throw new Error('Report container is not ready')
      }

      if (button) button.style.display = 'none'
      element.classList.add('export-mode')

      try {
        await this.$nextTick()

        const images = element.querySelectorAll('img')
        await Promise.all(
          Array.from(images).map(img => {
            if (img.complete) return Promise.resolve()
            return new Promise(resolve => {
              img.onload = img.onerror = resolve
            })
          })
        )

        const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
          .map(node => node.outerHTML)
          .join('\n')

        const reportHtml = element.outerHTML
        const title = this.exportFileName()
        const printableHtml = this.buildPrintableHtml(reportHtml, title, styleNodes)

        try {
          await this.printWithHiddenIframe(printableHtml)
        } catch (hiddenPrintErr) {
          try {
            await this.printWithPopupFallback(printableHtml)
          } catch (popupErr) {
            throw popupErr || hiddenPrintErr
          }
        }
      } finally {
        if (button) button.style.display = 'block'
        element.classList.remove('export-mode')
      }
    },
    hasSelectedOutcome(value) {
      return Array.isArray(this.form.selectedOutcomes) && this.form.selectedOutcomes.includes(value)
    },
    coResearcherTitle(index) {
      return this.isEnglishLocale
        ? `1.${index + 2} Co-researcher`
        : `1.${index + 2} ผู้ร่วมโครงการวิจัย`
    },
    coResearcherSignatureLabel(index) {
      return this.isEnglishLocale
        ? `Signature (Co-researcher ${index + 1})`
        : `ลงชื่อ (ผู้ร่วมโครงการวิจัย คนที่ ${index + 1})`
    }
  },
  computed: {
    isEnglishLocale() {
      const locale = String((this.$i18n && this.$i18n.locale) || '').trim().toLowerCase()
      return locale.startsWith('en')
    },
    reportLocale() {
      return this.isEnglishLocale ? 'en-US' : 'th-TH'
    },
    reportHtmlLang() {
      return this.isEnglishLocale ? 'en' : 'th'
    },
    researchers() {
      const source = this.form && this.form.researchers && typeof this.form.researchers === 'object'
        ? this.form.researchers
        : {}
      return {
        mainResearcher: source.mainResearcher || {},
        coResearchers: Array.isArray(source.coResearchers) ? source.coResearchers : [],
        advisors: Array.isArray(source.advisors) ? source.advisors : []
      }
    },
    reportText() {
      if (this.isEnglishLocale) {
        return {
          section1Title: '1. Project Title',
          languageThai: '(Thai)',
          languageEnglish: '(English)',
          section2Title: '2. Alignment of the research project with Mae Fah Luang University research strategies',
          partATitle: 'Part A: Summary of the research proposal',
          researchTeamTitle: '1. Research Team',
          mainResearcherTitle: '1.1 Principal Investigator',
          advisorTitle: '2. Project Advisor',
          nameLabel: 'Name',
          affiliationLabel: 'Affiliation',
          phoneLabel: 'Contact phone number',
          emailLabel: 'E-mail address',
          workloadPercentLabel: 'Research workload percentage',
          section3Title: '3. Collaborating Organization',
          section4Title: '4. Research Type',
          section12Title: '12. Work Plan',
          researchDurationPrefix: 'Research duration',
          researchDurationSuffix: 'months',
          activityHeader: 'Research Activity',
          monthHeader: 'Month',
          ownerHeader: 'Responsible Person',
          section13Title: '13. Outputs by the research progress-reporting period',
          section14Title: '14. Expected Outcomes',
          section15Title: '15. Research Integration',
          section16Title: '16. Level of Social Transfer',
          section17Title: '17. Budget',
          grandTotalLabel: 'Grand total',
          currencyUnit: 'THB',
          section19Title: '19. Remarks',
          section20Title: 'Certification and Signature',
          mainResearcherSignatureLabel: 'Signature (Principal Investigator)',
          advisorSignatureLabel: 'Signature (Project Advisor)',
          dateLabel: 'Date',
          signaturePlaceholder: '................................................',
          datePlaceholder: '................................'
        }
      }
      return {
        section1Title: '1. ชื่อโครงการ',
        languageThai: '(ภาษาไทย)',
        languageEnglish: '(ภาษาอังกฤษ)',
        section2Title: '2. ระบุความสอดคล้องของโครงการวิจัยกับประเด็นยุทธศาสตร์การวิจัยมหาวิทยาลัยแม่ฟ้าหลวง',
        partATitle: 'ส่วน ก : สาระสำคัญของข้อเสนอโครงการวิจัย',
        researchTeamTitle: '1. คณะผู้วิจัย',
        mainResearcherTitle: '1.1 หัวหน้าโครงการวิจัย',
        advisorTitle: '2. ที่ปรึกษาโครงการวิจัย',
        nameLabel: 'ชื่อ-สกุล',
        affiliationLabel: 'สังกัดหน่วยงาน',
        phoneLabel: 'เบอร์โทรศัพท์ที่ติดต่อได้',
        emailLabel: 'E-mail address',
        workloadPercentLabel: 'คิดเป็นสัดส่วนการวิจัยร้อยละ',
        section3Title: '3. หน่วยงานที่ร่วมมือ',
        section4Title: '4. ประเภทของงานวิจัย',
        section12Title: '12. แผนการดำเนินงาน',
        researchDurationPrefix: 'ระยะเวลาที่ทำการวิจัย',
        researchDurationSuffix: 'เดือน',
        activityHeader: 'กิจกรรมวิจัย',
        monthHeader: 'เดือนที่',
        ownerHeader: 'ผู้รับผิดชอบ',
        section13Title: '13. ผลงานตามระยะเวลาการรายงานความก้าวหน้าของงานวิจัย',
        section14Title: '14. ผลลัพธ์ที่คาดว่าจะได้รับ',
        section15Title: '15. การบูรณาการงานวิจัย',
        section16Title: '16. ระดับการถ่ายทอดสู่สังคม',
        section17Title: '17. งบประมาณ',
        grandTotalLabel: 'รวมทั้งสิ้น',
        currencyUnit: 'บาท',
        section19Title: '19. หมายเหตุ',
        section20Title: 'การลงนามยืนยันข้อมูลและคำรับรอง',
        mainResearcherSignatureLabel: 'ลงชื่อ (หัวหน้าโครงการวิจัย)',
        advisorSignatureLabel: 'ลงชื่อ (ที่ปรึกษาโครงการวิจัย)',
        dateLabel: 'วันที่',
        signaturePlaceholder: '................................................',
        datePlaceholder: '................................'
      }
    },
    fundingTypeDisplayOptions() {
      if (this.isEnglishLocale) {
        return [
          { value: 'new', label: 'New Researcher Grant' },
          { value: 'dev', label: 'Researcher Development Grant' },
          { value: 'strategic', label: 'Strategic Research Grant' },
          { value: 'industrial', label: 'Industry and Innovation Extension Grant under the National Strategic Research Framework' }
        ]
      }
      return [
        { value: 'new', label: 'ทุนนักวิจัยใหม่' },
        { value: 'dev', label: 'ทุนพัฒนานักวิจัย' },
        { value: 'strategic', label: 'ทุนที่สอดคล้องกับยุทธศาสตร์การวิจัย' },
        { value: 'industrial', label: 'ทุนต่อยอดสู่ภาคอุตสาหกรรมและนวัตกรรม ภายใต้กรอบวิจัยยุทธศาสตร์ชาติ' }
      ]
    },
    strategySections() {
      if (this.isEnglishLocale) {
        return [
          {
            key: 'new',
            title: '1. New Researcher Grant',
            options: [
              { value: '2_1', label: '1. The proposed research project aligns with the researcher\'s qualifications, discipline, or workload.' }
            ]
          },
          {
            key: 'development',
            title: '2. Researcher Development Grant and strategic research and innovation grants under the national strategic framework',
            options: [
              { value: '2_2_1', label: '1. Development of the Thai economy through a value-based and creative economy with competitiveness and sustainable self-reliance, powered by science, research, and innovation.' },
              { value: '2_2_2', label: '2. Advancement of society and the environment toward sustainable development and resilience to global change, powered by science, research, and innovation.' },
              { value: '2_2_3', label: '3. Advancement of frontier science, technology, research, and innovation to create new opportunities and future readiness for the country.' },
              { value: '2_2_4', label: '4. Development of human capital and institutions in science, research, and innovation as a strong and sustainable foundation for national economic and social development.' }
            ]
          },
          {
            key: 'industry',
            title: '3. Industry Extension Grant',
            options: [
              { value: '2_3_1', label: '1. Research and innovation to improve competitiveness.' }
            ]
          }
        ]
      }
      return [
        {
          key: 'new',
          title: '1. ประเภททุนนักวิจัยใหม่',
          options: [
            { value: '2_1', label: '1. โครงการวิจัยที่เสนอสอดคล้องกับคุณวุฒิ หรือสาขาวิชา หรือภาระงาน' }
          ]
        },
        {
          key: 'development',
          title: '2. ประเภททุนพัฒนานักวิจัย และทุนที่สอดคล้องกับยุทธศาสตร์การวิจัยและนวัตกรรมภายใต้กรอบวิจัยยุทธศาสตร์ชาติ',
          options: [
            { value: '2_2_1', label: '1. การพัฒนาเศรษฐกิจไทยด้วยเศรษฐกิจสร้างคุณค่าและเศรษฐกิจสร้างสรรค์ ให้มีความสามารถในการแข่งขันและพึ่งพาตนเองได้อย่างยั่งยืน พร้อมสู่อนาคต โดยใช้วิทยาศาสตร์ การวิจัยและนวัตกรรม' },
            { value: '2_2_2', label: '2. การยกระดับสังคมและสิ่งแวดล้อม ให้มีการพัฒนาอย่างยั่งยืน สามารถแก้ไขปัญหาท้าทายและปรับตัวได้ทันต่อพลวัตการเปลี่ยนแปลงของโลก โดยใช้วิทยาศาสตร์ การวิจัยและนวัตกรรม' },
            { value: '2_2_3', label: '3. การพัฒนาวิทยาศาสตร์ เทคโนโลยี การวิจัยและนวัตกรรม ระดับขั้นแนวหน้าที่ก้าวหน้าล้ำยุค เพื่อสร้างโอกาสใหม่และความพร้อม ของประเทศในอนาคต' },
            { value: '2_2_4', label: '4. การพัฒนากำลังคนและสถาบัน ด้านวิทยาศาสตร์ วิจัยและนวัตกรรม ให้เป็นฐานการขับเคลื่อนการพัฒนาเศรษฐกิจและสังคมของประเทศแบบก้าวกระโดด และอย่างยั่งยืน โดยใช้วิทยาศาสตร์ การวิจัยและนวัตกรรม' }
          ]
        },
        {
          key: 'industry',
          title: '3. ประเภททุนต่อยอดสู่อุตสาหกรรม',
          options: [
            { value: '2_3_1', label: '1. การวิจัยและสร้างนวัตกรรมเพื่อเพิ่มขีดความสามารถการแข่งขัน' }
          ]
        }
      ]
    },
    contentSections() {
      if (this.isEnglishLocale) {
        return [
          { title: '5. Keywords', model: 'keywords' },
          { title: '6. Problem significance and concept', model: 'importance' },
          { title: '7. Objectives', model: 'objective' },
          { title: '8. Literature review', model: 'literature' },
          { title: '9. References', model: 'reference' },
          { title: '10. Research methodology', model: 'methodology' },
          { title: '11. Research scope', model: 'scope' }
        ]
      }
      return [
        { title: '5. คำสำคัญ (Keywords)', model: 'keywords' },
        { title: '6. ความสำคัญของปัญหาและแนวคิด', model: 'importance' },
        { title: '7. วัตถุประสงค์', model: 'objective' },
        { title: '8. ทบทวนวรรณกรรม', model: 'literature' },
        { title: '9. เอกสารอ้างอิง', model: 'reference' },
        { title: '10. วิธีดำเนินการวิจัย', model: 'methodology' },
        { title: '11. ขอบเขตการวิจัย', model: 'scope' }
      ]
    },
    expectedOutcomeGroups() {
      if (this.isEnglishLocale) {
        return [
          {
            key: '14_1',
            title: '14.1 New Researcher Grant',
            options: [
              { value: '14_1_fullpaper', label: 'Presentation at an international academic conference with a full paper published in the proceedings.' },
              { value: '14_1_tci', label: 'Publication in an academic journal listed in the database recognized by the OHEC announcement on academic journal criteria B.E. 2562.' },
              { value: '14_1_international', label: 'Publication in a national academic journal indexed in TCI Group 1 or Group 2.' },
              { value: '14_1_patent', label: 'Petty patent / patent application (with application number).' }
            ]
          },
          {
            key: '14_2',
            title: '14.2 Researcher Development Grant',
            options: [
              { value: '14_2_international', label: 'Publication in an international academic journal listed in the database recognized by the OHEC announcement on academic journal criteria B.E. 2562.' },
              { value: '14_2_tci1', label: 'Publication in a national academic journal indexed in TCI Group 1 only.' },
              { value: '14_2_patent', label: 'Petty patent / patent application (with application number).' }
            ]
          },
          {
            key: '14_3',
            title: '14.3 Strategic Research Grant',
            options: [
              { value: '14_3_international', label: 'Publication in an international academic journal listed in the database recognized by the OHEC announcement on academic journal criteria B.E. 2562.' },
              { value: '14_3_tci1', label: 'Publication in a national academic journal indexed in TCI Group 1 only.' },
              { value: '14_3_patent', label: 'Petty patent / patent application (with application number).' }
            ]
          },
          {
            key: '14_4',
            title: '14.4 Industry Extension Grant',
            options: [
              { value: '14_4_ip', label: 'Intellectual property registration filing (with application number).' }
            ]
          }
        ]
      }
      return [
        {
          key: '14_1',
          title: '14.1 ทุนนักวิจัยรุ่นใหม่',
          options: [
            { value: '14_1_fullpaper', label: 'นำเสนอในการประชุมวิชาการระดับนานาชาติ โดยต้องเป็นบทความฉบับสมบูรณ์ (Full paper) ที่ได้รับการตีพิมพ์ในรายงานสืบเนื่องจากการประชุม (Proceedings) หรือ' },
            { value: '14_1_tci', label: 'ตีพิมพ์ในวารสารทางวิชาการที่มีรายชื่ออยู่ในฐานข้อมูล ตามประกาศ ก.พ.อ. เรื่องหลักเกณฑ์การพิจารณาวารสารทางวิชาการ สำหรับการเผยแพร่ผลงานทางวิชาการ พ.ศ.2562 หรือ' },
            { value: '14_1_international', label: 'ตีพิมพ์วารสารทางวิชาการระดับชาติ ต้องเป็นวารสารทางวิชาการที่ปรากฏในฐานข้อมูล TCI กลุ่มที่ 1 หรือ กลุ่มที่ 2 หรือ' },
            { value: '14_1_patent', label: 'อนุสิทธิบัตร/สิทธิบัตร (มีเลขคำขอ)' }
          ]
        },
        {
          key: '14_2',
          title: '14.2 ทุนพัฒนานักวิจัย',
          options: [
            { value: '14_2_international', label: 'ตีพิมพ์ในวารสารทางวิชาการระดับนานาชาติที่มีรายชื่ออยู่ในฐานข้อมูล ตามประกาศ ก.พ.อ. เรื่องหลักเกณฑ์การพิจารณาวารสารทางวิชาการ สำหรับการเผยแพร่ผลงานทางวิชาการ พ.ศ.2562 หรือ' },
            { value: '14_2_tci1', label: 'ตีพิมพ์วารสารทางวิชาการระดับชาติ ต้องเป็นวารสารทางวิชาการที่ปรากฏในฐานข้อมูล TCI กลุ่มที่ 1 เท่านั้น หรือ' },
            { value: '14_2_patent', label: 'อนุสิทธิบัตร/สิทธิบัตร (มีเลขคำขอ)' }
          ]
        },
        {
          key: '14_3',
          title: '14.3 ทุนวิจัยที่สอดคล้องกับยุทธศาสตร์',
          options: [
            { value: '14_3_international', label: 'ตีพิมพ์ในวารสารทางวิชาการระดับนานาชาติที่มีรายชื่ออยู่ในฐานข้อมูล ตามประกาศ ก.พ.อ. เรื่องหลักเกณฑ์การพิจารณาวารสารทางวิชาการ สำหรับการเผยแพร่ผลงานทางวิชาการ พ.ศ.2562 หรือ' },
            { value: '14_3_tci1', label: 'ตีพิมพ์วารสารทางวิชาการระดับชาติ ต้องเป็นวารสารทางวิชาการที่ปรากฏในฐานข้อมูล TCI กลุ่มที่ 1 เท่านั้น หรือ' },
            { value: '14_3_patent', label: 'อนุสิทธิบัตร/สิทธิบัตร (มีเลขคำขอ)' }
          ]
        },
        {
          key: '14_4',
          title: '14.4 ทุนต่อยอดสู่ภาคอุตสาหกรรม',
          options: [
            { value: '14_4_ip', label: 'การยื่นจดทะเบียนทรัพย์สินทางปัญญา (มีเลขคำขอ)' }
          ]
        }
      ]
    },
    socialTransferOptions() {
      if (this.isEnglishLocale) {
        return [
          { value: '16_1', label: 'Can be transferred as a model or guideline at the regional, national, or international level.' },
          { value: '16_2', label: 'Can be transferred as a model or guideline for occupational groups, communities, or provinces only.' },
          { value: '16_3', label: 'No social transfer yet.' }
        ]
      }
      return [
        { value: '16_1', label: 'สามารถนำไปถ่ายทอดเป็นต้นแบบและแนวทางได้ในระดับภูมิภาค ประเทศ หรือ นานาชาติ' },
        { value: '16_2', label: 'สามารถนำไปถ่ายทอดเป็นต้นแบบและแนวทางได้เฉพาะกลุ่มอาชีพ ชุมชน หรือจังหวัด' },
        { value: '16_3', label: 'ไม่มีการนำไปถ่ายทอดสู่สังคม' }
      ]
    },
    budgetTableHeaders() {
      if (this.isEnglishLocale) {
        return ['Category', 'Item', 'Multiplier Details', 'Total (THB)', 'Period 1', 'Period 2', 'Period 3']
      }
      return ['หมวด', 'รายการ', 'รายละเอียดตัวคูณ', 'รวม (บาท)', 'งวด 1', 'งวด 2', 'งวด 3']
    },
    displayResearchType() {
      const value = String(this.form.researchType || '').trim()
      const map = this.isEnglishLocale
        ? {
            'science-technology': 'Science and Technology',
            'health-science': 'Health Sciences',
            'social-humanities': 'Social Sciences and Humanities'
          }
        : {
            'science-technology': 'ด้านวิทยาศาสตร์และเทคโนโลยี',
            'health-science': 'ด้านวิทยาศาสตร์สุขภาพ',
            'social-humanities': 'ด้านสังคมศาสตร์และมนุษยศาสตร์'
          }
      return map[value] || value || '-'
    },
    researchStandardStatuses() {
      this.runtimeConfigVersion
      return RESEARCH_STANDARD_STATUSES
    },
    researchStandardText() {
      this.runtimeConfigVersion
      return this.isEnglishLocale ? RESEARCH_STANDARD_TEXT_EN : RESEARCH_STANDARD_TEXT
    },
    researchStandardReportItems() {
      this.runtimeConfigVersion
      const groupKeys = this.isEnglishLocale ? Object.keys(RESEARCH_STANDARD_GROUPS_EN) : getResearchStandardGroupList().map(group => group.key)
      return groupKeys.map(groupKey => this.buildResearchStandardGroupState(groupKey)).filter(Boolean)
    },
    isResearchStandardNoneSelected() {
      const source = this.form && typeof this.form === 'object' ? this.form : {}
      const legacySelection = Array.isArray(source.researchStandard) ? source.researchStandard : []
      if (legacySelection.includes('none')) return true
      return !this.researchStandardReportItems.some(item => item.enabled)
    },
    currentLocaleDate() {
      return new Date().toLocaleDateString(this.reportLocale)
    },
    maxMonths() {
      if (!this.form.activities || !this.form.activities.length) return 0
      return this.form.activities[0].months.length
    },
    monthWidth() {
      if (!this.maxMonths) return 20
      const totalAvailable = 400
      return Math.floor(totalAvailable / this.maxMonths)
    },
    totalYearsText() {
      if (!this.maxMonths) return ''
      if (this.maxMonths === 6) return this.isEnglishLocale ? 'Half year' : 'ครึ่งปี'
      if (this.maxMonths === 12) return this.isEnglishLocale ? '1 year' : '1 ปี'
      if (this.maxMonths === 24) return this.isEnglishLocale ? '2 years' : '2 ปี'
      return this.isEnglishLocale
        ? `${(this.maxMonths / 24).toFixed(1)} years`
        : `${(this.maxMonths / 24).toFixed(1)} ปี`
    },
    researchDurationText() {
      return `${this.reportText.researchDurationPrefix} ${this.maxMonths} ${this.reportText.researchDurationSuffix}`
    }
  }
}
</script>


<style scoped>
.export-mode {
  box-shadow: none !important;
  border-radius: 0 !important;
}

.page-wrapper.export-mode {
  background: white !important;
}

.report-container.export-mode {
  box-shadow: none !important;
  background: white !important;
}

.first-page {
  padding: 10mm 20mm 20mm 20mm;
}

.other-pages {
  padding: 20mm 20mm 20mm 20mm;
  page-break-before: always;
  break-before: page;
}

.export-bar {
  position: fixed;
  top: 20px;
  right: 40px;
  z-index: 999;
}

.export-btn {
  position: fixed;
  top: 20px;
  right: 40px;
  z-index: 999;
  background: linear-gradient(135deg, #1428e2, #0b0636);
  color: white;
  border: none;
  padding: 12px 22px;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 18px rgba(22, 119, 255, 0.25);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Hover */
.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(22, 119, 255, 0.35);
}

.export-btn:active {
  transform: translateY(0px);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2);
}

.landscape-table {
  width: 100%;
  font-size: 16pt;
}


.budget-print-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16pt;
}

.budget-report-table {
  table-layout: auto;
  font-size: 16pt;
}

.budget-report-table th:nth-child(1),
.budget-report-table td:nth-child(1) {
  width: 16%;
}

.budget-report-table th:nth-child(2),
.budget-report-table td:nth-child(2) {
  width: 17%;
}

.budget-report-table th:nth-child(3),
.budget-report-table td:nth-child(3) {
  width: 27%;
}

.budget-print-table th,
.budget-print-table td {
  border: 1px solid #000;
  padding: 9px 6px;
  vertical-align: top;
}

.report-container {
  width: 210mm;
  min-height: 297mm;
  margin: auto;
  background: white;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  font-family: "TH Sarabun New", "Sarabun", "Noto Sans Thai", Tahoma, sans-serif;
  font-size: 16pt;
  line-height: 1.75;
  box-sizing: border-box;
  position: relative;
}

.report-container,
.report-container * {
  box-sizing: border-box;
}


@page {
  size: A4;
  margin: 14mm 12mm 16mm 12mm;
}

.checkbox-line {
  margin-top: 20px;
  margin-left: 50px;
}

.checkbox-item {
  display: inline-block;
  margin-right: 25px;
  margin-bottom: 8px;
}

.doc-code {
  position: absolute;
  top: 5mm;
  right: 15mm;
  font-weight: bold;
}

.text-center {
  text-align: center;
}


.line {
  border-bottom: 1px dotted #000;
  margin: 5px 0 10px 0;
}

.checkbox-line {
  margin-top: 20px;
  margin-left: 50px;
}

.checked {
  font-weight: bold;
}

.group-title {
  font-weight: bold;
  font-size: 20px;
  color: #000000;
  margin-left: 15px;
  line-height: 1.5;
}

.option {
  margin-bottom: 10px;
  margin-left: 25px;
  line-height: 1.55;
}

.sub-option {
  margin-left: 50px;
  margin-bottom: 8px;
  text-align: justify;
  line-height: 1.55;
}

.sub-section-title {
  font-size: 22px;
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 10px;
}

.sub-topic {
  font-weight: bold;
  margin-top: 15px;
  margin-bottom: 5px;
}

.dot-line {
  display: inline-block;
  border-bottom: 1px dotted #000;
  min-width: 60%;
  padding-left: 5px;
  line-height: 1.45;
  vertical-align: baseline;
}

.section {
  page-break-inside: avoid;
  break-inside: avoid;
  margin-bottom: 20px;
}

.force-page-break {
  page-break-before: always;
  break-before: page;
}

.option,
.sub-option {
  page-break-inside: avoid;
  break-inside: avoid;
}

.section-title {
  font-size: 21px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #000000;
  margin-left: -20px;
  line-height: 1.45;
}

.head-title {
  text-align: center;
  font-size: 21px;
  font-weight: bold;
  margin-bottom: 30px;
  margin-top: 50px;
  color: #000000;
  margin-left: -15px;
  line-height: 1.5;
}

.sub-title {
  font-size: 21px;
  font-weight: bold;
  color: #000000;
  line-height: 1.45;
}

.line-block {
  margin-top: 5px;
  text-align: justify;
  text-indent: 30px;
  line-height: 1.7;
}

.field-line {
  margin-bottom: 8px;
  padding-left: 15px;
  line-height: 1.6;
  word-break: break-word;
}

/* สำหรับแสดงเลขหน้าตอนพิมพ์/PDF */
@media print {
  body {
    counter-reset: page;
  }

  .report-container {
    width: auto;
    min-height: auto;
    box-shadow: none;
    border-radius: 0;
  }

  .first-page,
  .other-pages {
    padding: 0 2mm 4mm 2mm;
  }

  .word-page {
    margin-bottom: 0;
    /* ลบช่องว่างออกตอนเป็น PDF เพื่อให้ต่อเนื่อง */
    box-shadow: none;
    page-break-after: always;
    /* บังคับให้ PDF ตัดขึ้นหน้าใหม่ทันทีที่จบ Class นี้ */
    break-after: page;
  }

  .landscape-container .rotated-content {
    transform: rotate(90deg);
    transform-origin: center;
    width: 250mm;
    /* ความกว้างตารางจะกลายเป็นความสูงของหน้า */
    height: 170mm;
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
  }
}

.option,
.sub-option {
  page-break-inside: avoid;
}

.signature-page {
  margin-top: 10px;
  page-break-inside: avoid;
}

.signature-row {
  display: flex;
  justify-content: space-between;
  margin-top: 50px;
}

.signature-box {
  width: 48%;
  /* จาก 30% เป็น 45% */
  position: relative;
  min-height: 150px;
  text-align: center;
}


.sign-label {
  margin-bottom: 20px;
  font-weight: bold;
  line-height: 1.45;
}

.sign-img {
  max-height: 50px;
  object-fit: contain;
  margin: 0 auto;
}


.dot-line-sign {
  border-bottom: 1px dotted #000;
  padding-bottom: 2px;
  margin-bottom: 2px;
  line-height: 1.45;
}

.gantt-print-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}



.gantt-print-table th,
.gantt-print-table td {
  border: 1px solid #000;
  padding: 3px;
  text-align: center;
  line-height: 1.35;
  vertical-align: top;
}

.col-activity {
  width: 100px;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: left;
}

.col-owner {
  width: 100px;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: left;
}

.budget-grand-total {
  text-align: right;
  font-weight: bold;
  margin-top: 10px;
}

.budget-section {
  page-break-inside: avoid;
  break-inside: avoid-page;
}

.budget-table-section {
  overflow: visible;
  page-break-inside: avoid;
  break-inside: avoid-page;
}

.multiplier-cell > div {
  margin-bottom: 2px;
}

.budget-print-table,
.budget-print-table thead,
.budget-print-table tbody,
.budget-print-table tr,
.budget-grand-total {
  page-break-inside: avoid;
  break-inside: avoid;
}

.budget-print-table th,
.budget-print-table td {
  line-height: 1.45;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  vertical-align: top;
}

@media print {
  .budget-section {
    page-break-before: always;
    break-before: page;
    page-break-inside: avoid;
    break-inside: avoid-page;
  }

  .budget-section-page,
  .budget-table-section,
  .budget-print-table {
    page-break-inside: avoid;
    break-inside: avoid-page;
  }

  .budget-report-table {
    font-size: 16pt;
  }
}
</style>
