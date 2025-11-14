/**
 * Desktop-like rectangular selection system
 * Click and drag to create a selection box
 */

(function() {
    let isSelecting = false;
    let selectionBox = null;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    
    // Elements that can be selected
    const selectableSelector = 'article, h1, a.window, a[target="_blank"]';
    
    // Initialize selection box
    function createSelectionBox() {
        if (!selectionBox) {
            selectionBox = document.createElement('div');
            selectionBox.id = 'selection-box';
            selectionBox.style.cssText = `
                position: fixed;
                border: 1px solid white;
                background: linear-gradient(to top, rgba(255, 255, 255, 0.4), transparent);
                pointer-events: none;
                z-index: 9999;
                display: none;
                mix-blend-mode: overlay;
            `;
            document.body.appendChild(selectionBox);
        }
        return selectionBox;
    }
    
    // Update selection box position and size
    function updateSelectionBox() {
        if (!selectionBox) return;
        
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
        selectionBox.style.display = 'block';
    }
    
    // Check if element intersects with selection box
    function isIntersecting(element, selectionRect) {
        const rect = element.getBoundingClientRect();
        
        return !(
            rect.right < selectionRect.left ||
            rect.left > selectionRect.right ||
            rect.bottom < selectionRect.top ||
            rect.top > selectionRect.bottom
        );
    }
    
    // Get selection rectangle
    function getSelectionRect() {
        return {
            left: Math.min(startX, currentX),
            top: Math.min(startY, currentY),
            right: Math.max(startX, currentX),
            bottom: Math.max(startY, currentY)
        };
    }
    
    // Update selected elements
    function updateSelection() {
        const selectionRect = getSelectionRect();
        const selectableElements = document.querySelectorAll(selectableSelector);
        
        selectableElements.forEach(element => {
            if (isIntersecting(element, selectionRect)) {
                element.classList.add('selected');
            } else {
                element.classList.remove('selected');
            }
        });
    }
    
    // Clear all selections
    function clearSelection() {
        const selectedElements = document.querySelectorAll('.selected');
        selectedElements.forEach(element => {
            element.classList.remove('selected');
        });
    }
    
    // Mouse down - start selection
    function handleMouseDown(e) {
        // Only start selection on left click and not on interactive elements
        if (e.button !== 0) return;
        
        // Don't start selection if something is being dragged (windows, articles, etc.)
        if (window.isDraggingAnything) return;
        
        const target = e.target;
        
        // Don't start selection if clicking on interactive elements
        if (target.tagName === 'A' || 
            target.tagName === 'BUTTON' || 
            target.tagName === 'INPUT' ||
            target.closest('a') ||
            target.closest('button')) {
            return;
        }
        
        // Don't start selection if clicking on draggable elements
        if (target.closest('.app-window')) {
            return;
        }
        
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        currentX = e.clientX;
        currentY = e.clientY;
        
        createSelectionBox();
        clearSelection();
        
        // Prevent default to avoid any text selection
        e.preventDefault();
    }
    
    // Mouse move - update selection
    function handleMouseMove(e) {
        if (!isSelecting) return;
        
        currentX = e.clientX;
        currentY = e.clientY;
        
        updateSelectionBox();
        updateSelection();
    }
    
    // Mouse up - end selection
    function handleMouseUp(e) {
        if (!isSelecting) return;
        
        isSelecting = false;
        
        // Hide selection box
        if (selectionBox) {
            selectionBox.style.display = 'none';
        }
        
        // If it was just a click (not a drag), clear selection
        const dragDistance = Math.abs(currentX - startX) + Math.abs(currentY - startY);
        if (dragDistance < 5) {
            clearSelection();
        }
    }
    
    // Handle clicks outside selected elements to deselect
    function handleClick(e) {
        if (isSelecting) return;
        
        const target = e.target;
        
        // If clicking on a non-selected element or empty space, clear selection
        if (!target.classList.contains('selected') && !target.closest('.selected')) {
            clearSelection();
        }
    }
    
    // Initialize event listeners
    function init() {
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('click', handleClick);
        
        // Add CSS for selected elements
        const style = document.createElement('style');
        style.textContent = `
            .selected {
                outline: 2px solid rgba(255, 255, 255, 0.1) !important;
                outline-offset: 1.5rem;
                position: relative;
                border-radius: 0.25rem;
            }
            
            .selected::before {
                content: '';
                position: absolute;
                inset: -4px;
                border-radius: inherit;
                pointer-events: none;
                z-index: -1;
            }
            
            #selection-box {
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
