// AUTH FUNCTIONS

// Function to select role on login page
// Accepts either the button element (`this`) or an Event object as first parameter
// Updates buttons and form fields based on role
function selectRole(elOrEvent, role) {
    appState.currentUserRole = role;
    // Remove active class from all role buttons
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));

    // Determine the button element that was clicked
    let btn = null;
    try {
        if (!elOrEvent) btn = null;
        else if (elOrEvent instanceof Event) {
            btn = elOrEvent.currentTarget || (elOrEvent.target && elOrEvent.target.closest('.role-btn'));
        } else if (elOrEvent instanceof HTMLElement) {
            btn = elOrEvent;
        } else if (elOrEvent && elOrEvent.target) {
            // fallback: maybe an object with target
            btn = elOrEvent.target.closest ? elOrEvent.target.closest('.role-btn') : null;
        }
    } catch (err) {
        btn = null;
    }

    // Add active to selected button (if found)
    if (btn && btn.classList) btn.classList.add('active');

    // Update login title and email placeholder based on role
    const title = document.getElementById('login-title');
    const emailInput = document.querySelector('#login-form input[type="email"]');

    if(role === 'coach') {
        title.innerText = "Coach Login";
        if (emailInput) emailInput.value = "coach@intellifit.com";
    } else if(role === 'reception') {
        title.innerText = "Reception Login";
        if (emailInput) emailInput.value = "reception@intellifit.com";
    } else {
        title.innerText = "Member Login";
        if (emailInput) emailInput.value = "user@intellifit.com";
    }
}

// Function to handle login form submission
// Hides auth screen, shows header and dashboard
function handleLogin(e) {
    e.preventDefault(); // Prevent form reload
    document.getElementById('auth-section').classList.add('hidden'); // Hide login
    document.getElementById('app-header').classList.remove('hidden'); // Show header
    document.getElementById('app-header').classList.add('flex');
    
    // Update role badge in header
    document.getElementById('user-role-badge').innerText = appState.currentUserRole.toUpperCase();

    // Dynamically load the dashboard HTML
    const dashboardPath = `pages/${appState.currentUserRole}.html`;
    fetch(dashboardPath)
        .then(response => response.text())
        .then(html => {
            document.getElementById('dashboard-container').innerHTML = html;
            // Initialize role-specific views after loading
            if(appState.currentUserRole === 'coach') renderCoachClientList();
            if(appState.currentUserRole === 'member') {
                renderMachines();
                initChart();
                updateTokenDisplay();
            }
            // Show the default tab
            switchTab(appState.currentUserRole, appState.currentUserRole === 'coach' ? 'clients' : appState.currentUserRole === 'reception' ? 'live' : 'overview');
        })
        .catch(error => console.error('Error loading dashboard:', error));
}

// Function to logout and reset app
function logout() {
    location.reload(); // Reload page to reset
}