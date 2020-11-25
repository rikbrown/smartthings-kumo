require('dotenv').config()

import SmartThingsKumoServer from './SmartThingsKumoServer';

const server = new SmartThingsKumoServer();
server.start(3000);