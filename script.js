// Testimonial Tab Progress Bar Animation
// This script animates the progress bar from 0% to 100% over 5 seconds when a tab is active
// Also includes automatic tab switching after 5 seconds


// Wait for both DOM content and Finsweet List Tabs to be ready
let isInitialized = false; // Prevent multiple initializations

document.addEventListener('DOMContentLoaded', function() {
    // Try to initialize immediately
    initProgressBarAnimation();
    
    // Also set up a fallback for Finsweet List Tabs
    setupFinsweetCompatibility();
});

// Finsweet List Tabs compatibility
function setupFinsweetCompatibility() {
    // Method 1: Hook into Finsweet's lifecycle directly
    if (window.fsAttributes && window.fsAttributes.list) {
        // Override the init method to run our code after Finsweet finishes
        const originalInit = window.fsAttributes.list.init;
        window.fsAttributes.list.init = function(...args) {
            const result = originalInit.apply(this, args);
            
            // Wait for Finsweet to complete its DOM manipulation
            setTimeout(() => {
                initProgressBarAnimation();
                isInitialized = true;
            }, 1500);
            
            return result;
        };
        
        // Also hook into the update method for dynamic changes
        if (window.fsAttributes.list.update) {
            const originalUpdate = window.fsAttributes.list.update;
            window.fsAttributes.list.update = function(...args) {
                const result = originalUpdate.apply(this, args);
                
                setTimeout(() => {
                    window.testimonialProgressBar.reinit();
                }, 1000);
                
                return result;
            };
        }
    }
    
    // Method 2: Watch for specific Finsweet DOM patterns
    const watchForFinsweetTabs = () => {
        // Look for Finsweet's specific DOM structure
        const finsweetTabs = document.querySelectorAll('[data-fs-list-element="tabs"] .w-tab');
        const customTabLinks = document.querySelectorAll('.test_tab_link');
        
        if (finsweetTabs.length > 0 || customTabLinks.length > 0) {
            // Check if tab panes have content
            const tabPanes = document.querySelectorAll('.w-tab-pane, .test_tab_pane');
            let hasContent = false;
            
            tabPanes.forEach(pane => {
                if (pane.children.length > 0 && pane.textContent.trim() !== '') {
                    hasContent = true;
                }
            });
            
            if (hasContent) {
                initProgressBarAnimation();
                isInitialized = true;
                return true;
            } else {
                return false;
            }
        }
        return false;
    };
    
    // Method 3: Enhanced MutationObserver with Finsweet-specific targeting
    const tabsContainer = document.querySelector('[fs-list-element="tabs"]') || 
                         document.querySelector('[data-fs-list-element="tabs"]');
    
    if (tabsContainer) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // Check for both Finsweet-generated tabs and our custom elements
                    if (watchForFinsweetTabs()) {
                        observer.disconnect();
                    }
                }
            });
        });
        
        observer.observe(tabsContainer, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
        
        // Also watch for Webflow's tab initialization
        const webflowObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('w-tab') || target.classList.contains('w--current')) {
                        if (watchForFinsweetTabs()) {
                            webflowObserver.disconnect();
                        }
                    }
                }
            });
        });
        
        webflowObserver.observe(document.body, { 
            subtree: true, 
            attributes: true,
            attributeFilter: ['class']
        });
    }
    
    // Method 4: Aggressive polling with better detection
    let attempts = 0;
    const maxAttempts = 60; // Try for 30 seconds (increased for content loading)
    
    const aggressiveCheck = setInterval(() => {
        attempts++;
        
        if (watchForFinsweetTabs()) {
            clearInterval(aggressiveCheck);
        } else if (attempts >= maxAttempts) {
            clearInterval(aggressiveCheck);
        }
    }, 500);
    
    // Method 5: Listen for Finsweet's custom events if they exist
    document.addEventListener('fs-list-ready', function() {
        setTimeout(() => {
            watchForFinsweetTabs();
        }, 500);
    });
    
    // Method 6: Watch for Webflow's tab system to be ready
    const checkWebflowTabs = setInterval(() => {
        const webflowTabs = document.querySelectorAll('.w-tab');
        if (webflowTabs.length > 0) {
            clearInterval(checkWebflowTabs);
            setTimeout(() => {
                watchForFinsweetTabs();
            }, 1000);
        }
    }, 200);
    
    // Method 7: Watch for content changes in tab panes
    const contentObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if content was added to tab panes
                const tabPanes = document.querySelectorAll('.w-tab-pane, .test_tab_pane');
                let hasNewContent = false;
                
                tabPanes.forEach(pane => {
                    if (pane.children.length > 0 && pane.textContent.trim() !== '') {
                        hasNewContent = true;
                    }
                });
                
                if (hasNewContent) {
                    setTimeout(() => {
                        watchForFinsweetTabs();
                    }, 200);
                }
            }
        });
    });
    
    // Observe the entire document for content changes
    contentObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    // Method 8: Force first tab activation to trigger content loading
    setTimeout(() => {
        const firstTab = document.querySelector('.w-tab, .test_tab_link');
        if (firstTab && !firstTab.classList.contains('w--current')) {
            firstTab.click();
        }
    }, 2000); // Wait 2 seconds for Finsweet to finish initial setup
}

