import { UR, UREncoder } from '@keystonehq/keystone-sdk';
import { View, ViewStyle, deviceWidth, ns } from '@tonkeeper/uikit';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-styled';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

export type KeystoneQRCodeProps = {
  ur: UR;
};

export const QR_SIZE = deviceWidth - ns(16) * 2 - ns(24) * 2;

export const QR_WRAP_STYLE: ViewStyle = {
  width: QR_SIZE,
  height: QR_SIZE,
  alignItems: 'center',
  justifyContent: 'center',
};

export const KeystoneQRCode = ({ ur }: KeystoneQRCodeProps) => {
  const encoder = useMemo(() => {
    return new UREncoder(ur, 400);
  }, [ur]);
  const [data, setData] = useState(encoder.nextPart().toUpperCase());
  useEffect(() => {
    const id = setInterval(() => {
      setData(encoder.nextPart().toUpperCase());
    }, 100);
    return () => {
      clearInterval(id);
    };
  }, [encoder, setData]);

  const qrCodeScale = useSharedValue(1);

  const handleQrCodeLayout = useCallback(
    (e: LayoutChangeEvent) => {
      qrCodeScale.value = QR_SIZE / e.nativeEvent.layout.width;
    },
    [qrCodeScale],
  );

  return (
    <View style={QR_WRAP_STYLE}>
        <QRCode data={data} padding={20} style={styles.qrcode} onLayout={handleQrCodeLayout} pieceSize={4} />
    </View>
  );
};

const styles = StyleSheet.create({
  qrcode: {
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
});
