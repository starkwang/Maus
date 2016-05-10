var net = require('net');
var uuid = require('node-uuid');

function jsonRpcData(message, body) {
    this.id = uuid.v4();
    this.message = message;
    this.body = body;
}

var rpcClient = {
    __client: undefined,
    __tmpSendDataStack: [],
    __callbackStore: {},
    create: function(callback) {
        this.__rpcStaticCallback = callback;
        var client = net.connect({ port: 8124 }, () => { //'connect' 监听器
            console.log('client connected');
            this.__client = client;
            this.__init();
            if (this.__tmpSendDataStack.length > 0) {
                this.__tmpSendDataStack.forEach(data => this.__send(data));
            }
        });
        client.on('data', data => {
            console.log('recieve data:', data.toString());
            var data = data.toString();
            var dataArr = data.split('\r\n');
            dataArr.pop();
            dataArr.forEach(data => this.__handleData(data));
        });
    },
    __init: function() {
        var data = new jsonRpcData('init');
        this.__send(data);
    },
    __handleData: function(data) {
        var data = JSON.parse(data);
        switch (data.message) {
            case 'init':
                var rpc = {
                    __send: this.__send.bind(this),
                    __functionCall: this.__functionCall.bind(this)
                };
                var funcNames = data.body;
                funcNames.forEach(funcName => {
                    rpc[funcName] = new Function(`
                        console.log("call ${funcName}");
                        var params = Array.prototype.slice.call(arguments,0,arguments.length-1);
                        this.__functionCall('${funcName}',params,arguments[arguments.length-1])
                    `)
                })

                this.__rpcStaticCallback(rpc);
                break;
            case 'function call':
                var result = data.body.result;
                var id = data.id;
                this.__callbackStore[id](result);
                this.__clearCallback(id);
                break;
        }
    },
    __send: function(data) {
        if (this.__client != undefined) {
            var json = JSON.stringify(data);
            this.__client.write(json + '\r\n');
        } else {
            this.__tmpSendDataStack.push(data);
        }
    },
    __functionCall: function(funcName, params, callback) {
        var data = new jsonRpcData('function call', {
            funcName: funcName,
            params: params
        });
        this.__registerCallback(data.id, callback);
        this.__send(data);
    },
    __registerCallback: function(id, callback) {
        this.__callbackStore[id] = callback;
    },
    __clearCallback: function(id) {
        delete this.__callbackStore[id];
    }
}

rpcClient.create(client => {
    client.promise(result => console.log('result for promise: ', result));
    client.add(1, 2, result => console.log(result));
    client.add(3, 4, result => console.log(result));
    client.add(5, 6, result => console.log(result));
    client.add(7, 8, result => console.log(result));
    client.add(9, 10, result => console.log(result));
    client.add(11, 12, result => console.log(result));
    client.add(13, 14, result => console.log(result));
})
