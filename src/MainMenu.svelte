<main>
	<h1>Game</h1>

	<ul>
		<li><a on:click={play} href="#/play">Start</a></li>
		<li><a href="#/sandbox">Sandbox Mode</a></li>
	</ul>
</main>

<style>
	main {
		max-width: 1000px;
		margin: auto;
	}

	a {
		color: #ccc;
	}
</style>

<script>
	function play() {
		let el = document.getElementById("soundtrack");
		console.log(el);
		el.play();
	}
</script>
