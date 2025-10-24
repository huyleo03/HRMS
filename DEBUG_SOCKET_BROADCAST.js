/**
 * 🐛 DEBUG SCRIPT - Socket.IO Notification Broadcasting Issue
 * 
 * Paste this into Browser Console (F12) on BOTH tabs to debug
 */

console.clear();
console.log('=== 🔍 SOCKET.IO DEBUG - TAB INFO ===');

// 1. Get current user info
const currentUser = JSON.parse(localStorage.getItem('user_info'));
console.log('👤 Current User:');
console.log('   ID:', currentUser?._id);
console.log('   Name:', currentUser?.fullName);
console.log('   Role:', currentUser?.role);
console.log('   Email:', currentUser?.email);

// 2. Check socket connection
if (window.socketContext) {
  console.log('\n🔌 Socket Connection:');
  console.log('   Connected:', window.socketContext.isConnected);
  console.log('   Socket ID:', window.socketContext.socket?.id);
  
  // 3. Check which rooms this socket joined
  console.log('\n🚪 Expected Rooms:');
  console.log('   User Room:', `user_${currentUser?._id}`);
  console.log('   Role Room:', `role_${currentUser?.role}`);
} else {
  console.error('❌ SocketContext not found!');
}

// 4. Listen to all socket events for debugging
if (window.socketContext?.socket) {
  const socket = window.socketContext.socket;
  
  console.log('\n👂 Now listening to ALL socket events...\n');
  
  // Override the event handler to log everything
  const originalOn = socket.on.bind(socket);
  socket.on = function(event, handler) {
    return originalOn(event, function(...args) {
      console.log(`📨 Socket Event Received: "${event}"`);
      console.log('   Data:', args[0]);
      console.log('   Should show on this user?', 
        args[0]?.userId?.toString() === currentUser?._id ||
        args[0]?.targetAudience === 'All'
      );
      return handler.apply(this, args);
    });
  };
  
  console.log('✅ Debug listener installed! All notifications will be logged.');
} else {
  console.error('❌ Socket not available for debugging');
}

console.log('\n========================================');
console.log('Now trigger a notification on OTHER tab');
console.log('You will see if THIS tab receives it');
console.log('========================================\n');

// Export info for easy comparison
window.debugInfo = {
  userId: currentUser?._id,
  userName: currentUser?.fullName,
  socketId: window.socketContext?.socket?.id,
  expectedRoom: `user_${currentUser?._id}`,
};

console.log('💾 Debug info saved to window.debugInfo');
console.log('Compare both tabs:', window.debugInfo);
