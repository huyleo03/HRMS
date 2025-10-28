# 📋 Quy Tắc Quy Trình Duyệt Đơn (Approval Workflow Rules)

## 🎯 Business Rules

### Rule 1: Employee - Multi-Step Approval (Quy trình nhiều cấp)
**Áp dụng cho:** Người gửi đơn có role = `Employee`

**Quy trình:**
```
Employee → Manager (Direct Manager) → Admin
```

**Chi tiết:**
- ✅ Đơn được gửi theo workflow động (dynamic workflow)
- ✅ Dựa trên cấu hình trong `Workflow` model
- ✅ Có thể có nhiều cấp duyệt (level 1, level 2, level 3...)
- ✅ Phải đợi cấp trước approve mới đến lượt cấp sau

**Ví dụ:**
```javascript
// Employee gửi đơn Leave
approvalFlow: [
  {
    level: 1,
    approverId: "MANAGER_ID",
    approverName: "Nguyễn Văn A",
    role: "Approver",
    status: "Pending"
  },
  {
    level: 2,
    approverId: "ADMIN_ID",
    approverName: "Admin System",
    role: "Approver",
    status: "Pending"
  }
]
```

---

### Rule 2: Manager - Direct to Admin (Bypass workflow)
**Áp dụng cho:** Người gửi đơn có role = `Manager`

**Quy trình:**
```
Manager → Admin (ONLY)
```

**Chi tiết:**
- ✅ **BỎ QUA** toàn bộ quy trình nhiều cấp
- ✅ **KHÔNG** cần tìm workflow trong database
- ✅ Tự động tạo approval flow đơn giản: chỉ 1 level Admin
- ✅ Admin là người duy nhất duyệt đơn

**Ví dụ:**
```javascript
// Manager gửi đơn Leave
approvalFlow: [
  {
    level: 1,
    approverId: "ADMIN_ID",
    approverName: "Admin System",
    role: "Approver",
    status: "Pending"
  }
]
// Chỉ có 1 level!
```

---

### Rule 3: Admin - Cannot Create Request
**Áp dụng cho:** Người gửi đơn có role = `Admin`

**Quy tắc:**
- ❌ Admin **KHÔNG ĐƯỢC PHÉP** tạo đơn
- ✅ Admin chỉ có quyền **DUYỆT** đơn của người khác
- ✅ Nếu Admin cố gửi đơn → HTTP 403 Forbidden

**Lý do:**
- Admin là cấp cao nhất, không có ai duyệt cho Admin
- Tránh conflict: Admin tự approve đơn của mình

---

## 🔧 Implementation

### File: `RequestController.js`

```javascript
exports.createRequest = async (req, res) => {
  try {
    const submitter = await User.findById(req.user.id);
    
    // Rule 3: Admin không được tạo đơn
    if (submitter.role === "Admin") {
      return res.status(403).json({
        message: "Admin không được phép tạo đơn"
      });
    }

    let resolvedApprovalFlow;

    // Rule 2: Manager bypass workflow
    if (submitter.role === "Manager") {
      const adminUser = await User.findOne({ role: "Admin" });
      
      if (!adminUser) {
        return res.status(400).json({
          message: "Không tìm thấy Admin để duyệt đơn"
        });
      }

      // Tạo approval flow đơn giản: chỉ Admin
      resolvedApprovalFlow = [
        {
          level: 1,
          approverId: adminUser._id,
          approverName: adminUser.full_name,
          approverEmail: adminUser.email,
          role: "Approver",
          status: "Pending",
        },
      ];
    } else {
      // Rule 1: Employee theo quy trình nhiều cấp
      const workflow = await Workflow.getActiveWorkflow(type, departmentId);
      resolvedApprovalFlow = await workflow.resolveApprovers(submitter);
    }

    // Tạo request với approvalFlow đã resolve
    const newRequest = new Request({
      submittedBy: submitter._id,
      approvalFlow: resolvedApprovalFlow,
      status: "Pending",
      // ... other fields
    });

    await newRequest.save();
  } catch (error) {
    // Error handling
  }
};
```

---

## 📊 Flow Chart

```
┌─────────────────┐
│  User Gửi Đơn   │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Role?  │
    └───┬────┘
        │
   ┌────┼────┐
   │    │    │
   ▼    ▼    ▼
┌──────┐ ┌─────────┐ ┌───────┐
│Admin │ │ Manager │ │Employee│
└──┬───┘ └────┬────┘ └───┬───┘
   │          │           │
   ▼          ▼           ▼
┌──────┐  ┌──────┐   ┌────────────┐
│ 403  │  │Admin │   │  Workflow  │
│Reject│  │ Only │   │Multi-Level │
└──────┘  └──┬───┘   └─────┬──────┘
             │              │
             ▼              ▼
         ┌──────┐      ┌─────────┐
         │Level1│      │ Level 1 │
         │Admin │      │ Manager │
         └──────┘      └────┬────┘
                            │
                            ▼
                       ┌─────────┐
                       │ Level 2 │
                       │  Admin  │
                       └─────────┘
```

