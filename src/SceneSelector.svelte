<main>
	<Scene level={level} />
</main>

<script>
	import Scene from './Scene.svelte';
	import * as levels from "./levels.js";

	export let levelId = "001";

	let level = levels["level" + levelId];
	if (level == null) {
		console.warn("Unknown level ID:", levelId);
		level = levels["level001"];
	}
</script>
