var should = require('should'),
  defaults = require('./config/app-local.json');

describe('First test', function() {
  
  before(function() {
    process.env = {}
  });
  
  it('dummy test', function(done) {
    should(1).equal(1);
    done();
  });
  
  
  after( function() {
  })
  
});