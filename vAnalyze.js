var vAnalyze_base_constructor = function() {


        this.infectionLog = new Array();
        this.toInfect = new Array();
        this.infectionsRun = 0;
        this.base = window;
        this.lastReset = 0;
        this.date = new Date();
        this.currentlyInfectedMethods = 0;
        this.currentlyIteratedObjects = 0;
        this.callCount = 0;

        //A method that infects all methods on 
        this.infection = function(elementToInfect, infectionFrame){
            for (var property in elementToInfect)
            {
                if(elementToInfect.hasOwnProperty(property))
                 try {
                    if (typeof elementToInfect[property] == "function") {
                        var theFunction = elementToInfect[property].toString().split(";");
                        //Don't worry about functions that are blank or native code.  This is a hacky way of doing this, but it appears to work.
                        if(theFunction.length >= 2) {
                            //Don't infect your own methods.
                            if(elementToInfect[property].vAnalyze_infected == undefined)
                            { 
                                elementToInfect[property].vAnalyze_infected = 1; //Mark as infected.
                                var functionInfecting = elementToInfect[property]; //Save a reference to the old function.

                                //We're using the reference elementToInfect[property] to get around reference errors.  If we just said ourFunctionReference = new function()
                                //it wouldn't replace the actual function, just our reference to it.
                                //It's like dealing with pointers.
                                elementToInfect[property] = function() { 
                                    //Here we should check in with our base of operations and run whatever code is requested.
                                    vAnalyze_base.callCount++;

                                    //Call the old method, but also pass in the arguments it should have.
                                    //And yes, we pass in *this*, because this will mean the correct context when the program is actually run.
                                    var args = Array.prototype.slice.call(arguments); //Convert parameters to an array.
                                    arguments.callee.vAnalyze_oldCode.apply(this, args); //Call the original method.
                                }

                                //By the way, we do need to attach the old code.
                                elementToInfect[property].vAnalyze_oldCode = functionInfecting;

                                this.currentlyInfectedMethods++;
                            }
                        }
                    } else if (elementToInfect[property] != null && typeof elementToInfect[property] == "object") {
                        if(elementToInfect[property].vAnalyze_infected != this.infectionsRun)
                        {
                            if(elementToInfect[property].vAnalyze_infected == undefined)
                                Object.defineProperty(elementToInfect[property], "vAnalyze_infected", { value : this.infectionsRun, enumerable: false});
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
                catch(err) {
                    console.log(err);
                }  
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
            vAnalyze_base_constructor.vAnalyze_infected = this.infectionsRun;
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
}

var vAnalyze_base = new vAnalyze_base_constructor();