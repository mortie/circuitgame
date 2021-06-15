<main>
	<canvas bind:this={canvas}></canvas>
	<div class="controls">
		{#each components as comp}
			<button on:click={sim.addNodeAtCursor(new comp.ctor())}>{comp.name}</button>
		{/each}
	</div>
</main>

<style>
	main, canvas {
		width: 100vw;
		height: 100vh;
		position: absolute;
		top: 0px;
		left: 0px;
	}

	.controls {
		position: absolute;
		bottom: 0px;
		left: 0px;
		width: 100%;
		height: 40px;
	}

	.controls > * {
		box-sizing: border-box;
		height: 100%;
	}
</style>

<script>
	import {onMount, onDestroy} from 'svelte';

	export let components;

	class LogicSim {
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
			this.selectedNodes = [];
			this.mouseMoveStart = null;
			this.currentLink = null;
			this.selection = null;
			this.cursorAttachedNode;

			this.requestFrame();

			window.addEventListener("resize", () => {
				this.requestFrame();
			});

			window.addEventListener("keydown", evt => {
				this.onKeyDown(evt.key);
			});

			can.addEventListener("wheel", evt => {
				this.onScroll(evt.deltaY / 10);
			});

			can.addEventListener("mousedown", evt => {
				this.onMouseDown(evt.offsetX, evt.offsetY, evt.buttons, evt);
			});

			can.addEventListener("mouseup", evt => {
				this.onMouseUp();
			});

			can.addEventListener("mousemove", evt => {
				this.onMouseMove(evt.offsetX, evt.offsetY, evt.movementX, evt.movementY, evt.buttons);
			});

			can.addEventListener("click", evt => {
				this.onClick(evt.offsetX, evt.offsetY);
			});

			can.addEventListener("touchstart", evt => {
				if (this.currentTouch != null || evt.changedTouches.length == 0) {
					return;
				}

				let relevantTouch = evt.changedTouches[0];
				this.currentTouch = relevantTouch;
				this.onMouseDown(relevantTouch.clientX, relevantTouch.clientY, 1, evt);
			});

			can.addEventListener("touchend", evt => {
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

			can.addEventListener("touchmove", evt => {
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

		onKeyDown(key) {
			let responded = true;
			if (key == "Escape" || key == "q") {
				this.tooltip = null;
				this.selectedNodes = [];
				this.mouseMoveStart = null;
				this.currentLink = null;
				this.selection = null;
				this.requestFrame();
			} else if (key == "Delete") {
				for (let node of this.selectedNodes) {
					this.deleteNode(node);
				}
				this.selectedNodes = [];
			} else if (key == "Enter") {
				for (let node of this.selectedNodes) {
					if (node.activate) {
						node.activate();
						this.requestFrame();
					}
				}
			} else {
				responded = false;
			}

			if (responded) {
				evt.preventDefault();
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
			let node = this.getNodeAt(x, y);
			this.mouseMoveStart = {x, y, node};

			if (keys.shiftKey && buttons == 1) {
				this.selectedNodes = [];
				this.selection = {fromX: x, fromY: y, toX: x, toY: y};
				this.tooltip = null;
				this.requestFrame();
			} else if (node != null && buttons == 1) {
				if (this.selectedNodes.indexOf(node) == -1) {
					this.selectedNodes = [node];
					this.requestFrame();
				}
			} else if (buttons == 1) {
				this.selectedNodes = [];
				this.requestFrame();
			}
		}

		onMouseUp() {
			this.mouseMoveStart = null;

			if (this.selection) {
				this.selectedNodes = [];
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
						this.selectedNodes.push(node);
					}
				}

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
				if (this.mouseMoveStart.node == null) {
					this.x -= movementX / this.scale;
					this.y -= movementY / this.scale;
					this.requestFrame();
				} else {
					let nodeDX = Math.round(dx);
					let nodeDY = Math.round(dy);

					if (nodeDX != 0 || nodeDY != 0) {
						this.clickCancelled = true;
						this.mouseMoveStart.x += nodeDX;
						this.mouseMoveStart.y += nodeDY;

						for (let node of this.selectedNodes) {
							node.x += nodeDX;
							node.y += nodeDY;
						}

						this.requestFrame();
					}
				}
			}

			let node = this.getNodeAt(x, y);
			let io = null;
			if (node != null) {
				io = this.getNodeIOAt(node, x, y);
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
				let p = this.currentLink.path[this.currentLink.path.length - 1];
				p.x = x;
				p.y = y;
				this.requestFrame();
			}

			if (this.cursorAttachedNode != null) {
				let node = this.cursorAttachedNode;
				let newX = Math.round(x - node.width / 2);
				let newY = Math.round(y - node.height / 2);
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
				node.y = Math.round(y - node.height / 2);
				this.cursorAttachedNode = null;
				return;
			}

			let node = this.getNodeAt(x, y);
			let io = null;
			if (node != null) {
				io = this.getNodeIOAt(node, x, y);
			}

			if (this.currentLink != null) {
				if (io) {
					let fromNode = this.currentLink.from.node;
					let fromIO = this.currentLink.from.io;
					if (fromIO.type == "input" && io.type == "output") {
						io.io.link.connect(fromNode, fromIO.index);
					} else if (fromIO.type == "output" && io.type == "input") {
						fromIO.io.link.connect(node, io.index);
					}

					if (fromIO.type != io.type) {
						this.currentLink = null;
						this.requestFrame();
					}
				} else {
					let path = this.currentLink.path;
					path[path.length - 1].x = Math.round(path[path.length - 1].x);
					path[path.length - 1].y = Math.round(path[path.length - 1].y);
					path.push({x, y});
					this.requestFrame();
				}
			} else if (io != null) {
				this.currentLink = {from: {node, io}, path: [{x, y}]};
			} else {
				if (node && node.activate) {
					node.activate();
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

		coordsFromScreenPos(screenX, screenY) {
			return [
				(screenX - this.can.offsetWidth / 2) / this.scale + this.x,
				(screenY - this.can.offsetHeight / 2) / this.scale + this.y,
			];
		}

		getNodeAt(x, y) {
			for (let i = this.nodes.length - 1; i >= 0; --i) {
				let node = this.nodes[i];
				let nodeX1 = node.x - 0.5;
				let nodeY1 = node.y - 0.5;
				let nodeX2 = node.x + node.width + 0.5;
				let nodeY2 = node.y - 0.5 + node.height;

				if (
					x >= nodeX1 && x <= nodeX2 &&
					y >= nodeY1 && y <= nodeY2) {
					return node;
				}
			}

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
			node.y = Math.round(this.cursorY - node.height / 2);
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

			this.ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
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
						this.ctx.lineTo(conn.node.x, conn.node.y + conn.index);
						this.ctx.stroke();
					}
				}
			}

			this.ctx.strokeStyle = "black";
			this.ctx.lineWidth = 0.1;
			this.ctx.setLineDash([0.2, 0.1]);
			for (let node of this.selectedNodes) {
				this.ctx.beginPath();
				this.ctx.strokeRect(node.x - 0.1, node.y - 0.5 - 0.1, node.width + 0.2, node.height + 0.2);
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
				this.ctx.strokeStyle = "black";

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

				this.ctx.stroke();
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

	let canvas;
	let sim;
	let interval = null;

	onMount(() => {
		sim = new LogicSim(canvas);
		interval = setInterval(sim.update.bind(sim), 100);
	});

	onDestroy(() => {
		if (interval != null) {
			clearInterval(interval);
			interval = null;
		}
	});
</script>
