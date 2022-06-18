export class Link {
	constructor(from, index) {
		this.from = from;
		this.index = index;
		this.current = false;
		this.next = false;

		this.connections = [];
	}

	connect(node, index, path) {
		node.inputs[index].links.push(this);
		this.connections.push({node, index, path});
	}

	disconnect(node, index) {
		for (let i = this.connections.length - 1; i >= 0; --i) {
			let conn = this.connections[i];
			if (conn.node == node && conn.index == index) {
				this.connections.splice(i, 1);
			}
		}
	}

	destroy() {
		for (let conn of this.connections) {
			for (let i = conn.node.inputs[conn.index].links.length - 1; i >= 0; --i) {
				if (conn.node.inputs[conn.index].links[i] == this) {
					conn.node.inputs[conn.index].links.splice(i, 1);
				}
			}
		}
	}

	commit() {
		this.current = this.next;
	}
}

export class Input {
	constructor(x, y, name) {
		this.name = name || "Input";
		this.protected = false;
		this.x = x;
		this.y = y;
		this.inputs = [];
		this.outputs = [{name: "Input", link: new Link(this, 0)}];

		this.width = 4;
		this.height = 1;

		this.lit = false;
	}

	activate() {
		this.lit = !this.lit;
	}

	tick() {
		if (this.lit) {
			this.outputs[0].link.next = true;
		} else {
			this.outputs[0].link.next = false;
		}
	}

	commit() {
		this.outputs[0].link.commit();
	}
}

export class Output {
	constructor(x, y, name) {
		this.name = name || "Output";
		this.protected = false;
		this.x = x;
		this.y = y;
		this.inputs = [{name: "Output", links: []}];
		this.outputs = [];

		this.width = 4;
		this.height = 1;

		this.lit = false;
		this.nextLit = false;
	}

	tick() {
		this.nextLit = false;
		for (let link of this.inputs[0].links) {
			if (link.current) {
				this.nextLit = true;
				break;
			}
		}
	}

	commit() {
		this.lit = this.nextLit;
	}
}

export class Switch {
	constructor(x, y) {
		this.name = "OFF";
		this.protected = false;
		this.x = x;
		this.y = y;
		this.inputs = [];
		this.outputs = [{name: "Out", link: new Link(this, 0)}];

		this.width = 3;
		this.height = 1;

		this.lit = false;
	}

	activate() {
		this.lit = !this.lit;
		this.name = this.lit ? "ON" : "OFF";
	}

	tick() {
		if (this.lit) {
			this.outputs[0].link.next = true;
		} else {
			this.outputs[0].link.next = false;
		}
	}

	commit() {
		this.outputs[0].link.commit();
	}
}

export class NotGate {
	constructor(x, y) {
		this.name = "NOT";
		this.protected = false;
		this.x = x;
		this.y = y;
		this.inputs = [{name: "In", links: []}];
		this.outputs = [{name: "Out", link: new Link(this, 0)}];

		this.width = 4;
		this.height = 1;

		this.lit = false;
	}

	tick() {
		this.outputs[0].link.next = true;
		for (let link of this.inputs[0].links) {
			if (link.current) {
				this.outputs[0].link.next = false;
				break;
			}
		}
	}

	commit() {
		this.outputs[0].link.commit();
		this.lit = this.outputs[0].link.current;
	}
}

export class Diode {
	constructor(x, y) {
		this.name = "DIODE";
		this.protected = false;
		this.x = x;
		this.y = y;
		this.inputs = [{name: "In", links: []}];
		this.outputs = [{name: "Out", link: new Link(this, 0)}];

		this.width = 4;
		this.height = 1;

		this.lit = false;
	}

	tick() {
		this.outputs[0].link.next = false;
		for (let link of this.inputs[0].links) {
			if (link.current) {
				this.outputs[0].link.next = true;
				break;
			}
		}
	}

	commit() {
		this.outputs[0].link.commit();
		this.lit = this.outputs[0].link.current;
	}
}

export class Lamp {
	constructor(x, y) {
		this.name = "LAMP";
		this.protected = false;
		this.x = x;
		this.y = y;
		this.inputs = [{name: "In", links: []}];
		this.outputs = [];

		this.width = 4;
		this.height = 1;

		this.lit = false;
		this.nextLit = false;
	}

	tick() {
		this.nextLit = false;
		for (let link of this.inputs[0].links) {
			if (link.current) {
				this.nextLit = true;
				break;
			}
		}
	}

	commit() {
		this.lit = this.nextLit;
	}
}
