QUnit.module("Stack", {
    beforeEach: function() {
        //Anything here?
    }
});

QUnit.test("Stack", function(assert) {
    var that = {
            chain3 : function(a) { return a+1; },
            chain2 : function(a) { return that.chain3(a+1); },
            chain1 : function(a) { return that.chain2(a+1); },
            separation : function(a) { return a; }
        },
        infected = Object.infect(that);

    window.infected = infected;

    //Test begin
    infected.__vAnalyze__.stack.record('test');

    var separatedResult = infected.separation({ a:1 });
    var secondResult = infected.chain1(1);

    infected.__vAnalyze__.stack.stop('test');

    console.log(infected.__vAnalyze__.stack);

});