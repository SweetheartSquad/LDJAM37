
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

	powerups=[];
	
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

	boundaryForce = 0.1;
	boundaryPadding = 35;

	genLevel();

	boundryLines = [
		{ x1:0, y1:boundaryPadding, x2:size.x, y2:boundaryPadding },
		{ x1:0, y1:size.y-boundaryPadding, x2:size.x , y2:size.y-boundaryPadding },
		{ x1:boundaryPadding, y1:0, x2:boundaryPadding , y2:size.y },
		{ x1:size.x - boundaryPadding, y1:0, x2:size.x - boundaryPadding , y2:size.y },
	];


	// add players parts to scene
	for(var i = 0; i < players.length; ++i){
		var player = players[i];
		scene.addChild(player.body);
		scene.addChild(player.head);
		scene.addChild(player.footL);
		scene.addChild(player.footR);
		scene.addChild(player.arms);
	}


	// powerups
	var p1 = new Powerup();
	scene.addChild(p1.graphics);
	p1.px = size.x/3;
	p1.py = size.y/2;
	powerups.push(p1);
	var p2 = new Powerup();
	scene.addChild(p2.graphics);
	p2.px = size.x/3*2;
	p2.py = size.y/2;
	powerups.push(p2);

	debugDraw = new PIXI.Graphics();
	scene.addChild(debugDraw);

	rayDebug = new PIXI.Graphics();
	scene.addChild(rayDebug);

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

	var collLines = players[1].calcColliderLines().concat( boundryLines );
	// update players
	for(var i = 0; i < players.length; ++i){
		var player = players[i];
		player.update();
	}
	// update bullets
	for(var i = bullets.length-1; i >= 0; --i){
		var b = bullets[i];
		b.update();
		var coll = castRay(b.px, b.py, b.vx, b.vy, collLines);
		if(coll != null){
			if(coll.length < 60 ){
				b.vx = -1 * b.vx;
				b.vy = -1 * b.vy;
			}
		}
	}

	// update powerups
	for(var i = powerups.length-1; i >= 0; --i){
		var p = powerups[i];
		p.update();
	}

	// update collisions

	updateLevel();

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
			var lines = player.calcColliderLines();
			for( var j = 0; j < lines.length; j++ ){
				debugDraw.moveTo(lines[j].x1, lines[j].y1);
				debugDraw.lineTo(lines[j].x2, lines[j].y2);
			}
		}

		for(var i = 0; i < bullets.length; ++i){
			var b = bullets[i];
			debugDraw.drawCircle(b.px, b.py, b.radius);
		}

		for(var i = 0; i < powerups.length; ++i){
			var p = powerups[i];
			debugDraw.drawCircle(p.px, p.py, p.radius);
		}

		for( var i = 0; i < boundryLines.length; i++ ){
			debugDraw.moveTo(boundryLines[i].x1, boundryLines[i].y1);
			debugDraw.lineTo(boundryLines[i].x2, boundryLines[i].y2);
		}

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

	if(keys.isJustDown(keyConfig.jump)){ res.jump = true};
	if(keys.isJustDown(keyConfig.shoot)){ res.shoot = true};

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
	var pieces=[];
	while( x < size.x + rad){
		var pc = new LevelPiece();
		pc.init(x, y +  rad * 0.5  * ( y > 0 ? 1 : -1), rad, colors[c]);
		levelPiecesHorz.push(pc);
		pieces.push(pc);
		x += rad;

		c = (c+1)%colors.length;

	}

	// add pieces to scene, starting from middle and working outwards
	while(pieces.length > 0){
		var i = Math.min(pieces.length-1, Math.round((pieces.length-1)/2));
		scene.addChild(pieces[i].graphics);
		pieces.splice(i,1);
	}
}

