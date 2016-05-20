var server = require('http').createServer();
var io = require('socket.io')(server);
var uuid = require('node-uuid');

function parkserver(port) {
    this.__port = port;
    //__workerList:
    //  key        :  value
    //  workerType : [workerList]
    //  "common"   : [{id: "id1", socket: sokcet1, isAvailable:true},...]
    this.__workerList = {};
    this.__waitingForWorker = [];
    io.on('connection', worker => {
        var workerID = uuid.v4();
        worker.on('data', data => {
            console.log('recieve data:', data);
            this.__handleData(data, workerID, worker);
        });
        worker.on('disconnect', () => {
            console.log('disconnect: ', workerID);
            for (var workerType in this.__workerList) {
                this.__workerList[workerType] = this.__workerList[workerType].filter(worker => worker.id != workerID);
            }
        });
        //this.__init(workerID);
    })
    this.__handleData = function(data, workerID, socket) {
        switch (data.message) {
            case 'register':
                var workerType = data.body.type || 'default';
                var funcs = data.body.funcs;
                var worker = {
                    id: workerID,
                    socket: socket,
                    isAvailable: true
                };
                if (this.__workerList[workerType] == undefined) {
                    this.__workerList[workerType] = [worker];
                } else {
                    this.__workerList[workerType].push(worker);
                }

                if (this.__waitingForWorker.length > 0) {
                    this.__waitingForWorker.filter(task => this.__getWorker(task.workerType, task.amount, task.address, true))
                }
                break;
            case 'get worker':
                var workerType = data.body.workerType;
                var amount = data.body.amount;
                var address = data.body.address;
                this.__getWorker(workerType, amount, address);
                break;
            case 'manager lost':
                for (var workerType in this.__workerList) {
                    this.__workerList[workerType].forEach(worker => {
                        if(worker.id = workerID){
                            worker.isAvailable = true;
                        }
                    })
                }
        }
    }
    this.__getWorker = function(workerType, amount, address, noPush) {
        console.log('get worker', arguments);
        if (!this.__workerList[workerType]) {
            this.__workerList[workerType] = [];
        }
        var availableWorker = this.__workerList[workerType].filter(worker => worker.isAvailable);
        if (amount == 'default') {
            console.log(availableWorker.length);
            if (availableWorker.length > 0) {
                availableWorker.forEach(worker => {
                    this.__callWorker(worker, address);
                })
                return true;
            } else if (!noPush) {
                console.log('no enough worker yet');
                this.__waitingForWorker.push({
                    workerType: workerType,
                    amount: amount,
                    address: address
                })
                return false;
            }
        } else {
            if (availableWorker.length >= amount) {
                availableWorker.slice(0, amount || 1).forEach(worker => {
                    this.__callWorker(worker, address);
                })
                return true;
            } else if (!noPush) {
                console.log('no enough worker yet');
                this.__waitingForWorker.push({
                    workerType: workerType,
                    amount: amount,
                    address: address
                })
                return false;
            }
        }
        return false;
    };
    this.__callWorker = function(worker, address) {
        console.log('call worker')
        worker.socket.emit('data', {
            message: 'link manager',
            body: {
                address: address
            }
        });
        worker.isAvailable = false;
    }
    server.listen(this.__port);
}

module.exports = parkserver;
