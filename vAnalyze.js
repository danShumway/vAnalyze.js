var vAnalyze_base_constructor = function() {


        this.infectionLog = new Array();
        this.toInfect = new Array();
        this.infectionsRun = 0;
        this.base = window;
        this.lastReset = 0;
        this.date = new Date();
        this.currentlyInfectedMethods = 0;
        this.currentlyIteratedObjects = 0;

        this.infection = function(elementToInfect, infectionFrame){
            for (var property in elementToInfect)
            {
                if(elementToInfect.hasOwnProperty(property))
                 try {
                    if (typeof elementToInfect[property] == "function") {
                        var theFunction = elementToInfect[property].toString().split(";");
                        //Don't worry about functions that are blank or nativxe code.  This is a hacky way of doing this, but it appears to work.
                        if(theFunction.length >= 2) {
                            //Don&#39;t infect your own methods.
                            if(elementToInfect[property].vAnalyze_infected == undefined)
                            { 
                                elementToInfect[property].vAnalyze_infected = 1;
                                this.currentlyInfectedMethods++;
                                //console.log(elementToInfect + ": " + property); 
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
            else
            {
                //console.log(this.lastReset);
            }

            if(this.toInfect.length > 0) {
                var elementToInfect = this.toInfect.shift();
                this.infection(elementToInfect, this.infectionsRun);
                requestAnimationFrame(this.infectionLoop.bind(this));
            }
            else
            {
                console.log("Restarting, iterated through " + this.currentlyIteratedObjects + " objects.  Currently infected methods: " + this.currentlyInfectedMethods);
                this.currentlyIteratedObjects = 0;
                this.startInfection(this.base);
            }
        }
}

var vAnalyze_base = new vAnalyze_base_constructor();