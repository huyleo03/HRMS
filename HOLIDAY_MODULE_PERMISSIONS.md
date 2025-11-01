# 🔐 QUYỀN CỦA CÁC ROLE - MODULE HOLIDAY (SAU KHI SỬA ĐỔI)

**Ngày cập nhật:** 31/10/2025  
**Branch:** phan-quyen-role-o-frontend  
**Status:** ✅ Production Ready

---

## 📋 **TỔNG QUAN PHÂN QUYỀN**

Module Holiday sau khi refactor có **3 roles** với quyền khác nhau:

| Role | Giao diện | Quyền | Nguồn dữ liệu |
|------|-----------|-------|---------------|
| **Admin** | AdminHolidayPage | Toàn quyền | Company Holidays (tự tạo) |
| **Manager** | DepartmentCalendarPage | Chỉ xem | Company Holidays + Employee Leaves (department) |
| **Employee** | DepartmentCalendarPage | Chỉ xem | Company Holidays + Employee Leaves (department) |

---

## 👑 **1. ADMIN ROLE**

### **Frontend Route:**
```
/admin/holidays → AdminHolidayPage.jsx
```

### **UI Components:**
- ✅ **HolidayCalendarGrid** - Calendar với quick-add
- ✅ **QuickAddModal** - Tạo holiday nhanh từ calendar
- ✅ **HolidayDetailModal** - Xem/Sửa/Xóa holiday
- ✅ **DayEventsModal** - Xem tất cả events trong ngày

### **Quyền (Permissions):**

#### **✅ CREATE (Tạo mới):**
- 📝 **Tạo holiday đơn lẻ:**
  - Endpoint: `POST /api/holidays`
  - UI: QuickAddModal hoặc HolidayDetailModal (new mode)
  - Fields: name, date, type, isPaid, isRecurring, description, notes, color, status
  - **Scope:** Áp dụng cho **toàn công ty** (tất cả departments)

- 📋 **Bulk create holidays:**
  - Endpoint: `POST /api/holidays/bulk`
  - UI: ✅ **BulkImportModal** - Import từ CSV/Excel
  - Use case: Import nhiều holidays cùng lúc (Tết, lễ hội hàng năm)
  - Features:
    * Tải file mẫu CSV template
    * Upload file CSV/Excel (.csv, .xls, .xlsx)
    * Preview dữ liệu trước khi import
    * Báo cáo kết quả: thành công/thất bại

- 🔄 **Generate recurring holidays:**
  - Endpoint: `POST /api/holidays/generate-recurring`
  - UI: ✅ **GenerateRecurringModal** - Tự động copy recurring holidays
  - Use case: Copy tất cả recurring holidays từ năm cũ sang năm mới
  - Features:
    * Chọn năm nguồn (source year) và năm đích (target year)
    * Tự động tìm holidays có `isRecurring = true`
    * Copy và cập nhật ngày tháng theo năm mới
    * Hiển thị danh sách holidays đã tạo
    * Bỏ qua holidays đã tồn tại

#### **✅ READ (Xem):**
- 📅 **Xem tất cả holidays:**
  - Endpoint: `GET /api/holidays?year={year}&month={month}&type={type}&status={status}`
  - UI: Calendar grid + filters
  - Scope: **Toàn bộ holidays** (không giới hạn department)

- 🔍 **Xem chi tiết holiday:**
  - Endpoint: `GET /api/holidays/{id}`
  - UI: HolidayDetailModal
  - Info: Full details bao gồm metadata, audit log

- 📊 **Xem upcoming holidays:**
  - Endpoint: `GET /api/holidays/upcoming?limit={limit}`
  - UI: ✅ **Section "🔔 Sắp tới trong 30 ngày"** trong DepartmentCalendarPage
  - Use case: Xem 5 holidays/leaves sắp tới
  - Note: Frontend tự implement logic filter, không cần gọi API

- ✔️ **Check ngày có phải holiday:**
  - Endpoint: `GET /api/holidays/check?date={YYYY-MM-DD}`
  - UI: ✅ **HolidayCheckWidget** - Widget kiểm tra ngày lễ
  - Use case: Kiểm tra nhanh một ngày có phải holiday không
  - Features:
    * Full mode: Card đầy đủ với form và kết quả chi tiết (Admin)
    * Compact mode: Inline form nhỏ gọn (Manager/Employee)
    * Hiển thị thông tin: Tên, loại, có lương, mô tả
    * Quick action: Button "Hôm nay" để chọn nhanh

