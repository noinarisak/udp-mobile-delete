import React, { memo, useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import {
  Snackbar,
  Subheading,
  Title,
  TextInput as Input,
  Modal,
} from 'react-native-paper';
import axios from 'axios';
import DropDown from 'react-native-paper-dropdown';
import BackButton from '../components/BackButton';
import Background from '../components/Background';
import Header from '../components/Header';
import TextInput from '../components/TextInput';
import { theme } from '../core/theme';
import Button from '../components/Button';
import configFile from '../../samples.config';

const date = new Date();
const history = [
  {
    detail: `Ending balance as of ${date.toDateString()}`,
    balance: 5689,
  },
  {
    detail: `Available balance`,
    balance: 5129,
  }
];
const accounts = [
  {
    value: 0,
    label: '800000 Corporate',
  },
  {
    value: 1,
    label: '800001 Checking',
  }
];
const requiredFields = [
  {
    name: 'zipCode',
    label: 'Zip code',
    value: '',
  },
  {
    name: 'streetAddress',
    label: 'Street address',
  },
  {
    name: 'city',
    label: 'City',
  },
  {
    name: 'state',
    label: 'State',
  }
];
const successMessage = 'Transaction has been successfully authorized.';

const TransactionScreen = ({ route, navigation }) => {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [message, setMessage] = useState(successMessage);
  const [fromAccount, setFromAccount] = useState(null);
  const [toAccount, setToAccount] = useState(null);
  const [showFromDropDown, setShowFromDropDown] = useState(false);
  const [showToDropDown, setShowToDropDown] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(null);
  const [fields, setFields] = useState([]);
  const [modalVisible, setModalVisible] = useState(true);
  const [modalValues, setModalValues] = useState({
    zipCode: {
      value: '',
      error: '',
    },
    streetAddress: {
      value: '',
      error: '',
    },
    city: {
      value: '',
      error: '',
    },
    state: {
      value: '',
      error: '',
    }
  });

  useEffect(() => {
    const { user } = route.params;
    console.log('user---', user);
    if(user) {
      const list = [];
      for(let item of requiredFields) {
        if(!user[item.name]) {
          list.push(item);
        }
      }
      setFields(list);
    }
  }, [route.params]);

  onPayment = () => {
    if(!amount || amount <= 0) {
      setAmountError('You have to specify the amount');
    } else {
      setAmountError(null);
      const uri = `${configFile.authUri}?client_id=${configFile.transactionalMFA.clientId}&response_type=token&scope=openid&redirect_uri=${configFile.authUri}/callback&state=customstate&nonce=${configFile.nonce}`;
      navigation.navigate('CustomWebView', { uri, onGoBack: (status) => displayBanner(status) }, false);
    }
  }

  displayBanner = (status) => {
    setMessage(status ? successMessage : 'An error has occured.');
    setBannerVisible(true);
  }

  changeModalValues = (name, text) => {
    switch(name) {
      case 'zipCode':
        setModalValues({...modalValues, zipCode: { value: text, error: '' } });
        break;
      case 'streetAddress':
        setModalValues({...modalValues, streetAddress: { value: text, error: '' } });
        break;
      case 'city':
        setModalValues({...modalValues, city: { value: text, error: '' } });
        break;
      case 'state':
        setModalValues({...modalValues, state: { value: text, error: '' } });
        break;
    }
  }

  onUpdateProfile = () => {
    const { accessToken, userId, user } = route.params;
    axios.put(`${configFile.customUrl}/proxy/udp-mobile/users/${userId}`, {
      profile: {
        ...user,
        ...modalValues.zipCode.value && { zipCode: modalValues.zipCode.value },
        ...modalValues.streetAddress.value && { streetAddress: modalValues.streetAddress.value },
        ...modalValues.city.value && { city: modalValues.city.value },
        ...modalValues.state.value && { state: modalValues.state.value },
      },
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    .then(response => {
      Alert.alert(
        'Success',
        'Your profile was updated successfully.',
        [
          { text: 'OK', onPress: () => setModalVisible(false) }
        ],
        { cancelable: false }
      );
    }
    ,(error) => {
      Alert.alert(
        'Error',
        'An error has occured, please try again.',
        [
          { text: 'OK', onPress: () => console.log('error', error.response.data) }
        ],
        { cancelable: false }
      );
    })
  }

  return (
    <>
      <Background>
      
        <BackButton goBack={() => navigation.goBack()} />
        <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Header>Account</Header>
          <View style={styles.inputContainer}>
            <View style={styles.panel}>
              <Title>Account History</Title>
              <Subheading>Balance Details</Subheading>
              {
                history.map(item => (
                  <View key={item.detail} style={styles.row}>
                    <Text style={styles.itemDetail}>{item.detail}</Text>
                    <Text style={styles.amount}>{`$${item.balance}`}</Text>
                  </View>
                ))
              }
            </View>
            <View style={styles.panel}>
              <Title>Transfer Money</Title> 
              <View style={styles.row}>
                <DropDown
                  label={'From Account'}
                  mode={'outlined'}
                  value={fromAccount}
                  setValue={setFromAccount}
                  list={accounts}
                  visible={showFromDropDown}
                  showDropDown={() => setShowFromDropDown(true)}
                  onDismiss={() => setShowFromDropDown(false)}
                  inputProps={{
                    right: <Input.Icon name={'menu-down'} />,
                  }}
                />
              </View>
              <View style={styles.row}>
                <DropDown
                  label={'To Account'}
                  mode={'outlined'}
                  value={toAccount}
                  setValue={setToAccount}
                  list={accounts}
                  visible={showToDropDown}
                  showDropDown={() => setShowToDropDown(true)}
                  onDismiss={() => setShowToDropDown(false)}
                  inputProps={{
                    right: <Input.Icon name={'menu-down'} />,
                  }}
                />
              </View>
              <View style={styles.row}>
                <TextInput
                  label="Amount to Transfer"
                  value={amount}
                  onChangeText={amount => setAmount(amount)}
                  error={!!amountError}
                  errorText={amountError}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <Button mode="contained" onPress={onPayment} style={styles.button}>
              Submit Transfer
            </Button>
          </View>
        </View>
        </ScrollView>
      </Background>
      
      <Modal visible={modalVisible && fields.length > 0} dismissable={false} contentContainerStyle={styles.modalContainer}>
        <Header>Update Profile</Header>
      
        <View>
          {
            fields.map(item => (
              <TextInput
                key={item.name}
                label={item.label}
                returnKeyType="next"
                value={modalValues[item.name].value}
                onChangeText={text => changeModalValues(item.name, text)}
                error={!!modalValues[item.name].error}
                errorText={modalValues[item.name].error}
              />
            ))
          }
        </View>
        <Button mode="contained" onPress={onUpdateProfile} style={styles.button}>
          Update
        </Button>
      </Modal>
      
      <Snackbar
        visible={bannerVisible}
        action={{
          label: 'OK',
          onPress: () => {
            setBannerVisible(false);
          },
        }}
        onDismiss={() => {}}
      >
        {message}
      </Snackbar>
    </>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    flexDirection: 'column',
    width: '100%',
  },
  inputContainer: {
    alignItems: 'center',
    paddingBottom: 20,
    width: '100%',
  },
  panel: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '100%',
    padding: 10,
    marginBottom: 20,
  },
  button: {
    width: '100%'
  },
  itemDetail: {
    color: '#aaaaaa',
    fontSize: 14,
    marginTop: 15,
  },
  row: {
    marginBottom: 10,
    width: '100%',
  },
  amount: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.primary,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
  }
});

export default memo(TransactionScreen);