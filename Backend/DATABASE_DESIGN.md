# Tài liệu Thiết kế Database - Hệ thống Quản lý Nhân sự
## 1. Mô tả chi tiết các Collection

### 1.1. `Users`

- **Mục đích:** Lưu trữ tất cả thông tin tài khoản người dùng trong hệ thống.
- **Tên Collection:** `users`

| Tên trường | Kiểu dữ liệu | Mô tả | Bắt buộc |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Khóa chính | Có |
| `email` | String | Email đăng nhập, duy nhất | Có |
| `passwordHash` | String | Mật khẩu đã được mã hóa | Có |
| `full_name` | String | Họ và tên đầy đủ | Có |
| `phone` | String | Số điện thoại | Không |
| `avatar` | String | URL ảnh đại diện | Không |
| `address` | String | Địa chỉ | Không |
| `role` | String | Vai trò: `Admin`, `Manager`, `Employee` | Có |
| `department` | Object | Thông tin phòng ban được nhúng | Không |
| `jobTitle` | String | Chức danh công việc | Không |
| `startDate` | Date | Ngày bắt đầu làm việc | Không |
| `salary` | Number | Lương | Không |
| `manager_id` | ObjectId | Tham chiếu đến người quản lý (trong `Users`) | Không |
| `status` | String | Trạng thái: `Active`, `Inactive`, `Suspended` | Có |
| `last_login` | Date | Lần đăng nhập cuối | Không |
| `created_at` | Date | Thời gian tạo | Có |
| `updated_at` | Date | Thời gian cập nhật | Có |

### 1.2. `Departments`

- **Mục đích:** Quản lý thông tin các phòng ban trong công ty.
- **Tên Collection:** `departments`

| Tên trường | Kiểu dữ liệu | Mô tả | Bắt buộc |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Khóa chính | Có |
| `department_name` | String | Tên phòng ban, duy nhất | Có |
| `description` | String | Mô tả chi tiết | Không |
| `managerId` | ObjectId | Tham chiếu đến trưởng phòng (trong `Users`) | Không |
| `status` | String | Trạng thái: `Active`, `Inactive` | Có |
| `created_at` | Date | Thời gian tạo | Có |
| `updated_at` | Date | Thời gian cập nhật | Có |

### 1.3. `Tasks`

- **Mục đích:** Quản lý các công việc được giao cho nhân viên.
- **Tên Collection:** `tasks`

| Tên trường | Kiểu dữ liệu | Mô tả | Bắt buộc |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Khóa chính | Có |
| `title` | String | Tiêu đề công việc | Có |
| `description` | String | Mô tả chi tiết | Không |
| `deadline` | Date | Hạn chót hoàn thành | Có |
| `assignedTo` | Array[Object] | Mảng các nhân viên được giao việc | Không |
| `createdBy` | ObjectId | Tham chiếu đến người tạo (trong `Users`) | Có |
| `createdByName` | String | Tên người tạo được nhúng | Có |
| `status` | String | Trạng thái: `To Do`, `In Progress`, `Completed` | Có |
| `priority` | String | Độ ưu tiên: `High`, `Medium`, `Low` | Có |
| `departmentId` | ObjectId | Tham chiếu đến phòng ban liên quan | Không |
| `completionTime` | Date | Thời gian hoàn thành thực tế | Không |
| `created_at` | Date | Thời gian tạo | Có |
| `updated_at` | Date | Thời gian cập nhật | Có |

### 1.4. `WorkSchedules`

- **Mục đích:** Quản lý lịch làm việc cho từng nhân viên.
- **Tên Collection:** `workschedules`

| Tên trường | Kiểu dữ liệu | Mô tả | Bắt buộc |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Khóa chính | Có |
| `user_id` | ObjectId | Tham chiếu đến nhân viên | Có |
| `user_name` | String | Tên nhân viên được nhúng | Có |
| `department_id` | ObjectId | Tham chiếu đến phòng ban | Không |
| `start_time` | Date | Thời gian bắt đầu ca làm việc | Có |
| `end_time` | Date | Thời gian kết thúc ca làm việc | Có |
| `description` | String | Mô tả (ví dụ: "Ca sáng", "Làm tại nhà") | Không |
| `created_by` | ObjectId | Tham chiếu đến người tạo lịch | Có |
| `status` | String | Trạng thái: `Active`, `Cancelled` | Có |
| `created_at` | Date | Thời gian tạo | Có |
| `updated_at` | Date | Thời gian cập nhật | Có |

