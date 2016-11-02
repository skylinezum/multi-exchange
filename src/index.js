import bird from 'bluebird';
import Gdax from 'gdax';
import Poloniex from '@you21979/poloniex.com';
import Kraken from 'kraken-api';

//params shape
//{public, secret, passphrase, clientId}
let plnx = p => {
  return p.split('_').reverse().join('_');
}
let pairconv = {
  GDAX: {
    BTC_USD: 'BTC-USD',
    ETH_USD: 'ETH-USD',
    ETH_BTC: 'ETH-BTC',
    LTC_USD: 'LTC-USD',
    LTC_BTC: 'LTC-BTC'
  },
  PLNX: plnx,
  KRKN: {
    BTC_USD: 'XXBTXUSD',
    BTC_EUR: 'XXBTXEUR',
    ETH_BTC: 'XETHXXBT'
  }
};


class MultiExchange {
  constructor(exchange, params) {
    this.exchange = exchange;
    switch (exchange) {
      case 'GDAX':
        this.api = bird.promisifyAll(new Gdax.AuthenticatedClient(params.public, params.private, params.passphrase), {multiArgs: true});
        break;
      case 'PLNX':
        this.api = Poloniex.createPrivateApi(params.public, params.private, 'ibb');
        this.api.nonce *= 1000;
        break;
      case 'KRKN':
        this.api = bird.promisifyAll(new KrakenClient(params.public, params.private));
        break;
      default:
        this.api = null;
    }
  }

  /*
   #####  #    # #   #
   #    # #    #  # #
   #####  #    #   #
   #    # #    #   #
   #    # #    #   #
   #####   ####    #
  */

  /*
  create a buy order of the pair
  type: (market, limit)
  pair: (BTC_USD, ETH_BTC, XMR_ETH ...)
  price: 0.000000 if BTC_USD fix to 2 decimals
  amount: 0.00 smallest order of 0.01
  returns {id: '<order_id>'};
  */
  buy(type, pair, price, amount) {
    if (type === 'limit') {
      let _price = pair.split('_')[1] == 'USD' ? Number(price.toFixed(2)) : Number(price.toFixed(6));
    }
    let _amount = Number(amount.toFixed(6));
    let _pair = this.exchange !== 'PLNX' ? pairconv[this.exchange][pair] : pairconv[this.exchange](pair);
    switch (this.exchange) {
      case 'GDAX':
        return this.api.buyAsync({
          type: type,
          price: _price,
          size: _amount,
          product_id: _pair
        })
        .then(res => {
          return res[1];
        });
        break;
      case 'PLNX':
        return this.api.buy(_pair, _price, _amount)
        .then(res => {
          return {id: res.orderNumber};
        });
        break;
      case 'KRKN':
        return this.api.apiAsync('AddOrder', {
          pair: _pair,
          type: 'buy',
          orderType: type,
          price: _price,
          volume: _amount
        })
        .then(res => {
          res.result;
        });
        break;
      default:
        return bird.reject(`exchange: ${this.exchange} not supported`);
    }
  }

  /*
    ####  ###### #      #
   #      #      #      #
    ####  #####  #      #
        # #      #      #
   #    # #      #      #
    ####  ###### ###### ######
  */

  sell(type, pair, price, amount) {
    if (type === 'limit') {
      let _price = pair.split('_')[1] == 'USD' ? Number(price.toFixed(2)) : Number(price.toFixed(6));
    }
    let _amount = Number(amount.toFixed(6));
    let _pair = pairconv[this.exchange][pair];
    switch (this.exchange) {
      case 'GDAX':
        return this.api.sellAsync({
          type: type,
          price: _price,
          size: _amount,
          product_id: _pair
        })
        .then(res => {
          return res[1];
        });
        break;
      case 'PLNX':
        return this.api.sell(_pair, _price, _amount)
        .then(res => {
          return {id: res.orderNumber};
        });
        break;
      case 'KRKN':
        return this.api.apiAsync('AddOrder', {
          pair: _pair,
          type: 'sell',
          orderType: type,
          price: _price,
          volume: _amount
        })
        .then(res => {
          res.result;
        });
        break;
      default:
        return bird.reject(`exchange: ${this.exchange} not supported`);
    }
  }

  /*
   #####  ####  #####   ##   #         #####    ##   #        ##   #    #  ####  ######
     #   #    #   #    #  #  #         #    #  #  #  #       #  #  ##   # #    # #
     #   #    #   #   #    # #         #####  #    # #      #    # # #  # #      #####
     #   #    #   #   ###### #         #    # ###### #      ###### #  # # #      #
     #   #    #   #   #    # #         #    # #    # #      #    # #   ## #    # #
     #    ####    #   #    # ######    #####  #    # ###### #    # #    #  ####  ######
  */

  /*
  object like
  {
    btc: 16.001,
    eth: 100.123
  }
  */
  totalBalance() {
    switch (this.exchange) {
      case 'GDAX':
        return this.api.getAccountsAsync()
        .then(res => {
          let data = {};
          res[1].forEach(acc => {
            data[acc.currency] = acc.balance;
          });
          return data;
        });
        break;
      case 'PLNX':
        return this.api.completeBalances()
        .then(res => {
          Object.keys(res).forEach(k => {
            res[k] = Number(res[k].available) + Number(res[k].onOrders);
          });
          return res;
        });
        break;
      case 'KRKN':
        return this.api.apiAsync('Balance', {})
        .then(res => {
          return res.result;
        });
        break;
      default:
        return bird.reject(`exchange: ${this.exchange} not supported`);
    }
  }

