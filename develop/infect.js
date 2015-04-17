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
        if (!this.__ignore__ && Object.isExtensible(this)) {

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