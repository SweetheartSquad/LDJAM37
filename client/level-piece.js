function LevelPiece(px, py, radius, color){
	this.graphics = new PIXI.Graphics();
	this.px = px;
	this.py = py;
	this.radius = radius;
	this.color = color;

	this.graphics.scale.x = 1.1;
	this.graphics.scale.y = 1.1;

	this.draw();
};

LevelPiece.prototype.update = function(){
	this.graphics.position.x = this.px;
	this.graphics.position.y = this.py;

	this.graphics.scale.x = lerp(this.graphics.scale.x, 1.0, 0.1);
	this.graphics.scale.y = lerp(this.graphics.scale.y, 1.0, 0.1);
};

LevelPiece.prototype.draw = function(){
	this.graphics.clear();
	this.graphics.beginFill(0x7a5e57);
	this.graphics.drawCircle(0, 0, this.radius);
	this.graphics.endFill();
	this.graphics.beginFill(this.color);
	this.graphics.drawCircle(0, -20, this.radius);
	this.graphics.endFill();
};

LevelPiece.prototype.compress = function(y){
	if(y < this.graphics.scale.y){
		this.graphics.scale.y = lerp(this.graphics.scale.y, y, 0.25);
	}
};