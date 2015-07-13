QUnit.module("Infect", {
    beforeEach: function() {
        //Anything here?
    }
});

QUnit.test("Enumeration", function(assert) {
    var obj = {
            nested : {
                a : 1,
                b : 1
            },
            a : 1
        },
        infected = obj.infect(obj);

    //Test begin
    var obj_keys = Object.keys(obj);
    var infected_keys = Object.keys(infected);
    console.log(obj_keys, infected_keys);
    for (var i = 0; i < obj_keys.length; i++) {
        assert.equal(obj_keys[i], infected_keys[i], obj_keys[i] + " appears in order");
    }

    window.infected = infected;

});

/*
QUnit.test("Chaining", function(assert) {
    var obj = {},
        infection = obj.infect();

    assert.deepEqual(infection, obj.__infection__, 'Calling .infect() returns Infection');
    assert.deepEqual(infection, obj.infect(), 'Calling .infect() on already infected Object returns existing Infection');
    assert.deepEqual(infection.that, obj, 'Infection contains reference to Host');

    assert.deepEqual(infection.__proto__, obj.infect, 'Infection inherits prototype from .infect');
});

QUnit.test("Arrays", function(assert) {
    var myArray = [{x:5}, {x:6}],
        infection = myArray.infect();

    window.myArray = myArray;

    assert.ok(myArray.__infection__, "Arrays can be infected");
    assert.ok(myArray[0].__infection__, "Elements of an array will be infected.")
});
*/
