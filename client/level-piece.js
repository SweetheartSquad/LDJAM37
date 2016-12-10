
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
		this.graphics.drawCircle(this.px, this.py, this.rad);
		this.graphics.endFill();
		this.shapeDirty = false;
	}

	this.update = function(){
		this.graphics.position.x += 0.1;
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