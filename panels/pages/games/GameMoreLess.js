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
    Snackbar,
    Tappable,
    View,
} from "@vkontakte/vkui";
import './GameMoreLess.scss';
import SystemFunctions from "../../../SystemFunctions";
import Icon24DoneOutline from '@vkontakte/icons/dist/24/done_outline';
import Icon28FireOutline from '@vkontakte/icons/dist/28/fire_outline';
import Icon56ErrorOutline from '@vkontakte/icons/dist/56/error_outline';
import Icon56DiamondOutline from '@vkontakte/icons/dist/56/diamond_outline';
import IconVkCoin from '../../../img/icon_vkcoin';
import IconWC from '../../../img/icon_wc';
import Socket from "../../../Socket";
import Server from "../../../Server";
import ThimbleImage from "../../../img/thimble.png";
import ThimbleGreyImage from "../../../img/thimble-grey.png";
import CoinsImage from "../../../img/coins.png";
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

export default class GameMoreLess extends React.Component {

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
            snackbar: null,

            token: sFreeToken == null ? null : sFreeToken,
            userData: sUserData == null ? null : sUserData,
            gameData: null,
            usersVkData: {},
            number1: 0,
            number2: -1,

            inputSend: '',
            inputSendError: '',
            publish: false,
            publish2: false,
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
        this.socket.connect({game: 8}, () => {
            this.setState({
                popout: null,
                activePanel: 'error',
                panelErrorText: 'Ошибка подключения! Попробуйте чуть позже...'
            });
        });
    }

    componentDidMount() {
        this.showLoading();
        const img1 = new Image();
        img1.src = ThimbleImage;
        window[ThimbleImage] = img1;
        const img2 = new Image();
        img2.src = ThimbleGreyImage;
        window[ThimbleGreyImage] = img2;
        const img3 = new Image();
        img3.src = CoinsImage;
        window[CoinsImage] = img3;
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
        if (this.state.gameData.state === 2) {
            if (!this.state.publish2){
                return null;
            }
            let coefs = this.calcCoef(this.state.gameData.n1);
            return (<div className='buttonsBlock game'>
                <FormLayout className='form'>
                    <FormStatus className='winStatusDef'
                                header="Каким будет второе число?"
                                mode={"default"}>
                        <div
                            className='verticalText'>Больше, меньше или таким же?
                        </div>
                    </FormStatus>
                    <div className='paddingWrapper'>
                        <div className='dirButtons'>
                            <div className={'button b1' + (coefs[0] === -1 ? ' dis' : '')} onClick={coefs[0] === -1 ? () => {} : () => this.openNumber(0)}>
                                <div className='title'>Меньше</div>
                                <div className='coef'>{coefs[0] === -1 ? '-' : 'x' + coefs[0]}</div>
                            </div>
                            <div className='button b2' onClick={() => this.openNumber(1)}>
                                <div className='title'>Равно</div>
                                <div className='coef'>x{coefs[1]}</div>
                            </div>
                            <div className={'button b3' + (coefs[2] === -1 ? ' dis' : '')} onClick={coefs[2] === -1 ? () => {} : () => this.openNumber(2)}>
                                <div className='title'>Больше</div>
                                <div className='coef'>{coefs[2] === -1 ? '-' : 'x' + coefs[2]}</div>
                            </div>
                        </div>
                        <div className='otherButtons'>
                            <div className={'button b1'} onClick={() => this.openNumber(3)}>
                                <div className='title'>Четное</div>
                                <div className='coef'>x1.9</div>
                            </div>
                            <div className={'button b2'} onClick={() => this.openNumber(4)}>
                                <div className='title'>Нечетное</div>
                                <div className='coef'>x1.9</div>
                            </div>
                        </div>
                    </div>
                </FormLayout>
            </div>);
        }
        if (this.state.gameData.state === 3) {
            if (!this.state.publish){
                return null;
            }
            const SIcon = COINS_ICONS[SystemFunctions.getStaticVar('sCoin')];
            return (<div className='buttonsBlock results'>
                <FormLayout className='form'>
                    <FormStatus className='winStatus'
                                header={this.state.gameData.win > 0 ? "Вы выиграли" : "Вы проиграли"}
                                mode={this.state.gameData.win > 0 ? "default" : "error"}>
                        <div
                            className='verticalText'>{this.state.gameData.win > 0 ? SystemFunctions.formatNumber(this.state.gameData.win) : SystemFunctions.formatNumber(this.state.gameData.bet)}</div>
                        <SIcon className='vkIcon' width={12} height={12}/>
                        {this.state.gameData.win > 0 ?
                            <div style={{paddingLeft: '5px'}}
                                 className='verticalText'> (x{this.state.gameData.winCoef})</div> : null}
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
                        <div className='mb n1' onClick={() => this.setState({inputSend: Math.floor(this.state.inputSend / 2), inputSendError: ''})}>/2</div>
                        <div className='mb n2' onClick={() => this.setState({inputSend: Math.floor(this.state.inputSend * 2), inputSendError: ''})}>x2</div>
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
        switch (this.state.gameData.state) {
            case 1:
                return (<div className='table'>
                    <div className='info'>
                        <Icon56DiamondOutline className='waitIcon'/>
                        <div className='waitText'>Ваша ставка?</div>
                    </div>
                </div>);
            case 2:
                return (<div className='table'>
                    <div className='wrapper'>
                        <div className='num1'>{("0" + this.state.number1).substr(-2)}</div>
                        <div className={'num2 secret'}>{this.state.number2 < 0 ? '??' : ("0" + this.state.number2).substr(-2)}</div>
                    </div>
                </div>);
            case 3:
                return (<div className='table'>
                    <div className='wrapper'>
                        <div className='num1'>{("0" + this.state.number1).substr(-2)}</div>
                        <div className={'num2 ' + (this.state.publish ? (this.state.gameData.win > 0 ? 'win' : 'lose') : '')}>{this.state.number2 < 0 ? '??' : ("0" + this.state.number2).substr(-2)}</div>
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
            let winCoef = this.state.gameData.history[i][4];
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
            const SIcon = COINS_ICONS[cy];
            ret.push(<SimpleCell className='betCell' before={<Avatar size={40} src={photo}
                                                                     onClick={() => SystemFunctions.openTab("https://vk.com/id" + uid)}>{crown != null && crown > 0 ? <div className='crown'>{crown}</div> : null}</Avatar>}
                                 description={win > 0 ? <span
                                         style={{'color': '#56be7e'}}><div
                                         className='verticalText'>+ {SystemFunctions.formatNumber(win)}</div><SIcon
                                         width={12} height={12} className='vkIcon'/></span> :
                                     <span
                                         style={{'color': '#ee5e55'}}><div
                                         className='verticalText'>- {SystemFunctions.formatNumber(bet)}</div><SIcon
                                         width={12} height={12} className='vkIcon'/></span>}
                                 indicator={win > 0 ? <div className='coef'>x{winCoef}</div> : null}
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
            <View className='gameMoreLess' activePanel={this.state.activePanel} popout={this.state.popout}
                  header={true}>
                <Panel id='game'>
                    <PanelHeader>
                        <PanelHeaderContent before={<PanelHeaderBack onClick={this.leave}/>}>
                            MoreLess
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
                    {this.state.snackbar}
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
        this.socket.send({
            type: 'action',
            cy: SystemFunctions.getStaticVar('sCoin'),
            a: 'setBet',
            bet: sum,
        });
    }

    openNumber = (dir) => {
        this.socket.send({
            type: 'action',
            a: 'open',
            dir: dir,
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
                if (this.state.publish2 && (msg.state === 0 || msg.state === 1 || msg.state === 3)){
                    this.setState({publish2: false});
                }
                if (this.state.publish && (msg.state === 0 || msg.state === 1 || msg.state === 2)){
                    this.setState({publish: false, number2: -1});
                }
                if (this.state.gameData != null && msg.state === 2 && this.state.gameData.state !== 2){
                    let c = 0;
                    let setRand = () => {
                        let r = SystemFunctions.rand(0, 99);
                        if (c > 10){
                            this.setState({publish2: true, number1: msg.n1});
                            return;
                        } else {
                            this.setState({number1: r});
                        }
                        c++;
                        setTimeout(setRand, 40);
                    }
                    setRand();
                }
                if (this.state.gameData != null && msg.state === 3 && this.state.gameData.state !== 3){
                    let c = 0;
                    let setRand = () => {
                        let r = SystemFunctions.rand(0, 99);
                        if (c > 10){
                            this.setState({publish: true, number2: msg.n2});
                            return;
                        } else {
                            this.setState({number2: r});
                        }
                        c++;
                        setTimeout(setRand, 40);
                    }
                    setRand();
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
            case 'x3':
                this.setState({
                    snackbar: <Snackbar style={{zIndex: 1000}}
                                        duration={10000}
                                        onClose={() => this.setState({snackbar: null})}
                                        before={<Avatar size={36}
                                                        style={{background: '#ff1744'}}><Icon28FireOutline width={24}
                                                                                                           height={24}
                                                                                                           fill='#ffffff'/></Avatar>}
                    >Вы угадали стаканчик с первой попытки 3 раза подряд! Ваш
                        приз: <b>{SystemFunctions.formatNumber(msg.sum)}</b> VKC!</Snackbar>
                });
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

    calcCoef = (num) => {
        return [
            num <= 0 ? -1 : SystemFunctions.round(1 / (num / 100) * 0.95, 2), // <
            SystemFunctions.round(1 / (1 / 100) * 0.95, 2), // =
            num >= 99 ? -1 : SystemFunctions.round(1 / ((99 - num) / 100) * 0.95, 2) // >
        ];
    }

    showLoading = () => {
        this.setState({popout: <ScreenSpinner/>});
    }

    closePopout = () => {
        this.setState({popout: null});
    }
}
