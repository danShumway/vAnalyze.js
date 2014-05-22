vAnalyze.js
===========

A middleware script that seeks to allow functions in local javascript to be automatically wrapped in custom code wrappers.  These can then be used to aid profiling/error checking/code understanding.

Usage
-----

For the time being, setting up vAnalyze.js is simply a matter of copying and pasting its code into your web browser's Javascript console.  In the future, we intend to bring its functionality to a Chrome extension to inject the code and bring up the console with one click.

Once the functions have been created, simply run vAnalyze_base.startInfection(x), where x is the element you want to manually infect.  vAnalyze.js will then proceed to virally infect all properties of that element.  

Infected elements gain, among other things, a callCount, which contains the number of times the function has been called since it was infected.  Monitor this to determine if your functions are being called an appropriate number of times or at the correct times.  
