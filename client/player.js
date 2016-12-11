function Player(){
	this.vx = 0;
	this.vy = 0;
	this.ax = 0;
	this.ay = 0;

	this.width = 50;
	this.height = 60;

	this.px = size.x/2;
	this.py = size.y/2;

	this.dampingx = 0.05;
	this.dampingy = 0.05;

	this.aimx = 1;
	this.aimy = 0;
	
	this.touchingWall = false;
	this.touchingFloor = false;
	this.touchingCeil = false;
	this.flipped = false;


	this.radius = 40;

	this.container = new PIXI.Container();

	this.head = new PIXI.Graphics();
	this.body = new PIXI.Graphics();
	this.footL = new PIXI.Graphics();
	this.footR = new PIXI.Graphics();
	this.arms = new PIXI.Graphics();

	this.container.addChild(this.body);
	this.container.addChild(this.head);
	this.container.addChild(this.footL);
	this.container.addChild(this.footR);
	this.container.addChild(this.arms);
	
	this.colliderLines = this.calcColliderLines();

	this.debug = new PIXI.Graphics();

	this.draw();
};

Player.prototype.update = function(){
	// integrate velocity by acceleration
	this.vx += this.ax;
	this.vy += this.ay;

	this.vx *= 1.0 - this.dampingx;
	this.vy *= 1.0 - this.dampingy;

	// integrate position by velocity
	this.px += this.vx;
	this.py += this.vy;

	// update actual graphics
	this.container.position.x = this.px;
	this.container.position.y = this.py;
	this.container.scale.x = lerp(this.container.scale.x, 1.0+Math.sin(curTime/100.0)/10.0, 0.1);
	this.container.scale.y = lerp(this.container.scale.y, 1.0+Math.cos(curTime/100.0)/20.0, 0.1);

	this.container.rotation = slerp(this.container.rotation, 0.0, 0.1);
	
	this.body.x = 0;
	this.body.y = 0;

	this.head.x = 0;
	this.head.y = 0 - 25;

	this.footL.x = 0-20;
	this.footL.y = 0 + 10;

	this.footR.x = 0+20;
	this.footR.y = 0 + 10;

	this.arms.x = 0;
	this.arms.y = 0 - 30;
	this.arms.rotation = Math.atan2(this.aimy, this.aimx);
	if(this.flipped){
		this.arms.rotation += Math.PI;
	}

	this.debug.x = this.px;
	this.debug.y = this.py;

	this.head.scale.x = (this.flipped ? -1 : 1) * Math.abs(this.head.scale.x);
	this.body.scale.x = (this.flipped ? -1 : 1) * Math.abs(this.body.scale.x);
	this.footL.scale.x = (this.flipped ? -1 : 1) * Math.abs(this.footL.scale.x);
	this.footR.scale.x = (this.flipped ? -1 : 1) * Math.abs(this.footR.scale.x);
	this.arms.scale.x = (this.flipped ? -1 : 1) * Math.abs(this.arms.scale.x);

	// reset acceleration for next frame
	this.ax = 0;
	this.ay = 0;
};

Player.prototype.draw = function(){
	// head
	this.head.clear();
	this.head.beginFill(0xFF0000);
	this.renderSVG(this.head, "M9.264,2.32c0,0,4.625-43.945-11.404-37.715c-16.028,6.231-9.04,36.543-6.969,38.347C3.679,15.435,9.264,2.32,9.264,2.32");
	this.head.endFill();

	// body
	this.body.clear();
	this.body.beginFill(0xFF3300);
	this.renderSVG(this.body, "M21.473,10.333c-0.973,1.167-42.303,0.833-43.138,0S-21.624-36.046,0-36.046S22.446,9.167,21.473,10.333z");
	this.body.endFill();


	// feet
	this.footL.clear();
	this.footL.beginFill(0xFF3300);
	this.renderSVG(this.footL, "M11.858,6.407C12.25,5.625,11.56-6.693-0.078-6.402C-11.715-6.111-12.278,5.876-11.858,6.407S11.858,6.407,11.858,6.407z");
	this.footL.endFill();

	this.footR.clear();
	this.footR.beginFill(0xFF3300);
	this.renderSVG(this.footR, "M11.858,6.407C12.25,5.625,11.56-6.693-0.078-6.402C-11.715-6.111-12.278,5.876-11.858,6.407S11.858,6.407,11.858,6.407z");
	this.footR.endFill();

	// arms
	this.arms.clear();
	this.arms.beginFill(0xFF3300);
	this.renderSVG(this.arms, "M52.272-1.429l-22.429,5.81L12.71,8.503c0,0-2.934-0.111-3.997-3.051C7.688,2.612,11,1.587,11,1.587L27.763-2.04l23.888-5.738L52.272-1.429z");
	this.arms.endFill();
	this.arms.beginFill(0xFF3300);
	this.renderSVG(this.arms, "M-10.174-13.653L-46.25-3.484l30.947,10.988c0,0,3.137,2.161,5.496-0.904c2.278-2.96-1.265-5.428-1.265-5.428c-0.903-0.603-19.149-4.619-19.149-4.619l21.888-4.605L-10.174-13.653z");
	this.arms.endFill();
	this.arms.beginFill(0xFF3300);
	this.renderSVG(this.arms, "M46.73-3.297L44.609-13.81l-9-5.978l1.438-2.165l8.775,5.828c0,0,5.263-8.557,5.741-8.757s2.124,1.447,2.124,1.447l-5.925,8.989l2.141,10.509L46.73-3.297z");
	this.arms.endFill();

	// debug
	this.debug.clear();
	this.debug.lineStyle(4,0x000000);
	this.debug.drawCircle(0, 0, this.radius);
	this.debug.endFill();
};

