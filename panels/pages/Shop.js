import React from "react";
import {
    Avatar,
    Button,
    FormLayout,
    InfoRow,
    Input,
    Panel,
    PanelHeader,
    PanelHeaderBack,
    PanelHeaderContent,
    PullToRefresh,
    ScreenSpinner,
    Select, Snackbar,
    Tabs,
    TabsItem,
    View,
} from "@vkontakte/vkui";
import Server from "../../Server";
import SystemFunctions from "../../SystemFunctions";
import Icon24Done from '@vkontakte/icons/dist/24/done';
import Icon28MoneyCircleOutline from '@vkontakte/icons/dist/28/money_circle_outline';
import Icon28MoneyRequestOutline from '@vkontakte/icons/dist/28/money_request_outline';
import './Shop.scss';

export default class Shop extends React.Component {

    constructor(props) {
        super(props);

        let sUserData = SystemFunctions.getStaticVar('userData');

        this.state = {
            activeModal: null,
            fetching: false,
            activeTab: 'buy',
            snackbar: null,
            popout: null,

            userData: sUserData,

            calcBuy: 0,
            markupBuy: 0,
            inputBuy: '',
            inputBuyError: '',
            calcSell: 0,
            inputSell: '',
            inputSellError: '',
            inputTypeWallet: 'qiwi',
            inputSellWallet: '',
            inputSellWalletError: '',
        };
        this.onRefresh(true);
    }

    onRefresh = (first = false) => {
        this.setState({fetching: true});

        Server.query(Server.QUERY_GET_USER, {}, (response) => {
            let r = response.data;
            if (r.status === 'ok') {
                SystemFunctions.saveStaticVar('userData', r.userData);
                this.setState({
                    userData: r.userData,

                    fetching: false,
                });
            } else if (r.status === 'error') {
                SystemFunctions.saveStaticVar('error_text', r.error);
                this.props.go('error');
            } else {
                SystemFunctions.saveStaticVar('error_text', "Сервер временно недоступен. В течение нескольких минут всё должно заработать. Следите за новостями в нашей группе.");
                this.props.go('error');
            }
        }, (e) => {
            this.setState({
                fetching: false,
            });
            SystemFunctions.saveStaticVar('error_text', "Сервер временно недоступен. В течение нескольких минут всё должно заработать. Следите за новостями в нашей группе.");
            this.props.go('error');
        });
    }

    componentDidMount() {

    }

