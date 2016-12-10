function Player(){
	this.vx = 0;
	this.vy = 0;
	this.ax = 0;
	this.ay = 0;

	this.px = size.x/2;
	this.py = size.y/2;
	

	this.points = [];
	this.graphics = new PIXI.Graphics();
};

Player.prototype.update = function(){
	// integrate velocity by acceleration
	this.vx += this.ax;
	this.vy += this.ay;

	// integrate position by velocity
	this.px += this.vx;
	this.py += this.vy;

	// update actual graphics
	this.graphics.x = this.px;
	this.graphics.y = this.py;

	// reset acceleration for next frame
	this.ax = 0;
	this.ay = 0;
};

Player.prototype.draw = function(){
	var g = this.graphics;

	g.clear();
	// set a fill and line style
	g.beginFill(0xFF3300);
	g.lineStyle(10, 0xffd900, 1);
	// draw character
	g.moveTo(50,50);
	g.lineTo(250, 50);
	g.lineTo(100, 100);
	g.lineTo(250, 220);
	g.lineTo(50, 220);
	g.lineTo(50, 50);
	g.endFill();
};