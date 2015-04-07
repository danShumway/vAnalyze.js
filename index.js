var stack = [];

//ToDo: Helpers should be able to be registered in such a way that they *only* fire off when the function/object they're registered to is called.
//Something like myFunction.helpers.register(.......etc....) vs. Object.helpers.register.... not sure how that would work, needs some thought.
var helpers = (function() {
	var registered = {},
		register = function(name, before, after, constructor) {
			if(typeof before === 'function' && typeof after === 'function' && typeof constructor === 'function') {
				if(!registered[name]) {
					registered[name] = {
						name: name,
						before: before,
						after: after,
						store: {},
					};

					//Init
					registered[name].interface = constructor(registered[name].store);

					return true;
				}
			}

			return false;
		},

		remove = function(name) {
			if(registered[name]) {
				registered[name] = undefined;

				return true;
			}

			return false;
		},

		get = function(name) {
			if(registered[name]) {
				return registered[name].interface;
			}
		}

		before = function(__infection__){
			for(var p in registered) {
				if(registered.hasOwnProperty(p)) {
					registered[p].before(__infection__, registered[p].store);
				}
			}
		},

		after = function(__infection__){
			for(var p in registered) {
				if(registered.hasOwnProperty(p)) {
					registered[p].after(__infection__, registered[p].store);
				}
			}
		};

	return {
		register: register,
		remove: remove,
		before: before,
		after: after,
		get: get,
	};
})();

//You can attach functions in the global scope to here before infecting them.
var orphanage = (function() {
	var orphans = 0;

	return {
		attach: function(method) {
			this[orphans] = method;
			return orphans++;
		}
	}
})();


//------------------------------------------------------------------------
//----------------PRIVATE-------------------------------------------------
//------------------------------------------------------------------------

/**
* Recursively get prototype that a property is attached to.
* @returns the prototype that actually owns the method being called.
**/
function getOrigin(that, property) {
    if(!that) {
        return 'Object';
    }
    if(that.hasOwnProperty(property)) {
        return that;
    }
    return getOrigin(that.__proto__, property); //ToDo: double check that this isn't depreciated.
}

/**
* 
* ToDo: Fill out documentation.
* 
**/
function wrap(that, owner, name) {
	var original, replacement;

	if(!owner || (!name && name !== 0)) { return that; }
	//Don't use hasOwnProperty here since functions can be attached to global context.
	if(owner.hasOwnProperty(name)) {
		original = owner[name];

		//Build function wrapper
		replacement = original.__wrapper__ || function() {
			var args = Array.prototype.slice.call(arguments),
				toReturn;

			//Start
			helpers.before(replacement.__infection__);

			//Fire
			stack.push(original);
			toReturn = original.apply(this, args);

			//Infect the returned value (in case we're in a factory).
			//ToDo:  We don't know the owner?  Isn't the owner whatever method called this one?  
			//Heck, isn't the owner this method?  Might not be the *owner*, but it's certainly the creator.  Are those different?
			//stack.peek or something should be passed in instead of undefined.  We certainly don't know the name though.
			if(toReturn && toReturn.infect) { 
				toReturn.infect(undefined, undefined); 
			};
			//Infect this (in case we're in a Constructor).
			if(this.infect) {
				this.infect(undefined, undefined);
			}
			
			//Finish
			helpers.after(replacement.__infection__);

			stack.pop();

			return toReturn;
		};

		//Set prototype correctly.
		//ToDo: Set Constructor.
		replacement.prototype = original.prototype;

		//If this function was already distributed through code, we might accidentally infect/wrap it again.
		//In that case, what we really want to do is update the function to be using the wrapper we already made.
		Object.defineProperty(original, '__wrapper__', {value: replacement, enumerable:false });

		//Attach properties.
		for(var p in original) {
			if(original.hasOwnProperty(p)) {
				replacement[p] = original[p];
			}
		}

		//Fix toString.
		replacement.toString = function() {
			return original.toString();
		}

		//And attach.
		owner[name] = replacement;
		return replacement;
	}

	return that;
}

//----------------------------------------------------------------------------------
//--------------PUBLIC--------------------------------------------------------------
//----------------------------------------------------------------------------------

/**
* Builds and adds infection properties to an object.
* 
* @returns true or false based on whether or not the infection was successful.
**/
function buildInfection(that, owner, name) {
	var __infection__;

	if(!that) { return false; } //Base case.



	if(typeof that === 'function') {

		//A function that can't be infected will still be registered, it will just have a property on it that says, "we couldn't infect this"
		//ToDo: make that actually be a thing.
		that = wrap(that, owner, name);

		//__infection__.creator
	}

	__infection__ = {
		runs: 0, //How many times it's been called.
		owner: owner, //Object that owns this function.
		calledBy: [], //Other functions that call this one.
		__ignore__: true

	}

	//We use defineProperty to keep our addition from being enumerated on in existing code.
    Object.defineProperty(that, '__infection__', { value : __infection__, enumerable: false});


	return true;
}

