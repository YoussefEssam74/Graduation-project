// RECEPTION-SPECIFIC FUNCTIONS

// Handle new member registration form
function registerMember(e) {
    e.preventDefault(); // Prevent reload
    alert("New Member Registered Successfully! QR Code sent to printer.");
    e.target.reset(); // Clear form
}