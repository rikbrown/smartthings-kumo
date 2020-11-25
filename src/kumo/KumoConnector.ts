import {CallbackTokenStore, CallbackAuthentication} from "./CallbackTokenStore";
import Utils from "../util";

const {SchemaConnector, StateUpdateRequest, StateResponse} = require('st-schema')
import AsyncLock = require('async-lock')

import {Logger} from "@overnightjs/logger";
import {Device, DeviceStatus, KumoBridge, ThermostatMode} from './KumoBridge'

const DEVICE_ID_AC = '028b1db8-2888-4dde-8538-35d8cadc3cb3'
const REFRESH_INTERVAL = 30 * 1000
const INITIAL_BROADCAST_DELAY = 1 * 1000

export class KumoConnector extends SchemaConnector {
    private readonly accessTokens = new CallbackTokenStore()
    private readonly lock = new AsyncLock()
    private readonly deviceLastCommand = new Map<string, number>()

    constructor(private bridge: KumoBridge) {
        super()

        // Broadcast state to anyone who's listening regularly
        setInterval(() => this.broadcastState(), REFRESH_INTERVAL);
        setTimeout(() => this.broadcastState(), INITIAL_BROADCAST_DELAY);

        // Configure ST secrets
        this.clientId(process.env.ST_CLIENT_ID || Utils.throwMissing("ST_CLIENT_ID not configured"))
        this.clientSecret(process.env.ST_CLIENT_SECRET || Utils.throwMissing("ST_CLIENT_SECRET not configured"))

        this.discoveryHandler((accessToken: string, response: any) => {
            Logger.Imp("#discoveryHandler(..)")
            this.bridge.getDevices().forEach(device => KumoConnector.addStDiscoveryDevice(device, response))
        })

        this.stateRefreshHandler(async (accessToken: string, response: any): Promise<void> => {
            Logger.Imp("#stateRefreshHandler(..)")

            await Promise.all(this.bridge.getDevices().map((device) =>
                this.lock.acquire(device.deviceId, async () => {
                    const status = await this.bridge.getStatus(device)
                    response.addDevice(device.deviceId, KumoConnector.toStStates(status))
                })
            ))

            Logger.Imp("#stateRefreshHandler - all states updated")
        })

        this.commandHandler(async (accessToken: string, response: any, devices: Array<any>): Promise<void> => {
            Logger.Imp("#commandHandler(..)")

            const promises = []
            for (const stDevice of devices) {
                promises.push(this.lock.acquire(stDevice.externalDeviceId, async () => {

                    // Retrieve device
                    const device = this.bridge.getDevice(stDevice.externalDeviceId)
                    if (!device) {
                        Logger.Err(`Unknown device: ${stDevice.externalDeviceId}`)
                        return
                    }

                    // Get current status
                    const status = await this.bridge.getStatus(device)

                    // Process commands
                    const promises = []
                    for (const command of stDevice.commands) {
                        Logger.Info(`#commandHandler - device=[${stDevice.externalDeviceId}], capability=[${command.capability}], args=[${command.arguments}]`)

                        switch(command.capability) {
                            case 'st.thermostatMode':
                                promises.push(this.bridge.setThermostatMode(device, command.arguments[0]))
                                status.mode = command.arguments[0]
                                break;
                            case 'st.thermostatCoolingSetpoint':
                                promises.push(this.bridge.setCoolingSetpoint(device, command.arguments[0], status.temperatureUnit))
                                status.spCool = command.arguments[0]
                                break;
                            case 'st.thermostatHeatingSetpoint':
                                promises.push(this.bridge.setHeatingSetpoint(device, command.arguments[0], status.temperatureUnit))
                                status.spHeat = command.arguments[0]
                                break;
                            case 'oniontiger06435.fanSpeed':
                                promises.push(this.bridge.setFanSpeed(device, command.arguments[0]))
                                status.fanSpeed = command.arguments[0]
                                break;
                            case 'oniontiger06435.ventDirection':
                                promises.push(this.bridge.setVentDirection(device, command.arguments[0]))
                                status.vaneDir = command.arguments[0]
                                break;

                            default:
                                Logger.Err(`Unsupported capability for command: ${command.capability}`)
                        }
                    }

                    // Await results
                    await Promise.all(promises)

                    // Emit states
                    response.addDevice(stDevice.externalDeviceId, KumoConnector.toStStates(status));

                    this.deviceLastCommand.set(stDevice.externalDeviceId, Date.now())
                }))
            }

            await Promise.all(promises)

            Logger.Imp("#commandHandler - commands complete")
        })

        this.callbackAccessHandler((accessToken: string, callbackAuthentication: any, callbackUrls: any) => {
            Logger.Imp('#callbackAccessHandler()')
            Logger.Info(`Registering callback for accessToken=[${accessToken}]`)

            this.accessTokens.set(accessToken, {
              callbackAuthentication,
              callbackUrls
            })
          })
        
        this.integrationDeletedHandler((accessToken: string) => {
            Logger.Imp("#integrationDeletedHandler(..)")
            Logger.Info(`Deleting callback for accessToken=[${accessToken}]`)

            this.accessTokens.delete(accessToken)
        });
    }

