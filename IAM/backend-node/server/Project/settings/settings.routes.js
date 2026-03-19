const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../../middleware/authMiddleware');

const message = require("./service/message");
const status = require("./service/status");
const group = require("./service/group");
const verification = require("./service/verification");
const authMessage = require("./service/auth_message");
const systemSetting = require('./controller/system-setting');

router.get("/message", message.onQuerys);
router.post("/message", message.onCreate);
router.put("/message", message.onUpdate);
router.delete("/message", message.onDelete);

router.get("/status", status.onQuerys);
router.post("/status", status.onCreate);
router.put("/status", status.onUpdate);
router.delete("/status", status.onDelete);

router.get("/groups", group.onQuerys);
router.post("/groups", group.onCreate);
router.put("/groups", group.onUpdate);
router.delete("/groups", group.onDelete);

router.get("/verification", verification.onQuerys);
router.post("/verification/explorers", verification.onCreate);
router.post("/verification", verification.onCreate);
router.put("/verification", verification.onUpdate);
router.delete("/verification", verification.onDelete);

router.get("/", authenticate, requireRole('admin', 'chairman'), systemSetting.list);
router.post("/", authenticate, requireRole('admin', 'chairman'), systemSetting.create);
router.get("/email-logs", authenticate, requireRole('admin', 'chairman'), systemSetting.listEmailLogs);
router.post("/test-email", authenticate, requireRole('admin', 'chairman'), systemSetting.testEmail);
router.post("/clear-cache", authenticate, requireRole('admin', 'chairman'), systemSetting.clearCache);
router.put("/:id", authenticate, requireRole('admin', 'chairman'), systemSetting.update);
router.delete("/:id", authenticate, requireRole('admin', 'chairman'), systemSetting.remove);

router.get("/auth/message", authMessage.onQuerys);
router.post("/auth/message", authMessage.onCreate);
router.put("/auth/message", authMessage.onUpdate);
router.delete("/auth/message", authMessage.onDelete);

module.exports = router;
