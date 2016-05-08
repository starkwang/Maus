var net = require('net');


function RPC(func, port) {
    var server = net.createServer((client) => {
        client.on('end', function() {
            console.log('服务器已断开');
        });
        client.on('data', function(data) {
            // "add 1,2"
            console.log(data.toString());
            var data = data.toString();
            var funcName = data.split(' ')[0];
            var params = JSON.parse(data.split(' ')[1]);
            var result = func[funcName].apply(func, params);
            console.log(result);
            if(typeof(result.then) === 'function'){
                result.then(result => client.write(result.toString()));    
            }else{
                client.write(result.toString());    
            }
        })
    });
    server.listen(port, function() { // 'listening' 监听器
        console.log('server run on ' + port);
    });
}


RPC({
    add: (x, y) => x + y,
    multiply: (x, y) => x * y
}, 8124);
