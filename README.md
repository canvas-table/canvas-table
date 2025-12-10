# Canvas Table Element

## Overview

This project implements a custom HTML element `<canvas-table>` using the Web Components API and Canvas API. It provides a high-performance table rendering solution with virtualization, scrollbars, and event handling. The table supports large datasets by only rendering visible cells, making it suitable for data grids or spreadsheet-like interfaces.

The code is licensed under the Apache License 2.0 and copyrighted by AKABANE Meifai in 2025.

## Features

- **Virtualization**: Efficiently renders only the visible portion of the table to handle large datasets.
- **Scrollbars**: Custom horizontal and vertical scrollbars with drag, button, and wheel support.
- **Event Handling**: Custom events for mouse interactions (e.g., `table-mouseover`, `table-click`) and scrolling (e.g., `table-scroll`).
- **Customizable Rendering**: Supports custom cell drawing, text alignment based on data type (string, number, boolean), and multiline text.
- **Model-Based Data**: Uses `CanvasTableModel` to manage headers, data, and configurations like scrollbar colors and widths.
- **JSON Support**: Load data from JSON using `CanvasTableModel.fromJSON()`.

## Installation

1. Include the JavaScript file via jsDelivr CDN:
   ```html
   <script src="https://cdn.jsdelivr.net/gh/canvas-table/canvas-table@v1/HTMLCanvasTableElement.js"></script>
   ```

2. The custom element `<canvas-table>` will be automatically defined via `customElements.define("canvas-table", HTMLCanvasTableElement)`.

No external dependencies are required; it uses native browser APIs (Canvas, DOM, EventTarget, etc.).

## Usage

### Basic Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Canvas Table Demo</title>
    <script src="https://cdn.jsdelivr.net/gh/canvas-table/canvas-table@v1/HTMLCanvasTableElement.js"></script>
    <style>
        canvas-table {
            width: 800px;
            height: 600px;
            display: block;
            border: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <canvas-table id="myTable"></canvas-table>
    <script>
        const tableElement = document.getElementById('myTable');
        const model = new CanvasTableModel(
            ['Column 1', 'Column 2', 'Column 3'],  // Headers
            [
                ['Cell 1-1', 123, true],
                ['Cell 2-1', 456, false],
                // Add more rows...
            ]
        );
        tableElement.table = model;

        // Listen to events
        model.addEventListener('table-click', (event) => {
            console.log('Clicked cell:', event.addr);
        });
    </script>
</body>
</html>
```

### Loading from JSON

```javascript
const jsonData = '{"header": ["Name", "Age"], "data": [["Alice", 30], ["Bob", 25]]}';
const model = CanvasTableModel.fromJSON(jsonData);
tableElement.table = model;
```

### Customization

- **Cell Sizes**: Override `getWidth(columnNo)` and `getHeight(rowNo)` in a subclass of `CanvasTableModel`.
- **Drawing**: Extend `drawData(renderer, rowNo, columnNo)` to customize cell appearance (background, text, borders).
- **Scrollbars**: Configure via model properties like `scrollbarWidth`, `scrollbarTrackColor`, etc.
- **Events**: Attach listeners to the model for custom events like `table-scroll`, `table-mouseover`.

## API Reference

### CanvasTableModel

- `constructor(header: string[], data: any[][])`
- Properties: `offsetX`, `offsetY`, `hasHorizontalScrollbar`, `hasVerticalScrollbar`, etc.
- Methods: `drawData`, `findCellAtPoint`, `virtualInit`

### HTMLCanvasTableElement

- `table`: Getter/setter for the model.
- Events: Dispatched on the model (e.g., `table-attache`, `table-detache`).

## Limitations

- Fixed cell sizes by default (columns: 120px, rows: 30px).
- No built-in editing; extend for interactivity.
- Accessibility: Canvas-based, so add ARIA attributes if needed for screen readers.
- Browser Support: Modern browsers with Canvas and Web Components support.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](http://www.apache.org/licenses/LICENSE-2.0) for details.

## Author

AKABANE Meifai (2025)
