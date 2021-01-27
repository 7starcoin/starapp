import React from "react";
import {
    Avatar,
    Cell,
    List,
    Panel,
    PanelHeader,
    PanelHeaderContent,
    PullToRefresh,
    ScreenSpinner,
    SimpleCell,
    View,
} from "@vkontakte/vkui";
import Server from "../../Server";
import SystemFunctions from "../../SystemFunctions";
import Icon28PollSquareOutline from '@vkontakte/icons/dist/28/poll_square_outline';
import './Rating.css';

export default class Rating extends React.Component {

    reqGetUsers = false;

    constructor(props) {
        super(props);

        let sRating = SystemFunctions.getStaticVar('rating');
        let sUserData = SystemFunctions.getStaticVar('userData');
        let sFreeToken = SystemFunctions.getStaticVar('freeToken');

        this.state = {
            rating: sRating == null ? null : sRating,
            activeTab: 'users',
            activeTabSubUsers: 'balance',
            activeTabSubGroups: 'balance',

            token: sFreeToken == null ? null : sFreeToken,

            userData: sUserData,
            usersVkData: {},
        };
        this.onRefresh(true);
    }

    renderRating = () => {
        if (this.state.rating == null) {
            return <div/>
        }
        let ret = [];
        let cur = this.state.rating.week_wc;
        if (SystemFunctions.getStaticVar('sCoin') === 'coins'){
            cur = this.state.rating.week;
        }
        if (cur.rating == null) {
            return null;
        }
        let valueName = cur.valueName;
        let inTop = false;
        for (let i = 0; i < cur.rating.length; i++) {
            let he = cur.rating[i];
            let my = false;
            if (he.id == Server.user_id) {
                my = true;
                inTop = true;
            }
            he.avatar = 'no';
            let name = he.name;
            if (this.state.usersVkData[he.id] == null) {
                this.getUsersInfo();
            } else {
                he.avatar = this.state.usersVkData[he.id].photo_100;
                if (name == null) {
                    name = this.state.usersVkData[he.id].first_name + ' ' + this.state.usersVkData[he.id].last_name;
                }
            }
            if (name == null) {
                name = '@' + he.id;
            }
            if (he.color == null) {
                he.color = 0;
            }

            let crown = he.crown;

            let topBonus = this.state.userData.global.topBonus_wc;
            if (SystemFunctions.getStaticVar('sCoin') === 'coins'){
                topBonus = this.state.userData.global.topBonus;
            }
            let curBonus = null;
            if (topBonus != null && i < topBonus.length){
                curBonus = topBonus[i];
            }
            ret.push(<SimpleCell className='ratingCell' before={<table className='table'>
                <tr>
                    <td>
                        <div className='ratingPosition'>{i + 1}</div>
                    </td>
                    <td style={{position: 'relative'}}><Avatar className={'ratingAvatar' + (my ? ' my' : '')} size={48}
                                                               src={he.avatar === 'no' ? null : he.avatar}/>
                        {crown != null && crown > 0 ? <div className='crown'>{crown}</div> : null}
                    </td>
                </tr>
            </table>}
                                 indicator={curBonus == null ? null : <div className='prize'>
                                     <div className='header'>ПОСЛЕ 0:00<br/>ПОЛУЧИТ</div>
                                     <div className='sum'>{SystemFunctions.reduceNumber(curBonus)}</div>
                                 </div>}
                                 description={SystemFunctions.formatNumber(he.value) + ' ' + SystemFunctions.wordDeclensionNumeric(he.value, valueName[0], valueName[1], valueName[2])}
                                 expandable
                                 onClick={he.id < 1 ? () => {
                                 } : () => SystemFunctions.openTab("https://vk.com/id" + he.id)}>
                <div className={'usersColorsBase-' + he.color}>{name}</div>
            </SimpleCell>);
        }

        if (!inTop) {
            let vkData = SystemFunctions.getStaticVar('userVkData');
            let value = this.state.userData.stat_week_win_sum_wc;
            if (SystemFunctions.getStaticVar('sCoin') === 'coins'){
                value = this.state.userData.stat_week_win_sum;
            }
            let avatar = vkData.photo_200;
            let crown = this.state.userData.data.crown;
            let name = this.state.userData.data.name;
            if (name == null) {
                name = vkData.first_name + ' ' + vkData.last_name;
            }
            let color = this.state.userData.data.color;
            if (color == null) {
                color = 0;
            }
            let myPos = cur.myPosition;
            ret.push(<Cell className='ratingCell ratingMyCell' before={<table className='table'>
                <tr>
                    <td>
                        <div className='ratingPosition'>{myPos}</div>
                    </td>
                    <td style={{position: 'relative'}}><Avatar className={'ratingAvatar my'} size={48}
                                                               src={avatar == null ? null : avatar}/>
                        {crown != null && crown > 0 ? <div className='crown'>{crown}</div> : null}
                    </td>
                </tr>
            </table>}
                           description={SystemFunctions.formatNumber(value) + ' ' + SystemFunctions.wordDeclensionNumeric(value, valueName[0], valueName[1], valueName[2])}
                           expandable
                           onClick={this.state.userData.id < 1 ? () => {
                           } : () => SystemFunctions.openTab("https://vk.com/" + ('id' + this.state.userData.id))}>
                <div className={'usersColorsBase-' + color}>{name}</div>
            </Cell>);
        }
        return ret;
    }

