varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform vec2 screen;
uniform vec2 bufferSize;
uniform float time;
uniform float transition;
uniform float transitionDirection;

void main(void){
	// get pixel
	vec2 uvs = vTextureCoord.xy;
	vec4 fg = texture2D(uSampler, uvs);
	
	// convert from almost NDC (uvs are based on largest power-of-2 instead of actual texture size) to pixels
	uvs.x *= bufferSize.x;
	uvs.y *= bufferSize.y;

	fg.rgb = mix(fg.rgb, fg.rgb/(vec3(255.0, 149.0, 162.0)/255.0), 1.0*uvs.y/screen.y*0.5);

	// transition circles
	float transitionSize = 150.0;
	vec2 tuvs = vec2(uvs.x + time * -250.0,uvs.y + time * -150.0);

	float t = (uvs.x/screen.x+uvs.y/screen.y)/2.0;
	if(transitionDirection > 0.0){
		t = 1.0 -t;
	}else{
		t = t;
	}
	t = 1.7 - t;
	float transitionStep = transition*transitionSize*t;


	tuvs=mod(tuvs, transitionSize);
	fg.rgb = mix(fg.rgb, (vec3(180.0, 226.0, 246.0)/255.0), step(transitionStep, distance(tuvs, vec2(transitionSize/2.0))));
	fg.a = 1.0;

	// output
	gl_FragColor = fg;
}