// DOM Elements with safety checks
const navLinks = document.querySelectorAll('.nav-link');
const windowCards = document.querySelectorAll('.window-card');
const whatsappButton = document.getElementById('whatsappButton');
const timeElement = document.getElementById('time');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;

// Log DOM element status
console.log('DOM Elements Status:');
console.log('- navLinks:', navLinks.length);
console.log('- windowCards:', windowCards.length);
console.log('- whatsappButton:', !!whatsappButton);
console.log('- timeElement:', !!timeElement);
console.log('- themeToggle:', !!themeToggle);
console.log('- themeIcon:', !!themeIcon);

// App State Management
const appState = {
    theme: localStorage.getItem('theme') || 'light',
    openWindows: new Set(),
    windowPositions: {}
};

// Simple Navigation System
function initNavigation() {
    // Set active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Enhanced Draggable and Resizable Windows System
function initDraggableWindows() {
    windowCards.forEach(card => {
        let isDragging = false;
        let isResizing = false;
        let currentX, currentY, initialX, initialY;
        let xOffset = 0, yOffset = 0;
        let initialWidth, initialHeight;
        let resizeDirection = '';

        // Load saved position
        const cardId = card.id || `window-${Math.random().toString(36).substr(2, 9)}`;
        card.id = cardId;
        
        if (appState.windowPositions[cardId]) {
            const pos = appState.windowPositions[cardId];
            card.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
            xOffset = pos.x;
            yOffset = pos.y;
        }

        const dragStart = (e) => {
            if (e.target.classList.contains('resize-handle')) {
                isResizing = true;
                resizeDirection = e.target.dataset.direction;
                initialWidth = card.offsetWidth;
                initialHeight = card.offsetHeight;
                initialX = e.clientX;
                initialY = e.clientY;
                return;
            }

            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === card || card.contains(e.target)) {
                isDragging = true;
                card.classList.add('dragging');
                card.style.zIndex = '1000';
                card.style.cursor = 'grabbing';
            }
        };

        const dragEnd = () => {
            if (isDragging) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                card.classList.remove('dragging');
                card.style.zIndex = '';
                card.style.cursor = 'grab';
                
                // Save position
                appState.windowPositions[cardId] = { x: xOffset, y: yOffset };
                localStorage.setItem('windowPositions', JSON.stringify(appState.windowPositions));
            }
            
            if (isResizing) {
                isResizing = false;
                resizeDirection = '';
            }
            
            card.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                card.style.transition = '';
            }, 300);
        };

        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();

                if (e.type === 'touchmove') {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;
                setTranslate(currentX, currentY, card);
            }
            
            if (isResizing) {
                e.preventDefault();
                const deltaX = e.clientX - initialX;
                const deltaY = e.clientY - initialY;
                
                let newWidth = initialWidth;
                let newHeight = initialHeight;
                
                if (resizeDirection.includes('e')) newWidth += deltaX;
                if (resizeDirection.includes('w')) newWidth -= deltaX;
                if (resizeDirection.includes('s')) newHeight += deltaY;
                if (resizeDirection.includes('n')) newHeight -= deltaY;
                
                // Minimum size constraints
                newWidth = Math.max(300, newWidth);
                newHeight = Math.max(200, newHeight);
                
                card.style.width = `${newWidth}px`;
                card.style.height = `${newHeight}px`;
            }
        };

        const setTranslate = (xPos, yPos, el) => {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        };

        // Add resize handles
        addResizeHandles(card);

        // Mouse events
        card.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // Touch events for mobile
        card.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);

        // Enhanced Window controls with state management
        const closeBtn = card.querySelector('.close');
        const minimizeBtn = card.querySelector('.minimize');
        const maximizeBtn = card.querySelector('.maximize');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                card.style.transform = 'scale(0.8) rotate(10deg)';
                card.style.opacity = '0';
                setTimeout(() => {
                    card.style.display = 'none';
                    appState.openWindows.delete(cardId);
                }, 400);
            });
        }

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                card.style.transform = 'scale(0.7) translateY(50px)';
                card.style.opacity = '0.3';
                card.style.pointerEvents = 'none';
                setTimeout(() => {
                    card.style.transform = 'scale(1) translateY(0)';
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                }, 2000);
            });
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                if (card.classList.contains('maximized')) {
                    card.classList.remove('maximized');
                    card.style.transform = 'scale(1)';
                    card.style.zIndex = '1';
                    card.style.width = '';
                    card.style.height = '';
                } else {
                    card.classList.add('maximized');
                    card.style.transform = 'scale(1.3)';
                    card.style.zIndex = '1000';
                    card.style.width = '90vw';
                    card.style.height = '80vh';
                }
            });
        }
    });
}

