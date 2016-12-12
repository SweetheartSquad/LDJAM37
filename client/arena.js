function Arena(_players){

	boundaryRadius = 150;

	boundaryForce = 0.1;
	boundaryPadding = boundaryRadius/8;

	this.done = false;



	this.players=[];
	for(var i = 0; i < _players.length; ++i){
		this.players.push(new Player(_players[i]));
	}

	this.powerups=[];
	
	this.bullets=[];

	this.levelPiecesHorz = [];
	this.levelPiecesVert = [];






	this.scene = new PIXI.Container();


	this.layers={
		bg: new PIXI.Container(),
		players: new PIXI.Container(),
		boundaries: new PIXI.Container(),
		bullets: new PIXI.Container()
	};

	this.particles = [];



	game.addChild(this.scene);

	this.scene.x = -size.x/2;
	this.scene.y = -size.y/2;

	game.position.x = size.x/2;
	game.position.y = size.y/2;

	this.scene.addChild(this.layers.bg);
	this.scene.addChild(this.layers.players);
	this.scene.addChild(this.layers.bullets);
	this.scene.addChild(this.layers.boundaries);



	var bg = new PIXI.Sprite(PIXI.loader.resources.bg.texture);
	bg.width=size.x;
	bg.height=size.y;
	this.layers.bg.addChild(bg);

	this.genLevel();

	this.boundaryLines = [
		{ x1:0, y1:boundaryPadding, x2:size.x, y2:boundaryPadding, owner: "level", enabled: true },
		{ x1:0, y1:size.y-boundaryPadding, x2:size.x , y2:size.y-boundaryPadding, owner: "level", enabled: true },
		{ x1:boundaryPadding, y1:0, x2:boundaryPadding , y2:size.y, owner: "level", enabled: true },
		{ x1:size.x - boundaryPadding, y1:0, x2:size.x - boundaryPadding , y2:size.y, owner: "level", enabled: true },
	];


	// add players parts to scene
	for(var i = 0; i < this.players.length; ++i){
		var player = this.players[i];
		this.layers.players.addChild(player.container);
	}


	// powerups
	/*var p1 = new Powerup();
	this.scene.addChild(p1.graphics);
	p1.px = size.x/3;
	p1.py = size.y/2;
	this.powerups.push(p1);

	var p2 = new Powerup();
	this.scene.addChild(p2.graphics);
	p2.px = size.x/3*2;
	p2.py = size.y/2;
	this.powerups.push(p2);*/

	this.debugDraw = new PIXI.Graphics();
	this.debugDraw.lines = [];
	this.scene.addChild(this.debugDraw);
};

Arena.prototype.destroy = function(){
	game.removeChild(this.scene);
	this.scene.destroy();
};

