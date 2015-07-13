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
