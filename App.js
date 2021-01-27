import React, {useEffect, useState} from 'react';
import connect from '@vkontakte/vk-connect';
import View from '@vkontakte/vkui/dist/components/View/View';
import Root from '@vkontakte/vkui/dist/components/Root/Root';
import ScreenSpinner from '@vkontakte/vkui/dist/components/ScreenSpinner/ScreenSpinner';
import '@vkontakte/vkui/dist/vkui.css';

import SystemFunctions from "./SystemFunctions";
import Error from "./panels/pages/Error";
import Wait from "./panels/pages/Wait";
import Main from "./panels/Main";
import GameCrash from "./panels/pages/games/GameCrash";
import GameDice from "./panels/pages/games/GameDice";
import GameWheel from "./panels/pages/games/GameWheel";
import Server from "./Server";
import ConfigProvider from "../node_modules/@vkontakte/vkui/dist/components/ConfigProvider/ConfigProvider";
import GameNvuti from "./panels/pages/games/GameNvuti";
import GameMines from "./panels/pages/games/GameMines";
import Game21 from "./panels/pages/games/Game21";
import GameFortune from "./panels/pages/games/GameFortune";
import GameThimble from "./panels/pages/games/GameThimble";
import GameMoreLess from "./panels/pages/games/GameMoreLess";
import Shop from "./panels/pages/Shop";
import GameTower from "./panels/pages/games/GameTower";
import GameGoldWest from "./panels/pages/games/GameGoldWest";
import GameDouble from "./panels/pages/games/GameDouble";

let hashf = document.location.hash;
if (hashf.length > 1) {
    let hash = hashf.substr(1);
    SystemFunctions.saveStaticVar('startHash', hash);
}
SystemFunctions.saveStaticVar('siCoin', 0);
SystemFunctions.saveStaticVar('sCoin', 'wc');
Server.subscribeEvent();
const App = () => {
    const [activePanel, setActivePanel] = useState('home');
    const [history, setHistory] = useState(['home']);
    const [fetchedUser, setUser] = useState(null);
    const [popout, setPopout] = useState(<ScreenSpinner size='large'/>);

    const goBack = () => {
        if (history.length === 1) {
            connect.send("VKWebAppClose", {"status": "success"});
        } else if (history.length > 1) {
            history.pop();
            setActivePanel(history[history.length - 1]);
        }
    }

    useEffect(() => {
        window.addEventListener('popstate', () => goBack());
        connect.subscribe(({detail: {type, data}}) => {
            if (type === 'VKWebAppUpdateConfig') {
                const schemeAttribute = document.createAttribute('scheme');
                schemeAttribute.value = data.scheme ? data.scheme : 'client_light';
                document.body.attributes.setNamedItem(schemeAttribute);
            }
        });

        async function fetchData() {
            const user = await connect.sendPromise('VKWebAppGetUserInfo');
            setUser(user);
            setPopout(null);
        }

        fetchData();
    }, []);

    const go = e => {
        window.history.pushState({panel: e}, e);
        setActivePanel(e);
        history.push(e);
    };

    return (
        <ConfigProvider isWebView={true}>
            <Root activeView={activePanel}>
                <View id='home' popout={popout} header={false} activePanel='main'>
                    <Main id='main' fetchedUser={fetchedUser} go={go}/>
                </View>
                <Shop id='shop' go={go}/>
                <Error id='error' go={go}/>
                <Wait id='wait' go={go}/>

                <GameCrash id='gameCrash' go={go}/>
                <GameDice id='gameDice' go={go}/>
                <GameWheel id='gameWheel' go={go}/>
                <GameNvuti id='gameNvuti' go={go}/>
                <GameMines id='gameMines' go={go}/>
                <GameFortune id='gameFortune' go={go}/>
                <GameThimble id='gameThimble' go={go}/>
                <Game21 id='game21' go={go}/>
                <GameMoreLess id='gameMoreLess' go={go}/>
                <GameTower id='gameTower' go={go}/>
                <GameGoldWest id='gameGoldWest' go={go}/>
                <GameDouble id='gameDouble' go={go}/>
            </Root>
        </ConfigProvider>
    );
}

export default App;
