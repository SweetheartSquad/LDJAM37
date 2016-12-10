// linear interpolation
function lerp(from,to,t){
	if(Math.abs(to-from) < 1){
		return to;
	}
	return from+(to-from)*t;
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