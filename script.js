// =====================================
// APP STATE MANAGEMENT
// =====================================
// Global state object to hold app data (roles, users, etc.)
// Edit here to add more data like users or machines
const appState = {
    currentUserRole: 'member', // Default role: 'member', 'coach', or 'reception'
     user: {
        tokens: 120   // starting token count
    },clients: [                 // List of clients for coach (edit or add more)
        { name: "Jane Doe", goal: "Weight Loss", lastScan: "Oct 24", status: "Active" },
        { name: "Ahmed Ali", goal: "Muscle Gain", lastScan: "Oct 20", status: "Pending Plan" },
        { name: "Sarah Connor", goal: "Endurance", lastScan: "Oct 22", status: "Active" }
    ]
};

// =====================================
// AUTH & NAVIGATION FUNCTIONS
// =====================================
// Function to select role on login page
// Updates buttons and form fields based on role
function selectRole(role) {
    appState.currentUserRole = role;
    // Remove active class from all role buttons
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    // Add active to selected button
    event.target.classList.add('active');
    
    // Update login title and email placeholder based on role
    const title = document.getElementById('login-title');
    const emailInput = document.querySelector('#login-form input[type="email"]');
    
    if(role === 'coach') {
        title.innerText = "Coach Login";
        emailInput.value = "coach@intellifit.com";
    } else if(role === 'reception') {
        title.innerText = "Reception Login";
        emailInput.value = "reception@intellifit.com";
    } else {
        title.innerText = "Member Login";
        emailInput.value = "user@intellifit.com";
    }
}

// Function to handle login form submission
// Hides auth screen, shows header and dashboard
function handleLogin(e) {
    e.preventDefault(); // Prevent form reload
    document.getElementById('auth-section').classList.add('hidden'); // Hide login
    document.getElementById('app-header').classList.remove('hidden'); // Show header
    document.getElementById('app-header').classList.add('flex');
    
    // Hide all dashboards
    ['dashboard-member', 'dashboard-coach', 'dashboard-reception'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });

    // Show the selected role's dashboard
    const dashboardId = `dashboard-${appState.currentUserRole}`;
    document.getElementById(dashboardId).classList.remove('hidden');

    // Update role badge in header
    document.getElementById('user-role-badge').innerText = appState.currentUserRole.toUpperCase();

    // Initialize role-specific views (e.g., render lists)
    if(appState.currentUserRole === 'coach') renderCoachClientList();
}

// Function to logout and reset app
function logout() {
    location.reload(); // Reload page to reset
}

// Function to switch tabs within a dashboard
// Params: role (string), tabName (string)
function switchTab(role, tabName) {
    // Hide all tabs in the role's dashboard
    document.querySelectorAll(`#dashboard-${role} .tab-content`).forEach(el => el.classList.add('hidden'));
    // Show the selected tab
    document.getElementById(`${role}-${tabName}`).classList.remove('hidden');
    
    // Update active menu item
    document.querySelectorAll(`#dashboard-${role} .menu-item`).forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// =====================================
// COACH-SPECIFIC FUNCTIONS
// =====================================
// Render client list in coach dashboard
function renderCoachClientList() {
    const tbody = document.getElementById('coach-client-list');
    // Generate table rows from appState.clients
    tbody.innerHTML = appState.clients.map(client => `
        <tr>
            <td>
                <div class="flex items-center gap-2">
                    <div style="width:30px;height:30px;background:#ccc;border-radius:50%;"></div>
                    ${client.name}
                </div>
            </td>
            <td>${client.goal}</td>
            <td>${client.lastScan}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="switchTab('coach', 'workout-builder')">Plan</button>
            </td>
        </tr>
    `).join('');
}

// Submit plan form (for workout or nutrition)
function submitPlan(e, type) {
    e.preventDefault(); // Prevent reload
    alert(`${type} Plan assigned successfully to client!`);
    switchTab('coach', 'clients'); // Return to clients tab
}

// =====================================
// RECEPTION-SPECIFIC FUNCTIONS
// =====================================
// Handle new member registration form
function registerMember(e) {
    e.preventDefault(); // Prevent reload
    alert("New Member Registered Successfully! QR Code sent to printer.");
    e.target.reset(); // Clear form
}

// =====================================
// MEMBER-SPECIFIC FUNCTIONS (New Features)
// =====================================
// Run initializations on page load
document.addEventListener('DOMContentLoaded', () => {
    renderMachines(); // Render booking machines
    initChart();      // Initialize progress chart
});

// Machines data (edit here to add/remove machines)
appState.machines = [
    { id: 1, name: "Treadmill X1", type: "Cardio", available: true },
    { id: 2, name: "Bench Press A", type: "Strength", available: true },
    { id: 3, name: "Rowing Machine", type: "Cardio", available: false },
    { id: 4, name: "Cable Crossover", type: "Strength", available: true },
    { id: 5, name: "Leg Press", type: "Strength", available: true },
    { id: 6, name: "Elliptical V2", type: "Cardio", available: true }
];

// Render machines in booking tab
function renderMachines() {
    const container = document.getElementById('machine-list-container');
    container.innerHTML = appState.machines.map(machine => `
        <div class="machine-card">
            <div class="machine-img">
                <i class="fa-solid ${machine.type === 'Cardio' ? 'fa-person-running' : 'fa-dumbbell'} fa-3x"></i>
            </div>
            <div class="machine-info">
                <div class="flex justify-between items-center" style="margin-bottom: 5px;">
                    <h4 class="font-bold">${machine.name}</h4>
                    <span class="machine-status" style="background: ${machine.available ? '#dcee7e' : '#fee2e2'}; color: ${machine.available ? '#365314' : '#991b1b'}">
                        ${machine.available ? 'Available' : 'In Use'}
                    </span>
                </div>
                <p style="font-size: 0.8rem; color: #666;">${machine.type}</p>
                <button class="btn ${machine.available ? 'btn-primary' : 'btn-outline'} w-full" 
                        style="margin-top: 10px;"
                        ${!machine.available ? 'disabled' : ''}
                        onclick="bookMachine(${machine.id})">
                    ${machine.available ? 'Book Now (5 Tokens)' : 'Unavailable'}
                </button>
            </div>
        </div>
    `).join('');
}

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

// Update token display in sidebar
function updateTokenDisplay() {
    document.getElementById('member-token-display').innerText = appState.user.tokens;
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

// Initialize Member Progress Chart
function initChart() {
    const ctx = document.getElementById('memberProgressChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Weight (kg)',
                data: [82, 81.2, 79.8, 78.5],
                borderColor: '#0b4fd4',
                tension: 0.4,
                fill: false
            }, {
                label: 'Muscle Mass (kg)',
                data: [32, 32.5, 33.1, 34.2],
                borderColor: '#a3e221',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}