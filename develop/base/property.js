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