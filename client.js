var net = require('net');
var client = net.connect({ port: 8124 }, function() { //'connect' 监听器
    console.log('client connected');
    client.write('add [1,2]');
    setTimeout(()=>{
    client.write('add [3,4]');    
}, 500);
    setTimeout(()=>{
    client.write('add [5,6]');    
}, 500);
    client.write('add [7,8]');
});
client.on('data', function(data) {
    console.log(data.toString());
});
client.on('end', function() {
    console.log('客户端断开连接');
});