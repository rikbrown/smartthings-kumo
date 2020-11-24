import { Request, Response } from 'express';
import { Controller, Middleware, Get, Put, Post, Delete } from '@overnightjs/core';

@Controller('auth')
export class AuthController {

    @Get("challenge")
    private getCode(req: Request, res: Response) {
        console.log('/auth/challenge');

        console.log(req.query);

        let state = req.query['state']
        let redirect = req.query['redirect_uri']
        let fullRedirect = redirect +
            '?code=' + '123456' +
            '&state=' + state;
            
        res
            .status(302)
            .header('Location', fullRedirect)
            .send()
    }

    @Post("token")
    private exchangeToken(req: Request, res: Response) {
        console.log('/auth/token');
        res
            .status(200)
            .send({
                "access_token":"1234",
                "token_type":"bearer",
                "expires_in":3600,
                "refresh_token":"5678",
                "scope":"create"
            })
    }
}