- 📅 **Get calendar holidays:**
  - Endpoint: `GET /api/holidays/calendar?year={year}&month={month}`
  - UI: ✅ Dùng trong AdminHolidayPage
  - Return: Holidays trong tháng để render trên calendar

#### **✅ UPDATE (Sửa):**
- ✏️ **Sửa holiday:**
  - Endpoint: `PUT /api/holidays/{id}`
  - UI: HolidayDetailModal (edit mode)
  - Fields: Tất cả fields như CREATE

#### **✅ DELETE (Xóa):**
- 🗑️ **Xóa holiday:**
  - Endpoint: `DELETE /api/holidays/{id}`
  - UI: HolidayDetailModal (delete button)
  - Confirm: Modal xác nhận trước khi xóa

### **Dữ liệu hiển thị:**
1. **Company Holidays** - Do chính Admin tạo
   - Tất cả holidays, tất cả departments
   - Có thể filter theo: year, month, type, status, department

### **Đặc quyền:**
- ✅ **Quick Add** từ calendar (click vào ô ngày trống)
- ✅ **Edit** mọi holiday
- ✅ **Delete** mọi holiday
- ✅ **Bulk operations** (via API)
- ✅ **Xem tất cả departments**

---

## 👔 **2. MANAGER ROLE**

### **Frontend Route:**
```
/manager/holidays → DepartmentCalendarPage.jsx
```

### **UI Components:**
- ✅ **HolidayCalendarGrid** - Calendar read-only (không có quick-add)
- ✅ **HolidayViewModal** - Xem holiday (read-only, không có edit/delete)
- ✅ **LeaveViewModal** - Xem employee leave chi tiết
- ✅ **DayEventsModal** - Xem tất cả events trong ngày

### **Quyền (Permissions):**

#### **❌ CREATE:** KHÔNG CÓ
- Manager **KHÔNG THỂ** tạo Company Holiday
- Manager **KHÔNG THỂ** tạo Employee Leave trực tiếp trên calendar
- **Lý do:** Employee leaves tự động từ Request đã duyệt

#### **✅ READ (Xem):**
- 📅 **Xem calendar holidays (Company):**
  - Endpoint: `GET /api/holidays/calendar?year={year}&month={month}`
  - UI: ✅ DepartmentCalendarPage
  - Scope: **TẤT CẢ holidays** (Admin chỉ tạo lịch cho toàn công ty)
  - Note: Không cần filter, tất cả holidays đều áp dụng cho mọi người

- 👥 **Xem approved leaves (Department):**
  - Endpoint: `GET /api/requests/approved-leaves/calendar?departmentId={id}&year={year}&month={month}`
  - UI: ✅ DepartmentCalendarPage
  - Scope: **CHỈ department của Manager**
  - Permission check: Backend validate `req.user.department.department_id === departmentId`
  - Data: Tất cả Leave/BusinessTrip requests có status="Approved" trong department

- 🔍 **Xem chi tiết:**
  - Company Holiday: HolidayViewModal (read-only)
  - Employee Leave: LeaveViewModal (read-only)
  - Click từ calendar hoặc DayEventsModal

#### **❌ UPDATE:** KHÔNG CÓ
- Manager **KHÔNG THỂ** sửa Company Holiday
- Manager **KHÔNG THỂ** sửa Employee Leave (chỉ Admin/Request module)

#### **❌ DELETE:** KHÔNG CÓ
- Manager **KHÔNG THỂ** xóa bất kỳ dữ liệu nào

### **Dữ liệu hiển thị (LỒNG GHÉP - OVERLAY):**

**⚠️ QUAN TRỌNG: Cả 2 loại dữ liệu hiển thị CHUNG trên một calendar grid!**

1. **Company Holidays** (màu đỏ/cam 🔴):
   - Ngày lễ, Tết do Admin tạo
   - **Áp dụng cho toàn công ty** (tất cả Manager/Employee đều thấy)
   - Không cần filter theo department hay role

