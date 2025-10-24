/**
 * 🔧 SOCKET CONNECTION FIX GUIDE
 * 
 * Lỗi: WebSocket connection to 'ws://localhost:5000/socket.io/' failed
 * Nguyên nhân: Port mismatch và CORS configuration
 */

## ✅ ĐÃ SỬA

### Vấn đề 1: Port Mismatch
- **Backend đang chạy**: Port 9999 (từ .env PORT=9999)
- **Frontend đang kết nối**: Port 5000 (hardcoded fallback sai)

**Đã sửa:**
```javascript
// SocketContext.js - Dòng 27
// Trước: const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Sau:  const SOCKET_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9999';
```

### Vấn đề 2: CORS Configuration
- Socket.IO CORS đang dùng array tĩnh
- Không log được origin để debug

**Đã sửa:**
```javascript
// socketService.js
cors: {
  origin: function (origin, callback) {
    // Dynamic CORS check với logging
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Socket.IO: CORS allowed for ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ Socket.IO: CORS blocked ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  }
}
```

---

## 🧪 CÁCH TEST SAU KHI SỬA

### Bước 1: Restart Backend
```bash
cd Backend
# Kill process cũ
taskkill /F /IM node.exe
# Start lại
npm start
```

**Kiểm tra logs:**
```
🚀 Server is running on port 9999
🔌 Initializing Socket.IO with CORS origins: [ 'http://localhost:3000', '...' ]
🔌 Socket.IO initialized
```

### Bước 2: Restart Frontend
```bash
cd Frontend
npm start
```

### Bước 3: Mở Browser và check Console (F12)

**Kết quả mong đợi:**
```
🔌 Connecting to Socket.IO: http://localhost:9999
✅ Socket connected: abc123xyz
👤 Current user: { _id: '...', fullName: '...' }
🚪 Joining user room: user_...
```

**Nếu vẫn lỗi:**
```
❌ Socket connection error: TransportError: websocket error
```

---

## 🔍 DEBUG CHECKLIST

### 1. Kiểm tra Backend đang chạy
```powershell
netstat -ano | findstr :9999
```
**Expect:** `LISTENING       [PID]`

### 2. Kiểm tra Frontend .env
```properties
# Frontend/.env
REACT_APP_API_BASE_URL=http://localhost:9999
```

### 3. Kiểm tra Backend .env
```properties
# Backend/.env
PORT=9999
CLIENT_URL=http://localhost:3000,https://hrms-3-pp3h.onrender.com
```

### 4. Test Socket.IO endpoint trực tiếp
Mở browser và vào:
```
http://localhost:9999/socket.io/socket.io.js
```
**Expect:** File JavaScript được tải về (không lỗi 404)

### 5. Check CORS trong Backend logs
Khi Frontend kết nối, Backend phải log:
```
📥 Request from origin: http://localhost:3000
✅ CORS allowed for: http://localhost:3000
✅ Socket.IO: CORS allowed for origin: http://localhost:3000
✅ Client connected: abc123
```

### 6. Frontend Console phải thấy
```javascript
// Paste vào Console để test
console.log('API URL:', process.env.REACT_APP_API_BASE_URL);
// Expect: http://localhost:9999
```

---

## 🚨 COMMON ISSUES

### Issue 1: ERR_CONNECTION_REFUSED
**Nguyên nhân:** Backend không chạy
**Giải pháp:** 
```bash
cd Backend
npm start
```

### Issue 2: CORS Error
**Symptoms:** Console shows "CORS policy blocked"
**Giải pháp:**
1. Check Backend logs có `❌ CORS blocked origin: ...`
2. Thêm origin đó vào Backend/.env:
```properties
CLIENT_URL=http://localhost:3000,http://localhost:3001
```
3. Restart Backend

### Issue 3: Socket connects then disconnects immediately
**Symptoms:**
```
✅ Socket connected: abc123
❌ Socket disconnected
```
**Nguyên nhân:** Ping timeout hoặc auth issue
**Giải pháp:** Check Backend logs xem có error không

### Issue 4: Multiple socket connections
**Symptoms:** Mỗi action tạo nhiều toast notifications
**Giải pháp:**
- Check SocketContext chỉ được mount 1 lần
- Đảm bảo cleanup trong useEffect:
```javascript
return () => {
  newSocket.disconnect();
};
```

---

## 🎯 VERIFICATION TESTS

### Test 1: Basic Connection
```javascript
// Browser Console (F12)
// Should see:
console.log(window.socketContext?.isConnected); // true
console.log(window.socketContext?.socket?.id);  // "abc123xyz"
```

### Test 2: Send Test Notification
```http
POST http://localhost:9999/api/test/send-notification
Headers:
  Authorization: Bearer YOUR_TOKEN
Body:
{
  "message": "Test Socket.IO connection!"
}
```

**Expect:**
- Backend logs: `✅ Notification created and sent to user XXX`
- Frontend: Toast appears IMMEDIATELY
- Console: `🔔 New notification received: {...}`

### Test 3: Room Verification
```http
GET http://localhost:9999/api/test/socket-status
Headers:
  Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "isUserConnected": true,
  "userConnections": 1,
  "message": "✅ User is connected and ready to receive real-time notifications"
}
```

---

## 🔐 ENVIRONMENT VARIABLES SUMMARY

### Backend (.env)
```properties
PORT=9999
CLIENT_URL=http://localhost:3000,https://hrms-3-pp3h.onrender.com
MONGODB_URI=mongodb://127.0.0.1:27017/HRMS
```

### Frontend (.env)
```properties
REACT_APP_API_BASE_URL=http://localhost:9999
```

---

## ✅ SUCCESS INDICATORS

Khi mọi thứ hoạt động đúng:

**Backend Terminal:**
```
🚀 Server is running on port 9999
🔌 Initializing Socket.IO with CORS origins: [ 'http://localhost:3000' ]
🔌 Socket.IO initialized
📥 Request from origin: http://localhost:3000
✅ CORS allowed for: http://localhost:3000
✅ Socket.IO: CORS allowed for origin: http://localhost:3000
✅ Client connected: abc123xyz
👤 User 673123abc joined room: user_673123abc
```

**Frontend Console:**
```
🔌 Connecting to Socket.IO: http://localhost:9999
✅ Socket connected: abc123xyz
👤 Current user: { _id: '673123abc', fullName: 'John Doe' }
🚪 Joining user room: user_673123abc
🚪 Joining role room: role_Employee
```

**NO MORE WEBSOCKET ERRORS!** 🎉

---

## 📞 STILL NOT WORKING?

Run this diagnostic script in Browser Console:

```javascript
const diagnostics = {
  socketContext: !!window.socketContext,
  isConnected: window.socketContext?.isConnected,
  socketId: window.socketContext?.socket?.id,
  apiUrl: process.env.REACT_APP_API_BASE_URL,
  currentOrigin: window.location.origin,
};

console.table(diagnostics);

// Test fetch to backend
fetch('http://localhost:9999/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend reachable:', d))
  .catch(e => console.error('❌ Backend unreachable:', e.message));
```

If all checks pass but socket still fails:
1. Clear browser cache (Ctrl+Shift+Del)
2. Try incognito mode
3. Check firewall/antivirus blocking WebSocket
4. Try different browser
