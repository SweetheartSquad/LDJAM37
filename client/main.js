

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
	player = new Player();


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

	scene.addChild(player.graphics);

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
	// get input
	var input = getInput();

	if(input.fullscreen){
		fullscreen.toggleFullscreen();
	}

	player.update();

	// update game
	// TODO


	// update input managers
	gamepads.update();
	keys.update();
	mouse.update();
}


function render(){
	screen_filter.uniforms["time"]=curTime/1000;

	player.draw();

	renderer.render(scene,renderTexture);
	try{
		renderer.render(renderSprite,null,true,false);
	}catch(e){
		renderer.render(scene,null,true,false);
		console.error(e);
	}
}


function getInput(){
	return {
		fullscreen: keys.isJustDown(keys.F)
	};
}
