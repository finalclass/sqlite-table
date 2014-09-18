var SQLiteTable = require('../src/SQLiteTable');
var sqlite3 = require('sqlite3');

describe('SQLiteTable', function () {
  var db;
  var table;

  beforeEach(function (next) {
    db = new sqlite3.Database(':memory:');
    var sql = 'CREATE TABLE user(' +
      'id INTEGER PRIMARY KEY, ' +
      'firstName TEXT NOT NULL,' +
      'lastName TEXT NOT NULL)';

    db.run(sql, function (err) {
      if (err) {
        next(err);
      } else {
        table = new SQLiteTable(db);
        table._tableName = 'user';
        next();
      }
    });
  });

  it('insert', function (next) {
    table.insert({firstName: 'Jan', lastName: 'Kowalski'}, function (err) {
      expect(err).toBeFalsy();
      db.get('select * from user', function (err, result) {
        expect(err).toBeFalsy();
        expect(result).not.toBeFalsy();
        next();
      });
    });
  });

  it('update', function (next) {
    db.run('INSERT INTO user(firstName, lastName) VALUES(?, ?)', 'Jan', 'Kowalski', function (err) {
      table.update({id: 1, firstName: 'Jaś'}, function (err) {
        expect(err).toBeFalsy();
        db.all('select * from user', function (err, result) {
          expect(err).toBeFalsy();
          expect(result.length).toBe(1);
          expect(result[0].firstName).toBe('Jaś');
          next();
        });
      })
    });
  });

  it('finds all', function (next) {
    db.run('INSERT INTO user(firstName, lastName) VALUES(?,?)', 'Jan', 'Kowalski', function () {
      db.run('INSERT INTO user(firstName, lastName) VALUES(?,?)', 'Jaś', 'Kowalski', function () {
        table.find(1, function (err, result) {
          expect(err).toBeFalsy();
          expect(result.firstName).toBe('Jan');
          expect(result.lastName).toBe('Kowalski');
          table.find(2, function (err, result) {
            expect(err).toBeFalsy();
            expect(result.firstName).toBe('Jaś');
            expect(result.lastName).toBe('Kowalski');
            table.all(function (err, results) {
              expect(err).toBeFalsy();
              expect(results.length).toBe(2);
              next();
            });
          });
        });
      });
    });
  });

});