function initProgressBarAnimation() {
    // Prevent multiple simultaneous initializations
    if (isInitialized && document.querySelectorAll('.test_tab_link, [fs-list-element="tabs"] .w-tab, .w-tab').length > 0) {
        return;
    }
    
    // Try multiple selectors to find tab links (Finsweet compatibility)
    let tabLinks = document.querySelectorAll('.test_tab_link');
    
    // If no custom class found, try Finsweet's generated structure
    if (tabLinks.length === 0) {
        tabLinks = document.querySelectorAll('[fs-list-element="tabs"] .w-tab');
        
        if (tabLinks.length === 0) {
            // Try other possible selectors
            tabLinks = document.querySelectorAll('.w-tab');
        }
    }
    
    if (tabLinks.length === 0) {
        return;
    }
    
    // Reset all progress bars first
    resetAllProgressBars();
    
    // Set up initial state and event listeners
    tabLinks.forEach((tabLink, index) => {
        // Add click event listener to each tab
        tabLink.addEventListener('click', function() {
            // Stop automatic switching when user manually clicks
            stopAutoSwitch();
            
            // Wait a bit for Webflow to add the .w--current class
            setTimeout(() => {
                updateProgressBars();
                // Start auto-switch timer for the newly clicked tab
                startAutoSwitchTimer();
            }, 100);
        });
    });
    
    // Set up a mutation observer to watch for class changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                updateProgressBars();
            }
        });
    });
    
    // Observe all tab links for class changes
    tabLinks.forEach(tabLink => {
        observer.observe(tabLink, { attributes: true });
        });
    
    // Set up hover pause functionality for tab panes
    setupHoverPause();
    
    // Initial update
    updateProgressBars();
    
    // Start automatic switching
    startAutoSwitchTimer();
}

function updateProgressBars() {
    // Try multiple selectors to find tab links
    let tabLinks = document.querySelectorAll('.test_tab_link');
    if (tabLinks.length === 0) {
        tabLinks = document.querySelectorAll('[fs-list-element="tabs"] .w-tab');
    }
    if (tabLinks.length === 0) {
        tabLinks = document.querySelectorAll('.w-tab');
    }
    
    tabLinks.forEach((tabLink, index) => {
        // Try multiple ways to find the progress bar
        let progressBar = tabLink.querySelector('#progress_bar');
        
        if (!progressBar) {
            // Try looking for progress bar by class or other attributes
            progressBar = tabLink.querySelector('.progress_bar, [data-progress-bar], .w-tab-content #progress_bar');
        }
        
        if (!progressBar) {
            return;
        }
        
        const isActive = tabLink.classList.contains('w--current');
        
        if (isActive) {
            // Kill any existing animation on this progress bar
            gsap.killTweensOf(progressBar);
            
            // Check if this progress bar was paused
            if (pausedProgressBars.has(progressBar)) {
                const pausedData = pausedProgressBars.get(progressBar);
                const remainingTime = pausedData.remainingTime;
                const currentWidth = pausedData.currentWidth;
                
                // Ensure we start from the exact paused position
                gsap.set(progressBar, { width: currentWidth + '%' });
                
                // Resume animation from current width to 100% with remaining time
                gsap.to(progressBar, {
                    width: '100%',
                    duration: remainingTime,
                    //ease: 'power2.out'
                });
                
                // Remove from paused list
                pausedProgressBars.delete(progressBar);
            } else {
                // Start new animation from 0% to 100% over 5 seconds
                gsap.to(progressBar, {
                    width: '100%',
                    duration: 5,
                    ease: 'power2.out'
                });
            }
        } else {
            // Kill any existing animation and reset progress bar to 0% immediately
            gsap.killTweensOf(progressBar);
            gsap.set(progressBar, { width: '0%' });
            // Remove from paused list if it was there
            pausedProgressBars.delete(progressBar);
        }
    });
}

