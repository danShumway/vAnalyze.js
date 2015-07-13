
(function() {
	'use strict';

	var __vAnalyze__ = {
		//Attach capabilities here
		infectionMap : new WeakMap()
	};

	Object.defineProperty(Object.prototype, '__vAnalyze__', { 
		value : __vAnalyze__,
		enumerable:false
	});

	//Wrapper around native methods that might otherwise mess us up.
	Object.getPrototypeOf = function(obj) {
	    return obj.__proto__;
	};
	Object.setPrototypeOf = function(obj, value) {
	    obj.__proto__ = value;
	};

}());