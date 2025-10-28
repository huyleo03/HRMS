/**
 * Workflow Constants
 * Contains all constants used in Workflow module
 */

// Request Types - Map with Vietnamese labels and icons
export const  REQUEST_TYPES = [
  { 
    value: 'Leave', 
    label: 'Đơn xin nghỉ phép', 
    icon: '🏖️',
    description: 'Đơn xin nghỉ phép, nghỉ ốm, nghỉ việc riêng'
  },
  { 
    value: 'Overtime', 
    label: 'Đơn làm thêm giờ', 
    icon: '⏰',
    description: 'Đăng ký làm thêm giờ, làm ngoài giờ'
  },
  { 
    value: 'RemoteWork', 
    label: 'Đơn làm việc từ xa', 
    icon: '🏠',
    description: 'Đăng ký làm việc từ xa, work from home'
  },
  { 
    value: 'Resignation', 
    label: 'Đơn xin thôi việc', 
    icon: '👋',
    description: 'Đơn xin nghỉ việc, thôi việc'
  },
  { 
    value: 'BusinessTrip', 
    label: 'Đơn công tác', 
    icon: '✈️',
    description: 'Đăng ký đi công tác, đi công việc'
  },
  { 
    value: 'Equipment', 
    label: 'Đơn yêu cầu thiết bị', 
    icon: '💻',
    description: 'Yêu cầu cấp phát thiết bị làm việc'
  },
  { 
    value: 'ITSupport', 
    label: 'Đơn hỗ trợ IT', 
    icon: '🔧',
    description: 'Yêu cầu hỗ trợ kỹ thuật, IT'
  },
  { 
    value: 'HRDocument', 
    label: 'Đơn yêu cầu tài liệu HR', 
    icon: '📄',
    description: 'Yêu cầu giấy tờ, tài liệu nhân sự'
  },
  { 
    value: 'Expense', 
    label: 'Đơn chi phí', 
    icon: '💰',
    description: 'Đơn hoàn ứng chi phí, thanh toán'
  },
  { 
    value: 'Other', 
    label: 'Đơn khác', 
    icon: '📋',
    description: 'Các loại đơn khác'
  },
];

// Approver Types - Three main types as per business rules
export const APPROVER_TYPES = [
  {
    value: 'DIRECT_MANAGER',
    label: 'Người quản lý trực tiếp',
    description: 'Tự động gán cho manager của người gửi đơn (Employee → Manager, Manager → Admin)',
    icon: '👤',
    needsConfig: false,
    configFields: [],
    businessRule: 'Nếu Employee gửi → Manager duyệt. Nếu Manager gửi → Admin duyệt.',
  },
  {
    value: 'SPECIFIC_DEPARTMENT_HEAD',
    label: 'Trưởng phòng cụ thể',
    description: 'Chỉ định trưởng phòng của một phòng ban cụ thể (ví dụ: Trưởng phòng Kế toán)',
    icon: '🏢',
    needsConfig: true,
    configFields: ['departmentId'],
    businessRule: 'Dùng department.managerId để lấy người duyệt',
  },
  {
    value: 'SPECIFIC_USER',
    label: 'Người dùng cụ thể',
    description: 'Chỉ định một người dùng cụ thể (ví dụ: CEO, Giám đốc)',
    icon: '⭐',
    needsConfig: true,
    configFields: ['approverId'],
    businessRule: 'Hard-coded approver ID, không thay đổi theo người gửi',
  },
];

// Workflow Status Colors (for Tag component)
export const WORKFLOW_STATUS_COLORS = {
  active: 'green',
  inactive: 'red',
};

// Workflow Status Labels
export const WORKFLOW_STATUS_LABELS = {
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
};

// Approval Step Validation Rules
export const APPROVAL_STEP_RULES = {
  minSteps: 1,
  maxSteps: 10,
  minLevel: 1,
};

// Helper Functions
export const getRequestTypeLabel = (value) => {
  const found = REQUEST_TYPES.find(t => t.value === value);
  return found ? found.label : value;
};

export const getRequestTypeIcon = (value) => {
  const found = REQUEST_TYPES.find(t => t.value === value);
  return found ? found.icon : '📋';
};

export const getRequestTypeDisplay = (value) => {
  const found = REQUEST_TYPES.find(t => t.value === value);
  return found ? `${found.icon} ${found.label}` : value;
};

export const getApproverTypeLabel = (value) => {
  const found = APPROVER_TYPES.find(t => t.value === value);
  return found ? found.label : value;
};

export const getApproverTypeIcon = (value) => {
  const found = APPROVER_TYPES.find(t => t.value === value);
  return found ? found.icon : '👤';
};

export const getApproverTypeDisplay = (value) => {
  const found = APPROVER_TYPES.find(t => t.value === value);
  return found ? `${found.icon} ${found.label}` : value;
};

export const getApproverTypeConfig = (value) => {
  return APPROVER_TYPES.find(t => t.value === value);
};

/**
 * Validate if approver type needs configuration
 * @param {string} approverType - Approver type value
 * @returns {boolean} True if needs config fields
 */
export const needsConfiguration = (approverType) => {
  const config = APPROVER_TYPES.find(t => t.value === approverType);
  return config?.needsConfig || false;
};

/**
 * Get required config fields for approver type
 * @param {string} approverType - Approver type value
 * @returns {Array} Array of required field names
 */
export const getRequiredConfigFields = (approverType) => {
  const config = APPROVER_TYPES.find(t => t.value === approverType);
  return config?.configFields || [];
};

/**
 * Validate approval step completeness
 * @param {Object} step - Approval step object
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateApprovalStep = (step) => {
  const errors = [];

  if (!step.level || step.level < APPROVAL_STEP_RULES.minLevel) {
    errors.push('Level không hợp lệ');
  }

  if (!step.approverType) {
    errors.push('Chưa chọn loại người duyệt');
  }

  if (!step.displayName || step.displayName.trim() === '') {
    errors.push('Chưa nhập tên hiển thị');
  }

  // Check config fields
  if (step.approverType === 'SPECIFIC_DEPARTMENT_HEAD' && !step.departmentId) {
    errors.push('Chưa chọn phòng ban');
  }

  if (step.approverType === 'SPECIFIC_USER' && !step.approverId) {
    errors.push('Chưa chọn người duyệt');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate entire approval flow
 * @param {Array} approvalFlow - Array of approval steps
 * @returns {Object} { isValid: boolean, errors: Array }
 */
export const validateApprovalFlow = (approvalFlow) => {
  const errors = [];

  if (!approvalFlow || approvalFlow.length === 0) {
    errors.push('Luồng phê duyệt phải có ít nhất 1 bước');
    return { isValid: false, errors };
  }

  if (approvalFlow.length > APPROVAL_STEP_RULES.maxSteps) {
    errors.push(`Luồng phê duyệt không được vượt quá ${APPROVAL_STEP_RULES.maxSteps} bước`);
  }

  // Check each step
  approvalFlow.forEach((step, index) => {
    const stepValidation = validateApprovalStep(step);
    if (!stepValidation.isValid) {
      errors.push(`Bước ${index + 1}: ${stepValidation.errors.join(', ')}`);
    }
  });

  // Check level uniqueness and sequence
  const levels = approvalFlow.map(s => s.level);
  const uniqueLevels = new Set(levels);
  if (uniqueLevels.size !== levels.length) {
    errors.push('Các bước phải có level duy nhất');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
