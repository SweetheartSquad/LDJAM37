
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
	vert = [];
	levelPiecesHorz = [];
	levelPiecesVert = [];


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
		player1.ay += -60;

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
	// update collisions
	
	updateLevel();	

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
	while( x < size.x ){
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

function updateLevel(){
	
	for( var i = 0; i < levelPiecesHorz.length; i++ ){
		levelPiecesHorz[i].update();
	}

	for( var i = 0; i < levelPiecesVert.length; i++ ){
		levelPiecesVert[i].update();
	}

	var player1Pieces = getPieceForPlayer(player1);
	player1Pieces.x[0].compress(1, 0.7);
	player1Pieces.x[1].compress(1, 0.8);
	player1Pieces.y[0].compress(0.7, 1);
	player1Pieces.y[1].compress(0.8, 1);

	var player2pieces = getPieceForPlayer(player2);
	player2pieces.x[0].compress(1, 0.7);
	player2pieces.x[1].compress(1, 0.8);
	player2pieces.y[0].compress(0.7, 1);
	player2pieces.y[1].compress(0.8, 1);
}

function genLevel(){
	genWallVert(0, rad);	
	genWallVert(size.x, rad);	
	genWallHorz(0, rad);	
	genWallHorz(size.y, rad);	
}

function getPieceForPlayer(player){
	var px = player.px;
	var py = player.py;
	if(px < 0){ px = 0 }
	if(px > size.x){ px = size.x }
	if(py < 0){ py = 0 }
	if(py > size.y){ py = size.y }

	var horz = py < (size.y / 2) ? levelPiecesHorz.slice(0, levelPiecesHorz.length / 2) 
								: levelPiecesHorz.slice(levelPiecesHorz.length / 2, levelPiecesHorz.length);
	var vert = px < (size.x / 2) ? levelPiecesVert.slice(0, levelPiecesVert.length / 2)
								: levelPiecesVert.slice(levelPiecesVert.length / 2, levelPiecesVert.length);
	var res = {	
		x : getPiecesForArr(horz, px, 'ceil'),
		y : getPiecesForArr(vert, py, 'floor')
	}

	return res;
}

function getPiecesForArr(arr, playerAxisVal, roundFunc){
	var idx1 = Math[roundFunc](playerAxisVal/rad);
	var idx2;
	if(idx1 < 0){	
		idx1 = 0;
	}
	if(playerAxisVal <= idx1 * rad + rad && idx1 > 0){
		idx2 = idx1 - 1;
	}else {
		idx2 =  idx1 + 1;
	}
	if( idx1 >= arr.length ){
		idx1 = arr.length / 2;
		idx2 = idx1 - 1;
	}	
	return [arr[idx1], arr[idx2]];
}


function debugPieces(res){

	for( var i = 0; i < levelPiecesHorz.length; i++ ){
		levelPiecesHorz[i].color = 0xff0000; 
		levelPiecesHorz[i].shapeDirty = true; 
	}

	for( var i = 0; i < levelPiecesVert.length; i++ ){
		levelPiecesVert[i].color = 0xff0000; 
		levelPiecesVert[i].shapeDirty = true; 
	}

	res.x[0].color = 0x00ff00; 
	res.x[1].color = 0x00ff00; 
	res.y[0].color = 0x00ff00; 
	res.y[1].color = 0x00ff00; 
}