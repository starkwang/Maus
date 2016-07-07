var _ = require('lodash');
var Type = {
	_type: ["Number","NaN","Infinity","Error"],
	wrap: function(x){
		console.log("wrap",x);
		if(x instanceof Error){
			return this._Error(x);
		}
		if(_.isNumber(x)){
			if(_.isNaN(x)){
				return this._NaN(x);
			}else if(x == Infinity){
				return this._Infinity(x);
			}
			return this._Number(x)
		}
	},
	unwrap: function(x){
		console.log("unwrap",x);
		if(this._type.indexOf(x.type) == -1){
			console.log("Unexpected type:" + x.type);
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
	_NumberResolve: function(x){
			return x.data;
	},
	_Infinity: function(x){
		return {
			type: "Infinity",
			data: Infinity
		};
	},
	_InfinityResolve: function(x){
		return Infinity;
	},
	_NaN: function(x){
		return {
			type: "NaN",
			data: NaN
		}
	},
	_NaNResolve: function(x){
		return NaN;
	}
}

module.exports = Type;
