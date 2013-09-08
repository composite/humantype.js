var ht = require('./lib/humantype');

var String1 = ht.define({
	type: 'string', min: 1, max: 8,
	pattern: /\d+/, strict: '{0} is not valid string.'
});

var Number1 = ht.define({
	type:'number', min: 0, max: 100,
	pattern: Math.round
});

var serial = new String1('325073');
var percent = new Number1(999);

console.log(serial.valid());
console.log(percent.valid());

console.log(serial.value());
console.log(percent.value());