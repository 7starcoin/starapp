import React from "react";
import {
    Alert,
    Avatar,
    Button,
    Cell,
    Footer,
    FormLayout,
    Header,
    HorizontalScroll,
    InfoRow,
    Input,
    Link,
    ModalCard,
    ModalPage,
    ModalPageHeader,
    ModalRoot,
    Panel,
    PanelHeader,
    PanelHeaderBack,
    PanelHeaderClose,
    PanelHeaderContent,
    Placeholder,
    ScreenSpinner,
    Slider,
    View,
} from "@vkontakte/vkui";
import './GameWheel.scss';
import SystemFunctions from "../../../SystemFunctions";
import Icon24DoneOutline from '@vkontakte/icons/dist/24/done_outline';
import Icon24LinkCircle from '@vkontakte/icons/dist/24/link_circle';
import Icon56ErrorOutline from '@vkontakte/icons/dist/56/error_outline';
import Icon56RecentOutline from '@vkontakte/icons/dist/56/recent_outline';
import Socket from "../../../Socket";
import Server from "../../../Server";
import IconCorona from '../../../img/icon_corona';
import IconPaper from '../../../img/icon_paper';
import IconBonus from '../../../img/icon_bonus';
import IconVkCoin from '../../../img/icon_vkcoin';
import IconWC from '../../../img/icon_wc';

const COINS_ICONS = {
    wc: IconWC,
    coins: IconVkCoin,
    corona: IconCorona,
    paper: IconPaper,
    bonus: IconBonus,
};

const numbersColors = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1];

export default class GameWheel extends React.Component {

    rid = -1;
    socket = null;
    reqGetUsers = false;
    isSendAction = false;

    wheelDeg = 0;

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

            inputSend: 100000,
            inputSendError: '',
            betSlider: 1,
            betChip: 100000,
            selectedType: '1',
            stateText: '',

