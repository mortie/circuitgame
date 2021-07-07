<main>
	<CircuitSim components={components} />
</main>

<script>
	import CircuitSim from './CircuitSim.svelte';
	import * as comps from './circuit-components.js';

	let components = [
		{name: "Switch", ctor: comps.Switch},
		{name: "NotGate", ctor: comps.NotGate},
		{name: "Diode", ctor: comps.Diode},
		{name: "Lamp", ctor: comps.Lamp},
	];
</script>
