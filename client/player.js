function Player(_id){
	this.id = _id;

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

	this.doubleJump = false;

	this.shootDelay = Player.shootDelay;

	this.hitDelay = 0;

	this.container = new PIXI.Container();

	this.partsContainer = new PIXI.Container();
	this.heartsContainer = new PIXI.Container();

	this.head = new PIXI.Graphics();
	this.body = new PIXI.Graphics();
	this.footL = new PIXI.Graphics();
	this.footR = new PIXI.Graphics();
	this.arms = new PIXI.Graphics();

	this.container.addChild(this.partsContainer);
	this.container.addChild(this.heartsContainer);

	this.partsContainer.addChild(this.body);
	this.partsContainer.addChild(this.head);
	this.partsContainer.addChild(this.footL);
	this.partsContainer.addChild(this.footR);
	this.partsContainer.addChild(this.arms);

	this.bulletPreview = new Bullet();
	this.bulletPreview.px = -20;
	this.bulletPreview.py = -10;
	this.arms.addChild(this.bulletPreview.graphics);

	this.hearts = [];

	this.lives = 3;
	for(var i = 1; i <= this.lives; ++i){
		var heart = new PIXI.Graphics();
		heart.x = (i-(this.lives+1)/2)*30;
		heart.y = -100;
		this.hearts.push(heart);

		this.heartsContainer.addChild(heart);
	}
	this.updateLives();
	
	this.colliderLines = this.calcColliderLines();

	this.debug = new PIXI.Graphics();

	this.draw();
};

Player.shootDelay = 100;
Player.hitDelay = 120;

Player.prototype.update = function(){
	this.bulletPreview.update();
	this.bulletPreview.graphics.scale.x = this.bulletPreview.graphics.scale.y = 0.5;

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
	this.container.scale.y = lerp(this.container.scale.y, 1.0+Math.cos(curTime/100.0+0.5)/20.0, 0.1);

	this.partsContainer.rotation = slerp(this.partsContainer.rotation, this.canAct() ? 0.0 : (this.flipped ? Math.PI/2 : -Math.PI/2), 0.1);

	this.container.skew.x = lerp(this.container.skew.x, clamp(-Math.PI/4, this.vx/100.0, Math.PI/4), 0.5);
	this.container.skew.y = lerp(this.container.skew.y, clamp(-Math.PI/4, this.vy/100.0, Math.PI/4), 0.5);
	
	this.body.x = 0;
	this.body.y = 0;

	this.head.x = 0;
	this.head.y = 0 - 25;
	var targetRotation = Math.atan2(this.aimy, this.aimx);
	if(this.flipped){
		targetRotation += Math.PI;
	}
	targetRotation = slerp(0, targetRotation, 0.4);
	this.head.rotation = slerp(this.head.rotation, targetRotation, 0.2);

	this.footL.x = lerp(this.footL.x, -20, 0.1);
	this.footL.y = lerp(this.footL.y, 10 + Math.sin(curTime/50)*20*clamp(0.0, Math.abs(this.vx/10), 1.0), 0.1);

	this.footR.x = lerp(this.footR.x, 20, 0.1);
	this.footR.y = lerp(this.footR.y, 10 + Math.sin(curTime/50+Math.PI)*20*clamp(0.0, Math.abs(this.vx/10), 1.0), 0.1);

	this.arms.x = 0;
	this.arms.y = 0 - 30;

	targetRotation = Math.atan2(this.aimy, this.aimx);
	if(this.flipped){
		targetRotation += Math.PI;
	}
	this.arms.rotation = slerp(this.arms.rotation, targetRotation, 0.5);

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

	if(this.shootDelay > 0){
		this.shootDelay -= 1;
	}
	if(this.hitDelay > 0){
		this.hitDelay -= 1;
		this.partsContainer.visible = Math.round(this.hitDelay/4)%2 == 0;
		this.heartsContainer.visible = true;

		this.hearts[this.lives].scale.x = this.hearts[this.lives].scale.y = 2;
		this.hearts[this.lives].position.x = (this.lives-1-(this.hearts.length+1)/2)*30+90;
	}else{
		this.partsContainer.visible = true;
		this.heartsContainer.visible = false;
	}

	this.bulletPreview.graphics.visible = this.canShoot();
};

