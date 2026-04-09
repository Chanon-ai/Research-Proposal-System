import {
  findFundingSubTypeConfig,
  getFundingTypeBudgetLimit,
  getFundingTypeLabel
} from '@/ResearchFormRS/utils/fundingBudgetConfig'

export function parseBudgetNumber(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? Math.max(0, value) : 0
  const normalized = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '').trim()
  if (!normalized) return 0
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

export function resolveSnapshotBudgetTotal(snapshot) {
  const budget = snapshot && typeof snapshot === 'object' && snapshot.budget && typeof snapshot.budget === 'object'
    ? snapshot.budget
    : null
  if (!budget) return null

  if (Object.prototype.hasOwnProperty.call(budget, 'grandTotal')) {
    return parseBudgetNumber(budget.grandTotal)
  }

  const categories = Array.isArray(budget.categories) ? budget.categories : []
  return parseBudgetNumber(categories.reduce((sum, category) => {
    const items = Array.isArray(category && category.items) ? category.items : []
    return sum + items.reduce((itemSum, row) => itemSum + parseBudgetNumber(row && row.total), 0)
  }, 0))
}

export function resolveBudgetTotal(item) {
  const source = item && typeof item === 'object' ? item : {}
  if (Object.prototype.hasOwnProperty.call(source, 'budgetTotal')) {
    const direct = parseBudgetNumber(source.budgetTotal)
    if (direct > 0) return direct
  }
  const snapshotTotal = resolveSnapshotBudgetTotal(source.formSnapshotJson || {})
  return snapshotTotal !== null ? snapshotTotal : 0
}

export function resolveFundingTypeValue(item) {
  const source = item && typeof item === 'object' ? item : {}
  const snapshot = source.formSnapshotJson && typeof source.formSnapshotJson === 'object'
    ? source.formSnapshotJson
    : {}
  return String(source.fundingType || snapshot.fundingType || '').trim()
}

export function resolveFundingSubTypeValue(item) {
  const source = item && typeof item === 'object' ? item : {}
  const snapshot = source.formSnapshotJson && typeof source.formSnapshotJson === 'object'
    ? source.formSnapshotJson
    : {}
  return String(source.fundingSubType || snapshot.fundingSubType || '').trim()
}

export function getFinanceAssignment(item) {
  return item && item.financeAssignment && typeof item.financeAssignment === 'object'
    ? item.financeAssignment
    : {}
}

export function getAssignedFinanceOfficerIds(item) {
  const assignment = getFinanceAssignment(item)
  return Array.isArray(assignment.assignedFinanceOfficerIds)
    ? assignment.assignedFinanceOfficerIds.map(String)
    : []
}

export function hasFinanceOfficerProposalAccess(item, userId) {
  const normalizedUserId = String(userId || '').trim()
  if (!normalizedUserId) return false
  const assignment = getFinanceAssignment(item)
  if (getAssignedFinanceOfficerIds(item).includes(normalizedUserId)) return true
  return String(assignment.submittedBy || '').trim() === normalizedUserId
}

export function getFundingDisplay(item, fundingBudgetConfig = []) {
  const fundingType = resolveFundingTypeValue(item)
  if (!fundingType) return '-'

  const fundingTypeLabel = getFundingTypeLabel(fundingBudgetConfig, fundingType, fundingType)
  const fundingSubType = resolveFundingSubTypeValue(item)
  if (!fundingSubType) return fundingTypeLabel

  const subType = findFundingSubTypeConfig(fundingBudgetConfig, fundingType, fundingSubType)
  const subTypeLabel = String(subType && subType.label ? subType.label : fundingSubType).trim()
  return `${fundingTypeLabel} / ${subTypeLabel}`
}

export function getBudgetLimit(item, fundingBudgetConfig = []) {
  return getFundingTypeBudgetLimit(fundingBudgetConfig, resolveFundingTypeValue(item))
}

export function getBudgetRemaining(item, fundingBudgetConfig = []) {
  return Math.max(0, getBudgetLimit(item, fundingBudgetConfig) - resolveBudgetTotal(item))
}

export function getApplicantName(item) {
  const applicant = item && item.applicantUserId && typeof item.applicantUserId === 'object'
    ? item.applicantUserId
    : null
  const snapshot = item && item.formSnapshotJson && typeof item.formSnapshotJson === 'object'
    ? item.formSnapshotJson
    : {}
  const team = snapshot && snapshot.researchTeam && typeof snapshot.researchTeam === 'object'
    ? snapshot.researchTeam
    : {}
  const leader = team.projectLeader && typeof team.projectLeader === 'object'
    ? team.projectLeader
    : {}
  return applicant && applicant.fullName
    ? String(applicant.fullName)
    : (item && item.projectLeaderName ? String(item.projectLeaderName) : (leader.name ? String(leader.name) : '-'))
}

export function getDepartmentText(item) {
  const applicant = item && item.applicantUserId && typeof item.applicantUserId === 'object'
    ? item.applicantUserId
    : null
  if (applicant && applicant.department) return String(applicant.department)

  const snapshot = item && item.formSnapshotJson && typeof item.formSnapshotJson === 'object'
    ? item.formSnapshotJson
    : {}
  const team = snapshot && snapshot.researchTeam && typeof snapshot.researchTeam === 'object'
    ? snapshot.researchTeam
    : {}
  const leader = team.projectLeader && typeof team.projectLeader === 'object'
    ? team.projectLeader
    : {}
  return String(leader.affiliation || snapshot.department || snapshot.departmentName || '').trim() || '-'
}

export function getLatestProposalActivity(item) {
  return item && (item.lastStatusActionAt || item.currentStatusUpdatedAt || item.statusUpdatedAt || item.updatedAt || item.createdAt || null)
}

export function getFinanceAssignmentStatusKey(item) {
  const assignment = getFinanceAssignment(item)
  const status = String(assignment.status || '').trim().toLowerCase()
  if (status === 'submitted') return 'submitted'
  if (status === 'revision_requested') return 'revision_requested'
  if (status === 'pending') return 'pending'
  return 'idle'
}

export function getFinanceAssignmentStatusLabel(item, translate = null) {
  const statusKey = getFinanceAssignmentStatusKey(item)
  if (typeof translate === 'function') {
    return translate(`finance.status.${statusKey}`)
  }

  const fallbackMap = {
    idle: 'Not started',
    pending: 'Pending review note',
    revision_requested: 'Revision requested',
    submitted: 'Review submitted'
  }
  return fallbackMap[statusKey] || fallbackMap.idle
}
