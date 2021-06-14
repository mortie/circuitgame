<main>
	{#if showIntro}
		<h1>{level.name}</h1>

		<div class="story">
			<p></p>
			{@html level.pages[page]}
			<p></p>
		</div>

		<div class="controls">
			{page + 1}/{level.pages.length}
			<button on:click={previous} disabled={page == 0}>Back</button>
			{#if page < level.pages.length - 1}
				<button on:click={next}>Next</button>
			{:else}
				<button on:click={begin}>Begin</button>
			{/if}
			<button on:click={begin}>Skip</button>
		</div>
	{:else}
		<CircuitSim />
	{/if}
</main>

<style>
	h1 {
		margin-bottom: 0px;
		text-align: center;
	}

	.story {
		max-width: 800px;
		margin: auto;
	}

	.story p:first-child {
		margin: 0px;
	}

	.controls {
		text-align: center;
	}
</style>

<script>
	export let level;

	import CircuitSim from './CircuitSim.svelte';

	let page = 0;
	let showIntro = true;

	function previous() {
		if (page > 0) {
			page -= 1;
		}
	}

	function next() {
		if (page < level.pages.length - 1) {
			page += 1;
		}
	}

	function begin() {
		showIntro = false;
	}
</script>