2. **Employee Leaves** (màu tím 🟣):
   - Nghỉ phép (👤) của nhân viên trong department
   - Công tác (✈️) của nhân viên trong department
   - **Bao gồm cả lịch nghỉ của chính Manager** (nếu Manager tạo Request và được duyệt)
   - Badge "👔 Manager" hiển thị để phân biệt

**Ví dụ hiển thị trên Calendar:**
```
┌─────────────────────────────────────┐
│  Thứ 2, 01/01/2025                  │
│  🔴 Tết Dương lịch (Company)        │
│  🟣 Nguyễn Văn A - Nghỉ phép        │
│  +2 thêm                             │
└─────────────────────────────────────┘
```

### **Giới hạn:**
- ✅ **Chỉ xem department của mình**: Backend validate `departmentId`
- ❌ **Không thể xem department khác**: Return 403 Forbidden
- ❌ **Không có quyền tạo/sửa/xóa**
- ✅ **Calendar read-only**: Click ngày trống không mở QuickAddModal

---

## 👤 **3. EMPLOYEE ROLE**

### **Frontend Route:**
```
/employee/holidays → DepartmentCalendarPage.jsx
```

### **UI Components:**
**GIỐNG HỆT MANAGER** - Dùng chung component `DepartmentCalendarPage`

### **Quyền (Permissions):**

#### **❌ CREATE:** KHÔNG CÓ
- Employee **KHÔNG THỂ** tạo Company Holiday
- Employee **KHÔNG THỂ** tạo Employee Leave trực tiếp trên calendar
- **Lý do:** Tạo leave qua Request module

#### **✅ READ (Xem):**
**GIỐNG HỆT MANAGER:**
- 📅 **Xem calendar holidays (Company):**
  - Endpoint: `GET /api/holidays/calendar?year={year}&month={month}`
  - Scope: Company Holidays áp dụng cho department

- 👥 **Xem approved leaves (Department):**
  - Endpoint: `GET /api/requests/approved-leaves/calendar?departmentId={id}&year={year}&month={month}`
  - Scope: **CHỈ department của Employee**
  - Permission check: Backend validate `req.user.department.department_id === departmentId`

- 🔍 **Xem chi tiết:**
  - Company Holiday: HolidayViewModal
  - Employee Leave: LeaveViewModal
  - **Xem được lịch nghỉ của Manager** với badge "👔 Manager"

#### **❌ UPDATE:** KHÔNG CÓ
#### **❌ DELETE:** KHÔNG CÓ

### **Dữ liệu hiển thị (LỒNG GHÉP - OVERLAY):**
**GIỐNG HỆT MANAGER:**

1. **Company Holidays** (màu đỏ/cam 🔴):
   - **Áp dụng cho toàn công ty** (tất cả Manager/Employee đều thấy)
   - Admin tạo holidays chung, không phân biệt department

2. **Employee Leaves** (màu tím 🟣):
   - Nghỉ phép & công tác đã duyệt của Manager và Employee trong department
   - Hiển thị cả lịch nghỉ của chính mình

### **Giới hạn:**
**GIỐNG HỆT MANAGER:**
- ✅ Chỉ xem department của mình
- ❌ Không có quyền tạo/sửa/xóa
- ✅ Calendar read-only

---

## 🔄 **WORKFLOW TÍCH HỢP VỚI REQUEST MODULE**

### **Nguyên tắc quan trọng:**

```
┌─────────────────────────────────────────────────────────────┐
│  HOLIDAY CALENDAR = READ-ONLY VIEW (OVERLAY/LỒNG GHÉP)     │
│  ↑                                                           │
│  │ Lấy 2 nguồn dữ liệu và MERGE trên cùng 1 calendar grid  │
│  │                                                           │
│  ├─ 🔴 Company Holidays ← Holiday Module (Admin tạo)        │
│  │    Filter: appliesTo = "All" / "Dept" / "Specific"      │
│  │                                                           │
│  └─ 🟣 Employee Leaves  ← Request Module (Auto sync)        │
│       Filter: departmentId + status="Approved"              │
└─────────────────────────────────────────────────────────────┘

**📌 Kết quả trên UI:**
Người dùng thấy CẢ HAI loại lịch trên CÙNG MỘT giao diện calendar,
phân biệt bằng màu sắc: đỏ/cam (holidays) vs tím (leaves)
```

### **Quy trình tạo Employee Leave:**

