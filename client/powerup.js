function Powerup(type){
	this.type = type;

	this.px = 0;
	this.py = 0;

	this.radius = 40;

	this.graphics = new PIXI.Sprite(PIXI.loader.resources["powerup_"+Powerup.types[this.type].spr].texture);
	this.graphics.anchor.x = 0.5;
	this.graphics.anchor.y = 0.5;
	this.graphics.scale.x = this.graphics.scale.y = 0.5;

	this.draw();
};

Powerup.prototype.update = function(){
	this.graphics.x = this.px;
	this.graphics.y = this.py;
};

Powerup.prototype.draw = function(){

};


Powerup.types=[
	{
		id: "unlimited shots",
		spr: "shoot",
		duration:200,
		effect:function(player){
			player.shootDelay = 0;
		}
	},
	{
		id: "unlimited jumps",
		spr: "jump",
		duration:200,
		effect:function(player){
			player.doubleJump = true;
		}
	},
	{
		id: "speed",
		spr: "speed",
		duration:200,
		effect:function(player){
			player.vx += Math.sign(player.vx);
			player.vy += Math.sign(player.vy);
		}
	}
]