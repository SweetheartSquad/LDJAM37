
function LevelPiece(){

	this.graphics = new PIXI.Graphics();

	this.init = function(x, y, rad){
		this.graphics.lineStyle(4, 0x000);
		this.graphics.beginFill(0xFFFF0B);
		this.graphics.drawCircle(x, y, rad);
		this.graphics.endFill();			
	}

	this.update = function(){
		this.graphics.position.x += 0.1;
	};

	this.draw =  function(){	

	}

}