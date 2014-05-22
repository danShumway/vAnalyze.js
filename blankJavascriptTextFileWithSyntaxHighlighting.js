

1: function (name) {  native function NativeIsSearchProviderInstalled();  return NativeIsSearchProviderInstalled(name);}

1: function Bug(xpos, ypos, rad, sped) {

			//you can actually make bugs without specifying any variables.  
			//I don't think it's used anywhere in our current code, but it was pretty essential at some point in development.
			if(!xpos)
			{
				this.x = Math.random()*canvas.width; //Position
				this.y = Math.random()*canvas.height;
				this.radius = 4; //Size (also maturity)
				this.speed = 30; //Speed is speed.
			}
			else
			{
				this.x = xpos;
				this.y = ypos;
				this.radius = rad;
				this.speed = sped;
			}

			//The other variables.
			this.alive = true; //Bugs can be corpses.
			this.direction = Math.random()*360; //Where are you facing?
			this.lastDirectionChange = 0; //How long have you been facing there.
			this.removeMe = false; //Do you want to not exist anymore (different than dying)
			this.growthMultiplier = Math.random(); //Bugs grow at different rates.
			this.lifeSpan = Math.random() * 50; //Bugs have predestined lifespans, but those lifespans can be cut short.
			this.pregnant = 0; //Are you pregnant?  How many babies do you have inside you?
			this.pregnantCount = 0; //How long until give birth to one of the (more than zero) babies in pregnantCount?
			this.poisoned = 0; //Are you poisoned?  How posioned on a scale of 0 to infinity?
			this.colony = 0; //Not used.  In the theoretical future, ants could belong to a colony.
			this.quad; //What node of the quadtree are you in?
			this.decomposeTimer = 0; //how long has the corpse been decomposing
			this.lastCollision;

			//Accessors for variables. 


			//Setters.
			
			//make this ant toxic
			this.poisonMe = function() { this.poisoned += 1; }
			
			//kill off this ant
			this.kill = function(){ this.alive = false; }



			//update code.
			this.update = function() {

				//Living code.
				if(this.alive) {
					//Movement
					//x += (Math.random() * 30 - 15) * dt;
					//y += (Math.random() * 30 - 15) * dt;

					//Choose a direction
					this.lastDirectionChange = this.lastDirectionChange - 20 * dt;
					if( this.lastDirectionChange <= 0 ) 
					{
						this.direction = this.direction + (Math.random()*44 - 22);
						this.lastDirectionChange = Math.random()* 20 + 10;
					}

					this.x += this.speed * dt * Math.cos(this.direction);
					this.y += this.speed * dt * Math.sin(this.direction);
					
					//wrap around edges
					this.checkBoundaries();
					
					//Grow as you age.
					if(this.lifeSpan > 0)
					{
						this.radius += .15 * dt * this.growthMultiplier;
						this.lifeSpan -= 1 * dt * this.growthMultiplier;
						this.speed += 1 * dt * this.growthMultiplier;
					}
					else
					{
						this.alive = false;
					}

					//If you're poisoned, you gunna have trouble.
					this.lifeSpan -= 2 * this.poisoned * dt;
					this.speed -= 1 * this.poisoned * dt;

					//If you're pregnant, maybe you'll give birth
					if(this.pregnant > 0)
					{
						if(Math.random()*700 > 690) this.giveBirth();
					}

				} else {
					//Dead ants just sort of sit around for a bit
					//Will decompose over time and rot themselves off the canvas
					
						
					
					
				}


			}
			
			//The bugs will wrap themselves within the dimensions of the canvas
			this.checkBoundaries = function()
			{
				if (this.x < 0)
					{
						this.x = canvas.width;
					}
					
				if (this.x > canvas.width)
				{
					this.x = 0;
				}
				
				if (this.y < 0)
				{
					this.y = canvas.height;
				}
				
				if (this.y > canvas.height)
				{
					this.y = 0;
				}
			}
			//draw code.
			this.draw = function() {
				ctx.beginPath();

				//If you're supposed to be showing a color.
				if(window.showColor == true)
				{
					//If you're alive.
					if(this.alive) 
					{
						//And a child
						if(this.radius < 4) 
							//And poisoned
							if(this.poisoned > 0) 
								ctx.fillStyle = "orange";
								
							//Or a living child that's not poisoned.
							else
								ctx.fillStyle = "red";
						else
						{
							//Or alive adult pregnant
							if(this.pregnant > 0) 
								//poisoned
								if (this.poisoned > 0)
									ctx.fillStyle = "purple";
									
								//not poisoned
								else 
									ctx.fillStyle = "blue";
									
							//alive adult not pregnant poisoned
							else 
								if(this.poisoned > 0)
									ctx.fillStyle = "green";
									
								//alive adult not pregnant not poisoned
								else 
								ctx.fillStyle = "black";
						}
					}
					else 
					{	//Dead and poisoned
						if(this.poisoned > 0)
							ctx.fillStyle = "silver"
						//Dead and just dead.
						else 
							ctx.fillStyle = "gray";
					}
				}
				else //If you're not supposed to be showing a color, just draw black.
				{
					ctx.fillStyle = "black";
				}
				ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI, true);
				ctx.fill();
			}


			//Check to see if two bugs are colliding.  Uses squares.
			this.checkCollision = function(object1, object2) {

				var xdistance = Math.abs(object1.x - object2.x);
				var ydistance = Math.abs(object1.y - object2.y);
				//get the two origins.  If one of them is within distance of the other one.
				if(
					//x collision.
					xdistance < (object2.radius + object1.radius) &&
					//y collision.
					ydistance < (object2.radius + object1.radius)
				){

					//Collision happened.
					//console.log(object1 === object2);
					 //console.log((object1.x - object2.x) + " " + (object1.radius - object2.radius));
					return true;
				}
				//Collision didn't happen.
				return false;
			}

			//Does a collision.
			this.doCollision = function(object)
			{
				this.lastCollision = object;
				if(this.alive)
				{
					//If it's a dead body
					if(object.alive == false)
					{

						//If you're big enough to eat it.
						if(this.radius - object.radius >= -1) {
							object.getEaten(this);
							//If you're still growing
							if(this.radius < 4)
							{
								this.radius += object.radius / 5;
								this.speed += object.radius / 7;
							}
						}
						else
						{
							//Feed off it.
							object.radius = object.radius - (this.radius/2 * dt);
							//If you're still growing
							if(this.radius < 4)
							{
								this.radius += object.radius / 10 * dt;
							}
						}

					}
					//Eat each other too as a child.  It's the best way to grow.
					//Once you become an adult (radius 4), you won't get to eat your siblings, unless they're dead.
					else if(object.radius < this.radius && this.radius <= 4)
					{
						object.getEaten(this);
						this.radius += object.radius / 5;
						this.speed += object.radius / 7;
					}
					//If you run into a parent, try and kill it if you're able.
					else if(object.radius > this.radius + .5 && this.radius > 1 && this.radius < 4)
					{
						//Attempt to poison it.
						if(Math.random()*700 > 698) object.poisonMe();
					}

					//Attempt to reproduce if you've hit something that's alive.  
					//Bugs need to be a certain age before they can reproduce.
					//A bug that's already pregnant can't get pregant again until they've had all their births.
					if(object.alive && this.radius >= 4 && object.radius >= 4 && this.pregnant == 0)
					{
						//The parent gets pregnant.
						this.pregnant = this.radius;
						this.radius += 1;
						this.speed -= 2;

						//If an ant has gotten pregnant too many times in a row, it will probably produce diseased children (population control)
						this.pregnantCount ++ ;
						//Not implemented, but that was the intention anyway.
					}

				}
			}


			//Have a baby bug.
			this.giveBirth = function()
			{
				var distance;
				for(var i = 0; i < 2; i++)
				{
					distance = Math.random()*(this.radius + 1)*4 - (this.radius + 1)*2;
					bugs.push(new Bug(this.x + distance, this.y + distance, this.radius/4, 2));
					quadTree.top.pushIn(bugs[bugs.length - 1]);
					//poisoned bugs give birth to stillborns.
					if(this.poisoned > 0)
						bugs[bugs.length - 1].kill();
						//If the parent is really poisoned, it's babies become toxic.
						if(this.poisoned > 2)
							bugs[bugs.length - 1].poisonMe();
				}
				this.pregnant --;
			}

			//Get eaten by another bug.
			this.getEaten = function(object)
			{
				//If you're poisoned.
				if(this.poisoned > 1)
					//The eater has a chance to be poisoned also.
					if(Math.random() * this.poisoned > .3) object.poisonMe();
				this.removeMe = true;
			}
		}

		1: function setup(){


			bugs = [];

			for(var i = 0; i < 70; i++)
			{
				bugs[i] = new Bug((canvas.width/2 - 50) + Math.random()*100, (canvas.height/2 - 50) + Math.random()*100, 1, 2);
				//quadTree.top.push(bugs[i]);
			}

		}

		1: function update()
		{

			//draw code is integrated to reduce the effects of slowdown.
			ctx.clearRect(0,0, canvas.width, canvas.height);

			if(bugToTrack != undefined)
			{
				collidingWidth = bugToTrack.quad.bugs;
				ctx.beginPath();
				ctx.fillStyle = "orange";
				ctx.arc(bugToTrack.x, bugToTrack.y, bugToTrack.radius + 3, 0, 2*Math.PI, true);
				ctx.fill();

				if(bugToTrack.lastCollision != undefined)
				{
					ctx.beginPath();
				ctx.fillStyle = "orange";
				ctx.arc(bugToTrack.lastCollision.x, bugToTrack.lastCollision.y, bugToTrack.lastCollision.radius + 6, 0, 2*Math.PI, true);
				ctx.fill();
				}

				for(i = 0; i < collidingWidth.length; i++)
				{
					if(collidingWidth[i] !== bugToTrack)
					{
						ctx.beginPath();
						ctx.fillStyle = "brown";
						ctx.arc(collidingWidth[i].x, collidingWidth[i].y, collidingWidth[i].radius + 3, 0, 2*Math.PI, true);
						ctx.fill();
					}
				}
			}


			//Get time since last update.
			date = new Date();
			dt = (date.getTime() - lastupdate)/1000;
			lastupdate = date.getTime();

			//More display code.
			if(showquad)
				quadTree.top.draw();


			quadTree.top.clear(); //Clear out the old quad tree.
			//update bugs.
			for(var i = 0; i < bugs.length; i++) {
				quadTree.top.pushIn(bugs[i]); //Super inefficient.  It just clears out the quad tree then re-adds everything to make sure each bug is in the right quad.  This is a terrible algorithm and I am very sorry to have written it.
			}
			//Now do the actual update.
			for (i = 0; i < bugs.length; i++) {

				bugs[i].update(); //update the bug.
				bugs[i].draw(); //draw the bug.


				//Only do collision detection if you're alive and care about collision detection.
				if(bugs[i].alive & bugs[i].quad != undefined)
				{
					var toCheck = bugs[i].quad.bugs;
					for(var j = 0; j < toCheck.length; j++)
					{
						//Self collision should never be happening.
						if(bugs[i] != toCheck[j])
						{
							if(bugs[i].checkCollision(bugs[i], toCheck[j]))
							{
								//alert('collision happenning right now');
								bugs[i].doCollision(toCheck[j]);
							}
						}
					}
				}

				//Get rid of bugs that shouldn't be there (they were eaten.)
				if(bugs[i].removeMe)
				{
					bugs.splice(i, 1);
					i--;
				}
			}

			window.requestAnimationFrame(update);
		}

		1: function poisonEverything(){
			for(var i = 0; i < bugs.length; i++)
			{
				if(bugs[i].alive)
					bugs[i].poisonMe();
			}
		}

		1: function (name) {  native function NativeAddSearchProvider();  NativeAddSearchProvider(name);}

		1: function init(){


			canvas = document.querySelector("#canvas");
			ctx = canvas.getContext("2d");
			
			var cWidth = canvas.parentNode.clientWidth;
			var cHeight = canvas.parentNode.clientHeight;

			showColor = document.getElementById("showColor").checked;
			showquad = document.getElementById("showquad").checked;
			
			setup();

			date = new Date();
			lastupdate = date.getTime();
			
			update();
			//redraw(); //not used here.

		}

		1: function () {  native function GetLoadTimes();  return GetLoadTimes();}

		1: function () {  native function GetCSI();  return GetCSI();}

		1: function getInstallState(callback) {
  var callbackId = nextCallbackId++;
  callbacks[callbackId] = callback;
  appNatives.GetInstallState(callbackId);
}

