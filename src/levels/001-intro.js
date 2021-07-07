export default {
	name: "Intro",
	inputs: [
		"Input",
	],
	outputs: [
		"LED",
	],
	components: [
		"Input",
		"NotGate",
	],

	tests: [
		[false], [false],
		[true], [true],
	],

	errtext: `
"No, that's not quite right", you think to yourself.
"The input was supposed to trigger the LED".
`,

	pages: [`
... ... ...

<p>You wake up. Your head hurts. You don't know where you are. Your eyes
are blurry. You can't remember a thing. You don't remember how you got here.
The only thing you recall is the feeling of cold concrete. The smell
of musty walls. The only thing you're certain of is that you have been here
for a while.</p>

<p>Where is "here", exactly? You don't know. You don't remember. The only thing
you sense is the slightly moist, cold concrete floor below you, a smell which
you can only describe as "old", a slight pain in your left shoulder, and a
stiff neck. And then there's the sound. Tick. Tock. Tick. Tock.
Undoubtedly an old wall clock, somewhere to your right.</p>

<p>As your eyes slowly start to focus, you see that you're in a big, empty
concrete room. There are no doors or windows that you can see. There's one
lonely, dim light source in the ceiling. It flickers every now and then,
and has a faintly reddish tint. There's a small, exposed pipe in one corner
of the room. It's clearly moist. Every now and then, a drop of water drips
down and hits the floor. There's a small patch of green mold around where
the water droplets land. In another corner of the room is a strange-looking
machine, about half as tall as a grown adult and twice as wide.</p>
`, `
<p>You make your way to the strange machine. It has buttons, switches and a screen.
"ROCKMAX CIRCUITS 2000" is engraved on the front. It looks old, but sturdy.
It's connected to a panel on the wall with a couple of black wires.
The panel on the wall looks like an old telephone switchboard, with a large
grid of sockets, some with wires connected.
All the sockets are labeled with a combination of letters and numbers.</p>

<p>There's a small, dusty envelope next to the machine. You open it, and find
a letter with small, hand-written text on slightly yellowed paper.</p>

<blockquote>
<p>Hello.</p>

<p>I hope they didn't hurt you too bad. They can be pretty rough when taking
people away like that. Don't worry. We will get you out of there.</p>

<p>They've been running out of places to isolate people. You're lucky,
relatively speaking, to have ended up in an old electronics workshop.
There should be a switchboard in there with you, along with a
circuit printer.</p>

<p>Our first course of action should be to establish a basic form of one-way
communication. Our options are limited, but I should be able to affect the
voltage of the socket labelled AJ-22 from here. You will have to create a
small circuit which which connects AJ-22 to a light-emitting diode (LED).
Once you do, I will send you the next step.</p>

<p>I will be sending you instructions using morse code. I will write down a
morse code chart on the other side of this paper.</p>

<p>Regards,<br>
Edward Smith</p>
`, `
<p>Indeed, there's a chart which translates dots and dashes to characters
scribbled down on the other side of the paper.</p>

<p>You get right down to business and start inspecting the weird machine - you assume
it's the "circuit printer" Edward mentioned. There's a big red button on top
which looks different from all the other buttons and switches. You assume that's
the power button and hit it. Indeed, a second or two after pushing the button,
the machine starts whirring and beeping. Eventually, the display lights up and 
shows "ROCKMAX COMPUTER SYSTEMS, INC." with black text on a blue background.</p>

<p>After around half a minute of bleeping and blinking, the screen
turns off briefly, before it shows something which looks like a user interface.
After a second's hesitation, you approach it and start working.</p>
`
	],
};
