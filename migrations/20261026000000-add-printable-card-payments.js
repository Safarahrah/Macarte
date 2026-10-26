
'use strict';

var fs = require('fs');
var path = require('path');

exports.up = function(db) {
  var filePath = path.join(
    __dirname,
    'sqls',
    '20261026000000-add-printable-card-payments-up.sql'
  );

  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, 'utf-8', function(err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  }).then(function(data) {
    return db.runSql(data);
  });
};

exports.down = function(db) {
  var filePath = path.join(
    __dirname,
    'sqls',
    '20261026000000-add-printable-card-payments-down.sql'
  );

  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, 'utf-8', function(err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  }).then(function(data) {
    return db.runSql(data);
  });
};

exports._meta = {
  version: 1
};
