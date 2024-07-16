import { Button, Modal, Steezy, Toast, View } from '@tonkeeper/uikit';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LedgerConnectionSteps } from '$components';
import { t } from '@tonkeeper/shared/i18n';
import { LedgerConnectionCurrentStep } from 'components/LedgerConnectionSteps/types';
import { useNavigation } from '@tonkeeper/router';
import { useBluetoothAvailable, useConnectLedger } from '../ledger';
import {
  LedgerTransaction,
  setLedgerConfirmModalRef,
} from '$wallet/managers/SignerManager';
import { Address, Cell } from '@ton/core';
import { tk } from '$wallet';
import { getLedgerAccountPathByIndex } from '$utils/ledger';
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
      const signature = keystoneSdk.ton.parseSignature(ur);
      onDone(signature.signature);
      nav.closeModal && nav.closeModal();
      return {
        state: KeystoneScanState.SUCCESS,
        errorMessage: '',
      };
    },
    [keystoneSdk],
  );

  const handleContinue = useCallback(() => {
    openKeystoneScanQR(handleScanResult);
  }, [handleScanResult]);

  return (
    <Modal>
      <Modal.Header title={t('keystone.confirm_title')} />
      <Modal.Content safeArea>
        <View style={styles.container}>
          <KeystoneQRCode ur={ur} />
        </View>
        <View style={styles.buttonsContainer}>
          <Button onPress={handleContinue} color="secondary" title={t('keystone.scan')} />
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
  buttonsContainer: {
    padding: 16,
  },
}));
