# Phân tích Chức năng theo Vai trò (Use Cases)

Hệ thống phân chia chức năng dựa trên 3 vai trò chính: **Admin**, **Manager**, và **Employee**.

## 4.1. Admin

Vai trò cao nhất, có toàn quyền quản trị hệ thống.

#### UC-1: Quản lý Người dùng
- **Thêm người dùng:** Admin có thể tạo tài khoản mới cho nhân viên. Chức năng này yêu cầu nhập thông tin cơ bản như email, họ tên, phòng ban, và hệ thống sẽ tự động tạo tài khoản với mật khẩu được sinh ngẫu nhiên và gửi cho người dùng.
- **Chỉnh sửa thông tin người dùng:** Admin có quyền chỉnh sửa hồ sơ của bất kỳ người dùng nào trong hệ thống (ví dụ: cập nhật địa chỉ, số điện thoại, chức danh).
- **Xóa người dùng:** Admin có thể xóa (hoặc vô hiệu hóa) hồ sơ của một nhân viên khỏi hệ thống.
- **Tìm kiếm/Lọc người dùng:** Cung cấp công cụ để tìm kiếm và lọc danh sách người dùng theo tên, email, phòng ban, hoặc vai trò.

#### UC-2: Quản lý Phân quyền
- **Phân vai trò:** Admin có thể gán các vai trò được định sẵn (`Manager`, `Employee`) cho một tài khoản người dùng.
- **Thay đổi vai trò:** Admin có thể thay đổi vai trò của người dùng hiện có, ví dụ, thăng chức một `Employee` lên làm `Manager`.

#### UC-3: Quản lý Phòng ban
- **Thêm phòng ban:** Admin tạo một phòng ban mới với các thông tin như tên, mô tả.
- **Chỉnh sửa thông tin phòng ban:** Admin có thể chỉnh sửa tên hoặc mô tả của một phòng ban.
- **Xóa phòng ban:** Admin có quyền xóa một phòng ban khỏi hệ thống.
- **Phân công quản lý:** Admin chỉ định một người dùng có vai trò `Manager` để giám sát một phòng ban.

#### UC-4: Cấu hình Hệ thống Chấm công
- **Đặt giờ làm việc:** Admin xác định thời gian bắt đầu và kết thúc của ngày làm việc cho từng phòng ban. Dữ liệu này là cơ sở để xác định đi trễ và tính giờ làm thêm.
- **Cấu hình địa điểm chấm công:** Admin tạo một danh sách các tên mạng Wi-Fi (SSID) hợp lệ. Hệ thống sẽ xác minh nhân viên đã kết nối với một trong các mạng này khi chấm công để đảm bảo họ đang ở đúng địa điểm làm việc.

#### UC-5: Xem Báo cáo & Thống kê
- **Báo cáo Chấm công Tổng thể:** Xem tóm tắt tình trạng chấm công của toàn công ty hoặc từng phòng ban (số lượng có mặt, đi muộn, vắng).
- **Báo cáo Hiệu suất Chung:** Xem các chỉ số hiệu suất tổng thể, chẳng hạn như tỷ lệ hoàn thành công việc đúng hạn.
- **Báo cáo & Phân tích Lương (Chức năng nâng cao):**
  - **Tổng quỹ lương:** Xem tổng chi phí lương hàng tháng của toàn công ty và từng phòng ban.
  - **Phân tích cơ cấu lương:** Thống kê mức lương trung bình theo chức danh, phòng ban.
  - **Chi phí làm thêm giờ:** Tự động tính toán chi phí OT dựa trên dữ liệu yêu cầu và lương của nhân viên.

## 4.2. Manager

Vai trò quản lý, chịu trách nhiệm về phòng ban và các nhân viên cấp dưới của mình.

#### UC-1 : Quản lý Nhân sự Phòng ban (Department HR Management):
- **Xem thông tin nhân viên:** Xem hồ sơ chi tiết của các nhân viên trong phòng ban mình quản lý.
- **Chỉnh sửa thông tin nhân viên:** Cập nhật các thông tin cơ bản (ví dụ: số điện thoại, chức danh) cho nhân viên cấp dưới.
- **Tìm kiếm/Lọc nhân viên:** Cung cấp công cụ để tìm kiếm và lọc hồ sơ nhân viên trong phòng ban.

