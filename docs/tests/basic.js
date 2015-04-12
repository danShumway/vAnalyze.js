QUnit.module("Basic Tests");

//----------HELPERS----------------------

function enumerable(obj) {
    var prop, attached = [];
    for (prop in obj) {
        attached.push(prop);
    }

    return attached;
}

//---------TESTS---------------------------

QUnit.test("Exists", function(assert) {
    var obj = {};

    assert.ok(obj.infect, '.infect exists on Object');

    var attached = enumerable(obj);
    assert.equal(attached.length, 0, 'No enumerable properties attached to Object');

});

QUnit.test("Infect", function(assert) {
    var obj = {
        prop: 'prop',
        child: {
            child: { }
        }
    };

    obj.infect();

    assert.ok(obj.__infection__, 'Objects can be infected');
    assert.ok(obj.child.__infection__, 'Attached property (obj.child) was infected');
    assert.ok(obj.child.child.__infection__, 'Recursive infection extends more than one layer deep');

    var attached = enumerable(obj);
    assert.equal(attached.length, 2, 'No enumerable properties attached during infection');

});

QUnit.test("Primitives", function(assert) {
    var str = 'a', num = 5, bool = true;

    str.infect();
    assert.notOk(str.__infection__, 'Strings can NOT be infected');

    num.infect();
    assert.notOk(num.__infection__, 'Numbers can NOT be infected');

    bool.infect();
    assert.notOk(bool.__infection__, 'Booleans can NOT be infected');

    var attached = enumerable(str);
    assert.equal(attached.length, 1, 'No enumerable properties attached to String');

    attached = enumerable(num);
    assert.equal(attached.length, 0, 'No enumerable properties attached to Number');

    attached = enumerable(bool);
    assert.equal(attached.length, 0, 'No enumerable properties attached to Boolean');
});