**Bước 1: Employee/Manager tạo Request**
```
Employee → Request Module → Tạo Request type="Leave" hoặc "BusinessTrip"
Status: Pending
```

**Bước 2: Duyệt Request**
```
Manager/Admin → Request Module → Approve Request
Status: Approved
```

**Bước 3: Tự động hiển thị trên Calendar**
```
Calendar Module → Fetch approved leaves → Hiển thị tự động
Không cần Manager nhập tay!
```

### **Lợi ích:**
- ✅ **Single Source of Truth**: Request module là nguồn dữ liệu duy nhất
- ✅ **Tự động hóa**: Không cần nhập 2 lần
- ✅ **Nhất quán**: Dữ liệu giữa Request và Calendar luôn sync
- ✅ **Audit trail**: Lịch sử duyệt đơn trong Request module

---

## 📊 **BẢNG SO SÁNH QUYỀN**

| Chức năng | Admin | Manager | Employee |
|-----------|-------|---------|----------|
| **Xem Company Holidays** | ✅ Toàn bộ | ✅ Của công ty/dept | ✅ Của công ty/dept |
| **Xem Employee Leaves** | ❌ N/A | ✅ Department mình | ✅ Department mình |
| **Tạo Company Holiday** | ✅ | ❌ | ❌ |
| **Sửa Company Holiday** | ✅ | ❌ | ❌ |
| **Xóa Company Holiday** | ✅ | ❌ | ❌ |
| **Tạo Employee Leave** | ❌ (qua Request) | ❌ (qua Request) | ❌ (qua Request) |
| **Quick Add từ Calendar** | ✅ | ❌ | ❌ |
| **Filter theo Department** | ✅ Tất cả | ✅ Của mình | ✅ Của mình |
| **Xem Department khác** | ✅ | ❌ | ❌ |
| **Bulk Import** | ✅ (API ready) | ❌ | ❌ |
| **Generate Recurring** | ✅ (API ready) | ❌ | ❌ |

---

## 🎨 **UI/UX PHÂN BIỆT**

### **Admin View (AdminHolidayPage):**
```
┌────────────────────────────────────────────┐
│  📅 Lịch nghỉ lễ công ty                   │
│  [+ Thêm ngày lễ]         [Filter] [Year] │
├────────────────────────────────────────────┤
│  Calendar Grid (có quick-add)              │
│  - Click ô trống → QuickAddModal           │
│  - Click holiday → HolidayDetailModal      │
│    [Edit] [Delete] [Save]                  │
└────────────────────────────────────────────┘
```

### **Manager/Employee View (DepartmentCalendarPage):**
```
┌────────────────────────────────────────────┐
│  📅 Lịch nghỉ - Department IT              │
│  Xem lịch nghỉ lễ công ty và lịch nghỉ phép │
├────────────────────────────────────────────┤
│  🔔 Sắp tới trong 30 ngày                  │
│  [Holiday cards] [Leave cards]             │
├────────────────────────────────────────────┤
│  [◀] Tháng 11/2025 [▶] [Hôm nay]         │
├────────────────────────────────────────────┤
│  Calendar Grid (read-only)                 │
│  - Click holiday → HolidayViewModal        │
│    (Read-only, không có Edit/Delete)       │
│  - Click leave → LeaveViewModal            │
│    (Hiển thị thông tin nhân viên + badge)  │
│  - Click "+n thêm" → DayEventsModal        │
│    (Liệt kê tất cả events trong ngày)      │
└────────────────────────────────────────────┘

📝 Chú ý:
- Ngày lễ công ty (đỏ/cam) - Admin tạo
- Nghỉ phép & công tác (tím) - Request đã duyệt
- Chỉ xem department: IT
```

---

## 🔒 **BACKEND PERMISSION VALIDATION**

### **Holiday Routes (`/api/holidays`):**

```javascript
// PUBLIC (All authenticated)
GET    /api/holidays              ✅ Admin, Manager, Employee
GET    /api/holidays/:id          ✅ Admin, Manager, Employee
GET    /api/holidays/calendar     ✅ Admin, Manager, Employee
GET    /api/holidays/upcoming     ✅ Admin, Manager, Employee
GET    /api/holidays/check        ✅ Admin, Manager, Employee

// ADMIN ONLY
POST   /api/holidays              ✅ Admin only (requireAdmin middleware)
PUT    /api/holidays/:id          ✅ Admin only
DELETE /api/holidays/:id          ✅ Admin only
POST   /api/holidays/bulk         ✅ Admin only
POST   /api/holidays/generate-recurring  ✅ Admin only
```

