# 🚀 Hướng dẫn Deploy Backend lên Render

## ⚙️ Cấu hình Environment Variables trên Render

Vào **Dashboard → Your Service → Environment** và thêm các biến sau:

### 1. Database
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrms
```

### 2. JWT Secret
```
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
```

### 3. Email Configuration (cho forgot password)
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
```

### 4. ⭐ CORS Configuration (QUAN TRỌNG!)
```
CLIENT_URL=https://hrms-3-pp3h.onrender.com,http://localhost:3000
```
> **Lưu ý:** Thay `https://hrms-3-pp3h.onrender.com` bằng URL frontend thật của bạn
> Có thể thêm nhiều domain bằng cách phân cách bởi dấu phẩy

### 5. Environment
```
NODE_ENV=production
```

### 6. Port (tùy chọn - Render tự set)
```
PORT=10000
```

---

## 🔍 Cách kiểm tra lỗi CORS

1. **Mở Developer Tools** trên trình duyệt (F12)
2. Vào tab **Console**
3. Thử đăng nhập
4. Xem lỗi:
   - Nếu thấy `CORS blocked origin: https://...` → Chưa thêm domain vào CLIENT_URL
   - Nếu thấy `Network Error` → Backend chưa chạy hoặc URL sai

---

## 📝 Checklist Deploy

- [ ] Đã tạo service trên Render
- [ ] Đã kết nối với GitHub repository
- [ ] Đã thêm tất cả Environment Variables
- [ ] Đã set CLIENT_URL đúng với domain frontend
- [ ] Build thành công (không có lỗi)
- [ ] Backend đang chạy (check logs)
- [ ] Test endpoint: `https://your-backend.onrender.com/`
- [ ] Test login từ frontend

---

## 🐛 Troubleshooting

### Lỗi: "Network Error" khi login
**Nguyên nhân:** CORS chặn hoặc backend chưa chạy

**Giải pháp:**
1. Kiểm tra logs backend trên Render
2. Tìm dòng `📥 Request from origin: ...`
3. Thêm origin đó vào CLIENT_URL

### Lỗi: "Not allowed by CORS"
**Nguyên nhân:** CLIENT_URL chưa có domain frontend

**Giải pháp:**
```bash
CLIENT_URL=https://your-frontend.onrender.com,http://localhost:3000
```

### Lỗi: "Cannot connect to MongoDB"
**Nguyên nhân:** MONGODB_URI sai hoặc MongoDB chưa cho phép IP của Render

**Giải pháp:**
1. Vào MongoDB Atlas
2. Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)

---

## 🔗 URLs cần thiết

- Backend URL: `https://hrms-1-2h7w.onrender.com`
- Frontend URL: `https://hrms-3-pp3h.onrender.com` (cập nhật nếu khác)

