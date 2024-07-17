import { Button, Modal, Steezy, View, Text } from '@tonkeeper/uikit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { t } from '@tonkeeper/shared/i18n';
import { useNavigation } from '@tonkeeper/router';
import { tk } from '$wallet';
import { KeystoneQRCode } from '$core/KeystoneQRCode/KeystoneQRCode';
import KeystoneSDK, { UR } from '@keystonehq/keystone-sdk';
import { KeystoneScanState } from '$core/KeystoneScanQR/KeystoneScanQR.interface';
import { openKeystoneScanQR } from '$navigation';

export type KeystoneMessageType = 'transaction' | 'ton-proof';

interface Props {
  walletIdentifier: string;
  message: Buffer;
  messageType: KeystoneMessageType;
  onDone: (signature: string) => void;
  onClose: () => void;
}

export const KeystoneConfirmModal: FC<Props> = (props) => {
  const { walletIdentifier, message, messageType, onDone, onClose } = props;

  const wallet = useMemo(() => tk.wallets.get(walletIdentifier)!, [walletIdentifier]);

  const path = wallet.config.keystone?.path;
  const xfp = wallet.config.keystone?.xfp;
  const address = wallet.address.ton.friendly;

  const [signed, setSigned] = useState(false);

  useEffect(() => {
    return () => {
      if (!signed) onClose();
    };
  }, []);

  const keystoneSdk = useMemo(() => {
    return new KeystoneSDK({ origin: 'Tonkeeper Mobile' });
  }, []);

  const ur = useMemo(() => {
    return keystoneSdk.ton.generateSignRequest({
      signData: message.toString('hex'),
      dataType: messageType === 'transaction' ? 1 : 2,
      address,
      xfp: xfp,
      derivationPath: path,
    });
  }, [keystoneSdk, message, xfp, path, address]);

  const nav = useNavigation();

  const handleScanResult = useCallback(
    async (ur: UR) => {
      if (ur.type != 'ton-signature') {
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
    [keystoneSdk, setSigned],
  );

  const onSuccess = useCallback(
    async (ur: UR) => {
      setSigned(true);
      const signature = keystoneSdk.ton.parseSignature(ur);
      nav.goBack();
      onDone(signature.signature);
    },
    [keystoneSdk, setSigned],
  );

  const handleContinue = useCallback(() => {
    openKeystoneScanQR(handleScanResult, onSuccess);
  }, [handleScanResult]);

  return (
    <Modal>
      <Modal.Header />
      <Modal.Content safeArea>
        <View style={styles.textContainer}>
          <Text color='textPrimary' type='h3'>{t('keystone.connect_title')}</Text>
          <Text color='textSecondary' textAlign='center'>{t('keystone.connect_hint')}</Text>
        </View>
        <View style={styles.container}>
          <KeystoneQRCode ur={ur} />
        </View>
        <View style={styles.buttonsContainer}>
          <Button
            onPress={handleContinue}
            color="secondary"
            title={t('keystone.scan_signed_transaction')}
          />
        </View>
      </Modal.Content>
    </Modal>
  );
};

// setLedgerConfirmModalRef(KeystoneConfirmModal);

const styles = Steezy.create(() => ({
  container: {
    marginHorizontal: 16,
    alignItems: 'center',
  },
  textContainer: {
    marginVertical: 16,
    alignItems: 'center',
    flexDirection: 'column',
  },
  buttonsContainer: {
    padding: 16,
  },
}));