// Alternative approach using setInterval for more precise control
function startProgressBarAnimation(progressBar) {
    // Kill any existing animation
    gsap.killTweensOf(progressBar);
    
    // Reset to 0%
    gsap.set(progressBar, { width: '0%' });
    
    // Animate to 100% over 5 seconds
    gsap.to(progressBar, {
        width: '100%',
        duration: 5,
        ease: 'power2.out'
    });
}

// Function to reset all progress bars
function resetAllProgressBars() {
    const progressBars = document.querySelectorAll('#progress_bar');
    progressBars.forEach(bar => {
        // Kill any existing animations first
        gsap.killTweensOf(bar);
        // Reset to 0% width
        gsap.set(bar, { width: '0%' });
    });
}

// Hover pause functionality
function setupHoverPause() {
    // Find all tab panes
    let tabPanes = document.querySelectorAll('.test_tab_pane');
    
    // If no custom class found, try Finsweet's generated structure
    if (tabPanes.length === 0) {
        tabPanes = document.querySelectorAll('[fs-list-element="tabs"] .w-tab-pane');
    }
    if (tabPanes.length === 0) {
        tabPanes = document.querySelectorAll('.w-tab-pane');
    }
    
    if (tabPanes.length === 0) {
        return;
    }
    
    tabPanes.forEach((pane, index) => {
        // Pause auto-switching on hover
        pane.addEventListener('mouseenter', function() {
            isPaused = true;
            stopAutoSwitch();
            pauseProgressBars();
        });
        
        // Resume auto-switching when mouse leaves
        pane.addEventListener('mouseleave', function() {
            isPaused = false;
            
            // Small delay to ensure DOM is ready, then resume progress bars
            setTimeout(() => {
                resumeProgressBars();
            }, 50);
            
            // Start timer for current active tab
            startAutoSwitchTimer();
        });
    });
}

// Pause all active progress bar animations
function pauseProgressBars() {
    // Find all active progress bars
    let tabLinks = document.querySelectorAll('.test_tab_link');
    if (tabLinks.length === 0) {
        tabLinks = document.querySelectorAll('[fs-list-element="tabs"] .w-tab');
    }
    if (tabLinks.length === 0) {
        tabLinks = document.querySelectorAll('.w-tab');
    }
    
    tabLinks.forEach((tabLink, index) => {
        const progressBar = tabLink.querySelector('#progress_bar') || 
                           tabLink.querySelector('.progress_bar') || 
                           tabLink.querySelector('[data-progress-bar]') ||
                           tabLink.querySelector('.w-tab-content #progress_bar');
        
        if (progressBar && tabLink.classList.contains('w--current')) {
            // Get current animation state - use getBoundingClientRect for more accurate measurement
            const progressBarRect = progressBar.getBoundingClientRect();
            const parentRect = progressBar.parentElement.getBoundingClientRect();
            const currentWidth = (progressBarRect.width / parentRect.width) * 100;
            const remainingTime = Math.max(0.1, 5 * (1 - currentWidth / 100)); // Ensure minimum time
            
            // Kill current animation
            gsap.killTweensOf(progressBar);
            
            // Store paused state
            pausedProgressBars.set(progressBar, {
                currentWidth: currentWidth,
                remainingTime: remainingTime
            });
            
            // Ensure the progress bar stays at current width
            gsap.set(progressBar, { width: currentWidth + '%' });
        }
    });
}

