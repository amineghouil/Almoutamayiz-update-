
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// SECURITY & NATIVE FEEL Logic
const enableSecurity = () => {
    // 1. Disable Right Click / Long Press Menu globally
    document.addEventListener('contextmenu', (e) => {
        // Allow context menu only in inputs/textareas for copy/paste convenience if needed,
        // otherwise block it everywhere.
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    }, { passive: false });

    // 2. Prevent Dragging (Images/Links)
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });

    if (process.env.NODE_ENV === 'development') return; // Allow dev tools in dev mode

    // 3. Disable Shortcuts (F12, Ctrl+Shift+I, etc)
    document.addEventListener('keydown', (e) => {
        if (
            e.keyCode === 123 || // F12
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
            (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
            (e.ctrlKey && e.keyCode === 85) // Ctrl+U
        ) {
            e.preventDefault();
        }
    });
};

enableSecurity();

// Implement Toast Notification globally
(window as any).addToast = (message: string, type: 'success' | 'error' | 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        // CHANGED: Positioned at top (top: 20px) instead of bottom
        container.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 10px; align-items: center; pointer-events: none;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.textContent = message;
    // CHANGED: Initial transform is -20px (slide down from top) instead of 20px (slide up)
    toast.style.cssText = `padding: 12px 24px; border-radius: 12px; color: #fff; font-weight: bold; box-shadow: 0 4px 15px rgba(0,0,0,0.3); opacity: 0; transform: translateY(-20px); transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55); pointer-events: auto; user-select: none; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px);`;
    
    // CHANGED: Success color to Amber/Orange (#f59e0b)
    if (type === 'success') toast.style.backgroundColor = '#f59e0b'; 
    else if (type === 'error') toast.style.backgroundColor = '#ef4444'; // Red-500
    else toast.style.backgroundColor = '#3b82f6'; // Blue-500

    container.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        // Slide back up when leaving
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);

    return { success: true };
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
