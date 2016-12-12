// linear interpolation
function lerp(from,to,t){
	if(Math.abs(to-from) < 0.0000001){
		return to;
	}
	return from+(to-from)*t;
}

function slerp(from,to,by){
	from /= Math.PI*2;
	to /= Math.PI*2;
 while (to-from > 0.5){ from += 1 }
 while (to-from < -0.5){ from -= 1 }
 return ((from + by * (to - from)) % 1) * Math.PI * 2;
}

// returns v, clamped between min and max
function clamp(min,v,max){
	return Math.max(min,Math.min(v,max));
}



function toggleMute(){
	if(Howler._muted){
		Howler.unmute();
	}else{
		Howler.mute();
	}
}


function ease(t) {
	if ((t/=0.5) < 1) {
		return 0.5*t*t*t;
	}
	return 0.5*((t-=2)*t*t + 2);
};


// returns the smallest power-of-2 which contains v 
function nextPowerOfTwo(v){
	return Math.pow(2, Math.ceil(Math.log(v)/Math.log(2)));
}


// returns fractional part of number
function fract(v){
	return v-Math.floor(Math.abs(v))*Math.sign(v);
}


// used for initializing movieclip
function getFrames(_texture){
	var res=[];
	var i = 0;
	do{
		var t=_texture+"-"+i;
		i+=1;
		
		if(!PIXI.loader.resources[t]){
			break;
		}
		t=PIXI.Texture.fromFrame(t);
		
		res.push(t);
	}while(i<32);

	if(res.length == 0){
		res.push(PIXI.loader.resources["error"]);
	}

	return res;
}


function renderSVG(g, input){
	input = input.replace(/[-]/g,",-");

	var instructions = input.match(/[A-z]/g);
	var inputs = input.split(/[A-z]/g);
	inputs.shift();

	//console.log(inputs);
	//console.log(instructions);

	var start = {x: 0, y: 0};
	var current = {x: 0, y: 0};
	var lastCurve = {x: 0, y: 0};
	for(var i = 0; i < instructions.length; ++i){

		if(inputs[i].substr(0,1) == ","){
			inputs[i] = inputs[i].substr(1);
		}
		var data = inputs[i].split(",");

		var relative = false;
		//console.log(instructions[i]);
		switch(instructions[i]){
			case "m":
			case "M":
			// move
			start.x = parseFloat(data[0]);
			start.y = parseFloat(data[1]);
			g.moveTo(start.x, start.y);
			current.x = start.x;
			current.y = start.y;
			break;

			case "l":
			// line (relative)
				current.x += parseFloat(data[0]);
				current.y += parseFloat(data[1]);
				g.lineTo(current.x, current.y);
			break;
			case "L":
			// line (absolute)
				current.x = parseFloat(data[0]);
				current.y = parseFloat(data[1]);
				g.lineTo(current.x, current.y);
			break;

			case "h":
			// horizontal line (relative)
				current.x += parseFloat(data[0]);
				g.lineTo(current.x, current.y);
			case "H":
			// horizontal line (absolute)
				current.x = parseFloat(data[0]);
				g.lineTo(current.x, current.y);
			break;

			case "v":
			// vertical line (relative)
				current.y += parseFloat(data[0]);
				g.lineTo(current.x, current.y);
			case "V":
			// vertical line (absolute)
				current.y = parseFloat(data[0]);
				g.lineTo(current.x, current.y);
			break;

			case "z":
			case "Z":
			// close
			g.lineTo(start.x, start.y);
			break;

			case "c":
			// curve (relative)
				g.bezierCurveTo(
					current.x + parseFloat(data[0]),
					current.y + parseFloat(data[1]),
					current.x + parseFloat(data[2]),
					current.y + parseFloat(data[3]),
					current.x + parseFloat(data[4]),
					current.y + parseFloat(data[5])
				);
				lastCurve.x = 2*(current.x+parseFloat(data[4])) - (current.x+parseFloat(data[2]));
				lastCurve.y = 2*(current.y+parseFloat(data[5])) - (current.y+parseFloat(data[3]));

				current.x += parseFloat(data[4]);
				current.y += parseFloat(data[5]);
			break;

			case "C":
			// curve (absolute)
				g.bezierCurveTo(
					parseFloat(data[0]),
					parseFloat(data[1]),
					parseFloat(data[2]),
					parseFloat(data[3]),
					parseFloat(data[4]),
					parseFloat(data[5])
				);
				lastCurve.x = 2*parseFloat(data[4]) - parseFloat(data[2]);
				lastCurve.y = 2*parseFloat(data[5]) - parseFloat(data[3]);

				current.x = parseFloat(data[4]);
				current.y = parseFloat(data[5]);
			break;

			case "s":
			// curve with reflection (relative)
				g.bezierCurveTo(
					current.x + lastCurve.x,
					current.y + lastCurve.y,
					current.x + parseFloat(data[0]),
					current.y + parseFloat(data[1]),
					current.x + parseFloat(data[2]),
					current.y + parseFloat(data[3])
				);
				lastCurve.x = 2*parseFloat(data[2]) - parseFloat(data[0]);
				lastCurve.y = 2*parseFloat(data[3]) - parseFloat(data[1]);

				current.x += parseFloat(data[2]);
				current.y += parseFloat(data[3]);
			break;
			case "S":
			// curve with reflection (absolute)
				g.bezierCurveTo(
					lastCurve.x,
					lastCurve.y,
					parseFloat(data[0]),
					parseFloat(data[1]),
					parseFloat(data[2]),
					parseFloat(data[3])
				);
				lastCurve.x = 2*parseFloat(data[2]) - parseFloat(data[0]);
				lastCurve.y = 2*parseFloat(data[3]) - parseFloat(data[1]);

				current.x = parseFloat(data[2]);
				current.y = parseFloat(data[3]);
			break;
		}
	}
}