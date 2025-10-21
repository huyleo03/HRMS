// routes/index.js
const departmentRoutes = require("./departmentRoutes");
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const healthRoutes = require("./healthRoutes");
const requestRoutes = require("./requestRoutes");
const workFlowRoutes = require("./workFlowRoutes");
const attendanceRoutes = require("./attendanceRoutes");
const notificationRoutes = require("./notificationRoutes");

const routes = (app) => {
  app.use("/api/departments", departmentRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api", healthRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/workflows", workFlowRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/notifications", notificationRoutes);
};

module.exports = routes;
