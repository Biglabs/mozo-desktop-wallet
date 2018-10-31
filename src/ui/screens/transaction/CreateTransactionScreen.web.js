import React from "react";
import { ActivityIndicator, Alert, AppState, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Actions } from 'react-native-router-flux';

import Constants from '../../../helpers/Constants';

import {
    colorContentText,
    colorDisable,
    colorError,
    colorPrimary,
    colorScreenBackground,
    colorTitleText,
    dimenScreenPaddingBottom,
    dimenScreenPaddingHorizontal,
    fontBold,
    fontRegular,
    icons
} from '../../../res';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
const theme = createMuiTheme({
    typography: {
        fontSize: 13,
    },
    dense: {
        marginTop: 40
    },
    palette: {
        primary: {...blue, 
            main: "#4e94f3"
        }
      }
});
import { ScreenHeaderActions, SvgView, Text, TextInput, AutoComplete } from "../../components";
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import { strings } from '../../../helpers/i18nUtils';
import Constant from '../../../helpers/Constants';
import Globals from '../../../services/GlobalService';
import Autosuggest from 'react-autosuggest';
import AutosuggestHighlightMatch from 'autosuggest-highlight/match';
import AutosuggestHighlightParse from 'autosuggest-highlight/parse';


let R = require('ramda');
let { ipcRenderer } = require('electron');

