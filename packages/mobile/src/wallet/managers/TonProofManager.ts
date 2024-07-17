import nacl from 'tweetnacl';
import * as SecureStore from 'expo-secure-store';
import { TonAPI } from '@tonkeeper/core/src/TonAPI';
import { ContractService, WalletVersion } from '@tonkeeper/core';
import { Buffer } from 'buffer';
import { beginCell } from '@ton/core';
import { storeStateInit } from '@ton/ton';
import {
  createUnsignedSignProofForHardware,
  signProofForTonkeeper,
} from '@tonkeeper/core/src/utils/tonProof';
import { WalletNetwork } from '../WalletTypes';
import { SignedProof } from './TonProofManager.interface';

export class TonProofManager {
  public tonProofToken: string | null = null;

  constructor(
    public identifier: string,
    public network: WalletNetwork,
    public tonapi: TonAPI,
  ) {}

  public async obtainProof(keyPair: nacl.SignKeyPair) {
    const contract = ContractService.getWalletContract(
      WalletVersion.v4R2,
      Buffer.from(keyPair.publicKey),
      0,
      this.network,
    );
    const stateInitCell = beginCell().store(storeStateInit(contract.init)).endCell();
    const rawAddress = contract.address.toRawString();

    try {
      const { payload } = await this.tonapi.tonconnect.getTonConnectPayload();
      const proof = await signProofForTonkeeper(
        rawAddress,
        keyPair.secretKey,
        payload,
        stateInitCell.toBoc({ idx: false }).toString('base64'),
      );
      const { token } = await this.tonapi.wallet.tonConnectProof(proof);

      this.tonProofToken = token;
      await SecureStore.setItemAsync(`proof-${this.identifier}`, token);
    } catch (err) {
      console.log('TonProofManager.obtainProof', err);
      return null;
    }
  }

  public async createUnsignedProof(publicKey: Uint8Array) {
    const contract = ContractService.getWalletContract(
      WalletVersion.v4R2,
      Buffer.from(publicKey),
      0,
      this.network,
    );
    const stateInitCell = beginCell().store(storeStateInit(contract.init)).endCell();
    const rawAddress = contract.address.toRawString();

    try {
      const { payload } = await this.tonapi.tonconnect.getTonConnectPayload();
      const proof = await createUnsignedSignProofForHardware(
        rawAddress,
        payload,
        stateInitCell.toBoc({ idx: false }).toString('base64'),
      );
      return proof;
    } catch (err) {
      console.log('TonProofManager.obtainProof', err);
      return null;
    }
  }

  public async acceptSignedProof(proof: SignedProof) {
    try {
      const { token } = await this.tonapi.wallet.tonConnectProof(proof);

      this.tonProofToken = token;
      await SecureStore.setItemAsync(`proof-${this.identifier}`, token);
    } catch (err) {
      console.log('TonProofManager.obtainProof', err);
      return null;
    }
  }

  public async rehydrate() {
    try {
      this.tonProofToken = await SecureStore.getItemAsync(`proof-${this.identifier}`);
    } catch {}
  }

  public destroy() {
    SecureStore.deleteItemAsync(`proof-${this.identifier}`);
  }
}
