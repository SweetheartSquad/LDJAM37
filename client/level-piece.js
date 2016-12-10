
function LevelPiece(){

	this.graphics = new PIXI.Graphics();

	this.init = function(x, y, rad, color){
		this.graphics.lineStyle(0);
		this.graphics.beginFill(color);
		this.graphics.drawCircle(x, y, rad);
		this.graphics.endFill();			
	}

	this.update = function(){
		this.graphics.position.x += 0.1;
	};

	this.draw =  function(){	

	}

	this.compress = function(x, y){
		this.graphics.scale.x = x;
		this.graphics.scale.y = y;
	}

}