  /*
     ##   #    #   ##   # #        ##   #####  #      ######    #####    ##   #        ##   #    #  ####  ######
    #  #  #    #  #  #  # #       #  #  #    # #      #         #    #  #  #  #       #  #  ##   # #    # #
   #    # #    # #    # # #      #    # #####  #      #####     #####  #    # #      #    # # #  # #      #####
   ###### #    # ###### # #      ###### #    # #      #         #    # ###### #      ###### #  # # #      #
   #    #  #  #  #    # # #      #    # #    # #      #         #    # #    # #      #    # #   ## #    # #
   #    #   ##   #    # # ###### #    # #####  ###### ######    #####  #    # ###### #    # #    #  ####  ######
  */

  availableBalance() {
    switch (this.exchange) {
      case 'GDAX':
        return this.api.getAccountsAsync()
        .then(res => {
          let data = {};
          res[1].forEach(acc => {
            data[acc.currency] = acc.available;
          });
          return data;
        });
        break;
      case 'PLNX':
        return this.api.balances()
        .then(res => {
          Object.keys(res).forEach(k => {
            res[k] = Number(res[k]);
          });
          return res;
        });
        break;
      case 'KRKN':
        this.api.apiAsync('TradeBalance', {})
        .then(res => {
          return res.result;
        });
        break;
      default:
        return bird.reject(`exchange: ${this.exchange} not supported`);
    }
  }

  /*
    ####  #####  ###### #    #     ####  #####  #####  ###### #####   ####
   #    # #    # #      ##   #    #    # #    # #    # #      #    # #
   #    # #    # #####  # #  #    #    # #    # #    # #####  #    #  ####
   #    # #####  #      #  # #    #    # #####  #    # #      #####       #
   #    # #      #      #   ##    #    # #   #  #    # #      #   #  #    #
    ####  #      ###### #    #     ####  #    # #####  ###### #    #  ####
  */

  //NOTE paging not supported yet
  orders() {
    switch (this.exchange) {
      case 'GDAX':
        return this.api.getOrders()
        .then(res => {
          return res[1];
        });
        break;
      case 'PLNX':
        return this.api.openOrders();
        break;
      case 'KRKN':
        return this.api.apiAsync('OpenOrders', {})
        .then(res => {
          return res.result;
        });
        break;
      default:
        return bird.reject(`exchange: ${this.exchange} not supported`);
    }
  }

  /*
   ###### # #      #      ###### #####      ####  #####  #####  ###### #####   ####
   #      # #      #      #      #    #    #    # #    # #    # #      #    # #
   #####  # #      #      #####  #    #    #    # #    # #    # #####  #    #  ####
   #      # #      #      #      #    #    #    # #####  #    # #      #####       #
   #      # #      #      #      #    #    #    # #   #  #    # #      #   #  #    #
   #      # ###### ###### ###### #####      ####  #    # #####  ###### #    #  ####
  */

  //NOTE doesn't support pagination yet
  fills() {
    switch (this.exchange) {
      case 'GDAX':
        return this.api.getFills()
        .then(res => {
          return res[1];
        });
        break;
      case 'PLNX':
        let end = Date.now() / 1000 | 0;
        let start = end - 86400;
        return this.api.tradeHistory(start, end);
        break;
      case 'KRKN':
        break;
      default:
        return bird.reject(`exchange: ${this.exchange} not supported`);
    }
  }

  /*
    ####    ##   #    #  ####  ###### #
   #    #  #  #  ##   # #    # #      #
   #      #    # # #  # #      #####  #
   #      ###### #  # # #      #      #
   #    # #    # #   ## #    # #      #
    ####  #    # #    #  ####  ###### ######
  */

  cancel(orderId) {
    switch (this.exchange) {
      case 'GDAX':
        return this.api.cancelOrder(orderId)
        .then(res => {
          return res[1];
        });
        break;
      case 'PLNX':
        return this.api.cancelOrder(orderId);
        break;
      case 'KRKN':
        break;
      default:
        return bird.reject(`exchange: ${this.exchange} not supported`);
    }
  }

  /*
    ####    ##   #    #  ####  ###### #           ##   #      #
   #    #  #  #  ##   # #    # #      #          #  #  #      #
   #      #    # # #  # #      #####  #         #    # #      #
   #      ###### #  # # #      #      #         ###### #      #
   #    # #    # #   ## #    # #      #         #    # #      #
    ####  #    # #    #  ####  ###### ######    #    # ###### ######
  */

  cancelAll() {
    switch (this.exchange) {
      case 'GDAX':
        return this.api.cancelAllOrders()
        .then(res => {
          return res[1];
        });
        break;
      case 'PLNX':
        let oArray = [];
        return api.openOrders()
        .then(resA => {
          Object.keys(resA).forEach(k => {
            let orders = resA[k];
            if (orders.length < 1) return;
            orders.forEach(o => {
              oArray.push(api.cancelOrder(Number(o.orderNumber)));
            });
          });
          return bird.all(oArray);
        });
        break;
      case 'KRKN':
        break;
      default:
        return bird.reject(`exchange: ${this.exchange} not supported`);
    }
  }

  /*
   ##### #  ####  #    # ###### #####
     #   # #    # #   #  #      #    #
     #   # #      ####   #####  #    #
     #   # #      #  #   #      #####
     #   # #    # #   #  #      #   #
     #   #  ####  #    # ###### #    #
  */

  ticker(pair) {
    switch (this.exchange) {
      case 'GDAX':
        break;
      case 'PLNX':
        break;
      case 'KRKN':
        break;
      default:
        return bird.reject(`exchange: ${this.exchange} not supported`);
    }
  }
}

module.exports = MultiExchange;
