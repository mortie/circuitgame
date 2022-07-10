// This file implements serialization and deserialization for the JCOF format:
// https://gist.github.com/mortie/b9b5a758214101b4238bb65c6fdb0687

function mapNamesToId(ctx, obj) {
	if (obj instanceof Array) {
		for (let ent of obj) {
			mapNamesToId(ctx, ent);
		}
	} else if (typeof obj == "object" && obj != null) {
		for (let key of Object.keys(obj)) {
			if (!ctx.idMap.has(key)) {
				ctx.idMap.set(key, ctx.names.length);
				ctx.names.push(key);
			}

			mapNamesToId(ctx, obj[key]);
		}
	} else if (typeof obj == "string") {
		if (!ctx.idMap.has(obj)) {
			ctx.idMap.set(obj, ctx.names.length);
			ctx.names.push(obj);
		}
	}
}

let alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
let alphanum = {};
for (let i = 0; i < alphabet.length; ++i) {
	alphanum[alphabet[i]] = i;
}

function b62enc(num) {
	let str = "";
	do {
		str += alphabet[num % alphabet.length];
		num = Math.floor(num / alphabet.length);
	} while (num > 0);
	return str;
}

function b62dec(str) {
	let num = 0;
	let mul = 1;
	for (let ch of str) {
		num += alphanum[ch] * mul;
		mul *= alphabet.length;
	}

	return num;
}

function stringifyPart(idMap, obj) {
	let str = "";
	let t = typeof obj;
	if (obj instanceof Array) {
		str += "[";
		let first = true;
		for (let val of obj) {
			if (!first) {
				str += ",";
			}
			first = false;

			str += stringifyPart(idMap, val);
		}
		str += "]";
	} else if (typeof obj == "object" && obj != null) {
		str += "{";
		let first = true;
		for (let key of Object.keys(obj)) {
			if (!first) {
				str += ",";
			}
			first = false;

			str += b62enc(idMap.get(key));
			str += ":";
			str += stringifyPart(idMap, obj[key]);
		}
		str += "}";
	} else if (t == "number") {
		if (obj == Math.floor(obj)) {
			if (obj >= 0) {
				str += "i"; str += b62enc(obj);
			} else {
				str += "I"; str += b62enc(-obj);
			}
		} else {
			str += obj.toString();
		}
	} else if (t == "string") {
		str += "s";
		str += b62enc(idMap.get(obj));
	} else if (t == "boolean") {
		str += obj ? "b" : "B";
	} else if (obj == null) {
		str += "n";
	} else {
		throw new Error("Can't serialize: " + t);
	}

	return str;
}

function stringifyNames(names) {
	let str = "";
	let first = true;
	for (let name of names) {
		if (!first) {
			str += ",";
		}
		first = false;

		if (/^[a-zA-Z0-9]+$/.test(name)) {
			str += name;
		} else {
			str += JSON.stringify(name);
		}
	}

	return str;
}

export function stringify(obj) {
	let names = [];
	let idMap = new Map();
	mapNamesToId({idMap, names}, obj);
	let serialized = "";
	serialized += stringifyNames(names);
	serialized += ";";
	serialized += stringifyPart(idMap, obj);
	return serialized;
}

class Reader {
	constructor(str) {
		this.str = str;
		this.index = 0;
	}

	peek() {
		if (this.index >= this.str.length) {
			return null;
		} else {
			return this.str[this.index];
		}
	}

	consume() {
		if (this.index < this.str.length) {
			this.index += 1;
		}
	}

	skipSpace() {
		while (true) {
			let ch = this.peek();
			if (ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r') {
				this.consume();
			} else {
				break;
			}
		}
	}
}

function readJsonString(r) {
	let start = r.index;
	r.consume();
	while (true) {
		ch = r.peek();
		r.consume();
		if (ch == '"') {
			break;
		} else if (ch == '\\') {
			r.consume();
		} else if (ch == null) {
			throw new Error("Unexpected EOF");
		}
	}

	console.log("readString", r.str.substring(start, r.index));
	return JSON.parse(r.str.substring(start, r.index));
}

function readIdent(r) {
	let str = "";
	let ch = r.peek();
	while (/[0-9a-zA-Z]/.test(ch)) {
		str += ch;
		r.consume();
		ch = r.peek();
	}

	if (str.length == 0) {
		throw new Error("Zero-length identifier");
	}

	return str;
}

function readString(r) {
	let ch = r.peek();
	if (ch == '"') {
		return readJsonString(r);
	} else {
		return readIdent(r);
	}
}

function readStringRef(names, r) {
	return names[b62dec(readIdent(r))];
}

function parseValue(names, r) {
	r.skipSpace();
	let ch = r.peek();
	if (ch == '[') {
		r.consume();
		let arr = [];
		r.skipSpace();
		if (r.peek() == ']') {
			r.consume();
			return arr;
		}

		while (true) {
			arr.push(parseValue(names, r));
			r.skipSpace();
			ch = r.peek();
			if (ch == ']') {
				r.consume();
				return arr;
			} else if (ch != ',') {
				throw new Error("Unexpected char: " + r.peek());
			}

			r.consume();
		}
	} else if (ch == '{') {
		r.consume();
		let obj = {};
		r.skipSpace();
		if (r.peek() == '}') {
			r.consume();
			return obj;
		}

		while (true) {
			r.skipSpace();
			let name = readStringRef(names, r);
			r.skipSpace();
			if (r.peek() != ':') {
				throw new Error("Unexpected char: " + r.peek());
			}

			r.consume();
			obj[name] = parseValue(names, r);

			r.skipSpace();
			ch = r.peek();
			if (ch == '}') {
				r.consume();
				return obj;
			} else if (ch != ',') {
				throw new Error("Unexpected char: " + r.peek());
			}

			r.consume();
		}
	} else if (ch == 'i') {
		r.consume();
		return b62dec(readIdent(r));
	} else if (ch == 'I') {
		r.consume();
		return -b62dec(readIdent(r));
	} else if (/[0-9]/.test(ch)) {
		let str = "";
		do {
			str += ch;
			r.consume();
			ch = r.peek();
		} while (/[0-9\.]/.test(ch));
		return parseFloat(str);
	} else if (ch == 's') {
		r.consume();
		return readStringRef(names, r);
	} else if (ch == 'b') {
		r.consume();
		return true;
	} else if (ch == 'B') {
		r.consume();
		return false;
	} else if (ch == 'n') {
		r.consume();
		return null;
	}

	throw new Error("Unexpected char: " + ch);
}

export function parse(str) {
	let r = new Reader(str);
	let names = [];
	while (true) {
		r.skipSpace();
		let ch = r.peek();
		if (ch == ';') {
			r.consume();
			break;
		} else if (ch == ',') {
			r.consume();
			r.skipSpace();
		}

		names.push(readString(r));
	}

	return parseValue(names, r);
}