### **Request Routes (`/api/requests`):**

```javascript
// MANAGER & EMPLOYEE ONLY
GET /api/requests/approved-leaves/calendar  ✅ Manager, Employee
    Query params: departmentId, year, month
    Validation: req.user.department.department_id === departmentId
    Return 403 if trying to access other department
```

### **Security Checks:**

**1. Role-based Access:**
```javascript
// holidayRoutes.js
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({
      success: false,
      message: "Chỉ Admin mới có quyền truy cập"
    });
  }
  next();
};
```

**2. Department-based Access:**
```javascript
// RequestController.js - getApprovedLeavesByDepartmentAndMonth
if (currentUser.department?.department_id?.toString() !== departmentId) {
  return res.status(403).json({
    success: false,
    message: "Bạn chỉ được xem lịch nghỉ của phòng ban mình"
  });
}
```

---

## 📁 **FILE STRUCTURE SAU REFACTOR**

```
Frontend/src/pages/holiday/
├── components/
│   ├── DayEventsModal.jsx          ✅ (All roles - trong calendar)
│   ├── HolidayCalendarGrid.jsx     ✅ (All roles - main calendar)
│   ├── HolidayDetailModal.jsx      ✅ (Admin only - edit mode)
│   ├── HolidayViewModal.jsx        ✅ (Manager/Employee - read-only)
│   ├── LeaveViewModal.jsx          ✅ (Manager/Employee - trong DayEventsModal)
│   └── QuickAddModal.jsx           ✅ (Admin only - quick create)
├── pages/
│   ├── AdminHolidayPage.jsx        ✅ (Admin only)
│   └── DepartmentCalendarPage.jsx  ✅ (Manager & Employee chung)
└── css/
    ├── AdminHolidayCalendar.css    ✅ (Admin styles)
    ├── DayEventsModal.css          ✅ (Modal styles)
    ├── HolidayCalendarGrid.css     ✅ (Calendar grid styles)
    ├── HolidayModal.css            ✅ (Modal shared styles)
    └── ManagerHolidayCalendar.css  ✅ (Department calendar styles)

Backend/src/
├── controller/
│   ├── HolidayController.js        ✅ (10 functions)
│   └── RequestController.js        ✅ (+1 function: getApprovedLeaves...)
├── routes/
│   ├── holidayRoutes.js            ✅ (10 endpoints)
│   └── requestRoutes.js            ✅ (+1 endpoint: /approved-leaves/calendar)
└── models/
    ├── Holiday.js                  ✅ (Company holidays)
    └── Request.js                  ✅ (Employee leaves source)
```

---

## ✅ **CHECKLIST TRIỂN KHAI**

### **Backend:**
- [x] Holiday Controller - 10 functions
- [x] Holiday Routes - 10 endpoints với permission check
- [x] Request Controller - thêm getApprovedLeavesByDepartmentAndMonth
- [x] Request Routes - thêm /approved-leaves/calendar endpoint
- [x] Department validation - check user.department === requestedDepartment
- [x] Role middleware - requireAdmin cho Holiday mutations

### **Frontend:**
- [x] AdminHolidayPage - Full CRUD với QuickAddModal
- [x] DepartmentCalendarPage - Read-only cho Manager/Employee
- [x] HolidayDetailModal - Admin edit mode
- [x] HolidayViewModal - Manager/Employee read-only
- [x] DayEventsModal - List tất cả events trong ngày
- [x] LeaveViewModal - Chi tiết employee leave với role badge
- [x] Routes - /admin/holidays, /manager/holidays, /employee/holidays
- [x] Sidebar - Menu items cho cả 3 roles

### **Security:**
- [x] Backend role check cho Admin-only endpoints
- [x] Backend department check cho approved leaves
- [x] Frontend route protection với ProtectedRoute
- [x] 403 Forbidden cho unauthorized access

### **Data Integration:**
- [x] Company Holidays từ Holiday module
- [x] Employee Leaves từ Request module (auto sync)
- [x] Merge 2 nguồn dữ liệu trên calendar
- [x] Phân biệt màu sắc: đỏ/cam (holidays) vs tím (leaves)

