# Quick Start: Testing Real-Time Chat

## 🚀 Start the Application

### 1. Start Backend

```powershell
cd "d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\Graduation-Project"
dotnet run
```

Backend will start on: `http://localhost:5178`

### 2. Start Frontend

```powershell
cd "d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\codeflex-ai"
npm run dev
```

Frontend will start on: `http://localhost:3000`

## 👥 Test Users

You need at least 2 users to test chat:

- **1 Member** (to send messages to coach)
- **1 Coach** (to reply to member)

## 📝 Test Scenario

### Step 1: Create Booking (Member)

1. Login as **Member**
2. Go to **Bookings** page (`/bookings`)
3. Book a session with a coach
4. Note the coach's name

### Step 2: Start Chat (Member)

1. Go to **Dashboard** (`/dashboard`)
2. Find "My Coach" card
3. Click **"Message"** button
4. Chat dialog opens
5. Type: "Hello Coach, looking forward to our session!"
6. Click Send

### Step 3: Reply (Coach)

1. Open a **new browser window** (or incognito mode)
2. Login as **Coach**
3. Go to **Coach Dashboard** (`/coach-dashboard`)
4. Find the member's booking in "Upcoming Sessions"
5. Click the **message icon** (💬) next to their booking
6. Chat dialog opens showing member's message
7. Type: "Hello! I'm excited to work with you."
8. Click Send

### Step 4: Continue Conversation

1. Switch back to **Member window**
2. See coach's reply appear automatically
3. Continue chatting back and forth
4. Messages appear in real-time without refreshing!

## 🔔 Test Notifications

Notifications appear in the top-right corner when:

- New system events occur
- Backend sends notifications via NotificationHub

To test manually, you can trigger notifications from backend code:

```csharp
await _notificationHub.Clients.Group($"user_{userId}")
    .SendAsync("ReceiveNotification", new {
        title = "Test Notification",
        message = "This is a test",
        type = "info",
        timestamp = DateTime.UtcNow
    });
```

## 🐛 Troubleshooting

### Chat dialog doesn't open

- **Check**: Is the coach assigned? (Member must have booked with coach)
- **Check**: Browser console for connection errors
- **Fix**: Verify backend is running on correct port

### Messages not sending

- **Check**: Connection status in chat header
- **Expected**: Green dot and "Connected"
- **Fix**: Check browser console for SignalR errors
- **Fix**: Verify JWT token is valid

### Messages not appearing on other side

- **Check**: Both users are logged in
- **Check**: Both chat dialogs are open
- **Check**: Network tab shows WebSocket connection
- **Fix**: Refresh both browsers

### Connection shows "Reconnecting"

- **Cause**: Lost connection to backend
- **Fix**: Check if backend is still running
- **Action**: Connection will auto-reconnect when backend is available

### Backend CORS errors

If you see CORS errors in console:

1. Check `Program.cs` has CORS configured
2. Verify frontend URL matches CORS policy
3. Restart backend after changes

## 📊 Monitor Connections

### Browser Developer Tools

1. Open **DevTools** (F12)
2. Go to **Network** tab
3. Filter by **WS** (WebSocket)
4. Look for connections to:
   - `ws://localhost:5178/hubs/chat`
   - `ws://localhost:5178/hubs/notifications`
5. Click connection to see messages

### Console Logs

Watch for:

```
Connected to http://localhost:5178/hubs/chat
Connected to http://localhost:5178/hubs/notifications
```

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Chat dialog opens without errors
2. ✅ Connection status shows green "Connected"
3. ✅ Your messages appear on right side (blue)
4. ✅ Other person's messages appear on left side (gray)
5. ✅ Messages appear instantly (< 1 second delay)
6. ✅ Notification toasts slide in from top-right

## 🎯 Expected Behavior

### Message Flow (Member → Coach)

```
Member Dashboard
    ↓ Click "Message"
Chat Dialog Opens
    ↓ Type & Send
SignalR → Backend ChatHub
    ↓ SendMessageToCoach(coachId, message)
Backend → Coach's Connection
    ↓ ReceiveMessage event
Coach's Chat Dialog
    ↓ Message appears in real-time
```

### Message Flow (Coach → Member)

```
Coach Dashboard
    ↓ Click message icon
Chat Dialog Opens
    ↓ Type & Send
SignalR → Backend ChatHub
    ↓ SendMessageToMember(memberId, message)
Backend → Member's Connection
    ↓ ReceiveMessage event
Member's Chat Dialog
    ↓ Message appears in real-time
```

## 📸 What You Should See

### Member Dashboard

- "My Coach" card with coach details
- **"Message"** button (blue, primary)
- When clicked: Chat dialog overlay

### Coach Dashboard

- List of upcoming sessions
- Each session has a **💬 icon** button
- When clicked: Chat dialog overlay

### Chat Dialog

```
┌─────────────────────────────────────┐
│ Chat with [Name]              ×     │
│ ● Connected                         │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────┐                │
│ │ Coach: Hello!   │                │
│ └─────────────────┘                │
│                                     │
│                ┌──────────────────┐ │
│                │ Member: Hi there!│ │
│                └──────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [Type a message...] [Send →]       │
└─────────────────────────────────────┘
```

### Notification Toast

```
┌────────────────────────────┐
│ ℹ️ New Booking            × │
│ Session scheduled for      │
│ tomorrow at 10:00 AM       │
│ 2:30 PM                    │
└────────────────────────────┘
```

## 🔗 Important URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5178`
- Chat Hub: `ws://localhost:5178/hubs/chat`
- Notification Hub: `ws://localhost:5178/hubs/notifications`

## 📝 Notes

- Chat messages are **not persisted** - they only exist in memory
- Page refresh will **clear message history**
- For production, implement message persistence to database
- See `CHAT_IMPLEMENTATION_SUMMARY.md` for full documentation
