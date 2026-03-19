const express = require('express');
const router = express.Router();

const organization = require("./service/organization");
// const factory = require("./service/factory"); // temporarily disabled - module absent
// const department = require("./service/department"); // temporarily disabled - module absent


router.get("", organization.onQuerys);
router.post("/explorers", organization.onQuerys);
router.post("", organization.onCreate);
router.put( "", organization.onUpdate);
router.delete( "", organization.onDelete);


// factory routes commented out until service/factory exists
// router.get("/factory", factory.onQuerys);
// router.post("/explorers", factory.onQuerys);
// router.post("/factory", factory.onCreate);
// router.put( "/factory", factory.onUpdate);
// router.delete( "/factory", factory.onDelete);


// department routes commented out until service/department exists
// router.get("/department", department.onQuerys);
// router.post("/explorers", department.onQuerys);
// router.post("/department", department.onCreate);
// router.put( "/department", department.onUpdate);
// router.delete( "/department", department.onDelete);

module.exports = router;

