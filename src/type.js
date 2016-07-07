var _ = require('lodash');
var Type = {
	_type: ["Number","NaN","Infinity","Error","Undefined","String","Array","Boolean","Date","RegExp","Object"],
	wrap: function(x){
		if(x == undefined) return this._Undefined(x);
		if(_.isError(x)) return this._Error(x);
		if(_.isNumber(x)){
			if(_.isNaN(x)){
				return this._NaN(x);
			}else if(x == Infinity){
				return this._Infinity(x);
			}
			return this._Number(x)
		}
		if(_.isArray(x)) return this._Array(x);
		if(_.isString(x)) return this._String(x);
		if(_.isBoolean(x)) return this._Boolean(x);
		if(_.isDate(x)) return this._Date(x);
		if(_.isRegExp(x)) return this._RegExp(x);
		if(_.isObject(x)) return this._Object(x);
		console.log("Unexpected wrap target:" + x);
	},
	unwrap: function(x){
		if(this._type.indexOf(x.type) == -1){
			console.log("Unexpected unwrap type:" + x.type, x);
			return;
		}
		return this["_" + x.type + "Resolve"](x);
	},
	_Error: function(err){
		return {
			type: 'Error',
			data: {
				name: err.name,
				message: err.message,
				stack: err.stack
			}
		}
	},
	_ErrorResolve: function(errObj){
		var err = new Error();
		err.name = errObj.data.name;
		err.message = errObj.data.message;
		err.stack = errObj.data.stack;
		return err;
	},
	_Number: function(x){
		return {
			type: "Number",
			data: x
		}
	},
	_NumberResolve: function(x){ return x.data; },
	_Infinity: function(x){
		return {
			type: "Infinity",
			data: Infinity
		};
	},
	_InfinityResolve: function(x){ return Infinity; },
	_NaN: function(x){
		return {
			type: "NaN",
			data: NaN
		}
	},
	_NaNResolve: function(x){ return NaN; },
	_Undefined: function(x){
		return {
			type: "Undefined"
		}
	},
	_UndefinedResolve: function(x){ return undefined; },
	_String: function(x){
		return {
			type: "String",
			data: x
		}
	},
	_StringResolve: function(x){ return x.data; },
	_Boolean: function(x){
		return {
			type: "Boolean",
			data: x
		}
	},
	_BooleanResolve: function(x){ return x.data; },
	_Date: function(x){
		return {
			type: "Date",
			data: x.getTime()
		}
	},
	_DateResolve: function(x){
		var date = new Date();
		date.setTime(x.data);
		return date;
	},
	_RegExp: function(x){
		return {
			type: "RegExp",
			data: {
				source: x.source,
				g: x.global,
				i: x.ignoreCase,
				m: x.multiline
			}
		}
	},
	_RegExpResolve: function(x){
		var config = "";
		if(x.data.g) config += "g";
		if(x.data.i) config += "i";
		if(x.data.m) config += "m";
		return new RegExp(x.data.source, config);
	},
	_Array: function(x){
		return {
			type: "Array",
			data: x.map(item => this.wrap(item))
		}
	},
	_ArrayResolve: function(x){
		return x.data.map(item => this.unwrap(item));
	},
	_Object: function(x){
		var data = {};
		for(var attr in x){
			data[attr] = this.wrap(x[attr]);
		}
		return {
			type: "Object",
			data: data
		}
	},
	_ObjectResolve: function(x){
		var result = {};
		for(var attr in x.data){
			result[attr] = this.unwrap(x.data[attr]);
		}
		return result;
	}

}
// var obj = {
// 	a: [{b:new Error(),c: new Date()},2,3,4,[5,6,[7]]]
// }
// var a = Type.wrap([obj,[1,2,3,[4,5]],1,"hello",2,3,new Error(),true,new Date(),undefined,NaN,Infinity,/fsadsdffsad/ig]);
// var b = Type.unwrap(a);
// console.log(a,b);

module.exports = Type;
