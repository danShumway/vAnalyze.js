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
* Allows you to wrap private variables as if they were properties.
* 
* Usage: 
* var x = 5;
* var y = 10;
* eval(obj.infect.local(['x', 'y']));
* 
* @param variables - an array of private variables to wrap as properties.
* @returns - a string that should be evaled in the current scope.
*/
function localPropertyCode(variables) {

	var _code = "",
		i,j;

	for(i=0,j=variables.length; i<j; i++){
		_code = _code + 
		"Object.infect.prop.call(this, '" + variables[i] + "', {" +
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

function cure() {
	//Cure an object of its infection.
}


//---------------------------------------------------------------------------
//-------------------INIT----------------------------------------------------
//---------------------------------------------------------------------------

Object.infect.cure = cure;
Object.infect.property = property;
Object.infect.scope_wrap = localPropertyCode;



//
Object.defineProperty(Object.prototype, 'ware', {value: helpers.get, enumerable:false}); //ToDo: move someplace else.

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

