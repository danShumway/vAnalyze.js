QUnit.module("Wrapper");

QUnit.test("Basic Wrapper", function(assert) {

    var entry = function(arg) { return arg; },
        wrapped_entry = entry.infect().wrap();


    console.log(entry);
    assert.deepEqual(typeof wrapped_entry, 'function', 'infect().wrap() returns function');
    assert.deepEqual(entry.infect().wrap(), wrapped_entry, 'calling infect().wrap() on wrapped function returns Wrapper');
    assert.deepEqual(wrapped_entry(5), 5, 'Wrapper calls original function with correct arguments and returns correct value');
});

QUnit.test("Wrappers as Constructors and Factories", function(assert) {
    var Constructor = (function() {
            this.x = 5;
        }).infect().wrap(),
        instance = new Constructor();

    assert.ok(instance.__infection__, 'Object created via \'new\' infected properly');
    var Factory = (function() {
            return {
                x: 5,
                y: 5
            };
        }).infect().wrap(),
        result = Factory();

    assert.ok(result.__infection__, 'Object returned from factory function infected properly');


    var Wrapper = (function(arg) {
            return function() {
                return arg;
            }
        }).infect().wrap(),
        wrapped = Wrapper(3);

    assert.ok(wrapped.__infection__.original, 'Function returned from function wrapper also wrapped');
    assert.deepEqual(wrapped(), 3, 'Function returned from function wrapper works correctly');
});

QUnit.test("Wrapper Edge Cases", function(assert) {
    var primitive = 5,
        wrapped_primitive = primitive.infect().wrap();
    assert.deepEqual(primitive, wrapped_primitive, "Calling infect().wrap() on primitive returns original value");

    var obj = {},
        wrapped_obj = obj.infect().wrap();
    assert.deepEqual(obj, wrapped_obj, "Calling infect().wrap() on non-function Host returns original Host");
});