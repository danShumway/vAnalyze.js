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