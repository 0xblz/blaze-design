// Shared z-index counter across all draggable elements
let sharedZIndexCounter = 100;

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

        // Constrain to viewport
        const rect = obj.element.getBoundingClientRect();
        const maxLeft = window.innerWidth - rect.width;
        const maxTop = window.innerHeight - rect.height;

        left = Math.max(0, Math.min(left, maxLeft));
        top = Math.max(0, Math.min(top, maxTop));

        obj.element.style.left = `${left}px`;
        obj.element.style.top = `${top}px`;
    }

    stopDrag(obj) {
        obj.isDragging = false;
        obj.element.style.cursor = obj.cursor || 'move';
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
                this.createWindow(url, title);
            });
        });
    }

    createWindow(url, title) {
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
                <h3 class="window-title">${title}</h3>
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
            isFullscreen: isMobile,
            isDragging: false,
            dragOffset: { x: 0, y: 0 }
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
        if (!this.isMobile()) {
            this.setupDragListeners(
                windowObj,
                element,
                header,
                (e) => e.target.closest('.window-btn') || windowObj.isFullscreen
            );
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
}

// Article Dragger - Draggable article elements
class ArticleDragger extends DraggableBase {
    constructor() {
        super();
        this.articles = [];
        this.init();
    }

    init() {
        // Don't enable article dragging on mobile
        if (this.isMobile()) return;
        
        document.addEventListener('DOMContentLoaded', () => {
            this.setupDraggableArticles();
        });
    }

    setupDraggableArticles() {
        const articles = document.querySelectorAll('article');
        
        articles.forEach(article => {
            this.makeArticleDraggable(article);
        });
    }

    makeArticleDraggable(article) {
        article.style.cursor = 'move';
        
        const articleObj = {
            element: article,
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            wasAbsolute: false,
            placeholder: null,
            cursor: 'move'
        };
        
        this.articles.push(articleObj);
        
        // Bring to front and start drag on mousedown
        article.addEventListener('mousedown', (e) => {
            // Don't interfere with link clicks
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }
            
            this.bringToFront(articleObj);
            this.startDrag(articleObj, e);
        });
        
        this.setupDragListeners(
            articleObj,
            article,
            article,
            (e) => e.target.tagName === 'A' || e.target.closest('a')
        );
    }

    startDrag(articleObj, e) {
        // Don't drag if clicking on a link
        if (e.target.tagName === 'A' || e.target.closest('a')) {
            return;
        }
        
        articleObj.isDragging = true;
        articleObj.element.style.cursor = 'grabbing';
        
        // Get current position before converting to absolute
        const rect = articleObj.element.getBoundingClientRect();
        
        // Only create placeholder on first drag
        if (!articleObj.wasAbsolute) {
            // Create a placeholder to maintain layout
            articleObj.placeholder = document.createElement('div');
            articleObj.placeholder.style.width = `${rect.width}px`;
            articleObj.placeholder.style.height = `${rect.height}px`;
            articleObj.placeholder.style.visibility = 'hidden';
            articleObj.element.parentNode.insertBefore(articleObj.placeholder, articleObj.element);
        }
        
        // Convert to absolute positioning
        articleObj.element.style.position = 'absolute';
        articleObj.element.style.left = `${rect.left}px`;
        articleObj.element.style.top = `${rect.top}px`;
        articleObj.element.style.width = `${rect.width}px`;
        articleObj.element.style.zIndex = ++sharedZIndexCounter;
        articleObj.wasAbsolute = true;
        
        articleObj.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    bringToFront(articleObj) {
        if (articleObj.wasAbsolute) {
            super.bringToFront(articleObj);
        }
    }
}

// Initialize systems
const windowManager = new WindowManager();
const articleDragger = new ArticleDragger();
