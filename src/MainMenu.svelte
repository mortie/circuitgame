<main>
	<h1>Game</h1>

	<a on:click={play} href="#/play">Start</a>
</main>

<style>
	main {
		max-width: 1000px;
		margin: auto;
	}

	a {
		color: #aaa;
	}
</style>

<script>
	function play() {
		let el = document.getElementById("soundtrack");
		console.log(el);
		el.play();
	}
</script>
