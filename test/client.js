var net = require('net');
// var client = net.connect({ port: 8124 }, function() { //'connect' 监听器
//     console.log('client connected');
// });
// client.on('data', function(data) {
//     console.log(data.toString());
//     client.write('hello from client');
//     client.write('hello from client');
//     client.write('hello from client');
//     client.end();
// });
// client.on('end', function() {
//     console.log('客户端断开连接');
// });


function jsonRpcData(message, body) {
    this.id = new Date().getTime();
    this.message = message;
    this.body = body;
}

var rpcClient = {
    __client: undefined,
    __tmpSendDataStack: [],
    __init: function() {
        var data = new jsonRpcData('init');
        this.__send(data);
    },
    __handleData: function(data) {
        var data = JSON.parse(data);
        switch (data.message) {
            case 'init':
                //init的body是一个函数名string组成的数组
                var rpc = {};
                var funcNames = data.body;

                funcNames.forEach(funcName => {
                    rpc[funcName] = new Function(`
                        console.log("${funcName}")
                    `)
                })
                this.__rpcStaticCallback(rpc);

        }
    },
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
    __send: function(data) {
        if (this.__client != undefined) {
            var json = JSON.stringify(data);
            this.__client.write(json + '\r\n');
        } else {
            this.__tmpSendDataStack.push(data);
        }
    },
}

rpcClient.create(client => {
    console.log(client);
    client.add();
})
