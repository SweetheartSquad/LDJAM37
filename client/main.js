
function main(){
	curTime=Date.now()-startTime;
	deltaTime=curTime-lastTime;

	update();
	render();

	lastTime=curTime;

	// request another frame to keeps the loop going
	requestAnimationFrame(main);
}

function init(){
	player1 = new Player();
	player2 = new Player();
	levelPiecesVert = [];
	levelPiecesHorz = [];


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

	genLevel();

	scene.addChild(player1.body);
	scene.addChild(player1.head);
	scene.addChild(player1.footL);
	scene.addChild(player1.footR);
	scene.addChild(player1.arms);

	scene.addChild(player2.body);
	scene.addChild(player2.head);
	scene.addChild(player2.footL);
	scene.addChild(player2.footR);
	scene.addChild(player2.arms);

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

	if(Math.abs(input.x) > 0){
		player1.flipped = input.x < 0;
	}
	//player1.ay += input.y;
	if(input.jump && player1.canJump()){
		player1.ay += -40;

		if(player1.canWallJump()){
			player1.ax += -40 * (player1.flipped ? -1 : 1)
		}
	}

	// player 2
	input = getInput(1);
	player2.ax += input.x;

	if(Math.abs(input.x) > 0){
		player2.flipped = input.x < 0;
	}
	//player2.ay += input.y;
	if(input.jump && player2.canJump()){
		player2.ay += -40;

		if(player2.canWallJump()){
			player2.ax += -40 * (player2.flipped ? -1 : 1)
		}
	}

	// gravity
	player1.ay += 1;
	player2.ay += 1;

	// update players
	player1.update();
	player2.update();


	getPieceForPlayer(player1);

	// update collisions
	

	var boundaryForce = 0.1;
	var boundaryPadding = 35;

	player1.touchingWall = player1.touchingFloor = player1.touchingCeil = false;

	if(player1.px < boundaryPadding){
		player1.ax += (boundaryPadding-player1.px) * boundaryForce;
		player1.touchingWall = true;
	}if(player1.px > size.x - boundaryPadding){
		player1.ax -= (player1.px - (size.x - boundaryPadding)) * boundaryForce;
		player1.touchingWall = true;
	}
	if(player1.py < boundaryPadding){
		player1.ay += (boundaryPadding-player1.py) * boundaryForce;
		player1.touchingCeil = true;
	}if(player1.py > size.y - boundaryPadding){
		player1.ay -= (player1.py - (size.y - boundaryPadding)) * boundaryForce;
		player1.touchingFloor = true;
	}

	// update input managers
	gamepads.update();
	keys.update();
	mouse.update();
}


function render(){
	screen_filter.uniforms["time"]=curTime/1000;

	//player1.draw();
	//player2.draw();

	for( var i = 0; i < levelPiecesHorz.length; i++ ){
		levelPiecesHorz[i].draw();
	}

	for( var i = 0; i < levelPiecesVert.length; i++ ){
		levelPiecesVert[i].draw();
	}

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

var colors = [0xff0000, 0xffff00, 0x0000ff];

function genWallHorz(y, rad){
	var x = 0;
	var c = 0;
	while( x < size.x + rad ){
		var pc = new LevelPiece();
		pc.init(x, y +  rad * 0.5  * ( y > 0 ? 1 : -1), rad, colors[c]);
		levelPiecesHorz.push(pc);
		scene.addChild(pc.graphics);
		x += rad;

	}
}
	
function genWallVert(x, rad){
	var y = 0;
	var c = 0;
	while( y < size.y ){
		var pc = new LevelPiece();
		pc.init( x +  rad * 0.5  * ( x > 0 ? 1 : -1), y, rad, colors[c]);
		levelPiecesVert.push(pc);
		scene.addChild(pc.graphics);
		y += rad;
	}
}

var rad = 200;

function genLevel(){
	genWallVert(0, rad);	
	genWallVert(size.x, rad);	
	genWallHorz(0, rad);	
	genWallHorz(size.y, rad);	
}

function getPieceForPlayer(player){

	var px = player.px;
	var py = player.py;
	if(px < 0){
		px = 0;
	}
	if(px > size.x){
		px = size.x;
	}
	if(py < 0){
		py = 0;
	}
	if(py > size.y){
		py = size.y;
	}

	var offsetY = Math.round(px > size.x / 2 ? levelPiecesVert.length / 2 : 0);
	var offsetX = Math.round(py > size.y / 2 ? levelPiecesHorz.length / 2 : 0);

	var horzIdx1 = Math.ceil(px/rad) + offsetX;
	var horzIdx2;
	if(horzIdx1 + offsetX < 0){	
		horzIdx1 = 0 + offsetX;
	}
	if(px <= horzIdx1 * rad + rad && horzIdx1 > 0){
		horzIdx2 = horzIdx1 - 1;
	}else {
		horzIdx2 =  horzIdx1 + 1;
	}
	if( horzIdx1 >= levelPiecesHorz.length ){
		horzIdx1 = levelPiecesHorz.length / 2 + offsetX;
		horzIdx2 = horzIdx1 - 1;
	}	

	var vertIdx1 = Math.ceil(py/rad) + offsetY;
	var vertIdx2;
	if(vertIdx1 < 0){	
		vertIdx1 = 0 + offsetY;
	}
	if(py  <= vertIdx1  * rad + rad  && vertIdx1 > 0){
		vertIdx2 = vertIdx1 - 1;
	}else{
		vertIdx2 = vertIdx1 + 1;
	}
	if( vertIdx1  >= levelPiecesVert.length ){
		vertIdx1 = levelPiecesVert.length / 2 - 1 + offsetY;
		vertIdx2 = vertIdx1 - 1;
	}

	var res = {	
		x : [horzIdx1, horzIdx2],
		y : [vertIdx1, vertIdx2]
	}

	for( var i = 0; i < levelPiecesHorz.length; i++ ){
		levelPiecesHorz[i].color = 0xff0000; 
		levelPiecesHorz[i].shapeDirty = true; 
	}

	for( var i = 0; i < levelPiecesVert.length; i++ ){
		levelPiecesVert[i].color = 0xff0000; 
		levelPiecesVert[i].shapeDirty = true; 
	}

	levelPiecesHorz[horzIdx1].color = 0x00ff00; 
	levelPiecesHorz[horzIdx2].color = 0x00ff00; 
	levelPiecesVert[vertIdx1].color = 0x00ff00; 
	levelPiecesVert[vertIdx2].color = 0x00ff00; 


	levelPiecesHorz[horzIdx1].shapeDirty = true; 
	levelPiecesHorz[horzIdx2].shapeDirty = true; 
	levelPiecesVert[vertIdx1].shapeDirty = true; 
	levelPiecesVert[vertIdx2].shapeDirty = true; 

	return res;
}

