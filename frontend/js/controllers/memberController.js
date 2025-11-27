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

// AI Chat: Send message and simulate response
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    const box = document.getElementById('chat-box');
    box.innerHTML += `<div class="message user">${text}</div>`;
    input.value = '';

    // Simulate AI response with delay
    setTimeout(() => {
        let response = "I can help with that plan.";
        if (text.toLowerCase().includes("diet")) {
            response = "Based on your goal to lose fat, I recommend increasing protein and reducing refined carbs. Shall I generate a meal plan?";
        } else if (text.toLowerCase().includes("workout")) {
            response = "For today, let's focus on Upper Body Strength. Try 3 sets of Bench Press followed by Cable Crossovers.";
        } else if (text.toLowerCase().includes("token")) {
            response = `You currently have ${appState.user.tokens} tokens remaining.`;
        }
        box.innerHTML += `<div class="message ai">${response}</div>`;
        box.scrollTop = box.scrollHeight;
    }, 1000);
}

// InBody: Handle form submission
function handleInBodySubmit(e) {
    e.preventDefault();
    alert("InBody Data Uploaded Successfully! Your AI plan is being updated.");
}