Player.prototype.draw = function(){
	// head
	this.head.clear();
	this.head.beginFill(0xff959c);
	renderSVG(this.head, "M9.264,2.32c0,0,4.625-43.945-11.404-37.715c-16.028,6.231-9.04,36.543-6.969,38.347C3.679,15.435,9.264,2.32,9.264,2.32");
	this.head.beginFill(0xFFFFFF);
	this.head.drawEllipse(-5,-20, 3, 6);
	this.head.drawEllipse(5,-20, 4, 5);
	this.head.endFill();

	// body
	this.body.clear();
	this.body.beginFill(0x6a689c);
	renderSVG(this.body, "M21.473,10.333c-0.973,1.167-42.303,0.833-43.138,0S-21.624-36.046,0-36.046S22.446,9.167,21.473,10.333z");
	this.body.endFill();


	// feet
	this.footL.clear();
	this.footL.beginFill(0x8aa548);
	renderSVG(this.footL, "M11.858,6.407C12.25,5.625,11.56-6.693-0.078-6.402C-11.715-6.111-12.278,5.876-11.858,6.407S11.858,6.407,11.858,6.407z");
	this.footL.endFill();

	this.footR.clear();
	this.footR.beginFill(0x8aa548);
	renderSVG(this.footR, "M11.858,6.407C12.25,5.625,11.56-6.693-0.078-6.402C-11.715-6.111-12.278,5.876-11.858,6.407S11.858,6.407,11.858,6.407z");
	this.footR.endFill();

	// arms
	this.arms.clear();
	this.arms.beginFill(0x6a689c);
	renderSVG(this.arms, "M52.272-1.429l-22.429,5.81L12.71,8.503c0,0-2.934-0.111-3.997-3.051C7.688,2.612,11,1.587,11,1.587L27.763-2.04l23.888-5.738L52.272-1.429z");
	this.arms.endFill();
	this.arms.beginFill(0x6a689c);
	renderSVG(this.arms, "M-10.174-13.653L-46.25-3.484l30.947,10.988c0,0,3.137,2.161,5.496-0.904c2.278-2.96-1.265-5.428-1.265-5.428c-0.903-0.603-19.149-4.619-19.149-4.619l21.888-4.605L-10.174-13.653z");
	this.arms.endFill();
	this.arms.beginFill(0xb38589);
	renderSVG(this.arms, "M46.73-3.297L44.609-13.81l-9-5.978l1.438-2.165l8.775,5.828c0,0,5.263-8.557,5.741-8.757s2.124,1.447,2.124,1.447l-5.925,8.989l2.141,10.509L46.73-3.297z");
	this.arms.endFill();
	this.arms.lineStyle(4, 0x8aa548);
	this.arms.moveTo(this.bulletPreview.px, this.bulletPreview.py);
	this.arms.lineTo(50, -25);
	this.arms.moveTo(this.bulletPreview.px, this.bulletPreview.py);
	this.arms.lineTo(40, -20);
	this.arms.endFill();

	// debug
	this.debug.clear();
	this.debug.lineStyle(4,0x000000);
	this.debug.drawCircle(0, 0, this.radius);
	this.debug.endFill();
};

