import React from "react";
import {ActivityIndicator, Alert, AppState, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Actions} from 'react-native-router-flux';

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
import {ScreenHeaderActions, SvgView, Text, TextInput} from "../../components";
import { strings } from '../../../helpers/i18nUtils';
import Constant from '../../../helpers/Constants';
import Globals from '../../../services/GlobalService';
import Autosuggest from 'react-autosuggest';
import AutosuggestHighlightMatch from 'autosuggest-highlight/match';
import AutosuggestHighlightParse from 'autosuggest-highlight/parse';

import autosuggest_theme from './autosuggest_theme.css';


let R = require('ramda');
let {remote} = require('electron');
let main = remote.require('./main');
let address_book = remote.require('./utils/addressbook');

export default class CreateTransactionScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            pressedConfirm: false,
            isShowingLoading: false,
            mozo_balance: 0,
            mozo_value: '',
            to_address: '',
            to_addresses_suggestions: []
        };
        this._coin = Constants.COIN_TYPE.SOLO;
    }

    componentDidMount() {
        let balance_info = main.services.getWalletBalance("SOLO");
        if (balance_info) {
            this.setState({mozo_balance: balance_info.balance});
            this._from_address = balance_info.address;
        }
        this._balance_interval = setInterval(() => {
            balance_info = main.services.getWalletBalance("SOLO");
            if (balance_info) {
                this.setState({mozo_balance: balance_info.balance});
            }
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(this._balance_interval);
    }

    renderSuggestion(suggestion, { query }) {
        const matches = AutosuggestHighlightMatch(suggestion.name, query);
        const parts = AutosuggestHighlightParse(suggestion.name, matches);
      
        return (
          <span>
            {parts.map((part, index) => {
              const className = part.highlight ? 'react-autosuggest__suggestion-match' : null;
      
              return (
                <span className={className} key={index}>
                  {part.text}
                </span>
              );
            })}
          </span>
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
      
        let address_book_data = address_book.get();
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
        this.setState({
            mozo_value: text_data.replace(/[^0-9\.]/g, ''),
        });
    }

    onAddressChange = (event, { newValue, method }) => {
        this.setState({
            to_address: newValue
        });
      };

    doCreateTransaction() {
        let to_address = this.state.to_address;
        let mozo_value = this.state.mozo_value;
        if (to_address == this._from_address) {
            return;
        }
        let tx_info = {
            'from' : this._from_address,
            'to' : to_address,
            'value' : mozo_value,
            'network' : this._coin.network
        };
        main.services.createTransaction(tx_info).then((tx_data) => {
            let request_data = {
                coinType: "SOLO",
                network: "SOLO",
                action: "SIGN",
                params: tx_data,
            };
            request_data = JSON.parse(JSON.stringify(request_data));
            Actions.jump('trans_confirm', {txData: request_data});
        }, (error) => {
            if (!error.code == "ERR-094") {
                console.log(error);
                Actions.pop();
            }
        });
    }

    render() {
        return (
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

                    <Text style={styles.text_value}>
                        Spendable:
                        {this.state.mozo_balance} {(this._coin.displayName || '').toUpperCase()}
                    </Text>

                    <View style={styles.dash}/>

                    <Text style={styles.text_section}>To: </Text>
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
                    />

                    <View style={styles.dash}/>

                    <Text style={styles.text_section}>Ammount: </Text>
                    <TextInput
                        style={styles.search_input}
                        placeholder="Mozo ammount"
                        multiline={false}
                        numberOfLines={1}
                        value={this.state.mozo_value}
                        onChangeText={(text) => {
                            this.doFilterNumber(text);
                        }}
                    />

                    <View style={styles.dash}/>

                    <TouchableOpacity
                        style={styles.button_confirm}
                        onPressIn={() => this.setState({pressedConfirm: true})}
                        onPressOut={() => {
                            this.setState({pressedConfirm: false});
                            this.doCreateTransaction();
                        }}
                    >
                        <SvgView
                            fill={colorPrimary}
                            width={20}
                            height={20}
                            svg={icons.icCheck}/>
                        <Text style={styles.text_confirm}>Confirm</Text>
                    </TouchableOpacity>

                    <View style={styles.dash}/>

                    {/* <View style={styles.confirmation_footer}>
                        <Text style={styles.text_reject} onPress={() => {
                            this.cancelTransaction();
                        }}>Reject</Text>
                    </View> */}

                </View>
            </View>
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
