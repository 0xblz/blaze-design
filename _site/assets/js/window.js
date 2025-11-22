// Shared z-index counter across all draggable elements
let sharedZIndexCounter = 100;

// Global drag state - used to coordinate with other systems like selection
window.isDraggingAnything = false;

// Shared Draggable Base Class
class DraggableBase {
    constructor() {
        // Use shared z-index counter
    }

    isMobile() {
        return window.innerWidth <= 800;
    }

    setupDragListeners(obj, element, dragHandle, shouldDrag) {
        const mouseMoveHandler = (e) => {
            if (obj.isDragging) {
                this.drag(obj, e);
            }
        };

        const mouseUpHandler = () => {
            if (obj.isDragging) {
                this.stopDrag(obj);
            }
        };

        dragHandle.addEventListener('mousedown', (e) => {
            if (shouldDrag && shouldDrag(e)) return;
            this.startDrag(obj, e);
        });

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);

        // Prevent text selection while dragging
        dragHandle.addEventListener('selectstart', (e) => {
            if (obj.isDragging) {
                e.preventDefault();
            }
        });
    }

    drag(obj, e) {
        if (!obj.isDragging) return;

        let left = e.clientX - obj.dragOffset.x;
        let top = e.clientY - obj.dragOffset.y;

        obj.element.style.left = `${left}px`;
        obj.element.style.top = `${top}px`;
    }

    stopDrag(obj) {
        obj.isDragging = false;
        obj.element.style.cursor = obj.cursor || 'move';
        window.isDraggingAnything = false;
    }

    bringToFront(obj) {
        obj.element.style.zIndex = ++sharedZIndexCounter;
    }
}

// Window Manager - Draggable app windows
class WindowManager extends DraggableBase {
    constructor() {
        super();
        this.windows = [];
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
                const img = link.querySelector('img');
                const imageSrc = img ? img.getAttribute('src') : '';
                this.createWindow(url, title, imageSrc);
            });
        });
    }

    createWindow(url, title, image = '') {
        // Check if a window with this URL already exists
        const existingWindow = this.windows.find(w => w.url === url);
        if (existingWindow) {
            // Bring existing window to front instead of creating a new one
            this.bringToFront(existingWindow);
            return;
        }
        
        const windowId = `window-${Date.now()}`;
        const isMobile = this.isMobile();
        
        // Create window container
        const windowElement = document.createElement('div');
        windowElement.className = 'app-window';
        windowElement.id = windowId;
        windowElement.style.zIndex = ++sharedZIndexCounter;
        
        // Create window structure
        windowElement.innerHTML = `
            <div class="window-header">
                <h3 class="window-title"><img src="${image}" alt="${title}">${title}</h3>
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
            ${!isMobile ? `
                <div class="resize-handle resize-n"></div>
                <div class="resize-handle resize-s"></div>
                <div class="resize-handle resize-e"></div>
                <div class="resize-handle resize-w"></div>
                <div class="resize-handle resize-ne"></div>
                <div class="resize-handle resize-nw"></div>
                <div class="resize-handle resize-se"></div>
                <div class="resize-handle resize-sw"></div>
            ` : ''}
        `;
        
        document.body.appendChild(windowElement);
        
        // Add window to tracking array
        const windowObj = {
            id: windowId,
            url: url,
            element: windowElement,
            isFullscreen: isMobile,
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            isResizing: false,
            resizeDirection: null,
            resizeStart: { x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 }
        };
        
        this.windows.push(windowObj);
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
        
        // Bring to front on click and stop propagation to prevent interference with selection
        element.addEventListener('mousedown', (e) => {
            this.bringToFront(windowObj);
            e.stopPropagation();
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
        if (!this.isMobile()) {
            this.setupDragListeners(
                windowObj,
                element,
                header,
                (e) => e.target.closest('.window-btn') || windowObj.isFullscreen
            );
            this.setupResizeListeners(windowObj);
        }
    }

    setupResizeListeners(windowObj) {
        const resizeHandles = windowObj.element.querySelectorAll('.resize-handle');
        
        const mouseMoveHandler = (e) => {
            if (windowObj.isResizing) {
                this.resize(windowObj, e);
            }
        };

        const mouseUpHandler = () => {
            if (windowObj.isResizing) {
                this.stopResize(windowObj);
            }
        };

        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (windowObj.isFullscreen) return;
                e.preventDefault();
                e.stopPropagation();
                
                const direction = handle.className.replace('resize-handle resize-', '');
                this.startResize(windowObj, e, direction);
            });
        });

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }

    startResize(windowObj, e, direction) {
        windowObj.isResizing = true;
        windowObj.resizeDirection = direction;
        window.isDraggingAnything = true;
        windowObj.element.classList.add('resizing');
        
        const rect = windowObj.element.getBoundingClientRect();
        windowObj.resizeStart = {
            x: e.clientX,
            y: e.clientY,
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top
        };
        
        this.bringToFront(windowObj);
    }

    resize(windowObj, e) {
        if (!windowObj.isResizing) return;
        
        const deltaX = e.clientX - windowObj.resizeStart.x;
        const deltaY = e.clientY - windowObj.resizeStart.y;
        const direction = windowObj.resizeDirection;
        
        const minWidth = 300;
        const minHeight = 200;
        
        let newWidth = windowObj.resizeStart.width;
        let newHeight = windowObj.resizeStart.height;
        let newLeft = windowObj.resizeStart.left;
        let newTop = windowObj.resizeStart.top;
        
        // Handle horizontal resizing
        if (direction.includes('e')) {
            newWidth = Math.max(minWidth, windowObj.resizeStart.width + deltaX);
        } else if (direction.includes('w')) {
            newWidth = Math.max(minWidth, windowObj.resizeStart.width - deltaX);
            if (newWidth > minWidth) {
                newLeft = windowObj.resizeStart.left + deltaX;
            }
        }
        
        // Handle vertical resizing
        if (direction.includes('s')) {
            newHeight = Math.max(minHeight, windowObj.resizeStart.height + deltaY);
        } else if (direction.includes('n')) {
            newHeight = Math.max(minHeight, windowObj.resizeStart.height - deltaY);
            if (newHeight > minHeight) {
                newTop = windowObj.resizeStart.top + deltaY;
            }
        }
        
        windowObj.element.style.width = `${newWidth}px`;
        windowObj.element.style.height = `${newHeight}px`;
        windowObj.element.style.left = `${newLeft}px`;
        windowObj.element.style.top = `${newTop}px`;
    }

    stopResize(windowObj) {
        windowObj.isResizing = false;
        windowObj.resizeDirection = null;
        windowObj.element.classList.remove('resizing');
        window.isDraggingAnything = false;
    }

    startDrag(windowObj, e) {
        windowObj.isDragging = true;
        window.isDraggingAnything = true;
        windowObj.element.classList.add('dragging');
        
        const rect = windowObj.element.getBoundingClientRect();
        windowObj.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this.bringToFront(windowObj);
    }

    stopDrag(windowObj) {
        windowObj.isDragging = false;
        windowObj.element.classList.remove('dragging');
        window.isDraggingAnything = false;
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
}

// Initialize window system
const windowManager = new WindowManager();