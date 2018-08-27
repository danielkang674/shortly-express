var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  links: function() {
    return this.hasMany(Link);
  },
  initialize: function(userCredentials) {
    let unhashedPassword = userCredentials.password;
    let username = userCredentials.username;
    
    this.on('creating', (model, attrs, options) => {
      console.log('in creating', model, attrs, options);
            
    });
  },


});

module.exports = User;