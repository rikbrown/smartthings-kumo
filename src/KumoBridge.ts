const kumoJs = require('../../kumojs/build/kumojs').Kumo

export class KumoBridge {
    private readonly kumo = new kumoJs(require('../../kumojs/kumo.cfg'))

    public getDevices(): Array<Device> {
        const rooms: Array<string> = this.kumo.getRoomList()
        return rooms.map(roomName =>
            new Device(
                roomName.replace(/\W/, '_'),
                roomName + ' HVAC',
                roomName
            )
        )   
    }

    public getStatus(deviceId: string): Promise<DeviceStatus> {
        const room = this.getDevices().find(device => device.deviceId == deviceId)?.room
        if (!room) return Promise.reject()

        const address = this.kumo.getAddress(room)
        console.log(room, address)
        
        return this.kumo.getStatus(address).then((r: KumoStatusResponse) => {
            const status = r.r.indoorUnit.status;
            status.temperatureUnit = status.spCool < 35 ? TemperatureUnit.C : TemperatureUnit.F
            return status
        })
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
    temperatureUnit: TemperatureUnit,
    roomTemp: number,
    mode: ThermostatMode,
    spCool: number,
    spHeat: number,
    vaneDir: string, // TODO: enum
    fanSpeed: string, // TODO: enum
    filterDirty: boolean,
    standby: boolean
}

export enum ThermostatMode {
    // TODO: add all
    HEAT = 'heat',
    COOL = 'cool',
    AUTO_COOL = 'autoCool',
    AUTO_HEAT = 'autoHeat',
    VENT = 'vent',
    DRY = 'dry',
    OFF = 'off'
}

export enum TemperatureUnit {
    C = 'C',
    F = 'F'
}