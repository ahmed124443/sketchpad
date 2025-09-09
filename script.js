class SketchpadApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.currentSize = 5;
        this.currentOpacity = 100;
        this.shapeMode = 'outline';
        this.backgroundColor = '#ffffff';
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;
        
        // Drawing state
        this.lastX = 0;
        this.lastY = 0;
        this.startX = 0;
        this.startY = 0;
        
        // Undo/Redo system
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        
        // Text tool
        this.textX = 0;
        this.textY = 0;
        this.fontSize = 24;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.bindEvents();
        this.loadTheme();
        this.updateBrushPreview();
        this.saveState();
    }

    setupCanvas() {
        // Set initial canvas size
        this.resizeCanvas();
        
        // Set initial background
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set canvas drawing properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Handle high DPI displays
        this.setupHighDPI();
    }

    setupHighDPI() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    resizeCanvas() {
        const container = document.getElementById('canvasContainer');
        const containerRect = container.getBoundingClientRect();
        
        // Set canvas to 80% of container size for better mobile experience
        const maxWidth = Math.min(containerRect.width * 0.9, 800);
        const maxHeight = Math.min(containerRect.height * 0.9, 600);
        
        this.canvas.style.width = maxWidth + 'px';
        this.canvas.style.height = maxHeight + 'px';
        
        // Save current drawing before resize
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        this.setupHighDPI();
        
        // Restore drawing after resize
        this.ctx.putImageData(imageData, 0, 0);
    }

    bindEvents() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTool(e.target.closest('.tool-btn').dataset.tool);
            });
        });

        // Color picker
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.setColor(e.target.value);
        });

        // Color presets
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.setColor(color);
                document.getElementById('colorPicker').value = color;
            });
        });

        // Brush size
        const brushSize = document.getElementById('brushSize');
        brushSize.addEventListener('input', (e) => {
            this.currentSize = parseInt(e.target.value);
            document.getElementById('brushSizeValue').textContent = this.currentSize;
            this.updateBrushPreview();
        });

        // Opacity
        const opacity = document.getElementById('opacity');
        opacity.addEventListener('input', (e) => {
            this.currentOpacity = parseInt(e.target.value);
            document.getElementById('opacityValue').textContent = this.currentOpacity;
        });

        // Shape mode
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setShapeMode(e.target.closest('.mode-btn').dataset.mode);
            });
        });

        // Canvas controls
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());

        // Background color
        document.getElementById('backgroundPicker').addEventListener('change', (e) => {
            this.setBackgroundColor(e.target.value);
        });

        // File operations
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importImage(e));
        document.getElementById('saveBtn').addEventListener('click', () => this.saveImage());

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Mobile toolbar toggle
        document.getElementById('mobileToolbarToggle').addEventListener('click', () => {
            document.getElementById('toolbar').classList.toggle('active');
        });

        // Canvas drawing events
        this.bindCanvasEvents();

        // Text modal events
        this.bindTextModalEvents();

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    bindCanvasEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });

        // Wheel event for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) {
                this.zoomOut();
            } else {
                this.zoomIn();
            }
        });

        // Context menu prevention
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    bindTextModalEvents() {
        const modal = document.getElementById('textModal');
        const textInput = document.getElementById('textInput');
        const fontSize = document.getElementById('fontSize');
        const addTextBtn = document.getElementById('addTextBtn');
        const cancelTextBtn = document.getElementById('cancelTextBtn');

        fontSize.addEventListener('input', (e) => {
            this.fontSize = parseInt(e.target.value);
            document.getElementById('fontSizeValue').textContent = this.fontSize + 'px';
        });

        addTextBtn.addEventListener('click', () => {
            const text = textInput.value.trim();
            if (text) {
                this.addText(text);
                modal.style.display = 'none';
                textInput.value = '';
            }
        });

        cancelTextBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            textInput.value = '';
        });

        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTextBtn.click();
            }
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    selectTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        // Update cursor
        this.updateCursor();
    }

    updateCursor() {
        switch (this.currentTool) {
            case 'brush':
            case 'line':
            case 'rectangle':
            case 'circle':
            case 'triangle':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'eraser':
                this.canvas.style.cursor = 'grab';
                break;
            case 'text':
                this.canvas.style.cursor = 'text';
                break;
            default:
                this.canvas.style.cursor = 'crosshair';
        }
    }

    setColor(color) {
        this.currentColor = color;
        this.updateBrushPreview();
    }

    setShapeMode(mode) {
        this.shapeMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    }

    updateBrushPreview() {
        const preview = document.getElementById('brushPreview');
        const size = Math.min(this.currentSize, 24);
        
        preview.style.setProperty('--size', size + 'px');
        preview.querySelector('::after') || (preview.innerHTML = '');
        
        // Create preview dot
        const dot = document.createElement('div');
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';
        dot.style.backgroundColor = this.currentColor;
        dot.style.borderRadius = '50%';
        dot.style.opacity = this.currentOpacity / 100;
        
        preview.innerHTML = '';
        preview.appendChild(dot);
    }

    startDrawing(e) {
        if (e.ctrlKey || e.metaKey) {
            this.isPanning = true;
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = this.startX = pos.x;
        this.lastY = this.startY = pos.y;

        if (this.currentTool === 'text') {
            this.textX = pos.x;
            this.textY = pos.y;
            document.getElementById('textModal').style.display = 'flex';
            document.getElementById('textInput').focus();
            return;
        }

        // Save state for undo
        if (this.currentTool !== 'brush') {
            this.saveState();
        }

        this.ctx.beginPath();
        this.setupDrawingStyle();
    }

    draw(e) {
        if (this.isPanning) {
            const deltaX = e.clientX - this.lastPanX;
            const deltaY = e.clientY - this.lastPanY;
            
            this.panX += deltaX;
            this.panY += deltaY;
            
            this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
            
            this.lastPanX = e.clientX;
            this.lastPanY = e.clientY;
            return;
        }

        if (!this.isDrawing) return;

        const pos = this.getMousePos(e);

        switch (this.currentTool) {
            case 'brush':
                this.drawBrush(pos.x, pos.y);
                break;
            case 'eraser':
                this.erase(pos.x, pos.y);
                break;
            case 'line':
                this.drawLine(this.startX, this.startY, pos.x, pos.y);
                break;
            case 'rectangle':
                this.drawRectangle(this.startX, this.startY, pos.x, pos.y);
                break;
            case 'circle':
                this.drawCircle(this.startX, this.startY, pos.x, pos.y);
                break;
            case 'triangle':
                this.drawTriangle(this.startX, this.startY, pos.x, pos.y);
                break;
        }
    }

    stopDrawing() {
        if (this.isPanning) {
            this.isPanning = false;
            this.updateCursor();
            return;
        }

        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    setupDrawingStyle() {
        this.ctx.globalAlpha = this.currentOpacity / 100;
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.fillStyle = this.currentColor;
        this.ctx.lineWidth = this.currentSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    drawBrush(x, y) {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        [this.lastX, this.lastY] = [x, y];
    }

    erase(x, y) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.currentSize, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawLine(x1, y1, x2, y2) {
        this.clearCanvas(false);
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawRectangle(x1, y1, x2, y2) {
        this.clearCanvas(false);
        this.ctx.globalCompositeOperation = 'source-over';
        
        const width = x2 - x1;
        const height = y2 - y1;
        
        this.ctx.beginPath();
        this.ctx.rect(x1, y1, width, height);
        
        if (this.shapeMode === 'fill') {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }

    drawCircle(x1, y1, x2, y2) {
        this.clearCanvas(false);
        this.ctx.globalCompositeOperation = 'source-over';
        
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
        
        if (this.shapeMode === 'fill') {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }

    drawTriangle(x1, y1, x2, y2) {
        this.clearCanvas(false);
        this.ctx.globalCompositeOperation = 'source-over';
        
        const width = x2 - x1;
        const height = y2 - y1;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x1 + width / 2, y1 + height);
        this.ctx.lineTo(x1 + width, y1);
        this.ctx.closePath();
        
        if (this.shapeMode === 'fill') {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }

    addText(text) {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.globalAlpha = this.currentOpacity / 100;
        this.ctx.fillStyle = this.currentColor;
        this.ctx.font = `${this.fontSize}px Arial, sans-serif`;
        this.ctx.fillText(text, this.textX, this.textY);
        this.saveState();
    }

    clearCanvas(saveState = true) {
        if (saveState && !this.isDrawing) {
            this.saveState();
        }
        
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (saveState) {
            this.saveState();
        }
    }

    setBackgroundColor(color) {
        this.backgroundColor = color;
        this.clearCanvas();
    }

    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 5);
        this.updateZoom();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.2);
        this.updateZoom();
    }

    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateZoom();
    }

    updateZoom() {
        this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        document.getElementById('zoomIndicator').textContent = Math.round(this.zoom * 100) + '%';
    }

    saveState() {
        this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        this.redoStack = [];
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.undoStack.length > 1) {
            this.redoStack.push(this.undoStack.pop());
            const imageData = this.undoStack[this.undoStack.length - 1];
            this.ctx.putImageData(imageData, 0, 0);
            this.updateUndoRedoButtons();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const imageData = this.redoStack.pop();
            this.undoStack.push(imageData);
            this.ctx.putImageData(imageData, 0, 0);
            this.updateUndoRedoButtons();
        }
    }

    updateUndoRedoButtons() {
        document.getElementById('undoBtn').disabled = this.undoStack.length <= 1;
        document.getElementById('redoBtn').disabled = this.redoStack.length === 0;
    }

    importImage(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                this.saveState();
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                this.saveState();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    saveImage() {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `sketchpad-${timestamp}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }

    toggleTheme() {
        const body = document.body;
        const icon = document.querySelector('#themeToggle i');
        
        if (body.dataset.theme === 'dark') {
            body.dataset.theme = 'light';
            icon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        } else {
            body.dataset.theme = 'dark';
            icon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const body = document.body;
        const icon = document.querySelector('#themeToggle i');
        
        body.dataset.theme = savedTheme;
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveImage();
                    break;
            }
        }
        
        // Tool shortcuts
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            switch (e.key) {
                case 'b':
                    this.selectTool('brush');
                    break;
                case 'e':
                    this.selectTool('eraser');
                    break;
                case 'l':
                    this.selectTool('line');
                    break;
                case 'r':
                    this.selectTool('rectangle');
                    break;
                case 'c':
                    this.selectTool('circle');
                    break;
                case 't':
                    this.selectTool('text');
                    break;
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SketchpadApp();
});