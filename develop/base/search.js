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