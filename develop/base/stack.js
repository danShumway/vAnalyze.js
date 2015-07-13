(function() {
	'use strict'

	var running = [];

	Object.__vAnalyze__.stack = {
		namespaces : {}, //Exposed because of design philosophy.

		//TODO: move record and stop to someplace else.
		//TODO: support calling and passing in a method.
		record : function(namespace, method, that, args) {
			var root = {
				args : [],
				subStack : [],
				result : []
			};

			Object.__vAnalyze__.stack.namespaces[namespace] = {
				position : root,
				root : root
			}

			running.push(namespace);
		},

		stop : function(namespace) {
			var index = running.indexOf(namespace);
			if (index > -1) {
				running = running.splice(index, 1);
			}
		},

		push : function(item) {
			running.forEach(function(name) {
				var namespace = Object.__vAnalyze__.stack.namespaces[name];
				
				namespace.position.subStack.push(item);
				item.caller = namespace.position;
				item.subStack = [];
				namespace.position = item;
			});
		},

		resolve : function(result) {
			running.forEach(function(name) {
				var namespace = Object.__vAnalyze__.stack.namespaces[name];
				
				console.log('called');
				namespace.position.result = result;
				console.log('/');
				namespace.position = namespace.position.caller;
			});
		}
	};

}());