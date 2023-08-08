import EventSource from 'react-native-sse';
// import { AppConfig } from './AppConfig';
import { QueryClient } from 'react-query';
import { Account, ActionTypeEnum, Event, TonAPI } from '../TonAPI';
import { Address } from '../Address';

export class TransactionsManager {
  sse: EventSource;

  constructor(
    private accountId: string,
    private queryClient: QueryClient,
    private tonapi: TonAPI, // private eventSource:
  ) {
    // this.sse = this.sse.listen(`/v2/sse/accounts/transactions?accounts=${this.accountId}`);
    this.sse = new EventSource(
      `https://tonapi.io/v2/sse/accounts/transactions?accounts=${this.accountId}`,
      {
        headers: {
          // Authorization: `Bearer ${config.get('tonApiV2Key')}`,
        },
      },
    );
    
    this.sse.addEventListener('open', () => {
      console.log('[TransactionsManager]: start listen transactions for', this.accountId);
    });
    this.sse.addEventListener('error', (err) => {
      console.log('[TransactionsManager]: error listen transactions', err);
    });
    this.sse.addEventListener('message', () => this.refetch());
  }

  private txIdToEventId(txId: string) {
    const ids = txId.split('_');
    const actionIndex = Number(ids[1] ?? 0);
    const eventId = ids[0];

    return { eventId, actionIndex };
  }

  public getCachedById(txId: string) {
    const { eventId, actionIndex } = this.txIdToEventId(txId);
    const event = this.queryClient.getQueryData<Event>(['account_event', eventId]);

    if (event) {
      return this.mapAccountEvent(event, actionIndex);
    }

    return null;
  }

  public async fetch(before_lt?: number) {
    const { data, error } = await this.tonapi.accounts.getEventsByAccount({
      ...(!!before_lt && { before_lt }),
      accountId: this.accountId,
      subject_only: true,
      limit: 50,
    });

    // TODO: change
    if (error) {
      throw error;
    }

    data.events.map((event) => {
      this.queryClient.setQueryData(['account_event', event.event_id], event);
    });

    return data;
  }

  public async fetchById(txId: string) {
    const { eventId, actionIndex } = this.txIdToEventId(txId);
    const { data: event } = await this.tonapi.events.getEvent(eventId);

    if (event) {
      return this.mapAccountEvent(event, actionIndex);
    }

    return null;
  }

  private mapAccountEvent(event: Event, actionIndex: number) {
    const rawAction = event.actions[actionIndex];

    const action = {
      ...rawAction,
      ...rawAction[rawAction.type],
    };

    const destination = this.defineDestination(this.accountId, action);

    const transaction: Transaction = {
      ...event,
      hash: event.event_id,
      destination,
      action: action,
    };

    if (rawAction.type === ActionTypeEnum.TonTransfer) {
      transaction.encrypted_comment = action.encrypted_comment;
    }

    return transaction;
  }

  public prefetch() {
    return this.queryClient.prefetchInfiniteQuery({
      queryFn: ({ pageParam }) => fetch(pageParam),
      queryKey: ['events', this.accountId],
    });
  }

  public refetch() {}

  public destroy() {
    this.sse.close();
  }

  // Utils
  private defineDestination(
    accountId: string,
    data: any//ActionsData['data'],
  ): TransactionDestination {
    if (data && 'recipient' in data) {
      return Address.compare(data.recipient.address, accountId) ? 'in' : 'out';
    }

    return 'unknown';
  }
}

export type TransactionDestination = 'out' | 'in' | 'unknown';

export type Transaction = {
  hash: string;
  sender?: Account;
  recipient?: Account;
  action: any;
  destination: TransactionDestination;
  timestamp: number;
  extra?: number;
  encrypted_comment?: any;
  comment?: string;
};
