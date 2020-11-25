import * as bodyParser from 'body-parser';
import { Server } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { AuthController } from './controller/AuthController';
import { WebHookController } from './controller/WebHookController';

class SmartThingsKumoServer extends Server {
    constructor() {
        super(true);
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true})); 

        super.addControllers([
            new AuthController(),
            new WebHookController(),
        ])
    }

    public start(port: number): void {
        this.app.listen(port, () => {
            Logger.Imp(`Server started on ${port}`);
        });
    }
}

export default SmartThingsKumoServer
