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
* @param property - name of the property
* @param template (optional) - object that specifies custom getter or setter.
*/
function property(host, property, template) {

	//Make sure host is suitable.
	if(!host.__infection__) {
		host.infect();
	}

	var infection = host.__infection__,
		_property = {
			name: property,
			host: host,
			//
			get: function () { return host[property]; },
			set: function (value) { host[property] = value; },
			watch: function() { },
			//
			history: [],
			onChange: function() { //ToDo: fill out.

			}
		};

	if(template) {

		_property.get = template.get || _property.get;
		_property.set = template.set || _property.get;
		_property.alias = template.id || _property.id;
	}

	host.__infection__.properties[property] = _property;
}

/**
* Allows you to wrap private variables as if they were functions.
* 
* Usage: 
* var x = 5;
* var y = 10;
* eval(obj.privateWrapper(['x', 'y']));
* 
* @param variables - an array of private variables to wrap as properties.
* @returns - a string that should be evaled in the current scope.
*/
function localPropertyCode(variables) {

	var _code = "",
		i,j;

	for(i=0,j=variables.length; i<j; i++){
		_code = _code + 
		"Object.infect.property( this, '" + variables[i] + "', {" +
				"get : function() { " +
					"return " + variables[i] + ";" +
				"}, " +
				"set : function(value) { " +
					variables[i] + " = value;" + 
				"}" +
		" }); ";	
	}

	return _code;
}

function wrapFunction(that) {
	var original, replacement;

	//Non-functions can't be wrapped.
	if(typeof that !== 'function') { return that; }

	original = that;

	//Build function wrapper if it doesn't already exist.
	replacement = original.__wrapper__ || function() {
		var args = Array.prototype.slice.call(arguments),
			toReturn;

		//Start
		helpers.before(replacement.__infection__);

		//Fire
		stack.push(replacement); //push the replacement - toString already works with it, so that's all we care about.
		toReturn = original.apply(this, args);

		//Infect the returned value (in case we're in a factory).
		if(toReturn && toReturn.infect) { 
			toReturn = wrapFunction(toReturn); //Will return original value if not a function.
			toReturn.infect(undefined, undefined); //ToDo: think about whether or not anything ought to be passed in here.
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

	//If this method has also been party to an infection.
	replacement.toString.__infection__ = original.toString.__infection__;

	//Return newly wrapped function.
	return replacement;
}

//----------------------------------------------------------------------------------
//--------------PUBLIC--------------------------------------------------------------
//----------------------------------------------------------------------------------

/**
* SearchObjects can specify stuff to look for.
*/
function search(searchObject) {
	//By default, they return everything.
	//Stuff is filtered out as we go.
	var that = this.that,
		toReturn = [];

	for(var prop in this.properties) {
		//Loop through search object and see if object applies.
		//ToDo: filter these out into rules or something.
		if( !searchObject ||
			(!searchObject.name || prop === searchObject.name) &&
			(!searchObject.value || this.properties[prop].get() === searchObject.value) ) {

			toReturn.push(this.properties[prop]);
		}

		//If the property is infected, recurse.
		if(this.properties[prop].get().__infection__) {
			toReturn = toReturn.concat(search.call(this.properties[prop].get().__infection__, searchObject));
		}
	}

	return toReturn;
}

/**
* Builds and adds infection properties to an object.
* 
* @returns true or false based on whether or not the infection was successful.
**/
function buildInfection(that, host, name) {
	var __infection__;

	if(!that) { return false; } //Base case.


	__infection__ = {
		that: that, //Reference to infected object.
		properties: { //ToDo: construct better properties wrapper.

		},

		//------Methods---------------
		find: search,


		//---------------------------
		__ignore__: true //Infections can not be infected.

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
* @param host = optional parameter of a reference to the owning object.
* @param name = optional name of this object in code.
**/
var globalIgnore = {
	toString : true
};
function infect(host, name) {

	if(!this.__ignore__) {

		if(!this.__infection__) {
			buildInfection(this);
		}

	    for(var p in this) {
	    	if(!globalIgnore[p]) {
		    	var properHost = this;
		        if(!this.hasOwnProperty(p)) {
		        	var properHost = getOrigin(this.__proto__, p);
		        }

				properHost[p] = wrapFunction(properHost[p]); //Will return original object if it's not a function.
				properHost[p].infect(properHost, p);
				properHost.infect.property(properHost, p);
			}
	    }
	}
};

infect.property = infect

function cure() {
	//Cure an object of its infection.
}

function orphan() {
	//var n = orphanage.attach(wrapFunction(this));

	//cure(this); //Should be an option.
	//orphanage[n].infect(orphanage, n);
	var n = wrapFunction(this);
	n.infect();
	return n;
	//return orphanage[n]; //You've got him now, do what you wish.
	//Register it as a private variable that will still be tracked.
};


//---------------------------------------------------------------------------
//-------------------INIT----------------------------------------------------
//---------------------------------------------------------------------------

Object.defineProperty(String.prototype, '__ignore__', {value: true, enumerable:false });
Object.defineProperty(Number.prototype, '__ignore__', {value: true, enumerable:false });
Object.defineProperty(Boolean.prototype, '__ignore__', {value: true, enumerable:false });

Object.defineProperty(Object.prototype, 'infect', {value: infect, enumerable:false });
Object.defineProperty(Object.prototype, 'orphan', {value: orphan, enumerable:false }); //ToDo: this should be refactored to line up with Host concept.
Object.infect.cure = cure;
Object.infect.property = property;
Object.infect.scope_wrap = localPropertyCode;



//
Object.defineProperty(Object.prototype, 'ware', {value: helpers.get, enumerable:false}); //ToDo: move someplace else.


Object.prototype.orphan.__ignore__ = true;
Object.prototype.infect.__ignore__ = true;
Object.prototype.ware.__ignore__ = true;


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
			if(watch.host[watch.name] !== watch.expected) {
				//console.log('property changed: ' + watch.expected + " to " + watch.host[watch.name]);
				if(watch.onChange && typeof watch.onChange === 'function') {
					watch.onChange(watch.expected, watch.host[watch.name]);
				}
				watch.expected = watch.host[watch.name];
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

		var watch = function(property, host, onChange) {
			store.watching[store.watchCount] = {
				'name': property,
				'host': host,
				'expected': host[property],
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