---

## 🧪 Test Cases

### Test Case 1: Employee Gửi Đơn
```javascript
// Input
POST /api/requests
Authorization: Bearer <EMPLOYEE_TOKEN>
{
  "type": "Leave",
  "reason": "Nghỉ phép",
  "startDate": "2025-11-01",
  "endDate": "2025-11-03"
}

// Expected Output
{
  "message": "Tạo đơn thành công",
  "data": {
    "request": {
      "approvalFlow": [
        { "level": 1, "approverId": "MANAGER_ID", "status": "Pending" },
        { "level": 2, "approverId": "ADMIN_ID", "status": "Pending" }
      ]
    }
  }
}

// ✅ Kết quả: Manager và Admin đều thấy trong inbox
```

### Test Case 2: Manager Gửi Đơn
```javascript
// Input
POST /api/requests
Authorization: Bearer <MANAGER_TOKEN>
{
  "type": "Leave",
  "reason": "Nghỉ phép",
  "startDate": "2025-11-01",
  "endDate": "2025-11-03"
}

// Expected Output
{
  "message": "Tạo đơn thành công",
  "data": {
    "request": {
      "approvalFlow": [
        { "level": 1, "approverId": "ADMIN_ID", "status": "Pending" }
      ]
    }
  }
}

// ✅ Kết quả: CHỈ Admin thấy trong inbox (Manager KHÔNG thấy)
```

### Test Case 3: Admin Gửi Đơn
```javascript
// Input
POST /api/requests
Authorization: Bearer <ADMIN_TOKEN>
{
  "type": "Leave",
  "reason": "Nghỉ phép",
  "startDate": "2025-11-01",
  "endDate": "2025-11-03"
}

// Expected Output
{
  "message": "Admin không được phép tạo đơn. Admin chỉ có quyền duyệt đơn của người khác.",
  "statusCode": 403
}

// ✅ Kết quả: Request bị reject
```

---

## ⚠️ Important Notes

### 1. Tìm Admin
- Hệ thống tự động tìm Admin bằng `User.findOne({ role: "Admin" })`
- **Giả định:** Luôn có ít nhất 1 Admin trong hệ thống
- **Nếu không có Admin:** Request sẽ bị reject với lỗi 400

### 2. Manager Không Thấy Đơn Của Manager Khác
- Khi Manager A gửi đơn → Chỉ Admin thấy
- Manager B **KHÔNG** thấy đơn của Manager A trong inbox
- Lý do: Manager A không có trong `approvalFlow.approverId`

### 3. Workflow Database
- **Employee:** Cần có Workflow được cấu hình trong database
- **Manager:** KHÔNG cần Workflow, bỏ qua hoàn toàn
- Nếu Employee không có Workflow → Request bị reject

### 4. Level Numbering
- **Manager request:** Luôn là `level: 1` (chỉ có 1 level)
- **Employee request:** `level: 1, 2, 3...` (nhiều level)
- Level number ảnh hưởng đến logic `isUserTurn()`

---

## 🔄 Approval Process

### Employee Request Flow
```
1. Employee gửi đơn
   ↓
2. Resolve workflow từ database
   ↓
3. Tạo approvalFlow nhiều level
   ↓
4. Status = "Pending"
   ↓
5. Manager (level 1) thấy trong inbox
   ↓
6. Manager approve → status = "Manager_Approved"
   ↓
7. Admin (level 2) thấy trong inbox
   ↓
8. Admin approve → status = "Approved"
```

### Manager Request Flow
```
1. Manager gửi đơn
   ↓
2. BYPASS workflow (không query database)
   ↓
3. Tạo approvalFlow: chỉ 1 level Admin
   ↓
4. Status = "Pending"
   ↓
5. Admin (level 1) thấy trong inbox
   ↓
6. Admin approve → status = "Approved"
```

---

## 📝 Summary

| Role | Workflow | Approval Flow | Inbox Visibility |
|------|----------|---------------|------------------|
| **Employee** | Dynamic (từ DB) | Multi-level (Manager → Admin) | Manager thấy level 1, Admin thấy level 2 |
| **Manager** | **BYPASS** | Single-level (Admin only) | **CHỈ Admin thấy** |
| **Admin** | ❌ Không được tạo đơn | N/A | N/A |

**Key Points:**
- ✅ Manager = Special case = Bypass workflow
- ✅ Employee = Normal case = Follow workflow
- ✅ Admin = Cannot create requests
- ✅ Code đơn giản, rõ ràng, dễ maintain