Player.prototype.updateLives = function(){
	for(var i = 0; i < this.hearts.length; ++i){
		var heart = this.hearts[i];
		
		heart.clear();
		heart.beginFill(0xFF0000);
		
		if(i < this.lives){
			// draw full hearts for remaining lives
			renderSVG(heart, "M14.438-5.565C14.438,4.454,0,12.576,0,12.576S-14.438,4.454-14.438-5.565C-14.438-15.585,0-16.013,0-7.329C0-16.013,14.438-15.585,14.438-5.565z");
		}else if(i == this.lives){
			// draw broken heart for previously lost life
			renderSVG(heart, "M3.345-14.762C1.413-13.842,0-12.037,0-9.329c0-6.262-7.507-7.784-11.695-4.389C-10.18-11.586-2.486-3.359-0.189-1.342C2.313-3.24,4.718-5.307,7.048-7.486C5.767-9.912,4.604-12.337,3.345-14.762z");
			renderSVG(heart, "M16.507-16.942c-2.341-2.593-6.319-3.174-9.162-1.82c1.259,2.425,2.422,4.851,3.704,7.276C12.917-13.234,14.742-15.05,16.507-16.942z");
			renderSVG(heart, "M16.507-10.942C14.742-9.05,6.313-1.24,3.811,0.658c1.236,1.086,6.37,5.308,7.682,6.35c3.516-3.261,6.946-7.69,6.946-12.573C18.438-7.861,17.675-9.647,16.507-10.942z");
			renderSVG(heart, "M9.582,9.855c-0.629,2.565-1.358,4.916-1.426,7.36c1.432-0.966,3.395-2.406,5.337-4.208C12.181,11.966,10.874,10.917,9.582,9.855z");
			renderSVG(heart, "M-0.189,2.658C-2.834,4.665-5.576,6.497-8.43,8.107C-4.466,12.062,0,14.576,0,14.576s0.861-0.487,2.156-1.361c0.068-2.444,0.797-4.795,1.426-7.36C2.308,4.807,1.047,3.744-0.189,2.658z");
			renderSVG(heart, "M-15.695-11.718c-1.619,1.313-2.743,3.358-2.743,6.152c0,1.229,0.224,2.428,0.605,3.588c2.452-1.005,4.572-2.424,7.063-3.726C-12.523-7.597-14.18-9.586-15.695-11.718z");
			renderSVG(heart, "M-6.189,4.658c-2.297-2.017-4.507-4.121-6.582-6.361c-2.491,1.302-4.611,2.721-7.063,3.726c0.998,3.038,3.114,5.801,5.403,8.084C-11.576,8.497-8.834,6.665-6.189,4.658z");
		}else{
			// don't draw the rest of the lost lives
		}
		
		heart.endFill();

	}
};

Player.prototype.canJump = function(){
	return this.touchingFloor || this.touchingWall || this.doubleJump;
};

Player.prototype.canWallJump = function(){
	return this.touchingWall && !this.touchingFloor;
};

Player.prototype.canDoubleJump = function(){
	return !this.touchingWall && !this.touchingFloor && this.doubleJump;
};

Player.prototype.canShoot = function(){
	return this.shootDelay <= 0 && this.hitDelay <= 0;
};

Player.prototype.isDead = function(){
	return this.lives == 0;
};

Player.prototype.canAct = function(){
	return !this.isDead() && this.hitDelay < Player.hitDelay/2;
};

Player.prototype.calcColliderLines = function(){
	var halfWidth = this.width * 0.5;
	var halfHeight = this.height * 0.5;
	return [
		{x1: this.px + 0 - halfWidth, y1: this.py + 0 - halfHeight, x2: this.px + this.width - halfWidth, y2:this.py + 0 - halfHeight, owner:this, enabled:(this.hitDelay <= 0)},
		{x1: this.px + this.width - halfWidth, y1: this.py + 0 - halfHeight, x2:this.px + this.width - halfWidth, y2:this.py + this.height - halfHeight, owner:this, enabled:(this.hitDelay <= 0)},
		{x1: this.px + this.width - halfWidth, y1: this.py + this.height - halfHeight, x2: this.px + 0 - halfWidth, y2: this.py + this.height - halfHeight, owner:this, enabled:(this.hitDelay <= 0)},
		{x1: this.px + 0 - halfWidth, y1: this.py + this.height - halfHeight, x2: this.px + 0 - halfWidth, y2: this.py + 0 - halfHeight, owner:this, enabled:(this.hitDelay <= 0)},
		{x1: this.px, y1: this.py, x2: this.px + this.vx, y2: this.py + this.vy, owner:this, enabled:(this.hitDelay <= 0)}
	];
};