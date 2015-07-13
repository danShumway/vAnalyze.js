
(function() {
	'use strict';

	var __vAnalyze__ = {
		//Attach capabilities here
		infectionMap : new WeakMap()
	};

	Object.defineProperty(Object.prototype, '__vAnalyze__', { 
		value : __vAnalyze__,
		enumerable:false
	});

	//Wrapper around native methods that might otherwise mess us up.
	Object.getPrototypeOf = function(obj) {
	    return obj.__proto__;
	};
	Object.setPrototypeOf = function(obj, value) {
	    obj.__proto__ = value;
	};

}());
/**
 * Real-time code analysis and debugging, accessible both within code and from the console.
 *
 * @module vAnalyze
 * @class Object
 */
(function() {
    'use strict';

    //-----------HELPERS----------------

    function isObject(obj) {
        return obj instanceof Object; //TODO: Better checks in the future.
    }

    //Purely for convenience
    function prop(obj, prop, value) {
        Object.defineProperty(obj, prop, { value: value, enumerable:false});
    }

    /*
     * Recursively get prototype that a property is attached to.
     * @returns the prototype that actually owns the method being called.
     * @method getOrigin
     **/
    function getOrigin(that, property) {
        if(!that) {
            return 'Object'; //TODO: why is this here?
        }
        if(that.hasOwnProperty(property)) {
            return that;
        }
        return getOrigin(that.__proto__, property); //ToDo: double check that this isn't depreciated.
    }

    function proxyMethods(host, infection) {
        return {
            //Just forward these
            //Skipped: getPrototypeOf, setPrototypeOf (we handle these elsewhere)
            isExtensible : function() {
                return Object.isExtensible(host);
            },
            preventExtensions : function() {
                return Object.preventExtensions(host);
            },
            getOwnPropertyDescriptor : function(target, name) {

                //Fix because we define __proto__ as a property
                if(name === '__proto__') { return undefined; }

                var descriptor = Object.getOwnPropertyDescriptor(host, name);
                if(!(name in target)) {
                    Object.defineProperty(target, name, descriptor);
                }

                return descriptor;
            },
            defineProperty : function(target, name, descriptor) {
                return Object.defineProperty(host, name, descriptor);
            },
            delete : function(target, name) {
                return delete host[name];
            },
            enumerate : function(target) {
                return Object.keys(host)[Symbol.iterator]();
            },
            ownKeys : function(target) {
                return Object.getOwnPropertyNames(host);
            },
            has : function(target, prop) {
                return prop in host;
            },
            construct : function(target, args) {
                var base = {};
                host.apply(base, args);
                return base;
            },

            //Actual interesting bits
            get : function(target, name, receiver) {
                //If the property has been set on the host, copy it to the infection.
                if(host.hasOwnProperty(name)) {
                    infection[name] = host[name]; //TODO: It's likely unnecessary to copy this.
                    return host[name];
                //Otherwise just return
                } else {
                    return infection[name];
                }
            },
            set : function(target, name, value, setter) {
                console.log('set: ', name);
                //Set property on both targets.
                infection[name] = value; //TODO: it's likely unnecessary to set this.
                host[name] = value;
            },
            apply : function(target, that, args) {
                var result;

                Object.__vAnalyze__.stack.push({
                    args: args,
                    that : that,
                    method : host,
                    result : undefined
                });
                result = Object.infect(host.apply(that, args)); //Call method and infect returned value.
                Object.__vAnalyze__.stack.resolve(result);
                return result;
            }

        }
    }

    //----------CREATION-------

    function buildInfection(host, options) {
        var infection, proxy;

        //If undefined/primitive, return dummy infection.
        if(!isObject(host)) { return host; }

        //Build blank object to act as base of infection.
        infection = (host instanceof Function) ? function() {} : {};
        proxy = new Proxy(infection, proxyMethods(host, infection));

        infection.__proto__ = host.__proto__;
        host.__proto__ = infection;

        //Make infection invisible
        Object.defineProperty(host, '__proto__', {
            enumerable: false,
            get: function(){ return infection.__proto__; },
            set: function(value){ infection.__proto__ = value; }
        });
        Object.defineProperty(host, '__infection__', { //Maybe unecessary?
            enumerable: false,
            value: proxy
        });

        //Register infection for future reference and return.
        Object.__vAnalyze__.infectionMap.set(host, proxy);
        return proxy;
    }

    //--------ATTACH AND ENTRY POINT-----------------------

    var globalIgnore = { //TODO: this should be abstracted someplace better.
        properties: {
            toString: true
        },
        constructors: [
            Number,
            String,
            Boolean
        ]
    };

    function infect(obj, options) {
        var that = this,
            infection,
            properHost,
            p;

        //Support for calling target.infect()
        //May be removed in the future.
        if (arguments.length === 0) {
            obj = this;
        }

        //If the object is already registered, return it.
        infection = Object.__vAnalyze__.infectionMap.get(obj);
        if (infection) {
            return infection;
        } //Else continue

        //Loop through all properties on the object and infect them first.
        for (p in obj) {
            //Don't die on null or undefined;
            //Also, are we still doing globalIgnores?  We should maybe get rid of them.
            if (!globalIgnore.properties[p] && obj[p] != null) {
                //Infect properties and set them at the correct prototype level.
                getOrigin(obj, p)[p] = infect(obj[p]);
            }
        }

        return buildInfection(obj, options);
    }

    Object.defineProperty(Object.prototype, 'infect', {value: infect, enumerable:false });
    Object.prototype.infect.__ignore__ = true; //TODO: depreciate ignore
}());

