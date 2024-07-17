import { Button, Icon, Modal, Spacer, Steezy, View, Text } from '@tonkeeper/uikit';
import { FC, useCallback, useMemo } from 'react';
import { t } from '@tonkeeper/shared/i18n';
import { useNavigation } from '@tonkeeper/router';
import {
  MainStackRouteNames,
  openKeystoneScanQR,
  openSetupNotifications,
  openSetupWalletDone,
} from '$navigation';
import KeystoneSDK, { UR } from '@keystonehq/keystone-sdk';
import { KeystoneScanState } from '$core/KeystoneScanQR/KeystoneScanQR.interface';
import { tk } from '$wallet';
import { InteractionManager } from 'react-native';
import { ImportWalletStackRouteNames } from '$navigation/ImportWalletStack/types';

interface Props {}

export const PairKeystoneModal: FC<Props> = () => {
  const nav = useNavigation();
  const keystoneSdk = useMemo(() => {
    return new KeystoneSDK();
  }, []);
  const handleScanResult = useCallback(
    async (ur: UR) => {
      if (ur.type != 'crypto-hdkey') {
        return {
          state: KeystoneScanState.FAILED,
          errorMessage: 'invalid qrcode type',
        };
      }
      return {
        state: KeystoneScanState.SUCCESS,
        errorMessage: '',
      };
    },
    [keystoneSdk],
  );

  const onSuccess = useCallback(
    async (ur: UR) => {
      const account = keystoneSdk.parseTonAccount(ur);
      const walletsInfo = await tk.getKeystoneWalletInfo(account.publicKey);
      nav.goBack();
      InteractionManager.runAfterInteractions(() => {
        nav.navigate(MainStackRouteNames.ImportWalletStack, {
          screen: ImportWalletStackRouteNames.ConfirmKeystoneWallet,
          params: {
            walletsInfo,
            onDone: async () => {
              const extra =
                !!account.xfp && !!account.path
                  ? { xfp: account.xfp, path: account.path }
                  : undefined;
              const identifiers = await tk.addKeystoneWallet(
                account.publicKey,
                account.name,
                extra,
              );

              const isNotificationsDenied = await tk.wallet.notifications.getIsDenied();

              if (isNotificationsDenied) {
                openSetupWalletDone(identifiers);
              } else {
                openSetupNotifications(identifiers);
              }
            },
          },
        });
      });
    },
    [keystoneSdk],
  );

  const handleContinue = useCallback(() => {
    openKeystoneScanQR(handleScanResult, onSuccess);
  }, [handleScanResult]);
  return (
    <Modal>
      <Modal.Header/>
      <Modal.Content safeArea>
        <View style={styles.contentContainer}>
          <Icon name="ic-keystone-112" color="accentBlue" />
          <Text color='textPrimary' type='h3'>{t('add_wallet_modal.keystone.title')}</Text>
          <Text color='textSecondary' textAlign='center'>{t('add_wallet_modal.keystone.subtitle')}</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <View style={styles.button}>
            <Button onPress={nav.closeModal} color="secondary" title={t('cancel')} />
          </View>
          <Spacer x={16} />
          <View style={styles.button}>
            <Button onPress={handleContinue} title={t('continue')} />
          </View>
        </View>
      </Modal.Content>
    </Modal>
  );
};

const styles = Steezy.create(() => ({
  container: {
    marginHorizontal: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  contentContainer: {
    flexDirection: 'column',
    padding: 16,
    alignItems: 'center',
  },
  button: {
    flex: 1,
  },
}));
