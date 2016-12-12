function Particle(x,y, vx,vy, r){
	this.graphics = new PIXI.Graphics();

	this.age = 0;
	this.lifetime = 30;

	this.radius = r || 10;

	this.px = x;
	this.py = y;

	this.vx = vx;
	this.vy = vy;

	this.draw();
};

Particle.prototype.update = function(){
	this.age += 1;

	this.px += this.vx;
	this.py += this.vy;

	this.vx *= 0.95;
	this.vy *= 0.95;

	this.graphics.position.x = this.px;
	this.graphics.position.y = this.py;

	this.graphics.scale.x = 1.0 - this.age/this.lifetime;
	this.graphics.scale.y = 1.0 - this.age/this.lifetime;
};

Particle.prototype.draw = function(){
	this.graphics.clear();
	this.graphics.beginFill(0xDDDDDD);
	this.graphics.drawCircle(0,0,this.radius);
	this.graphics.endFill();
};