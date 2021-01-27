import React from "react";
import {
    Alert,
    Avatar,
    Button,
    Footer,
    FormLayout,
    FormStatus,
    Header,
    HorizontalScroll,
    Input,
    Link,
    Panel,
    PanelHeader,
    PanelHeaderBack,
    PanelHeaderContent,
    Placeholder,
    ScreenSpinner,
    SimpleCell,
    Tappable,
    View,
} from "@vkontakte/vkui";
import './Game21.scss';
import SystemFunctions from "../../../SystemFunctions";
import Icon24DoneOutline from '@vkontakte/icons/dist/24/done_outline';
import Icon28CoinsOutline from '@vkontakte/icons/dist/28/coins_outline';
import Icon56ErrorOutline from '@vkontakte/icons/dist/56/error_outline';
import IconCorona from '../../../img/icon_corona';
import IconPaper from '../../../img/icon_paper';
import IconBonus from '../../../img/icon_bonus';
import IconVkCoin from '../../../img/icon_vkcoin';
import IconWC from '../../../img/icon_wc';
import Socket from "../../../Socket";
import Server from "../../../Server";
import CardsManager from "./CardsManager";

const COINS_ICONS = {
    wc: IconWC,
    coins: IconVkCoin,
    corona: IconCorona,
    paper: IconPaper,
    bonus: IconBonus,
};

export default class Game21 extends React.Component {

