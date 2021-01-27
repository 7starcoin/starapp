import React from 'react';
import connect from "@vkontakte/vk-connect";
import openSocket from 'socket.io-client';
import Server from "./Server";
import SystemFunctions from "./SystemFunctions";

export default class Socket {

    static SERVER_PATH = '/socket.io';

    server = Socket.SERVER_PATH;
    socket = null;
    sessionToken = null;

    onMsg = null;
    onDisc = null;

    constructor(server) {
        this.server = server;
    }

    connect = (props, error = () => {}) => {
        if (this.socket != null) {
            return false;
        }

        this.socket = openSocket('https://world-coin-game.ru', {
            reconnection: false,
            path: '/socket.io',
            transports: ['websocket', 'polling']
        });
        this.socket.on('connect_error', (e) => {
            this.socket = null;
            error();
        });
        this.socket.on('connect', () => {
            if (this.socket == null){
                return;
            }
            this.socket.on('disconnect', () => {
                this.socket = null;
                this.onDisconnect();
            });
            this.socket.on('message', this.onMessage);
            Server.checkUserId(() => {
                if (this.socket == null) {
                    return;
                }
                let initProps = SystemFunctions.cloneObj(props);
                initProps.type = 'init';
                initProps.user = Server.user_id;
                initProps.referer = document.location.href;
                this.socket.json.send(initProps);
            });
        });
        return true;
    }

    disconnect = () => {
        if (this.socket != null) {
            this.socket.disconnect();
        }
    }

    send = (data) => {
        if (this.socket == null){
            return false;
        }
        data.user = Server.user_id;
        data.token = this.sessionToken;
        this.socket.json.send(data);
        return true;
    }

    onMessage = (msg) => {
        if (msg.type === 'init') {
            if (msg.status) {
                this.sessionToken = msg.token;
            }
        }
        if (this.onMsg != null) {
            this.onMsg(msg);
        }
    }

    onDisconnect = () => {
        if (this.onDisc != null) {
            this.onDisc();
        }
    }

}
