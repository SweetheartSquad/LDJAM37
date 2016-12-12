varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform vec2 screen;
uniform vec2 bufferSize;
uniform float time;
uniform float transition;

void main(void){
	// get pixel
	vec2 uvs = vTextureCoord.xy;
	vec4 fg = texture2D(uSampler, uvs);
	
	// convert from almost NDC (uvs are based on largest power-of-2 instead of actual texture size) to pixels
	uvs.x *= bufferSize.x;
	uvs.y *= bufferSize.y;

	// transition circles
	float transitionSize = 150.0;
	uvs.x += time * -250.0;
	uvs.y += time * -150.0;
	uvs=mod(uvs, transitionSize);
	fg.rgb = mix(fg.rgb, vec3(1.0), step(transition*transitionSize*0.71, distance(uvs, vec2(transitionSize/2.0))));

	fg.a = 1.0;

	// output
	gl_FragColor = fg;
}