### **UX:**
- [x] "+n thêm" button cho nhiều events
- [x] DayEventsModal phân loại rõ ràng
- [x] Role badge "👔 Manager" để phân biệt
- [x] Tooltip và hover effects
- [x] Responsive mobile

---

## � **HIỂN THỊ LỒNG GHÉP (OVERLAY) - GIẢI THÍCH CHI TIẾT**

### **❓ Câu hỏi: Có hiển thị cả 2 loại lịch trên cùng một giao diện không?**

**✅ CÓ! Đây là thiết kế LỒNG GHÉP (OVERLAY):**

```javascript
// DepartmentCalendarPage.jsx - Line 130
const mergedCalendarData = [
  ...companyHolidays.map(h => ({ ...h, itemType: 'holiday' })),
  ...employeeLeaves.map(l => ({ ...l, itemType: 'leave', date: l.startDate }))
];
```

### **🖼️ Ví dụ hiển thị thực tế:**

**Tháng 01/2025 - Department IT:**

```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│  CN     │  T2     │  T3     │  T4     │  T5     │  T6     │  T7     │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│  29     │  30     │  31     │  1      │  2      │  3      │  4      │
│         │         │         │🔴 Tết   │         │         │         │
│         │         │         │🟣 A nghỉ│         │         │         │
│         │         │         │+1 thêm  │         │         │         │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│  5      │  6      │  7      │  8      │  9      │  10     │  11     │
│         │🟣 B công│🟣 B công│🟣 B công│         │🔴 Giỗ  │         │
│         │  tác    │  tác    │  tác    │         │  Tổ     │         │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Legend:
🔴 = Company Holiday (màu đỏ/cam) - Admin tạo
🟣 = Employee Leave (màu tím) - Request đã duyệt
```

### **📊 Luồng dữ liệu:**

**Frontend (DepartmentCalendarPage.jsx):**
```javascript
1. Fetch companyHolidays từ /api/holidays/calendar
   ↓
2. Fetch employeeLeaves từ /api/requests/approved-leaves/calendar
   ↓
3. MERGE cả 2 mảng thành mergedCalendarData
   ↓
4. Truyền vào HolidayCalendarGrid
   ↓
5. Render trên CÙNG MỘT calendar grid
```

**📌 Note:** Không cần filter companyHolidays vì Admin chỉ tạo lịch cho toàn công ty

### **🎨 Phân biệt màu sắc:**

| Loại | Màu | Icon | Nguồn dữ liệu |
|------|-----|------|---------------|
| Company Holiday | 🔴 Đỏ/Cam | 🎉 🎊 🏮 | Holiday Module (Admin tạo) |
| Employee Leave | 🟣 Tím | 👤 | Request Module (Approved) |
| Business Trip | 🟣 Tím | ✈️ | Request Module (Approved) |

### **🔍 Filter Logic:**

**Company Holidays:**
- ✅ **Không cần filter** - Admin chỉ tạo lịch cho toàn công ty
- ✅ Tất cả Manager/Employee đều thấy tất cả holidays

**Employee Leaves (chỉ hiển thị nếu):**
- `department_id` khớp với department của user
- `status = "Approved"`
- `type` in ["Leave", "BusinessTrip"]

---

## �🎯 **KẾT LUẬN**

### **Phân quyền rõ ràng:**
- ✅ **Admin**: Toàn quyền quản lý Company Holidays
- ✅ **Manager**: Xem Company Holidays + Employee Leaves của department (LỒNG GHÉP)
- ✅ **Employee**: Xem Company Holidays + Employee Leaves của department (LỒNG GHÉP)

### **Tự động hóa:**
- ✅ Employee Leaves tự động từ Request đã duyệt
- ✅ Không cần Manager nhập tay
- ✅ Single source of truth

### **Bảo mật:**
- ✅ Backend validate role và department
- ✅ Frontend route protection
- ✅ 403 Forbidden cho unauthorized access

### **UI/UX thống nhất:**
- ✅ Manager và Employee dùng chung giao diện
- ✅ Admin có giao diện riêng với đầy đủ controls
- ✅ Read-only vs Edit mode rõ ràng

---

**📌 Version:** 2.0.0 (Sau refactor)  
**📅 Last Updated:** 31/10/2025  
**✅ Status:** Production Ready
