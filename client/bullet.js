function Bullet(){

	this.debug = new PIXI.Graphics();

	this.px = 0;
	this.py = 0;

	this.vx = 0;
	this.vy = 0;

	this.collisions = 0;
	this.owner = null;

	this.radius = 20;

	this.graphics = new PIXI.Graphics();
	this.graphics.scale.x = 3;
	this.graphics.scale.y = 3;

	this.skip = false;

	this.graphics.rotation = Math.random()*Math.PI*2;

	this.draw();
};

Bullet.prototype.update = function(){
	if(this.skip <= 0){
		this.px += this.vx;
		this.py += this.vy;

		this.graphics.x = this.px;
		this.graphics.y = this.py;
		
		this.graphics.scale.x = lerp(this.graphics.scale.x, 1.0, 0.2);
		this.graphics.scale.y = lerp(this.graphics.scale.y, 1.0, 0.2);

		this.graphics.rotation += 0.1;
	}else{
		this.skip -= 1;
	}
	
};

Bullet.prototype.draw = function(){
	this.graphics.clear();
	this.graphics.beginFill(colors[0]);
	this.graphics.drawCircle(
		(Math.random()-Math.random())*3,
		(Math.random()-Math.random())*3,
		this.radius+Math.random()*5);
	this.graphics.beginFill(colors[1]);
	this.graphics.drawCircle(
		(Math.random()-Math.random())*3,
		(Math.random()-Math.random())*3,
		this.radius-Math.random()*3-3);
	this.graphics.beginFill(colors[2]);
	this.graphics.drawCircle(
		(Math.random()-Math.random())*3,
		(Math.random()-Math.random())*3,
		this.radius-Math.random()*3-9);
	this.graphics.endFill();
};