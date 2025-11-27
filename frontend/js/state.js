// APP STATE MANAGEMENT
// Global state object to hold app data (roles, users, etc.)
// Edit here to add more data like users or machines
const appState = {
    currentUserRole: 'member', // Default role: 'member', 'coach', or 'reception'
    user: {
        tokens: 120   // starting token count
    },
    clients: [                 // List of clients for coach (edit or add more)
        { name: "Jane Doe", goal: "Weight Loss", lastScan: "Oct 24", status: "Active" },
        { name: "Ahmed Ali", goal: "Muscle Gain", lastScan: "Oct 20", status: "Pending Plan" },
        { name: "Sarah Connor", goal: "Endurance", lastScan: "Oct 22", status: "Active" }
    ],
    machines: [
        { id: 1, name: "Treadmill X1", type: "Cardio", available: true },
        { id: 2, name: "Bench Press A", type: "Strength", available: true },
        { id: 3, name: "Rowing Machine", type: "Cardio", available: false },
        { id: 4, name: "Cable Crossover", type: "Strength", available: true },
        { id: 5, name: "Leg Press", type: "Strength", available: true },
        { id: 6, name: "Elliptical V2", type: "Cardio", available: true }
    ]
};