import React from "react";
import {
    Avatar,
    Button,
    Cell,
    FormLayout,
    FormStatus,
    Input,
    List,
    Panel,
    PanelHeader,
    PanelHeaderBack,
    PanelHeaderContent,
    PanelHeaderContext,
    Placeholder,
    ScreenSpinner,
    Tappable,
    View,
} from "@vkontakte/vkui";
import './GameFortune.scss';
import SystemFunctions from "../../../SystemFunctions";
import Icon16Dropdown from '@vkontakte/icons/dist/16/dropdown';
import Icon24DoneOutline from '@vkontakte/icons/dist/24/done_outline';
import Icon28GhostOutline from '@vkontakte/icons/dist/28/ghost_outline';
import Icon28FavoriteOutline from '@vkontakte/icons/dist/28/favorite_outline';
import Icon28FireOutline from '@vkontakte/icons/dist/28/fire_outline';
import Icon56ErrorOutline from '@vkontakte/icons/dist/56/error_outline';
import Icon56RecentOutline from '@vkontakte/icons/dist/56/recent_outline';
import IconVkCoin from '../../../img/icon_vkcoin';
import IconWC from '../../../img/icon_wc';
import Socket from "../../../Socket";
import Server from "../../../Server";
import RouletteFortune from "../../components/RouletteFortune";
import IconCorona from '../../../img/icon_corona';
import IconPaper from '../../../img/icon_paper';
import IconBonus from '../../../img/icon_bonus';

const COINS_ICONS = {
    wc: IconWC,
    coins: IconVkCoin,
    corona: IconCorona,
    paper: IconPaper,
    bonus: IconBonus,
};

export default class GameFortune extends React.Component {

    rid = -1;
    socket = null;
    reqGetUsers = false;
    isSendAction = false;
    isReconnect = false;

    angle = -1;

    constructor(props) {
        super(props);

        let sFreeToken = SystemFunctions.getStaticVar('freeToken');
        let sUserData = SystemFunctions.getStaticVar('userData');

        this.state = {
            popout: null,
            activePanel: 'game',
            activeModal: null,
            mode: 0,

            token: sFreeToken == null ? null : sFreeToken,
            userData: sUserData == null ? null : sUserData,
            gameData: null,
            usersVkData: {},

            inputSend: '',
            inputSendError: '',
            stateText: '',
            publish: false,
            contextOpened: false,
            toggleContext: null,
        };
        this.connect();
        this.setAWCS();
    }

    setAWCS = () => {
        let hidden, visibilityChange;
        if (typeof document.hidden !== "undefined") {
            hidden = "hidden";
            visibilityChange = "visibilitychange";
        } else if (typeof document.msHidden !== "undefined") {
            hidden = "msHidden";
            visibilityChange = "msvisibilitychange";
        } else if (typeof document.webkitHidden !== "undefined") {
            hidden = "webkitHidden";
            visibilityChange = "webkitvisibilitychange";
        }
        if (typeof document.addEventListener === "undefined" || hidden === undefined) {
            // Error enable AWCS
        } else {
            document.addEventListener(visibilityChange, () => {
                if (document[hidden]) {
                    if (this.state.socket != null) {
                        this.socket.disconnect();
                    }
                    this.leave();
                }
            }, false);
        }
    }

    connect = () => {
        this.socket = new Socket();

        this.socket.onMsg = this.onMessage;
        this.socket.onDisc = this.onDisconnect;
        this.socket.connect({game: (60 + this.state.mode) * 10 + SystemFunctions.getStaticVar('siCoin')}, () => {
            this.setState({
                popout: null,
                activePanel: 'error',
                panelErrorText: 'Ошибка подключения! Попробуйте чуть позже...'
            });
        });
    }

    componentDidMount() {
        this.showLoading();
    }

