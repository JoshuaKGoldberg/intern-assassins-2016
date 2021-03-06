/// <reference path="../../../typings/all.d.ts" />

"use strict";
import * as express from "express";
import { ICredentials } from "../../shared/login";
import { NotAuthorizedError } from "../errors";
import { Endpoint } from "./endpoint";

/**
 * Endpoint for retrieving a single user's information.
 */
export class LoginEndpoint extends Endpoint<void> {
    /**
     * @returns Path to this part of the global api.
     */
    public getRoute(): string {
        return "login";
    }

    /**
     * Attempts to log in.
     * 
     * @param credentials   Login values for authentication.
     * @param alias   Alias of a user.
     * @returns A promise for the user with the alias.
     */
    public async post(credentials: ICredentials, data: void, response: express.Response): Promise<void> {
        const user = await this.api.endpoints.users.getByCredentials(credentials);
        if (!user) {
            throw new NotAuthorizedError();
        }

        if (
            credentials.codename !== user.codename
            || credentials.alias !== user.alias
            || credentials.passphrase !== user.passphrase) {
            throw new NotAuthorizedError();
        }

        response.sendStatus(200);
        return Promise.resolve();
    }
}
