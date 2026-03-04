const express = require('express');
const router = express.Router();

const message = require("./service/message");
const status = require("./service/status");
const group = require("./service/group");
const verification = require("./service/verification");
const authMessage = require("./service/auth_message");

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

router.get("/auth/message", authMessage.onQuerys);
router.post("/auth/message", authMessage.onCreate);
router.put("/auth/message", authMessage.onUpdate);
router.delete("/auth/message", authMessage.onDelete);

module.exports = router;