(function() {

    function wrap(/*original*/) {

        //------------Can the function be wrapped?------------
        //Infected lets us know if we're calling this on a host after a .infect() call or not.
        var infected = (this.__proto__ === Object.infect),
            original = infected ? this.that : this,//What the original infection will be.
            replacement;

        //Non-functions can't be wrapped - don't wrap functions marked with ignore - functions should be infected before wrap.
        if(typeof original !== 'function' || original.__ignore__ || !infected) { return original; }

        //Already wrapped functions will not re-wrap;
        if(this.original) { return this.that; }

        //---------------Build function wrapper----------------

        replacement = function() {
            var toReturn;

            //Start
            //helpers.before(replacement.__infection__);

            //Fire
            //stack.push(replacement); //push the replacement - toString already works with it, so that's all we care about.
            toReturn = original.apply(this, arguments);

            //Infect this (in case we're in a Constructor).
            if(this instanceof original) {
                this.infect();
            }
            //Infect the returned value (in case we're in a factory).
            else if (toReturn && toReturn.infect) {
                toReturn = toReturn.infect().wrap(); //Will return original value if not a function.
            }

            //Finish
            //helpers.after(replacement.__infection__);
            //stack.pop();
            return toReturn;
        };

        //-----------Attach original properties---------------------------

        //Set both prototypes and constructors correctly.
        replacement.prototype = original.prototype;
        replacement.__proto__ = original.__proto__;
        //ToDo: Set Constructor. @Huh, is this already done?


        //Attach properties.
        for(var p in original) {
            if(original.hasOwnProperty(p)) {
                replacement[p] = original[p];
            }
        }

        //If this function was already distributed through code, we might accidentally infect/wrap it again.
        //In that case, what we really want to do is update the function to be using the wrapper we already made.
        Object.defineProperty(original, '__wrapper__', {value: replacement, enumerable:false }); //@Huh this is depreciated and should be removed.

        //Fix toString.
        replacement.toString = function() {
            return original.toString();
        };
        //If this method has also been party to an infection.
        replacement.toString.__infection__ = original.toString.__infection__; //@Huh: is this necessary?

        //-------------Define interfaces on __infection__--------------

        //We leave the original's __infection__ on but make it point to the correct new host.
        //So if something has that infection stored, the next time it calls any methods with it, it will have this.that set correctly.
        //Even if the returned Wrapper is stored incorrectly, we can still get some use out of it.
        replacement.__infection__ = original.__infection__;
        replacement.__infection__.that = replacement;
        replacement.__infection__.original = original;

        //Copy function methods into __infection__
        for(var prop in Object.prototype.infect.func) {
            replacement.__infection__[prop] = Object.prototype.infect.func[prop];
        }

        //Return newly wrapped function.
        return replacement;
    }

    Object.defineProperty(Object.prototype.infect.__proto__, 'wrap', {value: wrap, enumerable:false });
    Object.defineProperty(Object.prototype.infect.__proto__.wrap, '__ignore__', {value: true, enumerable:false });
}());
/**
 * @class Infection
 */
