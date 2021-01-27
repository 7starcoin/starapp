import React from 'react';
import axios from 'axios';
import connect from "@vkontakte/vk-connect";

const SERVER_PATH = 'https://world-coin-game.ru/server/';
const SECRET = 'npaP 2oA 6F:o5ma2w8*P4Aцxvk[ацpTы ф';
const APP_ID = 7490821;
const GROUP_ID = 196258588;

export default class Server {

    static user_id = 0;

    static QUERY_GET_USER = 'getUser';
    static QUERY_GET_RATING = 'getRating';
    static QUERY_ACTIONS = 'actions';
    static QUERY_MARKET = 'market';

    static query(query, data, response, error = () => {
    }) {
        this.checkUserId(() => {
            axios.post(
                SERVER_PATH + 'capi.php',
                {
                    query: query,
                    data: data,
                    secret: SECRET,
                    uid: this.user_id,
                    referer: document.location.href,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            ).then(response).catch(error);
        });
    }

    static getServer(response, error = () => {
    }) {
        this.checkUserId(() => {
            axios.post(
                SERVER_PATH + 'get_runtime_server.php',
                {
                    secret: SECRET,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            ).then(response).catch(error);
        });
    }

    static getUserToken(scope, response, error = () => {
    }) {
        const sub = (e) => {
            switch (e.detail.type) {
                case 'VKWebAppAccessTokenReceived':
                    connect.unsubscribe(sub);
                    response(e.detail.data);
                    break;
                case 'VKWebAppAccessTokenFailed':
                    connect.unsubscribe(sub);
                    error(e.detail.data);
                    break;
            }
        }
        connect.unsubscribe(sub);
        connect.subscribe(sub);
        connect.send("VKWebAppGetAuthToken", {"app_id": APP_ID, "scope": scope});
    }

    static callApiUser(data, response, error = () => {
    }) {
        const sub = (e) => {
            switch (e.detail.type) {
                case 'VKWebAppCallAPIMethodResult':
                    connect.unsubscribe(sub);
                    response(e.detail.data);
                    break;
                case 'VKWebAppCallAPIMethodFailed':
                    connect.unsubscribe(sub);
                    error(e.detail.data);
                    break;
            }
        }
        connect.unsubscribe(sub);
        connect.subscribe(sub);
        connect.send("VKWebAppCallAPIMethod", data);
    }

    static share(link) {
        connect.send("VKWebAppShare", {"link": link});
    }

    static addInMyGroup () {
        connect.send("VKWebAppAddToCommunity", {});
    }

    static subscribeEvent (onSub = () => {}){
        let checkSubscribe = (e) => {
            switch (e.detail.type) {
                case 'VKWebAppJoinGroupResult':
                    connect.unsubscribe(checkSubscribe);
                    onSub();
                    break;
            }
        }
        connect.unsubscribe(checkSubscribe);
        connect.subscribe(checkSubscribe);
        connect.send("VKWebAppJoinGroup", {"group_id": GROUP_ID});
    }

    static allowMessagesEvent (onSub = () => {}){
        let checkSubscribe = (e) => {
            switch (e.detail.type) {
                case 'VKWebAppAllowMessagesFromGroupResult':
                    connect.unsubscribe(checkSubscribe);
                    onSub();
                    break;
            }
        }
        connect.unsubscribe(checkSubscribe);
        connect.subscribe(checkSubscribe);
        connect.send("VKWebAppAllowMessagesFromGroup", {"group_id": GROUP_ID});
    }

    static copyText (text, onSub = () => {}){
        let checkSubscribe = (e) => {
            switch (e.detail.type) {
                case 'VKWebAppCopyTextResult':
                    connect.unsubscribe(checkSubscribe);
                    onSub();
                    break;
            }
        }
        connect.unsubscribe(checkSubscribe);
        connect.subscribe(checkSubscribe);
        connect.send("VKWebAppCopyText", {text: text});
    }

    static checkUserId(callback) {
        if (this.user_id !== 0) {
            callback();
            return;
        }
        let sub = (e) => {
            switch (e.detail.type) {
                case 'VKWebAppGetUserInfoResult':
                    connect.unsubscribe(sub);
                    if (this.user_id !== 0) {
                        callback();
                        return;
                    }
                    this.user_id = e.detail.data.id;
                    callback();
                    break;
            }
        };
        connect.unsubscribe(sub);
        connect.subscribe(sub);
        connect.send('VKWebAppGetUserInfo', {});
    }

}