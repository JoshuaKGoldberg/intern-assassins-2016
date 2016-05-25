/// <reference path="../../typings/all.d.ts" />

"use strict";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as url from "url";
import { IReport, ISubmission } from "../shared/actions";
import { ICredentials, CredentialKeys } from "../shared/login";
import { ServerError } from "./errors";
import { KillClaimsTable } from "./storage/killclaimstable";
import { PlayersTable } from "./storage/playerstable";
import { StorageTable } from "./storage/storagetable";

/**
 * Handler for a report being emitted.
 * 
 * @param report   The emitted report.
 */
export interface IReportCallback<T> {
    (report: IReport<T>): void;
}

/**
 * Handler for a received request.
 * 
 * @param request   The received request.
 * @param response   A corresponding response to the request.
 */
interface IRouteHandler {
    (request: express.Request, response: express.Response): void;
}

/**
 * Routes requests to internal storage.
 */
export class Api {
    /**
     * Storage for kill claims.
     */
    public /* readonly */ kills: KillClaimsTable = new KillClaimsTable(this);

    /**
     * Storage for players.
     */
    public /* readonly */ players: PlayersTable = new PlayersTable(this);

    /**
     * Callbacks to notify of reports.
     */
    private reportCallbacks: IReportCallback<any>[] = [];

    /**
     * Initializes a new instance of the Api class, registering its routes
     * under the application.
     * 
     * @param app   The container application.
     */
    public constructor(app: any) {
        app.use(bodyParser.json());
        app.get("/api", (request: express.Request, response: express.Response): void => {
            response.send("ACK");
        });

        this.registerStorageRoutes(app, this.kills);
        this.registerStorageRoutes(app, this.players);

        app.post("/api/login", (request: express.Request, response: express.Response): void => {
            const credentials: ICredentials = request.body.credentials;

            this.players.get(credentials)
                // Case: player alias exists in the database, does the info match?
                .then(record => {
                    if (
                        credentials.nickname === record.data.nickname
                        && credentials.alias === record.data.alias
                        && credentials.passphrase === record.data.passphrase) {
                        response.sendStatus(200);
                    } else {
                        response.sendStatus(401);
                    }
                })
                // Case: player alias does not exist in the database
                .catch((error: ServerError): void => {
                    response.sendStatus(401);
                });
        });
    }

    /**
     * Registers a callback to receive updates of events.
     * 
     * @param callback   A callback to receive updates of events.
     */
    public registerReportCallback(callback: IReportCallback<any>): void {
        this.reportCallbacks.push(callback);
    }

    /**
     * Fires all registered callbacks for a new report.
     * 
     * @param report   A new report.
     */
    public fireReportCallback(report: IReport<any>): void {
        this.reportCallbacks.forEach((callback: IReportCallback<any>): void => {
            callback(report);
        });
    }

    /**
     * Registers a storage container under a route.
     * 
     * @app   The container application.
     * @param route   URI component under which the member storage will be available.
     * @param member   Storage abstraction for the database.
     */
    private registerStorageRoutes(app: any, member: StorageTable<any>): void {
        app.route("/api/" + member.getRoute())
            .get(this.generateGetRoute(member))
            .delete(this.generateDeleteRoute(member))
            .post(this.generatePostRoute(member))
            .put(this.generatePutRoute(member));
    }

    /**
     * Generates GET route handling for a storage member.
     * 
     * @param member   A storage member to defer to.
     * @returns A GET route handler.
     */
    private generateGetRoute<TSubmission, TData>(member: StorageTable<TData>): IRouteHandler {
        return (request: express.Request, response: express.Response): void => {
            const submission: ISubmission<TSubmission> = this.parseGetSubmission<TSubmission>(request.url);

            member.get(submission.credentials, submission.data)
                .then((results: TData) => response.json(results))
                .catch(error => response
                    .status(500)
                    .json({
                        error: error.message
                    }));
        };
    }

    /**
     * Generates DELETE route handling for a storage member.
     * 
     * @param member   A storage member to defer to.
     * @returns A DELETE route handler.
     */
    private generateDeleteRoute<TSubmission, TData>(member: StorageTable<TData>): IRouteHandler {
        return (request: express.Request, response: express.Response): void => {
            member.delete(request.body.credentials, request.body.data)
                .then((results: TData) => response.json(results))
                .catch(error => response
                    .status(500)
                    .json({
                        error: error.message
                    }));
        };
    }

    /**
     * Generates POST route handling for a storage member.
     * 
     * @param member   A storage member to defer to.
     * @returns A POST route handler.
     */
    private generatePostRoute<TSubmission, TData>(member: StorageTable<TData>): IRouteHandler {
        return (request: express.Request, response: express.Response): void => {
            member.post(request.body.credentials, request.body.data)
                .then((results: TData) => response.json(results))
                .catch(error => response
                    .status(500)
                    .json({
                        error: error.message
                    }));
        };
    }

    /**
     * Generates PUT route handling for a storage member.
     * 
     * @param member   A storage member to defer to.
     * @returns A PUT route handler.
     */
    private generatePutRoute<TSubmission, TData>(member: StorageTable<TData>): IRouteHandler {
        return (request: express.Request, response: express.Response): void => {
            member.put(request.body.credentials, request.body.data)
                .then((results: TData) => response.json(results))
                .catch(error => response
                    .status(500)
                    .json({
                        error: error.message
                    }));
        };
    }

    /**
     * 
     * 
     * @remarks For performance,
     */
    private parseGetSubmission<T>(query: string): ISubmission<T> {
        const queryValues: any = url.parse(query, true).query;
        const credentials: ICredentials = {} as ICredentials;
        const data: T = {} as T;

        for (const loginValueKey of CredentialKeys) {
            credentials[loginValueKey] = queryValues[loginValueKey];
            delete queryValues[loginValueKey];
        }

        for (const dataValueKey in queryValues) {
            data[dataValueKey] = queryValues[dataValueKey];
        }

        return { credentials, data };
    }
}
