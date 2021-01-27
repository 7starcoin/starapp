import React from 'react';
import {
    Avatar,
    Banner,
    Button,
    Footer,
    FormLayout,
    FormStatus,
    Gallery,
    Group,
    Header,
    Input,
    ModalCard,
    ModalPage,
    ModalPageHeader,
    ModalRoot,
    Panel,
    PanelHeader,
    PanelHeaderClose,
    PanelHeaderContent,
    PullToRefresh,
    ScreenSpinner,
    Snackbar,
    View
} from '@vkontakte/vkui';
import Icon56ErrorOutline from '@vkontakte/icons/dist/56/error_outline';
import './Profile.scss';
import SystemFunctions from "../../SystemFunctions";
import Server from "../../Server";
import Icon24MoneyTransfer from '@vkontakte/icons/dist/24/money_transfer';
import Icon28InfoOutline from '@vkontakte/icons/dist/28/info_outline';
import Icon28MoneySendOutline from '@vkontakte/icons/dist/28/money_send_outline';
import Icon28DoneOutline from '@vkontakte/icons/dist/28/done_outline';
import Icon24Coins from '@vkontakte/icons/dist/24/coins';
import Icon24Poll from '@vkontakte/icons/dist/24/poll';
import Icon24Done from '@vkontakte/icons/dist/24/done';
import Icon28GiftOutline from '@vkontakte/icons/dist/28/gift_outline';
import Icon28MarketLikeOutline from '@vkontakte/icons/dist/28/market_like_outline';
import Icon28FavoriteOutline from '@vkontakte/icons/dist/28/favorite_outline';
import Icon28NameTagOutline from '@vkontakte/icons/dist/28/name_tag_outline';
import Icon28WalletOutline from '@vkontakte/icons/dist/28/wallet_outline';
import Icon28PaletteOutline from '@vkontakte/icons/dist/28/palette_outline';
import Icon28MoneyRequestOutline from '@vkontakte/icons/dist/28/money_request_outline';
import IconWC from '../../img/icon_wc';
import IconVkCoins from '../../img/icon_vkcoin';
import IconCorona from '../../img/icon_corona';
import IconPaper from '../../img/icon_paper';
import IconBonus from '../../img/icon_bonus';
import IconsManager from "../../IconsManager";

export default class Profile extends React.Component {

    constructor(props) {
        super(props);

        let sUserData = SystemFunctions.getStaticVar('userData');
        let sUserVkData = SystemFunctions.getStaticVar('userVkData');
        let sHistory = SystemFunctions.getStaticVar('pHistory');
        let sSelectedCoins = SystemFunctions.getStaticVar('sCoin');
        let sSelectedCoinsId = SystemFunctions.getStaticVar('siCoin');

        this.state = {
            popout: null,
            activePanel: 'main',
            activeModal: null,
            modal: 'local',
            fetching: false,
            snackbar: null,
            selectedCoins: sSelectedCoins == null ? 'wc' : sSelectedCoins,
            selectedCoinsId: sSelectedCoinsId == null ? 0 : sSelectedCoinsId,

            userVkData: sUserVkData == null ? null : sUserVkData,
            userData: sUserData == null ? null : sUserData,

            statMode: true,
            statTodayMode: true,
            inputBuySum: 1000000,
            inputBuySendError: '',
            inputSellSum: 0,
            inputSellSendError: '',
            inputName: '',
            inputNameError: '',
            selectedColor: -1,
        };
        // this.setAWCS();
    }

    componentDidMount() {
        if (this.state.userData === null) {
            this.showLoading();
        }
        this.onRefresh(true);
    }

    componentWillUnmount = () => {

    }

