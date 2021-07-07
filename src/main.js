import MainMenu from "./MainMenu.svelte";
import SceneSelector from "./SceneSelector.svelte";
import Sandbox from "./Sandbox.svelte";

import Router from './Router.svelte';

export default new Router({
	target: document.body,
	props: {
		routes: [
			["/", MainMenu],
			["/play/:levelId", SceneSelector],
			["/play", SceneSelector],
			["/sandbox", Sandbox],
		],
	},
});
