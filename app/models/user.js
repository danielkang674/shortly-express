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
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          console.log('Error in generating password salt -- ', err);
        } else {
          var cb = (err, hash) => {
            console.log('in bcrypt.hash before if/else');
            if (err) {
              console.log('Error in generating hashed password -- ', err);
            } else {
              console.log('in bcrypt.genSalt else');
              model.set('password', hash);
              model.set('salt', salt);
              model.set('username', username);
            }
          };
          (salt) => {
            bcrypt.hash(unhashedPassword, salt, cb);
          };
        }
        
      });      
    });
  },


});

module.exports = User;