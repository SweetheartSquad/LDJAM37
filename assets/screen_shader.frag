varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform vec2 screen;
uniform vec2 bufferSize;
uniform float time;
uniform float transition;
uniform float transitionDirection;

vec3 tex(vec2 uv){
	vec3 res = texture2D(uSampler, uv/bufferSize).rgb;

	// transition circles
	float transitionSize = 150.0;
	vec2 tuvs = vec2(uv.x + time * -250.0,uv.y + time * -150.0);

	float t = (uv.x/screen.x+uv.y/screen.y)/2.0;
	if(transitionDirection > 0.0){
		t = 1.0 -t;
	}else{
		t = t;
	}
	t = 1.7 - t;
	float transitionStep = transition*transitionSize*t;
	tuvs=mod(tuvs, transitionSize);
	transitionStep = step(transitionStep, distance(tuvs, vec2(transitionSize/2.0)));

	res= mix(res, (vec3(180.0, 226.0, 246.0)/255.0), transitionStep);
	res = mix(res, res/(vec3(255.0, 149.0, 162.0)/255.0), (1.0 - uv.y/screen.y)*0.75*transitionStep);

	return res;
}

void main(void){
	// get pixel
	vec2 uvs = vTextureCoord.xy;

	uvs *= bufferSize;

	vec3 fg = tex(uvs);

	float f =
	distance(fg.rgb,tex((uvs+vec2(1,1))).rgb)+
	distance(fg.rgb,tex((uvs+vec2(1,-1))).rgb)+
	distance(fg.rgb,tex((uvs+vec2(-1,-1))).rgb)+
	distance(fg.rgb,tex((uvs+vec2(-1,1))).rgb)+
	distance(fg.rgb,tex((uvs+vec2(-1,0))).rgb)+
	distance(fg.rgb,tex((uvs+vec2(0,1))).rgb)+
	distance(fg.rgb,tex((uvs+vec2(1,0))).rgb)+
	distance(fg.rgb,tex((uvs+vec2(0,-1))).rgb);

	fg.rgb-=vec3( smoothstep(0.0, 1.0, f));



	// output
	gl_FragColor.rgb = fg;
	gl_FragColor.a = 1.0;
}