    updateSelectedCoin = (value) => {
        value = value.targetIndex;
        SystemFunctions.saveStaticVar('siCoin', value);
        let name = 'wc';
        switch (value) {
            case 1:
                name = 'coins';
                break;
            case 2:
                name = 'corona';
                break;
            case 3:
                name = 'paper';
                break;
            case 4:
                name = 'bonus';
        }
        SystemFunctions.saveStaticVar('sCoin', name);
        this.setState({
            selectedCoinsId: value,
            selectedCoins: name,
        });
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
                if (document[hidden] && this.state.socket != null && Profile.mountState) {
                    console.log(this.state.socket);
                    this.closeSocket(false);
                    this.state.socket.disconnect();
                    this.props.go('wait');
                }
            }, false);
        }
    }

    onRefresh = (first = false) => {
        this.setState({fetching: true});

        let ref = null;
        let startHash = SystemFunctions.getStaticVar('startHash');
        if (startHash != null && startHash.length > 2 && startHash.substr(0, 2) === 'r_') {
            ref = startHash.substr(2);
        }

        Server.query(Server.QUERY_GET_USER, {vk: first, ref: ref}, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                SystemFunctions.saveStaticVar('userData', r.userData);
                this.setState({
                    userData: r.userData,

                    fetching: false,
                });
                if (first) {
                    SystemFunctions.saveStaticVar('userVkData', r.userData.vk);
                    this.setState({
                        popout: null,
                        userVkData: r.userData.vk,
                    });
                }
            } else if (r.status === 'error') {
                SystemFunctions.saveStaticVar('error_text', r.error);
                this.props.go('error');
            } else {
                SystemFunctions.saveStaticVar('error_text', "Сервер временно недоступен. В течение нескольких минут всё должно заработать. Следите за новостями в нашей группе.");
                this.props.go('error');
            }
        }, (e) => {
            if (first) {
                this.closePopout();
            }
            this.setState({
                fetching: false,
            });
            SystemFunctions.saveStaticVar('error_text', "Сервер временно недоступен. В течение нескольких минут всё должно заработать. Следите за новостями в нашей группе.");
            this.props.go('error');
        });
    }

    renderStats = () => {
        if (this.state.userData == null) {
            return null;
        }
        if (this.state.selectedCoins === 'bonus') {
            return null;
        }
        let pref = '';
        switch (this.state.selectedCoins) {
            case 'wc':
                pref = 'wc_';
                break;
            case 'coins':
                pref = '';
                break;
            case 'corona':
                pref = 'corona_';
                break;
            case 'paper':
                pref = 'paper_';
                break;
            case 'bonus':
                return null;
        }
        let fPrepareP = (p1, p2) => {
            let c = p1 + p2;
            if (c === 0) {
                return [50, 50];
            }
            let r1 = (p1 / c) * 100;
            let r2 = (p2 / c) * 100;
            if (r1 > 60) {
                return [60, 40];
            }
            if (r2 > 60) {
                return [40, 60];
            }
            return [Math.round(r1), Math.round(r2)];
        }
        let stat_day_p;
        if (this.state.statTodayMode) {
            stat_day_p = fPrepareP(Math.round(this.state.userData.stat_day_win), Math.round(this.state.userData.stat_day_lose));
        } else {
            stat_day_p = fPrepareP(Math.round(this.state.userData[`stat_${pref}day_win_sum`]), Math.round(this.state.userData[`stat_${pref}day_lose_sum`]));
        }
        let stat_p;
        if (this.state.statMode) {
            stat_p = fPrepareP(Math.round(this.state.userData.stat_win), Math.round(this.state.userData.stat_lose));
        } else {
            stat_p = fPrepareP(Math.round(this.state.userData[`stat_${pref}win_sum`]), Math.round(this.state.userData[`stat_${pref}lose_sum`]));
        }
        return (<div className='statsBlock'>
            <div className='stat today'>
                <div className='blockTitleWrapper'>
                    <div className='blockTitle'>Статистика за день</div>
                </div>
                {this.state.statTodayMode ?
                    <Icon24Coins className='updateMode' width={18} height={18}
                                 onClick={() => this.setState({statTodayMode: false})}/> :
                    <Icon24Poll className='updateMode' width={18} height={18}
                                onClick={() => this.setState({statTodayMode: true})}/>}
                <div className='winBlock' style={{width: `${stat_day_p[0]}%`}}>
                    <div className='title'>{this.state.statTodayMode ? "Выигрыши" : "Выиграно"}</div>
                    <div
                        className='sum'>{this.state.statTodayMode ? this.state.userData.stat_day_win : SystemFunctions.reduceNumber(Math.round(this.state.userData[`stat_${pref}day_win_sum`]))}</div>
                </div>
                <div className='loseBlock' style={{width: `${stat_day_p[1]}%`}}>
                    <div className='title'>{this.state.statTodayMode ? "Проигрыши" : "Проиграно"}</div>
                    <div
                        className='sum'>{this.state.statTodayMode ? this.state.userData.stat_day_lose : SystemFunctions.reduceNumber(Math.round(this.state.userData[`stat_${pref}day_lose_sum`]))}</div>
                </div>
            </div>
            <div className='stat all'>
                <div className='blockTitleWrapper'>
                    <div className='blockTitle'>За все время</div>
                </div>
                {this.state.statMode ?
                    <Icon24Coins className='updateMode' width={18} height={18}
                                 onClick={() => this.setState({statMode: false})}/> :
                    <Icon24Poll className='updateMode' width={18} height={18}
                                onClick={() => this.setState({statMode: true})}/>}
                <div className='winBlock' style={{width: `${stat_p[0]}%`}}>
                    <div className='title'>{this.state.statMode ? "Выигрыши" : "Выиграно"}</div>
                    <div
                        className='sum'>{this.state.statMode ? this.state.userData.stat_win : SystemFunctions.reduceNumber(Math.round(this.state.userData[`stat_${pref}win_sum`]))}</div>
                </div>
                <div className='loseBlock' style={{width: `${stat_p[1]}%`}}>
                    <div className='title'>{this.state.statMode ? "Проигрыши" : "Проиграно"}</div>
                    <div
                        className='sum'>{this.state.statMode ? this.state.userData.stat_lose : SystemFunctions.reduceNumber(Math.round(this.state.userData[`stat_${pref}lose_sum`]))}</div>
                </div>
            </div>
        </div>);
    }

    renderPreloader = () => {
        return <div className='preloader'>
            <div className='item1'/>
            <div className='item2'/>
            <div className='item3'/>
            <div className='item4'/>
            <div className='item5'/>
            <div className='item6'/>
            <div className='item7'/>
            <div className='item8'/>
            <div className='item9'/>
            <div className='item10'/>
            <div className='item11'/>
            <div className='item12'/>
            <div className='item13'/>
            <div className='item14'/>
            <div className='item15'/>
            <div className='item16'/>
            <div className='item17'/>
            <div className='item18'/>
            <div className='item19'/>
            <div className='item20'/>
        </div>
    }

    renderAlert = () => {
        if (this.state.userData == null) {
            return null;
        }
        if (this.state.userData.data.showSelectCrown === true) {
            return <Banner
                className='topBanner'
                before={<Avatar mode="image"><Icon28FavoriteOutline fill="#fff"/></Avatar>}
                header="Вы заняли первое место!"
                subheader="В качестве награды Вы можете сменить отображаемое имя в игре, либо сделать его цветным."
                asideMode="dismiss"
                actions={
                    <React.Fragment>
                        <Button size='l' before={<Icon28PaletteOutline width={24}/>}
                                onClick={() => this.setState({activeModal: 'changeColor'})}>Выбрать цвет</Button>
                        <Button size='l' before={<Icon28NameTagOutline width={24}/>}
                                onClick={() => this.setState({activeModal: 'changeName'})}>Сменить имя</Button>
                    </React.Fragment>
                }
            />;
        }
        return null;
    }

    render() {
        let balanceName = 'БАЛАНС';
        switch (this.state.selectedCoins) {
            case 'wc':
                balanceName = 'БАЛАНС WC';
                break;
            case 'coins':
                balanceName = 'БАЛАНС VKC';
                break;
            case 'corona':
                balanceName = 'БАЛАНС CORONA';
                break;
            case 'paper':
                balanceName = 'БАЛАНС PAPER';
                break;
            case 'bonus':
                balanceName = 'БОНУСНЫЙ БАЛАНС';
                break;

        }
        return (
            <View className='profile' popout={this.state.popout} activePanel={this.state.activePanel}
                  modal={this.state.modal === 'local' ? this.getLocalModal() : this.state.modal} header={true}>
                <Panel id='main'>
                    <PanelHeader>
                        <PanelHeaderContent before={<Avatar size={40}
                                                            src={this.state.userVkData == null ? '' : this.state.userVkData.photo_200}/>}>
                            Профиль
                        </PanelHeaderContent>
                    </PanelHeader>
                    {this.state.userData == null ? this.renderPreloader() :
                        <PullToRefresh onRefresh={this.onRefresh} isFetching={this.state.fetching}>
                            <div className='paddingControlWrapper'>
                                <div className='balance'>
                                    <div className='coinsTop'>{balanceName}</div>
                                    <Gallery
                                        bullets="light"
                                        slideWidth="100%"
                                        align="center"
                                        slideIndex={{targetIndex: this.state.selectedCoinsId}}
                                        initialSlideIndex={this.state.selectedCoinsId}
                                        onEnd={this.updateSelectedCoin}
                                        style={{height: 80}}
                                    >
                                        <div className='coins'>
                                            <div
                                                className='verticalText'>{SystemFunctions.formatNumber(this.state.userData.wc, 0)}</div>
                                            <IconWC width={30} height={30} className='vkIcon'/>
                                        </div>
                                        <div className='coins'>
                                            <div
                                                className='verticalText'>{SystemFunctions.formatNumber(this.state.userData.coins, 0)}</div>
                                            <IconVkCoins width={30} height={30} className='vkIcon'/>
                                        </div>
                                        <div className='coins'>
                                            <div
                                                className='verticalText'>{SystemFunctions.formatNumber(this.state.userData.corona, 0)}</div>
                                            <IconCorona width={30} height={30} className='vkIcon'/>
                                        </div>
                                        <div className='coins'>
                                            <div
                                                className='verticalText'>{SystemFunctions.formatNumber(this.state.userData.paper, 0)}</div>
                                            <IconPaper width={30} height={30} className='vkIcon'/>
                                        </div>
                                        <div className='coins'>
                                            <div
                                                className='verticalText'>{SystemFunctions.formatNumber(this.state.userData.bonus, 0)}</div>
                                            <IconBonus width={30} height={30} className='vkIcon'/>
                                        </div>
                                    </Gallery>
                                </div>
                                {this.state.selectedCoins === 'coins' ?
                                    <div className='shopButton' onClick={() => this.props.go('shop')}>
                                        <Icon28MarketLikeOutline width={48} height={48}/>
                                        <span>Магазин коинов</span>
                                    </div> : null}
                                {this.state.selectedCoins === 'paper' || this.state.selectedCoins === 'corona' ?
                                    <div className='shopButton' onClick={() => SystemFunctions.openTab('https://vk.me/coinbottt')}>
                                        <Icon28MarketLikeOutline width={48} height={48}/>
                                        <span>Купить коины</span>
                                    </div> : null}
                                {this.state.selectedCoins === 'wc' ?
                                    <div className='shopButton' onClick={() => SystemFunctions.openTab('https://vk.com/app7614516')}>
                                        <Icon28WalletOutline width={48} height={48}/>
                                        <span>Открыть кошелек</span>
                                    </div> : null}
                                {this.state.selectedCoins === 'bonus' ?
                                    <div className='balanceButtons'>
                                        {this.state.userData.bonus < 100000 ?
                                            <div className='but getFree' onClick={() => this.getFreeBonus()}>
                                                <Icon28GiftOutline width={36} height={36}/>
                                                <span>Получить бонус</span>
                                            </div> : null}
                                    </div> : <div className='balanceButtons'>
                                        <div className='but buy' onClick={() => this.setState({activeModal: 'buy'})}>
                                            <Icon28MoneySendOutline width={36} height={36}/>
                                            <span>Пополнить</span>
                                        </div>
                                        <div className='but sell' onClick={() => this.setState({activeModal: 'sell'})}>
                                            <Icon28MoneyRequestOutline width={36} height={36}/>
                                            <span>Вывести</span>
                                        </div>
                                    </div>}
                            </div>
                            {this.renderAlert()}
                            {this.renderStats()}
                            <Footer>Онлайн: {this.state.userData.online}</Footer>
                            {this.renderPreloader()}
                        </PullToRefresh>}
                    {this.state.snackbar}
                </Panel>
            </View>
        );
    }

    renderBuy = () => {
        return (<div className='buyModal'>
            <Group>
                <FormLayout className='form'>
                    <Input id="inputSum"
                           top={"Введите сумму пополнения:"}
                           type="number"
                           value={this.state.inputBuySum}
                           alignment="center"
                           onChange={(e) => {
                               let v = e.target.value;
                               if (v < 0) {
                                   v = 0;
                               }
                               if (v > 100000000000) {
                                   v = 100000000000;
                               }
                               this.setState({
                                   inputBuySendError: '',
                                   inputBuySum: v,
                               });
                           }}
                           status={this.state.inputBuySendError === '' ? 'default' : 'error'}
                           bottom={this.state.inputBuySendError === '' ? '' : this.state.inputBuySendError}/>
                    <Button size="xl" onClick={this.onClickBuy}
                            before={<Icon24MoneyTransfer/>}>ПОПОЛНИТЬ</Button>
                </FormLayout>
            </Group>
        </div>);
    }

    onClickBuy = () => {
        switch (this.state.selectedCoins) {
            case 'wc':
                SystemFunctions.openTab('https://vk.com/app7614516#pay_196258588_' + this.state.inputBuySum + '_7777');
                break;
            case 'coins':
                SystemFunctions.openTab('https://vk.com/coin#x372746501_' + (this.state.inputBuySum * 1000) + '_7777');
                break;
            case 'corona':
                SystemFunctions.openTab('https://vk.com/app7349811#merchant180825291_' + (this.state.inputBuySum ));
                break;
            case 'paper':
                SystemFunctions.openTab('https://vk.com/app7420483#m223_' + (this.state.inputBuySum * 1000) + '_7777');
                break;
        }
    }

    renderSell = () => {
        return (<div className='buyModal'>
            <Group>
                <FormLayout className='form'>
                    <Input id="inputSum"
                           top={"Введите сумму вывода:"}
                           type="number"
                           value={this.state.inputSellSum}
                           alignment="center"
                           onChange={(e) => {
                               let v = e.target.value;
                               if (v < 0) {
                                   v = 0;
                               }
                               if (v > 100000000000) {
                                   v = 100000000000;
                               }
                               this.setState({
                                   inputSellSendError: '',
                                   inputSellSum: v,
                               });
                           }}
                           status={this.state.inputSellSendError === '' ? 'default' : 'error'}
                           bottom={this.state.inputSellSendError === '' ? '' : this.state.inputSellSendError}/>
                    <Button size="xl" onClick={() => this.setState({inputSellSum: this.state.userData[this.state.selectedCoins]})}
                            mode='secondary'
                            before={<Icon24Coins/>}>ВЫВЕСТИ ВСЁ</Button>
                    <Button size="xl" onClick={this.onClickSell}
                            before={<Icon24MoneyTransfer/>}>ВЫВЕСТИ</Button>
                </FormLayout>
            </Group>
        </div>);
    }

    onClickSell = () => {
        this.showLoading();
        Server.query(Server.QUERY_ACTIONS, {
            a: 'requestOut',
            type: this.state.selectedCoins,
            sum: this.state.inputSellSum,
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.closePopout();
                this.closeModal();
                this.displaySuccess("Средства успешно отправлены на Ваш кошелек!");
                this.onRefresh();
            } else if (r.status === 'error') {
                this.setState({
                    popout: null,
                    inputSellSendError: r.error,
                });
            } else {
                this.setState({
                    popout: null,
                    inputSellSendError: 'Сервер недоступен! Попробуйте чуть позже...',
                });
            }
        }, () => {
            this.setState({
                popout: null,
                inputSellSendError: 'Сервер недоступен! Попробуйте чуть позже...',
            });
        });
    }

    getFreeBonus = () => {
        this.showLoading();
        Server.query(Server.QUERY_ACTIONS, {
            a: 'getBonus',
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.closePopout();
                this.closeModal();
                this.displaySuccess("Вам выдан бонус 50 000 000!");
                this.onRefresh();
            } else if (r.status === 'error') {
                this.setState({
                    popout: null,
                    activeModal: 'error',
                    errorText: r.error,
                });
            } else {
                this.setState({
                    popout: null,
                    activeModal: 'error',
                    errorText: 'Сервер недоступен! Попробуйте чуть позже...',
                });
            }
        }, () => {
            this.setState({
                popout: null,
                activeModal: 'error',
                errorText: 'Сервер недоступен! Попробуйте чуть позже...',
            });
        });
    }

    displaySuccess = (text) => {
        this.setState({
            snackbar: <Snackbar style={{zIndex: 1000}}
                                onClose={() => this.setState({snackbar: null})}
                                before={<Avatar size={36}
                                                style={{background: '#8BC34A'}}><Icon24Done
                                    fill='#ffffff'/></Avatar>}
            >{text}</Snackbar>
        });
    }

    renderChangeName = () => {
        if (this.state.userData == null || this.state.userVkData == null) {
            return null;
        }
        return (<div className='changeModal'>
            <Group>
                <FormLayout className='form'>
                    <FormStatus className={'curName ' + (this.state.userData.data.name == null ? 'first' : 'active')}
                                header='Текущее имя'>
                        {this.state.userData.data.name == null ? (this.state.userVkData.first_name + ' ' + this.state.userVkData.last_name) : this.state.userData.data.name}
                    </FormStatus>
                    <Input top={"Введите новое имя:"}
                           type="text"
                           value={this.state.inputName}
                           placeholder='Как теперь Вас называть?'
                           alignment="center"
                           onChange={(e) => {
                               let v = e.target.value;
                               this.setState({
                                   inputNameError: '',
                                   inputName: v,
                               });
                           }}
                           status={this.state.inputNameError === '' ? 'default' : 'error'}
                           bottom={this.state.inputNameError === '' ? '' : this.state.inputNameError}/>
                    <Button size="xl" onClick={this.onClickChangeName}
                            before={<Icon28DoneOutline width={24} height={24}/>}>Сменить</Button>
                </FormLayout>
            </Group>
        </div>);
    }

    onClickChangeName = () => {
        this.showLoading();
        Server.query(Server.QUERY_ACTIONS, {
            a: 'changeName',
            name: this.state.inputName,
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.closePopout();
                this.closeModal();
                this.displaySuccess("Имя успешно обновлено!");
                this.onRefresh();
            } else if (r.status === 'error') {
                this.setState({
                    popout: null,
                    inputNameError: r.error,
                });
            } else {
                this.setState({
                    popout: null,
                    inputSellSendError: 'Сервер недоступен! Попробуйте чуть позже...',
                });
            }
        }, () => {
            this.setState({
                popout: null,
                inputSellSendError: 'Сервер недоступен! Попробуйте чуть позже...',
            });
        });
    }

    renderChangeColor = () => {
        if (this.state.userData == null || this.state.userVkData == null) {
            return null;
        }
        let myColor = this.state.userData.data.color;
        if (myColor == null) {
            myColor = 0;
        }
        let sc = this.state.selectedColor;
        if (sc === -1) {
            if (myColor > 0) {
                sc = myColor;
            } else {
                sc = 0;
            }
        }
        let colors1 = [];
        let colors2 = [];
        for (let i = 0; i < 4; i++) {
            colors1.push(<div className={'color usersColorsBaseBG-' + i + (sc === i ? ' selected' : '')}
                              onClick={() => this.setState({selectedColor: i})}>
                <Icon28DoneOutline/>
            </div>);
        }
        for (let i = 4; i < 8; i++) {
            colors2.push(<div className={'color usersColorsBaseBG-' + i + (sc === i ? ' selected' : '')}
                              onClick={() => this.setState({selectedColor: i})}>
                <Icon28DoneOutline/>
            </div>);
        }
        return (<div className='changeModal paddingWrapper'>
            <Header mode='secondary'>Выберите новый цвет</Header>
            <div className='colorsWrapper n1'>
                {colors1}
            </div>
            <div className='colorsWrapper n2'>
                {colors2}
            </div>
            <Button size="xl" onClick={this.onClickChangeColor}
                    before={<Icon28DoneOutline width={24} height={24}/>}>Сменить</Button>
        </div>);
    }

    onClickChangeColor = () => {
        this.showLoading();
        if (this.state.selectedColor < 0) {
            this.state.selectedColor = 0;
        }
        Server.query(Server.QUERY_ACTIONS, {
            a: 'changeColor',
            color: this.state.selectedColor,
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.closePopout();
                this.closeModal();
                this.displaySuccess("Цвет успешно обновлен!");
                this.onRefresh();
            } else if (r.status === 'error') {
                this.setState({
                    popout: null,
                    activeModal: 'error',
                    errorText: r.error,
                });
            } else {
                this.setState({
                    popout: null,
                    activeModal: 'error',
                    errorText: 'Сервер недоступен! Попробуйте чуть позже...',
                });
            }
        }, () => {
            this.setState({
                popout: null,
                activeModal: 'error',
                errorText: 'Сервер недоступен! Попробуйте чуть позже...',
            });
        });
    }

    getLocalModal = () => {
        return (<ModalRoot activeModal={this.state.activeModal}>
                <ModalPage
                    id='buy'
                    dynamicContentHeight={true}
                    onClose={() => {
                        this.closeModal();
                        this.onRefresh();
                    }}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Пополнение
                        </ModalPageHeader>
                    }
                >
                    {this.renderBuy()}
                </ModalPage>
                <ModalPage
                    id='sell'
                    dynamicContentHeight={true}
                    onClose={this.closeModal}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Вывод
                        </ModalPageHeader>
                    }
                >
                    {this.renderSell()}
                </ModalPage>
                <ModalPage
                    id='changeName'
                    dynamicContentHeight={true}
                    onClose={this.closeModal}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Смена имени
                        </ModalPageHeader>
                    }
                >
                    {this.renderChangeName()}
                </ModalPage>
                <ModalPage
                    id='changeColor'
                    dynamicContentHeight={true}
                    onClose={this.closeModal}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Смена цвета
                        </ModalPageHeader>
                    }
                >
                    {this.renderChangeColor()}
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

    showSystemAlert = (id, text, color = 'FF9100', icon = 'Icon28InfoOutline') => {
        if (this.state.lastAlertId >= id) {
            return;
        }
        const Icon = IconsManager.get(icon);
        this.setState({
            lastAlertId: id,
            snackbar: <Snackbar style={{zIndex: 1000}}
                                duration={15000}
                                onClose={() => this.setState({snackbar: null})}
                                before={<Avatar size={36}
                                                style={{background: '#' + color}}><Icon width={24} height={24}
                                                                                        fill='#ffffff'/></Avatar>}
            >{text}</Snackbar>
        });
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