Arena.prototype.update = function(){
	// always try to center camera
	
	var camcenterweight = 6;
	var camx = size.x / 2 * camcenterweight;
	var camy = size.y / 2 * camcenterweight;
	for(var i = 0; i < this.players.length; ++i){
		camx += this.players[i].px;
		camy += this.players[i].py;
	}

	camx /= this.players.length + camcenterweight;
	camy /= this.players.length + camcenterweight;

	camx = size.x - camx;
	camy = size.y - camy;

	game.position.x = lerp(game.position.x, camx, 0.1);
	game.position.y = lerp(game.position.y, camy, 0.1);

	game.scale.x = game.scale.y = lerp(game.scale.x, 1.0, 0.1);

	this.debugDraw.lines=[];

	// update game
	var input;


	for(var i = 0; i < this.players.length; ++i){
		var player = this.players[i];
		var input = getInput(player.id);

		if(input.fullscreen){ fullscreen.toggleFullscreen(); }


		if(player.canAct()){
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
					player.partsContainer.rotation -= Math.PI/4 * (player.flipped ? -1 : 1);

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

					this.particles.push(particle);

					this.layers.bullets.addChild(particle.graphics);
				}
			}


			// shoot
			if(input.shoot && player.canShoot()){
				// bullet
				var b = new Bullet();
				b.owner = player;
				b.px = player.px;
				b.py = player.py;
				b.vx = Math.sign(player.aimx)*20.0 + Math.sign(player.vx)*0.25;
				b.vy = Math.sign(player.aimy)*20.0 + Math.sign(player.vy)*0.25;

				// prevent bullets from firing too straight
				if(Math.abs(b.vx) < 0.001){
					b.vx = (Math.random()-Math.random())*0.1;
				}
				if(Math.abs(b.vy) < 0.001){
					b.vy = (Math.random()-Math.random())*0.1;
				}

				this.bullets.push(b);
				this.layers.bullets.addChild(b.graphics);

				// kickback
				player.ax -= player.aimx * 20.0;
				player.ay -= player.aimy * 20.0;
				
				// recoil
				player.partsContainer.rotation -= Math.PI/3 * (player.flipped ? -1 : 1);

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
				player.shootDelay = Player.shootDelay;
				
				// particles
				for(var p = 0; p < Math.random()*5+5; ++p){
					var particle = new Particle(
						b.px,
						b.py,
						b.vx*(Math.random()-Math.random()*0.5)+(Math.random()-Math.random())*3,
						b.vy*(Math.random()-Math.random()*0.5)+(Math.random()-Math.random())*3,
						30+Math.random(15)
					);

					this.particles.push(particle);

					this.layers.bullets.addChild(particle.graphics);
				}
			}
		}

		// gravity
		player.ay += 1;
	}

	var collLines = this.boundaryLines;
	for( var i = 0; i < this.players.length; i++ ){
		collLines = collLines.concat(this.players[i].calcColliderLines());
	}

	// update players
	for(var i = 0; i < this.players.length; ++i){
		var player = this.players[i];
		player.update();
	}

	// update bullets
	for(var i = this.bullets.length-1; i >= 0; --i){
		var b = this.bullets[i];
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

						return {
							hit: coll.line.owner,
							intersection: coll.collision,
							line: coll.line
						};
					}
				}
			}
			return false;
		}

		// cast two rays from the perimeter of the circle in the direction it's moving
		// rays originate on a line perpendicular to direction
		var a = Math.atan2(b.vy, b.vx)+Math.PI/2;
		var collision =
		collCheck(this.castRay(b.px + Math.cos(a)*b.radius, b.py + Math.sin(a)*b.radius, b.vx, b.vy, collLines)) ||
		collCheck(this.castRay(b.px - Math.cos(a)*b.radius, b.py - Math.sin(a)*b.radius, b.vx, b.vy, collLines));
		
		if(collision){
			if(collision.hit && collision.hit instanceof Player){
				// bullet hit player
				b.graphics.parent.removeChild(b.graphics);
				b.graphics.destroy();
				this.bullets.splice(i,1);

				sounds["hit"].play();


				// push/rotate player
				collision.hit.ax += b.vx;
				collision.hit.ay += b.vy;
				collision.hit.partsContainer.rotation += collision.hit.flipped ? Math.PI*0.75 : -Math.PI*0.75;

				// if alive, take off a life
				if(!collision.hit.isDead()){
					// camera kick/zoom
					game.scale.x += 0.1;
					game.scale.y += 0.1;
					game.x += b.vx;
					game.y += b.vy;

					collision.hit.hitDelay = Player.hitDelay;
					collision.hit.lives -= 1;
					collision.hit.updateLives();
				}
			}else{
				// bullet hit something else

				// reflect movement
				var norm = [ collision.line.x2 - collision.line.x1, collision.line.y2 - collision.line.y1];
				b.vx = norm[1] > 0 ? -b.vx : b.vx;
				b.vy = norm[0] > 0 ? -b.vy : b.vy;

				// pop
				b.graphics.scale.x += 1;
				b.graphics.scale.y += 1;

				// freeze for 4 frames
				b.skip = 4;

				sounds["collision"].play();

				// camera kick/zoom
				game.position.x += b.vx/3;
				game.position.y += b.vy/3;
				game.scale.x+=0.005;
				game.scale.y+=0.005;
			}

			// particles
			for(var p = 0; p < Math.random()*5+5; ++p){
				var particle = new Particle(
					b.px,
					b.py,
					b.vx*(Math.random()-Math.random()*0.5)+(Math.random()-Math.random())*3,
					b.vy*(Math.random()-Math.random()*0.5)+(Math.random()-Math.random())*3,
					20+Math.random(5)
				);

				this.particles.push(particle);

				this.layers.bullets.addChild(particle.graphics);
			}
		}
	}

	// update particles
	for(var i = this.particles.length-1; i >= 0; --i){
		var p = this.particles[i];
		p.update();
		if(p.age >= p.lifetime){
			p.graphics.parent.removeChild(p.graphics);
			p.graphics.destroy();
			this.particles.splice(i,1);
		}
	}

	// update powerups
	for(var i = this.powerups.length-1; i >= 0; --i){
		var p = this.powerups[i];
		p.update();
	}

	// update collisions

	this.updateLevel();

	// boundary collisions
	for(var i = 0; i < this.players.length; ++i){
		var player = this.players[i];

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
};

