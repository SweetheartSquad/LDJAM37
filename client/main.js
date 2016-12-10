

function main(){
	curTime=Date.now()-startTime;
	deltaTime=curTime-lastTime;

	update();
	render();

	lastTime=curTime;

	// request another frame to keep the loop going
	requestAnimationFrame(main);
}

function init(){
	player1 = new Player();
	player2 = new Player();


	// initialize input managers
	mouse.init("#display canvas");
	gamepads.init();
	keys.init();
	keys.capture=[keys.LEFT,keys.RIGHT,keys.UP,keys.DOWN,keys.SPACE,keys.ENTER,keys.BACKSPACE,keys.ESCAPE,keys.W,keys.A,keys.S,keys.D,keys.P,keys.M];


	scene = new PIXI.Container();
	game.addChild(scene);

	// setup screen filter
	screen_filter = new CustomFilter(PIXI.loader.resources.screen_shader.data);
	screen_filter.padding=0;
	renderSprite.filterArea = new PIXI.Rectangle(0,0,size.x,size.y);

	renderSprite.filters = [screen_filter];



	var g = new PIXI.Graphics();
	scene.addChild(g);

	g.beginFill(0xFFFFFF);
	g.drawRect(0,0,size.x,size.y);
	g.endFill();

	g.beginFill(0x000000);
	g.drawCircle(size.x/2, size.y/2, Math.min(size.x,size.y)/3);
	g.endFill();

	scene.addChild(player1.graphics);
	scene.addChild(player2.graphics);

	// setup resize
	window.onresize = onResize;
	onResize();

	// start the main loop
	main();
}

function onResize() {
	_resize();
	screen_filter.uniforms["screen"]=[size.x,size.y];
	screen_filter.uniforms["bufferSize"]=[nextPowerOfTwo(size.x),nextPowerOfTwo(size.y)];

	console.log("Resized",size,scaleMultiplier,[size.x*scaleMultiplier,size.y*scaleMultiplier]);
}

function update(){
	// update game
	var input;

	// player 1
	input = getInput(0);
	if(input.fullscreen){ fullscreen.toggleFullscreen(); }
	player1.ax += input.x;
	player1.ay += input.y;

	// player 2
	input = getInput(1);
	player2.ax += input.x;
	player2.ay += input.y;

	// update players
	player1.update();
	player2.update();

	// update input managers
	gamepads.update();
	keys.update();
	mouse.update();
}


function render(){
	screen_filter.uniforms["time"]=curTime/1000;

	player1.draw();
	player2.draw();

	renderer.render(scene,renderTexture);
	try{
		renderer.render(renderSprite,null,true,false);
	}catch(e){
		renderer.render(scene,null,true,false);
		console.error(e);
	}
}


function getInput(_playerId){
	var res = {
		fullscreen: false,
		
		x: 0,
		y: 0,

		jump: false,
		shoot: false
	};
	switch(_playerId){
		case 0:
		res.fullscreen = keys.isJustDown(keys.F);
		res.jump = keys.isJustDown(keys.E);
		res.shoot = keys.isJustDown(keys.R);

		if(keys.isDown(keys.A)){ res.x -= 1; }
		if(keys.isDown(keys.D)){ res.x += 1; }
		if(keys.isDown(keys.W)){ res.y -= 1; }
		if(keys.isDown(keys.S)){ res.y += 1; }
		break;
		
		case 1:
		
		res.jump = keys.isJustDown(keys.O);
		res.shoot = keys.isJustDown(keys.P);

		if(keys.isDown(keys.J)){ res.x -= 1; }
		if(keys.isDown(keys.L)){ res.x += 1; }
		if(keys.isDown(keys.I)){ res.y -= 1; }
		if(keys.isDown(keys.K)){ res.y += 1; }
		break;
	}
	
	return res;
}
