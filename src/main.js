import Scene from './Scene.svelte';

import level01 from './levels/01-intro.js';

export default new Scene({
	target: document.body,
	props: {
		level: level01,
	},
});
