<main>
	<CircuitSim components={components} />
</main>

<script>
	import CircuitSim from './CircuitSim.svelte';
	import * as comps from './circuit-components.js';

	let components = [
		comps.SwitchComponent, comps.NotGateComponent,
		comps.DiodeComponent, comps.LampComponent,
	];
</script>
