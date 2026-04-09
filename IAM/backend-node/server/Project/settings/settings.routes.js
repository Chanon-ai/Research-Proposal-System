const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, requireRole } = require('../../../middleware/authMiddleware');
const account = require('../accounts/service/account');

const message = require("./service/message");
const status = require("./service/status");
const group = require("./service/group");
const verification = require("./service/verification");
const authMessage = require("./service/auth_message");
const systemSetting = require('./controller/system-setting');
const settingFile = require('./controller/setting-file');

const uploadMemory = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 }
});

router.get("/message", account.onCheckAuthorization, message.onQuerys);
router.post("/message", account.onCheckAuthorization, message.onCreate);
router.put("/message", account.onCheckAuthorization, message.onUpdate);
router.delete("/message", account.onCheckAuthorization, message.onDelete);

router.get("/status", account.onCheckAuthorization, status.onQuerys);
router.post("/status", account.onCheckAuthorization, status.onCreate);
router.put("/status", account.onCheckAuthorization, status.onUpdate);
router.delete("/status", account.onCheckAuthorization, status.onDelete);

router.get("/groups", account.onCheckAuthorization, group.onQuerys);
router.post("/groups", account.onCheckAuthorization, group.onCreate);
router.put("/groups", account.onCheckAuthorization, group.onUpdate);
router.delete("/groups", account.onCheckAuthorization, group.onDelete);

router.get("/verification", account.onCheckAuthorization, verification.onQuerys);
router.post("/verification/explorers", account.onCheckAuthorization, verification.onCreate);
router.post("/verification", account.onCheckAuthorization, verification.onCreate);
router.put("/verification", account.onCheckAuthorization, verification.onUpdate);
router.delete("/verification", account.onCheckAuthorization, verification.onDelete);

router.get("/", authenticate, systemSetting.list);
router.post("/", authenticate, requireRole('admin', 'chairman'), systemSetting.create);
router.put("/bulk", authenticate, requireRole('admin', 'chairman'), systemSetting.bulkUpdate);
router.get("/workflow-policy", authenticate, systemSetting.workflowPolicy);
router.get("/email-logs", authenticate, requireRole('admin', 'chairman'), systemSetting.listEmailLogs);
router.post("/test-email", authenticate, requireRole('admin', 'chairman'), systemSetting.testEmail);
router.post("/clear-cache", authenticate, requireRole('admin', 'chairman'), systemSetting.clearCache);
router.post('/template-import/preview', authenticate, requireRole('admin', 'chairman'), uploadMemory.single('file'), systemSetting.previewTemplateImport);
router.post('/template-import/apply', authenticate, requireRole('admin', 'chairman'), systemSetting.applyTemplateImport);
router.post('/files/budget-attachment-example', authenticate, requireRole('admin', 'chairman'), uploadMemory.single('file'), settingFile.uploadBudgetAttachmentExampleFile);
router.get('/files/:fileId', authenticate, settingFile.downloadFile);
router.delete('/files/:fileId', authenticate, requireRole('admin', 'chairman'), settingFile.deleteFile);
router.put("/:id", authenticate, requireRole('admin', 'chairman'), systemSetting.update);
router.delete("/:id", authenticate, requireRole('admin', 'chairman'), systemSetting.remove);

router.get("/auth/message", account.onCheckAuthorization, authMessage.onQuerys);
router.post("/auth/message", account.onCheckAuthorization, authMessage.onCreate);
router.put("/auth/message", account.onCheckAuthorization, authMessage.onUpdate);
router.delete("/auth/message", account.onCheckAuthorization, authMessage.onDelete);

module.exports = router;
