import { Ton } from '$libs/Ton';
import { fiatCurrencySelector } from '$store/main';
import { JettonBalanceModel } from '$store/models';
import { ratesRatesSelector } from '$store/rates';
import { formatter } from '$utils/formatter';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getRate } from './useFiatRate';

export function useJettonPrice(
  address: JettonBalanceModel['jettonAddress'],
  balance: string,
) {
  const rates = useSelector(ratesRatesSelector);
  const fiatCurrency = useSelector(fiatCurrencySelector);

  return useMemo(() => {
    const rate = getRate(
      rates,
      Ton.formatAddress(address, { bounce: true, cut: false }),
      fiatCurrency,
      false,
    );
    if (!rate) {
      return { price: null, total: null };
    }
    const balanceInFiat = new BigNumber(balance).multipliedBy(rate);
    // TODO: return from backend raw jetton addresses
    return {
      price: formatter.format(rate.toString(), { currency: fiatCurrency }),
      total: formatter.format(balanceInFiat, { currency: fiatCurrency }),
    };
  }, [rates, address, fiatCurrency, balance]);
}
