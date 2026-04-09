<template>
  <div class="chairman-checklist-export">
    <div ref="reportContainer" class="chairman-checklist-export__container">
      <div class="page">
        <div class="header">
          <div v-for="(line, idx) in titleLines" :key="idx" class="header-line">
            {{ line }}
          </div>
        </div>

        <div class="project-fields">
          <div class="fill-line">
            <span class="fill-label">{{ exportText.projectTitle }}</span>
            <span class="fill-dots">
              <span class="fill-text">{{ form.projectTitleTh || '' }}</span>
            </span>
          </div>
          <div class="fill-line fill-line--two">
            <span class="fill-label">{{ exportText.projectLeader }}</span>
            <span class="fill-dots fill-dots--leader">
              <span class="fill-text">{{ form.projectLeaderName || '' }}</span>
            </span>
            <span class="fill-label fill-label--school">{{ exportText.school }}</span>
            <span class="fill-dots fill-dots--school">
              <span class="fill-text">{{ effectiveSchool || '' }}</span>
            </span>
          </div>
        </div>

        <table class="checklist-table">
          <thead>
            <tr>
              <th class="col-no">{{ exportText.colNo }}</th>
              <th class="col-topic">{{ exportText.colTopic }}</th>
              <th class="col-yes">{{ exportText.colYes }}</th>
              <th class="col-no2">{{ exportText.colNo2 }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(section, sIdx) in resolvedSections">
              <tr :key="`sec:${sIdx}`" class="section-row">
                <td colspan="4">{{ section.label }}</td>
              </tr>
              <tr v-for="(row, rIdx) in section.rows" :key="`row:${sIdx}:${rIdx}`">
                <td class="col-no">{{ row.no }}</td>
                <td class="col-topic">{{ row.text }}</td>
                <td class="col-yes">
                  <span class="mark">{{ row.answer === 'yes' ? '✓' : '' }}</span>
                </td>
                <td class="col-no2">
                  <span class="mark">{{ row.answer === 'no' ? '✓' : '' }}</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div class="footer">
          <div v-for="(line, idx) in footerTextLines" :key="`ft:${idx}`" class="footer-line">
            {{ line }}
          </div>

          <div class="footer-line footer-signature">
            <span class="footer-signature__label">ลงนาม</span>
            <span class="footer-signature__line">
              <img
                v-if="form.signatureData"
                class="footer-signature__img"
                :src="form.signatureData"
                :alt="exportText.signatureAlt"
              >
            </span>
          </div>
          <div class="footer-line footer-name">
            (<span class="footer-name__value">{{ form.signedBy || '-' }}</span>)
          </div>
          <div class="footer-line footer-chairman">
            ประธานคณะกรรมการวิจัยประจำสำนักวิชา<span class="footer-chairman__value">{{ chairmanAffiliation || '-' }}</span>
          </div>
          <div class="footer-line footer-date">
            วันที่ <span class="footer-date__value">{{ submittedParts.day }}</span>
            เดือน <span class="footer-date__value">{{ submittedParts.month }}</span>
            พ.ศ. <span class="footer-date__value">{{ submittedParts.year }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getChairmanChecklistPdfTemplate } from '@/ResearchFormRS/constants/chairmanChecklistPdfTemplates'

export default {
  name: 'ChairmanChecklistExport',
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  computed: {
    exportText () {
      // PDF templates are Thai; keep headings consistent with the provided checklists
      return {
        projectTitle: 'ชื่อข้อเสนอโครงการวิจัย',
        projectLeader: 'ชื่อหัวหน้าโครงการวิจัย',
        school: 'สังกัดสำนักวิชา',
        colNo: 'ลำดับ',
        colTopic: 'หัวข้อการพิจารณา',
        colYes: 'มี',
        colNo2: 'ไม่มี',
        signatureAlt: 'ลายเซ็น'
      }
    },
    pdfTemplate () {
      const keyOrLabel = this.form && (this.form.fundingTypeKey || this.form.fundingTypeLabel)
      return getChairmanChecklistPdfTemplate(keyOrLabel) || getChairmanChecklistPdfTemplate('new-researcher')
    },
    mergedHeaderLines () {
      const lines = Array.isArray(this.pdfTemplate && this.pdfTemplate.headerLines) ? this.pdfTemplate.headerLines : []
      const out = []
      const isHeaderBreakLine = (value) => {
        const text = String(value || '').trim()
        if (!text) return true
        return text.includes('แบบฟอร์ม') ||
          text.includes('Checklist') ||
          text.includes('มหาวิทยาลัย') ||
          text.includes('ชื่อข้อเสนอโครงการวิจัย') ||
          text.includes('ชื่อหัวหน้าโครงการวิจัย')
      }
      lines.forEach((raw) => {
        const line = String(raw || '').trim()
        if (!line) return
        // pdf-parse sometimes breaks Thai tone marks into separate lines (e.g., "ใหม่" => "ใหม" + "่")
        if (/^[\u0E31-\u0E4E]$/.test(line) && out.length) {
          out[out.length - 1] = `${out[out.length - 1]}${line}`
          return
        }
        // Merge early numeric line-breaks like: "ทุน..."/"69" => "ทุน... 69"
        if (out.length && out.length <= 2 && /^[0-9]{2,4}$/.test(line) && !/\b[0-9]{2,4}\b/.test(out[out.length - 1])) {
          out[out.length - 1] = `${out[out.length - 1]} ${line}`.trim()
          return
        }
        // Merge broken funding type title into a single line before the "แบบฟอร์ม..." line.
        // Example (industry-extension): "ทุนต" + "่" + "อยอดสู" + "่" + "ภาคอุตสาหกรรม 69"
        if (out.length && out.length <= 3 && !isHeaderBreakLine(line) && !isHeaderBreakLine(out[0])) {
          const joinWithSpace = /^[0-9]/.test(line) && !/\s$/.test(out[0])
          out[0] = `${out[0]}${joinWithSpace ? ' ' : ''}${line}`.trim()
          return
        }
        out.push(line)
      })
      return out
    },
    titleLines () {
      const lines = this.mergedHeaderLines
      if (!lines.length) return []

      const projectIdx = lines.findIndex((l) => String(l || '').includes('ชื่อข้อเสนอโครงการวิจัย'))
      const end = projectIdx > 0 ? projectIdx : lines.length
      return lines.slice(0, end)
    },
    footerLines () {
      const lines = Array.isArray(this.pdfTemplate && this.pdfTemplate.footerLines) ? this.pdfTemplate.footerLines : []
      return lines
        .map((l) => String(l || ''))
        .filter(Boolean)
    },
    footerTextLines () {
      const lines = this.footerLines
      // Templates end with: signature line, name line, chairman affiliation line, date line.
      const cut = Math.max(0, lines.length - 4)
      return lines.slice(0, cut)
    },
    submittedParts () {
      const src = (this.form && this.form.submittedAt) ? new Date(this.form.submittedAt) : new Date()
      const safe = Number.isFinite(src.getTime()) ? src : new Date()
      const monthsTh = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
      const day = String(safe.getDate())
      const month = monthsTh[safe.getMonth()] || ''
      const year = String(safe.getFullYear() + 543)
      return { day, month, year }
    },
    chairmanAffiliation () {
      const raw = this.form && (this.form.chairmanAffiliation || this.form.projectLeaderAffiliation)
      return String(raw || '').trim()
    },
    effectiveSchool () {
      return String((this.form && this.form.projectLeaderAffiliation) || '').trim()
    },
    resolvedSections () {
      const templateSections = Array.isArray(this.pdfTemplate && this.pdfTemplate.sections) ? this.pdfTemplate.sections : []
      if (!templateSections.length) {
        // fallback: use incoming section structure
        return (this.form && Array.isArray(this.form.sections) ? this.form.sections : []).map((sec) => ({
          label: (sec && sec.sectionLabel) || '',
          rows: (Array.isArray(sec && sec.items) ? sec.items : []).map((it, idx) => ({
            no: idx + 1,
            text: (it && it.label) || '',
            answer: String((it && it.answer) || '').trim().toLowerCase()
          }))
        }))
      }

      const formSections = Array.isArray(this.form && this.form.sections) ? this.form.sections : []
      const norm = (value) => String(value || '')
        .replace(/\s+/g, '')
        .replace(/[0-9.\-():]/g, '')
        .trim()
      const findMatchingFormSection = (templateLabel, fallbackIndex) => {
        const templateNorm = norm(templateLabel)
        if (!templateNorm) return formSections[fallbackIndex] || null
        const hit = formSections.find((sec) => {
          const label = sec && (sec.sectionLabel || sec.label)
          const n = norm(label)
          return n && (templateNorm.includes(n) || n.includes(templateNorm))
        })
        return hit || formSections[fallbackIndex] || null
      }

      const canMapByIndex = formSections.length === templateSections.length && templateSections.every((sec, secIndex) => {
        const rows = Array.isArray(sec && sec.rows) ? sec.rows : []
        const items = Array.isArray(formSections[secIndex] && formSections[secIndex].items) ? formSections[secIndex].items : []
        return items.length >= rows.length
      })

      return templateSections.map((sec, secIndex) => {
        const rows = Array.isArray(sec && sec.rows) ? sec.rows : []
        const matchSection = canMapByIndex
          ? formSections[secIndex]
          : findMatchingFormSection(sec && sec.label, secIndex)
        const matchItems = Array.isArray(matchSection && matchSection.items) ? matchSection.items : []
        const normalizeText = (value) => String(value || '')
          .toLowerCase()
          .replace(/\s+/g, '')
          // remove digits, thai digits, common punctuation
          .replace(/[0-9\u0E50-\u0E59().\-,:;'"“”‘’/]/g, '')
          .trim()

        const answerByLabel = (() => {
          const map = new Map()
          matchItems.forEach((it) => {
            const label = it && (it.label || it.text)
            const key = normalizeText(label)
            const ans = String((it && it.answer) || '').trim().toLowerCase()
            if (!key || (ans !== 'yes' && ans !== 'no')) return
            map.set(key, ans)
          })
          return map
        })()

        const resolveAnswerForRow = (rowNo, rowText) => {
          const idx = Math.max(0, Number(rowNo || 0) - 1)
          const direct = String((matchItems[idx] && matchItems[idx].answer) || '').trim().toLowerCase()
          if (direct === 'yes' || direct === 'no') return direct

          const key = normalizeText(rowText)
          if (!key) return ''
          if (answerByLabel.has(key)) return answerByLabel.get(key)

          // fuzzy contains match
          let best = ''
          let bestLen = 0
          for (const [k, ans] of answerByLabel.entries()) {
            if (!k) continue
            if (key.includes(k) || k.includes(key)) {
              const score = Math.min(k.length, key.length)
              if (score > bestLen) {
                bestLen = score
                best = ans
              }
            }
          }
          return best
        }
        return {
          label: String((sec && sec.label) || '').trim(),
          rows: rows.map((row) => {
            const answer = resolveAnswerForRow(row && row.no, row && row.text)
            return {
              no: row.no,
              text: String(row.text || '').trim(),
              answer
            }
          })
        }
      })
    }
  },
  methods: {
    escapeHtml (value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    },
    buildPrintableHtml (contentHtml, title, styleNodes) {
      const safeTitle = this.escapeHtml(title || 'export')
      return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  ${styleNodes || ''}
  <style>
    @media print {
      /* Keep layout centered regardless of browser margin setting */
      @page { size: A4; margin: 12mm; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
      .chairman-checklist-export__container { width: 100% !important; display: flex !important; justify-content: center !important; }
      .page { width: 100% !important; max-width: 186mm !important; min-height: auto !important; margin: 0 auto !important; padding: 0 !important; }
    }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`
    },
    waitForIframeLoad (iframe) {
      if (!iframe) return Promise.resolve()
      const doc = iframe.contentDocument
      if (doc && doc.readyState === 'complete') return Promise.resolve()
      return new Promise((resolve) => {
        iframe.onload = () => resolve()
        window.setTimeout(resolve, 800)
      })
    },
    waitForImagesInDocument (doc) {
      try {
        if (!doc || !doc.querySelectorAll) return Promise.resolve()
        const images = Array.from(doc.querySelectorAll('img'))
        if (!images.length) return Promise.resolve()
        return Promise.all(images.map((img) => {
          try {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve()
            return new Promise((resolve) => { img.onload = img.onerror = resolve })
          } catch (_) {
            return Promise.resolve()
          }
        }))
      } catch (_) {
        return Promise.resolve()
      }
    },
    async printWithHiddenIframe (printableHtml) {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.setAttribute('aria-hidden', 'true')
      document.body.appendChild(iframe)

      try {
        const frameWindow = iframe.contentWindow
        if (!frameWindow) throw new Error('Print iframe is not ready')

        const frameDocument = frameWindow.document
        frameDocument.open()
        frameDocument.write(printableHtml)
        frameDocument.close()

        await this.waitForIframeLoad(iframe)
        await this.waitForImagesInDocument(frameDocument)
        await new Promise(resolve => window.setTimeout(resolve, 350))

        frameWindow.focus()
        frameWindow.print()
      } finally {
        window.setTimeout(() => {
          try {
            if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe)
          } catch (_) { void _ }
        }, 1200)
      }
    },
    async printWithPopupFallback (printableHtml) {
      const popup = window.open('', '_blank')
      if (!popup) throw new Error('Browser blocked print window')

      popup.document.open()
      popup.document.write(printableHtml)
      popup.document.close()
      popup.focus()
      await this.waitForImagesInDocument(popup.document)
      await new Promise(resolve => window.setTimeout(resolve, 350))
      popup.print()
    },
    exportFileName () {
      const code = String((this.form && this.form.proposalCode) || '').trim()
      const type = String((this.form && this.form.fundingTypeKey) || 'chairman').trim()
      if (code) return `${code}-checklist-69-${type}`
      return `checklist-69-${type}`
    },
    async generatePDF () {
      const element = this.$refs.reportContainer
      if (!element || typeof element.querySelectorAll !== 'function') {
        throw new Error('Export container is not ready')
      }

      element.classList.add('export-mode')
      try {
        await this.$nextTick()

        const images = element.querySelectorAll('img')
        await Promise.all(
          Array.from(images).map(img => {
            if (img.complete) return Promise.resolve()
            return new Promise(resolve => { img.onload = img.onerror = resolve })
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
        element.classList.remove('export-mode')
      }
    }
  }
}
</script>

<style scoped>
.chairman-checklist-export__container {
  color: #000;
  background: #fff;
  font-family: "TH Sarabun New", "Sarabun", Arial, Helvetica, sans-serif;
}

.page {
  width: 210mm;
  min-height: 297mm;
  padding: 12mm 12mm 10mm;
  box-sizing: border-box;
  position: relative;
  margin: 0 auto;
}

.header {
  text-align: center;
  font-size: 14px;
  line-height: 1.25;
  margin-bottom: 6mm;
}

.header-line {
  font-weight: 700;
}

.project-fields {
  font-size: 13px;
  margin-bottom: 4mm;
}

.fill-line {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 1mm 0;
}

.fill-line--two {
  gap: 6px;
}

.fill-label {
  font-weight: 700;
  white-space: nowrap;
}

.fill-label--school {
  margin-left: 8px;
}

.fill-dots {
  flex: 1;
  border-bottom: 1px dotted #000;
  min-height: 5mm;
  position: relative;
}

.fill-dots--leader {
  flex: 1.1;
}

.fill-dots--school {
  flex: 0.8;
}

.fill-text {
  position: absolute;
  left: 50%;
  bottom: 1px;
  transform: translateX(-50%);
  width: calc(100% - 6mm);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checklist-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 1.2;
}

.checklist-table th,
.checklist-table td {
  border: 1px solid #000;
  padding: 1.5mm 1.5mm;
  vertical-align: top;
  white-space: normal;
  overflow: visible;
  word-break: break-word;
}

.checklist-table thead th {
  text-align: center;
  font-weight: 700;
}

.col-no {
  width: 12mm;
  text-align: center;
}

.col-yes,
.col-no2 {
  width: 12mm;
  text-align: center;
}

.col-topic {
  white-space: pre-wrap;
}

.section-row td {
  font-weight: 700;
  background: #f2f2f2;
}

.mark {
  display: inline-block;
  font-weight: 900;
  font-size: 14px;
  line-height: 1;
}

.footer {
  margin-top: 5mm;
  font-size: 12px;
  line-height: 1.25;
}

.footer-line {
  margin: 1mm 0;
}

.footer-signature {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin-top: 14mm;
  margin-bottom: 1mm;
  width: 150mm;
  margin-left: auto;
  margin-right: auto;
}

.footer-signature__label {
  white-space: nowrap;
}

.footer-signature__line {
  flex: 1;
  height: 12mm;
  border-bottom: 1px solid #000;
  position: relative;
  overflow: visible;
}

.footer-signature__img {
  position: absolute;
  left: 50%;
  bottom: 2mm;
  transform: translateX(-50%);
  max-width: 55mm;
  max-height: 16mm;
  object-fit: contain;
  display: block;
}

.footer-name,
.footer-chairman,
.footer-date {
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-name__value {
  min-width: 70mm;
  text-align: center;
  border-bottom: 1px solid #000;
  padding: 0 3mm 1px;
}

.footer-chairman__value {
  min-width: 60mm;
  display: inline-block;
  text-align: center;
  border-bottom: 1px solid #000;
  padding: 0 3mm 1px;
  margin-left: 2mm;
}

.footer-date__value {
  min-width: 18mm;
  display: inline-block;
  text-align: center;
  border-bottom: 1px solid #000;
  padding: 0 2mm 1px;
  margin: 0 2mm;
}

@media print {
  @page { size: A4; margin: 12mm; }
  body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 100%; max-width: 186mm; min-height: auto; padding: 0; margin: 0 auto; }
}
</style>
