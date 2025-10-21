# ✅ ĐÃ CẤU HÌNH XONG CHECK IP

## 📌 Thông tin

**IP của máy bạn:** `42.118.89.199`

**Trạng thái:** ✅ Đã được thêm vào danh sách cho phép

## 🚀 Deploy lên Render

```powershell
cd "e:\FPT\Kì 9\WDP\HRMS"
git add .
git commit -m "Update allowed IPs for attendance check"
git push origin main
```

Đợi 2-3 phút để Render tự động deploy.

## ✅ Test

1. Mở trình duyệt, vào: `https://hrms-3-pp3h.onrender.com` (hoặc frontend URL của bạn)
2. Đăng nhập
3. Thử chấm công (check-in/check-out)
4. Nếu thành công → OK!

## 🔒 Bảo mật

Chỉ những máy có IP sau mới chấm công được:
- ✅ `42.118.89.199` (máy bạn)
- ✅ `127.0.0.1` (localhost khi test)
- ✅ `2402:800:6106:4fc0::2` (IPv6 của bạn)
- ✅ `2402:800:6106:4fc0:3de3:19da:bce2:5d05` (IPv6 của bạn)

Máy khác: ❌ KHÔNG được phép

## ⚠️ Lưu ý

### IP có thể thay đổi nếu:
- Khởi động lại modem/router
- Mất điện
- Thay đổi mạng

**Giải pháp:**
1. Kiểm tra lại IP: `Invoke-RestMethod -Uri "https://api.ipify.org"`
2. Nếu khác, cập nhật lại trong `AttendanceController.js`

### Nếu cần thêm IP khác (máy đồng nghiệp):
1. Lấy IP của họ
2. Thêm vào `allowedIPs` trong file `AttendanceController.js`
3. Commit & push lại

## 🐛 Debug

Nếu vẫn báo lỗi "không đúng mạng", response sẽ có `debug` object:

```json
{
  "debug": {
    "clientIP": "xxx.xxx.xxx.xxx",
    "allowedIPs": [...]
  }
}
```

Check xem `clientIP` có khớp với IP trong `allowedIPs` không.