    rid = -1;
    socket = null;
    reqGetUsers = false;
    isSendAction = false;

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
        this.socket.connect({game: 5}, () => {
            this.setState({
                popout: null,
                activePanel: 'error',
                panelErrorText: 'Ошибка подключения! Попробуйте чуть позже...'
            });
        });
    }

    componentDidMount() {
        this.showLoading();
        this.preloadCards = CardsManager.getAll();
        for (let image in this.preloadCards) {
            const img = new Image();
            img.src = this.preloadCards[image];
            window[this.preloadCards[image]] = img;
        }
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
            if (v < 7) {
                t = 0;
            } else if (v > 7) {
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
                        <p>Для проверки скопируйте строку и вставьте на любом сайте для хеширования по технологии md5
                            (например <Link href='https://decodeit.ru/md5'>тут</Link>). Если полученный хеш совпадает с
                            указанным в этом окне, то игра была честной.</p>
                    </Alert>
            })}>
                <div>{v}</div>
            </div>);
        }
        if (ret.length < 1) {
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
        if (this.state.gameData.state === 2) {
            return (<div className='buttonsBlock game'>
                <FormLayout className='form'>
                    <Button size="xl" onClick={this.onButtonGet} mode='commerce'
                            before={<Icon28CoinsOutline width={24} height={24}/>}>Взять еще</Button>
                    <Button size="xl" onClick={this.onButtonFinish} mode='destructive'
                            before={<Icon28CoinsOutline width={24} height={24}/>}>Стоп</Button>
                </FormLayout>
            </div>);
        }
        if (this.state.gameData.state === 3) {
            const SIcon = COINS_ICONS[SystemFunctions.getStaticVar('sCoin')];
            return (<div className='buttonsBlock results'>
                <FormLayout className='form'>
                    <FormStatus className='winStatus'
                                header={this.state.gameData.win > 0 ? (this.state.gameData.win > this.state.gameData.bet ? "Вы выиграли" : "Ничья") : "Вы проиграли"}
                                mode={this.state.gameData.win > 0 ? "default" : "error"}>
                        <div
                            className='verticalText'>{this.state.gameData.win > 0 ? SystemFunctions.formatNumber(this.state.gameData.win) : SystemFunctions.formatNumber(this.state.gameData.bet)}</div>
                        <SIcon className='vkIcon' width={12} height={12}/>
                        {this.state.gameData.win > 0 ?
                            <div style={{paddingLeft: '5px'}}
                                 className='verticalText'> (x{(this.state.gameData.win > this.state.gameData.bet ? 2 : 1)})</div> : null}
                    </FormStatus>
                    <Button size="xl" onClick={this.onButtonContinue}
                            before={<Icon24DoneOutline/>}>Продолжить</Button>
                </FormLayout>
            </div>);
        }
        let maxBet = this.state.userData[SystemFunctions.getStaticVar('sCoin')];
        if (maxBet > this.state.gameData.maxBet) {
            maxBet = this.state.gameData.maxBet;
        }
        return (<div className='buttonsBlock bets'>
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
                        <div className='mb n1' onClick={() => this.setState({
                            inputSend: Math.floor(this.state.inputSend / 2),
                            inputSendError: ''
                        })}>/2
                        </div>
                        <div className='mb n2' onClick={() => this.setState({
                            inputSend: Math.floor(this.state.inputSend * 2),
                            inputSendError: ''
                        })}>x2
                        </div>
                    </div>
                </div>
                <Button size="xl" onClick={this.onButtonBet}
                        before={
                            <Icon24DoneOutline/>}>Поставить</Button>
            </FormLayout>
        </div>);
    }

    renderTable = () => {
        if (this.state.gameData == null) {
            return null;
        }

        if (this.state.gameData.state === 1) {
            return (<div className='table'>
                <div className='info'>
                    <Icon28CoinsOutline width={56} height={56} className='waitIcon'/>
                    <div className='waitText'>Ваша ставка?</div>
                </div>
            </div>);
        } else {
            let botCards = [];
            let myCards = [];

            for (let i = 0; i < 5; i++) {
                let img = 'X';
                if (this.state.gameData.bot.length > i) {
                    img = this.state.gameData.bot[i]
                }

                let cardImg = this.preloadCards[img];
                botCards.push(<div
                    className={'card ' + (img !== 'X' ? 'show ' : '')}>
                    <div className={'main'}>
                        <img src={cardImg} alt={img}/>
                    </div>
                    <div className={'sec'}/>
                </div>);
            }
            for (let i = 0; i < 5; i++) {
                let img = 'X';
                if (this.state.gameData.my.length > i) {
                    img = this.state.gameData.my[i]
                }
                let cardImg = null;
                cardImg = this.preloadCards[img];
                myCards.push(<div
                    className={'card ' + (img !== 'X' ? 'show ' : '')}>
                    <div className={'main'}>
                        <img src={cardImg} alt={img}/>
                    </div>
                    <div className={'sec'}/>
                </div>);
            }

            return (<div className='tableWrapper'>
                <div className='table cards bot'>
                    <Header mode='secondary'
                            aside={<div className='sum'>{this.getCardsSum(this.state.gameData.bot)}</div>}>Карты
                        дилера</Header>
                    <div className='wrapper'>
                        {botCards}
                    </div>
                </div>
                <div className='table cards my'>
                    <Header mode='secondary'
                            aside={<div className='sum'>{this.getCardsSum(this.state.gameData.my)}</div>}>Ваши
                        карты</Header>
                    <div className='wrapper'>
                        {myCards}
                    </div>
                </div>
            </div>);
        }
    }

    renderUsers = () => {
        if (this.state.gameData == null || this.state.gameData.history == null || this.state.gameData.state > 1) {
            return null;
        }
        let ret = [];
        for (let i = 0; i < this.state.gameData.history.length; i++) {
            let uid = this.state.gameData.history[i][0];
            let cy = this.state.gameData.history[i][1];
            let bet = this.state.gameData.history[i][2];
            let win = this.state.gameData.history[i][3];
            let userScore = this.state.gameData.history[i][4];
            let botScore = this.state.gameData.history[i][5];
            let color = this.state.gameData.history[i][6];
            let nameServer = this.state.gameData.history[i][7];
            let crown = this.state.gameData.history[i][8];
            let name = '@' + uid;
            let photo = null;
            if (this.state.usersVkData[uid] == null) {
                this.getUsersInfo();
            } else {
                name = this.state.usersVkData[uid].first_name + ' ' + this.state.usersVkData[uid].last_name;
                photo = this.state.usersVkData[uid].photo_100;
            }
            let hv = this.state.gameData.historyHash[i];

            if (nameServer != null) {
                name = nameServer;
            }
            if (color == null) {
                color = 0;
            }
            const SIcon = COINS_ICONS[cy];
            ret.push(<SimpleCell className='betCell' before={<Avatar size={40} src={photo}
                                                                     onClick={() => SystemFunctions.openTab("https://vk.com/id" + uid)}>{crown != null && crown > 0 ?
                <div className='crown'>{crown}</div> : null}</Avatar>}
                                 description={win > 0 ? <span
                                         style={{'color': '#56be7e'}}><div
                                         className='verticalText'>+ {SystemFunctions.formatNumber(win)}</div><SIcon
                                         width={12} height={12} className='vkIcon'/><div
                                         className='verticalText' style={{marginLeft: '4px'}}>(x{win / bet})</div></span> :
                                     <span
                                         style={{'color': '#ee5e55'}}><div
                                         className='verticalText'>- {SystemFunctions.formatNumber(bet)}</div><SIcon
                                         width={12} height={12} className='vkIcon'/></span>}
                                 indicator={<div className='scores'>
                                     <div className={'my ' + (win > 0 ? 'win' : 'lose')}>{userScore}</div>
                                     <div className='bot'>{botScore}</div>
                                 </div>}
                                 onClick={() => this.setState({
                                     'popout':
                                         <Alert
                                             actions={[
                                                 {
                                                     title: 'СКОПИРОВАТЬ',
                                                     action: () => Server.copyText(hv[1] + '@' + hv[2]),
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
                                             <p>Результат игры: <b>{hv[2]}</b></p>
                                             <p>Строка для проверки: <b>{hv[1]}@{hv[2]}</b></p>
                                             <p>Хеш результата: <b>{hv[0]}</b></p>
                                             <p>Для проверки скопируйте строку и вставьте на любом сайте для хеширования
                                                 по технологии md5
                                                 (например <Link href='https://decodeit.ru/md5'>тут</Link>). Если
                                                 полученный хеш совпадает с
                                                 указанным в этом окне, то игра была честной.</p>
                                         </Alert>
                                 })}>
                <div className={'usersColorsBase-' + color}>{name}</div>
            </SimpleCell>);
        }
        return ret;
    }

    renderHash = () => {
        if (this.state.gameData == null) {
            return null;
        }
        if (this.state.gameData.hashPass == null) {
            return <Footer>Hash: {this.state.gameData.hash}</Footer>
        } else {
            return <Footer onClick={() => this.setState({
                'popout':
                    <Alert
                        actions={[
                            {
                                title: 'СКОПИРОВАТЬ',
                                action: () => Server.copyText(this.state.gameData.hashPass + '@' + this.state.gameData.hashV),
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
                        <p>Результат игры: <b>{this.state.gameData.hashV}</b></p>
                        <p>Строка для
                            проверки: <b>{this.state.gameData.hashPass}@{this.state.gameData.hashV}</b>
                        </p>
                        <p>Хеш результата: <b>{this.state.gameData.hash}</b></p>
                        <p>Для проверки скопируйте строку и вставьте на любом сайте для хеширования по технологии md5
                            (например <Link href='https://decodeit.ru/md5'>тут</Link>). Если полученный хеш
                            совпадает с
                            указанным в этом окне, то игра была честной.</p>
                    </Alert>
            })}>Hash: {this.state.gameData.hash}<br/>Check
                md5: {this.state.gameData.hashPass}@{this.state.gameData.hashV}
            </Footer>
        }
    }

    render() {
        return (
            <View className='game21' activePanel={this.state.activePanel} popout={this.state.popout} header={true}>
                <Panel id='game'>
                    <PanelHeader>
                        <PanelHeaderContent before={<PanelHeaderBack onClick={this.leave}/>}>
                            21 Очко
                        </PanelHeaderContent>
                    </PanelHeader>
                    <div className='gameContent'>
                        <div className='paddingWrapper'>
                            {this.renderBalanceBlock()}
                            {this.renderTable()}
                        </div>
                        {this.renderButtonsBlock()}
                        {this.renderHash()}
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
        if (this.state.userData[SystemFunctions.getStaticVar('sCoin')] < sum) {
            this.setState({inputSendError: 'Недостаточно средств! Ваш баланс: ' + this.state.userData[SystemFunctions.getStaticVar('sCoin')]});
            return;
        }
        this.socket.send({
            type: 'action',
            a: 'setBet',
            cy: SystemFunctions.getStaticVar('sCoin'),
            bet: sum,
        });
    }

    openCard = (id) => {
        this.socket.send({
            type: 'action',
            a: 'open',
            item: id,
        });
    }

    onButtonGet = () => {
        if (this.state.gameData == null) {
            return;
        }
        this.socket.send({
            type: 'action',
            a: 'get',
        });
    }

    onButtonFinish = () => {
        if (this.state.gameData == null) {
            return;
        }
        this.socket.send({
            type: 'action',
            a: 'finish',
        });
    }

    onButtonContinue = () => {
        if (this.state.gameData == null) {
            return;
        }
        this.socket.send({
            type: 'action',
            a: 'continue',
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
                if (msg.balance != null) {
                    let ud = this.state.userData;
                    for (const key in msg.balance) {
                        ud[key] = msg.balance[key];
                    }
                    SystemFunctions.saveStaticVar('userData', ud);
                    this.setState({
                        userData: ud,
                    });
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
            let users = [];
            let gu = '';

            if (this.state.gameData != null && this.state.gameData.history != null) {
                for (let i in this.state.gameData.history) {
                    let uid = this.state.gameData.history[i][0];
                    if (!SystemFunctions.in_array(users, uid)) {
                        gu += ',' + uid;
                        users.push(uid);
                    }
                }
            } else {
                this.reqGetUsers = false;
                return;
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

    getCardsSum = (cards) => {
        if (!Array.isArray(cards) || cards.length < 2) {
            return 0;
        }
        const CARDS36 = {

            D6: 6,
            H6: 6,
            C6: 6,
            S6: 6,
            D7: 7,
            H7: 7,
            C7: 7,
            S7: 7,
            D8: 8,
            H8: 8,
            C8: 8,
            S8: 8,
            D9: 9,
            H9: 9,
            C9: 9,
            S9: 9,
            D10: 10,
            H10: 10,
            C10: 10,
            S10: 10,
            DJ: 2,
            HJ: 2,
            CJ: 2,
            SJ: 2,
            DQ: 3,
            HQ: 3,
            CQ: 3,
            SQ: 3,
            DK: 4,
            HK: 4,
            CK: 4,
            SK: 4,
            DA: 11,
            HA: 11,
            CA: 11,
            SA: 11,

        };
        let sum = 0;
        if (cards[0].substr(1) === 'A' && cards[1].substr(1) === 'A') {
            sum = 'ЗОЛОТОЕ ОЧКО';
        } else for (let i = 0; i < cards.length; i++) {
            sum += CARDS36[cards[i]];
        }
        return sum;
    }

    showLoading = () => {
        this.setState({popout: <ScreenSpinner/>});
    }

    closePopout = () => {
        this.setState({popout: null});
    }
}
