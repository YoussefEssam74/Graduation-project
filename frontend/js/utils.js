// UTILITY FUNCTIONS

// Update token display in sidebar
function updateTokenDisplay() {
    document.getElementById('member-token-display').innerText = appState.user.tokens;
}

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