    render() {
        return (
            <View className='Shop' activePanel='shop' popout={this.state.popout}>
                <Panel id='shop'>
                    <PanelHeader separator={false}>
                        <PanelHeaderContent before={<PanelHeaderBack onClick={() => this.props.go('home')}/>}>
                            Магазин коинов
                        </PanelHeaderContent>
                    </PanelHeader>
                    <PullToRefresh onRefresh={this.onRefresh} isFetching={this.state.fetching}>
                        <Tabs className='headerTabs' theme="header">
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

                        {this.state.activeTab === 'buy' ?
                            <div className='buy panel'>
                                <FormLayout>
                                    <div className='calcBlock'>
                                        <InfoRow header="Курс">
                                            {this.state.userData.shop.buy < 1 ? 'Нет данных' : "1KK = " + SystemFunctions.formatNumber(this.state.userData.shop.buy, 2) + " руб."}
                                        </InfoRow>
                                        {this.state.markupBuy > 0 ? <br/> : null}
                                        {this.state.markupBuy > 0 ?
                                            <InfoRow header="Наценка">
                                                {this.state.markupBuy + '%'}
                                            </InfoRow> : null
                                        }
                                        <br/>
                                        <InfoRow header="Скидка">
                                            {this.state.userData.shop.discount + '%'}
                                        </InfoRow>
                                        <br/>
                                        <InfoRow header="К оплате">
                                            {this.state.calcBuy < 0.1 ? '-' : this.state.calcBuy > 1000000000 ? 'Большая сумма!' : SystemFunctions.formatNumber(this.state.calcBuy, 2) + ' руб.'}
                                        </InfoRow>
                                    </div>
                                    <Input top="Сумма покупки (в VKC):"
                                           type="text"
                                           inputmode="numeric"
                                           step="1"
                                           value={SystemFunctions.isNumeric(this.state.inputBuy) ? SystemFunctions.formatNumber(this.state.inputBuy, 0) : null}
                                           alignment="center"
                                           onChange={(e) => {
                                               let v = '' + e.target.value;
                                               v = v.replace(/[^0123456789]/g, '');
                                               if (v !== '' && !SystemFunctions.isNumeric(v)) {
                                                   return;
                                               }
                                               if (v > 10000000000) {
                                                   v = 10000000000;
                                               }
                                               if (v <= 0) {
                                                   v = '';
                                               }
                                               this.setState({
                                                   inputBuy: v,
                                                   inputBuyError: '',
                                               });
                                               this.calcBuy(v);
                                           }}
                                           status={this.state.inputBuyError === '' ? 'default' : 'error'}
                                           bottom={this.state.inputBuyError === '' ? '' : this.state.inputBuyError}/>
                                    <Button id='mo_create' size="xl"
                                            before={<Icon28MoneyCircleOutline width={24}
                                                                              height={24}/>}
                                            onClick={this.onClickBuy}>Оплатить</Button>
                                </FormLayout>
                            </div> :
                            <div className='sell panel'>
                                <FormLayout>
                                    <div className='calcBlock'>
                                        <InfoRow header="Ваш баланс">
                                            {SystemFunctions.formatNumber(this.state.userData.coins) + " VKC"}
                                        </InfoRow>
                                        <br/>
                                        <InfoRow header="Курс">
                                            {this.state.userData.shop.sell < 1 ? 'Нет данных' : "1KK = " + SystemFunctions.formatNumber(this.state.userData.shop.sell, 2) + " руб."}
                                        </InfoRow>
                                        <br/>
                                        <InfoRow header="Комиссия">
                                            {this.state.userData.shop.outSystems[this.state.inputTypeWallet].tax + '% ' + this.state.userData.shop.outSystems[this.state.inputTypeWallet].taxComment}
                                        </InfoRow>
                                        <br/>
                                        <InfoRow header="Вы получите">
                                            {this.state.calcSell < 0.1 ? '-' : this.state.calcSell > 1000000000 ? 'Большая сумма!' : SystemFunctions.formatNumber(this.state.calcSell, 2) + ' руб.'}
                                        </InfoRow>
                                    </div>
                                    <Select value={this.state.inputTypeWallet} top='Платежная система'
                                            onChange={(e) => {
                                                let v = '' + e.target.value;

                                                this.setState({
                                                    inputTypeWallet: v,
                                                }, () => this.calcSell(this.state.inputSell));
                                            }}>
                                        <option value="bank">Банковская карта</option>
                                        <option value="qiwi">Qiwi</option>
                                        <option value="webmoney">WebMoney</option>
                                        <option value="yandex_money">Yandex</option>
                                        <option value="mobile">Счет телефона</option>
                                    </Select>
                                    <br className='br'/>
                                    <Input top="Ваши реквизиты"
                                           type="text"
                                           inputmode="numeric"
                                           step="1"
                                           value={this.state.inputTypeWallet === 'bank' ? this.bankFormat(this.state.inputSellWallet) : this.state.inputSellWallet}
                                           alignment="center"
                                           onChange={(e) => {
                                               let v = '' + e.target.value;
                                               v = v.replace(/[^0123456789]/g, '');
                                               this.setState({
                                                   inputSellWallet: v,
                                                   inputSellWalletError: '',
                                               });
                                           }}
                                           status={this.state.inputSellWalletError === '' ? 'default' : 'error'}
                                           bottom={this.state.inputSellWalletError === '' ? this.getWalletHint() : this.state.inputSellWalletError}/>
                                    <br className='br'/>
                                    <Input top="Сумма продажи (в VKC):"
                                           type="text"
                                           inputmode="numeric"
                                           step="1"
                                           value={SystemFunctions.isNumeric(this.state.inputSell) ? SystemFunctions.formatNumber(this.state.inputSell, 0) : null}
                                           alignment="center"
                                           onChange={(e) => {
                                               let v = '' + e.target.value;
                                               v = v.replace(/[^0123456789]/g, '');
                                               if (v !== '' && !SystemFunctions.isNumeric(v)) {
                                                   return;
                                               }
                                               if (v > 10000000000) {
                                                   v = 10000000000;
                                               }
                                               if (v > this.state.userData.coins) {
                                                   v = this.state.userData.coins;
                                               }
                                               if (v <= 0) {
                                                   v = '';
                                               }
                                               this.setState({
                                                   inputSell: v,
                                                   inputSellError: '',
                                               });
                                               this.calcSell(v);
                                           }}
                                           status={this.state.inputSellError === '' ? 'default' : 'error'}
                                           bottom={this.state.inputSellError === '' ? '' : this.state.inputSellError}/>
                                    <Button id='mo_create' size="xl" onClick={this.onClickSell}
                                            before={<Icon28MoneyRequestOutline width={24}
                                                                               height={24}/>}>Продать</Button>
                                </FormLayout>
                            </div>
                        }
                    </PullToRefresh>
                    {this.state.snackbar}
                </Panel>
            </View>
        );
    }

    onClickBuy = () => {
        let sum = Math.ceil(this.state.calcBuy);
        if (this.state.inputBuy == ''){
            this.setState({
                inputBuyError: 'Вы не указали сумму покупки!',
            });
            return;
        }
        if (this.state.inputBuy < 1000000){
            this.setState({
                inputBuyError: 'Сумма покупки должна быть не менее 1 000 000 VKC!',
            });
            return;
        }
        if (sum < 1){
            this.setState({
                inputBuyError: 'Вы указали слишком маленькую сумму покупки!',
            });
            return;
        }
        if (sum > 100000){
            this.setState({
                inputBuyError: 'Сумма покупки не может быть более 100 000 руб.!',
            });
            return;
        }
        SystemFunctions.openTab("https://vk.com/app6887721_-196258588#donate_" + sum);
    }