// Add resize handles to windows
function addResizeHandles(card) {
    const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
    handles.forEach(direction => {
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.dataset.direction = direction;
        handle.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: var(--accent-primary);
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 10;
        `;
        
        // Position handles
        switch(direction) {
            case 'n': handle.style.top = '0'; handle.style.left = '50%'; handle.style.transform = 'translateX(-50%)'; break;
            case 's': handle.style.bottom = '0'; handle.style.left = '50%'; handle.style.transform = 'translateX(-50%)'; break;
            case 'e': handle.style.right = '0'; handle.style.top = '50%'; handle.style.transform = 'translateY(-50%)'; break;
            case 'w': handle.style.left = '0'; handle.style.top = '50%'; handle.style.transform = 'translateY(-50%)'; break;
            case 'ne': handle.style.top = '0'; handle.style.right = '0'; break;
            case 'nw': handle.style.top = '0'; handle.style.left = '0'; break;
            case 'se': handle.style.bottom = '0'; handle.style.right = '0'; break;
            case 'sw': handle.style.bottom = '0'; handle.style.left = '0'; break;
        }
        
        card.appendChild(handle);
        
        // Show handles on hover
        card.addEventListener('mouseenter', () => {
            handle.style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', () => {
            handle.style.opacity = '0';
        });
    });
}

// Clock Update
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
    timeElement.textContent = timeString;
}

// Enhanced WhatsApp Button with Floating Logic
function initWhatsAppButton() {
    let isVisible = true;
    let lastScrollTop = 0;
    
    // Floating behavior
    function updateWhatsAppVisibility() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Hide on scroll down, show on scroll up
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            if (isVisible) {
                whatsappButton.style.transform = 'translateY(100px)';
                isVisible = false;
            }
        } else if (scrollTop < lastScrollTop || scrollTop < 100) {
            if (!isVisible) {
                whatsappButton.style.transform = 'translateY(0)';
                isVisible = true;
            }
        }
        
        lastScrollTop = scrollTop;
    }
    
    // Throttle scroll events
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateWhatsAppVisibility();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Click handler with animation
    whatsappButton.addEventListener('click', () => {
        // Add click animation
        whatsappButton.style.transform = 'scale(0.9)';
        setTimeout(() => {
            whatsappButton.style.transform = 'scale(1)';
        }, 150);
        
        const phoneNumber = '972585115974'; // Dvir's phone number
        const message = 'Hi! I saw your DeskDev portfolio and would like to discuss a project.';
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    });
    
    // Hover effects
    whatsappButton.addEventListener('mouseenter', () => {
        whatsappButton.style.transform = 'scale(1.1)';
    });
    
    whatsappButton.addEventListener('mouseleave', () => {
        whatsappButton.style.transform = 'scale(1)';
    });
}

// Smooth Scrolling for Navigation
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Window Resize Handler
function handleResize() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Enhanced Theme Toggle System with localStorage
function initThemeToggle() {
    console.log('Initializing theme toggle...');
    
    // Initialize theme from localStorage or default
    const savedTheme = appState.theme;
    console.log('Saved theme:', savedTheme);
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Check if theme toggle element exists
    if (!themeToggle) {
        console.error('Theme toggle element not found!');
        return;
    }
    
    console.log('Theme toggle element found, adding event listener...');
    
    themeToggle.addEventListener('click', () => {
        console.log('Theme toggle clicked!');
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log('Switching from', currentTheme, 'to', newTheme);
        
        // Update app state
        appState.theme = newTheme;
        
        // Update DOM and localStorage
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Add smooth transition effect
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
        
        // Trigger theme change event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        
        console.log('Theme changed successfully to:', newTheme);
    });
    
    console.log('Theme toggle initialized successfully');
}

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
        themeIcon.style.color = '#ffd700';
        themeIcon.style.textShadow = '0 0 10px #ffd700';
    } else {
        themeIcon.className = 'fas fa-moon';
        themeIcon.style.color = '#667eea';
        themeIcon.style.textShadow = '0 0 10px #667eea';
    }
}

// Theme persistence across sessions
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        appState.theme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        // Default to light theme if no preference saved
        appState.theme = 'light';
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeIcon('light');
    }
}

// Modal Window Management
function showProjectsWindow() {
    const projectsPage = document.getElementById('projects');
    if (projectsPage) {
        projectsPage.style.display = 'block';
        projectsPage.style.animation = 'fadeInUp 0.5s ease forwards';
        appState.openWindows.add('projects');
    }
}

function showAboutWindow() {
    const aboutPage = document.getElementById('about');
    if (aboutPage) {
        aboutPage.style.display = 'block';
        aboutPage.style.animation = 'fadeInUp 0.5s ease forwards';
        appState.openWindows.add('about');
    }
}

function hideAllModals() {
    const modalPages = ['projects', 'about'];
    modalPages.forEach(pageId => {
        const page = document.getElementById(pageId);
        if (page && appState.openWindows.has(pageId)) {
            page.style.animation = 'fadeOutDown 0.3s ease forwards';
            setTimeout(() => {
                page.style.display = 'none';
                appState.openWindows.delete(pageId);
            }, 300);
        }
    });
}

// Load saved window positions
function loadWindowPositions() {
    const saved = localStorage.getItem('windowPositions');
    if (saved) {
        try {
            appState.windowPositions = JSON.parse(saved);
        } catch (e) {
            console.warn('Failed to load window positions:', e);
        }
    }
}

// Initialize all functionality
function init() {
            console.log('Initializing DeskDev application...');
    
    // Load saved preferences first
    loadThemePreference();
    console.log('Theme preference loaded');
    
    // Initialize all systems
    initNavigation();
    console.log('Navigation initialized');
    
    initDraggableWindows();
    console.log('Draggable windows initialized');
    
    initWhatsAppButton();
    console.log('WhatsApp button initialized');
    
    initSmoothScrolling();
    console.log('Smooth scrolling initialized');
    
    initThemeToggle();
    console.log('Theme toggle initialized');
    
    // Update clock every second
    updateClock();
    setInterval(updateClock, 1000);
    console.log('Clock initialized');
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    handleResize();
    console.log('Resize handler initialized');
    
    // Add some interactive effects
    addInteractiveEffects();
    console.log('Interactive effects added');
    
    // Listen for theme changes
    window.addEventListener('themeChanged', (e) => {
        console.log('Theme changed to:', e.detail.theme);
    });
    
                    console.log('DeskDev application initialized successfully!');
}

// Add interactive effects
function addInteractiveEffects() {
    // Parallax effect for dashboard
    const dashboard = document.querySelector('.dashboard');
    if (dashboard) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            dashboard.style.transform = `translateY(${rate}px)`;
        });
    }

    // Typing effect for dashboard title
    const dashboardTitle = document.querySelector('.dashboard-title');
    if (dashboardTitle) {
        const text = dashboardTitle.textContent;
        dashboardTitle.textContent = '';
        let charIndex = 0;
        
        const typeChar = () => {
            if (charIndex < text.length) {
                dashboardTitle.textContent += text[charIndex];
                charIndex++;
                setTimeout(typeChar, 100);
            }
        };
        
        setTimeout(typeChar, 500);
    }

    // Animate window cards on load
    windowCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// Add some cool particle effects
function addParticleEffects() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 50;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
        }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    addParticleEffects();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + number for navigation
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const pageIndex = parseInt(e.key) - 1;
        const pages = ['home', 'projects', 'about', 'pricing'];
        const targetPage = pages[pageIndex];
        
        if (targetPage) {
            navLinks.forEach(link => {
                if (link.getAttribute('data-page') === targetPage) {
                    link.click();
                }
            });
        }
    }
    
    // Escape key to close active windows
    if (e.key === 'Escape') {
        const activeWindows = document.querySelectorAll('.window-card');
        activeWindows.forEach(window => {
            if (window.style.transform.includes('scale(1.2)')) {
                window.style.transform = 'scale(1)';
            }
        });
    }
}); 

// Test function to manually toggle theme (for debugging)
function testThemeToggle() {
    console.log('Testing theme toggle...');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    console.log('Current theme:', currentTheme);
    console.log('New theme:', newTheme);
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (themeToggle && themeIcon) {
        updateThemeIcon(newTheme);
    }
    
    console.log('Theme test completed');
}

// Add test function to window for manual testing
window.testThemeToggle = testThemeToggle; 