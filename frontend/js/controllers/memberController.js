// MEMBER-SPECIFIC FUNCTIONS

// Book a machine and deduct tokens
function bookMachine(id) {
    if (appState.user.tokens >= 5) {
        appState.user.tokens -= 5;
        updateTokenDisplay();
        alert("Booking Confirmed! QR Code generated for access.");
        // Optional: Update machine availability (e.g., set to false)
        const machine = appState.machines.find(m => m.id === id);
        if (machine) machine.available = false;
        renderMachines(); // Refresh list
    } else {
        alert("Insufficient Tokens. Please top up.");
    }
}

// AI Chat: Handle enter key press
function handleChatKey(e) {
    if (e.key === 'Enter') sendMessage();
}

// Updated AI Chat: Integrate GeminiChat API
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    const box = document.getElementById('chat-box');
    box.innerHTML += `<div class="message user">${text}</div>`;
    input.value = '';

    try {
        // Send message to backend proxy which talks to configured AI provider
        const payload = {
            userId: appState.user?.id || appState.user?.userId || 0,
            message: text
        };

        const response = await fetch('/api/ai/gemini-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // forward user's auth token if available
                ...(appState.user?.apiToken ? { 'Authorization': `Bearer ${appState.user.apiToken}` } : {})
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => response.statusText);
            throw new Error(`API Error: ${errText}`);
        }

        const data = await response.json();
        const aiResponse = data?.data?.response || data?.response || 'Sorry, I could not process that.';

        // Add AI response and scroll
        box.innerHTML += `<div class="message ai">${aiResponse}</div>`;
        box.scrollTop = box.scrollHeight;
    } catch (error) {
        console.error('Error in AI Chat:', error);
        box.innerHTML += `<div class="message ai error">Error: Unable to fetch response. Please check your connection or try again later.</div>`;
        box.scrollTop = box.scrollHeight;
    }
}

// InBody: Handle form submission
function handleInBodySubmit(e) {
    e.preventDefault();
    alert("InBody Data Uploaded Successfully! Your AI plan is being updated.");
}