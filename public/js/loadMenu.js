document.addEventListener("DOMContentLoaded", () => {
    // Look for the placeholder div in the HTML
    const sidebarContainer = document.getElementById('sidebar-container');
    
    if (sidebarContainer) {
        // Fetch the shared menu file
        fetch('/menu.html')
            .then(response => response.text())
            .then(data => {
                // Inject the HTML
                sidebarContainer.innerHTML = data;
                
                // Dispatch a custom event to let other scripts know the menu is ready
                document.dispatchEvent(new Event('menuLoaded'));
            })
            .catch(error => console.error('Error loading menu:', error));
    }
});