Player.prototype.canJump = function(){
	return this.touchingFloor || this.touchingWall;
};

Player.prototype.canWallJump = function(){
	return this.touchingWall && !this.touchingFloor;
};


Player.prototype.renderSVG = function(g, input){
	input = input.replace(/[-]/g,",-");

	var instructions = input.match(/[A-z]/g);
	var inputs = input.split(/[A-z]/g);
	inputs.shift();

	//console.log(inputs);
	//console.log(instructions);

	var start={x:0,y:0};
	var current={x:0,y:0};
	var lastCurve={x:0,y:0};
	for(var i = 0; i < instructions.length; ++i){

		if(inputs[i].substr(0,1) == ","){
			inputs[i] = inputs[i].substr(1);
		}
		var data=inputs[i].split(",");

		var relative = false;
		//console.log(instructions[i]);
		switch(instructions[i]){
			case "m":
			case "M":
			// move
			start.x = parseFloat(data[0]);
			start.y = parseFloat(data[1]);
			g.moveTo(start.x, start.y);
			current.x = start.x;
			current.y = start.y;
			break;

			case "l":
			// line (relative)
				current.x += parseFloat(data[0]);
				current.y += parseFloat(data[1]);
				g.lineTo(current.x, current.y);
			break;
			case "L":
			// line (absolute)
				current.x = parseFloat(data[0]);
				current.y = parseFloat(data[1]);
				g.lineTo(current.x, current.y);
			break;

			case "h":
			// horizontal line (relative)
				current.x += parseFloat(data[0]);
				g.lineTo(current.x, current.y);
			case "H":
			// horizontal line (absolute)
				current.x = parseFloat(data[0]);
				g.lineTo(current.x, current.y);
			break;

			case "v":
			// vertical line (relative)
				current.y += parseFloat(data[0]);
				g.lineTo(current.x, current.y);
			case "V":
			// vertical line (absolute)
				current.y = parseFloat(data[0]);
				g.lineTo(current.x, current.y);
			break;

			case "z":
			case "Z":
			// close
			g.lineTo(start.x, start.y);
			break;

			case "c":
			// curve (relative)
				g.bezierCurveTo(
					current.x + parseFloat(data[0]),
					current.y + parseFloat(data[1]),
					current.x + parseFloat(data[2]),
					current.y + parseFloat(data[3]),
					current.x + parseFloat(data[4]),
					current.y + parseFloat(data[5])
				);
				lastCurve.x = 2*(current.x+parseFloat(data[4])) - (current.x+parseFloat(data[2]));
				lastCurve.y = 2*(current.y+parseFloat(data[5])) - (current.y+parseFloat(data[3]));

				current.x += parseFloat(data[4]);
				current.y += parseFloat(data[5]);
			break;

			case "C":
			// curve (absolute)
				g.bezierCurveTo(
					parseFloat(data[0]),
					parseFloat(data[1]),
					parseFloat(data[2]),
					parseFloat(data[3]),
					parseFloat(data[4]),
					parseFloat(data[5])
				);
				lastCurve.x = 2*parseFloat(data[4]) - parseFloat(data[2]);
				lastCurve.y = 2*parseFloat(data[5]) - parseFloat(data[3]);

				current.x = parseFloat(data[4]);
				current.y = parseFloat(data[5]);
			break;

			case "s":
			// curve with reflection (relative)
				g.bezierCurveTo(
					current.x + lastCurve.x,
					current.y + lastCurve.y,
					current.x + parseFloat(data[0]),
					current.y + parseFloat(data[1]),
					current.x + parseFloat(data[2]),
					current.y + parseFloat(data[3])
				);
				lastCurve.x = 2*parseFloat(data[2]) - parseFloat(data[0]);
				lastCurve.y = 2*parseFloat(data[3]) - parseFloat(data[1]);

				current.x += parseFloat(data[2]);
				current.y += parseFloat(data[3]);
			break;
			case "S":
			// curve with reflection (absolute)
				g.bezierCurveTo(
					lastCurve.x,
					lastCurve.y,
					parseFloat(data[0]),
					parseFloat(data[1]),
					parseFloat(data[2]),
					parseFloat(data[3])
				);
				lastCurve.x = 2*parseFloat(data[2]) - parseFloat(data[0]);
				lastCurve.y = 2*parseFloat(data[3]) - parseFloat(data[1]);

				current.x = parseFloat(data[2]);
				current.y = parseFloat(data[3]);
			break;
		}
	}
}

Player.prototype.calcColliderLines =function(){
	var halfWidth = this.width * 0.5;
	var halfHeight = this.height * 0.5;
	return [
		{x1: this.px + 0 - halfWidth, y1: this.py + 0 - halfHeight, x2: this.px + this.width - halfWidth, y2:this.py + 0 - halfHeight},
		{x1: this.px + this.width - halfWidth, y1: this.py + 0 - halfHeight, x2:this.px + this.width - halfWidth, y2:this.py + this.height - halfHeight},
		{x1: this.px + this.width - halfWidth, y1: this.py + this.height - halfHeight, x2: this.px + 0 - halfWidth, y2: this.py + this.height - halfHeight},
		{x1: this.px + 0 - halfWidth, y1: this.py + this.height  - halfHeight, x2: this.px + 0 - halfWidth, y2: this.py + 0 - halfHeight}
	];
}