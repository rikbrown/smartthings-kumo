const kumoJs = require('../kumojs/build/kumojs').Kumo
const kumo = new kumoJs(require('../kumojs/kumo.cfg'))

kumoExport = {
    
    getDevices() {
        rooms = kumo.getRoomList();
        console.log(rooms);
    }

}

module.exports.kumo = kumoExport