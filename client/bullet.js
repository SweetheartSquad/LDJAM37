function Bullet(){

	this.debug = new PIXI.Graphics();

	this.px = 0;
	this.py = 0;

	this.vx = 0;
	this.vy = 0;

	this.radius = 10;

	this.graphics = new PIXI.Graphics();

	this.draw();
};

Bullet.prototype.update = function(){
	this.px += this.vx;
	this.py += this.vy;

	this.graphics.x = this.px;
	this.graphics.y = this.py;
};

Bullet.prototype.draw = function(){
	this.graphics.clear();
	this.graphics.beginFill(0x000000);
	this.graphics.drawCircle(0,0, this.radius);
	this.graphics.endFill();
};


