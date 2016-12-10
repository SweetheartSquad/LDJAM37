
function LevelPiece(){

	this.graphics = new PIXI.Graphics();
	this.px;
	this.py;
	this.rad;
	this.color;
	this.shapeDirty = true;

	this.init = function(x, y, rad, color){
		this.px = x;
		this.py = y;
		this.rad = rad;
		this.color = color;	
	}

	this.renderShape = function(){
		this.graphics.clear();
		this.graphics.lineStyle(0);
		this.graphics.beginFill(this.color);
		this.graphics.drawCircle(0, 0, this.rad);
		this.graphics.endFill();
		this.shapeDirty = false;
	}

	this.update = function(){
		this.graphics.position.x = this.px;
		this.graphics.position.y = this.py;
		if(this.graphics.scale.x < 1){
			Math.min(this.graphics.scale.x += 0.075, 1.0 - this.graphics.scale.x);
		}
		if(this.graphics.scale.y < 1){
			Math.min(this.graphics.scale.y += 0.075, 1.0 - this.graphics.scale.y);
		}
	};

	this.draw =  function(){	
		if(this.shapeDirty){
			this.renderShape();
		}
	}

	this.compress = function(x, y){
		this.graphics.scale.x = x;
		this.graphics.scale.y = y;
	}
}