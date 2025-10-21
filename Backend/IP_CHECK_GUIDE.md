# 🌐 Hướng dẫn Check IP trên Web Server

## ⚠️ VẤN ĐỀ

Khi deploy lên web (Render, Heroku, AWS...), backend **KHÔNG** nhận được IP của máy client (192.168.1.113) mà nhận được:
- IP của proxy/load balancer
- IP public của mạng

## ✅ GIẢI PHÁP ĐÃ ÁP DỤNG

### 1. **Sửa cách lấy IP trong code**
- Thêm hàm `getClientIP()` để lấy IP từ headers: `X-Forwarded-For`, `X-Real-IP`
- Cấu hình Express `trust proxy = true`

### 2. **IP của bạn khi truy cập từ web**

Theo thông tin bạn cung cấp:
```
IPv6: 2402:800:6106:4fc0::2
IPv6: 2402:800:6106:4fc0:3de3:19da:bce2:5d05
IPv4: 192.168.1.113 (IP local - không dùng được)
```

**❌ IP local (192.168.1.113) KHÔNG hoạt động trên web** vì:
- Đây là IP nội bộ của router/modem nhà bạn
- Server web không thấy được IP này
- Server chỉ thấy được **IP Public**

## 🔍 CÁCH TÌM IP PUBLIC CỦA BẠN

### Cách 1: Truy cập web kiểm tra IP
1. Mở trình duyệt
2. Vào trang: https://www.whatismyip.com/
3. Copy IP hiển thị (ví dụ: `113.161.xxx.xxx`)

### Cách 2: Dùng PowerShell
```powershell
(Invoke-WebRequest -Uri "https://api.ipify.org").Content
```

### Cách 3: Xem debug từ backend
1. Thử login hoặc check-in
2. Xem lỗi trả về, sẽ có:
```json
{
  "debug": {
    "clientIP": "113.161.xxx.xxx",  // ← Đây là IP thật
    "headers": {
      "x-forwarded-for": "113.161.xxx.xxx",
      "x-real-ip": "113.161.xxx.xxx"
    }
  }
}
```

## 📝 CÁCH THÊM IP VÀO DANH SÁCH CHO PHÉP

### Bước 1: Tìm IP Public
Dùng một trong 3 cách ở trên để tìm IP

### Bước 2: Sửa file AttendanceController.js
Mở file: `Backend/src/controller/AttendanceController.js`

Tìm phần `CONFIG`:
```javascript
const CONFIG = {
  // ... các config khác
  allowedIPs: [
    "::1",
    "127.0.0.1",
    "::ffff:127.0.0.1",
    "2402:800:6106:4fc0::2",               // IPv6 của bạn
    "2402:800:6106:4fc0:3de3:19da:bce2:5d05", // IPv6 của bạn
    "113.161.xxx.xxx",  // ← THÊM IP PUBLIC VÀO ĐÂY
  ],
};
```

### Bước 3: Commit & Push
```powershell
git add .
git commit -m "Add allowed IP for attendance check"
git push
```

### Bước 4: Đợi Render redeploy
- Render tự động deploy khi có commit mới
- Đợi 2-3 phút
- Test lại

## 🤔 TẠI SAO CẦN IP PUBLIC?

| Loại IP | Ví dụ | Ai thấy được? | Dùng được trên web? |
|---------|-------|---------------|---------------------|
| **IP Local** | 192.168.1.113 | Chỉ trong mạng nhà | ❌ KHÔNG |
| **IP Public** | 113.161.xxx.xxx | Cả Internet | ✅ CÓ |
| **IPv6 Public** | 2402:800:... | Cả Internet | ✅ CÓ (nếu ISP hỗ trợ) |

## ⚡ LƯU Ý QUAN TRỌNG

### 1. IP Public có thể thay đổi
- Nếu bạn dùng **IP động** (thường gặp ở nhà)
- Mỗi lần khởi động lại router/modem → IP mới
- **Giải pháp:**
  - Đăng ký IP tĩnh với ISP (FPT, Viettel...)
  - Hoặc: Tắt check IP, chỉ check login

### 2. IPv6 có thể thay đổi
- IPv6 thường có nhiều địa chỉ
- Temporary IPv6 Address thay đổi theo thời gian
- **Giải pháp:** Chỉ dùng địa chỉ IPv6 cố định (không phải Temporary)

### 3. Khi đi làm từ văn phòng
- Văn phòng có IP public khác
- Phải thêm IP văn phòng vào danh sách

## 🎯 KHUYẾN NGHỊ

### Cho môi trường Test/Development:
```javascript
allowedIPs: ["*"]  // Cho phép mọi IP
```

### Cho môi trường Production (thật):
- Chỉ thêm IP văn phòng chính thức
- Không cho phép IP nhà riêng
- Hoặc kết hợp thêm GPS location check

### Giải pháp khác thay vì check IP:
1. **Geolocation API** - Check vị trí GPS
2. **QR Code** - Quét mã QR tại văn phòng
3. **WiFi SSID** - Check tên mạng WiFi
4. **Bluetooth Beacon** - Thiết bị Bluetooth tại văn phòng

## 🐛 Troubleshooting

### Vẫn báo lỗi sau khi thêm IP?
1. Kiểm tra đã commit & push code chưa
2. Kiểm tra Render đã deploy xong chưa
3. Xóa cache trình duyệt (Ctrl + Shift + Delete)
4. Thử lại

### IP trong debug khác với IP trên whatismyip.com?
- Có thể do VPN
- Có thể do proxy của công ty
- Dùng IP trong debug (chính xác hơn)

### Muốn tắt check IP tạm thời?
Sửa code check-in:
```javascript
// Bỏ comment dòng này để tắt check IP
// const isIntranet = CONFIG.allowedIPs.some(ip => ip === clientIP);
const isIntranet = true; // Tạm thời cho phép mọi IP
```

