// proposal.route.js
// Express router for proposal endpoints

const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../controllers/proposal.controller');
const { authenticate, requireRole } = require('../../../../middleware/authMiddleware');

// Store uploaded binaries in MongoDB GridFS (proposal_form_files bucket)
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file (adjust if needed)
});

router.get('/', authenticate, controller.list);
router.post('/', authenticate, controller.create);
router.get('/admin/dashboard-summary', authenticate, requireRole('admin', 'chairman'), controller.dashboardSummary);
router.get('/researcher-users', authenticate, controller.listResearcherUsers);
router.get('/committee-users', authenticate, requireRole('admin', 'chairman'), controller.listCommitteeUsers);
router.get('/reviews/me', authenticate, requireRole('committee', 'chairman', 'admin'), controller.myReviews);
router.get('/reviews/by-proposal/:id', authenticate, requireRole('admin', 'chairman', 'researcher', 'committee'), controller.listProposalReviews);
router.get('/:id/reviews/me', authenticate, requireRole('committee', 'chairman', 'admin'), controller.myReview);
router.get('/:id/reviews', authenticate, requireRole('admin', 'chairman', 'researcher', 'committee'), controller.listProposalReviews);
router.post('/:id/reviews/:reviewId/accept', authenticate, requireRole('admin'), controller.acceptProposalReview);
router.post('/:id/reviews/:reviewId/reject', authenticate, requireRole('admin'), controller.rejectProposalReview);
router.get('/:id/feedback', authenticate, controller.proposalFeedback);
router.get('/collaboration-consent/view', controller.renderCollaborationConsentPage);
router.post('/collaboration-consent/respond', controller.respondCollaborationConsent);
router.get('/:id', authenticate, controller.detail);
router.patch('/:id', authenticate, controller.updateDraft);
router.delete('/:id', authenticate, controller.deleteDraft);
router.get('/:id/collaboration-confirmations', authenticate, controller.listCollaborationConfirmations);
router.get('/:id/form-files', authenticate, controller.listFormFiles);
router.post('/:id/form-files', authenticate, uploadMemory.single('file'), controller.uploadFormFile);
router.get('/:id/form-files/:fileId', authenticate, controller.downloadFormFile);
router.delete('/:id/form-files/:fileId', authenticate, controller.deleteFormFile);
router.post('/:id/submit', authenticate, controller.submit);
router.post('/:id/resubmit', authenticate, controller.resubmit);
router.patch('/:id/status', authenticate, requireRole('admin', 'chairman'), controller.changeStatus);
router.post('/:id/assign-committee', authenticate, requireRole('admin', 'chairman'), controller.assignCommittee);
router.post('/:id/assign-chairman', authenticate, requireRole('admin', 'chairman'), controller.assignChairman);
router.post('/:id/assign-finance-officer', authenticate, requireRole('admin'), controller.assignFinanceOfficer);
router.post('/:id/reviews', authenticate, requireRole('committee', 'chairman', 'admin'), controller.saveReview);
router.post('/:id/finance-review', authenticate, requireRole('finance_officer'), controller.saveFinanceReview);

module.exports = router;
