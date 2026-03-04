const sttingsRoutes = require("../Project/settings/settings.routes");
const accountRoutes = require("../Project/accounts/accounts.routes");
const securityRoutes = require("../Project/security/security.routes");
module.exports = function (app) {

  var path = "/api/v1";
  // app.use(path, googleRoutes.onDistance )

  app.use(path + '/setting', sttingsRoutes);
  app.use(path + '/security', securityRoutes);
  app.use(path , accountRoutes);

};
