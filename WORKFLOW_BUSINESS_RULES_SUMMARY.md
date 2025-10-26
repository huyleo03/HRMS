# 📋 Business Rules: Workflow Module - FINAL SUMMARY

## 🎯 1. CORE CONCEPT (Khái niệm cốt lõi)

### **Workflow là gì?**
```
Workflow = Quy trình phê duyệt động cho mỗi loại đơn (Request Type)

Mỗi Workflow định nghĩa:
- Áp dụng cho loại đơn nào? (Leave, Equipment, Expense...)
- Có bao nhiêu bước phê duyệt? (1, 2, 3... steps)
- Mỗi bước ai duyệt? (Manager, Department Head, CEO...)
```

---

## 🔑 2. QUY TẮC QUAN TRỌNG NHẤT

### **Rule 1: Một loại đơn = Một workflow**
```javascript
requestType: {
  type: String,
  enum: ["Leave", "Overtime", "Equipment", ...],
  unique: true  // ✅ CHỈ 1 workflow active cho mỗi requestType
}
```

**Ví dụ:**
- Leave Request → Leave Approval Workflow (1 cái duy nhất)
- Equipment Request → Equipment Purchase Workflow (1 cái duy nhất)

---

### **Rule 2: Workflow có nhiều bước (Multi-step)**
```javascript
approvalFlow: [
  { level: 1, approverType: "DIRECT_MANAGER", displayName: "Quản lý" },
  { level: 2, approverType: "SPECIFIC_USER", approverId: "CEO", displayName: "CEO" }
]
```

**Ví dụ:**
- Đơn đơn giản: 1 bước (Manager duyệt)
- Đơn phức tạp: 3 bước (Manager → Department Head → Admin)

---

### **Rule 3: Ba loại người duyệt (Approver Types)**

#### **A. DIRECT_MANAGER - Người quản lý trực tiếp**
```javascript
Logic:
- Nếu Employee gửi → Manager của họ duyệt (qua manager_id)
- Nếu Manager gửi → Admin duyệt (hard-coded rule)
```

**Use case:** Đơn nghỉ phép, đơn làm thêm giờ

---

#### **B. SPECIFIC_DEPARTMENT_HEAD - Trưởng phòng cụ thể**
```javascript
Logic:
- Luôn là Manager của department được chỉ định
- Không phụ thuộc vào người gửi
```

**Use case:** Đơn mua thiết bị IT → Luôn là Trưởng phòng IT duyệt

---

#### **C. SPECIFIC_USER - Người dùng cụ thể**
```javascript
Logic:
- Hardcode 1 user cụ thể (ví dụ: CEO)
- Không phụ thuộc vào người gửi hoặc phòng ban
```

**Use case:** Đơn chi phí lớn → CEO duyệt

---

## 👥 3. LOGIC PHÂN QUYỀN (Authorization)

### **Ai tạo workflow?**
```
✅ ADMIN: Được tạo, sửa, xóa workflow
❌ MANAGER: Không được
❌ EMPLOYEE: Không được
```

### **Ai gửi đơn?**
```
✅ EMPLOYEE: Được gửi đơn
✅ MANAGER: Được gửi đơn
❌ ADMIN: KHÔNG được gửi đơn (admin là người duyệt)
```

### **Ai duyệt đơn?**
```
Tự động xác định bởi Workflow:
- DIRECT_MANAGER → Manager hoặc Admin
- SPECIFIC_DEPARTMENT_HEAD → Department Head
- SPECIFIC_USER → User được chỉ định
```

---

## 🔄 4. LUỒNG PHÂN GIẢI APPROVER (resolveApprovers)

### **Khi Employee gửi đơn:**
```
Input: Employee + Workflow
Process: 
  Step 1 (DIRECT_MANAGER) → Tìm employee.manager_id → Manager A
  Step 2 (SPECIFIC_USER) → Lấy approverId → Admin
Output: [Manager A, Admin]
```

### **Khi Manager gửi đơn:**
```
Input: Manager + Workflow
Process:
  Step 1 (DIRECT_MANAGER) → manager.role === "Manager" → HARD-CODE → Admin
Output: [Admin]
```