Arena.prototype.render = function(){
	for( var i = 0; i < this.levelPiecesHorz.length; i++ ){
		this.levelPiecesHorz[i].draw();
	}

	for( var i = 0; i < this.levelPiecesVert.length; i++ ){
		this.levelPiecesVert[i].draw();
	}


	this.drawDebug();
};

Arena.prototype.drawDebug = function(){
	this.debugDraw.clear();
	for(var d = 0; d < 2; ++d){
		this.debugDraw.lineStyle(10-d*5, d == 0 ? 0 : 0xFFFFFF);

		for(var i = 0; i < this.players.length; ++i){
			var player = this.players[i];
			var lines = player.calcColliderLines();
			for( var j = 0; j < lines.length; j++ ){
				this.debugDraw.moveTo(lines[j].x1, lines[j].y1);
				this.debugDraw.lineTo(lines[j].x2, lines[j].y2);
			}
		}

		for(var i = 0; i < this.bullets.length; ++i){
			var b = this.bullets[i];
			this.debugDraw.drawCircle(b.px, b.py, b.radius);
		}

		for(var i = 0; i < this.powerups.length; ++i){
			var p = this.powerups[i];
			this.debugDraw.drawCircle(p.px, p.py, p.radius);
		}

		this.debugDraw.lines = this.debugDraw.lines.concat(this.boundaryLines);
		for( var i = 0; i < this.debugDraw.lines.length; i++ ){
			this.debugDraw.moveTo(this.debugDraw.lines[i].x1, this.debugDraw.lines[i].y1);
			this.debugDraw.lineTo(this.debugDraw.lines[i].x2, this.debugDraw.lines[i].y2);
		}
		this.debugDraw.endFill();
	}
};
Arena.prototype.genWallHorz = function(y, boundaryRadius){
	var x = 0;
	var c = 0;
	var pieces=[];
	while( x < size.x + boundaryRadius){
		var pc = new LevelPiece();
		pc.init(x, y +  boundaryRadius * 0.5  * ( y > 0 ? 1 : -1), boundaryRadius, colors[c]);
		this.levelPiecesHorz.push(pc);
		pieces.push(pc);
		x += boundaryRadius;

		c = (c+1)%colors.length;

	}

	// add pieces to scene, starting from middle and working outwards
	while(pieces.length > 0){
		var i = Math.min(pieces.length-1, Math.round((pieces.length-1)/2));
		this.layers.boundaries.addChild(pieces[i].graphics);
		pieces.splice(i,1);
	}
};

Arena.prototype.genWallVert = function(x, boundaryRadius){
	var y = 0;
	var c = 0;
	var pieces=[];
	while( y < size.y + boundaryRadius){
		var pc = new LevelPiece();
		pc.init( x +  boundaryRadius * 0.5  * ( x > 0 ? 1 : -1), y, boundaryRadius, colors[c]);
		this.levelPiecesVert.push(pc);
		pieces.push(pc);
		y += boundaryRadius;

		c = (c+1)%colors.length;

	}

	// add pieces to scene, starting from middle and working outwards
	while(pieces.length > 0){
		var i = Math.min(pieces.length-1, Math.round((pieces.length-1)/2));
		this.layers.boundaries.addChild(pieces[i].graphics);
		pieces.splice(i,1);
	}
};

