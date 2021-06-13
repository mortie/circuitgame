<script>
	export let level;

	let page = 0;

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
		console.log("ok");
	}
</script>

<main>
	<h1>{level.name}</h1>

	<div id="story">
		<p></p>
		{@html level.pages[page]}
		<p></p>
	</div>

	<div id="controls">
		{page + 1}/{level.pages.length}
		<button on:click={previous} disabled={page == 0}>Back</button>
		{#if page < level.pages.length - 1}
			<button on:click={next}>Next</button>
		{:else}
			<button on:click={begin}>Begin</button>
		{/if}
	</div>
</main>

<style>
	h1 {
		margin-bottom: 0px;
		text-align: center;
	}
	#story {
		max-width: 800px;
		margin: auto;
	}
	#story p:first-child {
		margin: 0px;
	}
	#controls {
		text-align: center;
	}
</style>
