function Menu(){
	this.scene = new PIXI.Container();
	game.addChild(this.scene);


	this.bg = new PIXI.Sprite(PIXI.loader.resources.bg.texture);
	this.bg.width = size.x;
	this.bg.height = size.y;
	this.scene.addChild(this.bg);

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


	this.playerGraphics=[];

	for(var i = 0; i < 4; ++i){
		var g = new PIXI.Graphics();
		this.scene.addChild(g);
	
		g.beginFill(0xFFFFFF);
		renderSVG(g, "M128,527c4.398-21.099,13.186-38.803,23.902-57.131c9.31-15.924,16.095-33.065,25.908-48.978c6.624-10.741,13.051-16.533,20.545-24.621c6.547-7.066,12.664-15.144,19.419-21.271c4.335-3.931,13.1-9.01,16.375-14.045c-7.501-2.929-13.358-12.016-19.149-17.979c-2.343-2.412-6.433-8.525-9.62-9.258c-5.282-1.216-28.651,15.658-33.625,18.595c-6.188,3.652-11.829,8.234-18.48,10.781c-2.711-16.563-23.951-28.03-28.977-44.376c15.748-6.279,30.064-15.069,46.326-20.564c9.931-3.355,21.191-4.67,29.929-10.729c2.937,1.066,6.487-0.119,8.699-3.278c1.277-0.549,2.588-0.513,4.706-1.745c22.084,12.494,43.856,28.231,65.82,39.95c6.555,3.497,20.226,7.568,26.23,6.068c13.831,5.089,28.391-13.508,31.765-24.373c4.37-14.071-0.818-40.854-7.641-53.559c1.804,3.91,5.845,13.286,10.795,13.085c7.551-0.305,10.988-12.79,11.628-18.361c1.131-9.844-0.208-39.229-15.503-39.258c-8.852-0.018-16.144,15.227-16.242,23.059c-10.499-7.182-7.434-42.471-3.699-51.767c5.827-14.505,17.008-33.236,35.192-30.748c11.902,1.629,23.201,8.832,32.86,15.394c12.459,8.464,12.796,18.414,12.683,33.09c-2.977-2.175-8.792-14.885-11.765-15.075c-6.709-0.429-7.438,13.212-7.149,18.063c0.829,13.913,11.483,28.798,22.075,37.126c3.042-5.975,0.812-13.318-0.604-19.517c31.609,22.367,17.524,76.472,13.515,107.086c27.798-21.56,55.521-49.036,78.91-74.908c7.14-7.898,12.622-8.873,3.689-16.74c-9.603-8.458-17.804-17.525-26.941-25.943c-4.367-4.023-10.792-5.732-14.392-10.101c-1.783-2.165-2.133-3.799-5.025-5.231c6.936-8.688,16.724-14.705,24.863-22.025c5.863,12.412,15.113,27.695,25.165,37.018c18.146-16.726,24.101-42.95,40.138-60.664c10.498,5.441,17.022,14.11,28.924,16.602c-1.857,16.099-17.396,29.337-24.819,43.324c-6.186,11.655-11.593,15.964-17.349,27.462c12.064-7.76,19.489-14.972,31.915-21.46c4.226-2.206,9.055,32.012,8.701,36.429c-1.15,14.414-10.085,24.514-23.577,29.791c-1.006,4.969-6.229,3.584-9.788,7.895c7.187,10.849,12.646,23.303,19.636,34.22c-7.58,1.519-16.014,7.698-21.759,12.593c-5.735-12.762-11.881-24.742-19.215-36.631c-5.474,9.774-10.979,19.21-19.972,26.246c1.897,2.421-17.417,31.591-21.028,38.417c-5.85,11.055-9.881,23.796-15.819,34.256c-6.152,10.837-8.042,11.729-6.288,25.484c2.901,22.751,10.66,43.331,16.107,65.362c1.784,7.215,4.371,13.828,6.007,20.939c1.886,8.194-0.596,15.251,3,22.996L128,527z");
		g.endFill();


		this.playerGraphics.push(g);
	}

	this.playerGraphics[1].x = size.x/2;
	this.playerGraphics[2].y = size.y/2;
	this.playerGraphics[3].x = size.x/2;
	this.playerGraphics[3].y = size.y/2;

	this.joined = [false,false,false,false];
	this.ready = [false,false,false,false];
};

Menu.prototype.destroy = function(){
	game.removeChild(this.scene);
	this.scene.destroy();
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


		if(this.ready[i]){
			this.playerGraphics[i].tint = 0x999999;
		}else if(this.joined[i]){
			this.playerGraphics[i].tint = 0x555555;
		}else{
			this.playerGraphics[i].tint = 0x000000;
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