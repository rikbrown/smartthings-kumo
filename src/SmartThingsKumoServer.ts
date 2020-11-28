import * as bodyParser from 'body-parser';
import { Server } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { AuthController } from './controller/AuthController';
import { WebHookController } from './controller/WebHookController';
import {MainController} from "./controller/MainController";

class SmartThingsKumoServer extends Server {
    constructor() {
        super(true);
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true}));
        super.addControllers([ new MainController() ])
    }

    public start(port: number): void {
        this.app.listen(port, () => {
            Logger.Imp(`Server started on ${port}`);
        });
    }
}

export default SmartThingsKumoServer
