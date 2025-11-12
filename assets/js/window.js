// Window System - Creates draggable, resizable windows for links with class "window"

class WindowManager {
    constructor() {
        this.windows = [];
        this.zIndexCounter = 1000;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.attachWindowTriggers();
        });
    }

    attachWindowTriggers() {
        const windowLinks = document.querySelectorAll('a.window');
        
        windowLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = link.getAttribute('href');
                const title = link.textContent.trim();
                this.createWindow(url, title);
            });
        });
    }

    createWindow(url, title) {
        const windowId = `window-${Date.now()}`;
        const isMobile = window.innerWidth <= 800;
        
        // Create window container
        const windowElement = document.createElement('div');
        windowElement.className = 'app-window';
        windowElement.id = windowId;
        windowElement.style.zIndex = ++this.zIndexCounter;
        
        // Create window structure
        windowElement.innerHTML = `
            <div class="window-header">
                <div class="window-title">${title}</div>
                <div class="window-controls">
                    ${!isMobile ? `<button class="window-btn window-fullscreen" title="Toggle Fullscreen">
                        <i class="fa-solid fa-expand"></i>
                    </button>` : ''}
                    <button class="window-btn window-close" title="Close">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            <div class="window-content">
                <iframe src="${url}" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
        
        document.body.appendChild(windowElement);
        
        // Add window to tracking array
        const windowObj = {
            id: windowId,
            element: windowElement,
            isFullscreen: isMobile, // Mobile starts fullscreen
            isDragging: false,
            dragOffset: { x: 0, y: 0 }
        };
        
        this.windows.push(windowObj);
        
        // Attach event listeners
        this.attachWindowEvents(windowObj);
        
        // Animate in
        setTimeout(() => {
            windowElement.classList.add('visible');
        }, 10);
        
        // Center the window (desktop only)
        if (!isMobile) {
            this.centerWindow(windowElement);
        }
    }

    centerWindow(windowElement) {
        const rect = windowElement.getBoundingClientRect();
        const left = (window.innerWidth - rect.width) / 2;
        const top = (window.innerHeight - rect.height) / 2;
        
        windowElement.style.left = `${Math.max(0, left)}px`;
        windowElement.style.top = `${Math.max(0, top)}px`;
    }

    attachWindowEvents(windowObj) {
        const { element } = windowObj;
        const header = element.querySelector('.window-header');
        const closeBtn = element.querySelector('.window-close');
        const fullscreenBtn = element.querySelector('.window-fullscreen');
        
        // Bring to front on click
        element.addEventListener('mousedown', () => {
            this.bringToFront(windowObj);
        });
        
        // Close button
        closeBtn.addEventListener('click', () => {
            this.closeWindow(windowObj);
        });
        
        // Fullscreen toggle (desktop only)
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen(windowObj);
            });
        }
        
        // Dragging functionality (desktop only)
        const isMobile = window.innerWidth <= 800;
        if (!isMobile) {
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('.window-btn')) return;
                if (windowObj.isFullscreen) return;
                
                this.startDrag(windowObj, e);
            });
            
            document.addEventListener('mousemove', (e) => {
                if (windowObj.isDragging) {
                    this.drag(windowObj, e);
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (windowObj.isDragging) {
                    this.stopDrag(windowObj);
                }
            });
            
            // Prevent text selection while dragging
            header.addEventListener('selectstart', (e) => {
                if (windowObj.isDragging) {
                    e.preventDefault();
                }
            });
        }
    }

    startDrag(windowObj, e) {
        windowObj.isDragging = true;
        windowObj.element.classList.add('dragging');
        
        const rect = windowObj.element.getBoundingClientRect();
        windowObj.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this.bringToFront(windowObj);
    }

    drag(windowObj, e) {
        if (!windowObj.isDragging) return;
        
        let left = e.clientX - windowObj.dragOffset.x;
        let top = e.clientY - windowObj.dragOffset.y;
        
        // Constrain to viewport
        const rect = windowObj.element.getBoundingClientRect();
        const maxLeft = window.innerWidth - rect.width;
        const maxTop = window.innerHeight - rect.height;
        
        left = Math.max(0, Math.min(left, maxLeft));
        top = Math.max(0, Math.min(top, maxTop));
        
        windowObj.element.style.left = `${left}px`;
        windowObj.element.style.top = `${top}px`;
    }

    stopDrag(windowObj) {
        windowObj.isDragging = false;
        windowObj.element.classList.remove('dragging');
    }

    toggleFullscreen(windowObj) {
        windowObj.isFullscreen = !windowObj.isFullscreen;
        const icon = windowObj.element.querySelector('.window-fullscreen i');
        
        if (windowObj.isFullscreen) {
            windowObj.element.classList.add('fullscreen');
            icon.className = 'fa-solid fa-compress';
        } else {
            windowObj.element.classList.remove('fullscreen');
            icon.className = 'fa-solid fa-expand';
            
            // Recenter after exiting fullscreen
            setTimeout(() => {
                this.centerWindow(windowObj.element);
            }, 50);
        }
    }

    closeWindow(windowObj) {
        windowObj.element.classList.remove('visible');
        
        setTimeout(() => {
            windowObj.element.remove();
            this.windows = this.windows.filter(w => w.id !== windowObj.id);
        }, 300);
    }

    bringToFront(windowObj) {
        windowObj.element.style.zIndex = ++this.zIndexCounter;
    }
}

// Initialize the window manager
const windowManager = new WindowManager();

