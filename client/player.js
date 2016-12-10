
function Player(){
	this.x = 0;
	this.y = 0;
	this.points = [];
	this.graphics = new PIXI.Graphics();

	this.update = function(){
		this.graphics.position.x += 0.1;
	};

	this.draw =  function(){
		///this.clear();
		// set a fill and line style
		this.graphics.beginFill(0xFF3300);
		this.graphics.lineStyle(10, 0xffd900, 1);
		// d.graphics.e
		this.graphics.moveTo(50,50);
		this.graphics.lineTo(250, 50);
		this.graphics.lineTo(100, 100);
		this.graphics.lineTo(250, 220);
		this.graphics.lineTo(50, 220);
		this.graphics.lineTo(50, 50);
		this.graphics.endFill();
	}

}