export default class CreateTransactionScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pressedConfirm: false,
            isShowingLoading: false,
            mozo_balance: 0,
            mozo_value: '',
            to_address: '',
            to_addresses_suggestions: [],
            addressIsWrong: false,
            amountIsWrong: false
        };
        this._coin = Constants.COIN_TYPE.SOLO;
    }

    componentDidMount() {
        let {to_address, mozo_value} = this.state
        let addressIsWrong = false, amountIsWrong = false
        if (to_address.trim() != "" && !(/^(0x)?[0-9a-fA-F]{40}$/.test(to_address.trim()))) {
            addressIsWrong = true
        } 
      
        if (mozo_value.trim() != "" && isNaN(mozo_value)) {
            amountIsWrong = true
        } 

        this.setState({
            addressIsWrong: addressIsWrong,
            amountIsWrong: amountIsWrong
        })

        let result_data = ipcRenderer.sendSync(
            "get-balance-info", { "network": "SOLO" });
        if (result_data.status == "SUCCESS") {
            this.setState({ mozo_balance: result_data.data.balance });
            this._from_address = result_data.data.address;
        } else {
            this.setState({ mozo_balance: 0 });
        }

        this._balance_interval = setInterval(() => {
            result_data = ipcRenderer.sendSync(
                "get-balance-info", { "network": "SOLO" });
            if (result_data.status == "SUCCESS") {
                this.setState({ mozo_balance: result_data.data.balance });
            }
        }, 2000);
    }

    componentWillUnmount() {
        clearInterval(this._balance_interval);
    }

    renderSuggestion(suggestion, { query, isHighlighted }) {
        const matches = AutosuggestHighlightMatch(suggestion.name, query);
        const parts = AutosuggestHighlightParse(suggestion.name, matches);

        return (
            //   <span>
            //     {parts.map((part, index) => {
            //       const className = part.highlight ? 'react-autosuggest__suggestion-match' : null;

            //       return (
            //         <span className={className} key={index}>
            //           {part.text}
            //         </span>
            //       );
            //     })}
            //   </span>
            <MenuItem selected={isHighlighted} component="div">
                <div>
                    {parts.map((part, index) => {
                        return part.highlight ? (
                            <span key={String(index)} style={{ fontWeight: 500 }}>
                                {part.text}
                            </span>
                        ) : (
                                <strong key={String(index)} style={{ fontWeight: 300 }}>
                                    {part.text}
                                </strong>
                            );
                    })}
                </div>
            </MenuItem>
        );
    }

    // renderSectionTitle(section) {
    //     return (
    //         <strong>{section.name}</strong>
    //     );
    // }

    // getSectionSuggestions(section) {
    //     return [section.soloAddress];
    //   }

    getSuggestions(value) {
        let value_data = value.trim();
        if (value_data === '') {
            return [];
        }

        let address_book_data = ipcRenderer.sendSync("address-book-get", null);
        let found_address_book =
            R.filter(
                x => x.name.includes(value_data) || x.soloAddress.includes(value_data),
                address_book_data
            );
        return found_address_book
    }

    getSuggestionValue(suggestion) {
        return suggestion.soloAddress;
    }

    onSuggestionsFetchRequested = ({ value }) => {
        this.setState({
            to_addresses_suggestions: this.getSuggestions(value)
        });
    }

    onSuggestionsClearRequested = () => {
        this.setState({
            to_addresses_suggestions: []
        });
    }

    doFilterNumber(text_data) {
        let amountIsWrong = false
        if (text_data.toString().trim() == "" || isNaN(text_data)) {
            amountIsWrong = true;
        } else if (!(/^\d+(\.\d{1,2})?$/.test(text_data.toString().trim()))) {
            amountIsWrong = true;
        } else {
            let amount_number = parseFloat(text_data.replace(/[^0-9\.]/g, ''));
            if (amount_number <= 0 || amount_number > this.state.mozo_balance) {
                amountIsWrong = true;
            }
        }

        this.setState({
            mozo_value: text_data.replace(/[^0-9\.]/g, ''),
            amountIsWrong: amountIsWrong
        });
    }

    onAddressChange = (event, { newValue, method }) => {
        console.log("newValue", newValue)
        let addressIsWrong = false
        if (newValue.trim() == "" || !(/^(0x)?[0-9a-fA-F]{40}$/.test(newValue.trim()))) {
            addressIsWrong = true;
        }

        if (newValue.trim() == this._from_address) {
            addressIsWrong = true;
        }

        this.setState({
            to_address: newValue,
            addressIsWrong: addressIsWrong
        });
    };

    doCreateTransaction() {
        let to_address = this.state.to_address.trim();
        this.state.to_address = to_address;
        let mozo_value = this.state.mozo_value;
        if (to_address == this._from_address) {
            return;
        }
        let tx_info = {
            'from': this._from_address,
            'to': to_address,
            'value': mozo_value,
            'network': this._coin.network
        };
        let result_data = ipcRenderer.sendSync("create-transaction", tx_info);
        this.setState({pressedConfirm: false})
        if (result_data) {
            if (result_data.status == "SUCCESS") {
                let request_data = {
                    coinType: "SOLO",
                    network: "SOLO",
                    action: "SIGN",
                    params: result_data.data,
                };
                request_data = JSON.parse(JSON.stringify(request_data));
                Actions.jump('trans_confirm', { txData: request_data });
            } else {
                let error_data = result_data.error;
                if (error_data.code != "ERR-094") {
                    console.log(error_data);
                    Actions.pop();
                }
            }
        } else {
            Actions.pop();
        }
    }

    render() {
        return (
            <MuiThemeProvider theme={theme}>
                <View style={styles.container}>
                    <ScreenHeaderActions
                        title='Send MOZO'
                        backgroundColor={colorPrimary}
                        accentColor='#ffffff'
                        onBackPress={() => {
                            Actions.reset('home');
                        }}
                    />

                    <View style={styles.content}>

                        {/* <Text style={styles.text_value}>
                            Spendable:
                        {this.state.mozo_balance} {(this._coin.displayName || '').toUpperCase()}
                        </Text> */}

                        {/* <View style={styles.dash} /> */}

                        {/* <Text style={styles.text_section}>To: </Text>
                    <Autosuggest
                        theme={autosuggest_theme}
                        suggestions={this.state.to_addresses_suggestions}
                        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                        getSuggestionValue={this.getSuggestionValue}
                        renderSuggestion={this.renderSuggestion}

                        inputProps={{
                            placeholder: "Receiver's address",
                            value: this.state.to_address,
                            onChange: this.onAddressChange
                        }}
                    /> */}
                        <AutoComplete
                            inputProps={{
                                label: "Receiver Address",
                                placeholder: "Receiver's address"
                            }}
                            onChange={(e, value) => this.onAddressChange(e, value)}
                            getSuggestionData={(value) => this.getSuggestions(value)}
                            getSuggestionValue={this.getSuggestionValue}
                            renderSuggestion={this.renderSuggestion} />

                        {/* <View style={styles.dash}/> */}

                        {/* <Text style={styles.text_section}>Ammount: </Text>
                    <TextInput
                        style={styles.search_input}
                        placeholder="Mozo ammount"
                        multiline={false}
                        numberOfLines={1}
                        value={this.state.mozo_value}
                        onChangeText={(text) => {
                            this.doFilterNumber(text);
                        }}
                    /> */}
                        <TextField
                            id="standard-uncontrolled"
                            label="Ammount"
                            value={this.state.mozo_value}
                            fullWidth
                            margin="normal"
                            style = {{marginTop: 24}}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            inputProps={{
                                placeholder: "Mozo ammount",
                            }}
                            onChange={(e) => {
                                this.doFilterNumber(e.target.value);
                            }}
                        />
                        <Text style={styles.text_small}>
                            Spendable:
                            <Text style={styles.text_primary}>{this.state.mozo_balance} {(this._coin.displayName || '').toUpperCase()}</Text>
                        </Text>

                        {/* <View style={styles.dash}/> */}

                        {/* <TouchableOpacity
                            onPressIn={() => this.setState({ pressedConfirm: true })}
                            onPressOut={() => {
                                this.setState({ pressedConfirm: false });
                                this.doCreateTransaction();
                            }}
                        >
                            <Button  style = {{marginTop: 36}}
                                disableRipple="true" variant="contained" size="large" color="primary" fullWidth>
                                Continue
                            </Button>
                        </TouchableOpacity> */}

                         <Button 
                            disabled={this.state.addressIsWrong || this.state.to_address.trim() == "" || this.state.amountIsWrong || this.state.mozo_value.trim() == "" || this.state.pressedConfirm}
                            onClick={() => {
                                this.setState({ pressedConfirm: true });
                                this.doCreateTransaction();
                            }} style = {{marginTop: 36}}
                                disableRipple="true" variant="contained" size="large" color="primary" fullWidth>
                                Continue
                        </Button>

                        {/* <View style={styles.confirmation_footer}>
                        <Text style={styles.text_reject} onPress={() => {
                            this.cancelTransaction();
                        }}>Reject</Text>
                    </View> */}

                    </View>
                </View>
            </MuiThemeProvider>
        )
    }
}

