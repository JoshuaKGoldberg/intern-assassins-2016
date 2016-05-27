/// <reference path="../../../../../typings/react/index.d.ts" />

"use strict";
import * as React from "react";
import { IUser } from "../../../../shared/users";
import { ActionButton } from "../profile/actionbutton";
import { Greeting } from "../profile/greeting";
import { Sdk } from "../../sdk/sdk";
import { UsersTable } from "../admin/userstable";

/**
 * Props for an AppAdmin component.
 */
export interface IAppAdminProps {
    /**
     * Information on the user.
     */
    user: IUser;

    /**
     * Wrapper around the server API.
     */
    sdk: Sdk;
}

/**
 * Application component for a logged in user.
 */
export class AppAdmin extends React.Component<IAppAdminProps, void> {
    /**
     * Renders the component.
     * 
     * @returns The rendered component.
     */
    public render(): JSX.Element {
        return (
            <div id="app" className="app-admin">
                <section id="profile">
                    <ActionButton text="x" small action={(): void => this.logOut()} />
                    <Greeting admin={this.props.user.admin} nickname={this.props.user.nickname} />
                    <UsersTable sdk={this.props.sdk} user={this.props.user} />
                </section>
            </div>);
    }

    /**
     * Clears local storage to log out, then refreshes.
     */
    private logOut(): void {
        localStorage.clear();
        window.location.reload();
    }
}