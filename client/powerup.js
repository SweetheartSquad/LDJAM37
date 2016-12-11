function Powerup(){
	this.px = 0;
	this.py = 0;

	this.radius = 20;

	this.graphics = new PIXI.Graphics();

	this.draw();
};

Powerup.prototype.update = function(){
	this.graphics.x = this.px;
	this.graphics.y = this.py;
};

Powerup.prototype.draw = function(){
	this.graphics.clear();
	this.graphics.beginFill(0x000000);
	this.graphics.drawCircle(0,0, this.radius);
	this.graphics.endFill();
};