            publish: false,
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
        this.socket.connect({game: 2}, () => {
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
            let t = 'black';
            if (v === 0) {
                t = 'green';
            } else if (numbersColors[v - 1] === 1) {
                t = 'red';
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

    renderMyBets = () => {
        if (this.state.gameData == null || this.state.gameData.bets[Server.user_id] == null) {
            return null;
        }
        const bets = this.state.gameData.bets[Server.user_id];
        let ret = [];

        let sortable = [];
        for (let type in bets) {
            sortable.push([type, bets[type]]);
        }
        sortable.sort(function (a, b) {
            return b[1] - a[1];
        });
        for (let i = 0; i < sortable.length; i++) {
            let type = sortable[i][0];
            if (type === 'win') {
                continue;
            }
            let v = sortable[i][1];
            let t = 0;
            let text = this.betTypeToText(type, true);
            if (type !== '0') {
                if (SystemFunctions.isNumeric(type)) {
                    if (numbersColors[parseInt(type) - 1] === 1) {
                        t = 'red';
                    } else {
                        t = 'black';
                    }
                } else {
                    t = type;
                }
            } else {
                t = type;
            }
            let subT = '';
            if (this.state.gameData.state === 3 && this.state.publish) {
                if (this.isWinBet(type, this.state.gameData.win)) {
                    subT = ' win';
                } else {
                    subT = ' lose';
                }
            }
            const SIcon = COINS_ICONS[this.state.gameData.ud[Server.user_id].cy];
            ret.push(<div className={'itemWrapper' + subT} onClick={() => this.openBet(type)}>
                <div className={'item type-' + t}>
                    <div>{text}</div>
                </div>
                <div className='bet'><SIcon width={13} height={13} className='vkIcon'/><div className='verticalText'>{SystemFunctions.reduceNumber(v)}</div></div>
            </div>);
        }
        if (ret.length < 1) {
            return null;
        }
        return (<div className='myBets'>
            <Header mode={'secondary'}>МОИ СТАВКИ</Header>
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
                return (<div className='buttonsBlock'>
                    <FormLayout className='form'>
                        <div className='buttonsWrapper'>
                            <Header mode='secondary'>Стол ставок</Header>
                            <div className='betButtons'>
                                <div className='betButton red'
                                     onClick={() => this.openBet('red')}>Красное
                                </div>
                                <div className='betButton black'
                                     onClick={() => this.openBet('black')}>Черное
                                </div>
                            </div>
                            <div className='betButtons'>
                                <div className='betButton even'
                                     onClick={() => this.openBet('even')}>Четное
                                </div>
                                <div className='betButton odd'
                                     onClick={() => this.openBet('odd')}>Нечетное
                                </div>
                            </div>
                            <div className='betButtons'>
                                <div className='betButton range1'
                                     onClick={() => this.openBet('range1')}>1 - 18
                                </div>
                                <div className='betButton n0'
                                     onClick={() => this.openBet('0')}>0
                                </div>
                                <div className='betButton range2'
                                     onClick={() => this.openBet('range2')}>19 - 36
                                </div>
                            </div>
                            <div className='betButtons'>
                                <div className='betButton range3'
                                     onClick={() => this.openBet('range3')}>1 - 12
                                </div>
                                <div className='betButton range4'
                                     onClick={() => this.openBet('range4')}>13 - 24
                                </div>
                                <div className='betButton range5'
                                     onClick={() => this.openBet('range5')}>25 - 36
                                </div>
                            </div>
                            <div className='betButtons'>
                                <div className='betButton selectNumber'
                                     onClick={() => this.setState({activeModal: 'selectNumber'})}><Icon24LinkCircle
                                    width={16} height={16}/>
                                    <div className='verticalText'>Поставить на число</div>
                                </div>
                            </div>
                        </div>
                    </FormLayout>
                </div>);
            case 3:
                const bets = this.state.gameData.bets[Server.user_id];
                if (bets == null || !this.state.publish) {
                    return null;
                }
                let start = 0;

                for (let type in bets) {
                    if (type === 'win') {
                        continue;
                    }
                    start += bets[type];
                }
                let rType = true;
                if (start > bets.win) {
                    rType = false;
                }
                return (<div className='paddingWrapper'>
                    <div className='betResults'>
                        <div className='start'>
                            <div className='text'>Ваши ставки:</div>
                            <div className='num'>{SystemFunctions.formatNumber(start, 0)}</div>
                        </div>
                        <div className='win'>
                            <div className='text'>Выигрыш:</div>
                            <div className='num'>{SystemFunctions.formatNumber(bets.win, 0)}</div>
                        </div>
                        <div className={'result ' + (rType ? 'plus' : 'minus')}>
                            <div className='text'>Итого:</div>
                            <div
                                className='num'>{rType ? '+' : ''}{SystemFunctions.formatNumber(bets.win - start, 0)}</div>
                        </div>
                    </div>
                </div>);
        }
    }

    renderWheel = () => {
        if (this.state.gameData == null) {
            return null;
        }
        if (this.state.gameData.state === 3) {
            const visualProps = [
                180, //0
                44, //1
                238, //2
                161, //3
                219, //4
                5, //5
                277, //6
                122, //7
                336, //8
                83, //9
                355, //10
                316, //11
                141, //12
                297, //13
                63, //14
                200, //15
                24, //16
                258, //17
                102, //18
                209, //19
                54, //20
                229, //21
                93, //22
                345, //23
                15, //24
                248, //25
                170, //26
                287, //27
                131, //28
                112, //29
                326, //30
                73, //31
                190, //32
                34, //33
                268, //34
                151, //35
                307, //36
            ];
            let winNumber = this.state.gameData.win;
            let wheelDeg = this.wheelDeg;
            let ballDeg = visualProps[winNumber] + wheelDeg;
            let renderResults = '';
            if (this.state.publish && this.state.gameData.state === 3) {
                let t = 'black';
                if (this.state.gameData.win === 0) {
                    t = 'green';
                } else if (numbersColors[this.state.gameData.win - 1] === 1) {
                    t = 'red';
                }
                renderResults = <div className={'results ' + t}>
                    <div>{this.state.gameData.win}</div>
                </div>;
            }
            return (<div className={'wheelBlock state' + this.state.gameData.state}>
                <div className='wheelObject'>
                    <div className='wrapper'>
                        <div className='wheelRotators' style={{transform: `rotateZ(${wheelDeg}deg)`}}>
                            <div className='wheel'/>
                        </div>
                        <div className='ballRotators' style={{transform: `rotateZ(${ballDeg}deg)`}}>
                            <div className='ballWrapper'>
                                <div className='ball'/>
                            </div>
                        </div>
                    </div>
                    {renderResults}
                </div>
            </div>);
        } else {
            if (this.state.gameData.state === 0) {
                return (<div className={'wheelBlock state' + this.state.gameData.state}>
                    <Icon56RecentOutline className='waitIcon'/>
                    <div className='waitText'>Ожидание ставок...</div>
                </div>);
            } else {
                return (<div className={'wheelBlock state' + this.state.gameData.state}>
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
        for (let uid in this.state.gameData.bets) {
            let name = '@' + uid;
            let photo = null;
            if (this.state.usersVkData[uid] == null) {
                this.getUsersInfo();
            } else {
                name = this.state.usersVkData[uid].first_name + ' ' + this.state.usersVkData[uid].last_name;
                photo = this.state.usersVkData[uid].photo_100;
            }

            const bets = this.state.gameData.bets[uid];
            let retBets = [];

            let sortable = [];
            for (let type in bets) {
                sortable.push([type, bets[type]]);
            }
            sortable.sort(function (a, b) {
                return b[1] - a[1];
            });
            for (let i = 0; i < sortable.length; i++) {
                let type = sortable[i][0];
                if (type === 'win') {
                    continue;
                }
                let v = sortable[i][1];
                let t = 0;
                let text = this.betTypeToText(type, true);
                if (type !== '0') {
                    if (SystemFunctions.isNumeric(type)) {
                        if (numbersColors[parseInt(type) - 1] === 1) {
                            t = 'red';
                        } else {
                            t = 'black';
                        }
                    } else {
                        t = type;
                    }
                } else {
                    t = type;
                }
                let subT = '';
                if (this.state.gameData.state === 3 && this.state.publish) {
                    if (this.isWinBet(type, this.state.gameData.win)) {
                        subT = ' win';
                    } else {
                        subT = ' lose';
                    }
                }
                const SIcon = COINS_ICONS[this.state.gameData.ud[uid].cy];
                retBets.push(<div className={'itemWrapper' + subT} onClick={() => this.openBet(type)}>
                    <div className={'item type-' + t}>
                        <div>{text}</div>
                    </div>
                    <div className='bet'><SIcon width={10} height={10} className='vkIcon'/><div className='verticalText'>{SystemFunctions.reduceNumber(v)}</div></div>
                </div>);
            }
            let color = 0;
            let crown = null;
            if (this.state.gameData.ud[uid] != null) {
                if (this.state.gameData.ud[uid].userName != null) {
                    name = this.state.gameData.ud[uid].userName;
                }
                color = this.state.gameData.ud[uid].userColor;
                if (color == null) {
                    color = 0;
                }
                crown = this.state.gameData.ud[uid].userCrown;
            }
            ret.push(<Cell className='betCell' before={<Avatar size={40} src={photo}
                                                               onClick={() => SystemFunctions.openTab("https://vk.com/id" + uid)}>{crown != null && crown > 0 ? <div className='crown'>{crown}</div> : null}</Avatar>}
                           size='l'
                           description={<div className='usersListBets'>{retBets}</div>}><div className={'usersColorsBase-' + color}>{name}</div></Cell>);
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
                return <Footer
                    onClick={() => this.setState({
                        'popout':
                            <Alert
                                actions={[
                                    {
                                        title: 'СКОПИРОВАТЬ',
                                        action: () => Server.copyText(this.state.gameData.hashPass + '@' + this.state.gameData.win),
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
                                <p>Результат игры: <b>{this.state.gameData.win}</b></p>
                                <p>Строка для проверки: <b>{this.state.gameData.hashPass}@{this.state.gameData.win}</b></p>
                                <p>Хеш результата: <b>{this.state.gameData.hash}</b></p>
                                <p>Для проверки скопируйте строку и вставьте на любом сайте для хешировния по технологии md5
                                    (например <Link href='https://decodeit.ru/md5'>тут</Link>). Если полученный хеш совпадает с
                                    указанным в этом окне, то игра была честной.</p>
                            </Alert>
                    })}>Hash: {this.state.gameData.hash}<br/>Check
                    md5: {this.state.gameData.hashPass}@{this.state.gameData.win}</Footer>
            default:
                return null;
        }
    }

    srcLoader = () => {
        return (<div className='srcLoader'>
            <div className='wheel'/>
            <div className='wheelBall'/>
        </div>);
    }

    render() {
        return (
            <View className='gameWheel' activePanel={this.state.activePanel} popout={this.state.popout} header={true}
                  modal={this.getLocalModal()}>
                <Panel id='game'>
                    <PanelHeader>
                        <PanelHeaderContent before={<PanelHeaderBack onClick={this.leave}/>}>
                            Wheel
                        </PanelHeaderContent>
                    </PanelHeader>
                    <div className='gameContent'>
                        <div className='paddingWrapper'>
                            {this.renderBalanceBlock()}
                            {this.renderHistory()}
                            {this.renderWheel()}
                            {this.renderMyBets()}
                        </div>
                        {this.renderButtonsBlock()}
                        {this.renderUsers()}
                        {this.renderHash()}
                        {this.srcLoader()}
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

    renderModalBet = () => {
        if (this.state.userData == null || this.state.gameData == null) {
            return null;
        }
        const updateBetChip = (v) => {
            let max = Math.floor(this.state.userData[SystemFunctions.getStaticVar('sCoin')] / v);
            let newBetSlider = this.state.betSlider > max ? max : this.state.betSlider;
            this.setState({betChip: v, inputSend: v * newBetSlider, betSlider: newBetSlider});
        }
        let betChips = {
            '100K': 100000,
            '500K': 500000,
            '2.5KK': 2500000,
            '10KK': 10000000,
        };
        if (SystemFunctions.getStaticVar('sCoin') === 'wc'){
            betChips = {
                '1K': 1000,
                '50K': 50000,
                '250K': 250000,
                '1KK': 1000000,
                '5KK': 5000000,
                '25KK': 25000000,
            };
        }
        let renderBetChips = [];
        for (let nt in betChips) {
            let v = betChips[nt];
            if (this.state.userData[SystemFunctions.getStaticVar('sCoin')] < v) {
                renderBetChips.push(<div className={'chip disabled'}>{nt}</div>);
            } else {
                renderBetChips.push(<div className={'chip ' + (this.state.betChip === v ? 'selected' : '')}
                                         onClick={() => updateBetChip(v)}>{nt}</div>);
            }
        }

        let maxChips = Math.floor(this.state.userData[SystemFunctions.getStaticVar('sCoin')] / this.state.betChip);
        if (maxChips > 100) {
            maxChips = 100;
        }
        if (maxChips < 2) {
            maxChips = 2;
        }

        const SIcon = COINS_ICONS[SystemFunctions.getStaticVar('sCoin')];
        return (<FormLayout className='form modalBet'>
            <div className='paddingWrapper curBet'>
                <InfoRow header="Текущая ставка">
                    <div
                        className='verticalText'>{this.state.gameData.bets[Server.user_id] == null || this.state.gameData.bets[Server.user_id][this.state.selectedType] == null ? 0 : SystemFunctions.formatNumber(this.state.gameData.bets[Server.user_id][this.state.selectedType])}</div>
                    <SIcon width={14} height={14} className='vkIcon'/>
                </InfoRow>
            </div>
            <div className='selectBetChip'>
                <InfoRow header="Номинал фишек">
                    {renderBetChips}
                </InfoRow>
            </div>
            <Slider
                min={1}
                max={maxChips}
                step={1}
                onChange={v => this.setState({betSlider: v, inputSend: v * this.state.betChip})}
                defaultValue={this.state.betSlider}
                top={`Количество фишек: ${this.state.betSlider}`}
            />
            <Input id="inputSum"
                   placeholder={"Сумма ставки:"}
                   inputmode="numeric"
                   value={SystemFunctions.formatNumber(this.state.inputSend, 0)}
                   alignment="center"
                   onChange={(e) => {
                       let v = '' + e.target.value;
                       v = v.replace(/[^0123456789]/g, '');
                       if (v !== '' && !SystemFunctions.isNumeric(v)) {
                           return;
                       }
                       if (v < 0) {
                           v = 0;
                       }
                       if (v > 100000000000) {
                           v = 100000000000;
                       }
                       if (v > this.state.userData[SystemFunctions.getStaticVar('sCoin')]) {
                           v = this.state.userData[SystemFunctions.getStaticVar('sCoin')];
                       }
                       this.setState({
                           inputSendError: '',
                           inputSend: v,
                       });
                   }}
                   status={this.state.inputSendError === '' ? 'default' : 'error'}
                   bottom={this.state.inputSendError === '' ? '' : this.state.inputSendError}/>
            <Button size="xl" onClick={this.onButtonBet}
                    before={<Icon24DoneOutline/>}>Добавить ставку</Button>
        </FormLayout>);
    }

    renderModalSelectNum = () => {
        let r = [];
        for (let i = 0; i < numbersColors.length; i++) {
            r.push(<div className={'number c' + numbersColors[i]}
                        onClick={() => this.openBet('' + (i + 1))}>{i + 1}</div>);
        }
        return (<div className='modal selectNumber'>
            <div className='wrapper'>
                {r}
            </div>
        </div>);
    }

    getLocalModal = () => {
        return (<ModalRoot activeModal={this.state.activeModal}>
                <ModalPage
                    id='selectNumber'
                    onClose={this.closeModal}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Ставка на число
                        </ModalPageHeader>
                    }
                >
                    {this.renderModalSelectNum()}
                </ModalPage>
                <ModalPage
                    id='bet'
                    dynamicContentHeight={true}
                    onClose={this.closeModal}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Ставка на {this.betTypeToText(this.state.selectedType)} (x{this.getCoefByType(this.state.selectedType)})
                        </ModalPageHeader>
                    }
                >
                    {this.renderModalBet()}
                </ModalPage>

                <ModalCard
                    id='error'
                    onClose={this.closeModal}
                    icon={<Icon56ErrorOutline style={{color: '#ef5350'}}/>}
                    header="Ошибка!"
                    caption={this.state.errorText}
                    actions={[
                        {
                            title: 'Закрыть',
                            mode: 'primary',
                            action: () => this.closeModal()
                        }
                    ]}
                />
            </ModalRoot>
        );
    }

    openBet = (type) => {
        if (this.state.gameData == null || this.state.gameData.state === 3) {
            return;
        }
        this.setState({
            activeModal: 'bet',
            selectedType: type,
        });
    }

    betTypeToText = (type, min = false) => {
        switch (type) {
            case 'even':
                if (min) {
                    return 'Четн';
                } else {
                    return 'Четное';
                }
            case 'odd':
                if (min) {
                    return 'Нечетн';
                } else {
                    return 'Нечетное';
                }
            case 'red':
                if (min) {
                    return 'Красн';
                } else {
                    return 'Красное';
                }
            case 'black':
                if (min) {
                    return 'Черн';
                } else {
                    return 'Черное';
                }
            case 'range1':
                return '1 - 18';
            case 'range2':
                return '19 - 36';
            case 'range3':
                return '1 - 12';
            case 'range4':
                return '13 - 24';
            case 'range5':
                return '25 - 36';
            default:
                return type;
        }
    }

    getCoefByType = (type) => {
        switch (type) {
            case 'even':
                return 2;
            case 'odd':
                return 2;
            case 'red':
                return 2;
            case 'black':
                return 2;
            case 'range1':
                return 2;
            case 'range2':
                return 2;
            case 'range3':
                return 3;
            case 'range4':
                return 3;
            case 'range5':
                return 3;
            default:
                return 36;
        }
    }

    onInputChangeBet = () => {
        this.setState({betAlertType: '', betAlertText: ''});
    }

    onButtonBet = () => {
        if (this.state.gameData == null || this.state.gameData.state === 3) {
            return;
        }
        let sum = parseFloat(this.state.inputSend);
        if (sum == null || sum < 1) {
            this.setState({inputSendError: 'Ставка должна быть не менее 1!'});
            return;
        }
        if (sum > 100000000000) {
            this.setState({inputSendError: 'Ставка должна быть не более 100 000 000 000 VKC!'});
            return;
        }
        if (this.socket != null) {
            this.socket.send({
                type: 'action',
                a: 'setBet',
                t: this.state.selectedType,
                cy: SystemFunctions.getStaticVar('sCoin'),
                bet: sum,
            });
        }
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
                if (this.state.gameData == null && msg.state === 3) {
                    this.setState({publish: true});
                }
                if (this.state.gameData != null && this.state.gameData.state !== msg.state) {
                    if (msg.state === 1) {
                        this.setState({publish: false});
                    }
                    if (msg.state === 3) {
                        this.closeModal();
                        this.wheelDeg = SystemFunctions.rand(0, 359);
                        setTimeout(() => {
                            this.setState({publish: true});
                        }, 11000);
                    }
                    if (msg.state === 0) {
                        this.setState({stateText: '', publish: false});
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
                } else {
                    this.closeModal();
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
        // this.props.go('home');
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

    isWinBet = (type, win) => {
        if (SystemFunctions.isNumeric(type)) {
            if (parseInt(type) === win) {
                return true;
            }
            return false;
        }
        if (win === 0){
            return false;
        }
        switch (type) {
            case 'even':
                if (win % 2 === 0) {
                    return true;
                }
                break;
            case 'odd':
                if (win % 2 !== 0) {
                    return true;
                }
                break;
            case 'red':
                if (numbersColors[win - 1] === 1) {
                    return true;
                }
                break;
            case 'black':
                if (numbersColors[win - 1] === 0) {
                    return true;
                }
                break;
            case 'range1':
                if (win >= 1 && win <= 18) {
                    return true;
                }
                break;
            case 'range2':
                if (win >= 19 && win <= 36) {
                    return true;
                }
                break;
            case 'range3':
                if (win >= 1 && win <= 12) {
                    return true;
                }
                break;
            case 'range4':
                if (win >= 13 && win <= 24) {
                    return true;
                }
                break;
            case 'range5':
                if (win >= 25 && win <= 36) {
                    return true;
                }
                break;
        }
        return false;
    }

    showLoading = () => {
        this.setState({popout: <ScreenSpinner/>});
    }

    closeModal = () => {
        this.setState({activeModal: null});
    }

    closePopout = () => {
        this.setState({popout: null});
    }
}
