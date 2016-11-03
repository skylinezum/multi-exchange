var fs = require('fs');
var Multi = require('../dist/index');
var config = JSON.parse(fs.readFileSync('./test-config.json', 'utf8'));
var multi = new Multi('PLNX', {public: config.public, private: config.private});
var chai = require('chai');
chai.should();

describe('multi-plnx', function () {
  //userInfo skip because not authorized to use this endpoint
  describe('availableBalance', function () {
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
      return multi.orders()
      .then(function (res) {
        console.log(JSON.stringify(res, null, 2));
        //res.should.exist();
      })
      .catch(function (err) {
        should.not.exist(err);
      });
    });

    it('should show fills', function() {
      multi.start = 0;
      return multi.fills()
      .then(function (res) {
        console.log(JSON.stringify(res, null, 2));
        //res.should.exist();
      })
      .catch(function (err) {
        should.not.exist(err);
      });
    });
  });

});
