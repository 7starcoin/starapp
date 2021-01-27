import React from "react";
import {
    Avatar,
    Button,
    Cell,
    Div,
    Footer,
    FormLayout,
    Group,
    Header,
    InfoRow,
    Input,
    List,
    ModalCard,
    ModalPage,
    ModalPageHeader,
    ModalRoot,
    Panel,
    PanelHeaderClose,
    PanelHeaderContent,
    PanelHeaderSimple,
    PullToRefresh,
    ScreenSpinner,
    Snackbar,
    Tabs,
    TabsItem,
    View,
} from "@vkontakte/vkui";
import SystemFunctions from "../../SystemFunctions";
import Server from "../../Server";
import Icon24Done from '@vkontakte/icons/dist/24/done';
import Icon24Cancel from '@vkontakte/icons/dist/24/cancel';

import Icon28MarketAddBadgeOutline from '@vkontakte/icons/dist/28/market_add_badge_outline';
import Icon28MoneyCircleOutline from '@vkontakte/icons/dist/28/money_circle_outline';
import Icon28MoneyTransferOutline from '@vkontakte/icons/dist/28/money_transfer_outline';
import Icon28MoneySendOutline from '@vkontakte/icons/dist/28/money_send_outline';
import Icon28DeleteOutlineAndroid from '@vkontakte/icons/dist/28/delete_outline_android';
import Icon28CoinsOutline from '@vkontakte/icons/dist/28/coins_outline';
import Icon28StatisticsOutline from '@vkontakte/icons/dist/28/statistics_outline';
import Icon28MoneyRequestOutline from '@vkontakte/icons/dist/28/money_request_outline';
import Icon28PaymentCardOutline from '@vkontakte/icons/dist/28/payment_card_outline';
import Icon56ErrorOutline from '@vkontakte/icons/dist/56/error_outline';
import Icon56CheckCircleOutline from '@vkontakte/icons/dist/56/check_circle_outline';
import Icon56MessageReadOutline from '@vkontakte/icons/dist/56/message_read_outline';
import Icon56DeleteOutlineAndroid from '@vkontakte/icons/dist/56/delete_outline_android';
import './Market.scss';

export default class Market extends React.Component {

    reqGetUsers = false;

    constructor(props) {
        super(props);

        let sMarketData = SystemFunctions.getStaticVar('marketOffers');
        let sMyOffer = SystemFunctions.getStaticVar('myOffer');
        let sUserData = SystemFunctions.getStaticVar('userData');
        let sFreeToken = SystemFunctions.getStaticVar('freeToken');

        this.state = {
            bs: props.bs,
            activePanel: 'list',
            activeTab: 'buy',
            snackbar: null,
            activeModal: null,
            fetching: false,
            marketData: sMarketData == null ? null : sMarketData,
            myOffer: sMyOffer == null ? null : sMyOffer,
            userData: sUserData,
            token: sFreeToken == null ? null : sFreeToken,
            usersVkData: {},

            actualPrice: 0,
            calc: 0,
            inputBudget: 10000000,
            inputBudgetError: '',
            inputPrice: 1,
            inputPriceError: '',
            inputRep: 0,
            inputRepError: '',
            inputEPrice: 0,
            inputEPriceError: '',
            inputSum: 0,
            inputSendAlert: '',
            inputSendAlertType: '',
            sendLoading: false,
            inputSumIn: 0,
            inputSumInError: '',
            inputSumOut: 0,
            inputSumOutError: '',
            inputBuyCoinsSum: 10000000,
            inputBuyCoinsError: '',
            inputSellCoinsSum: 1000000,
            inputSellCoinsError: '',
            inputBuyRubSum: 10,
            inputBuyRubError: '',
            inputWallet: '',
            inputWalletError: '',

            displayLink: '',
            selectedOffer: 0,
        };
        this.onRefresh(true);
    }

    renderOffersList = () => {
        if (this.state.marketData == null || !Array.isArray(this.state.marketData)) {
            return null;
        }
        let ret = [];
        for (let i = 0; i < this.state.marketData.length; i++) {
            let he = this.state.marketData[i];
            if (he.price == null) {
                continue;
            }
            let uid = he.uid;
            let name = '@' + uid;
            let photo = null;
            if (this.state.usersVkData[uid] == null) {
                this.getUsersInfo();
            } else {
                name = this.state.usersVkData[uid].first_name + ' ' + this.state.usersVkData[uid].last_name;
                photo = this.state.usersVkData[uid].photo_100;
            }
            ret.push(<Cell
                className='cellOffer'
                before={<Avatar size={48} onClick={() => SystemFunctions.openTab('https://vk.com/id' + uid)}
                                src={photo}/>}
                size="m"
                expandable={true}
                description={<div>
                    <div><Icon28StatisticsOutline width={16} height={16}/> <span
                        className='st'>1KK = {he.price} руб.</span>
                    </div>
                    <div><Icon28CoinsOutline width={16} height={16}/> <span
                        className='st'>{SystemFunctions.formatNumber(he.budget)} VKC</span></div>
                </div>}
                onClick={() => {
                    this.setState({activeModal: 'buy', selectedOffer: i});
                }
                }
            >{name}</Cell>);
        }
        return ret;
    }

