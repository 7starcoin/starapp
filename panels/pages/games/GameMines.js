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
    Slider,
    Tappable,
    View,
} from "@vkontakte/vkui";
import './GameMines.scss';
import SystemFunctions from "../../../SystemFunctions";
import Icon24DoneOutline from '@vkontakte/icons/dist/24/done_outline';
import Icon28CoinsOutline from '@vkontakte/icons/dist/28/coins_outline';
import Icon28BombOutline from '@vkontakte/icons/dist/28/bomb_outline';
import Icon56ErrorOutline from '@vkontakte/icons/dist/56/error_outline';
import IconVkCoin from '../../../img/icon_vkcoin';
import IconWC from '../../../img/icon_wc';
import Socket from "../../../Socket";
import Server from "../../../Server";

export default class GameMines extends React.Component {

    rid = -1;
    socket = null;
    reqGetUsers = false;
    isSendAction = false;
    updateBombsInterval = null;

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
            bombs: 5,
        };
        this.connect();
        this.setAWCS();
        this.updateBombsInterval = setInterval(() => {
            if (this.socket == null || this.state == null || this.state.bombs == null){
                return;
            }
            if (this.state.gameData != null && this.state.bombs !== this.state.gameData.bombs && this.state.gameData.state === 1){
                this.socket.send({
                    type: 'action',
                    a: 'setBombs',
                    bombs: this.state.bombs,
                });
            }
        }, 1000);
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
        this.socket.connect({game: 4}, () => {
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
        return (<div className='balanceBlock'>
            <div className='verticalText'>Ваш баланс: {SystemFunctions.formatNumber(this.state.userData.coins, 0)}</div>
            <div className='chipsIcon'/>
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
                        <p>Для проверки скопируйте строку и вставьте на любом сайте для хешировния по технологии md5
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
        let cc = 1;
        if (this.state.gameData.state > 1){
            let openCount = -1;
            for (let i = 0; i < this.state.gameData.open.length; i++) {
                if (this.state.gameData.open[i] !== -1){
                    openCount++;
                }
            }
            if (openCount >= 0){
                cc = this.genCoefs(this.state.gameData.bombs)[openCount];
            }
        }
        if (this.state.gameData.state === 2) {
            return (<div className='buttonsBlock game'>
                <FormLayout className='form'>
                    <FormStatus className='winStatus'
                                header='Ваш выигрыш'>
                        <div
                            className='verticalText'>{this.state.gameData.win > 0 ? SystemFunctions.formatNumber(this.state.gameData.win) : SystemFunctions.formatNumber(this.state.gameData.bet)}</div>
                        <IconVkCoin className='vkIcon' width={12} height={12}/><div style={{paddingLeft: '5px'}} className='verticalText'> (x{SystemFunctions.reduceNumber(cc)})</div>
                    </FormStatus>
                    {cc === 1 ? null :
                    <Button size="xl" onClick={this.onButtonGetBet} mode='destructive'
                            before={<Icon28CoinsOutline width={24} height={24}/>}>Забрать выигрыш</Button> }
                </FormLayout>
            </div>);
        }
        if (this.state.gameData.state === 3) {
            return (<div className='buttonsBlock results'>
                <FormLayout className='form'>
                    <FormStatus className='winStatus'
                                header={this.state.gameData.win > 0 ? "Вы выиграли" : "Вы проиграли"}
                                mode={this.state.gameData.win > 0 ? "default" : "error"}>
                        <div
                            className='verticalText'>{this.state.gameData.win > 0 ? SystemFunctions.formatNumber(this.state.gameData.win) : SystemFunctions.formatNumber(this.state.gameData.bet)}</div>
                        <IconVkCoin className='vkIcon' width={12} height={12}/>
                        {this.state.gameData.win > 0 ?
                            <div style={{paddingLeft: '5px'}} className='verticalText'> (x{SystemFunctions.reduceNumber(cc)})</div> : null}
                    </FormStatus>
                    <Button size="xl" onClick={this.onButtonContinue}
                            before={<Icon24DoneOutline/>}>Продолжить</Button>
                </FormLayout>
            </div>);
        }
        let maxBet = this.state.userData.coins;
        if (maxBet > this.state.gameData.maxBet) {
            maxBet = this.state.gameData.maxBet;
        }
        let targetMin = this.state.bombs * 10000 - 1;
        let targetMax = 1000000 - this.state.bombs * 10000;
        return (<div className='buttonsBlock bets'>
            <FormLayout className='form'>
                <div className='betButtons'>
                    <Tappable className='betButton b1' size="l"
                              onClick={() => this.setState({inputSend: Math.floor(this.state.userData.coins / 4)})}>1/4</Tappable>
                    <Tappable className='betButton b2' size="l"
                              onClick={() => this.setState({inputSend: Math.floor(this.state.userData.coins / 3)})}>1/3</Tappable>
                    <Tappable className='betButton b3' size="l"
                              onClick={() => this.setState({inputSend: Math.floor(this.state.userData.coins / 2)})}>1/2</Tappable>
                    <Tappable className='betButton b4' size="l"
                              onClick={() => this.setState({inputSend: Math.floor(this.state.userData.coins)})}>ALL</Tappable>
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
                                   if (v > this.state.userData.coins) {
                                       v = this.state.userData.coins;
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
                <Button size="xl" onClick={this.onButtonBet}
                        before={<Icon24DoneOutline/>} {...(this.state.gameData.bombs !== this.state.bombs ? {disabled: 'disabled'} : {})}>Поставить</Button>
            </FormLayout>
        </div>);
    }

    renderTable = () => {
        let rCoefs = [];
        let gc = this.genCoefs(this.state.bombs);
        let startFrom = 0;
        let openCount = -1;
        if (this.state.gameData != null && this.state.gameData.state > 1){
            gc = this.genCoefs(this.state.gameData.bombs);
            openCount = -1;
            for (let i = 0; i < this.state.gameData.open.length; i++) {
                if (this.state.gameData.open[i] !== -1){
                    openCount++;
                }
            }
            if (openCount >= 0){
                startFrom = openCount;
            }
        }
        for (let i = startFrom; i < gc.length; i++) {
            rCoefs.push(<div className={'item ' + (this.state.gameData != null && this.state.gameData.state > 1 && i === openCount ? 'a' : '')}>
                <div className='game'>{i + 1} Hit</div>
                <div className='v'>x{SystemFunctions.reduceNumber(gc[i])}</div>
            </div>);
        }
        if (this.state.gameData != null) {
            if (this.state.gameData.state === 1) {
                return (<div className='table'>
                    <div className='info'>
                        <div className='bombs'>
                            <div className='title'>Бомбы</div>
                            <div className='value'>{this.state.bombs} шт.</div>
                        </div>
                        <div className='coef'>
                            <div className='title'>Коэффициент</div>
                            <div className='value'>x{SystemFunctions.formatNumber(gc[0], 2)}</div>
                        </div>
                    </div>
                    <FormLayout className='switchWrapper'>
                        <Slider
                            min={5}
                            max={24}
                            step={1}
                            value={this.state.bombs}
                            onChange={v => this.setState({bombs: v})}
                            defaultValue={this.state.betSlider}
                        />
                    </FormLayout>
                    <HorizontalScroll className='coefs'>
                        {rCoefs}
                    </HorizontalScroll>
                </div>);
            } else {
                let rf = [];
                for (let i = 0; i < 5; i++) {
                    let lr = [];
                    for (let j = 0; j < 5; j++) {
                        let id = i * 5 + j;
                        let cl = '';
                        if (this.state.gameData.open[id] !== -1){
                            cl = 'open';
                        }
                        if (this.state.gameData.state === 3) {
                            if (this.state.gameData.loseItem != null && this.state.gameData.loseItem === id){
                                cl = 'lose';
                            }
                            if (this.state.gameData.field[id] === false) {
                                lr.push(<div className={'item w ' + cl}><div className='ic'><Icon28CoinsOutline/></div></div>);
                            } else {
                                lr.push(<div className={'item b ' + cl}><div className='ic'><Icon28BombOutline/></div></div>);
                            }
                        } else {
                            if (this.state.gameData.open[id] === false) {
                                lr.push(<div className={'item w ' + cl}><div className='ic'><Icon28CoinsOutline/></div></div>);
                            } else if (this.state.gameData.open[id] === true) {
                                lr.push(<div className={'item b ' + cl}><div className='ic'><Icon28BombOutline/></div></div>);
                            } else {
                                lr.push(<div className={'item c' + cl} onClick={() => this.openCard(id)}><div className='ic'><Icon28BombOutline/></div></div>);
                            }
                        }
                    }
                    rf.push(<div className='line'>{lr}</div>);
                }

                return (<div className='table game'>
                    <div className='field'>
                        {rf}
                    </div>
                    <HorizontalScroll className='coefs'>
                        {rCoefs}
                    </HorizontalScroll>
                </div>);
            }
        } else {
            return null;
        }
    }

    renderUsers = () => {
        if (this.state.gameData == null || this.state.gameData.history == null || this.state.gameData.state > 1) {
            return null;
        }
        let ret = [];
        for (let i = 0; i < this.state.gameData.history.length; i++) {
            let uid = this.state.gameData.history[i][0];
            let bombs = this.state.gameData.history[i][1];
            let bet = this.state.gameData.history[i][2];
            let win = this.state.gameData.history[i][3];
            let coef = this.state.gameData.history[i][4];
            let color = this.state.gameData.history[i][5];
            let nameServer = this.state.gameData.history[i][6];
            let crown = this.state.gameData.history[i][7];
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

            ret.push(<SimpleCell className='betCell' before={<Avatar size={40} src={photo}
                                                                     onClick={() => SystemFunctions.openTab("https://vk.com/id" + uid)}>{crown != null && crown > 0 ? <div className='crown'>{crown}</div> : null}</Avatar>}
                                 description={win > 0 ? <span
                                         style={{'color': '#56be7e'}}><div
                                         className='verticalText'>+ {SystemFunctions.formatNumber(win)}</div><IconVkCoin
                                         width={12} height={12} className='vkIcon'/></span> :
                                     <span
                                         style={{'color': '#ee5e55'}}><div
                                         className='verticalText'>- {SystemFunctions.formatNumber(bet)}</div><IconVkCoin
                                         width={12} height={12} className='vkIcon'/></span>}
                                 indicator={<div className={'betCoef ' + (win > 0 ? 'win' : 'lose')}>x{SystemFunctions.reduceNumber(coef)}</div>}
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
                                             <p>Для проверки скопируйте строку и вставьте на любом сайте для хешировния
                                                 по технологии md5
                                                 (например <Link href='https://decodeit.ru/md5'>тут</Link>). Если
                                                 полученный хеш совпадает с
                                                 указанным в этом окне, то игра была честной.</p>
                                         </Alert>
                                 })}><div className={'usersColorsBase-' + color}>{name}</div></SimpleCell>);
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
                        <p>Для проверки скопируйте строку и вставьте на любом сайте для хешировния по технологии md5
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
            <View className='gameMines' activePanel={this.state.activePanel} popout={this.state.popout} header={true}>
                <Panel id='game'>
                    <PanelHeader>
                        <PanelHeaderContent before={<PanelHeaderBack onClick={this.leave}/>}>
                            Mines
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
        if (sum == null || sum < 100000) {
            this.setState({inputSendError: 'Ставка должна быть не менее 100 000 VKC!'});
            return;
        }
        if (sum > this.state.gameData.maxBet) {
            this.setState({inputSendError: 'Ставка должна быть не более ' + SystemFunctions.formatNumber(this.state.gameData.maxBet) + ' VKC!'});
            return;
        }
        if (this.state.userData.coins < sum) {
            this.setState({inputSendError: 'Недостаточно средств! Ваш баланс: ' + this.state.userData.coins});
            return;
        }
        this.socket.send({
            type: 'action',
            a: 'setBet',
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

    onButtonGetBet = () => {
        if (this.state.gameData == null) {
            return;
        }
        this.socket.send({
            type: 'action',
            a: 'getBet',
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
                    ud.coins = msg.balance;
                    SystemFunctions.saveStaticVar('userData', ud);
                    this.setState({
                        userData: ud
                    })
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
                ud.coins = msg.balance;
                SystemFunctions.saveStaticVar('userData', ud);
                this.setState({
                    userData: ud
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

    genCoefs = (bombs) => {
        let all = 25;
        let c = 1;
        let r = [];

        for (let i = 0; i < all - bombs; i++) {
            c *= 1 - bombs / (25 - i);
            let cn = Math.floor(0.9 / c * 100) / 100;
            r.push(cn);
        }
        return r;
    }

    showLoading = () => {
        this.setState({popout: <ScreenSpinner/>});
    }

    closePopout = () => {
        this.setState({popout: null});
    }
}
