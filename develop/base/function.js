(function() {

    function func(original) {
        var replacement;

        //Non-functions can't be wrapped - don't wrap functions marked with ignore.
        if(typeof original !== 'function' || original.__ignore__) { return original; }
        //Already wrapped functions will return their wrappers;
        if(original.__wrapper__) { return original.__wrapper__; }

        //Build function wrapper
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
                toReturn = toReturn.infect.func(toReturn); //Will return original value if not a function.
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

        //Set prototype correctly.
        //ToDo: Set Constructor.
        replacement.prototype = original.prototype;
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

        //Return newly wrapped function.
        return replacement;
    }

    Object.prototype.infect.__proto__.func = func;
    Object.defineProperty(Object.prototype.infect.__proto__.func, '__ignore__', {value: true, enumerable:false });
}());