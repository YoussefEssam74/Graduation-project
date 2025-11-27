// COACH-SPECIFIC FUNCTIONS

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