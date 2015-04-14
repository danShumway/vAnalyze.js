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