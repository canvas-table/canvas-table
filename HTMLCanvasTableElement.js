/*
 * Copyright 2025 AKABANE Meifai
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class CanvasTableMouseEvent extends MouseEvent{
	constructor(type, options, cell, element){
		super(type, options);
		this.addr = cell.addr;
		this.rect = cell.rect;
		this.element = element;
	}
}

class CanvasTableAttacheEvent extends Event{
	constructor(type, element){
		super(type);
		this.element = element;
	}
}

class CanvasTableRenderEvent extends Event{
	constructor(type, options, element){
		super(type, options);
		this.element = element;
	}
}

class CanvasTableScrollEvent extends Event{
	constructor(type, options, trigger, element){
		super(type, options);
		this.trigger = trigger;
		this.element = element;
	}
}


class CanvasTableModel extends EventTarget{
	constructor(header, data){
		super();
		Object.assign(this, {
			hasColumn: true,
			hasRow: true,
			hasHorizontalScrollbar: true,
			hasVerticalScrollbar: true,
			scrollbarWidth: 12,
			scrollbarTrackColor: "#e0e0e0",
			scrollbarThumbColor: "#999999",
			scrollbarButtonColor: "#bbbbbb",
			offsetX: 0,
			offsetY: 0,
			header: header,
			data: data,
			virtual: {}
		});
	}
	get columnSize(){
		return this.header.length;
	}
	get rowSize(){
		return this.data.length;
	}
	getWidth(columnNo){
		if(columnNo == null){
			return 50;
		}
		return 120;
	}
	getHeight(rowNo){
		if(rowNo == null){
			return 20;
		}
		return 30;
	}
	drawData(renderer, rowNo, columnNo){
		renderer.border("rgba(0,0,0,0.15)", 1);
		if(rowNo == null){
			if(columnNo == null){
				renderer.background = "#333333";
				return;
			}
			renderer.background = "#333333";
			renderer.addText({
				textAlign: "center",
				textBaseline: "middle",
				padding: 2
			}).add(this.header[columnNo], "white", "16px monospace");
			return;
		}
		if(columnNo == null){
			renderer.background = "#333333";
			renderer.addText({
				textAlign: "right",
				textBaseline: "middle",
				padding: 2
			}).add(rowNo + 1, "white", "16px monospace");
			return;
		}
		let data = this.data[rowNo][columnNo];
		let dataTextAlign = "left";
		if(typeof data === 'number'){
			data = data.toString(10);
			dataTextAlign = "right";
		}else if(typeof data === 'boolean'){
			data = data ? "TRUE" : "FALSE";
			dataTextAlign = "center";
		}
		renderer.background = "white";
		if(data != null){
			renderer.addText({
				textAlign: dataTextAlign,
				textBaseline: "middle",
				padding: 2
			}).add(data, "black", "16px monospace");
		}
	}
	drawOverlay(object){
		/*
		const {ctx, rect} = object;
		const {columns, rows} = this.virtual;
		if((columns.length > 0) && (rows.length > 0)){
			ctx.save();
			ctx.strokeStyle  = "black";
			ctx.strokeRect(rect.x, rect.y, columns.at(-1).x + columns.at(-1).width - rect.x, rows.at(-1).y + rows.at(-1).height - rect.y);
			ctx.restore();
		}
		*/
	}
	findCellAtPoint(point){
		const binarySearch = (array, value, rangeFn) => {
			let left = 0, right = array.length - 1;
			while(left <= right){
				const mid = (left + right) >> 1;
				const [start, end] = rangeFn(array[mid]);
				if(value < start){
					right = mid - 1;
				}else if (value >= end){
					left = mid + 1;
				}else{
					return array[mid];
				}
			}
			if(array.length <= left){
				return null;
			}
			return {index: null};
		};
		const col = binarySearch(this.virtual.columns, point.x, c => [c.x, c.x + c.width]);
		const row = binarySearch(this.virtual.rows, point.y, r => [r.y, r.y + r.height]);
		if((col == null) || (row == null)){
			return null;
		}
		return {
			addr: {rowNo: row.index, columnNo: col.index},
			rect: new DOMRect(
				(col.x ?? 0),
				(row.y ?? 0),
				(col.width ?? this.virtual.columns[0].x),
				(row.height ?? this.virtual.rows[0].y)
			)
		};
	}
	virtualInit(rect){
		const {columns, rows} = Object.assign(this.virtual, {columns: [], rows: [], rects: {}});
		const cursor = new DOMRect(rect.x, rect.y, 0, 0);
		const {columnSize, rowSize, scrollbarWidth} = this;
		const {right, bottom} = rect;
		for(let i = this.offsetX; i < columnSize; i++){
			if(right <= (cursor.x = cursor.right)){
				break;
			}
			cursor.width = this.getWidth(i);
			columns.push({index: i, x: cursor.x, width: cursor.width});
		}
		for(let i = this.offsetY; i < rowSize; i++){
			if(bottom <= (cursor.y = cursor.bottom)){
				break;
			}
			cursor.height = this.getHeight(i);
			rows.push({index: i, y: cursor.y, height: cursor.height});
		}
		this.virtualScrollbarInit(rect);
	}
	virtualScrollbarInit(rect){
		const rects = this.virtual.rects;
		const {columnSize, rowSize, scrollbarWidth} = this;
		if(this.hasHorizontalScrollbar){
			if(this.hasVerticalScrollbar){
				rects.scrollbarCorner = new DOMRect(rect.right, rect.bottom, scrollbarWidth, scrollbarWidth);
			}
			rects.scrollbarHorizontalTrack = new DOMRect(0, rect.bottom, rect.right, scrollbarWidth);
			if(columnSize > 1){
				const thumbSize = (rect.right - scrollbarWidth * 2) / columnSize;
				const thumbOffset = thumbSize * this.offsetX + scrollbarWidth;
				rects.scrollbarBackwardButton = new DOMRect(0, rect.bottom, scrollbarWidth, scrollbarWidth);
				rects.scrollbarForwardButton = new DOMRect(rect.right - scrollbarWidth, rect.bottom, scrollbarWidth, scrollbarWidth);
				rects.scrollbarHorizontalThumb = new DOMRect(thumbOffset, rect.bottom, Math.max(10, thumbSize), scrollbarWidth);
			}
		}
		if(this.hasVerticalScrollbar){
			rects.scrollbarVerticalTrack = new DOMRect(rect.right, 0, scrollbarWidth, rect.bottom);
			if(rowSize > 1){
				const thumbSize = (rect.bottom - scrollbarWidth * 2) / rowSize;
				const thumbOffset = thumbSize * this.offsetY + scrollbarWidth;
				rects.scrollbarUpButton = new DOMRect(rect.right, 0, scrollbarWidth, scrollbarWidth);
				rects.scrollbarDownButton = new DOMRect(rect.right, rect.bottom - scrollbarWidth, scrollbarWidth, scrollbarWidth);
				rects.scrollbarVerticalThumb = new DOMRect(rect.right, thumbOffset, scrollbarWidth, Math.max(10, thumbSize));
			}
		}
	}
	static fromJSON(jsonData){
		const data = JSON.parse(jsonData);
		return new this(data?.header ?? [], data?.data ?? []); 
	}
}