function genWallVert(x, rad){
	var y = 0;
	var c = 0;
	var pieces=[];
	while( y < size.y + rad){
		var pc = new LevelPiece();
		pc.init( x +  rad * 0.5  * ( x > 0 ? 1 : -1), y, rad, colors[c]);
		levelPiecesVert.push(pc);
		pieces.push(pc);
		y += rad;

		c = (c+1)%colors.length;

	}

	// add pieces to scene, starting from middle and working outwards
	while(pieces.length > 0){
		var i = Math.min(pieces.length-1, Math.round((pieces.length-1)/2));
		scene.addChild(pieces[i].graphics);
		pieces.splice(i,1);
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
		var distX = Math.abs(player.py-playerPieces.x[0].py) / (player.radius + playerPieces.x[0].rad);
		var distY = Math.abs(player.px-playerPieces.y[0].px) / (player.radius + playerPieces.y[0].rad);

		var ratioX = (player.px - playerPieces.x[0].px) / (playerPieces.x[1].px - playerPieces.x[0].px);
		var ratioY = (player.py - playerPieces.y[0].py) / (playerPieces.y[1].py - playerPieces.y[0].py);

		playerPieces.x[0].compress(1, clamp(0.1, lerp(1.0, distX, 1.0-ratioX), 1.0));
		playerPieces.x[1].compress(1, clamp(0.1, lerp(1.0, distX, ratioX), 1.0));
		
		playerPieces.y[0].compress(clamp(0.1, lerp(1.0, distY, 1.0-ratioY), 1.0), 1);
		playerPieces.y[1].compress(clamp(0.1, lerp(1.0, distY, ratioY), 1.0), 1);

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

function castRay(originX, originY, dirX, dirY, lines){
	var intersect = rayTestLines(originX, originY, dirX, dirY, lines);
	if(intersect != null){
		rayDebug.beginFill(0xFF0000);
		rayDebug.lineStyle(2, 0x0000FF);
		rayDebug.moveTo(originX, originY);
		rayDebug.lineTo( intersect.collision.x, intersect.collision.y);
		rayDebug.endFill();
	}
	return intersect;
}

function rayTestLines(originX, originY, dirX, dirY, lines){
	var vecLen = 999999999;
	var nearest = null; 
	for( var i = 0; i < lines.length; i++){
		var intersect = lineIntersect(lines[i].x1, lines[i].y1, lines[i].x2, 
			lines[i].y2, originX, originY, dirX * 9999999, dirY * 9999999);
		if( intersect != null ){
			var lenLoc = Math.sqrt( Math.pow( intersect.x - originX, 2) + Math.pow(intersect.y - originY, 2));
			if( lenLoc < vecLen ){
				vecLen = lenLoc;
				nearest = { collision:intersect, line:lines[i], length:vecLen };
			}
		}
	}
	return nearest;
}

// Ported from http://paulbourke.net/geometry/pointlineplane/pdb.c
function lineIntersect(x1,  y1, x2,  y2, x3,  y3, x4,  y4){
   
   var x, y, mua, mub, denom, numera, numerb;

   denom  = (y4-y3) * (x2-x1) - (x4-x3) * (y2-y1);
   numera = (x4-x3) * (y1-y3) - (y4-y3) * (x1-x3);
   numerb = (x2-x1) * (y1-y3) - (y2-y1) * (x1-x3);

   /* Are the line coincident? */
   if (Math.abs(numera) < Number.EPSILON && Math.abs(numerb) < Number.EPSILON && Math.abs(denom) < Number.EPSILON) {
      x = (x1 + x2) / 2;
      y = (y1 + y2) / 2;
      return {x:x, y:y};
   }

   /* Are the line parallel */
   if (Math.abs(denom) < Number.EPSILON) {
      return null;
   }

   /* Is the intersection along the the segments */
   mua = numera / denom;
   mub = numerb / denom;
   if (mua < 0 || mua > 1 || mub < 0 || mub > 1) {
      return null;
   }
   x = x1 + mua * (x2 - x1);
   y = y1 + mua * (y2 - y1);
   return {x:x, y:y};
}


