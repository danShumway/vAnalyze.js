var vAnalyze_base = new (function() {

        this.infectionLog = new Array();
        this.toInfect = new Array();
        this.infectionsRun = 0;
        this.base = window;
        this.lastReset = 0;
        this.date = new Date();
        this.currentlyInfectedMethods = 0;
        this.currentlyIteratedObjects = 0;
        this.callCount = 0;
        this.foundFunctions = [];
        this.foundFunctionsText = []; //This is the only publicly facing array, and it's not that great.  Just use the methods below.
        this.lastCalled = null;

        //Some more interesting stuff here.  Let's sort functions by whether or not they are unique.
        this.uniqueCount = {};

        //Much more unique.  A tree/linked-list of what the call-stack looks like.
        this.callStack = null; //What will be displayed.
        this.building = null; //In the backend, this is what will be actively built, and will switch over at a certain point.
        this.currentStackObject = this.callStack;
        this.callStackItem = function(text, parent, prev, next) { this.functionRun = text; this.parent = parent; this.prev = prev; this.next = next; }

        //A method that infects all methods on 
        this.infection = function(elementToInfect, infectionFrame){
            for (var property in elementToInfect)
            {
                try{ //Errors for dom objects.
                if(elementToInfect.hasOwnProperty(property)) {
                    if (typeof elementToInfect[property] == "function") {

                        //Convert function to string.  We use this to cull off some data.
                        var theFunction = elementToInfect[property].toString();
                        if(theFunction != undefined) //Check for errors. Weird things can happen with functions, so it pays to be safe.
                            theFunction = theFunction.split(";");
                        //Don't worry about functions that are blank or native code.  This is a hacky way of doing this, but it appears to work.
                        if(theFunction != undefined && theFunction.length >= 2) {
                            //Don't infect your own methods.
                            if(elementToInfect[property].vAnalyze_infected == undefined)
                            { 
                                var functionInfecting = elementToInfect[property]; //Save a reference to the old function.

                                /*
                                **We're using the reference elementToInfect[property] to get around reference errors.  
                                **If we just said ourFunctionReference = new function(), it wouldn't replace the actual function, just our reference to it.
                                **It's like dealing with pointers.
                                */

                                //First we're going to make the new function to replace the old one..
                                var newFunction = function() {
                                    //Here we should check in with our base of operations and run whatever code is requested.
                                    vAnalyze_base.callCount++;
                                    vAnalyze_base.lastCalled = arguments.callee;
                                    arguments.callee.vAnalyze_callCount += 1;

                                    //Call the old method, but also pass in the arguments it should have.
                                    //And yes, we pass in *this*, because this will mean the correct context when the program is actually run.
                                    var args = Array.prototype.slice.call(arguments); //Convert parameters to an array.


                                    //We get the run time of the function.
                                    var myTime = performance.now();
                                    var toReturn =  arguments.callee.vAnalyze_oldCode.apply(this, args); //Call the original method, and return the result.
                                    myTime = performance.now() - myTime;
                                    //Update the average
                                    arguments.callee.vAnalyze_averageRunTime = ((arguments.callee.vAnalyze_averageRunTime * (arguments.callee.vAnalyze_callCount - 1)) + myTime) / arguments.callee.vAnalyze_callCount;


                                    return toReturn; //And return
                                }
                                //Insert any properties back onto the function.
                                for(var v in elementToInfect[property]) {
                                    newFunction[v] = elementToInfect[property][v];
                                }
                                
                                //Update prototype (WARNING: this uses the now depreciated __proto__ - there aren't any great ways at them moment to get around this)
                                //newFunction.__proto__ = elementToInfect[property].__proto__;
                                //Object.setPrototypeOf(newFunction, functionInfecting.prototype);
                                //ToDo: Fix this stuff.
                                
                                //By the way, we do need to attach the old code.
                                newFunction.vAnalyze_oldCode = functionInfecting;
                                newFunction.vAnalyze_callCount = 0;
                                newFunction.vAnalyze_averageRunTime = 0;
                                newFunction.vAnalyze_infected = 1; //Mark as infected.
                                
                                //Add it to our databases.
                                this.foundFunctions.push(newFunction);
                                this.foundFunctionsText.push(newFunction.vAnalyze_oldCode.toString());
                                //Is it a *new* function?
                                if(!(functionInfecting.toString() in this.uniqueCount))
                                {
                                    //Add it.
                                    this.uniqueCount[functionInfecting.toString()] = 1;
                                } else { this.uniqueCount[functionInfecting.toString()] += 1; } //Increment it.


                                //And assign.
                                elementToInfect[property] = newFunction;

                                //Update internal tally of how many methods we've gotten.
                                this.currentlyInfectedMethods++;
                            }
                        }
                    } else if (elementToInfect[property] != null && typeof elementToInfect[property] == "object") {
                        if(elementToInfect[property].vAnalyze_infected != this.infectionsRun)
                        {
                            if(elementToInfect[property].vAnalyze_infected == undefined)
                            {
                                //We use defineProperty to keep our addition from being enumerated on in existing code - we don't want to ruin anyone's for... in loops.
                                Object.defineProperty(elementToInfect[property], "vAnalyze_infected", { value : this.infectionsRun, enumerable: false});
                            }
                            else
                                elementToInfect[property].vAnalyze_infected = this.infectionsRun;
                            //add it to the list to return.
                            this.toInfect.push(elementToInfect[property]);
                            this.infectionLog.push(property);
                            this.currentlyIteratedObjects++;
                        }
                        else
                        {
                            //console.log("found duplicate on run: " + this.infectionsRun + " : " + property);
                        }                        
                    }
                }

                } catch(err) { /*console.log(err);*/ }//Tell us you found something, but go on.
            }
        }

        this.startInfection = function(elementToInfect)
        {
            this.base = elementToInfect;
            var thing = false;
            if(this.infectionsRun == 0) { thing = true; }
            this.infectionsRun = this.infectionsRun + 1;
            if(thing) console.log(this.infectionsRun);

            //Now we start again.
            this.toInfect.push(this.base);
            vAnalyze_base.vAnalyze_infected = this.infectionsRun;
            vAnalyze_base.vAnalyze_infected = this.infectionsRun;
            this.infectionLoop();
        }

        this.infectionLoop = function()
        {
            //Every once in a while, we clear everything out to keep the virus running smoothly.
            this.date = new Date();
            if(this.date.getTime() - this.lastReset > 4000) {
                //console.log("oldTime was : " + this.lastReset);
                this.toInfect = new Array();
                this.lastReset = this.date.getTime();
                //console.log("newTime is " + this.lastReset + " and getTime is " + this.date.getTime());
            }
            //..a thing.. that should be commented.
            if(this.toInfect.length > 0) {
                var elementToInfect = this.toInfect.shift();
                this.infection(elementToInfect, this.infectionsRun);
                requestAnimationFrame(this.infectionLoop.bind(this));
            }
            else
            {
                //console.log("Restarting, iterated through " + this.currentlyIteratedObjects + " objects.  Currently infected methods: " + this.currentlyInfectedMethods);
                this.currentlyIteratedObjects = 0;
                this.startInfection(this.base);
            }
        }

        //Some better diagnostic tools.
        this.sortFoundFunctionsByCallCost = function()
        {
            var compareFunction = function(a, b){
                if (a.vAnalyze_averageRunTime < b.vAnalyze_averageRunTime)
                    return 1;
                else if (a.vAnalyze_averageRunTime > b.vAnalyze_averageRunTime)
                    return -1;
                return 0;
            }
            this.foundFunctions.sort(compareFunction);
            //Also, return an array of the old function text.
            var toReturn = [];
            for(var i = 0; i < this.foundFunctions.length; i++)
            {
                toReturn.push(this.foundFunctions[i].vAnalyze_averageRunTime + ": " + this.foundFunctions[i].vAnalyze_oldCode.toString());
            }
            return toReturn;
        }

        //Returns a sorted array of functions by the number of instances that were found.
        this.sortFunctionsByNumberOfInstances = function()
        {
            toReturn = [];

            //return array.
            for (var f in this.uniqueCount)
            {
                toReturn.push(f);
            }

            //Sort function
            var compareFunction = function(a, b) {
                if(vAnalyze_base.uniqueCount[a] < vAnalyze_base.uniqueCount[b]) return 1;
                else if (vAnalyze_base.uniqueCount[a] > vAnalyze_base.uniqueCount[b]) return -1;
                else return 0;
            }

            toReturn.sort(compareFunction);

            //Also, include the number of instances.
            for(var i = 0; i < toReturn.length; i++)
            {
                toReturn[i] = this.uniqueCount[toReturn[i]] + ": " + toReturn[i];
            }

            return toReturn;
        }

        //Returns a formatted call-stack/tree of the recorded function calls.

})();
