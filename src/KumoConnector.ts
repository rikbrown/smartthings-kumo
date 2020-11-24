const {SchemaConnector, DeviceErrorTypes} = require('st-schema')

const DEVICE_ID_AC = '028b1db8-2888-4dde-8538-35d8cadc3cb3'

export class KumoConnector extends SchemaConnector {
    
    constructor() {
        super()

        this.discoveryHandler((accessToken: string, response: any) => {
            const device = response.addDevice('3rd-party-device-0001', 'Living Room AC', DEVICE_ID_AC)
                .manufacturerName('Mitsubishi')
                .modelName("AC (Kumo Cloud)")
                .hwVersion('AC (Kumo Cloud)')
                .swVersion('1.0.0')
                .roomName('Living Room');
            device.addCategory('air-conditioner');
        })

        this.stateRefreshHandler((accessToken: string, response: any) => {
            const device = response.addDevice('3rd-party-device-0001');
            const component = device.addComponent('main');
            component.addState('st.healthCheck', 'healthStatus', 'online');
            component.addState('st.thermostatCoolingSetpoint', 'coolingSetpoint', 25, 'C');
            component.addState('st.thermostatHeatingSetpoint', 'heatingSetpoint', 21, 'C');
            component.addState('st.temperatureMeasurement', 'temperature', 24, 'C');
            component.addState('st.thermostatMode', 'thermostatMode', 'heat');
            component.addState('st.thermostatMode', 'supportedThermostatModes', ['heat', 'cool', 'dryair', 'fanonly', 'auto', 'off']);
            component.addState('st.filterStatus', 'filterStatus', 'normal');
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