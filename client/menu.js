function Menu(_players){
	this.scene = new PIXI.Container();
	game.addChild(this.scene);

	this.bg = new PIXI.Sprite(PIXI.loader.resources.bg.texture);
	this.bg.width = size.x;
	this.bg.height = size.y;
	this.scene.addChild(this.bg);

	game.scale.x = game.scale.y = 3.5;

	this.playerGraphics=[];
	this.playerText=[];

	for(var i = 1; i < 5; ++i){
		var g = new PIXI.Sprite(PIXI.loader.resources["port_" + i].texture);
		this.scene.addChild(g);
		g.anchor.x = 0.5;
		g.anchor.y = 0.5;
		this.playerGraphics.push(g);

		var gjtj = new PIXI.Sprite(PIXI.loader.resources.jumpToJoin.texture);
		this.scene.addChild(gjtj);
		gjtj.anchor.x = 0.5;
		gjtj.anchor.y = 0.5;

		var gjtr = new PIXI.Sprite(PIXI.loader.resources.jumpToReady.texture);
		this.scene.addChild(gjtr);
		gjtr.anchor.x = 0.5;
		gjtr.anchor.y = 0.5;
		gjtr.visible = false;

		var gstc = new PIXI.Sprite(PIXI.loader.resources.shootToCancel.texture);
		this.scene.addChild(gstc);
		gstc.anchor.x = 0.5;
		gstc.anchor.y = 0.5;
		gstc.visible = false;

		this.playerText.push(
			{
				jtj:gjtj,
				jtr:gjtr,
				stc:gstc
			}
		);
	}

	this.playerGraphics[0].x = this.playerText[0].jtr.x = this.playerText[0].jtj.x = this.playerText[0].stc.x = size.x * 0.25;
	this.playerGraphics[0].y = this.playerText[0].jtr.y = this.playerText[0].jtj.y = this.playerText[0].stc.y = size.y * 0.3;

	this.playerGraphics[1].x = this.playerText[1].jtr.x = this.playerText[1].jtj.x = this.playerText[1].stc.x = size.x * 0.75;
	this.playerGraphics[1].y = this.playerText[1].jtr.y = this.playerText[1].jtj.y = this.playerText[1].stc.y= size.y * 0.3;


	this.playerGraphics[2].x = this.playerText[2].jtr.x = this.playerText[2].jtj.x = this.playerText[2].stc.x = size.x * 0.25;
	this.playerGraphics[2].y = this.playerText[2].jtr.y = this.playerText[2].jtj.y = this.playerText[2].stc.y= size.y * 0.7;


	this.playerGraphics[3].x = this.playerText[3].jtr.x = this.playerText[3].jtj.x = this.playerText[3].stc.x = size.x * 0.75;
	this.playerGraphics[3].y = this.playerText[3].jtr.y = this.playerText[3].jtj.y = this.playerText[3].stc.y= size.y * 0.7;

	this.title = new PIXI.Sprite(PIXI.loader.resources.title.texture);
	this.title.anchor.x = 0.5;
	this.title.anchor.y = 0.5;
	this.title.position.x = size.x/2;
	this.title.position.y = size.y/2;
	this.scene.addChild(this.title);

	this.title = new PIXI.Sprite(PIXI.loader.resources.title.texture);
	this.title.anchor.x = 0.5;
	this.title.anchor.y = 0.5;
	this.title.position.x = size.x/2+5;
	this.title.position.y = size.y/2+5;
	this.title.tint = 0x999999;
	this.scene.addChild(this.title);


	this.joined = [false,false,false,false];
	this.ready = [false,false,false,false];

	// automatically join passed in players
	for(var i = 0; i < _players.length; ++i){
		this.joined[_players[i]] = true;
	}
};

Menu.prototype.destroy = function(){
	game.removeChild(this.scene);
	this.scene.destroy();
};

Menu.prototype.update = function(){
	game.position.x = size.x/2;
	game.position.y = size.y/2;

	this.scene.position.x = Math.sin(curTime/2000.0)*10-size.x/2;
	this.scene.position.y = Math.cos(curTime/3000.0)*10-size.y/2;

	game.scale.x = game.scale.y = lerp(game.scale.x, 1.25, 0.05);

	if(!this.isDone()){
		for(var i = 0; i < 4; ++i){
			var input = getInput(i);

			if(input.jump){
				if(this.ready[i]){
					// nothing
				}else if(this.joined[i]){
					// ready up
					this.ready[i] = true;
					game.scale.x += 0.1;
					game.scale.y += 0.1;
					sounds["jump"].play();
				}else{
					// join
					this.joined[i] = true;
					game.scale.x += 0.1;
					game.scale.y += 0.1;
					sounds["shoot"].play();
				}
			}

			if(input.shoot){
				if(this.ready[i]){
					// unready
					this.ready[i] = false;
					game.scale.x -= 0.1;
					game.scale.y -= 0.1;
					sounds["cancel"].play();
				}else if(this.joined[i]){
					// unjoin
					this.joined[i] = false;
					game.scale.x -= 0.1;
					game.scale.y -= 0.1;
					sounds["cancel"].play();
				}else{
					// nothing
				}
			}


			if(this.ready[i]){
				this.playerText[i].stc.visible = true;
				this.playerText[i].jtj.visible = false;
				this.playerText[i].jtr.visible = false;
				this.playerGraphics[i].tint = 0xFFFFFF;
			}else if(this.joined[i]){
				this.playerGraphics[i].tint = 0x999999;
				this.playerText[i].stc.visible = false;
				this.playerText[i].jtj.visible = false;
				this.playerText[i].jtr.visible = true;
			}else{
				this.playerGraphics[i].tint = 0x000000;
				this.playerText[i].stc.visible = false;
				this.playerText[i].jtj.visible = true;
				this.playerText[i].jtr.visible = false;
			}
		}
	}
};

Menu.prototype.isDone = function(){
	var numjoined = 0;
	var numready = 0;
	for(var i = 0; i < 4; ++i){
		if(this.joined[i]){
			numjoined += 1;
		}if(this.ready[i]){
			numready += 1;
		}
	}
	return numjoined > 1 && numjoined == numready;
};

Menu.prototype.getPlayers = function(){
	var players = [];
	for(var i = 0; i < 4; ++i){
		if(this.ready[i]){
			players.push(i);
		}
	}
	return players;
};

Menu.prototype.render = function(){

};