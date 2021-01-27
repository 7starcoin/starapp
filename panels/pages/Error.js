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
import Icon56ErrorOutline from '@vkontakte/icons/dist/56/error_outline';

export default class Error extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <View activePanel='error' header={false}>
                <Panel id='error'>
                    <PanelHeaderSimple separator={false}/>
                    <Placeholder
                        icon={<Icon56ErrorOutline style={{color: '#ef5350'}} />}
                        header={"Ошибка"}
                        action={<Button size="l" mode="tertiary" onClick={() => this.props.go('home')}>Повторить попытку</Button>}
                        stretched
                    >
                        {SystemFunctions.getStaticVar('error_text')}
                    </Placeholder>
                </Panel>
            </View>
        );
    }
}