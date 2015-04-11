//Do not infect primitive types.
//----------------------------------------------
Object.defineProperty(String.prototype, '__ignore__', {value: true, enumerable:false });
Object.defineProperty(Number.prototype, '__ignore__', {value: true, enumerable:false });
Object.defineProperty(Boolean.prototype, '__ignore__', {value: true, enumerable:false });