    onRefresh = (first = false) => {
        if (!first) {
            this.setState({fetching: true});
        }

        Server.query(Server.QUERY_MARKET, {a: 'get'}, (response) => {
            if (first && (this.state.marketData == null)) {
                this.closePopout();
            }
            let r = response.data;
            SystemFunctions.saveStaticVar('marketOffers', r.data);
            SystemFunctions.saveStaticVar('myOffer', r.my);
            this.setState({
                marketData: r.data,
                userData: r.newData,
                myOffer: r.my,
                actualPrice: r.ap,
                inputPrice: r.ap > 0 ? r.ap : 1,
                inputEPrice: r.my == null ? (r.ap > 0 ? r.ap : 1) : r.my.price,

                fetching: false,
            });
            this.calcAdd(r.ap > 0 ? r.ap : 1, this.state.inputBudget);
            if (r.newData.data.bonus.messages === false) {
                this.setState({activeModal: 'subMessages'});
            }
        }, (e) => this.setState({fetching: false, popout: null}));
    }

    componentDidMount() {
        if (this.state.marketData == null) {
            this.showLoading();
        }
    }

    render() {
        return <View className='market' activePanel={this.state.activePanel} popout={this.state.popout} header={false}
                     modal={this.getLocalModal()}>
            <Panel id="list">
                <PanelHeaderSimple separator={false}>
                    <PanelHeaderContent before={<Icon28CoinsOutline/>}>Биржа</PanelHeaderContent>
                </PanelHeaderSimple>
                <PullToRefresh onRefresh={this.onRefresh} isFetching={this.state.fetching}>
                    <Tabs theme="header" type="segmented">
                        <TabsItem
                            onClick={() => {
                                this.setState({activeTab: 'buy'})
                                this.onRefresh();
                            }}
                            selected={this.state.activeTab === 'buy'}
                        >
                            Купить
                        </TabsItem>
                        <TabsItem
                            onClick={() => {
                                this.setState({activeTab: 'sell'})
                                this.onRefresh();
                            }}
                            selected={this.state.activeTab === 'sell'}
                        >
                            Продать
                        </TabsItem>
                    </Tabs>
                    <div className='balance'>
                        <List>
                            <Cell before={<Icon28CoinsOutline/>} asideContent={<table>
                                <tr>
                                    <td onClick={() => this.setState({activeModal: 'buyCoins'})}>
                                        <div className='market_addButton'><Icon28MarketAddBadgeOutline
                                            width={18} height={18}/></div>
                                    </td>
                                    <td onClick={() => this.setState({activeModal: 'sellCoins'})}>
                                        <div className='market_sellButton'><Icon28MoneyRequestOutline width={18}
                                                                                                      height={18}/>
                                        </div>
                                    </td>
                                </tr>
                            </table>}>
                                <div
                                    className='market_walletStatsText'>{this.state.userData.m_coins === -1 ? '...' : SystemFunctions.formatNumber(this.state.userData.m_coins, 0) + ' VKC'}</div>
                            </Cell>
                            <Cell before={<Icon28MoneyCircleOutline/>} asideContent={<table>
                                <tr>
                                    <td onClick={() => this.setState({activeModal: 'buyRub'})}>
                                        <div className='market_addButton'><Icon28MarketAddBadgeOutline
                                            width={18} height={18}/></div>
                                    </td>
                                    <td onClick={() => this.setState({activeModal: 'sellRub'})}>
                                        <div className='market_sellButton'><Icon28MoneyRequestOutline width={18}
                                                                                                      height={18}/>
                                        </div>
                                    </td>
                                </tr>
                            </table>}>
                                <div
                                    className='market_walletStatsText'>{this.state.userData.m_rub === -1 ? '...' : SystemFunctions.formatNumber(this.state.userData.m_rub, 2) + ' руб.'}</div>
                            </Cell>
                        </List>
                    </div>
                    {this.state.activeTab === 'buy' ?
                        <div>
                            {this.state.marketData != null && this.state.marketData.length < 1 ?
                                <Footer>Предложения не найдены!</Footer>
                                :
                                <Group>
                                    <List style={{
                                        'background-color': 'transparent',
                                        'border': 0,
                                        'position': 'relative'
                                    }}>
                                        {this.renderOffersList()}
                                    </List>
                                </Group>
                            }
                        </div>
                        :
                        (this.state.myOffer == null ?
                                <div className='addOffer'>
                                    <FormLayout>
                                        <div className='calcBlock'>
                                            <InfoRow header="Ваш баланс">
                                                {SystemFunctions.formatNumber(this.state.userData.m_coins)} VKC
                                            </InfoRow>
                                            <br/>
                                            <InfoRow header="Актуальный курс">
                                                {this.state.actualPrice < 1 ? 'Нет данных' : "1KK = " + SystemFunctions.formatNumber(this.state.actualPrice, 2) + " руб."}
                                            </InfoRow>
                                            <br/>
                                            <InfoRow header="Итоговая прибыль">
                                                {this.state.calc < 0.1 ? 'Маленькая сумма!' : this.state.calc > 1000000000 ? 'Большая сумма!' : this.state.calc + ' руб.'}
                                            </InfoRow>
                                        </div>
                                        <Input id="inputBudget"
                                               top="Введите сумму к продаже (в VKC):"
                                               type="text"
                                               inputmode="numeric"
                                               step="0.001"
                                               value={SystemFunctions.isNumeric(this.state.inputBudget) ? SystemFunctions.formatNumber(this.state.inputBudget, 0) : null}
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
                                                   if (v <= 0) {
                                                       v = '';
                                                   }
                                                   this.setState({
                                                       inputBudget: v,
                                                       inputBudgetError: '',
                                                   });
                                                   this.calcAdd(this.state.inputPrice, v);
                                               }}
                                               status={this.state.inputBudgetError === '' ? 'default' : 'error'}
                                               bottom={this.state.inputBudgetError === '' ? '' : this.state.inputBudgetError}/>
                                        <Input id="inputPrice" top="Стоимость 1KK VKC:"
                                               type="number"
                                               step="0.1"
                                               value={this.state.inputPrice} alignment="center"
                                               onChange={(v) => {
                                                   this.setState({inputPrice: v.target.value, inputPriceError: ''});
                                                   this.calcAdd(v.target.value, this.state.inputBudget);
                                               }}
                                               status={this.state.inputPriceError === '' ? 'default' : 'error'}
                                               bottom={this.state.inputPriceError === '' ? '' : this.state.inputPriceError}/>
                                        <Button id='mo_create' size="xl" onClick={this.onButtonAdd}
                                                before={<Icon24Done/>}>Добавить предложение</Button>
                                    </FormLayout>
                                </div>
                                :
                                <div className='editOffer'>
                                    <Group>
                                        <div className='calcBlock panel'>
                                            <InfoRow header="Актуальный курс">
                                                {this.state.actualPrice < 1 ? 'Нет данных' : "1KK = " + SystemFunctions.formatNumber(this.state.actualPrice, 2) + " руб."}
                                            </InfoRow>
                                            <br/>
                                            <InfoRow header="Курс предложения">
                                                1KK
                                                = {SystemFunctions.formatNumber(this.state.myOffer.price, 2)} руб.
                                            </InfoRow>
                                            <br/>
                                            <InfoRow header="Бюджет предложения">
                                                {SystemFunctions.formatNumber(this.state.myOffer.budget)} VKC
                                            </InfoRow>
                                        </div>
                                    </Group>
                                    <Group>
                                        <Header mode='secondary'>Пополнить бюджет предложения</Header>
                                        <FormLayout style={{paddingTop: 0, paddingBottom: 0}}>
                                            <div className='calcBlock'>
                                                <InfoRow header="Ваш баланс">
                                                    {SystemFunctions.formatNumber(this.state.userData.m_coins)} VKC
                                                </InfoRow>
                                            </div>
                                            <Input id="inputRep" top="Сумма пополнения (в VKC):"
                                                   type="number"
                                                   step="0.001"
                                                   value={this.state.inputRep} alignment="center"
                                                   onChange={(v) => {
                                                       this.setState({inputRep: v.target.value, inputRepError: ''});
                                                   }}
                                                   status={this.state.inputRepError === '' ? 'default' : 'error'}
                                                   bottom={this.state.inputRepError === '' ? '' : this.state.inputRepError}/>
                                            <Button size="xl" onClick={this.onButtonRep}
                                                    before={<Icon28MoneyTransferOutline/>}>Пополнить</Button>
                                        </FormLayout>
                                    </Group>
                                    <Group>
                                        <Header mode='secondary'>Изменить курс продажи</Header>
                                        <FormLayout>
                                            <Input id="inputEPrice" top="Стоимость 1KK VKC:"
                                                   type="number"
                                                   step="0.1"
                                                   value={this.state.inputEPrice} alignment="center"
                                                   onChange={(v) => {
                                                       this.setState({
                                                           inputEPrice: v.target.value,
                                                           inputEPriceError: ''
                                                       });
                                                   }}
                                                   status={this.state.inputEPriceError === '' ? 'default' : 'error'}
                                                   bottom={this.state.inputEPriceError === '' ? '' : this.state.inputEPriceError}/>
                                            <Button size="xl" onClick={this.onButtonEPrice}
                                                    before={<Icon24Done/>}>Изменить</Button>
                                        </FormLayout>
                                    </Group>
                                    <Group>
                                        <div className='removeOfferButton'>
                                            <Button mode='destructive' size='xl' before={<Icon28DeleteOutlineAndroid/>}
                                                    onClick={() => this.setState({activeModal: 'delete'})}>Удалить
                                                предложение</Button>
                                        </div>
                                    </Group>
                                </div>
                        )
                    }
                </PullToRefresh>
                {this.state.snackbar}
            </Panel>
        </View>
    }

    renderBuyCoins = () => {
        return (<div className='buyModal'>
            <Group>
                <FormLayout className='form'>
                    <Input id="inputSum"
                           top={"Введите сумму пополнения:"}
                           type="text"
                           inputmode="numeric"
                           value={SystemFunctions.isNumeric(this.state.inputBuyCoinsSum) ? SystemFunctions.formatNumber(this.state.inputBuyCoinsSum, 0) : null}
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
                               if (v <= 0) {
                                   v = '';
                               }
                               this.setState({
                                   inputBuyCoinsSum: v,
                                   inputBuyCoinsError: '',
                               });
                           }}
                           status={this.state.inputBuyCoinsError === '' ? 'default' : 'error'}
                           bottom={this.state.inputBuyCoinsError === '' ? '' : this.state.inputBuyCoinsError}/>
                    <Button size="xl" onClick={this.onClickBuyCoins}
                            before={<Icon28MoneyRequestOutline/>}>ПОПОЛНИТЬ</Button>
                </FormLayout>
            </Group>
        </div>);
    }

    onClickBuyCoins = () => {
        SystemFunctions.openTab('https://vk.com/coin#x514303915_' + (this.state.inputBuyCoinsSum * 1000) + '_7777');
    }

    renderSellCoins = () => {
        return (<div className='buyModal'>
            <Group>
                <FormLayout className='form'>
                    <Input id="inputSum"
                           top={"Введите сумму вывода:"}
                           type="text"
                           inputmode="numeric"
                           value={SystemFunctions.isNumeric(this.state.inputSellCoinsSum) ? SystemFunctions.formatNumber(this.state.inputSellCoinsSum, 0) : null}
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
                               if (v > this.state.userData.m_coins) {
                                   v = this.state.userData.m_coins;
                               }
                               if (v <= 0) {
                                   v = '';
                               }
                               this.setState({
                                   inputSellCoinsSum: v,
                                   inputSellCoinsError: '',
                               });
                           }}
                           status={this.state.inputSellCoinsError === '' ? 'default' : 'error'}
                           bottom={this.state.inputSellCoinsError === '' ? 'Комиссия вывода составляет 5%' : this.state.inputSellCoinsError}/>
                    <Button size="xl" onClick={this.onClickSellCoins}
                            before={<Icon28MoneyTransferOutline/>}>ВЫВЕСТИ</Button>
                </FormLayout>
            </Group>
        </div>);
    }

    onClickSellCoins = () => {
        this.showLoading();
        Server.query(Server.QUERY_MARKET, {
            a: 'sellCoins',
            sum: this.state.inputSellCoinsSum,
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
                    inputSellCoinsError: r.error,
                });
            } else {
                this.setState({
                    popout: null,
                    inputSellCoinsError: 'Сервер недоступен! Попробуйте чуть позже...',
                });
            }
        }, () => {
            this.setState({
                popout: null,
                inputSellCoinsError: 'Сервер недоступен! Попробуйте чуть позже...',
            });
        });
    }

    renderBuyRub = () => {
        return (<div className='buyModal'>
            <Group>
                <FormLayout className='form'>
                    <Input id="inputSum"
                           top={"Введите сумму пополнения:"}
                           type="number"
                           value={this.state.inputBuyRubSum}
                           alignment="center"
                           onChange={(e) => {
                               let v = e.target.value;
                               this.setState({
                                   inputBuyRubSum: v,
                                   inputBuyRubError: '',
                               });
                           }}
                           status={this.state.inputBuyRubError === '' ? 'default' : 'error'}
                           bottom={this.state.inputBuyRubError === '' ? '' : this.state.inputBuyRubError}/>
                    {this.state.displayLink === '' ? null : <div className='modal_inLink'>
                        <a href={this.state.displayLink}>Нажмите сюда, если окно оплаты не открылось</a>
                    </div>}
                    <Button size="xl" onClick={this.onClickBuyRub}
                            before={<Icon28MoneyRequestOutline/>}>ПОПОЛНИТЬ</Button>
                </FormLayout>
            </Group>
        </div>);
    }

    onClickBuyRub = () => {
        let inputSumIn = parseFloat(this.state.inputBuyRubSum);
        if (!SystemFunctions.isNumeric(inputSumIn)) {
            return;
        }
        if (inputSumIn < 1) {
            this.setState({inputBuyRubError: 'Сумма должна быть не менее 1 руб.!'});
            return;
        }
        if (inputSumIn > 15000) {
            this.setState({inputBuyRubError: 'Сумма должна быть не более 15 000 руб.!'});
            return;
        }
        this.showLoading();
        Server.query(Server.QUERY_MARKET, {
            a: 'buyRub',
            sum: inputSumIn,
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.closePopout();
                this.setState({
                    displayLink: r.link,
                });
                SystemFunctions.openTab(r.link);
            } else if (r.status === 'error') {
                this.closePopout();
                this.setState({inputBuyRubError: r.error});
            } else {
                this.closePopout();
                this.setState({inputBuyRubError: 'Произошла ошибка! Попробуйте позже...'});
            }
        }, () => {
            this.closePopout();
            this.setState({inputBuyRubError: 'Произошла ошибка! Попробуйте позже...'});
        });
    }

    renderSellRub = () => {
        return (<div className='buyModal'>
            <Group>
                <FormLayout className='form'>
                    <Input id="inputWallet"
                           top="Номер Вашего Qiwi-кошелька"
                           type="tel"
                           value={this.state.inputWallet}
                           alignment="center"
                           onChange={(e) => {
                               let v = e.target.value;
                               this.setState({
                                   inputWalletError: '',
                                   inputWallet: v,
                                   displayLink: '',
                               });
                           }}
                           status={this.state.inputWalletError === '' ? 'default' : 'error'}
                           bottom={this.state.inputWalletError === '' ? 'В международном формате, без плюса. Например: 79121234567' : this.state.inputWalletError}/>
                    <Input id="inputSum"
                           top="Сумма вывода (в руб.)"
                           type="number"
                           value={this.state.inputSumOut}
                           alignment="center"
                           onChange={(e) => {
                               let v = e.target.value;
                               if (SystemFunctions.isNumeric(v)) {
                                   v = SystemFunctions.round(e.target.value, 2);
                               }
                               this.setState({
                                   inputSumOutError: '',
                                   inputSumOut: v,
                                   displayLink: '',
                               });
                           }}
                           status={this.state.inputSumOutError === '' ? 'default' : 'error'}
                           bottom={this.state.inputSumOutError === '' ? 'Комиссия вывода составляет 5%' : this.state.inputSumOutError}/>
                    <Button size="xl" onClick={this.onButtonOut}
                            level={this.state.sendLoading ? 'primary' : 'secondary'}
                            before={<Icon28MoneyTransferOutline width={24}
                                                                height={24}/>}>Вывести</Button>
                </FormLayout>
            </Group>
        </div>);
    }

    onButtonOut = () => {
        let inputSumOut = parseFloat(this.state.inputSumOut);
        if (!SystemFunctions.isNumeric(inputSumOut)) {
            return;
        }
        if (inputSumOut < 10) {
            this.setState({inputSumOutError: 'Сумма вывода быть не менее 10 руб.!'});
            return;
        }
        if (inputSumOut > 30000) {
            this.setState({inputSumOutError: 'Сумма вывода быть не более 30 000 руб.!'});
            return;
        }
        this.showLoading();
        Server.query(Server.QUERY_MARKET, {
            a: 'sellRub',
            sum: inputSumOut,
            wallet: this.state.inputWallet,
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.closePopout();
                this.closeModal();
                this.displaySuccess(r.sum + " руб. успешно отправлены на Ваш Qiwi-кошелек!");
                this.setState({
                    userData: r.newData,
                });
            } else if (r.status === 'error') {
                this.closePopout();
                this.setState({inputSumOutError: r.error});
            } else {
                this.closePopout();
                this.setState({inputSumOutError: 'Произошла ошибка! Попробуйте позже...'});
            }
        }, () => {
            this.closePopout();
            this.setState({inputSumOutError: 'Произошла ошибка! Попробуйте позже...'});
        });
    }

    renderBuyOffer = () => {
        if (this.state.marketData == null || this.state.marketData[this.state.selectedOffer] == null) {
            return <div className='buyModal'>
                <Group style={{paddingTop: 0, paddingBottom: '30px'}}>
                    <Footer>Предложение более не актуально</Footer>
                </Group>
            </div>;
        }
        return (<div className='buyModal'>
            <Group>
                <FormLayout className='form'>
                    <Div style={{paddingTop: 0}}>
                        <InfoRow header="Курс">
                            1KK
                            = {SystemFunctions.formatNumber(this.state.marketData[this.state.selectedOffer].price, 2)} руб.
                        </InfoRow>
                        <br/>
                        <InfoRow header="Остаток">
                            {SystemFunctions.formatNumber(this.state.marketData[this.state.selectedOffer].budget, 3)} VKC
                        </InfoRow>
                        <br/>
                        <InfoRow header="К оплате">
                            {SystemFunctions.formatNumber((this.state.inputSum / 1000000) * this.state.marketData[this.state.selectedOffer].price, 2)} руб.
                        </InfoRow>
                    </Div>
                    <div>
                        {this.state.sendLoading ?
                            <Input id="inputSum"
                                   top="Введите сумму покупки (в VKC)"
                                   type="text"
                                   inputmode="numeric"
                                   value={SystemFunctions.formatNumber(this.state.inputSum, 0)}
                                   alignment="center"
                                   status={this.state.inputSendAlertType === '' ? 'default' : this.state.inputSendAlertType}
                                   bottom={this.state.inputSendAlert === '' ? '' : this.state.inputSendAlert}
                                   disabled/> :
                            <Input id="inputSum"
                                   top="Введите сумму покупки (в VKC)"
                                   type="text"
                                   inputmode="numeric"
                                   value={SystemFunctions.isNumeric(this.state.inputSum) ? SystemFunctions.formatNumber(this.state.inputSum, 0) : null}
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
                                       if (v <= 0) {
                                           v = '';
                                       }
                                       this.setState({
                                           inputSendAlert: '',
                                           inputSendAlertType: '',
                                           inputSum: v,
                                       });
                                   }}
                                   status={this.state.inputSendAlertType === '' ? 'default' : this.state.inputSendAlertType}
                                   bottom={this.state.inputSendAlert === '' ? '' : this.state.inputSendAlert}/>}
                        <Button size="xl" style={{marginTop: '10px'}}
                                onClick={() => this.setState({inputSum: Math.ceil((1000000 * this.state.userData.m_rub) / this.state.marketData[this.state.selectedOffer].price) - 1})}
                                mode='secondary'
                                before={<Icon28PaymentCardOutline width={24}
                                                                  height={24}/>}>Купить
                            на {SystemFunctions.formatNumber(this.state.userData.m_rub, 2)} руб.</Button>
                    </div>
                    <Button size="xl" onClick={this.onButtonBuy}
                            level={this.state.sendLoading ? 'primary' : 'secondary'}
                            before={<Icon28MoneySendOutline width={24}
                                                            height={24}/>}>Оплатить</Button>
                </FormLayout>
            </Group>
        </div>);
    }

    getLocalModal = () => {
        return (<ModalRoot activeModal={this.state.activeModal}>
                <ModalPage
                    id='buy'
                    dynamicContentHeight={true}
                    onClose={this.closeModal}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Покупка
                        </ModalPageHeader>
                    }
                >
                    {this.renderBuyOffer()}
                </ModalPage>
                <ModalPage
                    id='buyCoins'
                    dynamicContentHeight={true}
                    onClose={() => {
                        this.closeModal();
                        this.onRefresh();
                    }}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Пополнение VKC
                        </ModalPageHeader>
                    }
                >
                    {this.renderBuyCoins()}
                </ModalPage>
                <ModalPage
                    id='sellCoins'
                    dynamicContentHeight={true}
                    onClose={this.closeModal}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Вывод VKC
                        </ModalPageHeader>
                    }
                >
                    {this.renderSellCoins()}
                </ModalPage>
                <ModalPage
                    id='buyRub'
                    dynamicContentHeight={true}
                    onClose={() => {
                        this.closeModal();
                        this.onRefresh();
                    }}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Пополнение баланса
                        </ModalPageHeader>
                    }
                >
                    {this.renderBuyRub()}
                </ModalPage>
                <ModalPage
                    id='sellRub'
                    dynamicContentHeight={true}
                    onClose={this.closeModal}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Вывод средств
                        </ModalPageHeader>
                    }
                >
                    {this.renderSellRub()}
                </ModalPage>

                <ModalCard
                    id='subMessages'
                    onClose={() => {
                        this.props.changeStory('profile')
                    }}
                    icon={<Icon56MessageReadOutline style={{color: '#2196F3'}}/>}
                    header="Подпишитесь на сообщения группы"
                    caption={"Это необходимо для получения уведомлений с биржи."}
                    actions={[
                        {
                            title: 'Подписаться',
                            mode: 'primary',
                            action: this.onAllowMessages
                        },
                        {
                            title: 'Отмена',
                            mode: 'secondary',
                            action: () => {
                                this.props.changeStory('profile')
                            }
                        },
                    ]}
                />

                <ModalCard
                    id='delete'
                    onClose={this.closeModal}
                    icon={<Icon56DeleteOutlineAndroid style={{color: '#f44336'}}/>}
                    header="Удалить предложение?"
                    caption={"При удалении оставшийся бюджет будет переведен на Ваш счёт."}
                    actions={[
                        {
                            title: 'Удалить',
                            mode: 'primary',
                            action: this.onButtonDelete
                        },
                        {
                            title: 'Отмена',
                            mode: 'secondary',
                            action: this.closeModal
                        },
                    ]}
                />

                <ModalCard
                    id='success'
                    onClose={this.closeModal}
                    icon={<Icon56CheckCircleOutline style={{color: '#8BC34A'}}/>}
                    header="Успешно!"
                    caption={<div className='transfer_success'>

                    </div>}
                    actions={[{
                        title: 'Продолжить',
                        type: 'primary',
                        action: () => {
                            this.closeModal();
                        }
                    }]}
                />
                <ModalCard
                    id='error'
                    onClose={this.closeModal}
                    icon={<Icon56ErrorOutline style={{color: '#ef5350'}}/>}
                    header="Ошибка!"
                    caption={this.state.errorText}
                    actions={[
                        {
                            title: 'Закрыть',
                            type: 'primary',
                            action: () => this.closeModal()
                        }
                    ]}
                />
            </ModalRoot>
        );
    }

    onButtonBuy = () => {
        let inputSum = parseFloat(this.state.inputSum);
        if (!SystemFunctions.isNumeric(inputSum)) {
            return;
        }
        if (this.state.marketData == null || this.state.marketData[this.state.selectedOffer] == null) {
            this.setState({
                inputSendAlertType: 'error',
                inputSendAlert: "Произошла непредвиденная ошибка! Попробуйте обновить список предложений.",
            });
            return;
        }
        if (inputSum < 1) {
            this.setState({
                inputSendAlertType: 'error',
                inputSendAlert: "Сумма покупки должна быть не менее 1 VKC!",
            });
            return;
        }
        if (inputSum > this.state.marketData[this.state.selectedOffer].budget) {
            this.setState({
                inputSendAlertType: 'error',
                inputSendAlert: "Сумма покупки должна быть не более " + SystemFunctions.formatNumber(this.state.marketData[this.state.selectedOffer].budget) + " VKC!",
            });
            return;
        }
        if (inputSum > 100000000000) {
            this.setState({
                inputSendAlertType: 'error',
                inputSendAlert: "Сумма покупки должна быть не более 100 000 000 000 VKC!",
            });
            return;
        }
        this.setState({
            sendLoading: true,
            inputSendAlert: 'Выполняем перевод...',
            inputSendAlertType: 'default',
        });
        Server.query(Server.QUERY_MARKET, {
            a: 'buy',
            offer: this.state.marketData[this.state.selectedOffer].uid,
            sum: inputSum,
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.setState({
                    userData: r.newData,
                    sendLoading: false,
                    inputSendAlertType: '',
                    inputSendAlert: '',
                });
                this.closeModal();
                this.onRefresh();
                this.displaySuccess(
                    <span>Вы успешно приобрели <b>{r.coins} VKC</b> за <b>{r.rub} руб.!</b></span>);
            } else if (r.status === 'error') {
                this.setState({
                    sendLoading: false,
                    inputSendAlertType: 'error',
                    inputSendAlert: r.error,
                });
            } else {
                this.setState({
                    sendLoading: false,
                    inputSendAlertType: 'error',
                    inputSendAlert: "Произошла ошибка! Попробуйте позже...",
                });
            }
        }, () => {
            this.setState({
                sendLoading: false,
                inputSendAlertType: 'error',
                inputSendAlert: "Произошла ошибка! Попробуйте позже...",
            });
        });
    }

    onButtonAdd = () => {
        let inputBudget = parseFloat(this.state.inputBudget);
        let inputPrice = parseFloat(this.state.inputPrice);
        if (!SystemFunctions.isNumeric(inputBudget) || !SystemFunctions.isNumeric(inputPrice)) {
            return;
        }
        if (inputBudget < 10000000) {
            this.setState({inputBudgetError: 'Бюджет должен быть не менее 10 000 000 VKC!'});
            return;
        }
        if (inputBudget > 100000000000) {
            this.setState({inputBudgetError: 'Бюджет должен быть не более 100 000 000 000 VKC!'});
            return;
        }
        if (inputPrice < 0.01) {
            this.setState({inputPriceError: 'Стоимость 1КК VKC должна быть не меньше 0.01 руб.!'});
            return;
        }
        if (inputPrice > 100) {
            this.setState({inputPriceError: 'Курс должен быть не более 100 руб. за 1KK VKC!'});
            return;
        }
        this.showLoading();
        Server.query(Server.QUERY_MARKET, {
            a: 'add',
            budget: inputBudget,
            price: inputPrice
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.setState({
                    myOffer: r.my,
                    userData: r.newData,
                });
                this.closePopout();
                this.displaySuccess(
                    <span>Предложение успешно добавлено! <b>{inputBudget} VKC</b> по курсу <b>{inputPrice} VKC за 1 руб.</b></span>);
            } else if (r.status === 'error') {
                this.closePopout();
                this.displayError(r.error);
            } else {
                this.closePopout();
                this.displayError('Произошла ошибка! Попробуйте позже...');
            }
        }, () => {
            this.closePopout();
            this.displayError('Произошла ошибка! Попробуйте позже...');
        });
    }

    onButtonRep = () => {
        let inputRep = parseFloat(this.state.inputRep);
        if (!SystemFunctions.isNumeric(inputRep)) {
            return;
        }
        if (inputRep < 1) {
            this.setState({inputRepError: 'Сумма должна быть не менее 1 VKC!'});
            return;
        }
        if (inputRep > 10000000000) {
            this.setState({inputRepError: 'Сумма должна быть не более 10 000 000 000 VKC!'});
            return;
        }
        this.showLoading();
        Server.query(Server.QUERY_MARKET, {
            a: 'editBudget',
            sum: inputRep,
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.setState({
                    myOffer: r.my,
                    userData: r.newData,
                });
                this.closePopout();
                this.displaySuccess(
                    <span>Бюджет предложения пополнен на <b>{inputRep} VKC!</b></span>);
            } else if (r.status === 'error') {
                this.closePopout();
                this.displayError(r.error);
            } else {
                this.closePopout();
                this.displayError('Произошла ошибка! Попробуйте позже...');
            }
        }, () => {
            this.closePopout();
            this.displayError('Произошла ошибка! Попробуйте позже...');
        });
    }

    onButtonEPrice = () => {
        let inputEPrice = parseFloat(this.state.inputEPrice);
        if (!SystemFunctions.isNumeric(inputEPrice)) {
            return;
        }
        if (inputEPrice < 0.01) {
            this.setState({inputEPriceError: 'Стоимость 1КК VKC должна быть не меньше 0.01 руб.!'});
            return;
        }
        if (inputEPrice > 100) {
            this.setState({inputEPriceError: 'Курс должен быть не более 100 руб. за 1KK VKC!'});
            return;
        }
        this.showLoading();
        Server.query(Server.QUERY_MARKET, {
            a: 'editPrice',
            price: inputEPrice,
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.setState({
                    myOffer: r.my,
                });
                this.closePopout();
                this.displaySuccess(
                    <span>Новый курс предложения: <b>1KK = {inputEPrice} руб.!</b></span>);
            } else if (r.status === 'error') {
                this.closePopout();
                this.displayError(r.error);
            } else {
                this.closePopout();
                this.displayError('Произошла ошибка! Попробуйте позже...');
            }
        }, () => {
            this.closePopout();
            this.displayError('Произошла ошибка! Попробуйте позже...');
        });
    }

    onButtonDelete = () => {
        this.showLoading();
        this.closeModal();
        Server.query(Server.QUERY_MARKET, {
            a: 'delete',
        }, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                this.setState({
                    myOffer: r.my,
                    userData: r.newData,
                });
                this.closePopout();
                this.displaySuccess(
                    <span>Предложение удалено!</span>);
            } else if (r.status === 'error') {
                this.closePopout();
                this.displayError(r.error);
            } else {
                this.closePopout();
                this.displayError('Произошла ошибка! Попробуйте позже...');
            }
        }, () => {
            this.closePopout();
            this.displayError('Произошла ошибка! Попробуйте позже...');
        });
    }

    calcAdd = (inputPrice, inputBudget) => {
        this.setState({
            calc: inputPrice > 0 && inputBudget > 0 ? Math.ceil((inputBudget / 1000000) * inputPrice * 100) / 100 : 0,
        })
    }

    displayError = (error) => {
        this.setState({
            snackbar: <Snackbar style={{zIndex: 1000}}
                                onClose={() => this.setState({snackbar: null})}
                                before={<Avatar size={36}
                                                style={{background: '#f44336'}}><Icon24Cancel
                                    fill='#ffffff'/></Avatar>}
            >{error}</Snackbar>
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

    setPanel = (e) => {
        this.setState({activePanel: e})
        SystemFunctions.saveStaticVar('marketAPanel', e);
    };

    changePopout = (p) => {
        this.setState({popout: p})
    }

    showLoading = () => {
        this.setState({popout: <ScreenSpinner/>});
    }

    onAllowMessages = () => {
        Server.allowMessagesEvent(() => {
            Server.query(Server.QUERY_MARKET, {a: 'subMessages'}, (response) => {
                let r = response.data;
                if (r.status === 'ok') {
                    this.setState({userData: r.newData});
                }
                Server.query(Server.QUERY_ACTIONS, {a: 'endFirst'});
                this.closeModal();
            });
        });
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

            if (this.state.marketData != null) {
                for (let i = 0; i < this.state.marketData.length; i++) {
                    let uid = this.state.marketData[i].uid;
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

    closeModal = () => {
        this.setState({activeModal: null});
    }

    closePopout = () => {
        this.setState({popout: null});
    }
}