### 1.5. `Requests`

- **Mục đích:** Quản lý các yêu cầu từ nhân viên (nghỉ phép, làm thêm giờ,...).
- **Tên Collection:** `requests`

| Tên trường | Kiểu dữ liệu | Mô tả | Bắt buộc |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Khóa chính | Có |
| `type` | String | Loại yêu cầu: `Leave`, `Overtime`, `RemoteWork` | Có |
| `reason` | String | Lý do chi tiết | Có |
| `startDate` | Date | Ngày bắt đầu | Có |
| `endDate` | Date | Ngày kết thúc | Không |
| `hour` | Number | Số giờ (dùng cho OT) | Không |
| `submittedBy` | ObjectId | Tham chiếu đến người gửi yêu cầu | Có |
| `reviewedBy` | ObjectId | Tham chiếu đến người xét duyệt | Không |
| `status` | String | Trạng thái: `Pending`, `Approved`, `Rejected` | Có |
| `denialReason` | String | Lý do từ chối | Không |
| `departmentId` | ObjectId | Tham chiếu đến phòng ban | Không |
| `created_at` | Date | Thời gian tạo | Có |
| `updated_at` | Date | Thời gian cập nhật | Có |

### 1.6. `Attendances`

- **Mục đích:** Ghi lại dữ liệu chấm công hàng ngày của nhân viên.
- **Tên Collection:** `attendances`

| Tên trường | Kiểu dữ liệu | Mô tả | Bắt buộc |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Khóa chính | Có |
| `userId` | ObjectId | Tham chiếu đến nhân viên | Có |
| `date` | Date | Ngày chấm công | Có |
| `clockIn` | Date | Thời gian check-in | Có |
| `clockInMethod` | String | Phương thức: `WiFi` | Có |
| `clockInLocation`| String | SSID của WiFi khi check-in | Có |
| `clockOut` | Date | Thời gian check-out | Không |
| `status` | String | Trạng thái: `Present`, `Late`, `Absent` | Có |
| `departmentId` | ObjectId | Tham chiếu đến phòng ban | Không |
| `created_at` | Date | Thời gian tạo | Có |
| `updated_at` | Date | Thời gian cập nhật | Có |

### 1.7. `Notifications`

- **Mục đích:** Lưu trữ các thông báo của hệ thống.
- **Tên Collection:** `notifications`

| Tên trường | Kiểu dữ liệu | Mô tả | Bắt buộc |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Khóa chính | Có |
| `message` | String | Nội dung thông báo | Có |
| `type` | String | Loại thông báo (ví dụ: `TaskAssigned`) | Có |
| `relatedId` | ObjectId | ID của đối tượng liên quan (Task, Request,...) | Không |
| `targetAudience`| String | Đối tượng: `Individual`, `All`, `Department`... | Có |
| `userId` | ObjectId | ID người nhận (nếu là `Individual`) | Không |
| `departmentId` | ObjectId | ID phòng ban (nếu là `Department`) | Không |
| `isRead` | Boolean | Trạng thái đã đọc (cho `Individual`) | Có |
| `readBy` | Array[ObjectId] | Mảng người đã đọc (cho `Department`, `All`) | Không |
| `created_at` | Date | Thời gian tạo | Có |
| `updated_at` | Date | Thời gian cập nhật | Có |

### 1.8. `Configs`

- **Mục đích:** Lưu trữ các cấu hình chấm công cho từng phòng ban.
- **Tên Collection:** `configs`

| Tên trường | Kiểu dữ liệu | Mô tả | Bắt buộc |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Khóa chính | Có |
| `departmentId` | ObjectId | Tham chiếu đến phòng ban, duy nhất | Có |
| `startTime` | String | Giờ bắt đầu làm việc (HH:mm) | Có |
| `endTime` | String | Giờ kết thúc làm việc (HH:mm) | Có |
| `gracePeriod` | Number | Số phút đi trễ cho phép | Có |
| `wifiList` | Array[String] | Danh sách các SSID WiFi hợp lệ để chấm công | Có |
| `created_at` | Date | Thời gian tạo | Có |
| `updated_at` | Date | Thời gian cập nhật | Có |

---

