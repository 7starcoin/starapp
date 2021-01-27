import React from "react";
import {
    Alert,
    Avatar,
    Button,
    Cell,
    Footer,
    FormLayout,
    FormStatus,
    Input,
    Panel,
    Header,
    PanelHeader,
    PanelHeaderBack,
    PanelHeaderContent,
    Placeholder,
    ScreenSpinner,
    Tappable,
    HorizontalScroll,
    View, Link,
} from "@vkontakte/vkui";
import './GameDice.scss';
import SystemFunctions from "../../../SystemFunctions";
import Icon24DoneOutline from '@vkontakte/icons/dist/24/done_outline';
import Icon24Coins from '@vkontakte/icons/dist/24/coins';
import Icon56ErrorOutline from '@vkontakte/icons/dist/56/error_outline';
import Icon56RecentOutline from '@vkontakte/icons/dist/56/recent_outline';
import IconVkCoin from '../../../img/icon_vkcoin';
import IconWC from '../../../img/icon_wc';
import Socket from "../../../Socket";
import Server from "../../../Server";
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

export default class GameDice extends React.Component {

    rid = -1;
    socket = null;
    reqGetUsers = false;
    isSendAction = false;

    d1r = 1;
    d2r = 0;

    constructor(props) {
        super(props);

        let sFreeToken = SystemFunctions.getStaticVar('freeToken');
        let sUserData = SystemFunctions.getStaticVar('userData');

        this.state = {
            popout: null,
            activePanel: 'game',
            activeModal: null,

            token: sFreeToken == null ? null : sFreeToken,
            userData: sUserData == null ? null : sUserData,
            gameData: null,
            usersVkData: {},

            inputSend: '',
            inputSendError: '',
            targetBet: 0,
            stateText: '',
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
        this.socket.connect({game: 1}, () => {
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

    renderHistory = () => {
        if (this.state.gameData == null) {
            return null;
        }
        let ret = [];
        for (let i = 0; i < this.state.gameData.history.length; i++) {
            let v = this.state.gameData.history[i];
            let hv = this.state.gameData.historyHash[i];
            let t = 1;
            if (v < 7){
                t = 0;
            } else if (v > 7){
                t = 2;
            }
            ret.push(<div className={'item ' + t} onClick={() => this.setState({
                'popout':
                    <Alert
                        actions={[
                            {
                                title: 'СКОПИРОВАТЬ',
                                action: () => Server.copyText(hv[1] + '@' + v),
                                mode: 'default'
                            },
                            {
                                title: 'ЗАКРЫТЬ',
                                autoclose: true,
                                mode: 'default'
                            }]}
                        onClose={this.closePopout}
                    >
                        <h2>Хеш игры</h2>
                        <p>Результат игры: <b>{v}</b></p>
                        <p>Строка для проверки: <b>{hv[1]}@{v}</b></p>
                        <p>Хеш результата: <b>{hv[0]}</b></p>
                        <p>Для проверки скопируйте строку и вставьте на любом сайте для хешировния по технологии md5
                            (например <Link href='https://decodeit.ru/md5'>тут</Link>). Если полученный хеш совпадает с
                            указанным в этом окне, то игра была честной.</p>
                    </Alert>
            })}>
                <div>{v}</div>
            </div>);
        }
        if (ret.length < 1){
            return null;
        }
        return (<div className='history'>
            <Header mode={'secondary'}>ИСТОРИЯ ИГР</Header>
            <HorizontalScroll className='wrapper'>
                {ret}
            </HorizontalScroll>
        </div>);
    }

    renderButtonsBlock = () => {
        if (this.state.gameData == null) {
            return null;
        }
        switch (this.state.gameData.state) {
            case 0:
            case 1:
                if (this.state.gameData == null || this.state.gameData.bets[Server.user_id] != null) {
                    let typeDesc = '= 7';
                    let he = this.state.gameData.bets[Server.user_id];
                    if (he.type === 0) {
                        typeDesc = '< 7';
                    } else if (he.type === 2) {
                        typeDesc = '> 7';
                    }
                    const SIcon = COINS_ICONS[he.cy];
                    return (<div className='buttonsBlock'>
                        <FormLayout className='form'>
                            <FormStatus className='winStatusDef' header="Ваша ставка" mode="default">
                                <div
                                    className='verticalText'>{SystemFunctions.formatNumber(this.state.gameData.bets[Server.user_id].sum)}</div>
                                <SIcon className='vkIcon' width={12} height={12}/>
                                <div className='myBetType'>{typeDesc}</div>
                            </FormStatus>
                        </FormLayout>
                    </div>);
                }
                return (<div className='buttonsBlock'>
                    <FormLayout className='form'>
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
                                       bottom={this.state.inputSendError === '' ? '' : this.state.inputSendError}/>
                            </FormLayout>
                            <div className='mbWrapper'>
                                <div className='mb n1' onClick={() => this.setState({inputSend: Math.floor(this.state.inputSend / 2), inputSendError: ''})}>/2</div>
                                <div className='mb n2' onClick={() => this.setState({inputSend: Math.floor(this.state.inputSend * 2), inputSendError: ''})}>x2</div>
                            </div>
                        </div>
                        <div className='targetButtons'>
                            <Tappable className={'button b1' + (this.state.targetBet === 0 ? ' a' : '')}
                                      activeEffectDelay={0}
                                      onClick={() => this.setState({targetBet: 0})}><b>{"< 7"}</b>{" (x2.3)"}</Tappable>
                            <Tappable className={'button b2' + (this.state.targetBet === 1 ? ' a' : '')}
                                      activeEffectDelay={0}
                                      onClick={() => this.setState({targetBet: 1})}><b>{"= 7"}</b>{" (x5.8)"}</Tappable>
                            <Tappable className={'button b3' + (this.state.targetBet === 2 ? ' a' : '')}
                                      activeEffectDelay={0}
                                      onClick={() => this.setState({targetBet: 2})}><b>{"> 7"}</b>{" (x2.3)"}</Tappable>
                        </div>
                        <Button size="xl" onClick={this.onButtonBet}
                                before={<Icon24DoneOutline/>}>Поставить</Button>
                    </FormLayout>
                </div>);
            case 3:
                if (this.state.gameData != null && this.state.gameData.bets[Server.user_id] != null) {
                    let typeDesc = '= 7';
                    let he = this.state.gameData.bets[Server.user_id];
                    if (he.type === 0) {
                        typeDesc = '< 7';
                    } else if (he.type === 2) {
                        typeDesc = '> 7';
                    }
                    const SIcon = COINS_ICONS[he.cy];
                    return (<div className='buttonsBlock'>
                        <FormLayout className='form'>
                            {this.state.gameData.bets[Server.user_id].win != null ?
                                <FormStatus className='winStatus' header="Ваш выигрыш" mode={"default"}>
                                    <div
                                        className='verticalText'>{SystemFunctions.formatNumber(this.state.gameData.bets[Server.user_id].win)}</div>
                                    <SIcon className='vkIcon' width={12} height={12}/>
                                    <div className='myBetType'>{typeDesc}</div>
                                </FormStatus> :
                                <FormStatus className='winStatus' header="Вы проиграли" mode={"error"}>
                                    <div
                                        className='verticalText'>{SystemFunctions.formatNumber(this.state.gameData.bets[Server.user_id].sum)}</div>
                                    <SIcon className='vkIcon' width={12} height={12}/>
                                    <div className='myBetType'>{typeDesc}</div>
                                </FormStatus>}
                        </FormLayout>
                    </div>);
                }
                break;
        }
    }

    renderDices = () => {
        if (this.state.gameData == null) {
            return null;
        }
        if (this.state.gameData.state === 3) {
            let d1 = this.state.gameData.dices[0];
            let d2 = this.state.gameData.dices[1];
            const rotateX = (d, c) => {
                c--;
                if (c <= 0) {
                    return d;
                }
                let newD = [d[2], d[1], d[5], d[0], d[4], d[3]];
                return rotateX(newD, c);
            }
            const getRenderInstrByResult = (r) => {
                switch (r) {
                    case 1:
                        return [2, 6, 3, 4, 1, 5];
                    case 2:
                        return [1, 2, 3, 4, 5, 6];
                    case 3:
                        return [1, 4, 2, 5, 3, 6];
                    case 4:
                        return [1, 3, 5, 2, 4, 6];
                    case 5:
                        return [6, 5, 3, 4, 2, 1];
                    case 6:
                        return [5, 1, 3, 4, 6, 2];
                    default:
                        return null;
                }
            }
            let f1 = getRenderInstrByResult(d1);
            let f2 = getRenderInstrByResult(d2);
            f1 = rotateX(f1, this.d1r);
            f2 = rotateX(f2, this.d2r);

            return (<div className={'dicesBlock state' + this.state.gameData.state}>
                <div className='diceWrapper n1'>
                    <div className='dice'>
                        <div className={"face one f" + f1[0]}>
                            <span className="ball"/>
                        </div>
                        <div className={"face two f" + f1[1]}>
                            <span className="ball"/>
                            <span className="ball"/>
                        </div>
                        <div className={"face three f" + f1[2]}>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                        </div>
                        <div className={"face four f" + f1[3]}>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                        </div>
                        <div className={"face five f" + f1[4]}>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                        </div>
                        <div className={"face six f" + f1[5]}>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                        </div>
                    </div>
                </div>
                <div className='diceWrapper n2'>
                    <div className='dice'>
                        <div className={"face one f" + f2[0]}>
                            <span className="ball"/>
                        </div>
                        <div className={"face two f" + f2[1]}>
                            <span className="ball"/>
                            <span className="ball"/>
                        </div>
                        <div className={"face three f" + f2[2]}>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                        </div>
                        <div className={"face four f" + f2[3]}>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                        </div>
                        <div className={"face five f" + f2[4]}>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                        </div>
                        <div className={"face six f" + f2[5]}>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                            <span className="ball"/>
                        </div>
                    </div>
                </div>
                <div className='resultText'>{this.state.gameData.dices[0] + this.state.gameData.dices[1]}</div>
            </div>);
        } else {
            if (this.state.gameData.state === 0) {
                return (<div className={'dicesBlock state' + this.state.gameData.state}>
                    <Icon56RecentOutline className='waitIcon'/>
                    <div className='waitText'>Ожидание ставок...</div>
                </div>);
            } else {
                return (<div className={'dicesBlock state' + this.state.gameData.state}>
                    <div className='timer'>{this.state.stateText}</div>
                </div>);
            }
        }
    }

    renderUsers = () => {
        if (this.state.gameData == null) {
            return null;
        }
        let ret = [];
        let sortable = [];
        for (let id in this.state.gameData.bets) {
            sortable.push([id, this.state.gameData.bets[id]]);
        }
        sortable.sort(function (a, b) {
            return b[1].sum - a[1].sum;
        });
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
            let typeDesc = '= 7';
            if (he.type === 0) {
                typeDesc = '< 7';
            } else if (he.type === 2) {
                typeDesc = '> 7';
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

            const SIcon = COINS_ICONS[he.cy];
            switch (this.state.gameData.state) {
                case 1:
                    ret.push(<Cell className='betCell' before={<Avatar size={40} src={photo}>{crown != null && crown > 0 ? <div className='crown'>{crown}</div> : null}</Avatar>}
                                   description={<span><div className='verticalText'>{SystemFunctions.formatNumber(he.sum)}</div><SIcon width={12} height={12} className='vkIcon'/></span>}
                                   indicator={<div className={'betType t' + he.type}>{typeDesc}</div>}
                                   onClick={() => SystemFunctions.openTab("https://vk.com/id" + uid)}><div className={'usersColorsBase-' + color}>{name}</div></Cell>);
                    break;
                case 3:
                    ret.push(<Cell className='betCell' before={<Avatar size={40} src={photo}>{crown != null && crown > 0 ? <div className='crown'>{crown}</div> : null}</Avatar>}
                                   description={he.win > 0 ? <span
                                           style={{'color': '#56be7e'}}><div className='verticalText'>+ {SystemFunctions.formatNumber(he.win)}</div><SIcon width={12} height={12} className='vkIcon'/></span> :
                                       <span
                                           style={{'color': '#ee5e55'}}><div className='verticalText'>- {SystemFunctions.formatNumber(he.sum)}</div><SIcon width={12} height={12} className='vkIcon'/></span>}
                                   indicator={<div className={'betType t' + he.type}>{typeDesc}</div>}
                                   onClick={() => SystemFunctions.openTab("https://vk.com/id" + uid)}><div className={'usersColorsBase-' + color}>{name}</div></Cell>);
                    break;
            }
        }
        return ret;
    }

    renderHash = () => {
        if (this.state.gameData == null) {
            return null;
        }
        switch (this.state.gameData.state) {
            case 0:
            case 1:
            case 2:
                return <Footer>Hash: {this.state.gameData.hash}</Footer>
            case 3:
                return <Footer onClick={() => this.setState({
                    'popout':
                        <Alert
                            actions={[
                                {
                                    title: 'СКОПИРОВАТЬ',
                                    action: () => Server.copyText(this.state.gameData.hashPass + '@' + (this.state.gameData.dices[0] + this.state.gameData.dices[1])),
                                    mode: 'default'
                                },
                                {
                                    title: 'ЗАКРЫТЬ',
                                    autoclose: true,
                                    mode: 'default'
                                }]}
                            onClose={this.closePopout}
                        >
                            <h2>Хеш игры</h2>
                            <p>Результат игры: <b>{this.state.gameData.dices[0] + this.state.gameData.dices[1]}</b></p>
                            <p>Строка для проверки: <b>{this.state.gameData.hashPass}@{this.state.gameData.dices[0] + this.state.gameData.dices[1]}</b></p>
                            <p>Хеш результата: <b>{this.state.gameData.hash}</b></p>
                            <p>Для проверки скопируйте строку и вставьте на любом сайте для хешировния по технологии md5
                                (например <Link href='https://decodeit.ru/md5'>тут</Link>). Если полученный хеш совпадает с
                                указанным в этом окне, то игра была честной.</p>
                        </Alert>
                })}>Hash: {this.state.gameData.hash}<br/>Check md5: {this.state.gameData.hashPass}@{this.state.gameData.dices[0] + this.state.gameData.dices[1]}</Footer>
            default:
                return null;
        }
    }

    render() {
        return (
            <View className='gameDice' activePanel={this.state.activePanel} popout={this.state.popout} header={true}>
                <Panel id='game'>
                    <PanelHeader>
                        <PanelHeaderContent before={<PanelHeaderBack onClick={this.leave}/>}>
                            Под 7 Над
                        </PanelHeaderContent>
                    </PanelHeader>
                    <div className='gameContent'>
                        <div className='paddingWrapper'>
                            {this.renderBalanceBlock()}
                            {this.renderHistory()}
                            {this.renderDices()}
                        </div>
                        {this.renderButtonsBlock()}
                        {this.renderUsers()}
                        {this.renderHash()}
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

    onInputChangeBet = () => {
        this.setState({betAlertType: '', betAlertText: ''});
    }

    onButtonBet = () => {
        if (this.state.gameData == null || this.state.gameData.bets[Server.user_id] != null) {
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
            t: this.state.targetBet,
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
                    if (msg.state === 2) {
                        this.startGraphAnimator();
                    }
                    if (msg.state === 0) {
                        this.setState({stateText: ''});
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

    showLoading = () => {
        this.setState({popout: <ScreenSpinner/>});
    }

    closePopout = () => {
        this.setState({popout: null});
    }
}