// Resume all paused progress bar animations
function resumeProgressBars() {
    // Find the currently active tab and resume its progress bar
    let tabLinks = document.querySelectorAll('.test_tab_link');
    if (tabLinks.length === 0) {
        tabLinks = document.querySelectorAll('[fs-list-element="tabs"] .w-tab');
    }
    if (tabLinks.length === 0) {
        tabLinks = document.querySelectorAll('.w-tab');
    }
    
    tabLinks.forEach((tabLink, index) => {
        if (tabLink.classList.contains('w--current')) {
            const progressBar = tabLink.querySelector('#progress_bar') || 
                               tabLink.querySelector('.progress_bar') || 
                               tabLink.querySelector('[data-progress-bar]') ||
                               tabLink.querySelector('.w-tab-content #progress_bar');
            
            if (progressBar && pausedProgressBars.has(progressBar)) {
                const pausedData = pausedProgressBars.get(progressBar);
                const remainingTime = pausedData.remainingTime;
                const currentWidth = pausedData.currentWidth;
                
                // Ensure we start from the exact paused position
                gsap.set(progressBar, { width: currentWidth + '%' });
                
                // Resume animation from current width to 100% with remaining time
                gsap.to(progressBar, {
                    width: '100%',
                    duration: remainingTime,
                    ease: 'power2.out'
                });
                
                // Remove from paused list
                pausedProgressBars.delete(progressBar);
            }
        }
    });
    
    // Also force update as backup
    setTimeout(() => {
        updateProgressBars();
    }, 100);
}

// Auto-switching functionality
let autoSwitchTimer = null;
let autoSwitchInterval = null;
let isPaused = false; // Track if auto-switching is paused
let pausedProgressBars = new Map(); // Track paused progress bars and their remaining time

function startAutoSwitchTimer() {
    // Clear any existing timer
    stopAutoSwitch();
    
    // Only start timer if not paused
    if (!isPaused) {
        // Set timer for 5 seconds (same as progress bar duration)
        autoSwitchTimer = setTimeout(() => {
            switchToNextTab();
        }, 5000);
    }
}

function stopAutoSwitch() {
    if (autoSwitchTimer) {
        clearTimeout(autoSwitchTimer);
        autoSwitchTimer = null;
    }
    if (autoSwitchInterval) {
        clearInterval(autoSwitchInterval);
        autoSwitchInterval = null;
    }
}

function switchToNextTab() {
    const tabLinks = document.querySelectorAll('.test_tab_link');
    const currentTabIndex = Array.from(tabLinks).findIndex(tab => 
        tab.classList.contains('w--current')
    );
    
    if (currentTabIndex === -1) return;
    
    // Calculate next tab index (loop back to first if at last tab)
    const nextTabIndex = (currentTabIndex + 1) % tabLinks.length;
    
    // Simulate click on next tab
    const nextTab = tabLinks[nextTabIndex];
    if (nextTab) {
        nextTab.click();
    }
}

// Export functions for potential external use
window.testimonialProgressBar = {
    init: initProgressBarAnimation,
    reset: resetAllProgressBars,
    update: updateProgressBars,
    startAutoSwitch: startAutoSwitchTimer,
    stopAutoSwitch: stopAutoSwitch,
    switchToNextTab: switchToNextTab,
    pauseAutoSwitch: function() {
        isPaused = true;
        stopAutoSwitch();
        pauseProgressBars();
    },
    resumeAutoSwitch: function() {
        isPaused = false;
        resumeProgressBars();
        startAutoSwitchTimer();
    },
    reinit: function() {
        // Reinitialize the system (useful when Finsweet updates tabs)
        stopAutoSwitch();
        resetAllProgressBars();
        isInitialized = false; // Reset flag to allow reinitialization
        initProgressBarAnimation();
        isInitialized = true;
    }
};

// Listen for Finsweet list updates (filtering, sorting, etc.)
if (window.fsAttributes && window.fsAttributes.list && window.fsAttributes.list.update) {
    // Override the list update method to reinitialize our system
    const originalUpdate = window.fsAttributes.list.update;
    window.fsAttributes.list.update = function(...args) {
        const result = originalUpdate.apply(this, args);
        // Reinitialize our system after Finsweet updates
        setTimeout(() => {
            if (window.testimonialProgressBar && window.testimonialProgressBar.reinit) {
                window.testimonialProgressBar.reinit();
            }
        }, 500);
        return result;
    };
}