QUnit.module("properties");

QUnit.test("Basic", function(assert) {
    var obj = { x:5, y:5, child: {x:5, y:5}},
        infected = obj.infect();

    assert.expect(0);
});