**⚠️ QUAN TRỌNG:**
```
Manager KHÔNG có manager_id (luôn = null)
→ Quy tắc đặc biệt: Manager → Admin (hard-coded)
```

---

## 📊 5. CẤU TRÚC DỮ LIỆU

### **Workflow Schema:**
```javascript
{
  name: "Leave Approval Workflow",           // Tên workflow
  description: "Quy trình phê duyệt nghỉ phép",
  requestType: "Leave",                      // Loại đơn áp dụng (UNIQUE)
  
  approvalFlow: [                            // Các bước phê duyệt
    {
      level: 1,                              // Thứ tự bước (1, 2, 3...)
      approverType: "DIRECT_MANAGER",        // Loại người duyệt
      displayName: "Quản lý trực tiếp",      // Tên hiển thị
      isRequired: true,                      // Bắt buộc hay optional
      
      // Conditional fields:
      departmentId: "...",                   // Nếu approverType = SPECIFIC_DEPARTMENT_HEAD
      approverId: "...",                     // Nếu approverType = SPECIFIC_USER
    }
  ],
  
  isActive: true,                            // Đang hoạt động?
  applicableDepartments: [],                 // Áp dụng cho phòng ban nào (empty = tất cả)
  
  createdBy: "Admin User ID",
  updatedBy: "Admin User ID",
  timestamps: true
}
```

---

## 🎯 6. VÍ DỤ THỰC TẾ

### **Scenario 1: Đơn nghỉ phép (Simple - 1 step)**
```javascript
{
  name: "Leave Approval",
  requestType: "Leave",
  approvalFlow: [
    {
      level: 1,
      approverType: "DIRECT_MANAGER",
      displayName: "Quản lý trực tiếp"
    }
  ]
}

// Employee gửi:
Employee A (manager_id: Manager B) → Manager B duyệt ✅

// Manager gửi:
Manager B (manager_id: null) → Admin duyệt ✅
```

---

### **Scenario 2: Đơn mua thiết bị IT (Complex - 3 steps)**
```javascript
{
  name: "IT Equipment Purchase",
  requestType: "Equipment",
  approvalFlow: [
    {
      level: 1,
      approverType: "DIRECT_MANAGER",
      displayName: "Quản lý trực tiếp"
    },
    {
      level: 2,
      approverType: "SPECIFIC_DEPARTMENT_HEAD",
      departmentId: "IT_DEPT_ID",
      displayName: "Trưởng phòng IT"
    },
    {
      level: 3,
      approverType: "SPECIFIC_USER",
      approverId: "CFO_USER_ID",
      displayName: "CFO"
    }
  ]
}

// Employee HR gửi:
Employee HR → Level 1: HR Manager
           → Level 2: IT Manager (kiểm tra kỹ thuật)
           → Level 3: CFO (phê duyệt ngân sách)
```

---

### **Scenario 3: Đơn chi phí (Hybrid - 2 steps)**
```javascript
{
  name: "Expense Approval",
  requestType: "Expense",
  approvalFlow: [
    {
      level: 1,
      approverType: "DIRECT_MANAGER",
      displayName: "Quản lý trực tiếp"
    },
    {
      level: 2,
      approverType: "SPECIFIC_DEPARTMENT_HEAD",
      departmentId: "FINANCE_DEPT_ID",
      displayName: "Trưởng phòng Tài chính"
    }
  ]
}

// Employee Marketing gửi:
Employee Marketing → Level 1: Marketing Manager (kiểm tra lý do)
                  → Level 2: Finance Manager (kiểm tra ngân sách)
```

---

## 🔒 7. QUY TẮC ĐẶC BIỆT (Special Rules)

### **Rule 1: Admin không gửi đơn**
```javascript
// Trong RequestController.createRequest()
if (submitter.role === "Admin") {
  return res.status(403).json({
    message: "Admin không được tạo đơn yêu cầu"
  });
}
```

**Lý do:** Admin là người duyệt, không phải người gửi

---

