const settingsRoutes = require("../Project/settings/settings.routes");
const accountRoutes = require("../Project/accounts/accounts.routes");
const securityRoutes = require("../Project/security/security.routes");
const organizationRoutes = require("../Project/Organization/organization.routes");
const proposalRoutes = require("../Project/Proposal/routes/proposal.route");
const authRoutes = require("../Project/Auth/routes/auth.route");
const userRoutes = require("../Project/Auth/routes/user.route");
const notificationRoutes = require("../Project/Proposal/routes/notification.route");
const documentRoutes = require("../Project/Proposal/routes/document.route");
const meetingRoutes = require("../Project/Proposal/routes/meeting.route");
const reportRoutes = require("../Project/Proposal/routes/report.route");
module.exports = function (app) {

  var path = "/api/v1";
  // app.use(path, googleRoutes.onDistance )

  app.use(path + '/organization', organizationRoutes);
  app.use(path + '/setting', settingsRoutes);
  app.use(path + '/security', securityRoutes);
  app.use(path , accountRoutes);
  app.use(path + '/auth', authRoutes);
  app.use(path + '/users', userRoutes);
  app.use(path + '/admin/users', userRoutes);
  app.use(path + '/proposals', proposalRoutes);
  app.use(path + '/documents', documentRoutes);
  app.use(path + '/meetings', meetingRoutes);
  app.use(path + '/reports', reportRoutes);
  app.use(path + '/notifications', notificationRoutes);

};
