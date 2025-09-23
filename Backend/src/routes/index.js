// routes/index.js
const departmentRoutes = require("./departmentRoutes");

const routes = (app) => {
  app.use("/api/departments", departmentRoutes);
};

module.exports = routes;
