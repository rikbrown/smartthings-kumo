const kumoJs = require('../../kumojs/build/kumojs').Kumo

export class KumoBridge {
    private readonly kumo = new kumoJs(require('../../kumojs/kumo.cfg'))

    public getDevices(): Array<Device> {
        const rooms: Array<string> = this.kumo.getRoomList()
        return rooms.map(roomName =>
            new Device(
                roomName.replace(/\W/, '_'),
                roomName + ' AC',
                roomName
            )
        )   
    }

    public getStatus(deviceId: string): Promise<DeviceStatus> {
        const room = this.getDevices().find(device => device.deviceId == deviceId)?.room
        if (!room) return Promise.reject()

        const address = this.kumo.getAddress(room)
        return this.kumo.getStatus(address).then((r: KumoStatusResponse) =>
            r.r.indoorUnit.status
        )
    }
}

class Device {
    constructor(
        public deviceId: string,
        public name: string,
        public room: string
    ) {}
}

interface KumoStatusResponse {
    r: {
        indoorUnit: {
            status: DeviceStatus
        }
    }
}

interface DeviceStatus {
    roomTemp: number,
    mode: ThermostatMode,
    spCool: number,
    spHeat: number,
    vaneDir: string,
    fanSpeed: string,
    filterDirty: boolean,
    standby: boolean
}

enum ThermostatMode {
    HEAT,
    COOL,
    AUTO
}