#### UC-2 : Quản lý Công việc & Hiệu suất (Task & Performance Management):
- **Giao việc:** Tạo và giao các công việc mới cho một hoặc nhiều nhân viên, bao gồm tiêu đề, mô tả và thời hạn.
- **Theo dõi tiến độ:** Xem trạng thái hiện tại của tất cả các công việc đã giao (To Do, In Progress, Completed).
- **Xem chi tiết công việc:** Xem mô tả, người được giao, và lịch sử của một công việc cụ thể.
- **Theo dõi hiệu suất:** Đánh giá hiệu suất làm việc của nhân viên dựa trên tỷ lệ hoàn thành công việc.

#### UC-3 : Quản lý Lịch làm việc & Chấm công (Schedule & Attendance Management):
- **Sắp xếp lịch làm việc:** Tạo và sắp xếp lịch, ca làm việc cho các thành viên trong nhóm theo tuần/tháng.
- **Quản lý ca:** Điều chỉnh, hủy bỏ hoặc gán lại ca khi có thay đổi đột xuất.
- **Xem báo cáo chấm công:** Xem chi tiết thời gian vào/ra, báo cáo đi muộn, vắng mặt của nhân viên.
- **Đối chiếu dữ liệu:** So sánh dữ liệu chấm công thực tế (Attendances) với lịch làm việc đã xếp (WorkSchedules) để phát hiện sai lệch.

#### UC-4 : Quản lý Yêu cầu & Phê duyệt (Request & Approval Management):
- **Xem danh sách yêu cầu:** Nhận và xem danh sách các yêu cầu (nghỉ phép, làm thêm giờ, đổi ca) từ nhân viên.
- **Phê duyệt/Từ chối:** Đưa ra quyết định phê duyệt hoặc từ chối yêu cầu, kèm theo khả năng ghi rõ lý do.

#### UC-5 : Giao tiếp & Thông báo (Communication & Notifications):
- **Gửi thông báo:** Gửi các thông báo quan trọng đến tất cả thành viên trong phòng ban.

## 4.3. Employee

Vai trò nhân viên cơ bản, thực hiện các công việc được giao và tương tác với hệ thống cho các hoạt động hàng ngày.

#### UC-1: Quản lý Thông tin Cá nhân
- **Xem hồ sơ cá nhân:** Xem thông tin cá nhân của mình, bao gồm họ tên, email, chức danh, phòng ban, lịch sử chấm công và lịch sử công việc.
- **Chỉnh sửa thông tin cá nhân:** Tự cập nhật một số thông tin cơ bản có thể thay đổi như số điện thoại, địa chỉ, ảnh đại diện (avatar).

#### UC-2: Chấm công & Lịch làm việc
- **Thực hiện chấm công:** Thực hiện thao tác check-in và check-out hàng ngày. Hệ thống sẽ ghi nhận thời gian và xác thực địa điểm làm việc thông qua SSID của WiFi đã kết nối.
- **Xem lịch sử chấm công:** Xem lại lịch sử chấm công của bản thân theo tuần hoặc tháng.
- **Xem lịch làm việc:** Xem lịch làm việc cá nhân và lịch của các thành viên khác trong nhóm trên giao diện lịch trực quan.

#### UC-3: Quản lý Công việc Cá nhân
- **Xem danh sách công việc:** Xem danh sách các công việc được quản lý giao, bao gồm mô tả, độ ưu tiên và thời hạn (deadline).
- **Cập nhật trạng thái công việc:** Thay đổi trạng thái của một công việc khi bắt đầu hoặc hoàn thành (ví dụ: từ To Do sang In Progress, rồi sang Completed).

#### UC-4: Gửi và Theo dõi Yêu cầu
- **Tạo yêu cầu:** Tạo và gửi các yêu cầu đến quản lý để xét duyệt, bao gồm:
    - Yêu cầu nghỉ phép (Leave).
    - Yêu cầu làm thêm giờ (Overtime).
    - Yêu cầu làm việc từ xa (RemoteWork).
    - Yêu cầu đổi ca làm việc.
- **Theo dõi trạng thái yêu cầu:** Kiểm tra trạng thái của các yêu cầu đã gửi (Pending, Approved, Rejected) và xem lý do nếu bị từ chối.

#### UC-5: Xem Thông báo
- **Nhận thông báo:** Xem danh sách các thông báo mới nhất từ Admin và Manager (ví dụ: thông báo về công việc mới, kết quả phê duyệt yêu cầu, thông báo chung của công ty).
- **Đánh dấu đã đọc:** Đánh dấu các thông báo đã xem để dễ dàng quản lý và theo dõi.