/**
* Loop through any created object and get all methods attached to it.
* If I run into an attached property (through a prototype) that I've already seen or stored elsewhere,
* that should be a dead giveaway that the 'elsewhere' is a prototype of this object.
* ToDo: This method should take an options object, not a set of parameters.
* 
* @param owner = optional parameter of a reference to the owning object.
* @param name = optional name of this object in code.
**/
function infect(owner, name) {

	if(!this.__infection__ && !this.__ignore__) {

		//console.log('Infecting ' + name + "(" + typeof this + "): " + " from " + owner);
		buildInfection(this, owner, name);

	    for(var p in this) {
	        if(this.hasOwnProperty(p)) {
				this[p].infect(this, p);
	        } else {
	            this[p].infect(getOrigin(this.__proto__, p), p);
	        }
	    }
	}
};

function cure(obj) {
	//Cure an object of its infection.
}

function orphan() {
	var n = orphanage.attach(this);

	cure(this); //Should be an option.
	this.infect(orphanage, n);

	return orphanage[n]; //You've got him now, do what you wish.
	//Register it as a private variable that will still be tracked.
};


//---------------------------------------------------------------------------
//-------------------INIT----------------------------------------------------
//---------------------------------------------------------------------------

Object.defineProperty(String.prototype, '__ignore__', {value: true, enumerable:false });
Object.defineProperty(Number.prototype, '__ignore__', {value: true, enumerable:false });
Object.defineProperty(Boolean.prototype, '__ignore__', {value: true, enumerable:false });

Object.defineProperty(Object.prototype, 'infect', {value: infect, enumerable:false });
Object.defineProperty(Object.prototype, 'orphan', {value: orphan, enumerable:false });
Object.defineProperty(Object.prototype, 'ware', {value: helpers.get, enumerable:false});

Object.prototype.orphan.__ignore__ = true;
Object.prototype.infect.__ignore__ = true;


//-------------Register some base helpers----------------------
//--- This should be encapsulated in some way.

helpers.register('test', 
	function(__infection__, store) {
		store.callCount++;

		if(!__infection__.test) {
			__infection__.test = {};
			__infection__.test.callCount = 0;
		}

		__infection__.test.callCount++;
	}, 
	function(__infection__, store) {
		
	},
	function(store) {
		store.callCount = 0;

		return {
			getCallCount: function() {
				return {
					total: store.callCount,
					local: (this.__infection__ && this.__infection__.test) ? 
						this.__infection__.test.callCount : NaN
				}
			},
		};
	});




function detectChange(store) {
	var watch;
	for(var v in store.watching) {
		if(store.watching.hasOwnProperty(v)) {
			watch = store.watching[v];
			if(watch.owner[watch.name] !== watch.expected) {
				//console.log('property changed: ' + watch.expected + " to " + watch.owner[watch.name]);
				if(watch.onChange && typeof watch.onChange === 'function') {
					watch.onChange(watch.expected, watch.owner[watch.name]);
				}
				watch.expected = watch.owner[watch.name];
			}
		}
	}
}

helpers.register('tracker',
	function(__infection__, store) {
		//console.log(store);
		detectChange(store);
	}, 
	function(__infection__, store) {
		detectChange(store);
	},
	function(store) {
		store.that = this;
		store.watching = {};
		store.watchCount = 0;

		var watch = function(property, owner, onChange) {
			store.watching[store.watchCount] = {
				'name': property,
				'owner': owner,
				'expected': owner[property],
				'onChange': onChange
			};
			return store.watchCount++;
		},
		ignore = function(id) {
			if(store.watching.hasOwnProperty(id)) {
				store.watching[id] = undefined;
			}
		};

		return {
			watch: watch,
			ignore: ignore,
		};

	});



//----------------------------------------------------------------

/*var Constructor = function() {
	this.name = "Jeremy";

	this.getModdedName = function(last) {
		return this.name + " " + last;
	}
}

Constructor.prototype.setName = function(name) {
	this.name = name;
}

Constructor.prototype.methodChain = function(name) {
	this.methodChainMonitor();
}
Constructor.prototype.methodChainMonitor = function(name) {
	for(var i = 0; i < stack.length; i++) {
		console.log("stack["+i+"]: " + stack[i]);
	}
	this.setName('Arnold');
}

Constructor = Constructor.orphan();
var guy = new Constructor();
//guy.infect(undefined, 'guy');
//console.log(guy.getModdedName.toString());

console.log(guy.name);
console.log(guy.getModdedName('Guy'));

guy.ware('tracker').watch('name', guy, function(expected, recieved) {
	console.log(expected + "'s name changed to " + recieved);
})
guy.setName('Carl');
console.log(guy.getModdedName('Guy'));

guy.methodChain();*/

/*
var test = {
	entities = [];
};

test.addEntity = function() {
	test.entities.push(new Entity()); //Will not be detected.
}*/

/*for(var v in guy) {
	console.log(v + ": " + guy[v]);
}*/
//guy.methodChain();