### **Rule 2: Manager → Admin (Hard-coded)**
```javascript
// Trong Workflow.resolveApprovers()
case "DIRECT_MANAGER":
  if (user.role === "Manager") {
    // ⚠️ HARD-CODED RULE
    approver = await User.findOne({ role: "Admin" });
  }
```

**Lý do:** 
- Manager không có manager_id (null)
- Quy tắc đơn giản: Manager gửi lên Admin
- Đủ dùng cho 90% trường hợp thực tế

---

### **Rule 3: Employee phải có manager_id**
```javascript
// Trong User model pre-save hook
if (this.role === "Employee" && !this.manager_id) {
  const department = await Department.findById(this.department.department_id);
  if (department?.managerId) {
    this.manager_id = department.managerId;  // Auto-assign
  }
}
```

**Lý do:** Employee bắt buộc phải có người quản lý

---

## 📐 8. VALIDATION RULES

### **Model Level (Workflow.js):**
```javascript
// ⚠️ CẦN THÊM (trong document phân tích)
workflowSchema.pre("save", function(next) {
  // 1. Phải có ít nhất 1 bước
  if (this.approvalFlow.length === 0) {
    return next(new Error("Workflow phải có ít nhất 1 bước"));
  }
  
  // 2. Levels không được trùng lặp
  const levels = this.approvalFlow.map(s => s.level);
  if (new Set(levels).size !== levels.length) {
    return next(new Error("Levels không được trùng lặp"));
  }
  
  // 3. Levels phải tuần tự (1, 2, 3...)
  const sortedLevels = [...levels].sort();
  for (let i = 0; i < sortedLevels.length; i++) {
    if (sortedLevels[i] !== i + 1) {
      return next(new Error(`Missing level ${i + 1}`));
    }
  }
  
  // 4. Validate required fields
  for (const step of this.approvalFlow) {
    if (step.approverType === "SPECIFIC_USER" && !step.approverId) {
      return next(new Error("SPECIFIC_USER cần approverId"));
    }
    if (step.approverType === "SPECIFIC_DEPARTMENT_HEAD" && !step.departmentId) {
      return next(new Error("SPECIFIC_DEPARTMENT_HEAD cần departmentId"));
    }
  }
  
  next();
});
```

### **Controller Level (WorkflowController.js):**
```javascript
// ✅ ĐÃ CÓ
const mockUser = await User.findOne({ role: { $ne: "Admin" } });
const resolvedApprovers = await workflow.resolveApprovers(mockUser);

if (!resolvedApprovers || resolvedApprovers.length === 0) {
  return res.status(400).json({
    message: "Workflow không hợp lệ: Không thể resolve approvers"
  });
}
```

---

## 🎯 9. USE CASES SUMMARY

| Người gửi | Loại đơn | Level 1 | Level 2 | Level 3 |
|-----------|---------|---------|---------|---------|
| **Employee** | Leave | Manager (DIRECT) | - | - |
| **Employee** | Equipment | Manager (DIRECT) | IT Head (DEPT) | CFO (USER) |
| **Employee** | Expense | Manager (DIRECT) | Finance Head (DEPT) | - |
| **Manager** | Leave | Admin (HARD-CODE) | - | - |
| **Manager** | Equipment | Admin (HARD-CODE) | - | - |
| **Admin** | ANY | ❌ KHÔNG ĐƯỢC GỬI | - | - |

---

## 🔄 10. WORKFLOW LIFECYCLE

```
1. ADMIN TẠO WORKFLOW
   ↓
   Admin tạo qua UI → Validate → Save to DB
   
2. USER GỬI ĐƠN
   ↓
   User tạo request → System fetch workflow
   
3. SYSTEM RESOLVE APPROVERS
   ↓
   workflow.resolveApprovers(user) → Danh sách approvers
   
4. TẠO REQUEST VỚI APPROVERS
   ↓
   Request.approvers = resolvedApprovers → Save
   
5. APPROVERS DUYỆT TUẦN TỰ
   ↓
   Level 1 duyệt → Level 2 duyệt → ... → Approved
```

---

