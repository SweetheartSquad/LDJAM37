varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform vec2 screen;
uniform vec2 bufferSize;
uniform float time;

void main(void){
	// get pixel
	vec2 uvs = vTextureCoord.xy;
	vec4 fg = texture2D(uSampler, uvs);
	
	// convert from almost NDC (uvs are based on largest power-of-2 instead of actual texture size) to pixels
	uvs.x *= bufferSize.x;
	uvs.y *= bufferSize.y;

	fg.a = 1.0 + time; // time is just here so that it doesn't get optimized out when not used elsewhere

	// output
	gl_FragColor = fg;
}