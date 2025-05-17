/**
 * Navigation Module
 * Handles sidebar navigation, section switching, and responsive behavior
 */

import config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarToggleIcon = document.getElementById('sidebar-toggle-icon');
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const mainContent = document.getElementById('main-content');
    
    // Initialize navigation
    initNavigation();
    
    /**
     * Initialize navigation functionality
     */
    function initNavigation() {
        // Set initial sidebar state from localStorage or default to expanded
        const sidebarState = localStorage.getItem('sidebarState') || 'expanded';
        setSidebarState(sidebarState);
        
        // Add event listeners
        sidebarToggle.addEventListener('click', toggleSidebar);
        
        // Add click event listeners to navigation links
        navLinks.forEach(link => {
            // Set data-title attribute for tooltips when collapsed
            const linkText = link.querySelector('.sidebar-text').textContent;
            link.setAttribute('data-title', linkText);
            
            // Add click event listener
            link.addEventListener('click', handleNavLinkClick);
        });
        
        // Set up fleet alert navigation
        setupFleetAlertNavigation();
        
        // Handle hash changes for direct navigation
        window.addEventListener('hashchange', handleHashChange);
        
        // Check initial hash
        if (window.location.hash) {
            handleHashChange();
        }
    }
    
    /**
     * Set up fleet alert navigation
     */
    function setupFleetAlertNavigation() {
        // Add event listener to the fleet alert "View Details" link
        document.addEventListener('click', function(e) {
            // Check if the clicked element is the fleet alert link
            if (e.target && e.target.closest('a[href="#fleet"]')) {
                e.preventDefault();
                
                // Navigate to the fleet section
                window.location.hash = 'fleet';
                
                // Highlight the fleet section in the sidebar
                navLinks.forEach(link => {
                    const linkSectionId = link.getAttribute('data-section');
                    link.classList.toggle('active', linkSectionId === 'fleet');
                });
            }
        });
    }
    
    /**
     * Toggle sidebar between expanded and collapsed states
     */
    function toggleSidebar() {
        const isExpanded = sidebar.classList.contains('sidebar-expanded');
        const newState = isExpanded ? 'collapsed' : 'expanded';
        
        setSidebarState(newState);
        localStorage.setItem('sidebarState', newState);
    }
    
    /**
     * Set sidebar state (expanded or collapsed)
     * @param {string} state - 'expanded' or 'collapsed'
     */
    function setSidebarState(state) {
        if (state === 'collapsed') {
            sidebar.classList.remove('sidebar-expanded');
            sidebar.classList.add('sidebar-collapsed');
            sidebarToggleIcon.classList.remove('fa-chevron-left');
            sidebarToggleIcon.classList.add('fa-chevron-right');
        } else {
            sidebar.classList.remove('sidebar-collapsed');
            sidebar.classList.add('sidebar-expanded');
            sidebarToggleIcon.classList.remove('fa-chevron-right');
            sidebarToggleIcon.classList.add('fa-chevron-left');
        }
    }
    
    /**
     * Handle navigation link click
     * @param {Event} e - Click event
     */
    function handleNavLinkClick(e) {
        e.preventDefault();
        
        // Get section ID from data attribute
        const sectionId = this.getAttribute('data-section');
        
        // Update URL hash without scrolling
        const scrollPosition = window.scrollY;
        window.location.hash = sectionId;
        window.scrollTo(0, scrollPosition);
        
        // Switch to the selected section
        switchSection(sectionId);
        
        // On mobile, close sidebar after navigation
        if (window.innerWidth < 768) {
            sidebar.classList.remove('sidebar-mobile-open');
        }
    }
    
    /**
     * Handle hash change for direct navigation
     */
    function handleHashChange() {
        // Get section ID from hash (remove # symbol)
        const hash = window.location.hash.substring(1);
        
        if (hash) {
            switchSection(hash);
        } else {
            // Default to dashboard if no hash
            switchSection('dashboard');
        }
    }
    
    /**
     * Switch active section
     * @param {string} sectionId - ID of the section to activate
     */
    function switchSection(sectionId) {
        // Update active navigation link
        navLinks.forEach(link => {
            const linkSectionId = link.getAttribute('data-section');
            
            if (linkSectionId === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Update active content section
        contentSections.forEach(section => {
            if (section.id === `${sectionId}-section`) {
                section.classList.add('active');
                
                // Handle lazy loading for PowerBI iframe
                if (sectionId === 'fleet') {
                    lazyLoadPowerBIIframe();
                }
            } else {
                section.classList.remove('active');
            }
        });
    }
    
    /**
     * Lazy load PowerBI iframe when Fleet Analysis section is active
     */
    function lazyLoadPowerBIIframe() {
        const iframe = document.getElementById('powerbi-iframe');
        
        if (iframe && !iframe.classList.contains('loaded')) {
            // Add loaded class to prevent reloading
            iframe.classList.add('iframe-lazy-load');
            iframe.classList.add('loaded');
            
            // Add event listener for iframe load
            iframe.addEventListener('load', function() {
                iframe.classList.add('loaded');
                console.log('PowerBI iframe loaded successfully');
            });
            
            // Force iframe to reload if needed
            const src = iframe.getAttribute('src');
            if (src) {
                console.log('Loading PowerBI iframe from:', src);
            }
        }
    }
    
    /**
     * Handle mobile navigation
     * Add event listener for mobile menu button to show/hide sidebar
     */
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-mobile-open');
        });
    }
    
    /**
     * Close sidebar when clicking outside on mobile
     */
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 768 && 
            !sidebar.contains(e.target) && 
            !mobileMenuButton.contains(e.target) && 
            sidebar.classList.contains('sidebar-mobile-open')) {
            sidebar.classList.remove('sidebar-mobile-open');
        }
    });
    
    /**
     * Handle window resize
     * Reset mobile-specific classes when resizing to desktop
     */
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            sidebar.classList.remove('sidebar-mobile-open');
        }
    });
});
