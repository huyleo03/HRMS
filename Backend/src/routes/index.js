// routes/index.js
const departmentRoutes = require("./departmentRoutes");
const userRoutes = require("./userRoutes");

const routes = (app) => {
  app.use("/api/departments", departmentRoutes);
  app.use("/api/users", userRoutes);
};

module.exports = routes;
