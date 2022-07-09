export class LogicSim {
	constructor(can) {
		this.scale = 40;
		this.can = can;
		this.ctx = can.getContext("2d");
		this.nodes = [];
		this.frameRequested = false;
		this.clickCancelled = false;
		this.currentTouch = null;
		this.x = 0;
		this.y = 0;
		this.cursorX = 0;
		this.cursorY = 0;

		this.tooltip = null;
		this.selected = [];
		this.mouseMoveStart = null;
		this.currentLink = null;
		this.selection = null;
		this.cursorAttachedNode;

		this.listenersToDestroy = [];

		this.requestFrame();

		this.addListener(window, "resize", () => {
			this.requestFrame();
		});

		this.addListener(window, "keydown", evt => {
			this.onKeyDown(evt.key);
		});

		this.addListener(can, "wheel", evt => {
			this.onScroll(evt.deltaY / 10);
		});

		this.addListener(can, "mousedown", evt => {
			this.onMouseDown(evt.offsetX, evt.offsetY, evt.buttons, evt);
		});

		this.addListener(can, "mouseup", evt => {
			this.onMouseUp();
		});

		this.addListener(can, "mousemove", evt => {
			this.onMouseMove(evt.offsetX, evt.offsetY, evt.movementX, evt.movementY, evt.buttons);
		});

		this.addListener(can, "click", evt => {
			this.onClick(evt.offsetX, evt.offsetY);
		});

		this.addListener(can, "touchstart", evt => {
			if (this.currentTouch != null || evt.changedTouches.length == 0) {
				return;
			}

			let relevantTouch = evt.changedTouches[0];
			this.currentTouch = relevantTouch;
			this.onMouseDown(relevantTouch.clientX, relevantTouch.clientY, 1, evt);
		});

		this.addListener(can, "touchend", evt => {
			if (this.currentTouch == null) {
				return;
			}

			let relevantTouch = null;
			for (let touch of evt.changedTouches) {
				if (touch.identifier == this.currentTouch.identifier) {
					relevantTouch = touch;
					break;
				}
			}

			if (relevantTouch == null) {
				return;
			}

			this.currentTouch = null;
			tis.onMouseUp();
		});

		this.addListener(can, "touchmove", evt => {
			if (this.currentTouch == null) {
				return;
			}

			let relevantTouch = null;
			for (let touch of evt.changedTouches) {
				if (touch.identifier == this.currentTouch.identifier) {
					relevantTouch = touch;
					break;
				}
			}

			if (relevantTouch == null) {
				return;
			}

			let deltaX = this.currentTouch.clientX - relevantTouch.clientX;
			let deltaY = this.currentTouch.clientY - relevantTouch.clientY;
			this.currentTouch = relevantTouch;

			this.onMouseMove(relevantTouch.clientX, relevantTouch.clientY, -deltaX, -deltaY, 1);
		});
	}

	addListener(obj, evt, fn) {
		this.listenersToDestroy.push([obj, evt, fn]);
		obj.addEventListener(evt, fn);
	}

	destroy() {
		for (let [obj, evt, fn] of this.listenersToDestroy) {
			console.log(obj, "removeEventListener", evt, fn);
			obj.removeEventListener(evt, fn);
		}
	}

	onKeyDown(key) {
		if (key == "Escape" || key == "q") {
			this.tooltip = null;
			this.selected = [];
			this.mouseMoveStart = null;
			this.currentLink = null;
			this.selection = null;

			if (this.cursorAttachedNode != null) {
				this.deleteNode(this.cursorAttachedNode);
				this.cursorAttachedNode = null;
			}

			this.requestFrame();
		} else if (this.currentLink != null && key == "Backspace") {
			if (this.currentLink.path.length > 0) {
				this.currentLink.path.pop();
			} else {
				this.currentLink = null;
			}
			this.requestFrame();
		} else if (key == "Delete" || key == "Backspace") {
			let newSelected = [];
			for (let sel of this.selected) {
				if (sel.node && sel.node.protected) {
					newSelected.push(sel);
				} else {
					this.deleteSelectable(sel);
				}
			}
			this.selected = newSelected;
		} else if (key == "Enter") {
			for (let sel of this.selected) {
				if (sel.node && node.activate) {
					sel.node.activate();
					this.requestFrame();
				}
			}
		}
	}

	onScroll(delta) {
		this.scale -= delta * (this.scale / 40);
		if (this.scale > 200) {
			this.scale = 200;
		} else if (this.scale < 10) {
			this.scale = 10;
		}

		this.requestFrame();
	}

	onMouseDown(offsetX, offsetY, buttons, keys) {
		this.clickCancelled = false;
		let [x, y] = this.coordsFromScreenPos(offsetX, offsetY);
		let sel = this.getSelectableAt(x, y);
		this.mouseMoveStart = {x, y, sel};

		if (keys.shiftKey && buttons == 1) {
			this.selected = [];
			this.selection = {fromX: x, fromY: y, toX: x, toY: y};
			this.tooltip = null;
			this.requestFrame();
		} else if (sel != null && buttons == 1) {
			if (this.selected.indexOf(sel) == -1) {
				this.selected = [sel];
				this.requestFrame();
			}
		} else if (buttons == 1) {
			this.selected = [];
			this.requestFrame();
		}
	}

	onMouseUp() {
		this.mouseMoveStart = null;

		if (this.selection) {
			this.selected = [];
			let [x1, y1] = [this.selection.fromX, this.selection.fromY];
			let [x2, y2] = [this.selection.toX, this.selection.toY];

			// Make sure we actually have a rect from top-left to bottom-right
			let tmp;
			if (x1 > x2) {
				tmp = x1;
				x1 = x2;
				x2 = tmp;
			}
			if (y1 > y2) {
				tmp = y1;
				y1 = y2;
				y2 = tmp;
			}

			for (let node of this.nodes) {
				let nodeX1 = node.x;
				let nodeY1 = node.y - 0.5;
				let nodeX2 = nodeX1 + node.width;
				let nodeY2 = nodeY1 + node.height;

				if (x1 < nodeX2 && x2 > nodeX1 && y1 < nodeY2 && y2 > nodeY1) {
					this.selected.push({node});
				}
			}

			// TODO: add link selectables here too

			this.selection = null;
			this.requestFrame();
		}
	}

	onMouseMove(offsetX, offsetY, movementX, movementY, buttons) {
		let [x, y] = this.coordsFromScreenPos(offsetX, offsetY);
		this.cursorX = x;
		this.cursorY = y;

		let dx = 0, dy = 0;
		if (this.mouseMoveStart) {
			dx = x - this.mouseMoveStart.x;
			dy = y - this.mouseMoveStart.y;
		}

		if (
			buttons == 1 && this.selection == null &&
			this.mouseMoveStart != null && this.currentLink == null) {
			if (this.mouseMoveStart.sel == null) {
				this.x -= movementX / this.scale;
				this.y -= movementY / this.scale;
				this.requestFrame();
			} else {
				let selDX = Math.round(dx);
				let selDY = Math.round(dy);

				if (selDX != 0 || selDY != 0) {
					this.clickCancelled = true;
					this.mouseMoveStart.x += selDX;
					this.mouseMoveStart.y += selDY;

					for (let sel of this.selected) {
						if (sel.node) {
							sel.node.x += selDX;
							sel.node.y += selDY;
						} // TODO: else link
					}

					this.requestFrame();
				}
			}
		}

		let sel = this.getSelectableAt(x, y);
		let io = null;
		if (sel != null && sel.node != null) {
			io = this.getNodeIOAt(sel.node, x, y);
		}

		if (io == null && this.tooltip == null) {
			// Do nothing
		} else if (io == null && this.tooltip != null) {
			this.tooltip = null;
			this.requestFrame();
		} else {
			this.tooltip = {
				text: io.io.name,
				x, y,
			};
			this.requestFrame();
		}

		if (this.selection != null) {
			this.selection.toX = x;
			this.selection.toY = y;
			this.requestFrame();
		}

		if (this.currentLink != null) {
			this.requestFrame();
		}

		if (this.cursorAttachedNode != null) {
			let node = this.cursorAttachedNode;
			let newX = Math.round(x - node.width / 2);
			let newY = Math.round(y - node.height / 2 + 0.5);
			if (newX != node.x || newY != node.y) {
				node.x = newX;
				node.y = newY;
				this.requestFrame();
			}
		}
	}

	onClick(offsetX, offsetY) {
		if (this.clickCancelled) {
			return;
		}

		let [x, y] = this.coordsFromScreenPos(offsetX, offsetY);

		if (this.cursorAttachedNode != null) {
			let node = this.cursorAttachedNode;
			node.x = Math.round(x - node.width / 2);
			node.y = Math.round(y - node.height / 2 + 0.5);
			this.cursorAttachedNode = null;
			return;
		}

		let sel = this.getSelectableAt(x, y);
		let io = null;
		if (sel != null && sel.node != null) {
			io = this.getNodeIOAt(sel.node, x, y);
		}

		if (this.currentLink != null) {
			if (io) {
				let fromNode = this.currentLink.from.node;
				let fromIO = this.currentLink.from.io;
				if (fromIO.type == "input" && io.type == "output") {
					this.currentLink.path.reverse();
					io.io.link.connect(fromNode, fromIO.index, this.currentLink.path);
				} else if (fromIO.type == "output" && io.type == "input") {
					fromIO.io.link.connect(sel.node, io.index, this.currentLink.path);
				}

				if (fromIO.type != io.type) {
					this.currentLink = null;
					this.requestFrame();
				}
			} else {
				let path = this.currentLink.path;
				path.push({x: Math.round(x), y: Math.round(y)});
				this.requestFrame();
			}
		} else if (io != null) {
			this.currentLink = {from: {node: sel.node, io}, path: []};
		} else {
			if (sel && sel.node && sel.node.activate) {
				sel.node.activate();
				this.requestFrame();
			}
		}
	}

	deleteNode(node) {
		for (let i = 0; i < node.inputs.length; ++i) {
			let input = node.inputs[i];
			for (let link of input.links) {
				link.disconnect(node, i);
			}
		}

		for (let out of node.outputs) {
			out.link.destroy();
		}

		this.nodes.splice(this.nodes.indexOf(node), 1);
	}

	deleteSelectable(sel) {
		if (sel.node) {
			this.deleteNode(sel.node);
		} // TODO: else deleteLink
	}

	coordsFromScreenPos(screenX, screenY) {
		return [
			(screenX - this.can.offsetWidth / 2) / this.scale + this.x,
			(screenY - this.can.offsetHeight / 2) / this.scale + this.y,
		];
	}

	getSelectedFrom(sel) {
		for (let s of this.selected) {
			if (s.node && sel.node && s.node == sel.node) {
				return s;
			} else if (s.link && sel.link && s.link == sel.link) {
				return s;
			}
		}

		return sel;
	}

	getSelectableAt(x, y) {
		for (let i = this.nodes.length - 1; i >= 0; --i) {
			let node = this.nodes[i];
			let nodeX1 = node.x - 0.5;
			let nodeY1 = node.y - 0.5;
			let nodeX2 = node.x + node.width + 0.5;
			let nodeY2 = node.y - 0.5 + node.height;

			if (
				x >= nodeX1 && x <= nodeX2 &&
				y >= nodeY1 && y <= nodeY2) {
				return this.getSelectedFrom({node});
			}
		}

		// TODO: Loop over links

		return null;
	}

	getNodeIOAt(node, x, y) {
		for (let n = 0; n < node.inputs.length; ++n) {
			let dx = node.x - x;
			let dy = node.y + n - y;
			let dist = Math.abs(Math.sqrt(dx * dx + dy * dy));
			if (dist < 0.5) {
				return {type: "input", io: node.inputs[n], index: n};
			}
		}

		for (let n = 0; n < node.outputs.length; ++n) {
			let dx = node.x + node.width - x;
			let dy = node.y + n - y;
			let dist = Math.abs(Math.sqrt(dx * dx + dy * dy));
			if (dist < 0.5) {
				return {type: "output", io: node.outputs[n], index: n};
			}
		}

		return null;
	}

	requestFrame() {
		if (this.frameRequested) {
			return;
		}

		this.frameRequested = true;
		window.requestAnimationFrame(() => {
			this.frameRequested = false;
			this.draw();
		});
	}

	addNodeAtCursor(node) {
		node.x = Math.round(this.cursorX - node.width / 2);
		node.y = Math.round(this.cursorY - node.height / 2 + 0.5);
		this.nodes.push(node);
		this.cursorAttachedNode = node;
		this.requestFrame();
	}

	draw() {
		let pixelRatio = 1;
		if (window.devicePixelRatio != null) {
			pixelRatio = window.devicePixelRatio;
		}

		this.can.width = this.can.offsetWidth * pixelRatio;
		this.can.height = this.can.offsetHeight * pixelRatio;
		let canWidth = this.can.width / this.scale;
		let canHeight = this.can.height / this.scale;
		this.ctx.save();

		this.ctx.translate(this.can.width / 2, this.can.height / 2);
		this.ctx.scale(this.scale * pixelRatio, this.scale * pixelRatio);
		this.ctx.translate(-this.x, -this.y);

		this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
		this.ctx.lineWidth = 1 / this.scale;

		let gridStartX = Math.floor(this.x - canWidth / 2);
		let gridStartY = Math.floor(this.y - canHeight / 2);

		for (let x = gridStartX; x < canWidth + gridStartX + 1; x += 1) {
			this.ctx.beginPath();
			this.ctx.moveTo(x, gridStartY - canHeight - 1);
			this.ctx.lineTo(x, gridStartY + canHeight + 1);
			this.ctx.stroke();
		}

		for (let y = gridStartY; y < canHeight + gridStartY + 1; y += 1) {
			this.ctx.beginPath();
			this.ctx.moveTo(gridStartX - canWidth - 1, y);
			this.ctx.lineTo(gridStartX + canWidth + 1, y);
			this.ctx.stroke();
		}

		this.ctx.font = "0.8px Arial";
		this.ctx.lineWidth = 0.1;

		for (let node of this.nodes) {
			for (let output of node.outputs) {
				let link = output.link;

				if (link.current) {
					this.ctx.strokeStyle = "red";
				} else {
					this.ctx.strokeStyle = "brown";
				}

				for (let conn of link.connections) {
					this.ctx.beginPath();
					this.ctx.moveTo(link.from.x + link.from.width, link.from.y + link.index);

					for (let point of conn.path) {
						this.ctx.lineTo(point.x, point.y);
					}

					this.ctx.lineTo(conn.node.x, conn.node.y + conn.index);
					this.ctx.stroke();

					for (let point of conn.path) {
						this.ctx.beginPath();
						this.ctx.arc(point.x, point.y, 0.2, 0, 2 * Math.PI);
						this.ctx.fill();
						this.ctx.stroke();
					}
				}
			}
		}

		this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
		this.ctx.lineWidth = 0.05;
		this.ctx.setLineDash([0.2, 0.1]);
		for (let sel of this.selected) {
			if (sel.node) {
				this.ctx.beginPath();
				this.ctx.strokeRect(
					sel.node.x - 0.1, sel.node.y - 0.5 - 0.1,
					sel.node.width + 0.2, sel.node.height + 0.2);
			} // TODO: else sel.link
		}
		this.ctx.lineWidth = 0.1;
		this.ctx.setLineDash([]);

		for (let node of this.nodes) {
			if (node.lit) {
				this.ctx.fillStyle = "red";
			} else {
				this.ctx.fillStyle = "brown";
			}

			this.ctx.strokeStyle = "black";

			let metrics = this.ctx.measureText(node.name);
			let textWidth = metrics.width;
			this.ctx.fillRect(node.x, node.y - 0.5, node.width, node.height);

			this.ctx.fillStyle = "white";
			this.ctx.fillText(
				node.name,
				node.x + node.width / 2 - textWidth / 2,
				node.y - 0.5 + 0.8);

			this.ctx.fillStyle = "black";
			this.ctx.strokeStyle = "white";

			for (let y = 0; y < node.inputs.length; ++y) {
				this.ctx.beginPath();
				this.ctx.arc(node.x, node.y + y, 0.45, 0, 2 * Math.PI);
				this.ctx.fill();
				this.ctx.stroke();
			}

			for (let y = 0; y < node.outputs.length; ++y) {
				this.ctx.beginPath();
				this.ctx.arc(node.x + node.width, node.y + y, 0.45, 0, 2 * Math.PI);
				this.ctx.fill();
				this.ctx.stroke();
			}
		}

		if (this.currentLink != null) {
			this.ctx.strokeStyle = "brown";

			let from = this.currentLink.from;
			let fromX = from.node.x;
			let fromY = from.node.y + from.io.index;
			if (from.io.type == "output") {
				fromX += from.node.width;
			}

			this.ctx.beginPath();
			this.ctx.moveTo(fromX, fromY);
			for (let el of this.currentLink.path) {
				this.ctx.lineTo(el.x, el.y);
			}

			this.ctx.lineTo(this.cursorX, this.cursorY);
			this.ctx.stroke();

			this.ctx.beginPath();
			this.ctx.arc(fromX, fromY, 0.2, 0, 2 * Math.PI);
			this.ctx.fill();
			this.ctx.stroke();

			for (let el of this.currentLink.path) {
				this.ctx.beginPath();
				this.ctx.arc(el.x, el.y, 0.2, 0, 2 * Math.PI);
				this.ctx.fill();
				this.ctx.stroke();
			}
		}

		if (this.tooltip != null) {
			this.ctx.fillStyle = "black";
			this.ctx.strokeStyle = "grey";

			let metrics = this.ctx.measureText(this.tooltip.text);
			let textWidth = metrics.width;
			let textAscent = metrics.actualBoundingBoxAscent;
			let x = this.tooltip.x - (textWidth / 4);
			let y = this.tooltip.y - 1.2;
			this.ctx.beginPath();
			this.ctx.rect(
				x - 0.17, y - 0.2, textWidth + 0.4, 1.1);
			this.ctx.fill();
			this.ctx.stroke();

			this.ctx.fillStyle = "white";
			this.ctx.fillText(this.tooltip.text, x, y + 0.6);
		}

		if (this.selection != null) {
			this.ctx.fillStyle = "rgba(100, 100, 250, 0.2)";
			this.ctx.strokeStyle = "black";
			this.ctx.beginPath();
			this.ctx.rect(
				this.selection.fromX, this.selection.fromY,
				this.selection.toX - this.selection.fromX,
				this.selection.toY - this.selection.fromY);
			this.ctx.fill();
			this.ctx.stroke();
		}

		this.ctx.restore();
	}

	update() {
		for (let node of this.nodes) {
			node.tick();
		}

		for (let node of this.nodes) {
			node.commit();
		}

		this.requestFrame();
	}
}
