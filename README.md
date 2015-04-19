**vAnalyze.js should not be considered production ready.  It is possible that not everything written below will work as of time of reading.**

# vAnalyze.js

vAnalyze.js is an inline javascript debugger that can be manipulated during program execution from the console.  

vAnalyze wraps itself around objects and functions in real time in your code in order to monitor its behaviors and display after-the-fact debugging information.

##How it works

vAnalyze attaches itself as a non-enumerable property on the Object protototype.  Once you've included the script in your project, you can access vAnalyze from anywhere in your code or with any exposed object in the console by calling ```infect()```.  This will turn the object you are targeting into a **Host Object**.

```javascript
var myObject = { x:30, y:50 };
myObject.infect();
```

When a Host is infected, vAnalyze builds a custom infection which is attached to that object as a non-enumerable property called an **Infection**, which is returned at the end of the call.  You can access that infection at any time by calling ```infect()``` again on that Host.

```javascript
var myObject = { x:30, y:50 };
myObject.infect();
//Later in code...
var infection = myObject.infect();
```

Calling ```infect``` will recurse into other objects attached to the target, infecting them as well.  This means that you can easily infect large numbers of objects after they have been infected by targeting just the interface or array that contains them.

```javascript
var myArray = [];
for (var i = 0; i<200; i++) {
  myArray.push({'x':i});
}

var infection = myArray.infect();
```

vAnalyze can not be used to infect primitive types such as Strings, Booleans, or Numbers.  However, no matter where you are in your code or what context you're working with, you can always call ```infect()``` safetly on any variable, including primitive types.

```javascript
var myPrimitive = 5;
myPrimitive.infect();
```

If vAnalyze is not able to infect your object (either because it's a primitive, or it's sealed, or for any other reason), it will return a dummy infection that can be safetly manipulated without throwing any errors.


##What's the benefit?

When vAnalyze infects your objects, it exposes useful diagnostic information about them, which can be used to aid in debugging or code analysis.

###Properties

Infections contain an object with of all of a Host's accessible **Properties** conveniently accessible as the ```properties``` property of that infection.

By calling ```search()``` on an infection, you can get a selection of all properties on that object (and sub-objects) that match a set of passed-in filters.

```javascript
var myObject = {x:5, y:10, child:{x:12, y:15, z:null}};
var unset = myObject.infect().search({value:null});
```

This is especially useful when leveraged against large collections of objects.

```javascript
var myArray = [];
for(var i = 0; i < 1500; i++) {
  myArray.push({x:Math.random()*100 - 15, y:Math.random()*100 - 15});
}

var outOfBounds = myArray.infect().search({name:'x', custom:function(p) { return p.get() < 0; }});
```

The above line of code returns all objects that have an x property less than 0.