class HTMLCanvasTableElement extends HTMLElement{
	constructor(){
		super();
		const canvas = new OffscreenCanvas(1, 1);
		this.pddv15sppk = {
			element: this,
			ctx: canvas.getContext("2d"),
			matrix: new DOMMatrix([1, 0, 0, 1, 0, 0]),
			rect: new DOMRect(0, 0, 0, 0),
			cursor: new DOMRect(0, 0, 0, 0),
			table: null,
			measureMultilineText: this.constructor.measureMultilineText,
			renderMultilineText: this.constructor.renderMultilineText
		};
		this.pdep6ph1vp = {
			element: this,
			shadow: null,
			ctx: null,
			size: null,
			getContext(size){
				if(size == null){
					return this.ctx;
				}
				const pddv15sppk = this.element.pddv15sppk;
				const table = pddv15sppk.table;
				const canvas = this.ctx.canvas;
				const canvasSize = {
					width: size.inlineSize,
					height: size.blockSize
				};
				const dx = table.hasRow ? table.getWidth(null) : 0;
				const dy = table.hasColumn ? table.getHeight(null) : 0;
				const dhw = table.hasHorizontalScrollbar ? table.scrollbarWidth : 0;
				const dvw = table.hasVerticalScrollbar ? table.scrollbarWidth : 0;
				this.size = size;
				this.ctx = Object.assign(canvas, canvasSize).getContext("2d");
				pddv15sppk.matrix.setMatrixValue(`scale(${canvas.width / canvas.clientWidth},${canvas.height / canvas.clientHeight})`);
				pddv15sppk.ctx = Object.assign(pddv15sppk.ctx.canvas, canvasSize).getContext("2d");
				Object.assign(pddv15sppk.rect, {
					x: dx,
					y: dy,
					width: canvas.clientWidth - dx - dvw,
					height: canvas.clientHeight - dy - dhw
				});
				return this.ctx;
			}
		};
	}
	connectedCallback(){
		if(this.pdep6ph1vp.shadow != null){
			return;
		}
		const shadow = this.pdep6ph1vp.shadow = this.attachShadow({mode: "closed"});
		const container = document.createElement("main");
		const canvas = document.createElement("canvas");
		const slot = document.createElement("slot");
		this.addEventListener("table-rerender", e => {
			e.stopPropagation();
			this.draw(this.pdep6ph1vp.getContext(e.detail?.size));
		});
		if(this.pddv15sppk.table == null){
			this.pddv15sppk.table = new CanvasTableModel([""], [[null]]);
		}
		this.pdep6ph1vp.ctx = canvas.getContext("2d");
		this.constructor.observer.observe(canvas, {box: "device-pixel-content-box"});
		
		const h = {
			handleEvent(e){
				if((typeof e.offsetX === 'number') && (typeof e.offsetY === 'number')){
					const point = new DOMPoint(e.offsetX, e.offsetY);
					const table = this.pddv15sppk.table;
					const rects = table.virtual.rects;
					if(e.type == "dragstart"){
						e.dataTransfer.setDragImage(this.dragImage, 0, 0);
						e.dataTransfer.dropEffect = "none";
						e.dataTransfer.effectAllowed = "all";
						if(this.contains(rects.scrollbarHorizontalThumb, point)){
							this.dragging = "horizontal";
							this.dragStart = {x: point.x, offset: table.offsetX};
							return;
						}
						if(this.contains(rects.scrollbarVerticalThumb, point)){
							this.dragging = "vertical";
							this.dragStart = {y: point.y, offset: table.offsetY};
							return;
						}
					}else if(e.type == "dragover"){
						e.preventDefault();
					}else if(e.type == "click"){
						if(this.contains(rects.scrollbarBackwardButton, point)){
							const offsetValue = Math.max(0, table.offsetX - 1);
							if(offsetValue != table.offsetX){
								if(table.dispatchEvent(new CanvasTableScrollEvent("table-beforescroll", {cancelable: true}, "scrollbarBackwardButton", this.element))){
									table.offsetX = offsetValue;
									table.dispatchEvent(new CanvasTableScrollEvent("table-scroll", {}, "scrollbarBackwardButton", this.element));
									this.element.rerender();
								}
							}
							return;
						}
						if(this.contains(rects.scrollbarForwardButton, point)){
							const offsetValue = Math.min(table.columnSize - 1, table.offsetX + 1);
							if(offsetValue != table.offsetX){
								if(table.dispatchEvent(new CanvasTableScrollEvent("table-beforescroll", {cancelable: true}, "scrollbarForwardButton", this.element))){
									table.offsetX = offsetValue;
									table.dispatchEvent(new CanvasTableScrollEvent("table-scroll", {}, "scrollbarForwardButton", this.element));
									this.element.rerender();
								}
							}
							return;
						}
						if(this.contains(rects.scrollbarUpButton, point)){
							const offsetValue = Math.max(0, table.offsetY - 1);
							if(offsetValue != table.offsetY){
								if(table.dispatchEvent(new CanvasTableScrollEvent("table-beforescroll", {cancelable: true}, "scrollbarUpButton", this.element))){
									table.offsetY = offsetValue;
									table.dispatchEvent(new CanvasTableScrollEvent("table-scroll", {}, "scrollbarUpButton", this.element));
									this.element.rerender();
								}
							}
							return;
						}
						if(this.contains(rects.scrollbarDownButton, point)){
							const offsetValue = Math.min(table.rowSize - 1, table.offsetY + 1);
							if(offsetValue != table.offsetY){
								if(table.dispatchEvent(new CanvasTableScrollEvent("table-beforescroll", {cancelable: true}, "scrollbarDownButton", this.element))){
									table.offsetY = offsetValue;
									table.dispatchEvent(new CanvasTableScrollEvent("table-scroll", {}, "scrollbarDownButton", this.element));
									this.element.rerender();
								}
							}
							return;
						}
						if(this.contains(rects.scrollbarHorizontalTrack, point) && !this.contains(rects.scrollbarHorizontalThumb, point)){
							// Jump to position in track
							const trackWidth = rects.scrollbarHorizontalTrack.width - (table.hasVerticalScrollbar ? table.scrollbarWidth : 0) - 2 * table.scrollbarWidth;
							const pos = (point.x - table.scrollbarWidth) / trackWidth;
							const offsetValue = Math.floor(pos * table.columnSize);
							if(offsetValue != table.offsetX){
								if(table.dispatchEvent(new CanvasTableScrollEvent("table-beforescroll", {cancelable: true}, "scrollbarHorizontalTrack", this.element))){
									table.offsetX = offsetValue;
									table.dispatchEvent(new CanvasTableScrollEvent("table-scroll", {}, "scrollbarHorizontalTrack", this.element));
									this.element.rerender();
								}
							}
							return;
						}
						if(this.contains(rects.scrollbarVerticalTrack, point) && !this.contains(rects.scrollbarVerticalThumb, point)){
							// Jump to position in track
							const trackHeight = rects.scrollbarVerticalTrack.height - (table.hasHorizontalScrollbar ? table.scrollbarWidth : 0) - 2 * table.scrollbarWidth;
							const pos = (point.y - table.scrollbarWidth) / trackHeight;
							const offsetValue = Math.floor(pos * table.rowSize);
							if(offsetValue != table.offsetY){
								if(table.dispatchEvent(new CanvasTableScrollEvent("table-beforescroll", {cancelable: true}, "scrollbarVerticalTrack", this.element))){
									table.offsetY = offsetValue;
									table.dispatchEvent(new CanvasTableScrollEvent("table-scroll", {}, "scrollbarVerticalTrack", this.element));
									this.element.rerender();
								}
							}
							return;
						}
					}else if((e.type == "drag") && this.dragging && ((e.offsetX) >= 0 || (e.offsetY >= 0))){
						if(this.dragging == "horizontal"){
							const trackWidth = rects.scrollbarHorizontalTrack.width - (table.hasVerticalScrollbar ? table.scrollbarWidth : 0) - 2 * table.scrollbarWidth;
							const thumbSize = rects.scrollbarHorizontalThumb.width;
							const delta = point.x - this.dragStart.x;
							const pos = (this.dragStart.offset * trackWidth / (table.columnSize - table.virtual.columns.length + 1) + delta) / (trackWidth / table.columnSize);
							const offsetValue = Math.max(0, Math.min(table.columnSize - table.virtual.columns.length + 1, Math.floor(pos)));
							if(offsetValue != table.offsetX){
								if(table.dispatchEvent(new CanvasTableScrollEvent("table-beforescroll", {cancelable: true}, "scrollbarHorizontalThumb", this.element))){
									table.offsetX = offsetValue;
									table.dispatchEvent(new CanvasTableScrollEvent("table-scroll", {}, "scrollbarHorizontalThumb", this.element));
									this.element.rerender();
								}
							}
							return;
						}
						if(this.dragging == "vertical"){
							const trackHeight = rects.scrollbarVerticalTrack.height - (table.hasHorizontalScrollbar ? table.scrollbarWidth : 0) - 2 * table.scrollbarWidth;
							const thumbSize = rects.scrollbarVerticalThumb.height;
							const delta = point.y - this.dragStart.y;
							const pos = (this.dragStart.offset * trackHeight / (table.rowSize - table.virtual.rows.length + 1) + delta) / (trackHeight / table.rowSize);
							const offsetValue = Math.max(0, Math.min(table.rowSize - table.virtual.rows.length + 1, Math.floor(pos)));
							if(offsetValue != table.offsetY){
								if(table.dispatchEvent(new CanvasTableScrollEvent("table-beforescroll", {cancelable: true}, "scrollbarVerticalThumb", this.element))){
									table.offsetY = offsetValue;
									table.dispatchEvent(new CanvasTableScrollEvent("table-scroll", {}, "scrollbarVerticalThumb", this.element));
									this.element.rerender();
								}
							}
							return;
						}
					}else if(e.type == "dragend"){
						this.dragging = null;
						this.dragStart = null;
					}else if(e.type == "wheel"){
						const table = this.pddv15sppk.table;
						if(e.shiftKey){
							const delta = Math.sign(e.deltaY);
							const offsetValue = Math.max(0, Math.min(table.columnSize - table.virtual.columns.length + 1, table.offsetX + delta, table.columnSize - 1));
							if(offsetValue != table.offsetX){
								if(table.dispatchEvent(new CanvasTableScrollEvent("table-beforescroll", {cancelable: true}, "wheelHorizontal", this.element))){
									table.offsetX = offsetValue;
									table.dispatchEvent(new CanvasTableScrollEvent("table-scroll", {}, "wheelHorizontal", this.element));
									this.element.rerender();
								}
							}
						}else{
							const delta = Math.sign(e.deltaY);
							const offsetValue = Math.max(0, Math.min(table.rowSize - table.virtual.rows.length + 1, table.offsetY + delta, table.rowSize - 1));
							if(offsetValue != table.offsetY){
								if(table.dispatchEvent(new CanvasTableScrollEvent("table-beforescroll", {cancelable: true}, "wheelVertical", this.element))){
									table.offsetY = offsetValue;
									table.dispatchEvent(new CanvasTableScrollEvent("table-scroll", {}, "wheelVertical", this.element));
									this.element.rerender();
								}
							}
						}
						e.preventDefault();
					}
					const cell = (e.type == "mouseout") ? null : this.pddv15sppk.table.findCellAtPoint(point);
					if(e.type == "mouseover"){
						this.current = null;
					}
					const old = this.current;
					const same = this.isSame(cell);
					if(!same){
						if(old != null){
							this.pddv15sppk.table.dispatchEvent(this.eventInit("table-mouseout", e, old));
						}
						if(cell != null){
							this.pddv15sppk.table.dispatchEvent(this.eventInit("table-mouseover", e, cell));
						}
					}
					if((e.type == "mouseover") || (e.type == "mouseout")){
						return;
					}
					if(cell != null){
						this.pddv15sppk.table.dispatchEvent(this.eventInit("table-" + e.type, e, cell));
					}
				}
			},
			isSame(cell){
				if(cell == null){
					if(this.current == null){
						return true;
					}
					this.current = cell;
					return false;
				}
				if(this.current == null){
					this.current = cell;
					return false;
				}
				if((cell.addr.columnNo == this.current.addr.columnNo) && (cell.addr.rowNo == this.current.addr.rowNo)){
					return true;
				}
				this.current = cell;
				return false;
			},
			eventInit(type, ev, cell){
				if(ev instanceof MouseEvent){
					return new CanvasTableMouseEvent(type, ev, cell, this.element);
				}
				return new ev.constructor(type, ev);
			},
			contains(rect, point){
				if(!rect){
					return false;
				}
				return (point.x >= rect.left) && (point.x <= rect.right) && (point.y >= rect.top) && (point.y <= rect.bottom);
			},
			pddv15sppk: this.pddv15sppk,
			element: this,
			current: null,
			dragging: null,
			dragStart: null,
			dragImage: this.constructor.dragImage,
			types: ["click", "dblclick", "mouseup", "mousedown", "mousemove", "mouseover", "mouseout", "wheel", "drag", "dragstart", "dragend", "dragenter", "dragover", "dragleave", "drop"]
		};
		canvas.draggable = true;
		for(let type of h.types){
			canvas.addEventListener(type, h);
		}
		slot.setAttribute("name", "overlay");
		container.append(canvas, slot);
		shadow.appendChild(container);
		shadow.adoptedStyleSheets.push(this.constructor.styleSheet);
	}
	disconnectedCallback(){
		if(this.pdep6ph1vp.shadow != null){
			this.constructor.observer.disconnect(this.pdep6ph1vp.ctx.canvas);
		}
	}
	get table(){
		return this.pddv15sppk.table;
	}
	set table(value){
		if((value != this.pddv15sppk.table) && (this.pddv15sppk.table != null)){
			this.pddv15sppk.table.dispatchEvent(new CanvasTableAttacheEvent("table-detache", this));
		}
		this.pddv15sppk.table = value;
		this.pddv15sppk.table.dispatchEvent(new CanvasTableAttacheEvent("table-attache", this));
		this.rerender(this.pdep6ph1vp.size);
	}
	rerender(size = null){
		if((this.pdep6ph1vp.shadow != null) && this.pddv15sppk.table.dispatchEvent(new CanvasTableRenderEvent("table-beforerender", {cancelable: true}, this))){
			this.draw(this.pdep6ph1vp.getContext(size));
			this.pddv15sppk.table.dispatchEvent(new CanvasTableRenderEvent("table-render", {}, this));
		}
	}
	draw(ctx){
		const {rect, cursor, table} = this.pddv15sppk;
		const canvas = this.pddv15sppk.ctx.canvas;
		table.virtualInit(rect);
		this.pddv15sppk.ctx.resetTransform();
		this.pddv15sppk.ctx.clearRect(0, 0, canvas.width, canvas.height);
		this.pddv15sppk.ctx.setTransform(this.pddv15sppk.matrix);
		if(table.hasColumn){
			cursor.y = 0;
			cursor.height = rect.y;
			if(table.hasRow){
				cursor.x = 0;
				cursor.width = rect.x;
				this.drawCell(null, null);
			}
			for(let item of table.virtual.columns){
				cursor.x = item.x;
				cursor.width = item.width;
				this.drawCell(null, item.index);
			}
		}
		if(table.hasRow){
			cursor.x = 0;
			cursor.width = rect.x;
			for(let item of table.virtual.rows){
				cursor.y = item.y;
				cursor.height = item.height;
				this.drawCell(item.index, null);
			}
		}
		for(let row of table.virtual.rows){
			cursor.y = row.y;
			cursor.height = row.height;
			for(let column of table.virtual.columns){
				cursor.x = column.x;
				cursor.width = column.width;
				this.drawCell(row.index, column.index);
			}
		}
		this.drawScrollbar();
		table.drawOverlay(this.pddv15sppk);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(this.pddv15sppk.ctx.canvas, 0, 0);
	}
	drawScrollbar(){
		const {ctx, table} = this.pddv15sppk;
		const rects = table.virtual.rects;
		const fillRects = (color, ...keys) => {
			ctx.fillStyle = color;
			for(let key of keys){
				const ref = rects[key];
				if(ref instanceof DOMRect){
					ctx.fillRect(ref.x, ref.y, ref.width, ref.height);
				}
			}
		};
		ctx.save();
		fillRects("white", "scrollbarCorner");
		fillRects(table.scrollbarTrackColor, "scrollbarHorizontalTrack", "scrollbarVerticalTrack");
		fillRects(table.scrollbarButtonColor, "scrollbarBackwardButton", "scrollbarForwardButton", "scrollbarUpButton", "scrollbarDownButton");
		fillRects(table.scrollbarThumbColor, "scrollbarHorizontalThumb", "scrollbarVerticalThumb");
		ctx.restore();
	}
	drawCell(rowNo, columnNo){
		const {ctx, cursor, table} = this.pddv15sppk;
		const renderer = {
			background: null,
			addText(options){
				const obj = {
					options: options,
					add(text, color, font){
						this.values.push({text, color, font});
						return this;
					},
					values: []
				};
				this.textData.push(obj);
				return obj;
			},
			wrap(...wrappers){
				this.wrappers.push(...wrappers);
			},
			border(color, width){
				this.borders.left = {color, width};
				this.borders.right = {color, width};
				this.borders.top = {color, width};
				this.borders.bottom = {color, width};
			},
			borderLeft(color, width){
				this.borders.left = {color, width};
			},
			borderRight(color, width){
				this.borders.right = {color, width};
			},
			borderTop(color, width){
				this.borders.top = {color, width};
			},
			borderBottom(color, width){
				this.borders.bottom = {color, width};
			},
			borderUp(color, width){
				this.borders.up = {color, width};
			},
			borderDown(color, width){
				this.borders.down = {color, width};
			},
			textData: [],
			wrappers: [],
			borders: {}
		};
		const data = table.drawData(renderer, rowNo, columnNo);
		ctx.save();
		ctx.beginPath();
		ctx.rect(cursor.x, cursor.y, cursor.width, cursor.height);
		ctx.clip();
		if(renderer.background != null){
			ctx.fillStyle = renderer.background;
			ctx.fillRect(cursor.x, cursor.y, cursor.width, cursor.height);
		}
		for(let textData of renderer.textData){
			Object.assign(ctx, {
				textAlign: textData.options?.textAlign ?? "left",
				textBaseline:  textData.options?.textBaseline ?? "top"
			});
			let renderTextData = null;
			for(let args of textData.values){
				const {text, color, font} = args;
				renderTextData = this.pddv15sppk.measureMultilineText(text, color, font, renderTextData);
			}
			this.pddv15sppk.renderMultilineText(renderTextData, cursor, textData.options);
		}
		for(let wrapper of renderer.wrappers){
			wrapper.call(data, this.pddv15sppk);
		}
		if((renderer.borders.left?.color != null) && (renderer.borders.left?.width != null)){
			ctx.lineWidth = renderer.borders.left.width;
			ctx.strokeStyle = renderer.borders.left.color;
			ctx.moveTo(cursor.left, cursor.top);
			ctx.lineTo(cursor.left, cursor.bottom);
			ctx.stroke();
		}
		if((renderer.borders.right?.color != null) && (renderer.borders.right?.width != null)){
			ctx.lineWidth = renderer.borders.right.width;
			ctx.strokeStyle = renderer.borders.right.color;
			ctx.moveTo(cursor.right, cursor.top);
			ctx.lineTo(cursor.right, cursor.bottom);
			ctx.stroke();
		}
		if((renderer.borders.top?.color != null) && (renderer.borders.top?.width != null)){
			ctx.lineWidth = renderer.borders.top.width;
			ctx.strokeStyle = renderer.borders.top.color;
			ctx.moveTo(cursor.left, cursor.top);
			ctx.lineTo(cursor.right, cursor.top);
			ctx.stroke();
		}
		if((renderer.borders.bottom?.color != null) && (renderer.borders.bottom?.width != null)){
			ctx.lineWidth = renderer.borders.bottom.width;
			ctx.strokeStyle = renderer.borders.bottom.color;
			ctx.moveTo(cursor.left, cursor.bottom);
			ctx.lineTo(cursor.right, cursor.bottom);
			ctx.stroke();
		}
		if((renderer.borders.up?.color != null) && (renderer.borders.up?.width != null)){
			ctx.lineWidth = renderer.borders.up.width;
			ctx.strokeStyle = renderer.borders.up.color;
			ctx.moveTo(cursor.left, cursor.bottom);
			ctx.lineTo(cursor.right, cursor.top);
			ctx.stroke();
		}
		if((renderer.borders.down?.color != null) && (renderer.borders.down?.width != null)){
			ctx.lineWidth = renderer.borders.down.width;
			ctx.strokeStyle = renderer.borders.down.color;
			ctx.moveTo(cursor.left, cursor.top);
			ctx.lineTo(cursor.right, cursor.bottom);
			ctx.stroke();
		}
		ctx.restore();
	}
	static measureMultilineText(text, color, font, textData = null){
		this.ctx.save();
		this.ctx.font = font;
		const res =  (text ?? "").toString().split(/\r\n?|\n/).reduce((acc, line) => {
			const metrics = this.ctx.measureText(line);
			const lineHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
			acc.lines.push({
				text: line,
				width: metrics.width,
				height: lineHeight,
				color: color,
				font: font
			});
			acc.height += lineHeight;
			acc.width = Math.max(acc.width, metrics.width);
			return acc;
		}, textData ?? {lines: [], width: 0, height: 0});
		this.ctx.restore();
		return res;
	}
	static renderMultilineText(textData, rect, options = null){
		const ctx = this.ctx;
		const {width, height} = rect;
		const padding = options?.padding ?? 0;
		const lines = textData.lines;
		const totalTextHeight = textData.height;
		const maxWidth = textData.width;
		const fitWidth = width - 2 * padding;
		const fitHeight = height - 2 * padding;
		const scale = (options?.shrinkToFit ?? false) ? Math.min(1, fitWidth / maxWidth, fitHeight / totalTextHeight) : 1;
		const scaledMaxWidth = maxWidth * scale;
		const scaledTotalHeight = totalTextHeight * scale;
		const originalAlign = ctx.textAlign;
		const originalBaseline = ctx.textBaseline;
		let boxLeft = padding;
		let boxTop = padding;
		let y = 0;
		ctx.save();
		switch(originalAlign){
			case 'center':
				boxLeft = padding + (fitWidth - scaledMaxWidth) / 2;
				break;
			case 'right':
			case 'end':
				boxLeft = padding + fitWidth - scaledMaxWidth;
				break;
		}
		switch(originalBaseline){
			case 'middle':
				boxTop = padding + (fitHeight - scaledTotalHeight) / 2;
				break;
			case 'bottom':
				boxTop = padding + fitHeight - scaledTotalHeight;
				break;
		}
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.translate(rect.x, rect.y);
		ctx.transform(scale, 0, 0, scale, boxLeft, boxTop);
		for(let line of lines){
			let lineX = 0;
			const lineWidth = line.width;
			switch(originalAlign){
				case 'center':
					lineX = (maxWidth - lineWidth) / 2;
					break;
				case 'right':
				case 'end':
					lineX = maxWidth - lineWidth;
					break;
			}
			ctx.font = line.font;
			ctx.fillStyle = line.color;
			ctx.fillText(line.text, lineX, y);
			y += line.height;
		}
		ctx.restore();
	}
	static observer = new ResizeObserver(entries => {
		for(let entry of entries){
			const canvas = entry.target;
			if(canvas.tagName != "CANVAS"){
				continue;
			}
			canvas.dispatchEvent(new CustomEvent("table-rerender", {
				bubbles: true,
				composed: true,
				detail: {
					size: entry.devicePixelContentBoxSize[0]
				}
			}));
		}
	});
	static styleSheet = new CSSStyleSheet();
	static dragImage = new Image();
}

customElements.define("canvas-table", HTMLCanvasTableElement);
HTMLCanvasTableElement.styleSheet.replaceSync(`main{
	display: contents;
}
canvas{
	width: 100%;
	height: 100%;
}`);