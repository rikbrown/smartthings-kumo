import * as fs from 'fs';
import * as path from 'path';
import {Logger} from "@overnightjs/logger";

export class CallbackTokenStore {
    private readonly file = path.join(process.cwd(), "access_tokens.json")
    private readonly accessTokens: {[key: string]: CallbackTokenMetadata}

    constructor() {
        if (fs.existsSync(this.file)) {
            this.accessTokens = JSON.parse(fs.readFileSync(this.file, 'utf8'))
        } else {
            this.accessTokens = {}
        }

        Logger.Info(`Loaded ${Object.keys(this.accessTokens).length} access tokens`)
    }

    public all(): [string, CallbackTokenMetadata][] {
        return Object.entries(this.accessTokens)
    }

    public delete(accessToken: string) {
        delete this.accessTokens[accessToken]
        this.write()
    }

    public set(accessToken: string, tokenMetadata: CallbackTokenMetadata) {
        this.accessTokens[accessToken] = tokenMetadata
        this.write()
    }

    public updateCallbackAuthentication(accessToken: string, callbackAuthentication: CallbackAuthentication) {
        if (this.accessTokens[accessToken]) {
            this.accessTokens[accessToken].callbackAuthentication = callbackAuthentication
            this.write()
        }
    }

    private write() {
        fs.writeFileSync(this.file, JSON.stringify(this.accessTokens))
    }
}

interface CallbackTokenMetadata {
    callbackAuthentication: CallbackAuthentication
    callbackUrls: {}
}

export interface CallbackAuthentication { }