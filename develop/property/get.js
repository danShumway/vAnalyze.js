(function() {

    /**
     * Returns a property object based on the given name.
     * If there are more than one properties with the name... there can't be more than one property with the given name.
     * Defining two properties with the same name overwrites the first one.
     *
     * If there is no property with that name, returns a blank object?
     *
     * {
     *      value: currentValue,
     *      history: [array of past values],
     *      stack: [not sure how this ought to work],
     *      set: _property.set(value)
     * }
     *
     * @example:
     *
     * var myObj = {x: 5, y:5},
     *     x = myObj.infect().get('x').value; //5
     *
     */
    function get(name) {
        var prop = {
            value: undefined,
            set: function() { }
        };

        if(this.properties[name]) {
            prop.value = this.properties[name].get();
            prop.set = this.properties[name].set();
        }

        return prop; //What's the advantage of this?
        //I don't think there is any.....
        //I honestly don't think there is one.
        //I guess the advantage is that I can attach extra methods through here.
        //Monitoring and watching can be done in other ways, and history doesn't *need* to be appended to that place.
    }

}());