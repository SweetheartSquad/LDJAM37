
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


	layers={
		bg: new PIXI.Container(),
		players: new PIXI.Container(),
		boundaries: new PIXI.Container(),
		bullets: new PIXI.Container()
	};

	particles = [];



	game.addChild(scene);

	scene.x = -size.x/2;
	scene.y = -size.y/2;

	scene.addChild(layers.bg);
	scene.addChild(layers.players);
	scene.addChild(layers.bullets);
	scene.addChild(layers.boundaries);

	// setup screen filter
	screen_filter = new CustomFilter(PIXI.loader.resources.screen_shader.data);
	screen_filter.padding=0;
	renderSprite.filterArea = new PIXI.Rectangle(0,0,size.x,size.y);

	renderSprite.filters = [screen_filter];



	var bg = new PIXI.Graphics();
	layers.bg.addChild(bg);

	bg.beginFill(0xFFFFFF);
	bg.drawRect(0,0,size.x,size.y);
	bg.endFill();

	/*bg.beginFill(0x000000);
	bg.drawCircle(size.x/2, size.y/2, Math.min(size.x,size.y)/3);
	bg.endFill();*/

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
		layers.players.addChild(player.container);
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
	debugDraw.lines=[];
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
	// always try to center camera
	
	var camcenterweight=5;
	var camx=size.x*camcenterweight;
	var camy=size.y*camcenterweight;
	for(var i = 0; i < players.length; ++i){
		camx -= players[i].px;
		camy -= players[i].py;
	}
	camx /= players.length+camcenterweight;
	camy /= players.length+camcenterweight;

	game.position.x = lerp(game.position.x, camx, 0.1);
	game.position.y = lerp(game.position.y, camy, 0.1);

	game.scale.x = game.scale.y = lerp(game.scale.x, 1.0, 0.1);

	debugDraw.lines=[];

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


			if(player.canWallJump()){
				// walljump
				player.ay += -30;
				player.ax += -40 * (player.flipped ? -1 : 1)

				// kick out
				player.footL.x += 50 * (player.flipped ? -1 : 1);
				player.footR.x += 50 * (player.flipped ? -1 : 1);
				player.footL.y += 20;
				player.footR.y += 20;

				// squash/stretch
				player.container.scale.y += 0.5;
				player.container.rotation -= Math.PI/4 * (player.flipped ? -1 : 1);

				player.doubleJump = true;
			}else if(player.canDoubleJump()){
				// double jump
				player.doubleJump = false;
				player.ay += -30;

				// squash/stretch
				player.container.scale.x -= 0.5;
				player.container.scale.y += 0.5;
			}else{
				// normal jump
				player.ay += -40;

				// squash/stretch
				player.container.scale.x -= 0.5;
				player.container.scale.y += 0.5;

				// kick up
				player.footL.y += 50;
				player.footR.y += 50;

				player.doubleJump = true;
			}

			// if just jumped, can't be touching ground or wall anymore
			player.touchingWall = false;
			player.touchingGround = false;

			// camera kick/zoom
			game.scale.x+=0.01;
			game.scale.y+=0.01;
			game.position.y+=10;

			sounds["jump"].play();

			// particles
			for(var p = 0; p < Math.random()*5+5; ++p){
				var particle = new Particle(
					player.px,
					player.py,
					-0.5*player.vx*(Math.random()-Math.random()*0.5)+(Math.random()-Math.random())*5,
					-0.5*player.vy*(Math.random()-Math.random()*0.5)+(Math.random()-Math.random())*5,
					10+Math.random(5)
				);

				particles.push(particle);

				layers.bullets.addChild(particle.graphics);
			}
		}


		// shoot
		if(input.shoot && player.canShoot()){
			// bullet
			var b = new Bullet();
			b.owner = player;
			b.px = player.px;
			b.py = player.py;
			b.vx = player.aimx*20.0 + player.vx*0.25;
			b.vy = player.aimy*20.0 + player.vy*0.25;
			bullets.push(b);
			layers.bullets.addChild(b.graphics);

			// kickback
			player.ax -= player.aimx * 20.0;
			player.ay -= player.aimy * 20.0;
			
			// recoil
			player.container.rotation -= Math.PI/3 * (player.flipped ? -1 : 1);

			// camera kick/zoom
			game.position.x += player.aimx*20.0;
			game.position.y += player.aimy*20.0;
			game.scale.x+=0.05;
			game.scale.y+=0.05;

			sounds["shoot"].play();

			// pop
			player.container.scale.x += 1;
			player.container.scale.y += 1;

			// prevent another shot for 100 frames
			player.shootDelay = 100;
			
			// particles
			for(var p = 0; p < Math.random()*5+5; ++p){
				var particle = new Particle(
					b.px,
					b.py,
					b.vx*(Math.random()-Math.random()*0.5)+(Math.random()-Math.random())*3,
					b.vy*(Math.random()-Math.random()*0.5)+(Math.random()-Math.random())*3,
					30+Math.random(15)
				);

				particles.push(particle);

				layers.bullets.addChild(particle.graphics);
			}
		}

		// gravity
		player.ay += 1;
	}

	var collLines = boundryLines;
	for( var i = 0; i < players.length; i++ ){
		collLines = collLines.concat(players[i].calcColliderLines());
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

		// keep within boundaries
		if(b.px-b.radius < boundaryPadding){
			b.px = boundaryPadding+b.radius;
		}else if(b.px+b.radius > size.x-boundaryPadding){
			b.px = size.x-boundaryPadding-b.radius;
		}

		if(b.py-b.radius < boundaryPadding){
			b.py = boundaryPadding+b.radius;
		}else if(b.py+b.radius > size.y-boundaryPadding){
			b.py = size.y-boundaryPadding-b.radius;
		}

		
		var collCheck = function(coll){
			if(coll != null){
				if(coll.length < b.radius ){
					if( !(b.collisions == 0 && b.owner == coll.line.owner) ){	
						b.collisions++;
						
						// reflect movement
						var norm = [ coll.line.x2 - coll.line.x1, coll.line.y2 - coll.line.y1];
						b.vx = norm[1] > 0 ? -b.vx : b.vx;
						b.vy = norm[0] > 0 ? -b.vy : b.vy;

						// pop
						b.graphics.scale.x += 1;
						b.graphics.scale.y += 1;

						// freeze for 4 frames
						b.skip = 4;

						// particles
						for(var p = 0; p < Math.random()*5+5; ++p){
							var particle = new Particle(
								b.px,
								b.py,
								b.vx*(Math.random()-Math.random()*0.5)+(Math.random()-Math.random())*3,
								b.vy*(Math.random()-Math.random()*0.5)+(Math.random()-Math.random())*3,
								20+Math.random(5)
							);

							particles.push(particle);

							layers.bullets.addChild(particle.graphics);
						}

						// camera kick/zoom
						game.position.x += b.vx;
						game.position.y += b.vy;
						game.scale.x+=0.01;
						game.scale.y+=0.01;

						sounds["collision"].play();

						return true;
					}
				}
			}
			return false;
		}

		// cast two rays from the perimeter of the circle in the direction it's moving
		// rays originate on a line perpendicular to direction
		var a = Math.atan2(b.vy, b.vx)+Math.PI/2;
		collCheck(castRay(b.px + Math.cos(a)*b.radius, b.py + Math.sin(a)*b.radius, b.vx, b.vy, collLines)) ||
		collCheck(castRay(b.px - Math.cos(a)*b.radius, b.py - Math.sin(a)*b.radius, b.vx, b.vy, collLines));
		
	}

	// update particles
	for(var i = particles.length-1; i >= 0; --i){
		var p = particles[i];
		p.update();
		if(p.age >= p.lifetime){
			p.graphics.parent.removeChild(p.graphics);
			p.graphics.destroy();
			particles.splice(i,1);
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


	//drawDebug();


	renderer.render(game,renderTexture);
	try{
		renderer.render(renderSprite,null,true,false);
	}catch(e){
		renderer.render(game,null,true,false);
		console.error(e);
	}
}

function drawDebug(){
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

		debugDraw.lines = debugDraw.lines.concat(boundryLines);
		for( var i = 0; i < debugDraw.lines.length; i++ ){
			debugDraw.moveTo(debugDraw.lines[i].x1, debugDraw.lines[i].y1);
			debugDraw.lineTo(debugDraw.lines[i].x2, debugDraw.lines[i].y2);
		}
		debugDraw.endFill();
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
		layers.boundaries.addChild(pieces[i].graphics);
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
		layers.boundaries.addChild(pieces[i].graphics);
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

	var entities = players.concat(bullets);
	for(var i = 0; i < entities.length; ++i){
		var entity = entities[i];
		var entityPieces = getPieceForEntity(entity);
		var distX = Math.abs(entity.py-entityPieces.x[0].py) / (entity.radius + entityPieces.x[0].rad);
		var distY = Math.abs(entity.px-entityPieces.y[0].px) / (entity.radius + entityPieces.y[0].rad);

		var ratioX = (entity.px - entityPieces.x[0].px) / (entityPieces.x[1].px - entityPieces.x[0].px);
		var ratioY = (entity.py - entityPieces.y[0].py) / (entityPieces.y[1].py - entityPieces.y[0].py);

		entityPieces.x[0].compress(1, clamp(0.1, lerp(1.0, distX, 1.0-ratioX), 1.0));
		entityPieces.x[1].compress(1, clamp(0.1, lerp(1.0, distX, ratioX), 1.0));
		
		entityPieces.y[0].compress(clamp(0.1, lerp(1.0, distY, 1.0-ratioY), 1.0), 1);
		entityPieces.y[1].compress(clamp(0.1, lerp(1.0, distY, ratioY), 1.0), 1);

		// debug pieces for player 1
		if(i == 0){
		//	debugPieces(playerPieces);
		}
	}

}

function genLevel(){
	genWallVert(0, rad);
	genWallVert(size.x, rad);
	genWallHorz(0, rad);
	genWallHorz(size.y, rad);
}

function getPieceForEntity(entity){
	var px = entity.px;
	var py = entity.py;
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
		debugDraw.lines.push({
			x1:originX,
			y1:originY,
			x2:intersect.collision.x,
			y2:intersect.collision.y
		});
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


