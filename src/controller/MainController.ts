import {ChildControllers, Controller, Get} from "@overnightjs/core";
import {AuthController} from "./AuthController";
import {WebHookController} from "./WebHookController";
import {Request, Response} from "express";
import {Logger} from "@overnightjs/logger";

Logger.Imp(`Using base URL: ${process.env['ST_BASE_URL']||'/'}`)

@ChildControllers([
    new AuthController(),
    new WebHookController(),
])
@Controller(process.env['ST_BASE_URL'] || '')
export class MainController {
    @Get("")
    private test(req: Request, res: Response) {
        res
            .status(200)
            .send("Hello from smartthings-kumo!")
    }
}