    componentWillUnmount() {
        if (this.socket != null) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    renderBalanceBlock = () => {
        let sc = SystemFunctions.getStaticVar('sCoin');
        const SIcon = COINS_ICONS[sc];
        return (<div className='balanceBlock'>
            <div className='verticalText'>Ваш баланс: {SystemFunctions.formatNumber(this.state.userData[sc], 0)}</div>
            <SIcon width={18} height={18} className='coinIcon'/>
        </div>);
    }

    renderButtonsBlock = () => {
        if (this.state.gameData == null) {
            return null;
        }
        let allBets = 0;
        for (let uid in this.state.gameData.bets) {
            allBets += this.state.gameData.bets[uid].sum;
        }
        let myBet = parseInt(this.state.inputSend);
        if (myBet == null || !SystemFunctions.isNumeric(myBet)) {
            myBet = 0;
        }
        if (allBets < 1 && myBet < 1) {
            myBet = 1;
        }
        switch (this.state.gameData.state) {
            case 0:
            case 1:
                const SIcon = COINS_ICONS[this.state.gameData.cy];
                let f = null;
                if (this.state.gameData.bets[Server.user_id] != null) {
                    myBet += this.state.gameData.bets[Server.user_id].sum;
                    f = <FormStatus className='winStatusDef' header="Ваша ставка" mode="default">
                        <div
                            className='verticalText'>{SystemFunctions.formatNumber(this.state.gameData.bets[Server.user_id].sum)}</div>
                        <SIcon className='vkIcon' width={12} height={12}/>
                        <div className='perc'
                             style={{color: this.state.gameData.bets[Server.user_id].color}}>{SystemFunctions.round((this.state.gameData.bets[Server.user_id].sum / allBets) * 100, 1)}%
                        </div>
                    </FormStatus>;
                    allBets -= this.state.gameData.bets[Server.user_id].sum;
                }
                return (<div className='buttonsBlock'>
                    <FormLayout className='form'>
                        {f}
                        <div className='betButtons'>
                            <Tappable className='betButton b1' size="l"
                                      onClick={() => this.setState({inputSend: Math.floor(this.state.userData[SystemFunctions.getStaticVar('sCoin')] / 4)})}>1/4</Tappable>
                            <Tappable className='betButton b2' size="l"
                                      onClick={() => this.setState({inputSend: Math.floor(this.state.userData[SystemFunctions.getStaticVar('sCoin')] / 3)})}>1/3</Tappable>
                            <Tappable className='betButton b3' size="l"
                                      onClick={() => this.setState({inputSend: Math.floor(this.state.userData[SystemFunctions.getStaticVar('sCoin')] / 2)})}>1/2</Tappable>
                            <Tappable className='betButton b4' size="l"
                                      onClick={() => this.setState({inputSend: Math.floor(this.state.userData[SystemFunctions.getStaticVar('sCoin')])})}>ALL</Tappable>
                        </div>
                        <div className='inputBetWrapper'>
                            <FormLayout className='form'>
                                <Input className='inputBet'
                                       placeholder={"Ваша ставка"}
                                       inputmode="numeric"
                                       value={SystemFunctions.isNumeric(this.state.inputSend) ? SystemFunctions.formatNumber(this.state.inputSend, 0) : this.state.inputSend}
                                       alignment="center"
                                       onChange={(e) => {
                                           let v = '' + e.target.value;
                                           v = v.replace(/[^0123456789]/g, '');
                                           if (v !== '' && !SystemFunctions.isNumeric(v)) {
                                               return;
                                           }
                                           if (v > 100000000000) {
                                               v = 100000000000;
                                           }
                                           if (v > this.state.userData[SystemFunctions.getStaticVar('sCoin')]) {
                                               v = this.state.userData[SystemFunctions.getStaticVar('sCoin')];
                                           }
                                           if (v <= 0) {
                                               v = '';
                                           }
                                           this.setState({
                                               inputSendError: '',
                                               inputSend: v,
                                           });
                                       }}
                                       status={this.state.inputSendError === '' ? 'default' : 'error'}
                                       bottom={this.state.inputSendError === '' ? ("Шансы на победу: " + (SystemFunctions.round((myBet / (myBet + allBets)) * 100, 1) + '%')) : this.state.inputSendError}/>
                            </FormLayout>
                            <div className='mbWrapper'>
                                <div className='mb n1' onClick={() => this.setState({inputSend: Math.floor(this.state.inputSend / 2), inputSendError: ''})}>/2</div>
                                <div className='mb n2' onClick={() => this.setState({inputSend: Math.floor(this.state.inputSend * 2), inputSendError: ''})}>x2</div>
                            </div>
                        </div>
                        <Button size="xl" onClick={this.onButtonBet}
                                before={<Icon24DoneOutline/>}>Поставить</Button>
                    </FormLayout>
                </div>);
        }
    }

    renderTable = () => {
        if (this.state.gameData == null) {
            return null;
        }
        if (this.state.gameData.state >= 1 || Object.keys(this.state.gameData.bets).length > 0) {
            const calcAngle = (props, win) => {
                let angle = 0;
                for (let i = props.length - 1; i > win; i--) {
                    angle += props[i].size / 1000 * 360;
                }
                return SystemFunctions.rand(angle + 0.1, angle + props[win].size / 1000 * 360 - 0.5, 4) - 90;
            }
            let op = [];
            let allBets = 0;
            for (let uid in this.state.gameData.bets) {
                allBets += this.state.gameData.bets[uid].sum;
            }
            let winnerId = 0;
            let cur = 0;
            for (let uid in this.state.gameData.bets) {
                if (this.state.gameData.state > 2 && this.state.gameData.winner != null && parseInt(this.state.gameData.winner.uid) === parseInt(uid)) {
                    winnerId = cur;
                }
                op.push({
                    size: Math.round(this.state.gameData.bets[uid].sum / allBets * 1000),
                    color: this.state.gameData.bets[uid].color,
                });
                cur++;
            }
            if (this.state.gameData.state > 2 && this.angle === -1) {
                this.angle = calcAngle(op, winnerId);
            }
            return <div className='table'>
                <RouletteFortune spinAngleStart={360 * 8 + this.angle} options={op} baseSize={150}
                                 start={this.state.gameData.state > 2}/>
                <div className='timer'>{this.state.stateText}</div>
                {this.state.gameData.state < 1 ? <Icon56RecentOutline className='waitIcon absolute'/> : null}
            </div>;
        } else {
            return (<div className='table'>
                <Icon56RecentOutline className='waitIcon'/>
                <div className='waitText'>Ожидание ставок...</div>
            </div>);
        }
    }

    renderUsers = () => {
        if (this.state.gameData == null) {
            return null;
        }
        let ret = [];
        let sortable = [];
        for (let id in this.state.gameData.bets) {
            if (this.state.gameData.state >= 3 && this.state.publish && parseInt(id) === parseInt(this.state.gameData.winner.uid)) {
                continue;
            }
            sortable.push([id, this.state.gameData.bets[id]]);
        }
        sortable.sort(function (a, b) {
            return b[1].sum - a[1].sum;
        });
        if (this.state.gameData.state >= 3 && this.state.publish) {
            sortable.unshift([this.state.gameData.winner.uid, this.state.gameData.bets[this.state.gameData.winner.uid]]);
        }
        let allBets = 0;
        for (let uid in this.state.gameData.bets) {
            allBets += this.state.gameData.bets[uid].sum;
        }
        for (let i in sortable) {
            let uid = sortable[i][0];
            let he = this.state.gameData.bets[uid];
            let name = '@' + uid;
            let photo = null;
            if (this.state.usersVkData[uid] == null) {
                this.getUsersInfo();
            } else {
                name = this.state.usersVkData[uid].first_name + ' ' + this.state.usersVkData[uid].last_name;
                photo = this.state.usersVkData[uid].photo_100;
            }
            let isWin = this.state.gameData.winner != null && parseInt(uid) === parseInt(this.state.gameData.winner.uid);
            let state = this.state.gameData.state;
            if (!this.state.publish && state > 2) {
                state = 1;
            }

            let color = 0;
            if (he.userName != null) {
                name = he.userName;
            }
            color = he.userColor;
            if (color == null) {
                color = 0;
            }
            let crown = he.userCrown;

            const SIcon = COINS_ICONS[this.state.gameData.cy];
            switch (state) {
                case 0:
                case 1:
                    ret.push(<Cell className='betCell' before={<Avatar size={40} src={photo}>{crown != null && crown > 0 ? <div className='crown'>{crown}</div> : null}</Avatar>}
                                   description={<span><div
                                       className='verticalText'>{SystemFunctions.formatNumber(he.sum)}</div><SIcon
                                       width={12} height={12} className='vkIcon'/></span>}
                                   indicator={<div className='betPerc'
                                                   style={{color: he.color}}>{SystemFunctions.round((he.sum / allBets) * 100, 1)}%</div>}
                                   onClick={() => SystemFunctions.openTab("https://vk.com/id" + uid)}><div className={'usersColorsBase-' + color}>{name}</div></Cell>);
                    break;
                case 3:
                    ret.push(<Cell className={'betCell' + (isWin ? ' winner' : '')}
                                   style={isWin ? {background: he.color} : null}
                                   before={<Avatar size={40} src={photo}>{crown != null && crown > 0 ? <div className='crown'>{crown}</div> : null}</Avatar>}
                                   description={<span><div
                                       className='verticalText'>{isWin ? '+ ' + SystemFunctions.formatNumber(this.state.gameData.winner.sum) : '- ' + SystemFunctions.formatNumber(he.sum)}</div><SIcon
                                       width={12} height={12} className='vkIcon'/></span>}
                                   indicator={<div className='betPerc'
                                                   style={{color: he.color}}>{SystemFunctions.round((he.sum / allBets) * 100, 1)}%</div>}
                                   onClick={() => SystemFunctions.openTab("https://vk.com/id" + uid)}><div className={'usersColorsBase-' + color}>{name}</div></Cell>);
                    break;
            }
        }
        return <div className='usersBets'>{ret}</div>;
    }

    toggleContext = () => {
        this.setState({contextOpened: !this.state.contextOpened});
    }

    render() {
        return (
            <View className='gameFortune' activePanel={this.state.activePanel} popout={this.state.popout} header={true}>
                <Panel id='game'>
                    <PanelHeader>
                        <PanelHeaderContent status={this.getModeInfo(this.state.mode)[1]}
                                            before={<PanelHeaderBack onClick={this.leave}/>}
                                            aside={<Icon16Dropdown
                                                style={{transform: `rotate(${this.state.contextOpened ? '180deg' : '0'})`}}/>}
                                            onClick={this.toggleContext}>
                            Jackpot
                        </PanelHeaderContent>
                    </PanelHeader>
                    <PanelHeaderContext opened={this.state.contextOpened} onClose={this.toggleContext}>
                        <List>
                            <Cell
                                before={<Icon28GhostOutline/>}
                                description={this.getModeInfo(0)[1]}
                                asideContent={this.state.mode === 0 ?
                                    <Icon24DoneOutline fill="var(--accent)"/> : null}
                                onClick={() => this.openMode(0)}
                            >
                                Мини
                            </Cell>
                            <Cell
                                before={<Icon28FavoriteOutline/>}
                                description={this.getModeInfo(1)[1]}
                                asideContent={this.state.mode === 1 ?
                                    <Icon24DoneOutline fill="var(--accent)"/> : null}
                                onClick={() => this.openMode(1)}
                            >
                                Классик
                            </Cell>
                            <Cell
                                before={<Icon28FireOutline/>}
                                description={this.getModeInfo(2)[1]}
                                asideContent={this.state.mode === 2 ?
                                    <Icon24DoneOutline fill="var(--accent)"/> : null}
                                onClick={() => this.openMode(2)}
                            >
                                Безлимит
                            </Cell>
                        </List>
                    </PanelHeaderContext>
                    <div className='gameContent'>
                        <div className='paddingWrapper'>
                            {this.renderBalanceBlock()}
                            {this.renderTable()}
                        </div>
                        {this.renderButtonsBlock()}
                        {this.renderUsers()}
                    </div>
                </Panel>
                <Panel id='error'>
                    <PanelHeader>
                        <PanelHeaderContent before={<PanelHeaderBack onClick={() => this.props.go('home')}/>}>
                            Ошибка
                        </PanelHeaderContent>
                    </PanelHeader>
                    <Placeholder
                        icon={<Icon56ErrorOutline style={{color: '#ef5350'}}/>}
                        action={<Button size="l" mode="tertiary" onClick={() => {
                            this.setState({activePanel: 'game'});
                            this.connect();
                        }}>Повторить попытку</Button>}
                        stretched
                    >
                        {this.state.panelErrorText}
                    </Placeholder>
                </Panel>
            </View>
        );
    }

    openMode = (mode) => {
        if (this.state.mode === mode) {
            this.setState({contextOpened: false});
        }
        this.isReconnect = true;
        if (this.socket != null) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.showLoading();
        this.setState({mode: mode, contextOpened: false}, () => {
            this.connect();
        })
    }

    onInputChangeBet = () => {
        this.setState({betAlertType: '', betAlertText: ''});
    }

    onButtonBet = () => {
        if (this.state.gameData == null) {
            return;
        }
        let sum = parseFloat(this.state.inputSend);
        if (sum == null || sum < 1) {
            this.setState({inputSendError: 'Ставка должна быть не менее 1!'});
            return;
        }
        if (sum > 100000000000) {
            this.setState({inputSendError: 'Ставка должна быть не более 100 000 000 000!'});
            return;
        }
        this.socket.send({
            type: 'action',
            a: 'setBet',
            cy: SystemFunctions.getStaticVar('sCoin'),
            bet: sum,
        });
    }

    onButtonGetBet = () => {
        if (this.state.gameData == null || this.state.gameData.bets[Server.user_id] == null || this.state.gameData.bets[Server.user_id].win != null) {
            return;
        }
        this.socket.send({
            type: 'action',
            a: 'getBet',
        });
    }

    onMessage = (msg) => {
        this.isSendAction = false;
        switch (msg.type) {
            case 'init':
                this.closePopout();
                if (msg.status) {
                    this.rid = msg.roomId;
                    this.socket.send({
                        type: 'join',
                        room: 0,
                    });
                }
                break;
            case 'update':
                if (this.state.gameData != null && this.state.gameData.state !== msg.state) {
                    if (msg.state === 0) {
                        this.setState({stateText: ''});
                        this.angle = -1;
                    }
                }
                if (this.state.gameData == null && msg.state === 3) {
                    this.setState({publish: true});
                }
                if (this.state.gameData != null && this.state.gameData.state !== msg.state) {
                    if (msg.state === 1) {
                        this.setState({publish: false});
                        this.angle = -1;
                    }
                    if (msg.state === 3) {
                        setTimeout(() => {
                            this.setState({publish: true});
                        }, 13000);
                    }
                    if (msg.state === 0) {
                        this.setState({stateText: '', publish: false});
                        this.angle = -1;
                    }
                }
                if (msg.state === 3) {
                    this.setState({
                        stateText: '',
                    });
                }
                if (msg.private != null) {
                    if (msg.private.balance != null) {
                        let ud = this.state.userData;
                        for (const key in msg.private.balance) {
                            ud[key] = msg.private.balance[key];
                        }
                        SystemFunctions.saveStaticVar('userData', ud);
                        this.setState({
                            userData: ud,
                        });
                    }
                }
                this.setState({
                    gameData: msg,
                });
                break;
            case 'setBet':
                if (!msg.status) {
                    this.setState({
                        inputSendError: msg.error,
                    })
                }
                break;
            case 'timer':
                this.setState({stateText: msg.timer});
                break;
            case 'balance':
                let ud = this.state.userData;
                if (msg.balance == null) {
                    break;
                }
                for (const key in msg.balance) {
                    ud[key] = msg.balance[key];
                }
                SystemFunctions.saveStaticVar('userData', ud);
                this.setState({
                    userData: ud,
                })
                break;
        }
    }

    onDisconnect = () => {
        if (this.isReconnect) {
            this.isReconnect = false;
            return;
        }
        this.setState({
            popout: null,
            activePanel: 'error',
            panelErrorText: 'Соединение с сервером разорвано! Попробуйте подключиться еще раз'
        });
        this.socket = null;
    }

    changePopout = (p) => {
        this.setState({popout: p})
    }

    leave = () => {
        //this.props.go('home');
        window.history.back();
    }

    getUsersInfo = () => {
        if (this.reqGetUsers) {
            return;
        }
        this.reqGetUsers = true;
        if (this.state.token == null) {
            Server.getUserToken('', (r) => {
                let token = r.access_token;
                SystemFunctions.saveStaticVar('freeToken', token);
                this.reqGetUsers = false;
                this.setState({
                    token: token,
                });
            }, (e) => {
                this.reqGetUsers = false;
                //TODO: alert('Невозможно получить доступ!')
            })
        } else {
            if (this.state.gameData == null) {
                this.reqGetUsers = false;
                return;
            }

            let users = [];
            let gu = '';

            if (this.state.gameData != null && this.state.gameData.bets != null) {
                for (let uid in this.state.gameData.bets) {
                    if (!SystemFunctions.in_array(users, uid)) {
                        gu += ',' + uid;
                        users.push(uid);
                    }
                }
            }
            Server.callApiUser(
                {
                    'method': 'users.get',
                    'params': {
                        user_ids: gu,
                        access_token: this.state.token,
                        fields: 'photo_100',
                        v: '5.100',
                    }
                },
                ((response) => {
                    this.reqGetUsers = false;
                    let r = response.response;

                    let toSave = {};
                    for (let i = 0; i < r.length; i++) {
                        toSave[r[i].id] = r[i];
                    }
                    this.setState({
                        usersVkData: toSave,
                    });
                }),
                () => {
                    this.reqGetUsers = false;
                }
            );
        }
    }

    getModeInfo = (mode) => {
        return [
            ['Мини', '100K - 100KK'],
            ['Классик', '1KK - 1KKK'],
            ['Безлимит', '100K+'],
        ][mode];
    }

    showLoading = () => {
        this.setState({popout: <ScreenSpinner/>});
    }

    closePopout = () => {
        this.setState({popout: null});
    }
}
