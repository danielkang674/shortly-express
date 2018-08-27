var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  links: function() {
    return this.hasMany(Link);
  },
  initialize: function(userData) {
    let unhashedPassword = userData.password;
    let username = userData.username;
    let salt = null;

    console.log('testArguments: ', testArguments);
    this.on('creating', function(model, attrs, options) {
      let shasum = crypto.createHash('sha1');
      shasum.update(model.get('password'));
      model.set('password', shasum.digest('hex').slice(0, 5));

      
      model.set('username', username);
      model.set('salt', salt);
    });
  },


});

module.exports = User;