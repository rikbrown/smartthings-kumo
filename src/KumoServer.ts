import * as bodyParser from 'body-parser';
import { Server } from '@overnightjs/core';
import { Logger } from '@overnightjs/logger';
import { AuthController } from './AuthController';
import { WebHookController } from './WebHookController';

class KumoServer extends Server {
    private readonly SERVER_STARTED = 'Example server started on port: ';

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
            Logger.Imp(this.SERVER_STARTED + port);
        });
    }
}

export default KumoServer
