<main>
	<svelte:component this={currentElement} {...currentProps} />
</main>

<script>
	export let routes;

	let routeMap = new Map();
	for (let route of routes) {
		let [descriptor, el] = route;
		let parts = descriptor.split("/:");
		let props = parts.slice(1);
		let base = parts[0] + "@" + props.length;

		routeMap.set(base, {props, el});
	}

	let currentElement = null;
	let currentProps = null;

	function route() {
		let path = location.hash.substr(1);
		if (path[0] != "/") {
			console.error("Illegal path:", path);
			path = "/";
		} else if (path == "") {
			path = "/";
		}

		let parts = path.split("/").filter(el => el != "");
		let base = "/" + parts.join("/") + "@0";
		let propVals = [];
		let route = routeMap.get(base);

		// Check if we match anything, removing one path component every iteration
		while (route == null && parts.length > 0) {
			propVals.push(parts.pop());
			base = "/" + parts.join("/") + "@" + propVals.length;
			route = routeMap.get(base);
		}

		if (route == null) {
			console.warn("No route matches", path);
			route = routeMap.get("/@0");
		}

		let props = {};
		for (let propName of route.props) {
			props[propName] =  propVals.pop();
		}

		currentElement = route.el;
		currentProps = props;
	}

	route();
	window.addEventListener("hashchange", route);
</script>
