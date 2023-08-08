import { SheetActions, navigation, useNavigation } from '@tonkeeper/router';
import Clipboard from '@react-native-community/clipboard';
import { ActionTypeEnum } from '@tonkeeper/core/src/TonAPI';
import { Fragment, memo, useCallback } from 'react';
import { tk } from '../tonkeeper';
import { config } from '../config';
import { formatTransactionDetailsTime } from '../utils/date';
import { t } from '../i18n';
import { formatter } from '../formatter';
import BigNumber from 'bignumber.js';
import { Address } from '@tonkeeper/core';
import {
  Button,
  Icon,
  List,
  Modal,
  Steezy,
  SText as Text,
  TonIcon,
  View,
} from '@tonkeeper/uikit';
import { EncryptedComment, EncryptedCommentLayout } from '../components/EncryptedComment';
import { useTokenPrice } from '@tonkeeper/mobile/src/hooks/useTokenPrice';
import { useSelector } from 'react-redux';
import { fiatCurrencySelector } from '@tonkeeper/mobile/src/store/main';
import { Transaction } from '@tonkeeper/core/src/managers/TransactionsManager';

type TransactionModalProps = {
  transaction: Transaction;
};

export const TransactionModal = memo<TransactionModalProps>((props) => {
  const { transaction: tx } = props;
  const nav = useNavigation();
  const tokenPrice = useTokenPrice('ton');
  const fiatCurrency = useSelector(fiatCurrencySelector);

  const handlePressViewExplorer = useCallback(() => {
    nav.navigate('DAppBrowser', {
      url: config.get('transactionExplorer').replace('%s', tx.hash),
    });
  }, [tx.hash]);

  // TODO: replace on useCopyText
  const copyText = useCallback((value?: string) => {
    if (value) {
      Clipboard.setString(value);
      // Toast.success(t('copied')); // TODO: Move toast to shared
    }
  }, []);

  const time = formatTransactionDetailsTime(new Date(tx.timestamp * 1000));

  const feeAmount = formatter.fromNano(tx.extra ?? 0, 9);
  const fee = formatter.format(feeAmount, {
    decimals: 9,
    postfix: 'TON',
    absolute: true,
  });

  const feeFiat = formatter.format(tokenPrice.fiat * parseFloat(feeAmount), {
    decimals: 9,
    currency: fiatCurrency,
    currencySeparator: 'wide',
    absolute: true,
  });

  const isZeroExtra = new BigNumber(tx.extra ?? 0).isLessThan(0);

  const fiat = formatter.format(
    tokenPrice.fiat * parseFloat(formatter.fromNano(tx.action?.amount ?? 0)),
    {
      currency: fiatCurrency,
      currencySeparator: 'wide',
    },
  );

  const amount = formatter.formatNano(tx.action?.amount ?? 0, {
    // prefix: '-',
    formatDecimals: 9,
    withoutTruncate: true,
    postfix: 'TON',
  });

  const timeLangKey =
    tx.destination === 'in'
      ? 'received_time'
      : tx.destination === 'out'
      ? 'sent_time'
      : undefined;
  const timeLabel = timeLangKey
    ? t(`transactionDetails.${timeLangKey}`, {
        time,
      })
    : time;

  return (
    <Modal>
      <Modal.Header />
      <Modal.Content safeArea>
        <View style={styles.container}>
          <View style={styles.infoContainer}>
            {tx.action.type === ActionTypeEnum.TonTransfer && (
              <TonIcon size="large" style={styles.tonIcon} />
            )}
            <Text type="h2" style={styles.amountText}>
              {amount}
            </Text>
            <Text type="body1" color="textSecondary" style={styles.fiatText}>
              {fiat}
            </Text>
            <Text type="body1" color="textSecondary" style={styles.timeText}>
              {timeLabel}
            </Text>
          </View>
          <List>
            {tx.destination === 'in' ? (
              <Fragment>
                {tx.action.sender?.name && (
                  <List.Item
                    onPress={() => copyText(tx.action.sender.name)}
                    value={tx.action.sender.name}
                    label={t('transactionDetails.sender')}
                  />
                )}
                {tx.action.sender && (
                  <List.Item
                    onPress={() =>
                      copyText(Address(tx.action.sender.address).toFriendly())
                    }
                    label={t('transactionDetails.sender_address')}
                    subtitle={
                      <Text type="label1" numberOfLines={1} ellipsizeMode="middle">
                        {Address(tx.action.sender.address).toFriendly()}
                      </Text>
                    }
                  />
                )}
              </Fragment>
            ) : tx.destination === 'out' ? (
              <Fragment>
                {tx.action.recipient?.name && (
                  <List.Item
                    onPress={() => copyText(tx.action.recipient.name)}
                    value={tx.action.recipient.name}
                    label={t('transactionDetails.recipient')}
                  />
                )}
                {tx.action.recipient && (
                  <List.Item
                    onPress={() =>
                      copyText(Address(tx.action.recipient.address).toFriendly())
                    }
                    label={t('transactionDetails.recipient_address')}
                    subtitle={
                      <Text type="label1" numberOfLines={1} ellipsizeMode="middle">
                        {Address(tx.action.recipient.address).toFriendly()}
                      </Text>
                    }
                  />
                )}
              </Fragment>
            ) : null}
            <List.Item
              label={isZeroExtra ? t('transaction_fee') : t('transaction_refund')}
              onPress={() => copyText(fee)}
              value={fee}
              subvalue={feeFiat}
            />
            {tx.encrypted_comment && (
              <EncryptedComment
                layout={EncryptedCommentLayout.LIST_ITEM}
                encryptedComment={tx.encrypted_comment}
                transactionType={tx.action.type}
                transactionId={tx.hash}
                sender={tx.sender!}
              />
            )}
            {!!tx.comment && (
              <List.Item
                onPress={() => copyText(tx.comment)}
                label={t('transactionDetails.comment')}
                value={tx.comment}
              />
            )}
          </List>
          <View style={styles.footer}>
            <Button onPress={handlePressViewExplorer} size="small" color="secondary">
              <Icon name="ic-globe-16" color="constantWhite" />
              <Text type="label2" style={{ marginLeft: 8 }}>
                {t('transactionDetails.transaction')}
              </Text>
              <Text type="label2" color="textTertiary">
                {` ${tx.hash.substring(0, 8)}`}
              </Text>
            </Button>
          </View>
        </View>
      </Modal.Content>
    </Modal>
  );
});

const styles = Steezy.create({
  container: {
    // padding: 16,
    paddingTop: 48,
  },
  infoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  amountText: {
    textAlign: 'center',
  },
  fiatText: {
    marginTop: 4,
  },
  timeText: {
    marginTop: 4,
  },
  footer: {
    padding: 16,
    marginBottom: 16,
    alignSelf: 'center',
  },
  tonIcon: {
    marginBottom: 20,
  },
});

export async function openTransactionDetails(txId: string) {
  const openModal = (transaction: any) => {
    navigation.push('SheetsProvider', {
      $$action: SheetActions.ADD,
      component: TransactionModal,
      params: { transaction },
      path: 'TRANSACTION_DETAILS',
    });
  };

  try {
    const cachedTransaction = tk.wallet.transactions.getCachedById(txId);
    if (cachedTransaction) {
      openModal(cachedTransaction);
    } else {
      // Toast.loading();
      const transaction = await tk.wallet.transactions.fetchById(txId);
      if (transaction) {
        openModal(transaction);
      }
      // Toast.hide();
    }
  } catch (err) {
    console.log(err);
    // Toast.fail('Message');
  }
}
