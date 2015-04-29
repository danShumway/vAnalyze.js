QUnit.module("Search");

QUnit.test("Basic", function(assert) {
    var obj = {x:5, child:{x:6, y:7}},
        infection = obj.infect();

    assert.deepEqual(infection.search().length, 4, 'Blank search returns array with all properties');
    assert.deepEqual(infection.properties['x'], infection.search()[0], 'Returned properties are the right ones');
});

QUnit.test("Name", function(assert) {
    var obj = {x:5, child:{x:6, y:7}},
        infection = obj.infect();


    assert.deepEqual(infection.search({name:'x'}).length, 2, 'Name filter returns correct number of properties');
    assert.deepEqual(infection.search({names:['x', 'y']}).length, 3, 'Names filter returns correct number of properties');
});

QUnit.test("Value", function(assert) {
    var obj = {x:5, child:{x:6, y:7}},
        infection = obj.infect();

    assert.deepEqual(infection.search({value:7}).length, 1, 'Value filter returns correct number of properties');
    assert.deepEqual(infection.search({value:7})[0].name, 'y', 'Value filter returns correct property');
    assert.deepEqual(infection.search({values:[6, 7]}).length, 2, 'Values filter returns correct number of properties');
})