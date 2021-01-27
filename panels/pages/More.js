import React from "react";
import {
    Alert,
    Button,
    Cell,
    Div,
    Group,
    List,
    ModalPage,
    ModalPageHeader,
    ModalRoot,
    Panel,
    PanelHeader,
    PanelHeaderClose,
    PanelHeaderContent,
    ScreenSpinner,
    View
} from "@vkontakte/vkui";
import Icon24LogoVk from '@vkontakte/icons/dist/24/logo_vk';
import Icon24Headphones from '@vkontakte/icons/dist/24/headphones';
import Icon24Add from '@vkontakte/icons/dist/24/add';
import Icon24Coins from '@vkontakte/icons/dist/24/coins';
import Icon24Message from '@vkontakte/icons/dist/24/message';
import Icon24Followers from '@vkontakte/icons/dist/24/followers';
import Icon28Menu from '@vkontakte/icons/dist/28/menu';
import Icon28CopyOutline from '@vkontakte/icons/dist/28/copy_outline';
import Icon28MessageAddBadgeOutline from '@vkontakte/icons/dist/28/message_add_badge_outline';
import connect from "@vkontakte/vk-connect";
import SystemFunctions from "../../SystemFunctions";
import './More.scss';
import Server from "../../Server";

export default class More extends React.Component {
    constructor(props) {
        super(props);

        let sUserData = SystemFunctions.getStaticVar('userData');

        this.state = {
            popout: null,
            activePanel: 'list',
            activeModal: null,

            userData: sUserData == null ? null : sUserData,
        };

    }

    render() {
        return (
            <View className='more' activePanel={this.state.activePanel} popout={this.state.popout} header={true}
                  modal={this.getLocalModal()}>
                <Panel id='list'>
                    <PanelHeader>
                        <PanelHeaderContent before={<Icon28Menu/>}>
                            Ещё
                        </PanelHeaderContent>
                    </PanelHeader>
                    <Group>
                        <List>
                            <Cell className='firstItem' before={<Icon24Add style={{color: '#FF9800'}}/>}
                                  onClick={this.addInMyGroup}>Добавить в сообщество</Cell>
                            <Cell before={<Icon24Followers style={{color: '#CDDC39'}}/>}
                                  onClick={() => this.setState({activeModal: 'ref'})}>Реферальная система</Cell>
                            <Cell before={<Icon24Message style={{color: '#00BCD4'}}/>}
                                  onClick={() => SystemFunctions.openTab("https://vk.me/join/AJQ1d1SJ6RfjdySWAhZftFRR")}>Чат
                                игроков</Cell>
                            <Cell before={<Icon24LogoVk style={{color: '#03A9F4'}}/>}
                                  onClick={() => SystemFunctions.openTab("https://vk.com/public196258588")}>Наша
                                группа</Cell>
                            <Cell before={<Icon24Headphones style={{color: '#2196F3'}}/>}
                                  onClick={() => SystemFunctions.openTab("https://vk.me/devwcg")}>Тех.
                                Поддержка</Cell>
                        </List>
                    </Group>
                </Panel>
            </View>
        );
    }

    renderRef = () => {
        return (<div className='modalPage ref'>
            <Group>
                <Div className='text'>
                    Приглашай людей в наш проект и получай бонусы за их игру!<br/>
                    <br/>
                    До 10 чел. - <b>0.1%</b><br/>
                    10 - 25 чел. - <b>0.2%</b><br/>
                    25 - 100 чел. - <b>0.25%</b><br/>
                    100 - 200 чел. - <b>0.35%</b><br/>
                    200 - 1000 чел. - <b>0.5%</b><br/>
                    От 1000 чел. - <b>1%</b><br/>
                    <br/>
                    Каждый день ты будешь получать выплату процентов от дневных ставок своих рефералов (прогрышных и
                    выигрышных). Бот будет уведомлять о начислениях и их сумме, но для этого нужно разрешить группе
                    присылать тебе сообщения.<br/>
                    <br/>
                    Вы пригласили: <b>{this.state.userData.myRefCount} чел.</b><br/>
                    <br/>
                    Ваша ссылка: <u>vk.com/app7490821#r_{this.state.userData.data.ref}</u>
                </Div>
                <Div className='buttons'>
                    <Button before={<Icon28MessageAddBadgeOutline/>} className='messages' size='xl' mode='secondary' onClick={() => this.onAllowMessages()}>Разрешить
                        сообщения</Button>
                    <Button before={<Icon28CopyOutline/>} className='copy' size='xl' onClick={() => Server.copyText('vk.com/app7490821#r_' + this.state.userData.data.ref)}>Скопировать ссылку</Button>
                </Div>
            </Group>
        </div>);
    }

    getLocalModal = () => {
        return (<ModalRoot activeModal={this.state.activeModal}>
                <ModalPage
                    id='ref'
                    settlingHeight={100}
                    dynamicContentHeight={true}
                    onClose={this.closeModal}
                    header={
                        <ModalPageHeader
                            left={<PanelHeaderClose onClick={this.closeModal}/>}
                        >
                            Реферальная система
                        </ModalPageHeader>
                    }
                >
                    {this.renderRef()}
                </ModalPage>
            </ModalRoot>
        );
    }

    onAllowMessages = () => {
        Server.allowMessagesEvent(() => {
            Server.query(Server.QUERY_MARKET, {a: 'subMessages'}, (response) => {
                let r = response.data;
                if (r.status === 'ok') {
                    this.setState({userData: r.newData});
                }
            });
        });
    }

    addInMyGroup = () => {
        connect.send("VKWebAppAddToCommunity", {});
    }

    setPanel = (e) => {
        this.setState({activePanel: e})
    };

    changePopout = (p) => {
        this.setState({popout: p})
    }

    showAlert = (title, content) => {
        this.setState({
            'popout':
                <Alert
                    actions={[{
                        title: 'ОК',
                        autoclose: true,
                        style: 'default'
                    }]}
                    onClose={this.closePopout}
                >
                    <h2>{title}</h2>
                    <p>{content}</p>
                </Alert>
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
