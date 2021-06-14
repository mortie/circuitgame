<main>
	<svelte:component this={element} />
</main>

<script>
	import MainMenu from "./MainMenu.svelte";
	import SceneSelector from "./SceneSelector.svelte";

	let routes = {
		"/": MainMenu,
		"/play": SceneSelector,
	};

	let element = null;

	function route() {
		let path = location.hash.substr(1);
		if (path == "") {
			path = "/";
		}

		if (routes[path] != null) {
			element = routes[path];
		} else {
			element = routes["/"];
		}
	}

	route();
	window.addEventListener("hashchange", route);
</script>