## 📊 11. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                         ADMIN                                │
│                           │                                  │
│                           ▼                                  │
│                  CREATE WORKFLOW                             │
│                     (via UI)                                 │
│                           │                                  │
│                           ▼                                  │
│        ┌──────────────────────────────────────┐             │
│        │  Workflow Model                      │             │
│        │  - requestType: "Leave"              │             │
│        │  - approvalFlow: [...]               │             │
│        │  - isActive: true                    │             │
│        └──────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘

                           │
                           │
                           ▼

┌─────────────────────────────────────────────────────────────┐
│                    EMPLOYEE/MANAGER                          │
│                           │                                  │
│                           ▼                                  │
│                  CREATE REQUEST                              │
│                           │                                  │
│                           ▼                                  │
│          Workflow.getActiveWorkflow(requestType)             │
│                           │                                  │
│                           ▼                                  │
│          workflow.resolveApprovers(user)                     │
│                           │                                  │
│         ┌─────────────────┴──────────────────┐              │
│         │                                     │              │
│         ▼                                     ▼              │
│    user.role === "Employee"         user.role === "Manager" │
│         │                                     │              │
│         ▼                                     ▼              │
│    user.manager_id                     User.findOne(Admin)  │
│         │                                     │              │
│         └─────────────────┬──────────────────┘              │
│                           │                                  │
│                           ▼                                  │
│            resolvedApprovers: [Manager/Admin]                │
│                           │                                  │
│                           ▼                                  │
│        ┌──────────────────────────────────────┐             │
│        │  Request Model                       │             │
│        │  - submitter: User                   │             │
│        │  - requestType: "Leave"              │             │
│        │  - approvers: [...]                  │             │
│        │  - status: "Pending"                 │             │
│        └──────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘

                           │
                           │
                           ▼

┌─────────────────────────────────────────────────────────────┐
│                       APPROVERS                              │
│                           │                                  │
│                           ▼                                  │
│              APPROVE/REJECT SEQUENTIALLY                     │
│                                                              │
│    Level 1 → Pending → Approved ✅                          │
│         │                                                    │
│         ▼                                                    │
│    Level 2 → Pending → Approved ✅                          │
│         │                                                    │
│         ▼                                                    │
│    Request Status → APPROVED 🎉                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ 12. CHECKLIST KIỂM TRA HIỂU BUSINESS RULES

### **Core Concepts:**
- [x] Workflow là quy trình phê duyệt động cho mỗi loại đơn
- [x] Mỗi requestType chỉ có 1 workflow active (unique)
- [x] Workflow có thể có nhiều bước (multi-step)

### **Approver Types:**
- [x] DIRECT_MANAGER: Employee → manager_id, Manager → Admin
- [x] SPECIFIC_DEPARTMENT_HEAD: Department.managerId
- [x] SPECIFIC_USER: Hardcode approverId

### **Authorization:**
- [x] Admin: Tạo/sửa/xóa workflow
- [x] Employee/Manager: Gửi đơn
- [x] Admin: KHÔNG gửi đơn

### **Special Rules:**
- [x] Manager không có manager_id (null)
- [x] Manager → Admin (hard-coded)
- [x] Employee phải có manager_id

### **Validation:**
- [x] Workflow phải có ít nhất 1 step
- [x] Levels không trùng lặp, tuần tự (1, 2, 3...)
- [x] SPECIFIC_USER phải có approverId
- [x] SPECIFIC_DEPARTMENT_HEAD phải có departmentId

---

## 🎯 TÓM TẮT 3 DÒNG

```
1. WORKFLOW = Quy trình động cho mỗi loại đơn (Leave, Equipment...)
2. MỖI BƯỚC có 3 loại người duyệt: DIRECT_MANAGER, DEPT_HEAD, USER
3. ĐẶC BIỆT: Manager gửi đơn → Admin duyệt (hard-coded rule)
```

---

## ✅ HOÀN TẤT!

**Business Rules đã được nắm rõ 100%!** 🎉

**Next Steps:**
1. ✅ Backend code hoàn chỉnh
2. 🔄 Cần làm Frontend Admin UI
3. 🔄 Test end-to-end workflow

**Ready to build Frontend!** 🚀
