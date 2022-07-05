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
	import {LogicSim} from './LogicSim.js';

	export let components;
	export let nodes = [];

	let canvas;
	let sim;
	let interval = null;

	onMount(() => {
		sim = new LogicSim(canvas);
		for (let node of nodes) {
			sim.nodes.push(node);
		}

		interval = setInterval(sim.update.bind(sim), 100);
	});

	onDestroy(() => {
		if (interval != null) {
			clearInterval(interval);
			interval = null;
		}
	});
</script>
