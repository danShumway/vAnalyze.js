//Do not infect primitive types.
//----------------------------------------------
Object.defineProperty(String.prototype, '__ignore__', {value: true, enumerable:false });
Object.defineProperty(Number.prototype, '__ignore__', {value: true, enumerable:false });
Object.defineProperty(Boolean.prototype, '__ignore__', {value: true, enumerable:false });
(function() {

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

    Infection.prototype = infect;
    function Infection(that, dummy) {
        this.that = that; //Proper chaining.
        this.dummy = dummy; //Is it a fake infection?


        this.properties = {};
        this.__ignore__ =  true;
    }

    /**
     * Builds and adds infection properties to an object.
     * @returns bool - true or false based on whether or not the infection was successful.
     **/
    function buildInfection(that) {
        var __infection__;


        if(!that) { return false; } //Base case.

        __infection__ = new Infection(that);

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
     **/
    var globalIgnore = { //ToDo: this should be abstracted someplace better.
        toString : true
    };

    function infect() {
        if (!this.__ignore__) {

            if (!this.__infection__) {
                buildInfection(this);
            } else {
                //Return the infection (for method chaining).
                return this.__infection__;
            }

            for (var p in this) {
                if (!globalIgnore[p]) {
                    var properHost = this;
                    if (!this.hasOwnProperty(p)) {
                        properHost = getOrigin(this.__proto__, p);
                    }
                   // properHost[p] = properHost.infect.func(properHost[p]); //Will return original object if it's not a function.
                    properHost[p] = properHost[p].infect().wrap();
                    properHost.infect().prop(p);
                }
            }

            return this.__infection__;
        }

        //@Huh: this should fail silently.  Maybe return some sort of default infection object that doesn't do anything?
        return new Infection(this, true);
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
            original= infected ? this.that : this,//What the original infection will be.
            replacement;

        //Non-functions can't be wrapped - don't wrap functions marked with ignore - functions should be infected before wrap.
        if(typeof original !== 'function' || original.__ignore__ || !infected) { return original; }
        //Already wrapped functions will return their wrappers;
        if(original.__wrapper__) { return original.__wrapper__; }

        //---------------Build function wrapper----------------

        replacement = function() {
            var args = Array.prototype.slice.call(arguments),
                toReturn;

            //Start
            //helpers.before(replacement.__infection__);

            //Fire
            //stack.push(replacement); //push the replacement - toString already works with it, so that's all we care about.
            toReturn = original.apply(this, args);

            //Infect the returned value (in case we're in a factory).
            if(toReturn && toReturn.infect) {
                toReturn = toReturn.infect.wrap(toReturn); //Will return original value if not a function.
                toReturn.infect(undefined, undefined); //ToDo: think about whether or not anything ought to be passed in here.
            }
            //Infect this (in case we're in a Constructor).
            if(this.infect) {
                this.infect();
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
        //ToDo: Set Constructor.


        //Attach properties.
        for(var p in original) {
            if(original.hasOwnProperty(p)) {
                replacement[p] = original[p];
            }
        }

        //If this function was already distributed through code, we might accidentally infect/wrap it again.
        //In that case, what we really want to do is update the function to be using the wrapper we already made.
        Object.defineProperty(original, '__wrapper__', {value: replacement, enumerable:false });

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
        replacement.__infection__ = this;
        replacement.__infection__.that = replacement;

        //Copy function methods into __infection__
        for(var prop in Object.prototype.infect.func) {
            replacement.__infection__[prop] = Object.prototype.infect.func[prop];
        }

        //Return newly wrapped function.
        return replacement;
    }

    Object.prototype.infect.__proto__.wrap = wrap;
    Object.defineProperty(Object.prototype.infect.__proto__.wrap, '__ignore__', {value: true, enumerable:false });
}());
(function() {

    /**
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


    Object.prototype.infect.__proto__.prop = prop;
    //Object.prototype.infect.prototype.scope = scope;
    Object.defineProperty(Object.prototype.infect.__proto__.prop, '__ignore__', {value: true, enumerable:false });

}());
(function() {

    /**
     * Looks through an object to see if it can find a property on it or any of its children.
     * @param searchObject
     * @returns {Array} - a selection of results.
     */
    function search(searchObject) {
        //By default, they return everything.
        //Stuff is filtered out as we go.
        var that = this.that,
            next,
            toReturn = [];

        for (var prop in this.properties) {
            //Loop through search object and see if object applies.
            //ToDo: filter these out into rules or something.
            if (!searchObject ||
                (!searchObject.name || prop === searchObject.name) &&
                (!searchObject.value || this.properties[prop].get() === searchObject.value)) {

                toReturn.push(this.properties[prop]);
            }

            //If the property is infected, recurse.
            next = this.properties[prop].get().infect();
            if (next) {
                toReturn = toReturn.concat(next.search(searchObject));
                //toReturn.concat(search.call(this.properties[prop].get().__infection__, searchObject));
            }
        }

        return toReturn;
    }


    //---------------------Attach--------------------
    Object.prototype.infect.__proto__.search = search;
    Object.defineProperty(Object.prototype.infect.__proto__.search, '__ignore__', {value: true, enumerable:false });
})();
(function() {

    function ware() {
        //If a ware is passed in, return its interface.
        //Link that interface to whatever instance of a thing you're working with.
    }

    //Object.prototype.infect.__proto__.func.ware = ware;
}());