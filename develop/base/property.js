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