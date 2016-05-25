"use strict";
import { ICredentials } from "./login";

/**
 * A user submission of data, along with their credentials.
 * 
 * @type T   The type of data being submitted.
 */
export interface ISubmission<T> {
    /**
     * Some data being sent in.
     */
    data: T;

    /**
     * Verification for the submitting user.
     */
    credentials: ICredentials;
}

/**
 * A record of a previous submission.
 * 
 * @type T   The type of data being submitted.
 */
export interface IReport<T> {
    /**
     * Some data sent in.
     */
    data: T;

    /**
     * The player reporting this action.
     */
    reporter: string;

    /**
     * When the server recognized the action.
     */
    timestamp: number;
}
