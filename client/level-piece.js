
function LevelPiece(){

	this.graphics = new PIXI.Graphics();
	this.px;
	this.py;
	this.rad;
	this.color;
	this.shapeDirty = true;

	this.graphics.scale.x = 1.1;
	this.graphics.scale.y = 1.1;

	//this.draw();
}

LevelPiece.prototype.init = function(x, y, rad, color){
	this.px = x;
	this.py = y;
	this.rad = rad;
	this.color = color;	
};

LevelPiece.prototype.renderShape = function(){
	this.graphics.clear();
	this.graphics.lineStyle(0);
	this.graphics.beginFill(this.color);
	this.graphics.drawCircle(0, 0, this.rad);
	this.graphics.endFill();
	this.shapeDirty = false;
};

LevelPiece.prototype.update = function(){
	this.graphics.position.x = this.px;
	this.graphics.position.y = this.py;

	this.graphics.scale.x = lerp(this.graphics.scale.x, 1.0, 0.1);
	this.graphics.scale.y = lerp(this.graphics.scale.y, 1.0, 0.1);
};

LevelPiece.prototype.draw = function(){	
	if(this.shapeDirty){
		this.renderShape();
	}
};

LevelPiece.prototype.compress = function(x, y){
	if(x < this.graphics.scale.x){
		this.graphics.scale.x = lerp(this.graphics.scale.x, x, 0.25);
	}
	if(y < this.graphics.scale.y){
		this.graphics.scale.y = lerp(this.graphics.scale.y, y, 0.25);
	}
};