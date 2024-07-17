import { RouteProp } from '@react-navigation/native';
import { AppStackRouteNames } from '$navigation';
import { AppStackParamList } from '$navigation/AppStack';

export enum KeystoneScanState {
  SUCCESS,
  FAILED,
}

export interface KeystoneScanStatus {
  state: KeystoneScanState,
  errorMessage: string,
}

export interface KeystoneScanQRProps {
  route: RouteProp<AppStackParamList, AppStackRouteNames.KeystoneScanQR>;
}
