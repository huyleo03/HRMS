const mongoose = require("mongoose");

/**
 * Extract ObjectId from populated or unpopulated field
 */
const getObjectId = (field) => {
  if (!field) return null;
  // If populated, field is an object with _id
  if (typeof field === 'object' && field._id) {
    return field._id.toString();
  }
  // If not populated, field is already ObjectId
  return field.toString();
};

/**
 * Convert userId string to ObjectId
 */
const toObjectId = (userId) => {
  return mongoose.Types.ObjectId.isValid(userId) 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;
};

/**
 * Kiểm tra xem đơn có "đến lượt" user này duyệt chưa
 * Logic: Tất cả approvers ở level thấp hơn phải đã approve
 */
const isUserTurn = (request, userId) => {
  const currentApprover = request.approvalFlow.find(
    (a) => getObjectId(a.approverId) === userId.toString()
  );
  
  if (!currentApprover) {
    return false; // User không trong approval flow
  }
  
  if (currentApprover.status !== "Pending") {
    return false; // User đã xử lý rồi
  }
  
  const currentLevel = currentApprover.level;
  
  // Kiểm tra tất cả approvers ở level thấp hơn
  const lowerLevelApprovers = request.approvalFlow.filter(
    (a) => a.level < currentLevel && a.role === "Approver"
  );
  
  // Nếu không có ai ở level thấp hơn → Đã đến lượt
  if (lowerLevelApprovers.length === 0) {
    return true;
  }
  
  // Kiểm tra tất cả approvers ở level thấp hơn đã approve chưa
  const allLowerLevelsApproved = lowerLevelApprovers.every(
    (a) => a.status === "Approved"
  );
  
  return allLowerLevelsApproved;
};

module.exports = {
  getObjectId,
  toObjectId,
  isUserTurn
};
