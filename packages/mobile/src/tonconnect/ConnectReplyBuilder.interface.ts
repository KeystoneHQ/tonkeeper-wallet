import { ConnectItemReply, TonProofItemReplyError } from '@tonconnect/protocol';

export type UnsignedTonProofItemReply = UnsignedTonProofItem | TonProofItemReplyError;

export type HardwareConnectItemReply = ConnectItemReply | UnsignedTonProofItem;

export type UnsignedTonProofItem = {
  name: 'ton_proof';
  proof: {
    timestamp: number;
    domain: {
      lengthBytes: number;
      value: string;
    };
    payload: string;
  };
  messageBuffer: Buffer;
};

export function isUnsignedTonProofItem(
  item: HardwareConnectItemReply,
): item is UnsignedTonProofItem {
  return item.name === 'ton_proof' && item['messageBuffer'] !== undefined;
}
