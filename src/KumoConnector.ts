const {SchemaConnector, DeviceErrorTypes} = require('st-schema')
import { KumoBridge } from './KumoBridge'

const DEVICE_ID_AC = '028b1db8-2888-4dde-8538-35d8cadc3cb3'

export class KumoConnector extends SchemaConnector {
    constructor(private bridge: KumoBridge) {
        super()

        this.discoveryHandler((accessToken: string, response: any) => {
            this.bridge.getDevices().forEach(device => {
                const kumoDevice = response.addDevice(device.deviceId, device.name, DEVICE_ID_AC)
                    .manufacturerName('Mitsubishi')
                    .modelName("AC (Kumo Cloud)")
                    .hwVersion('AC (Kumo Cloud)')
                    .swVersion('1.0.0')
                    .roomName(device.room);
                kumoDevice.addCategory('air-conditioner');
            });
        })

        this.stateRefreshHandler((accessToken: string, response: any): Promise<any> => {
            return Promise.all(this.bridge.getDevices().map(async device => {
                const status = await this.bridge.getStatus(device.deviceId)
                console.log('status', status)
                const kumoDevice = response.addDevice(device.deviceId)
                const component = kumoDevice.addComponent('main')
                component.addState('st.healthCheck', 'healthStatus', 'online')
                component.addState('st.thermostatCoolingSetpoint', 'coolingSetpoint', status.spCool, 'C')
                component.addState('st.thermostatHeatingSetpoint', 'heatingSetpoint', status.spHeat, 'C')
                component.addState('st.temperatureMeasurement', 'temperature', status.roomTemp, 'C')
                component.addState('st.thermostatMode', 'thermostatMode', status.mode.toString().toLowerCase())
                component.addState('st.thermostatMode', 'supportedThermostatModes', ['heat', 'cool', 'dryair', 'fanonly', 'auto', 'off'])
                component.addState('st.filterStatus', 'filterStatus', status.filterDirty ? 'replace' : 'normal')
                return status
            })).then(p => console.log('all done'))
        })

        this.commandHandler((accessToken: string, response: any, devices: Array<any>) => {
            devices.forEach(async (it) => {
                const device = response.addDevice(it.externalDeviceId);
                const component = device.addComponent("main");
                component.addState('st.healthCheck', 'healthStatus', 'online');
                
                it.commands.forEach(async (command: any) => {
                    switch(command.capability) {
                        case 'st.thermostatMode':
                            component.addState('st.thermostatMode', 'thermostatMode', command.arguments[0]);
                            break;
                    }
                });
            });
        })
    }
}