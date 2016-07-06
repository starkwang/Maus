var _ = require('lodash');
function _Number(x){
	return {
		type: "Number",
		data: x
	}
}
function _NumberResolve(x){
	return x.data;
}

var Type = {
	_type: ["Number","NaN","Infinity","Error"],
	wrap: function(x){
		if(x instanceof Error){
			return this._Error(x);
		}
		if(_.isNumber(x)){
			if(_.isNaN(x)){
				return this._NaN(x);
			}else{
				return this._Infinity(x);
			}
			return this._Number(x)
		}
	},
	unwrap: function(x){
		if(this._type.indexOf(x.type) = -1){
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
		if(errObj && errObj.type == 'Error'){
			var err = new Error();
			err.name = errObj.data.name;
			err.message = errObj.data.message;
			err.stack = errObj.data.stack;
			return err;
		}
	}
}

module.exports = Type;
