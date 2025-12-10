# SignalR Chat - Troubleshooting Guide

## ✅ FIXED: WebSocket Connection Errors

### What Was Wrong

The custom WebSocket implementation didn't support SignalR's protocol. SignalR uses a specific handshake and message format that plain WebSockets don't understand.

### What Was Fixed

1. **Installed Official Package**: `@microsoft/signalr`
2. **Updated Connection Service**: Replaced custom WebSocket with official SignalR client
3. **Fixed API URL**: SignalR hubs are at root (`http://localhost:5025/hubs/chat`), not under `/api`

## 🚀 How to Start & Test

### Step 1: Start Backend

```powershell
cd "d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\Graduation-Project"
dotnet run
```

**Expected output:**

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5025
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shutdown.
```

**Verify it's running:**

```powershell
# Test API endpoint
Invoke-WebRequest -Uri "http://localhost:5025/api/auth/health" -UseBasicParsing
```

### Step 2: Start Frontend

```powershell
cd "d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\codeflex-ai"
npm run dev
```

**Expected output:**

```
  ▲ Next.js 15.2.4
  - Local:        http://localhost:3000

✓ Ready in 2.5s
```

### Step 3: Open Browser & Login

1. Open `http://localhost:3000`
2. Login as a member or coach
3. Check browser console

**Expected console output:**

```
Connected to chat hub
Connected to notification hub
```

**If you see errors:**

- Make sure backend is running on port 5025
- Check that .env.local has correct API URL
- Clear browser cache and refresh

## 🔍 Debugging Connection Issues

### Check Backend is Running

```powershell
# Check if port 5025 is listening
Get-NetTCPConnection -LocalPort 5025 -ErrorAction SilentlyContinue
```

### Check SignalR Hubs

Open in browser:

- Swagger: `http://localhost:5025/swagger`
- Should show all API endpoints

### Test SignalR Connection Manually

In browser console after login:

```javascript
// Check connection state
console.log("Chat connection:", window.chatConnection?.state);
console.log("Notification connection:", window.notificationConnection?.state);
```

### Common Errors & Fixes

#### Error: "Failed to connect to chat hub"

**Cause**: Backend not running or CORS issue
**Fix**:

1. Start backend: `cd Graduation-Project; dotnet run`
2. Verify CORS in Program.cs allows `http://localhost:3000`
3. Check browser console for specific error

#### Error: "address already in use"

**Cause**: Backend already running on that port
**Fix**:

1. Find and stop existing process:

```powershell
Get-Process -Name "Graduation-Project" | Stop-Process
```

2. Or change port in launchSettings.json

#### Error: "WebSocket error: {}"

**Cause**: SignalR hub not accessible
**Fix**:

1. Verify hubs are mapped in Program.cs:

```csharp
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");
```

2. Check CORS allows credentials
3. Verify JWT token is valid

#### Error: "Connection is not in the Connected state"

**Cause**: Trying to send before connection established
**Fix**: Wait for connection indicator to show "Connected" before sending messages

## 📊 Connection States

### HubConnectionState Values

- `Disconnected` (0) - Not connected
- `Connecting` (1) - Establishing connection
- `Connected` (2) - ✅ Ready to send/receive
- `Disconnecting` (3) - Closing connection
- `Reconnecting` (4) - Attempting to reconnect

### What Each State Means

```
Disconnected → Not connected yet or connection closed
Connecting   → Initial connection in progress
Connected    → ✅ All good! Can send/receive messages
Reconnecting → Lost connection, auto-retrying
```

## ✅ Verification Checklist

Before testing chat, verify:

- [ ] Backend running on port 5025
- [ ] Swagger accessible at `http://localhost:5025/swagger`
- [ ] Frontend running on port 3000
- [ ] User logged in (JWT token in localStorage)
- [ ] Browser console shows "Connected to chat hub"
- [ ] Browser console shows "Connected to notification hub"
- [ ] No CORS errors in console
- [ ] Network tab shows WebSocket connections

## 🔧 Updated Files

### 1. hubConnection.ts

**Changed**: From custom WebSocket → Official SignalR client
**Why**: SignalR uses specific protocol, not plain WebSocket

### 2. SignalRContext.tsx

**Changed**: State management for HubConnectionState
**Why**: Official client uses different API

### 3. ChatDialog.tsx

**Changed**: Import HubConnectionState from @microsoft/signalr
**Why**: Type definitions changed

### 4. .env.local

**Value**: `NEXT_PUBLIC_API_URL=http://localhost:5025/api`
**Note**: SignalR hubs are at root, code strips `/api` for hubs

## 📝 Testing Workflow

### Quick Test

1. Start backend → Wait for "Now listening on: http://localhost:5025"
2. Start frontend → Wait for "Ready in X.Xs"
3. Login as member
4. Open browser DevTools (F12)
5. Check Console tab for "Connected to chat hub"
6. Go to Dashboard
7. Click "Message" button on coach card
8. Type message and send
9. Check console for no errors

### Full Integration Test

1. **Window 1**: Login as Member

   - Go to Dashboard
   - Click "Message" on coach card
   - Send: "Hello from member!"

2. **Window 2**: Login as Coach (incognito/different browser)

   - Go to Coach Dashboard
   - Click 💬 icon next to member's booking
   - Should see member's message
   - Reply: "Hello from coach!"

3. **Window 1**: Member should see coach's reply appear automatically

## 🎯 Success Indicators

### Backend

```
✅ info: Microsoft.AspNetCore.Hosting.Diagnostics[1]
   Request starting HTTP/1.1 GET http://localhost:5025/hubs/chat
✅ SignalR connection established
```

### Frontend Console

```
✅ Connected to chat hub
✅ Connected to notification hub
✅ SignalR reconnected to http://localhost:5025/hubs/chat. Connection ID: xyz
```

### Browser Network Tab

```
✅ WS connection to ws://localhost:5025/hubs/chat (Status: 101 Switching Protocols)
✅ WS connection to ws://localhost:5025/hubs/notifications (Status: 101 Switching Protocols)
```

### Chat Dialog

```
✅ Header shows green dot and "Connected"
✅ Messages appear on both sides in real-time
✅ Send button is enabled
✅ No error toasts
```

## 🆘 Still Having Issues?

1. **Check backend logs** in terminal for errors
2. **Check browser console** for JavaScript errors
3. **Check Network tab** for failed requests
4. **Verify token** in localStorage is valid
5. **Try different browser** to rule out cache issues
6. **Restart both** backend and frontend

## 📞 Need Help?

If issues persist:

1. Share browser console errors
2. Share backend terminal output
3. Share Network tab WebSocket status
4. Specify which step fails in testing workflow
