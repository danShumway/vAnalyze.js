# vAnalyze.js

vAnalyze.js is an inline javascript debugger that can be manipulated during program execution from the console.  

vAnalyze wraps itself around objects and functions in real time in your code in order to monitor their behaviors (just like a virus!)


###Core Principles

- vAnalyze concerns itself with **filtering and searching data**.  A user should be able to eliminate unwanted methods from a library, group together similar data, and find specific instances of data in a large collection.
- vAnalyze concerns itself with **on the fly debugging**.  It should be accessible from any part of your code when writing spontaneous tests.  When encountering an error on objects that vAnalyze was already monitoring, a user should be able to get data about that error and make at least some progress towards discovering the source straight from the console without re-running the program.
- vAnalyze concerns itself with **interactions between objects**.  vAnalyze can be used to monitor private methods and properties, but is generally happier when it is providing an interface for exploring how separate objects modify and manipulate each other.  
  - Even when examining methods and variables in purely local scopes, this is likely the lense through which you will set-up and use vAnalyze.
- vAnalyze concerns itself with your code's **current behavior**.  This is in contrast to your code's initial behavior or your code's intended behavior.
  - vAnalyze prefers to give you the most up-to-date information about your objects, and then expose interfaces that allow you to step backwords through that object's history or to continue forwards under new constraints or with new watchers.  This ideal goes hand in hand with supporting on-the-fly debugging.  
  - While usual debugging with breakpoints involves setting up an initial entry point than stepping through your code line-by-line until something goes wrong, vAnalyze generally prefers to start *when* something goes wrong.
