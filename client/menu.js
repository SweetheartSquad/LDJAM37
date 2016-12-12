function Menu(){
	this.bg = new PIXI.Sprite(PIXI.loader.resources.bg.texture);
	this.bg.width=size.x;
	this.bg.height=size.y;
	game.addChild(this.bg);

	this.joined = [false,false,false,false];
	this.ready = [false,false,false,false];
};

Menu.prototype.destroy = function(){
	game.removeChild(this.bg);
};

Menu.prototype.update = function(){
	for(var i = 0; i < 4; ++i){
		var input = getInput(i);

		if(input.jump){
			if(this.ready[i]){
				// nothing
				this.ready[i] = true;
			}else if(this.joined[i]){
				// ready up
				this.ready[i] = true;
			}else{
				// join
				this.joined[i] = true;
			}
		}

		if(input.shoot){
			if(this.ready[i]){
				// unready
				this.ready[i] = false;
			}else if(this.joined[i]){
				// unjoin
				this.joined[i] = false;
			}else{
				// nothing
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