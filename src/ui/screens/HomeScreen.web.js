import React from "react";
import {StyleSheet, TouchableOpacity, View, Platform} from 'react-native';
import {SvgView} from "../components"
import {Actions} from 'react-native-router-flux';

import Constants from '../../helpers/Constants';

import {
    colorDisable,
    colorPrimary,
    colorScreenBackground,
    colorTitleText,
    dimenScreenPaddingHorizontal,
    icons
} from '../../res';
import {BackupWalletStateIcon, Text} from "../components";
import {LinkingService, CachingService} from '../../services';

let {ipcRenderer} = require('electron');

// use for display svg on web
import SVGInline from "react-svg-inline";

export default class HomeScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mozo_value: ''
        };
        this._coin = Constants.COIN_TYPE.SOLO;
    }

    componentDidMount() {
        let balance_info = ipcRenderer.sendSync(
            "get-balance-info", { "network" : "SOLO" });
        if (balance_info) {
            this.setState({mozo_balance: balance_info.balance});
        }
        this._balance_interval = setInterval(() => {
            balance_info = ipcRenderer.sendSync(
                "get-balance-info", { "network" : "SOLO" });
            if (balance_info) {
                this.setState({mozo_balance: balance_info.balance});
            }
        }, 1000);
        this.manageScheme();
    }

    componentWillUnmount() {
        clearInterval(this._balance_interval);
    }

    manageScheme() {
        let storage = CachingService.getInstance();
        let schemeData = storage.getSchemeData();
        if (schemeData) {
            LinkingService.manageScheme(schemeData, this.props.pin);
            CachingService.getInstance().setSchemeData(null);
        }
    }

    displayIcSoloTitle(){
        //check platform
        if(Platform.OS.toUpperCase() ==="WEB"){
            return (
                <View style={styles.toolbar}>
                    <SVGInline
                        width="78"
                        height="36"
                        fill={colorPrimary}
                        svg={icons.icSoloTitle}
                        style={{
                            marginBottom: 10,
                        }}
                    /> 
                </View>
            );
        }else {
            return (
                <View style={styles.toolbar}>
                    <SvgView
                        width={78}
                        height={36}
                        fill={colorPrimary}
                        svg={icons.icSoloTitle}
                        style={{
                            marginBottom: 10,
                        }}/>
                </View>
            );
        }
    }

    displayBackupWallet (){
        if(Platform.OS.toUpperCase() ==="WEB"){
            return (
                <TouchableOpacity
                    style={[styles.buttons, {marginTop: 20}]}
                    onPress={() => Actions.backup_wallet_menu({pin: this.props.pin})}>
                    <SVGInline
                        width="24"
                        height="20"
                        fill={colorPrimary}
                        svg={icons.icBackup}
                    /> 
                    <Text style={[styles.buttons_text, {marginLeft: 7}]}>Backup Wallet</Text>
                </TouchableOpacity>
            );
        }
    }

    displayCreateTransactionScreen() {
        if(Platform.OS.toUpperCase() ==="WEB") {
            return(
                <TouchableOpacity
                    style={styles.buttons}
                    onPress={() => Actions.jump('create_transaction')}
                >
                    <SVGInline
                        width="20"
                        height="20"
                        fill={colorPrimary}
                        svg={icons.icSync}/>
                    <Text style={styles.buttons_text}>Send Mozo</Text>
                </TouchableOpacity>
            );
        }
    }

    // displayPairDevices(){
    //     if(Platform.OS.toUpperCase() ==="WEB"){
    //         return(
    //             <TouchableOpacity style={styles.buttons}>
    //                 <SVGInline
    //                     width="20"
    //                     height="20"
    //                     fill={colorPrimary}
    //                     svg={icons.icSync}/>
    //                 <Text style={styles.buttons_text}>Pair Devices</Text>

    //                 <TouchableOpacity style={styles.buttons_icon}>
    //                     <SVGInline
    //                         width="20"
    //                         height="20"
    //                         svg={icons.icInformation}/>
    //                 </TouchableOpacity>
    //             </TouchableOpacity>
    //         );
    //     }
    // }

    displayPaperWallet() {
        if(Platform.OS.toUpperCase() ==="WEB"){
            return (
                <TouchableOpacity
                    style={styles.buttons}
                    onPress={() => Actions.paper_wallet()}>
                    <SVGInline
                        width="20"
                        height="20"
                        fill={colorPrimary}
                        svg={icons.icNote}/>
                    <Text style={styles.buttons_text}>Paper Wallet</Text>

                    <TouchableOpacity style={styles.buttons_icon}>
                        <SVGInline
                            width="20"
                            height="20"
                            svg={icons.icInformation}/>
                    </TouchableOpacity>
                </TouchableOpacity>
            );
        }
    }

  logOutApp() {
    if(Platform.OS.toUpperCase() === "WEB"){
      ipcRenderer.send("logout-app");
    }
  }

  displayLogOutApp() {
    if(Platform.OS.toUpperCase() ==="WEB"){
      return (
          <TouchableOpacity
              style={styles.buttons}
              onPress={() => this.logOutApp()}>
              <Text style={styles.buttons_text}>Log Out</Text>
          </TouchableOpacity>
      );
    }
  }

    render() {
        return (
            <View style={styles.container}>
                {/* <View style={styles.toolbar}>
                    <SvgUri
                        width={78}
                        height={36}
                        fill={colorPrimary}
                        svgXmlData={icons.icSoloTitle}
                        style={{
                            marginBottom: 10,
                        }}/>
                </View> */}
                {this.displayIcSoloTitle()}

                {/* <TouchableOpacity
                    style={[styles.buttons, {marginTop: 20}]}
                    onPress={() => Actions.backup_wallet_menu({pin: this.props.pin})}>
                    <SvgUri
                        width={24}
                        height={20}
                        fill={colorPrimary}
                        svgXmlData={icons.icBackup}/>
                    <Text style={[styles.buttons_text, {marginLeft: 7}]}>Backup Wallet</Text>

                    <BackupWalletStateIcon/>

                    <TouchableOpacity style={styles.buttons_icon}>
                        <SvgUri
                            width={20}
                            height={20}
                            svgXmlData={icons.icInformation}/>
                    </TouchableOpacity>
                </TouchableOpacity> */}

                <Text style={styles.text_value}>
                        Balance:
                        {this.state.mozo_balance} {(this._coin.displayName || '').toUpperCase()}
                </Text>

                <View style={styles.dash}/>

                {this.displayBackupWallet()}
                
                <View style={styles.dash}/>

                {/* <TouchableOpacity style={styles.buttons}>
                    <SvgUri
                        width={20}
                        height={20}
                        fill={colorPrimary}
                        svgXmlData={icons.icSync}/>
                    <Text style={styles.buttons_text}>Pair Devices</Text>

                    <TouchableOpacity style={styles.buttons_icon}>
                        <SvgUri
                            width={20}
                            height={20}
                            svgXmlData={icons.icInformation}/>
                    </TouchableOpacity>
                </TouchableOpacity> */}
                {this.displayCreateTransactionScreen()}
                {/* {this.displayPairDevices()} */}

                <View style={styles.dash}/>

                {/* <TouchableOpacity
                    style={styles.buttons}
                    onPress={() => Actions.paper_wallet()}>
                    <SvgUri
                        width={20}
                        height={20}
                        fill={colorPrimary}
                        svgXmlData={icons.icNote}/>
                    <Text style={styles.buttons_text}>Paper Wallet</Text>

                    <TouchableOpacity style={styles.buttons_icon}>
                        <SvgUri
                            width={20}
                            height={20}
                            svgXmlData={icons.icInformation}/>
                    </TouchableOpacity>
                </TouchableOpacity> */}
                {this.displayPaperWallet()}

                <View style={styles.dash}/>

            {this.displayLogOutApp()}
            <View style={styles.dash}/>

                <View style={styles.content}>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: colorScreenBackground,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start'
    },
    toolbar: {
        width: '100%',
        height: 83,
        backgroundColor: colorScreenBackground,
        justifyContent: 'flex-end',
        alignItems: 'center',
        shadowColor: '#7ba3d8',
        shadowOffset: {width: 0, height: 3.5},
        shadowOpacity: 0.25,
        shadowRadius: 11,
        elevation: 6,
    },
    buttons: {
        width: '100%',
        height: 60,
        flexDirection: 'row',
        paddingLeft: dimenScreenPaddingHorizontal,
        paddingRight: dimenScreenPaddingHorizontal,
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    buttons_text: {
        color: colorTitleText,
        fontSize: 14,
        marginLeft: 11,
        paddingBottom: 4,
    },
    buttons_icon: {
        height: '100%',
        position: 'absolute',
        top: 0,
        right: 0,
        paddingLeft: dimenScreenPaddingHorizontal,
        paddingRight: dimenScreenPaddingHorizontal,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dash: {
        width: '84%',
        height: 1,
        backgroundColor: colorDisable,
        marginLeft: dimenScreenPaddingHorizontal,
        marginRight: dimenScreenPaddingHorizontal,
    },
    content: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },
});
