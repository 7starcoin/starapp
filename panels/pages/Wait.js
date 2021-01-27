import React from "react";
import {
    Avatar,
    Cell,
    FixedLayout, Group,
    HorizontalScroll,
    List,
    Panel,
    PanelHeader,
    PanelHeaderBack,
    PanelHeaderContent,
    PullToRefresh,
    ScreenSpinner, Switch,
    Tabs,
    Placeholder,
    TabsItem,
    View,
    Button, PanelHeaderSimple,
} from "@vkontakte/vkui";
import Server from "../../Server";
import SystemFunctions from "../../SystemFunctions";
import Icon56HideOutline from '@vkontakte/icons/dist/56/hide_outline';
import Icon28ArrowLeftOutline from '@vkontakte/icons/dist/28/arrow_left_outline';

export default class Wait extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <View activePanel='error' header={false}>
                <Panel id='error'>
                    <PanelHeaderSimple separator={false}/>
                    <Placeholder
                        icon={<Icon56HideOutline style={{color: '#FF9800'}} />}
                        header={"Не сворачивайте приложение!"}
                        action={<Button size="l" before={<Icon28ArrowLeftOutline width={16} height={16}/>} onClick={() => this.props.go('home')}>Вернуться</Button>}
                        stretched
                    >
                        Приложение не работает в фоновом режиме
                    </Placeholder>
                </Panel>
            </View>
        );
    }
}