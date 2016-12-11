
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
	players=[];
	players.push(player1 = new Player());
	players.push(player2 = new Player());
	
	bullets=[];

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

	// add players parts to scene
	for(var i = 0; i < players.length; ++i){
		var player = players[i];
		scene.addChild(player.body);
		scene.addChild(player.head);
		scene.addChild(player.footL);
		scene.addChild(player.footR);
		scene.addChild(player.arms);
	}

	debugDraw = new PIXI.Graphics();
	scene.addChild(debugDraw);


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


	for(var i = 0; i < players.length; ++i){
		var player = players[i];
		var input = getInput(i);

		if(input.fullscreen){ fullscreen.toggleFullscreen(); }

		// move
		player.ax += input.x;

		// flip if moving horizontally
		if(Math.abs(input.x) > 0){
			player.flipped = input.x < 0;
		}

		// aim
		player.aimx = player.flipped ? -1 : 1;
		if(Math.abs(input.y) > Math.abs(input.x)){
			player.aimx = 0;
			player.aimy = Math.sign(input.y);
		}else if(Math.abs(input.y) > 0.5){
			player.aimx /= 2;
			player.aimy = Math.sign(input.y) / 2;
		}else{
			player.aimy = 0;
		}

		// jump
		if(input.jump && player.canJump()){
			player.ay += -60;

			if(player.canWallJump()){
				player.ax += -40 * (player.flipped ? -1 : 1)
			}
		}


		// shoot
		if(input.shoot){
			var b = new Bullet();
			b.px = player.px;
			b.py = player.py;
			b.vx = player.aimx*50.0 + player.vx;
			b.vy = player.aimy*50.0 + player.vy;

			scene.addChild(b.graphics);

			bullets.push(b);
		}

		// gravity
		player.ay += 1;
	}

	// update players
	for(var i = 0; i < players.length; ++i){
		var player = players[i];
		player.update();
	}

	// update bullets
	for(var i = bullets.length-1; i >= 0; --i){
		var b = bullets[i];
		b.update();
	}

	// update collisions
	
	updateLevel();	

	boundaryForce = 0.1;
	boundaryPadding = 35;

	// boundary collisions
	for(var i = 0; i < players.length; ++i){
		var player = players[i];

		player.touchingWall = player.touchingFloor = player.touchingCeil = false;

		if(player.px - player.radius < boundaryPadding){
			player.ax += (boundaryPadding- (player.px - player.radius) ) * boundaryForce;
			player.touchingWall = true;
		}if(player.px + player.radius > size.x - boundaryPadding){
			player.ax -= ( (player.px + player.radius) - (size.x - boundaryPadding)) * boundaryForce;
			player.touchingWall = true;
		}
		if(player.py - player.radius < boundaryPadding){
			player.ay += (boundaryPadding- (player.py - player.radius) ) * boundaryForce;
			player.touchingCeil = true;
		}if(player.py + player.radius > size.y - boundaryPadding){
			player.ay -= ( (player.py + player.radius) - (size.y - boundaryPadding)) * boundaryForce;
			player.touchingFloor = true;
		}
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


	debugDraw.clear();
	for(var d = 0; d < 2; ++d){
		debugDraw.lineStyle(10-d*5, d == 0 ? 0 : 0xFFFFFF);

		for(var i = 0; i < players.length; ++i){
			var player = players[i];
			debugDraw.drawCircle(player.px, player.py, player.radius);
			debugDraw.moveTo(player.px, player.py);
			debugDraw.lineTo(player.px + player.aimx*player.radius, player.py + player.aimy*player.radius);
		}

		for(var i = 0; i < bullets.length; ++i){
			var b = bullets[i];
			debugDraw.drawCircle(b.px, b.py, b.radius);
		}

		debugDraw.moveTo(0, boundaryPadding);
		debugDraw.lineTo(size.x, boundaryPadding);
		debugDraw.moveTo(0, size.y-boundaryPadding);
		debugDraw.lineTo(size.x, size.y-boundaryPadding);
		debugDraw.moveTo(boundaryPadding, 0);
		debugDraw.lineTo(boundaryPadding, size.y);
		debugDraw.moveTo(size.x-boundaryPadding, 0);
		debugDraw.lineTo(size.x-boundaryPadding, size.y);
		debugDraw.endFill();
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

	// keyboard input
	var keyConfig={
		left:null,
		right:null,
		up:null,
		down:null,
		jump:null,
		shoot:null
	};

	switch(_playerId){
		case 0:
		res.fullscreen = keys.isJustDown(keys.F);
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

	if(keys.isDown(keyConfig.jump)){ res.jump = true};
	if(keys.isDown(keyConfig.shoot)){ res.shoot = true};

	// gamepad input
	if(gamepads.axisPast(gamepads.LSTICK_H, -0.5, -1, _playerId)){ res.x -= 1; }
	if(gamepads.axisPast(gamepads.LSTICK_H, 0.5, 1, _playerId)){ res.x += 1; }
	if(gamepads.axisPast(gamepads.LSTICK_V, -0.5, -1, _playerId)){ res.y -= 1; }
	if(gamepads.axisPast(gamepads.LSTICK_V, 0.5, 1, _playerId)){ res.y += 1; }

	if(gamepads.isJustDown(gamepads.A, _playerId) || gamepads.isJustDown(gamepads.Y, _playerId) ){ res.jump = true; }
	if(gamepads.isJustDown(gamepads.X, _playerId) || gamepads.isJustDown(gamepads.B, _playerId) ){ res.shoot = true; }

	// clamp directional input (might be using both keyboard and controller)
	res.x = clamp(-1, res.x, 1);
	res.y = clamp(-1, res.y, 1);
	
	return res;
}

var colors = [0xff0000, 0xffff00, 0x0000ff];

function genWallHorz(y, rad){
	var x = 0;
	var c = 0;
	while( x < size.x + rad){
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
	while( y < size.y + rad){
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

	for(var i = 0; i < players.length; ++i){
		var player = players[i];
		var playerPieces = getPieceForPlayer(player);
		playerPieces.x[0].compress(1, 0.7);
		playerPieces.x[1].compress(1, 0.8);
		playerPieces.y[0].compress(0.7, 1);
		playerPieces.y[1].compress(0.8, 1);

		// debug pieces for player 1
		if(i == 0){
			debugPieces(playerPieces);
		}
	}

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
		x : getPiecesForArr(horz, px),
		y : getPiecesForArr(vert, py)
	}

	return res;
}

function getPiecesForArr(arr, playerAxisVal, roundFunc){
	var idx1 = Math.ceil(playerAxisVal/rad);
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