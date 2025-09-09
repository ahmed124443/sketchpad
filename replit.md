# Overview

Sketchpad is a modern, production-ready web-based drawing application built with vanilla HTML5, CSS3, and JavaScript. It provides a comprehensive set of drawing tools including freehand drawing, shapes, text, and advanced canvas manipulation features. The application is designed with a clean, minimal interface that adapts seamlessly across desktop, tablet, and mobile devices.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Single Page Application (SPA)**: Built with vanilla JavaScript using a class-based architecture (`SketchpadApp` class)
- **HTML5 Canvas API**: Core drawing functionality implemented using the 2D rendering context
- **Component-based UI**: Modular toolbar components with tool groups for drawing tools, canvas controls, and file operations
- **Event-driven Architecture**: Mouse and touch event handlers for cross-platform drawing support

## Drawing Engine
- **Canvas State Management**: Implements undo/redo functionality with a stack-based history system (max 50 steps)
- **Tool System**: Pluggable tool architecture supporting brush, eraser, geometric shapes (line, rectangle, circle, triangle), and text tools
- **Stroke Smoothing**: Natural-looking brush strokes with configurable opacity, size, and color
- **Shape Rendering**: Toggle between outline and fill modes for geometric shapes

## Canvas Controls
- **Zoom and Pan**: Viewport transformation system for canvas navigation
- **Background Management**: Configurable background colors and textures
- **Touch Support**: Multi-input handling for both mouse (desktop) and touch (mobile/tablet) interactions

## Responsive Design System
- **CSS Custom Properties**: Theme system supporting light/dark modes with automatic adaptation
- **Flexbox Layout**: Fluid responsive layout that reorganizes on different screen sizes
- **Mobile-first Approach**: Touch-friendly controls with optimized spacing and sizing
- **Breakpoint Strategy**: Adaptive toolbar that collapses/reorganizes based on viewport dimensions

## File Management
- **Export System**: Canvas-to-image conversion supporting PNG/JPEG formats with custom naming
- **Import Functionality**: Image upload capability for background layers or canvas content
- **Browser Storage**: Theme preferences and potentially drawing state persistence

## State Management
- **Drawing State**: Tracks current tool, color, size, opacity, and shape mode
- **Canvas Transform**: Manages zoom level, pan offset, and viewport coordinates
- **History System**: Maintains drawing history for undo/redo operations with memory optimization

# External Dependencies

## CDN Libraries
- **Font Awesome 6.4.0**: Icon library for toolbar buttons and UI elements (https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css)

## Browser APIs
- **HTML5 Canvas API**: Core drawing and rendering functionality
- **File API**: For image import/export operations
- **Touch Events API**: Mobile and tablet drawing support
- **Local Storage API**: Theme preference persistence

## No Backend Dependencies
- Pure client-side application with no server-side components
- No database requirements
- No authentication system needed
- File operations handled entirely through browser APIs