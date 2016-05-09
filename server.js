var net = require('net');


function RPC(func, port) {
    var server = net.createServer((client) => {
        client.on('end', function() {
            console.log('服务器已断开');
        });
        client.on('data', function(data) {
            // "add 1,2"
            console.log('data: ' + data.toString());
            var data = data.toString();
            if (data == 'init') {
                var result = [];
                for (var funcName in func) {
                    result.push(funcName);
                }
                console.log(JSON.stringify(result));
                client.write(JSON.stringify(result));
            } else {
                var funcName = data.split(' ')[0];
                var params = JSON.parse(data.split(' ')[1]);
                var result = func[funcName].apply(func, params);

                if (typeof(result.then) === 'function') {
                    result.then(result => client.write(result.toString()));
                } else {
                    client.write(JSON.stringify(result));
                }
            }

        })
    });
    server.listen(port, function() { // 'listening' 监听器
        console.log('server run on ' + port);
    });
}

var fib = x => x>1?fib(x-1)+fib(x-2):x;

RPC({
    add: (x, y) => x + y,
    multiply: (x, y) => x * y,
    fib: fib,
    make: x=> ({x:x})
}, 8124);
