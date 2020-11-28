import Utils from "../util";

const KumoJs = require('../3p/kumojs/kumojs').Kumo
import { Logger } from '@overnightjs/logger';

/**
 * Typed bridge into kumojs
 */
export class KumoBridge {
    private readonly kumo = new KumoJs(require(process.env.KUMO_CFG_FILE || Utils.throwMissing("KUMO_CFG_FILE not configured")))

    public getDevices(): Array<Device> {
        const rooms: Array<string> = this.kumo.getRoomList()
        return rooms.map(roomName => {
            Logger.Info(`Found ${roomName}...`)

            return new Device(
                roomName.replace(/\W/, '_'),
                roomName + ' AC',
                roomName
            )
        })
    }

    public getDevice(deviceId: String): Device | undefined {
        return this.getDevices().find(device => device.deviceId == deviceId)
    }

    public async getStatus(device: Device): Promise<DeviceStatus> {
        const address = this.kumo.getAddress(device.room)
        Logger.Info(`Located ${device.deviceId} at ${address}, getting status...`)

        // FIXME: error handling
        const status: DeviceStatus = (await this.kumo.getStatus(address)).r.indoorUnit.status
        // Guess the temperature unit based on the heating value
        status.temperatureUnit = status.spHeat < 35 ? TemperatureUnit.C : TemperatureUnit.F

        Logger.Info(`${device.deviceId} = ${JSON.stringify(status)}`)
        return status
    }

    public async setThermostatMode(device: Device, mode: ThermostatMode): Promise<any> {
        Logger.Info(`#setThermostatMode: deviceId=[${device.deviceId}], mode=[${mode}]`)
        const address = this.kumo.getAddress(device.room)
        return this.kumo.setMode(address, mode)
    }

    public async setCoolingSetpoint(device: Device, temperature: number, unit: TemperatureUnit): Promise<any> {
        Logger.Info(`#setCoolingSetpoint: deviceId=[${device.deviceId}], temperature=[${temperature}]`)
        const temperatureF = unit == TemperatureUnit.F ? temperature : (((temperature/5)*9)+32)
        const address = this.kumo.getAddress(device.room)
        return this.kumo.setCoolTemp(address, temperatureF)
    }

    public async setHeatingSetpoint(device: Device, temperature: number, unit: TemperatureUnit): Promise<any> {
        Logger.Info(`#setHeatingSetpoint: deviceId=[${device.deviceId}], temperature=[${temperature}]`)
        const temperatureF = unit == TemperatureUnit.F ? temperature : (((temperature/5)*9)+32)
        const address = this.kumo.getAddress(device.room)
        return this.kumo.setHeatTemp(address, temperatureF)
    }

    public async setFanSpeed(device: Device, fanSpeed: FanSpeed) {
        Logger.Info(`#setFanSpeed: deviceId=[${device.deviceId}], fanSpeed=[${fanSpeed}]`)
        const address = this.kumo.getAddress(device.room)
        return this.kumo.setFanSpeed(address, fanSpeed)
    }

    public async setVentDirection(device: Device, ventDirection: VentDirection) {
        Logger.Info(`#setVentDirection: deviceId=[${device.deviceId}], ventDirection=[${ventDirection}]`)
        const address = this.kumo.getAddress(device.room)
        return this.kumo.setVentDirection(address, ventDirection)
    }
}

export class Device {
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

export interface DeviceStatus {
    temperatureUnit: TemperatureUnit,
    roomTemp: number,
    mode: ThermostatMode,
    spCool: number,
    spHeat: number,
    vaneDir: VentDirection, // TODO: enum
    fanSpeed: FanSpeed, // TODO: enum
    filterDirty: boolean,
    standby: boolean
}

export enum ThermostatMode {
    // TODO: add all
    HEAT = 'heat',
    COOL = 'cool',
    AUTO = 'auto',
    VENT = 'vent',
    DRY = 'dry',
    OFF = 'off',

    // Returned but not settable
    AUTO_COOL = 'autoCool',
    AUTO_HEAT = 'autoHeat',
}

export enum TemperatureUnit {
    C = 'C',
    F = 'F'
}

export enum FanSpeed {
    AUTO = 'auto',
    QUIET = 'quiet',
    LOW = 'low',
    MEDIUM = 'powerful',
    HIGH = 'superPowerful',
}

export enum VentDirection {
    AUTO = 'auto',
    SWING = 'swing',
    HORIZONTAL = 'horizontal',
    MID_HORIZONTAL = 'midhorizontal',
    MIDPOINT = 'midpoint',
    MID_VERTICAL = 'midvertical',
    VERTICAL = 'vertical',
}