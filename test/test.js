var fs = require('fs');
var Multi = require('../dist/index');
var config = JSON.parse(fs.readFileSync('./test-config.json', 'utf8'));
var chai = require('chai');
chai.should();
let moment = require('moment');

describe('multi-plnx', function () {
  const plnxConfig = config.PLNX;
  var plnxMulti = new Multi('PLNX', {public: plnxConfig.public, private: plnxConfig.private});
  //userInfo skip because not authorized to use this endpoint
  it.skip('should show total balances', function () {
    return plnxMulti.totalBalance()
    .then(res => {
      console.log(JSON.stringify(res, null, 2));
    })
    .catch(console.log);
  });

  it.skip('should balances', function () {
    return multi.availableBalance()
    .then(function (res) {
      console.log(JSON.stringify(res, null, 2));
      //res.should.exist();
    })
    .catch(function (err) {
      should.not.exist(err);
    });
  });

  it.skip('should show open orders', function() {
    return plnxMulti.orders()
    .then(function (res) {
      console.log(JSON.stringify(res, null, 2));
      //res.should.exist();
    })
    .catch(function (err) {
      should.not.exist(err);
    });
  });

  it.skip('should show fills', function() {
    plnxMulti.start = 0;
    return plnxMulti.fills()
    .then(function (res) {
      console.log(JSON.stringify(res, null, 2));
      //res.should.exist();
    })
    .catch(function (err) {
      should.not.exist(err);
    });
  });

  it('should show all deposits/withdrawals', function() {
    const end = moment();
    const start = end.clone().subtract(3, 'M');
    return plnxMulti.transfers(start.toISOString(), end.toISOString())
    .then(console.log);
  })

});

describe('multi-gdax', function () {
  const gdaxConfig = config.GDAX;
  var gdaxMulti = new Multi('GDAX', {passphrase: gdaxConfig.passphrase, public: gdaxConfig.public, private: gdaxConfig.private});
  it.skip('should show total balances', function () {
    return gdaxMulti.totalBalance()
    .then(res => {
      console.log(JSON.stringify(res, null, 2));
    })
    .catch(console.log);
  });

  it('should show all deposits/withdrawals', function() {
    const end = moment();
    const start = end.clone().subtract(3, 'M');
    return gdaxMulti.transfers(start.toISOString(), end.toISOString())
    .then(console.log);
  });
});

describe.skip('multi-krkn', function() {
  const krknConfig = config.KRKN;
});
