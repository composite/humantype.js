(function(mod, udef){
	
	'use strict';
	
	var isClient = mod === 'undefined';
	
	 if ( !Object.prototype.hasOwnProperty ) {
		Object.prototype.hasOwnProperty = function(prop) {
		var proto = obj.__proto__ || obj.constructor.prototype;
		return (prop in this) && (!(prop in proto) || proto[prop] !== this[prop]);
		};
	}
	
	//inspired in jQuery (https://github.com/jquery/jquery/blob/master/src/core.js)
	//http://stackoverflow.com/questions/9399365/deep-extend-like-jquerys-for-nodejs
	var util = {
		class2type: {
				"[object Boolean]": "boolean",
				"[object Number]": "number",
				"[object String]": "string",
				"[object Function]": "function",
				"[object Array]": "array",
				"[object Date]": "date",
				"[object RegExp]": "regexp",
				"[object Object]": "object"
		},
		isFunction: function (obj) {
			return util.type(obj) === "function"
		},
		isArray: Array.isArray || function (obj) {
			return util.type(obj) === "array"
		},
		isWindow: function (obj) {
			return obj != null && obj == obj.window
		},
		isNumeric: function (obj) {
			return !isNaN(parseFloat(obj)) && isFinite(obj)
		},
		type: function (obj) {
			return obj == null ? String(obj) : util.class2type[toString.call(obj)] || "object"
		},
		isPlainObject: function (obj) {
			if (!obj || util.type(obj) !== "object" || obj.nodeType) {
				return false
			}
			try {
				if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
					return false
				}
			} catch (e) {
				return false
			}
			var key;
			for (key in obj) {}
			return key === undefined || hasOwn.call(obj, key)
		},
		extend: function() {
			var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
				i = 1,
				length = arguments.length,
				deep = false,
				toString = Object.prototype.toString,
				hasOwn = Object.prototype.hasOwnProperty,
				push = Array.prototype.push,
				slice = Array.prototype.slice,
				trim = String.prototype.trim,
				indexOf = Array.prototype.indexOf;
			if (typeof target === "boolean") {
				deep = target;
				target = arguments[1] || {};
				i = 2;
			}
			if (typeof target !== "object" && !util.isFunction(target)) {
				target = {}
			}
			if (length === i) {
				target = this;
				--i;
			}
			for (i; i < length; i++) {
				if ((options = arguments[i]) != null) {
					for (name in options) {
						src = target[name];
						copy = options[name];
						if (target === copy) {
							continue
						}
						if (deep && copy && (util.isPlainObject(copy) || (copyIsArray = util.isArray(copy)))) {
							if (copyIsArray) {
								copyIsArray = false;
								clone = src && util.isArray(src) ? src : []
							} else {
								clone = src && util.isPlainObject(src) ? src : {};
							}
							// WARNING: RECURSION
							target[name] = util.extend(deep, clone, copy);
						} else if (copy !== undefined) {
							target[name] = copy;
						}
					}
				}
			}
			return target;
		}
	};
	
	//Array Contains
	function acon(arr,val,strict){
		for(var i=0,len=arr.length;i<len;i++){
			if(strict?arr[i]===val:arr[i]==val){return true;}
		}
		return false;
	}
	
	//Error Objects
	var ValidationError,RequiredError;
	if(isClient){
		ValidationError = function (msg) {
			this.name = "ValidationError";
			this.message = (message || "Validation Failed");
		}
		ValidationError.prototype = Error.prototype;
		RequiredError = function (msg) {
			this.name = "RequiredError";
			this.message = (message || "Required Type value");
		}
		RequiredError.prototype = Error.prototype;
	}else{
		var u = require('util');
		ValidationError = function(msg){
			Error.captureStackTrace(this, this.constructor || this);
			this.message = msg || 'Validation Failed';
		};
		u.inherits(ValidationError, Error)
		ValidationError.prototype.name = 'ValidationError'
		RequiredError = function(msg){
			Error.captureStackTrace(this, this.constructor || this);
			this.message = msg || 'Required Type value.';
		};
		u.inherits(RequiredError, Error)
		RequiredError.prototype.name = 'RequiredError'
	}
	
	//HumanType Class Generator
	function ht(op){
		var ht$proxy = function(value){
			debugger;
			this.op = op;
			this.isNum = acon(['number','numeric'], op.type);
			this.isObj = acon(['object','json'], op.type);
			this.val = this.isNum? +value : value;
			this.isRequired = op.required ? ht.validations.required.call(this) : true;
			this.isValid =  op.strict ? ((this.isNum? !isNaN(+value) : true) && this.valid()) : true;
			this.pattern = this.isObj? util.extend({}, op.pattern) : op.pattern;
			
			if(!this.isRequired || !this.isValid){
				var pri= !!op.required, erro = pri? op.required : op.strict;
				switch(true){
					case util.isFunction(erro): erro.call(this, value);break;
					case erro===true:
						var errmsg = value + ' is ' + (pri?'required ':'not valid ') + op.type;
						if(pri){
							throw new RequiredError(errmsg);
						}else{
							throw new ValidationError(errmsg);
						}
					default:
						var errmsg = (erro+'').replace(/\{0\}/g, value);
						if(pri){
							throw new RequiredError(errmsg);
						}else{
							throw new ValidationError(errmsg);
						}
				}
			}
		};
		ht$proxy.prototype = {
			valid: function(){
				if(!op.required && !ht.validations.required.call(this)){ return true; }
				if(this.isObj){
					//TODO : object validation
					return true;
				}else{
					var result = true;
					for(var name in ht.validations){
						if(name != 'required'){
							var chk = acon(['min','max','extract'],name) ? !isNaN(op[name]) : !!op[name];
							result = result && (chk?ht.validations[name].call(this) : true);
						}
					}
					return result;
				}
			},
			value: function(){
				return this.valid()?this.val:null;
			},
			toString: function(){
				return this.value();
			},
			valueOf: function(){
				return this.value();
			}
		};
		
		return ht$proxy;
	}
	
	//Define Humantype
	ht.define = function(op){
		return ht(op);
	};
	
	//Defined Humantype Test
	ht.test = function(ty, val){
		try{
			return new ty(val).valid();
		}catch(e){
			return false;
		}
	};
	
	//Defined Humantype Declaration,
	ht.parse = function(ty, val){
		return new ty(val).value();
	};
	
	//Defined Humantype Declaration try, return false when failed.
	ht.tryParse = function(ty, val){
		try{
			return new ty(val).value();
		}catch(e){
			return false;
		}
	};
	
	//Basic types
	ht.types = {
		String: ht({type:'string'}),
		Number: ht({type:'number'}),
		ID: ht({type:'string', min: 4, max:20, required: 'ID is required', pattern:function(val){ return /^[a-zA-Z]\w+$/.test(val) } }),
		Password: ht({type:'string', min: 8, required: 'Password is required', pattern:function(val){ return /^[a-zA-Z][\w!@#$%^&*-=+~]+$/.test(val) } }),
		Email: ht({type:'string', pattern:function(val){ return val ? /^[\w-\._\+%]+@(?:[\w-]+\.)+[\w]{2,6}$/.test(val) : true; } }),
		Url: ht({type:'string', pattern:function(val){ return val ? /^[-a-zA-Z0-9@:%_\+.~#?&\/\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)?$/.test(val) : true; } }),
		Phone: ht({type:'string', pattern:function(val){ return val ? /^(02|01[0126789]|0[3-6][1-4]|070)-[0-9]{3,4}-[0-9]{4}$/.test(val) : true; } }),
		Tel: ht({type:'string', pattern:function(val){ return val ? /^(\(?(\d{3})\)?\s?-?\s?(\d{3})\s?-?\s?(\d{4}))$/.test(val) : true; } }),
	};
	
	//Validation Assets
	ht.validations = {
		min: function(){
			return this.isNum? this.val >= this.op.min : this.val.length >= this.op.min;
		},
		max: function(){
			return this.isNum? this.val <= this.op.max : this.val.length <= this.op.max;
		},
		extract: function(){
			return this.isNum? this.val == this.op.extract : this.val.length == this.op.extract;
		},
		pattern: function(){
			switch(true){
				case this.op.pattern instanceof RegExp:return this.op.pattern.test(this.val);
				case util.isFunction(this.op.pattern): return this.op.pattern.call(this, this.val);
				default: return true;
			}
		},
		required: function(){
			switch(true){
				case this.isNum:return !isNaN(this.val) && this.val != Number.NEGATIVE_INFINITY && this.val != Number.POSITIVE_INFINITY;
				case !this.isObj:return !!this.val;
				default:return this.val!=null && this.val!=udef;
			}
		}
	};
	
	//Export to client or require
	if(isClient){
		window.humantype = ht;
	}else{
		mod.exports = ht;
	}
})(module);