    private static addStDiscoveryDevice(device: Device, response: any): any {
        const stDevice = response.addDevice(device.deviceId, device.name, DEVICE_ID_AC)
            .manufacturerName('Mitsubishi')
            .modelName("HVAC (Kumo Cloud)")
            .hwVersion('HVAC (Kumo Cloud)')
            .swVersion('1.0.0')
            .roomName(device.room);
        stDevice.addCategory('air-conditioner');
        return stDevice
    }

    private static toStStates(status: DeviceStatus): State[] {
        return [
            State.HEALTHCHECK_ONLINE,
            new State('st.thermostatCoolingSetpoint', 'coolingSetpoint', status.spCool, status.temperatureUnit.toString()),
            new State('st.thermostatHeatingSetpoint', 'heatingSetpoint', status.spHeat, status.temperatureUnit.toString()),
            new State('st.temperatureMeasurement', 'temperature', status.roomTemp, status.temperatureUnit?.toString()),
            new State('st.thermostatMode', 'thermostatMode', KumoConnector.convertMode(status.mode)),
            new State('st.thermostatMode', 'supportedThermostatModes', ['heat', 'cool', 'dryair', 'fanonly', 'auto', 'off']),
            new State('st.filterStatus', 'filterStatus', status.filterDirty ? 'replace' : 'normal'),
            new State('oniontiger06435.fanSpeed', 'fanSpeed', status.fanSpeed),
            new State('oniontiger06435.ventDirection', 'ventDirection', status.vaneDir),
        ]
    }

    private static convertMode(kumoMode: ThermostatMode) {
        switch(kumoMode) {
            case ThermostatMode.HEAT: return 'heat'
            case ThermostatMode.COOL: return 'cool'
            case ThermostatMode.AUTO: return 'auto'
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

    private async broadcastState(): Promise<void> {
        Logger.Imp('#broadcastState()')

        // TODO: parallel over accessTokens
        for (const [accessToken, item] of this.accessTokens.all()) {
            Logger.Info(`Broadcasting to client with accessToken=[${accessToken}]`)

            const deviceStates = (await Promise.all(this.bridge.getDevices().map((device) =>
                this.lock.acquire(device.deviceId, async () => {
                    if (Date.now() - (this.deviceLastCommand.get(device.deviceId)||0) < 10000) {
                        // If the device was recently updated, don't refresh its status because there may be a lag
                        Logger.Info(`Skipping broadcast for ${device.deviceId} because recently updated`)
                        return null
                    }

                    const status = await this.bridge.getStatus(device)
                    return {
                        externalDeviceId: device.deviceId,
                        states: KumoConnector.toStStates(status)
                    }
                })
            ))).filter(it => it)

            const updateRequest = new StateUpdateRequest(this.clientId, this.clientSecret);

            try {
                await updateRequest.updateState(item.callbackUrls, item.callbackAuthentication, deviceStates, (refreshedAuth: CallbackAuthentication) => {
                    Logger.Info(`Received updated authentication for ${accessToken}`)
                    this.accessTokens.updateCallbackAuthentication(accessToken, refreshedAuth)
                })
            } catch (e) {
                if (e.statusCode == 401) {
                    Logger.Warn(`Received 401 for ${accessToken}, removing it`)
                    this.accessTokens.delete(accessToken)
                } else {
                    Logger.Err(e)
                }
            }
        }

        Logger.Imp('#broadcastState() - done')
    }
}

export class State {
    public static readonly HEALTHCHECK_ONLINE = new State('st.healthCheck', 'healthStatus', 'online')
    constructor(
        public capability: string,
        public attribute: string,
        public value: any,
        public unit?: string,
        public data?: any,
        public component: string = 'main',
    ) {}
}