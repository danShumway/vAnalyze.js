QUnit.module("Infection");

QUnit.test("Chaining", function(assert) {
    var obj = {},
        infection = obj.infect();

    assert.deepEqual(infection, obj.__infection__, 'Calling .infect() returns Infection');
    assert.deepEqual(infection, obj.infect(), 'Calling .infect() on already infected Object returns existing Infection');
    assert.deepEqual(infection.that, obj, 'Infection contains reference to Host');

    assert.deepEqual(infection.__proto__, obj.infect, 'Infection inherits prototype from .infect');
});