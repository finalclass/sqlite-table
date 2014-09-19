SQLiteTable
===========

SQLiteTable is a class that helps you deal with sqlite database. 
It's very simple and useful for small projects when you don't want any kind of ORM but 
 also you don't wont to find yourself in writing simple queries over and over again.

SQLiteTable is written in TypeScript and it provides typings if you would like to use it with this language (which is recommended) hovewer you can use SQLiteTable with plain JavaScript also.
 
SQLiteTable is designed in OOP manner and it's best to inherit from it.

## Installation

```bash
npm install sqlite-table
```

## Example usage

```js
var SQLiteTable = require('sqlite-table');
var sqlite3 = require('sqlite3');

// UserTable class:
var UserTable = function (db) {
  SQLiteTable.call(this, db);
  this.tableName = 'user';
};
UserTable.prototype = Object.create(SQLiteTable.prototype);

// example usage
var db = new sqlite3.Database(':memory:');
db.run('CREATE TABLE user(id INTEGER PRIMARY KEY, firstName TEXT, lastName TEXT)', function (err) {
  var userTable = new UserTable(db);
  var user = {firstName: 'Szymon',lastName: 'Wygnański'};
  user.insert(user, function (err) {
    if (err) {
      // do something with the error
    } else {
      console.log(user); // => {id: 1, firstName: 'Szymon',lastName: 'Wygnański'};
    }
  });
});
```

## API

### get many records

```ts
public all(next:(err:Error, result:any[])=>void):void;
public all(params?:any, next?:(err:Error, result:any[])=>void):void;
```

You can get many records using `all` method. If you will not specify `param` object then 
 you will get all the records.

You can specify `params` object and set the search criteria. For example:

```js
var db = new sqlite3.Database(':memory:');
var userTable = new UserTable(db);

userTable.all({firstName: 'Szymon'}, function (err, users) {
  /// users is an array of all the users with first name Szymon.
});
```

### get one record

```ts
public find(params:string, next:(err:Error, result:any)=>void):void;
public find(params:any, next:(err:Error, result:any)=>void):void;
```

Works same as `all` method but returns only one record.

### insert

```ts
public insert(data:any, next:(err?:Error, id?:string)=>void):void;
```

Insert `data` into database. Second param of the `next` callback function 
   will be an `id` of the new record and `data.id` property will be set.
   
### update

```ts
public update(data:any, next:(err?:Error)=>void):void;
```

Update record by `data.id`. The field: `data.id` must be set, otherwise an error is thrown.
 
### remove
 
```ts
public remove(id:string, next:(err?:Error)=>void):void;
```

Removes record by id.