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