    onRefresh = (first = false) => {
        if (!first) {
            this.setState({fetching: true});
        }

        Server.query(Server.QUERY_GET_RATING, {}, (response) => {
            if (first && (this.state.rating == null)) {
                this.closePopout();
            }
            let r = response.data;
            SystemFunctions.saveStaticVar('rating', r.data);
            this.setState({
                rating: r.data,

                fetching: false,
            });
        }, (e) => this.setState({fetching: false, popout: null}));
    }

    componentDidMount() {
        if (this.state.rating == null) {
            this.showLoading();
        }
    }

    render() {
        let cy = 'wc';
        if (SystemFunctions.getStaticVar('sCoin') === 'coins'){
            cy = 'coins';
        }
        return (
            <View activePanel='rating' popout={this.state.popout}>
                <Panel id='rating'>
                    <PanelHeader>
                        <PanelHeaderContent before={<Icon28PollSquareOutline/>}>
                            Рейтинг
                        </PanelHeaderContent>
                    </PanelHeader>
                    <PullToRefresh onRefresh={this.onRefresh} isFetching={this.state.fetching}>
                        <List className={'list ' + cy}>
                            {this.state.rating == null ? null :
                                <div>
                                    <this.renderRating/>
                                </div>
                            }
                        </List>
                    </PullToRefresh>
                </Panel>
            </View>
        );
    }

    getUsersInfo = () => {
        if (this.reqGetUsers) {
            return;
        }
        this.reqGetUsers = true;
        this.showLoading();
        if (this.state.token == null) {
            Server.getUserToken('', (r) => {
                let token = r.access_token;
                SystemFunctions.saveStaticVar('freeToken', token);
                this.closePopout();
                this.reqGetUsers = false;
                this.setState({
                    token: token,
                });
            }, (e) => {
                this.closePopout();
                this.reqGetUsers = false;
                //TODO: alert('Невозможно получить доступ!')
            })
        } else {
            let users = [];
            let gu = '';

            if (this.state.rating != null && this.state.rating.week != null && this.state.rating.week.rating != null) {
                for (let i = 0; i < this.state.rating.week.rating.length; i++) {
                    let he = this.state.rating.week.rating[i];
                    let uid = he.id;
                    if (!SystemFunctions.in_array(users, uid)) {
                        gu += ',' + uid;
                        users.push(uid);
                    }
                }
                for (let i = 0; i < this.state.rating.week_wc.rating.length; i++) {
                    let he = this.state.rating.week_wc.rating[i];
                    let uid = he.id;
                    if (!SystemFunctions.in_array(users, uid)) {
                        gu += ',' + uid;
                        users.push(uid);
                    }
                }
            } else {
                this.closePopout();
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
                    this.closePopout();
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
                    this.closePopout();
                    this.reqGetUsers = false;
                }
            );
        }
    }

    showLoading = () => {
        this.setState({popout: <ScreenSpinner/>});
    }

    closePopout = () => {
        this.setState({popout: null});
    }
}
