// routes/index.js
const departmentRoutes = require("./departmentRoutes");
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const routes = (app) => {
  app.use("/api/departments", departmentRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/auth", authRoutes);
};

module.exports = routes;