1: function install(url, onSuccess, onFailure) {
    installer.install(url, onSuccess, onFailure);
  }

  1: function Bugquad()
{

	//The top section (the size of the entire screen.)
	this.top = new Node(0, 0, 1000, 600, 0);


	//Begin Node constructor.
	function Node(x, y, width, height, depth)
	{
		//Normal stuff.  A node is essentially a square space.
		this.x = x;
		this.y = y;
		this.Width = width;
		this.Height = height;
		this.Depth = depth;

		this.children = [];

		//Some of the more hacky bits.  It's terrible practice, but the quad tree's children never go away.
		//you'll always have a full quad tree, even if there's nothing inside of it.
		if(this.Depth < 5)
		{
			for(var i = 0; i < 4; i++)
			{
				//Make the quads.
				this.children.push( new Node(this.x + (i%2)*this.Width/2, this.y + Math.floor(i/2) * this.Height/2, this.Width/2, this.Height/2, this.Depth + 1));

			}
		}
		else
		{
			//If you're at max depth, stop making children.
			for(var i = 0; i < 4; i++)
			{
				this.children.push(undefined);
			}
		}

		this.bugs = [];


		//draw function - used for visualization.
		this.draw = function()
		{
			ctx.strokeStyle = 'rgb(' + this.Depth*40 +',100,100)';
			if(this.bugs.length != 0)
			{
				ctx.strokeRect(this.x, this.y, this.Width, this.Height);
			}
			//debugger;

			for(var i = 0; i < 4; i++)
			{
				if(this.children[i] != undefined)
				{
					this.children[i].draw();
				}
			}
		} //End draw


		//Resets the tree.  Another hacky solution.
		this.clear = function()
		{
			this.bugs = [];
			for(var i = 0; i < 4; i++)
			{
				if(this.children[i] != undefined)
				{
					this.children[i].clear();
				}
			}
		}

		this.deleteBug = function(bug)
		{
			//A bug should only be added to a quad once.
			//I'm going to assume that is true, and break as soon as I find the correct bug.
			for(var i = 0; i < this.children.length; i++)
			{
				if( this.children[i] === bug)
				{
					this.children.splice(i, 1);
					return true; //Successfully removed.
				}
			}
			//element did not exist.
			return false;
		}

		//Push a bug into a quad.
		this.pushIn = function(bug)
		{
			//Keep it in the above.
			this.bugs.push(bug);
			if(this.isContained(bug))
			{
				bug.quad = this;
			}
			//Check to see if it could be put into a child.
			for(var i = 0; i < 4; i++) //Try and add it to the children first.
			{
				if(this.children[i] != undefined)
				{
					if(this.children[i].overlaps(bug))
					{
						this.children[i].pushIn(bug);
					}
				}
			}
		}


		//Push a bug into a quad.
		this.pushOld = function(bug)
		{
			//Check to see if it could be put into a child.
			var added = false;
			for(var i = 0; i < 4; i++) //Try and add it to the children first.
			{
				if(this.children[i] != undefined)
				{
					if(this.children[i].isContained(bug))
					{
						this.children[i].push(bug);
						added = true;
					}
					else if(this.children[i].overlaps(bug))
					{
						//You still might collide with those areas, so you still need to be added.
						this.children[i].push(bug);
					}
				}
			}

			//Didn't work?  Well, it still belongs to you.
			if(!added)
			{
				this.bugs.push(bug);
				bug.setquad(this);
				//console.log(this.bugs.length);
			}
		}

		//Check to see if a bug is in a quad.
		this.isContained = function(bug)
		{
			//If it's within the boundaries of the quad, return true.
			if(bug.x > this.x
				&& bug.y > this.y
				&& bug.x + bug.radius < this.x + this.Width
				&& bug.y + bug.radius < this.y + this.Height)
			{
				return true;
			}
			return false;
		}

		//A bug might not be contained in its children, but does it overlap with its children?
		this.overlaps = function(bug)
		{
			var xdistance = Math.abs(bug.x - (this.x + this.Width/2));
			var ydistance = Math.abs(bug.y - (this.y + this.Height/2));
			//get the two origins.  If one of them is within distance of the other one.
			if(
				//x collision.
				xdistance < this.Width/2 + bug.radius/*Math.max(this.width, bug.radius)*/ &&
				//y collision.
				ydistance < this.Height/2 + bug.radius/*Math.max(this.height, bug.radius)*/
			){
				//Collision happened
				return true;
			}
			//Collision didn't happen.
			return false;
		}

		this.getCollisionsToCheck = function()
		{
			//Not sure if this is the most efficient way to do this.  I should run some tests on concat.
			var toReturn = this.bugs;
			for(var i = 0; i < 4; i++)
			{
				if(this.children[i] != undefined)
				{
					toReturn = toReturn.concat(this.children[i].getCollisionsToCheck());
					//temp = toReturn;
				}
			}

			return toReturn;
		}

		this.getCollisionsToCheckNumber = function()
		{
			//Not sure if this is the most efficient way to do this.  I should run some tests on concat.
			var toReturn = this.bugs;
			for(var i = 0; i < 4; i++)
			{
				if(this.children[i] != undefined)
				{
					toReturn = toReturn.concat(this.children[i].getCollisionsToCheck());
										//temp = toReturn;
				}
			}

			return toReturn.length;
		}

	}//End Node
}"

