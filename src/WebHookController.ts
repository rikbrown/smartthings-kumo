import { Request, Response } from 'express';
import { Controller, Middleware, Get, Put, Post, Delete } from '@overnightjs/core';
import { KumoConnector } from './KumoConnector'
import { KumoBridge } from './KumoBridge'

@Controller("webhook")
export class WebHookController {
    private readonly bridge = new KumoBridge()
    private readonly connector = new KumoConnector(this.bridge)

    @Post()
    private handle(req: Request, res: Response) {
        console.log('/');
        if (this.accessTokenIsValid(req, res)) {
            this.connector.handleHttpCallback(req, res)
        }
    }

    @Get("test")
    private test(req: Request, res: Response) {
        this.bridge.getStatus("Living_Room").then(r =>
            console.log(r)
        )
        res.send()
    }

    private accessTokenIsValid(req: Request, res: Response) {
        // Replace with proper validation of issued access token
        if (req.body.authentication.token) {
          return true;
        }

        res.status(401).send('Unauthorized')
        return false;
      }

}