import React from 'react';
import {
    Avatar,
    Button,
    Div,
    Epic,
    FixedLayout,
    FormLayout,
    FormLayoutGroup,
    Group,
    Input,
    ListItem,
    Panel,
    PanelHeader,
    Tabbar,
    TabbarItem,
    Tabs,
    TabsItem,
    View
} from '@vkontakte/vkui';
import Icon28Menu from '@vkontakte/icons/dist/28/menu';
import Icon28UserCircleOutline from '@vkontakte/icons/dist/28/user_circle_outline';
import Icon28GameOutline from '@vkontakte/icons/dist/28/game_outline';
import Icon28UsersOutline from '@vkontakte/icons/dist/28/users_outline';
import Icon28InboxOutline from '@vkontakte/icons/dist/28/inbox_outline';
import Icon28PollSquareOutline from '@vkontakte/icons/dist/28/poll_square_outline';
import Icon28CoinsOutline from '@vkontakte/icons/dist/28/coins_outline';
import Profile from "./pages/Profile";
import './Main.css';
import SystemFunctions from "../SystemFunctions";
import More from "./pages/More";
import Games from "./pages/Games";
import Rating from "./pages/Rating";
import Market from "./pages/Market";

export default class Main extends React.Component {

    constructor(props) {
        super(props);

        let sActiveHomePanel = SystemFunctions.getStaticVar('home_activePanel');

        this.state = {
            showSheet: false,
            bs_header: null,
            bs_content: null,
            activeStory: sActiveHomePanel == null ? 'profile' : sActiveHomePanel,
            go: props.go,
        };
        this.onStoryChange = this.onStoryChange.bind(this);
    }

    onStoryChange(e) {
        this.changeStory(e.currentTarget.dataset.story);
    }

    changeStory = (e) => {
        this.setState({activeStory: e});
        SystemFunctions.saveStaticVar('home_activePanel', e);
    }

    render() {
        return (
            <Panel className='main' separator={false}>
                <Epic className='mainBottomPanel' activeStory={this.state.activeStory} style={{'z-index': -1}} tabbar={
                    <Tabbar>
                        <TabbarItem
                            className={"profile"}
                            onClick={this.onStoryChange}
                            selected={this.state.activeStory === 'profile'}
                            data-story="profile"
                            text="Профиль"
                        ><Icon28UserCircleOutline/></TabbarItem>
                        <TabbarItem
                            className={"market"}
                            onClick={this.onStoryChange}
                            selected={this.state.activeStory === 'market'}
                            data-story="market"
                            text="Биржа"
                        ><Icon28CoinsOutline/></TabbarItem>
                        <TabbarItem
                            className={"games"}
                            onClick={this.onStoryChange}
                            selected={this.state.activeStory === 'games'}
                            data-story="games"
                            text="Играть"
                        ><Icon28GameOutline /></TabbarItem>
                        <TabbarItem
                            className={"rating"}
                            onClick={this.onStoryChange}
                            selected={this.state.activeStory === 'rating'}
                            data-story="rating"
                            text="Рейтинг"
                        ><Icon28PollSquareOutline/></TabbarItem>
                        <TabbarItem
                            className={"more"}
                            onClick={this.onStoryChange}
                            selected={this.state.activeStory === 'more'}
                            data-story="more"
                            text="Ещё"
                        ><Icon28Menu/></TabbarItem>
                    </Tabbar>
                }>
                    <Profile id="profile" changeStory={this.changeStory} go={this.state.go} />
                    <Market id="market" changeStory={this.changeStory} go={this.state.go} />
                    <Games id="games" changeStory={this.changeStory} go={this.state.go} />
                    <Rating id="rating" changeStory={this.changeStory} go={this.state.go} />
                    <More id="more" changeStory={this.changeStory} go={this.state.go} />
                </Epic>
            </Panel>
        )
    }
}