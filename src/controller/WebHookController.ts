import { Request, Response } from 'express';
import { Controller, Middleware, Get, Put, Post, Delete } from '@overnightjs/core';
import { KumoConnector } from '../kumo/KumoConnector'
import { KumoBridge } from '../kumo/KumoBridge'

@Controller("webhook")
export class WebHookController {
    private readonly bridge = new KumoBridge()
    private readonly connector = new KumoConnector(this.bridge)

    @Post()
    private handle(req: Request, res: Response) {
        if (WebHookController.accessTokenIsValid(req, res)) {
            this.connector.handleHttpCallback(req, res)
        }
    }

    private static accessTokenIsValid(req: Request, res: Response) {
        // Replace with proper validation of issued access token
        if (req.body.authentication.token) {
          return true;
        }

        res.status(401).send('Unauthorized')
        return false;
      }

}