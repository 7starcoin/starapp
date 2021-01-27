import React from "react";
import {
    Alert,
    Avatar,
    Button,
    Cell,
    Footer,
    Group,
    HeaderContext,
    List,
    Panel,
    PanelHeader,
    Tappable,
    PanelHeaderContent,
    PanelHeaderContext,
    Placeholder,
    ScreenSpinner,
    View
} from "@vkontakte/vkui";
import Icon16Dropdown from '@vkontakte/icons/dist/16/dropdown';
import Icon16Users from '@vkontakte/icons/dist/16/users';
import Icon24Done from '@vkontakte/icons/dist/24/done';
import Icon28SearchOutline from '@vkontakte/icons/dist/28/search_outline';
import Icon28RadiowavesAroundOutline from '@vkontakte/icons/dist/28/radiowaves_around_outline';
import Icon28HelpOutline from '@vkontakte/icons/dist/28/help_outline';
import Icon28GameOutline from '@vkontakte/icons/dist/28/game_outline';
import Icon56FireOutline from '@vkontakte/icons/dist/56/fire_outline';
import './Games.scss';
import SystemFunctions from "../../SystemFunctions";
import Server from "../../Server";

export default class Games extends React.Component {
    constructor(props) {
        super(props);

        let sUserData = SystemFunctions.getStaticVar('userData');

        this.state = {
            activePanel: 'main',
            popout: null,

            userData: sUserData == null ? null : sUserData,
        };
    }

    componentDidMount() {

    }

    render() {
        return (
            <View className='gamesView' activePanel={this.state.activePanel} popout={this.state.popout} header={true}>
                <Panel id='main'>
                    <PanelHeader>
                        <PanelHeaderContent before={<Icon28GameOutline/>}>
                            Игры
                        </PanelHeaderContent>
                    </PanelHeader>
                    <div className='panel'>
                        <Group>
                            <List>
                                <Tappable className='gameItem' onClick={() => this.props.go('gameFortune')}>
                                    <div className='image fortune'/>
                                    <div className='name'>Jackpot</div>
                                </Tappable>
                                <Tappable className='gameItem' onClick={() => this.props.go('gameCrash')}>
                                    <div className='image crash'/>
                                    <div className='name'>Crash</div>
                                </Tappable>
                                <Tappable className='gameItem' onClick={() => this.props.go('gameWheel')}>
                                    <div className='image wheel'/>
                                    <div className='name'>Wheel</div>
                                </Tappable>
                                <Tappable className='gameItem' onClick={() => this.props.go('gameGoldWest')}>
                                    <div className='image goldWest'/>
                                    <div className='name'>GOLD WEST</div>
                                </Tappable>
                                <Tappable className='gameItem' onClick={() => this.props.go('gameDouble')}>
                                    <div className='image double'/>
                                    <div className='name'>DOUBLE</div>
                                </Tappable>
                                <Tappable className='gameItem' onClick={() => this.props.go('gameDice')}>
                                    <div className='image dice'/>
                                    <div className='name'>Под 7 Над</div>
                                </Tappable>
                                <Tappable className='gameItem' onClick={() => this.props.go('gameTower')}>
                                    <div className='image tower'/>
                                    <div className='name'>TOWER</div>
                                </Tappable>
                                <Tappable className='gameItem' onClick={() => this.props.go('gameNvuti')}>
                                    <div className='image nvuti'/>
                                    <div className='name'>Nvuti</div>
                                </Tappable>
                                <Tappable className='gameItem' onClick={() => this.props.go('game21')}>
                                    <div className='image o21'/>
                                    <div className='name'>21 Очко</div>
                                </Tappable>
                                <Tappable className='gameItem' onClick={() => this.props.go('gameThimble')}>
                                    <div className='image thimble'/>
                                    <div className='name'>Thimble</div>
                                </Tappable>
                                <Tappable className='gameItem' onClick={() => this.props.go('gameMoreLess')}>
                                    <div className='image moreLess'/>
                                    <div className='name'>MoreLess</div>
                                </Tappable>
                            </List>
                        </Group>
                    </div>
                </Panel>
            </View>
        );
    }

    changePopout = (p) => {
        this.setState({popout: p})
    }

    showAlert = (title, content, actions = [{
        title: 'ОК',
        autoclose: true,
        style: 'default'
    }]) => {
        this.setState({
            'popout':
                <Alert
                    actions={actions}
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

    closePopout = () => {
        this.setState({'popout': null});
    }
}