(function() {

    /*
     * @param property - name of the property
     * @param template (optional) - object that specifies custom getter or setter.
     */
    function prop(property, template) {
        var host = this.that,
            _property;

        //Make sure host is suitable.
        if(!host.__infection__) {
            host.infect();
        }

        _property = {
            name: property,
            host: host,
            //
            get: function () { return host[property]; },
            set: function (value) { host[property] = value; },
            watch: function() { },
            //
            history: [],
            onChange: function() {} //ToDO: should there be a default here?
        };

        if(template) {

            _property.get = template.get || _property.get;
            _property.set = template.set || _property.get;
            _property.alias = template.alias || _property.alias; //ToDo: think about the implications of this.
            _property.onChange = template.onChange || _property.onChange;
        }

        host.__infection__.properties[property] = _property;
    }


    //Object.prototype.infect.prototype.scope = scope;
    Object.defineProperty(Object.prototype.infect.__proto__, 'prop', {value: prop, enumerable:false });
    Object.defineProperty(Object.prototype.infect.__proto__.prop, '__ignore__', {value: true, enumerable:false });

}());
/**
 * @class Infection
 */
(function() {

    var filters = {
        name: function(prop, filter) {
            return prop.name === filter;
        },

        names: function(prop, filter) {
            return filter.indexOf(prop.name) !== -1;
        },

        value: function(prop, filter) {
            return prop.get() === filter;
        },

        values: function(prop, filter) {
            var value = prop.get();
            return filter.indexOf(value) !== -1;
        },

        custom: function(prop, filter) {
            return filter(prop);
        }
    };

    function match(prop, searchObject) {
        var add = true;

        if(!searchObject) { return true; }

        Object.keys(searchObject).forEach( function(key) {
            if(filters[key]) {
                add = add && filters[key](prop, searchObject[key]);
            }
        });

        return add;
    }

    /**
     * Looks through an object to see if it can find a property on it or any of its children.
     *
     * @method search
     * @param searchObject - Filter for the search. Available properties are:
     *  - Name: String
     * @returns {Array} A selection of results that match the provided filter
     */
    function search(searchObject) {
        //By default, they return everything.
        //Stuff is filtered out as we go.
        var that = this.that,
            next,
            toReturn = [];

        for (var prop in this.properties) {
            if(this.properties.hasOwnProperty(prop)) {
                //Loop through search object and see if object applies.
                //ToDo: filter these out into rules or something.
                if (match(this.properties[prop], searchObject)) {
                    toReturn.push(this.properties[prop]);
                }

                //If the property is infected, recurse.
                next = this.properties[prop].get().infect();
                if (next) {
                    toReturn = toReturn.concat(next.search(searchObject));
                    //toReturn.concat(search.call(this.properties[prop].get().__infection__, searchObject));
                }
            }
        }

        return toReturn;
    }


    //---------------------Attach--------------------
    Object.defineProperty(Object.prototype.infect.__proto__, 'search', {value: search, enumerable:false });
    Object.defineProperty(Object.prototype.infect.__proto__.search, '__ignore__', {value: true, enumerable:false });
})();
(function() {
	'use strict'

	var running = [];

	Object.__vAnalyze__.stack = {
		namespaces : {}, //Exposed because of design philosophy.

		//TODO: move record and stop to someplace else.
		//TODO: support calling and passing in a method.
		record : function(namespace, method, that, args) {
			var root = {
				args : [],
				subStack : [],
				result : []
			};

			Object.__vAnalyze__.stack.namespaces[namespace] = {
				position : root,
				root : root
			}

			running.push(namespace);
		},

		stop : function(namespace) {
			var index = running.indexOf(namespace);
			if (index > -1) {
				running = running.splice(index, 1);
			}
		},

		push : function(item) {
			running.forEach(function(name) {
				var namespace = Object.__vAnalyze__.stack.namespaces[name];
				
				namespace.position.subStack.push(item);
				item.caller = namespace.position;
				item.subStack = [];
				namespace.position = item;
			});
		},

		resolve : function(result) {
			running.forEach(function(name) {
				var namespace = Object.__vAnalyze__.stack.namespaces[name];
				
				console.log('called');
				namespace.position.result = result;
				console.log('/');
				namespace.position = namespace.position.caller;
			});
		}
	};

}());
(function() {

    function ware() {
        //If a ware is passed in, return its interface.
        //Link that interface to whatever instance of a thing you're working with.
    }

    Object.defineProperty(Object.prototype.infect, 'func', {value: {}, enumerable: false});
}());