function main(){
	curTime = Date.now()-startTime;
	deltaTime = curTime-lastTime;

	update();
	render();

	lastTime = curTime;

	// request another frame to keeps the loop going
	requestAnimationFrame(main);
}

function init(){
	// initialize input managers
	mouse.init("#display canvas");
	gamepads.init();
	keys.init();
	keys.capture = [keys.LEFT,keys.RIGHT,keys.UP,keys.DOWN,keys.SPACE,keys.ENTER,keys.BACKSPACE,keys.ESCAPE,keys.W,keys.A,keys.S,keys.D,keys.P,keys.M];

	// setup screen filter
	screen_filter = new CustomFilter(PIXI.loader.resources.screen_shader.data);
	screen_filter.padding = 0;
	renderSprite.filterArea = new PIXI.Rectangle(0,0,size.x,size.y);

	renderSprite.filters = [screen_filter];

	transition = 0;
	transitionDirection = 1;


	menu = new Menu([]);

	// setup resize
	window.onresize = onResize;
	onResize();

	// start the main loop
	main();
}

function onResize() {
	_resize();
	screen_filter.uniforms["screen"] = [size.x,size.y];
	screen_filter.uniforms["bufferSize"] = [nextPowerOfTwo(size.x),nextPowerOfTwo(size.y)];

	console.log("Resized",size,scaleMultiplier,[size.x*scaleMultiplier,size.y*scaleMultiplier]);
}

function update(){

	if(menu){
		menu.update();
		if(menu.isDone()){
			transition = Math.max(0.0, transition-0.02);
			transitionDirection = -1;
			if(transition < 0.0001){
				sounds["transition"].play();
				arena = new Arena(menu.getPlayers());
				menu.destroy();
				menu = false;
			}
		}else{
			transition = Math.min(1.0, transition+0.02);
			transitionDirection = 1;
		}
	}else if(arena){
		arena.update();
		if(arena.done){
			transition = Math.max(0.0, transition-0.02);
			transitionDirection = -1;
			if(transition < 0.0001){
				sounds["transition"].play();
				menu = new Menu(arena.getPlayers());

				var players = [];
				arena.destroy();
				arena = false;
			}
		}else{
			transition = Math.min(1.0, transition+0.02);
			transitionDirection = 1;
		}
	}else{

	}


	if(keys.isJustDown(keys.F)){
		fullscreen.toggleFullscreen();
	}if(keys.isJustDown(keys.M)){
		toggleMute();
	}
	
	// update input managers
	gamepads.update();
	keys.update();
	mouse.update();
}


function render(){
	screen_filter.uniforms["transition"] = transition;
	screen_filter.uniforms["transitionDirection"] = transitionDirection;
	screen_filter.uniforms["time"] = curTime/1000;

	if(menu){
		menu.render();
	}else if(arena){
		arena.render();
	}

	renderer.render(game,renderTexture);
	try{
		renderer.render(renderSprite,null,true,false);
	}catch(e){
		renderer.render(game,null,true,false);
		console.error(e);
	}
}




function getInput(_playerId){
	var res = {
		x: 0,
		y: 0,

		jump: false,
		shoot: false
	};

	// keyboard input
	var keyConfig = {
		left: null,
		right: null,
		up: null,
		down: null,
		jump: null,
		shoot: null
	};

	switch(_playerId){
		case 0:
		keyConfig.left = keys.A;
		keyConfig.right = keys.D;
		keyConfig.up = keys.W;
		keyConfig.down = keys.S;
		keyConfig.jump = keys.E;
		keyConfig.shoot = keys.R;
		break;

		case 1:
		keyConfig.left = keys.J;
		keyConfig.right = keys.L;
		keyConfig.up = keys.I;
		keyConfig.down = keys.K;
		keyConfig.jump = keys.O;
		keyConfig.shoot = keys.P;
		break;

		default:
		// no keyboard controls past first two players
	}

	if(keys.isDown(keyConfig.left)){ res.x -= 1; }
	if(keys.isDown(keyConfig.right)){ res.x += 1; }
	if(keys.isDown(keyConfig.up)){ res.y -= 1; }
	if(keys.isDown(keyConfig.down)){ res.y += 1; }

	if(keys.isJustDown(keyConfig.jump)){ res.jump = true};
	if(keys.isJustDown(keyConfig.shoot)){ res.shoot = true};

	// gamepad input
	if(gamepads.axisPast(gamepads.LSTICK_H, -0.5, -1, _playerId) || gamepads.isDown(gamepads.DPAD_LEFT, _playerId)){ res.x -= 1; }
	if(gamepads.axisPast(gamepads.LSTICK_H, 0.5, 1, _playerId) || gamepads.isDown(gamepads.DPAD_RIGHT, _playerId)){ res.x += 1; }
	if(gamepads.axisPast(gamepads.LSTICK_V, -0.5, -1, _playerId) || gamepads.isDown(gamepads.DPAD_UP, _playerId)){ res.y -= 1; }
	if(gamepads.axisPast(gamepads.LSTICK_V, 0.5, 1, _playerId) || gamepads.isDown(gamepads.DPAD_DOWN, _playerId)){ res.y += 1; }

	if(gamepads.isJustDown(gamepads.A, _playerId) || gamepads.isJustDown(gamepads.Y, _playerId) ){ res.jump = true; }
	if(gamepads.isJustDown(gamepads.X, _playerId) || gamepads.isJustDown(gamepads.B, _playerId) ){ res.shoot = true; }

	// clamp directional input (might be using both keyboard and controller)
	res.x = clamp(-1, res.x, 1);
	res.y = clamp(-1, res.y, 1);

	return res;
}

var colors = [0xf70208, 0xffec6b, 0x29018c];


function makeBg(){
	var res = new PIXI.Container();
	var bgcolors=[0xfff9c2,0xb4e2f6,0xff959c];
	var y = 0;
	var i = 0;
	while(y < size.y){
		var bg = new PIXI.Graphics();
		res.addChild(bg);
		bg.beginFill(i%2 == 1 ? 0xd6a598 : bgcolors[(i/2)%3]);
		renderSVG(bg, "M1614.814-24.05c-181.579,0-151.131-103.947-324.814-103.947c-174,0-143.606,103.947-325.186,103.947S813.684-127.997,640-127.997c-174,0-143.606,103.947-325.186,103.947S163.684-127.997-10-127.997v296c173.684,0,143.235,103.947,324.814,103.947S466,168.003,640,168.003c173.684,0,143.235,103.947,324.814,103.947S1116,168.003,1290,168.003c173.684,0,143.235,103.947,324.814,103.947S1766,168.003,1940,168.003v-296C1766-127.997,1796.394-24.05,1614.814-24.05z");
		bg.endFill();

		if(i%2 == 0){
			y += 5;
		}else{
			y += 150;
		}
		bg.y = y;
		i+=1;
	}

	return res;
}