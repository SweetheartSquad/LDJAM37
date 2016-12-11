function Bullet(){

	this.debug = new PIXI.Graphics();

	this.px = 0;
	this.py = 0;

	this.vx = 0;
	this.vy = 0;

	this.radius = 20;

	this.graphics = new PIXI.Graphics();
	this.graphics.scale.x = 3;
	this.graphics.scale.y = 3;

	this.draw();
};

Bullet.prototype.update = function(){
	this.px += this.vx;
	this.py += this.vy;

	this.graphics.x = this.px;
	this.graphics.y = this.py;

	this.graphics.scale.x = lerp(this.graphics.scale.x, 1.0, 0.2);
	this.graphics.scale.y = lerp(this.graphics.scale.y, 1.0, 0.2);
};

Bullet.prototype.draw = function(){
	this.graphics.clear();
	this.graphics.beginFill(0x000000);
	this.graphics.drawCircle(0,0, this.radius);
	this.graphics.endFill();
};