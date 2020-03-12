# Audio
This is the core audio library of DAWG. It does all of the scheduling and sound making!

So much of the credit of this library goes to @tambien (the creator of [Tone.js](https://github.com/Tonejs/Tone.js)). I used Tone.js for while before deciding to switch completely to my custom library built directly on top of the Web Audio API. When I decided to switch, a lot of the code I was using was already a custom implementation of Tone.js (e.g. the Transport, Clock, etc.). During the switchover I ported a lot of code from Tone.js and you will still see a *lot* of code he wrote :)
