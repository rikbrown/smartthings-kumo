const {SchemaConnector, StateUpdateRequest} = require('st-schema')
import { KumoBridge, ThermostatMode } from './KumoBridge'

const DEVICE_ID_AC = '028b1db8-2888-4dde-8538-35d8cadc3cb3'

export class KumoConnector extends SchemaConnector {
    private accessTokens: Map<String, any> = new Map()

    constructor(private bridge: KumoBridge) {
        super()

        setInterval(() => this.broadcastState(), 60000);

        this.clientId('738bd6b9-c5cd-4521-973c-34a2709c31b0')
        this.clientSecret('532420d83f30dfc9f435e51dd9c23bd21129854b92c744efbb8cba5b849cdebcbc1596e44d72db240c5ab051619459d8f2f9b4a44087a55cdcff7975ef10bfb9d2f0700b3598d11b45063abef1315569d9b32477a3e19d0007df20d30bd9b048ab564494bcc0562a2cb3add469aa1582c580cef6d4dc079a279ad6768cb11be1dd9580118836b189eb8f5e6d97e7d9724102ad5f5178da365acc62efeaf52f8f1d17dcf3820caf30e4c3e9932ce29c7ac5170db1898b2c4b573e0bdad675f7dfbb333c2b5a97bb0f05175f2b7ad7f7152877322e507a6f079ca35815e68b22fb974a90f697f7d6fb57eb91a3d4b05893139954d9cb72973622ce32879e1c65c3')

        this.discoveryHandler((accessToken: string, response: any) => {
            this.bridge.getDevices().forEach(device => {
                const kumoDevice = response.addDevice(device.deviceId, device.name, DEVICE_ID_AC)
                    .manufacturerName('Mitsubishi')
                    .modelName("HVAC (Kumo Cloud)")
                    .hwVersion('HVAC (Kumo Cloud)')
                    .swVersion('1.0.0')
                    .roomName(device.room);
                kumoDevice.addCategory('air-conditioner');
            });
        })

        this.stateRefreshHandler((accessToken: string, response: any): Promise<any> => {
            return Promise.all(this.bridge.getDevices().map(async device => {
                const status = await this.bridge.getStatus(device.deviceId)
                console.log(device.deviceId, 'status', status)
                const kumoDevice = response.addDevice(device.deviceId)
                const component = kumoDevice.addComponent('main')
                component.addState('st.healthCheck', 'healthStatus', 'online')
                component.addState('st.thermostatCoolingSetpoint', 'coolingSetpoint', status.spCool, status.temperatureUnit.toString())
                component.addState('st.thermostatHeatingSetpoint', 'heatingSetpoint', status.spHeat, status.temperatureUnit.toString())
                component.addState('st.temperatureMeasurement', 'temperature', status.roomTemp, status.temperatureUnit?.toString())
                component.addState('st.thermostatMode', 'thermostatMode', this.convertMode(status.mode))
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

        this.callbackAccessHandler((accessToken: string, callbackAuthentication: any, callbackUrls: any) => {
            console.log('callbackAccessHandler')
            this.accessTokens.set(accessToken, {
              callbackAuthentication,
              callbackUrls
            })
          })
        
        this.integrationDeletedHandler((accessToken: string) => {
            console.log('integrationDeletedHandler')
            this.accessTokens.delete(accessToken)
        });
    }

    private convertMode(kumoMode: ThermostatMode) {
        switch(kumoMode) {
            case ThermostatMode.HEAT: return 'heat'
            case ThermostatMode.COOL: return 'cool'
            case ThermostatMode.AUTO_COOL: return 'auto'
            case ThermostatMode.AUTO_HEAT: return 'auto'
            case ThermostatMode.VENT: return 'fanonly'
            case ThermostatMode.DRY: return 'dryair'
            case ThermostatMode.OFF: return 'off'
            default:
                console.error('Unsupported thermostat mode', kumoMode)
                return 'auto'
        }
    }

    private async broadcastState() {
        await this.accessTokens.forEach((item: any, accessToken: String, map: any) => {
            Promise.all(this.bridge.getDevices().map(async device => {
                const status = await this.bridge.getStatus(device.deviceId)
                console.log(device.deviceId, 'broadcast status', status)

                const deviceState = [
                    {
                      externalDeviceId: device.deviceId,
                      states: [
                        {
                          component: 'main',
                          capability: 'st.healthCheck',
                          attribute: 'healthStatus',
                          value: 'online',
                        },
                        {
                            component: 'main',
                            capability: 'st.temperatureMeasurement',
                            attribute: 'temperature',
                            value: status.roomTemp,
                            // value:  Math.floor(Math.random() * Math.floor(30)),
                            unit: 'C'
                        }
                      ]
                    }
                ];
                
                const updateRequest = new StateUpdateRequest(this.clientId, this.clientSecret);
                return updateRequest.updateState(item.callbackUrls, item.callbackAuthentication, deviceState)
            })).catch(e => {
                console.log('broken', e);
            });
        })
    }
}