const styles = StyleSheet.create({
    loading_container: {
        backgroundColor: colorPrimary,
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        alignItems: 'flex-start',
        backgroundColor: colorScreenBackground,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    confirmation_footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        width: '100%',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: dimenScreenPaddingHorizontal
    },
    dash: {
        height: 1,
        backgroundColor: colorDisable,
        marginTop: 20,
        marginBottom: 15
    },
    text_send: {
        color: colorContentText,
        fontSize: 16,
        marginLeft: 12
    },
    text_value: {
        color: colorPrimary,
        fontSize: 25
    },
    text_small: {
        fontSize: "70%"
    },
    text_primary: {
        color: colorPrimary
    },
    text_usd: {
        color: '#c1c1c1',
        fontSize: 14
    },
    text_section: {
        color: colorTitleText,
        fontSize: 14,
        fontFamily: fontBold
    },
    text_mining_fee_value: {
        fontFamily: fontRegular
    },
    text_address: {
        color: '#969696',
        fontSize: 12
    },
    text_confirm: {
        color: colorTitleText,
        fontSize: 16,
        fontFamily: fontBold,
        marginLeft: 6,
    },
    text_reject: {
        color: colorError,
        fontSize: 14,
        position: 'absolute',
        right: 0,
        bottom: 0,
        paddingBottom: 27,
        paddingLeft: dimenScreenPaddingHorizontal,
        paddingRight: dimenScreenPaddingHorizontal,
    },
    button_confirm: {
        //height: dimenScreenPaddingBottom,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        //position: 'absolute',
        bottom: 0,
        left: '36%',
        right: '36%',
    },
    countdown_confirm: {
        marginBottom: 100
    },
    confirmation_container: {
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    confirmation_text: {
        color: '#5a9cf5',
        fontSize: 12
    }
});