    onClickSell = () => {
        let inputSum = parseFloat(this.state.inputSell);
        if (!SystemFunctions.isNumeric(inputSum)) {
            return;
        }
        if (inputSum < 50000000) {
            this.setState({
                inputSellError: "Сумма продажи должна быть не менее 50 000 000 VKC!",
            });
            return;
        }
        if (this.state.calcSell < 2) {
            this.setState({
                inputSellError: "Сумма выплаты должна быть не менее 5 руб.!",
            });
            return;
        }
        if (inputSum > 10000000000) {
            this.setState({
                inputSellError: "Сумма продажи должна быть не более 10 000 000 000 VKC!",
            });
            return;
        }
        this.showLoading();
        Server.query(Server.QUERY_ACTIONS, {
            a: 'sellMarket',
            type: this.state.inputTypeWallet,
            wallet: this.state.inputSellWallet,
            sum: inputSum,
        }, (response) => {
            let r = response.data;
            this.closePopout();
            if (r.status === 'ok') {
                this.setState({
                    userData: r.newData,
                    inputSellError: '',
                });
                this.displaySuccess(
                    <span>Заявка на продажу <b>{SystemFunctions.formatNumber(inputSum)} VKC</b> за <b>{this.state.calcSell} руб.</b> успешно создана! В течение нескольких минут Вы получите сообщение от группы о статусе обработки.</span>);
            } else if (r.status === 'error') {
                this.setState({
                    inputSellError: r.error,
                });
            } else {
                this.setState({
                    inputSellError: "Произошла ошибка! Попробуйте позже...",
                });
            }
        }, () => {
            this.closePopout();
            this.setState({
                inputSellError: "Произошла ошибка! Попробуйте позже...",
            });
        });
    }

    displaySuccess = (text) => {
        this.setState({
            snackbar: <Snackbar style={{zIndex: 1000}}
                                duration={15000}
                                onClose={() => this.setState({snackbar: null})}
                                before={<Avatar size={36}
                                                style={{background: '#8BC34A'}}><Icon24Done
                                    fill='#ffffff'/></Avatar>}
            >{text}</Snackbar>
        });
    }

    getWalletHint = () => {
        switch (this.state.inputTypeWallet) {
            case 'bank':
                return 'Укажите номер Вашей банковской карты. Внимание! При переводах на иностранные карты (не РФ) взимается увеличенная комиссия!';
            case 'qiwi':
                return 'Укажите номер своего Qiwi-кошелька. В международном формате, без плюса.';
            case 'webmoney':
                return 'Укажите номер своего WMR кошелька. Без буквы R, только цифры.';
            case 'yandex_money':
                return 'Укажите номер своего Яндекс-кошелька (не номер телефона, а именно номер счета).';
            case 'mobile':
                return 'Укажите номер своего телефона. В международном формате, без плюса.';
            default:
                return 'Ошибка!';
        }
    }

    calcBuy = (sum) => {
        sum /= 1000000;
        let min = 500 + this.state.userData.shop.markupSum;
        let markup = (sum - min) * this.state.userData.shop.markup;
        let uMarkup = (1 + markup / 100);
        if (uMarkup < 1){
            uMarkup = 1;
        }
        let discount = 1;
        if (this.state.userData.shop.discount != null && this.state.userData.shop.discount > 0) {
            discount = 1 - this.state.userData.shop.discount / 100;
        }
        let cs = sum * this.state.userData.shop.buy * uMarkup * discount;

        this.setState({
            calcBuy: this.state.userData.shop.buy > 0 && sum > 0 ? Math.round(cs * 100) / 100 : 0,
            markupBuy: markup > 0 ? SystemFunctions.round(markup, 2) : 0,
        })
    }

    calcSell = (sum) => {
        let com = 1 - this.state.userData.shop.outSystems[this.state.inputTypeWallet].tax / 100;
        this.setState({
            calcSell: this.state.userData.shop.sell > 0 && sum > 0 ? Math.floor((sum / 1000000) * com * this.state.userData.shop.sell * 100) / 100 : 0,
        })
    }

    showLoading = () => {
        this.setState({popout: <ScreenSpinner/>});
    }

    closePopout = () => {
        this.setState({popout: null});
    }

    bankFormat = (value) => {
        let v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        let matches = v.match(/\d{4,16}/g);
        let match = matches && matches[0] || ''
        let parts = []

        for (let i = 0, len = match.length; i<len; i+=4) {
            parts.push(match.substring(i, i+4))
        }

        if (parts.length) {
            return parts.join(' ')
        } else {
            return value
        }
    }
}
