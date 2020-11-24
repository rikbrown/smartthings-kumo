import { Request, Response } from 'express';
import { Controller, Middleware, Get, Put, Post, Delete } from '@overnightjs/core';
import { KumoConnector } from './KumoConnector'

@Controller("webhook")
export class WebHookController {
    connector = new KumoConnector()

    @Post()
    private handle(req: Request, res: Response) {
        console.log('/');
        if (this.accessTokenIsValid(req, res)) {
            this.connector.handleHttpCallback(req, res)
        }
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