Arena.prototype.updateLevel = function(){

	for( var i = 0; i < this.levelPiecesHorz.length; i++ ){
		this.levelPiecesHorz[i].update();
	}

	for( var i = 0; i < this.levelPiecesVert.length; i++ ){
		this.levelPiecesVert[i].update();
	}

	var entities = this.players.concat(this.bullets);
	for(var i = 0; i < entities.length; ++i){
		var entity = entities[i];
		var entityPieces = this.getPieceForEntity(entity);
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

};

Arena.prototype.genLevel = function(){
	this.genWallVert(0, boundaryRadius);
	this.genWallVert(size.x, boundaryRadius);
	this.genWallHorz(0, boundaryRadius);
	this.genWallHorz(size.y, boundaryRadius);
};

Arena.prototype.getPieceForEntity = function(entity){
	var px = entity.px;
	var py = entity.py;
	if(px < 0){ px = 0 }
	if(px > size.x){ px = size.x }
	if(py < 0){ py = 0 }
	if(py > size.y){ py = size.y }

	var horz = py < (size.y / 2) ? this.levelPiecesHorz.slice(0, this.levelPiecesHorz.length / 2)
								: this.levelPiecesHorz.slice(this.levelPiecesHorz.length / 2, this.levelPiecesHorz.length);
	var vert = px < (size.x / 2) ? this.levelPiecesVert.slice(0, this.levelPiecesVert.length / 2)
								: this.levelPiecesVert.slice(this.levelPiecesVert.length / 2, this.levelPiecesVert.length);
	var res = {
		x : this.getPiecesForArr(horz, px),
		y : this.getPiecesForArr(vert, py)
	}

	return res;
};

Arena.prototype.getPiecesForArr = function(arr, playerAxisVal, roundFunc){
	var idx1 = Math.ceil(playerAxisVal/boundaryRadius);
	var idx2;
	if(idx1 < 0){
		idx1 = 0;
	}
	if(playerAxisVal <= idx1 * boundaryRadius + boundaryRadius && idx1 > 0){
		idx2 = idx1 - 1;
	}else {
		idx2 =  idx1 + 1;
	}
	if( idx1 >= arr.length ){
		idx1 = arr.length / 2;
		idx2 = idx1 - 1;
	}
	return [arr[idx1], arr[idx2]];
};


Arena.prototype.debugPieces = function(res){

	for( var i = 0; i < this.levelPiecesHorz.length; i++ ){
		this.levelPiecesHorz[i].color = 0xff0000;
		this.levelPiecesHorz[i].shapeDirty = true;
	}

	for( var i = 0; i < this.levelPiecesVert.length; i++ ){
		this.levelPiecesVert[i].color = 0xff0000;
		this.levelPiecesVert[i].shapeDirty = true;
	}

	res.x[0].color = 0x00ff00;
	res.x[1].color = 0x00ff00;
	res.y[0].color = 0x00ff00;
	res.y[1].color = 0x00ff00;
};

Arena.prototype.castRay = function(originX, originY, dirX, dirY, lines){
	var intersect = this.rayTestLines(originX, originY, dirX, dirY, lines);
	if(intersect != null){
		this.debugDraw.lines.push({
			x1:originX,
			y1:originY,
			x2:intersect.collision.x,
			y2:intersect.collision.y
		});
	}
	return intersect;
};

Arena.prototype.rayTestLines = function(originX, originY, dirX, dirY, lines){
	var vecLen = 999999999;
	var nearest = null; 
	for( var i = 0; i < lines.length; i++){
		var line=lines[i];
		if(!line.enabled){
			continue;
		}
		var intersect = this.lineIntersect(line.x1, line.y1, line.x2, line.y2, originX, originY, dirX * 9999999, dirY * 9999999);
		if( intersect != null ){
			var lenLoc = Math.sqrt( Math.pow( intersect.x - originX, 2) + Math.pow(intersect.y - originY, 2));
			if( lenLoc < vecLen ){
				vecLen = lenLoc;
				nearest = { collision:intersect, line:line, length:vecLen };
			}
		}
	}
	return nearest;
};

// Ported from http://paulbourke.net/geometry/pointlineplane/pdb.c
Arena.prototype.lineIntersect = function(x1,  y1, x2,  y2, x3,  y3, x4,  y4){
   
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
};