//Should respect options.
/**
 * Real-time code analysis and debugging, accessible both within code and from the console.
 *
 * @module vAnalyze
 * @class Object
 */
(function() {
    /*
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

    Infection.prototype = infect;
    function Infection(that, dummy) {
        this.that = that; //Proper chaining.
        this.dummy = dummy || false; //Is it a fake infection?


        this.properties = {};
        this.__ignore__ =  true;
    }

    /*
     * Loop through any created object and get all methods attached to it.
     * If I run into an attached property (through a prototype) that I've already seen or stored elsewhere,
     * that should be a dead giveaway that the 'elsewhere' is a prototype of this object.
     * ToDo: This method should take an options object, not a set of parameters.
     *
     **/
    var globalIgnore = { //ToDo: this should be abstracted someplace better.
        properties: {
            toString: true
        },
        constructors: [
            Number,
            String,
            Boolean
        ]
    };

    /*
     * Builds and adds infection properties to an object.
     * @returns Infection - true or false based on whether or not the infection was successful.
     **/
    function buildInfection(that) {
        var __infection__;


        //Dummy infections.
        if(that === undefined ||
            that === null ||
            !Object.isExtensible(that) ||
            that.__ignore__) {
            return new Infection(that, true);
        }

        //Proper primitive exposure.
        if(that instanceof Number || that instanceof String || that instanceof Boolean) {
            return new Infection(that.valueOf(), true);
        }

        //Otherwise, continue.
        __infection__ = new Infection(that);
        //We use defineProperty to keep our addition from being enumerated on in existing code.
        Object.defineProperty(that, '__infection__', { value : __infection__, enumerable: false});
        return __infection__;
    }

    /**
     * vAnalyze entry point, attached to Object.prototype.
     * Call to turn any object into a Host and return that Host's Infection
     * Can be called multiple times on already infected objects without side-effects.
     * Can be called on primitive types.
     *
     * @method infect
     * @param options: An object with options about how infections should be created.
     * @returns Infection - An object with properties about the Host
     * @todo: flesh out options.
     */
    function infect(options) {
        var infection;

        if (!this.__infection__) {
            infection = buildInfection(this);
        } else {
            return this.__infection__; //For method chaining.
        }

        if(!infection.dummy) {
            for (var p in this) {
                if (!globalIgnore.properties[p]) {
                    var properHost = this;
                    if (!this.hasOwnProperty(p)) {
                        properHost = getOrigin(this.__proto__, p);
                    }

                    //Don't die on null/undefined.
                    if(properHost[p] !== null && properHost[p] !== undefined) {
                        properHost[p] = properHost[p].infect().wrap();
                    }
                    properHost.infect().prop(p);
                }
            }
        }

        /**
         * Object returned from calling ```infect``` on a Host.
         * Serves as the base for most other vAnalyze functionality.
         *
         * Example creation:
         * ```javascript
         * var myObj = {x:5, y:[10, 12]};
         * var infection = myObj.infect();
         * ```
         *
         * Because ```infect``` can be called safely on already infected objects,
         * this type of storage will in practice be largely unecessary.
         *
         * @class Infection
         */
        return infection;
    }


    //------------------------Attach--------------------
    Object.defineProperty(Object.prototype, 'infect', {value: infect, enumerable:false });
    Object.prototype.infect.__ignore__ = true;

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

    function ware() {
        //If a ware is passed in, return its interface.
        //Link that interface to whatever instance of a thing you're working with.
    }

    Object.defineProperty(Object.prototype.infect, 'func', {value: {}, enumerable: false});
}());