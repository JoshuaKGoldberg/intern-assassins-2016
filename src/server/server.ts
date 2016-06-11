/// <reference path="../../typings/all.d.ts" />

"use strict";
import * as express from "express";
import * as http from "http";
import { IReport } from "../shared/actions";
import { IUser } from "../shared/users";
import { Api } from "./api";
import { Sockets } from "./sockets";
import { Database } from "./database";

/**
 * Settings to initialize a new Server.
 */
export interface IServerSettings {
    /**
     * Administrators to add when resetting the database.
     */
    admins?: IUser[];

    /**
     * Port for the web server.
     */
    port: number;

    /**
     * Whether to reset the database history.
     */
    reset?: boolean;
}

/**
 * Management server for an assassins game.
 */
export class Server {
    /**
     * Running express application responding to requests.
     */
    private app: any;

    /**
     * User-specified server settings.
     */
    private settings: IServerSettings;

    /**
     * Running http server routing requests to the app.
     */
    private server: http.Server;

    /**
     * Request router to internal storage.
     */
    private api: Api;

    /**
     * MongoDB database.
     */
    private database: Database;

    /**
     * Real-time push notifications for activity.
     */
    private sockets: Sockets;

    /**
     * Initializes a new instance of the Server class.
     * 
     * @param settings   User-specified server settings.
     */
    public constructor(settings: IServerSettings, database: Database) {
        this.settings = settings;
        this.database = database;

        this.app = express();
        this.app.use(express.static("src/site"));
        this.app.use("/node_modules", express.static("node_modules"));

        this.api = new Api(this.app, this.database);
        this.server = http.createServer(this.app);
        this.sockets = new Sockets(this.server);

        this.api.registerReportCallback(
            (report: IReport<any>) => {
                const message: string = report.data.killer === report.data.victim
                    ? `${report.data.victim} appears to be dead...`
                    : `${report.data.killer} killed ${report.data.victim}!`;

                this.sockets.emit(message);
                this.api.endpoints.notifications.storeEmittedMessage(message, report);
            });

    }

    /**
     * Starts the server listening for requests.
     */
    public run(): void {
        if (this.settings.reset) {
            this.database.drop();
            this.api.endpoints.users.putAdmins(this.settings.admins);
        }

        this.server.listen(
            this.settings.port,
            (): void => console.log(`Starting listening on port ${this.settings.port}...`));
    }
}