1: function ()
		{
			//Not sure if this is the most efficient way to do this.  I should run some tests on concat.
			var toReturn = this.bugs;
			for(var i = 0; i < 4; i++)
			{
				if(this.children[i] != undefined)
				{
					toReturn = toReturn.concat(this.children[i].getCollisionsToCheck());
					//temp = toReturn;
				}
			}

			return toReturn;
		}"

		1: function (bug)
		{
			var xdistance = Math.abs(bug.x - (this.x + this.Width/2));
			var ydistance = Math.abs(bug.y - (this.y + this.Height/2));
			//get the two origins.  If one of them is within distance of the other one.
			if(
				//x collision.
				xdistance < this.Width/2 + bug.radius/*Math.max(this.width, bug.radius)*/ &&
				//y collision.
				ydistance < this.Height/2 + bug.radius/*Math.max(this.height, bug.radius)*/
			){
				//Collision happened
				return true;
			}
			//Collision didn't happen.
			return false;
		}"

		1: function (bug)
		{
			//If it's within the boundaries of the quad, return true.
			if(bug.x > this.x
				&& bug.y > this.y
				&& bug.x + bug.radius < this.x + this.Width
				&& bug.y + bug.radius < this.y + this.Height)
			{
				return true;
			}
			return false;
		}"

		1: function ()
		{
			//Not sure if this is the most efficient way to do this.  I should run some tests on concat.
			var toReturn = this.bugs;
			for(var i = 0; i < 4; i++)
			{
				if(this.children[i] != undefined)
				{
					toReturn = toReturn.concat(this.children[i].getCollisionsToCheck());
										//temp = toReturn;
				}
			}

			return toReturn.length;
		}"

		1: function (bug)
		{
			//Check to see if it could be put into a child.
			var added = false;
			for(var i = 0; i < 4; i++) //Try and add it to the children first.
			{
				if(this.children[i] != undefined)
				{
					if(this.children[i].isContained(bug))
					{
						this.children[i].push(bug);
						added = true;
					}
					else if(this.children[i].overlaps(bug))
					{
						//You still might collide with those areas, so you still need to be added.
						this.children[i].push(bug);
					}
				}
			}

			//Didn't work?  Well, it still belongs to you.
			if(!added)
			{
				this.bugs.push(bug);
				bug.setquad(this);
				//console.log(this.bugs.length);
			}
		}"

		1: function (bug)
		{
			//Keep it in the above.
			this.bugs.push(bug);
			if(this.isContained(bug))
			{
				bug.quad = this;
			}
			//Check to see if it could be put into a child.
			for(var i = 0; i < 4; i++) //Try and add it to the children first.
			{
				if(this.children[i] != undefined)
				{
					if(this.children[i].overlaps(bug))
					{
						this.children[i].pushIn(bug);
					}
				}
			}
		}"

		1: function (bug)
		{
			//A bug should only be added to a quad once.
			//I'm going to assume that is true, and break as soon as I find the correct bug.
			for(var i = 0; i < this.children.length; i++)
			{
				if( this.children[i] === bug)
				{
					this.children.splice(i, 1);
					return true; //Successfully removed.
				}
			}
			//element did not exist.
			return false;
		}"

		1: function ()
		{
			this.bugs = [];
			for(var i = 0; i < 4; i++)
			{
				if(this.children[i] != undefined)
				{
					this.children[i].clear();
				}
			}
		}"

		1: function ()
		{
			ctx.strokeStyle = 'rgb(' + this.Depth*40 +',100,100)';
			if(this.bugs.length != 0)
			{
				ctx.strokeRect(this.x, this.y, this.Width, this.Height);
			}
			//debugger;

			for(var i = 0; i < 4; i++)
			{
				if(this.children[i] != undefined)
				{
					this.children[i].draw();
				}
			}
		}"

		8: function (object)
			{
				//If you're poisoned.
				if(this.poisoned > 1)
					//The eater has a chance to be poisoned also.
					if(Math.random() * this.poisoned > .3) object.poisonMe();
				this.removeMe = true;
			}"

			8: function ()
			{
				var distance;
				for(var i = 0; i < 2; i++)
				{
					distance = Math.random()*(this.radius + 1)*4 - (this.radius + 1)*2;
					bugs.push(new Bug(this.x + distance, this.y + distance, this.radius/4, 2));
					quadTree.top.pushIn(bugs[bugs.length - 1]);
					//poisoned bugs give birth to stillborns.
					if(this.poisoned > 0)
						bugs[bugs.length - 1].kill();
						//If the parent is really poisoned, it's babies become toxic.
						if(this.poisoned > 2)
							bugs[bugs.length - 1].poisonMe();
				}
				this.pregnant --;
			}"

			8: function (object)
			{
				this.lastCollision = object;
				if(this.alive)
				{
					//If it's a dead body
					if(object.alive == false)
					{

						//If you're big enough to eat it.
						if(this.radius - object.radius >= -1) {
							object.getEaten(this);
							//If you're still growing
							if(this.radius < 4)
							{
								this.radius += object.radius / 5;
								this.speed += object.radius / 7;
							}
						}
						else
						{
							//Feed off it.
							object.radius = object.radius - (this.radius/2 * dt);
							//If you're still growing
							if(this.radius < 4)
							{
								this.radius += object.radius / 10 * dt;
							}
						}

					}
					//Eat each other too as a child.  It's the best way to grow.
					//Once you become an adult (radius 4), you won't get to eat your siblings, unless they're dead.
					else if(object.radius < this.radius && this.radius <= 4)
					{
						object.getEaten(this);
						this.radius += object.radius / 5;
						this.speed += object.radius / 7;
					}
					//If you run into a parent, try and kill it if you're able.
					else if(object.radius > this.radius + .5 && this.radius > 1 && this.radius < 4)
					{
						//Attempt to poison it.
						if(Math.random()*700 > 698) object.poisonMe();
					}

					//Attempt to reproduce if you've hit something that's alive.  
					//Bugs need to be a certain age before they can reproduce.
					//A bug that's already pregnant can't get pregant again until they've had all their births.
					if(object.alive && this.radius >= 4 && object.radius >= 4 && this.pregnant == 0)
					{
						//The parent gets pregnant.
						this.pregnant = this.radius;
						this.radius += 1;
						this.speed -= 2;

						//If an ant has gotten pregnant too many times in a row, it will probably produce diseased children (population control)
						this.pregnantCount ++ ;
						//Not implemented, but that was the intention anyway.
					}

				}
			}"

			8: function (object1, object2) {

				var xdistance = Math.abs(object1.x - object2.x);
				var ydistance = Math.abs(object1.y - object2.y);
				//get the two origins.  If one of them is within distance of the other one.
				if(
					//x collision.
					xdistance < (object2.radius + object1.radius) &&
					//y collision.
					ydistance < (object2.radius + object1.radius)
				){

					//Collision happened.
					//console.log(object1 === object2);
					 //console.log((object1.x - object2.x) + " " + (object1.radius - object2.radius));
					return true;
				}
				//Collision didn't happen.
				return false;
			}"

			8: function () {
				ctx.beginPath();

				//If you're supposed to be showing a color.
				if(window.showColor == true)
				{
					//If you're alive.
					if(this.alive) 
					{
						//And a child
						if(this.radius < 4) 
							//And poisoned
							if(this.poisoned > 0) 
								ctx.fillStyle = "orange";
								
							//Or a living child that's not poisoned.
							else
								ctx.fillStyle = "red";
						else
						{
							//Or alive adult pregnant
							if(this.pregnant > 0) 
								//poisoned
								if (this.poisoned > 0)
									ctx.fillStyle = "purple";
									
								//not poisoned
								else 
									ctx.fillStyle = "blue";
									
							//alive adult not pregnant poisoned
							else 
								if(this.poisoned > 0)
									ctx.fillStyle = "green";
									
								//alive adult not pregnant not poisoned
								else 
								ctx.fillStyle = "black";
						}
					}
					else 
					{	//Dead and poisoned
						if(this.poisoned > 0)
							ctx.fillStyle = "silver"
						//Dead and just dead.
						else 
							ctx.fillStyle = "gray";
					}
				}
				else //If you're not supposed to be showing a color, just draw black.
				{
					ctx.fillStyle = "black";
				}
				ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI, true);
				ctx.fill();
			}"

			8: function () {

				//Living code.
				if(this.alive) {
					//Movement
					//x += (Math.random() * 30 - 15) * dt;
					//y += (Math.random() * 30 - 15) * dt;

					//Choose a direction
					this.lastDirectionChange = this.lastDirectionChange - 20 * dt;
					if( this.lastDirectionChange <= 0 ) 
					{
						this.direction = this.direction + (Math.random()*44 - 22);
						this.lastDirectionChange = Math.random()* 20 + 10;
					}

					this.x += this.speed * dt * Math.cos(this.direction);
					this.y += this.speed * dt * Math.sin(this.direction);
					
					//wrap around edges
					this.checkBoundaries();
					
					//Grow as you age.
					if(this.lifeSpan > 0)
					{
						this.radius += .15 * dt * this.growthMultiplier;
						this.lifeSpan -= 1 * dt * this.growthMultiplier;
						this.speed += 1 * dt * this.growthMultiplier;
					}
					else
					{
						this.alive = false;
					}

					//If you're poisoned, you gunna have trouble.
					this.lifeSpan -= 2 * this.poisoned * dt;
					this.speed -= 1 * this.poisoned * dt;

					//If you're pregnant, maybe you'll give birth
					if(this.pregnant > 0)
					{
						if(Math.random()*700 > 690) this.giveBirth();
					}

				} else {
					//Dead ants just sort of sit around for a bit
					//Will decompose over time and rot themselves off the canvas
					
						
					
					
				}


			}"

			8: function (){ this.alive = false; }"

			8: function () { this.poisoned += 1; }"

			8: function ()
			{
				if (this.x < 0)
					{
						this.x = canvas.width;
					}
					
				if (this.x > canvas.width)
				{
					this.x = 0;
				}
				
				if (this.y < 0)
				{
					this.y = canvas.height;
				}
				
				if (this.y > canvas.height)
				{
					this.y = 0;
				}
			}"]