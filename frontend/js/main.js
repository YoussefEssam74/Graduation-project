// MAIN JS - Coordinates everything

// Import other JS files (since no modules, use script tags in HTML or assume global)
 // Note: In index.html, add <script src="state.js"></script> <script src="utils.js"></script> etc. before main.js

// Function to switch tabs within a dashboard
// Supports two calling styles:
// 1) event-style: switchTab(event, role, tabName)
// 2) inline-style: switchTab(role, tabName)  (used in HTML onclick attributes)
function switchTab(arg1, arg2, arg3) {
    let role, tabName, clickedElem = null;

    if (typeof arg1 === 'string') {
        // called as switchTab('member', 'overview')
        role = arg1;
        tabName = arg2;
    } else {
        // called as switchTab(event, role, tabName)
        const evt = arg1;
        role = arg2;
        tabName = arg3;
        if (evt) clickedElem = evt.currentTarget || (evt.target && evt.target.closest && evt.target.closest('.menu-item'));
    }

    if (!role || !tabName) return;

    // Hide all tabs in the role's dashboard
    document.querySelectorAll(`#dashboard-${role} .tab-content`).forEach(el => el.classList.add('hidden'));
    // Show the selected tab (if it exists)
    const tabEl = document.getElementById(`${role}-${tabName}`);
    if (tabEl) tabEl.classList.remove('hidden');

    // Update active menu item
    const menuItems = Array.from(document.querySelectorAll(`#dashboard-${role} .menu-item`));
    menuItems.forEach(el => el.classList.remove('active'));

    // If we have the clicked element, use it
    if (clickedElem && clickedElem.classList) {
        clickedElem.classList.add('active');
        return;
    }

    // Fallback: try to find the menu item whose onclick references the tabName
    const found = menuItems.find(el => {
        try {
            const attr = el.getAttribute('onclick');
            return attr && attr.includes(tabName);
        } catch (e) { return false; }
    });
    if (found) found.classList.add('active');
}

// Run initializations on page load
document.addEventListener('DOMContentLoaded', () => {
    // Any global init here
});