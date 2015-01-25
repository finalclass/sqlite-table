/// <reference path="../typings/tsd.d.ts"/>

import sqlite3 = require('sqlite3');
import debug = require('debug');

var log = debug('sqlite-table');
var logError = debug('sqlite-table:error');

class SQLiteTable {

  public tableName:string;

  constructor(private _db:sqlite3.Database) {

  }

  public joins(record:any, done:(err:Error, record:any)=>void):void {
    done(null, record);
  }

  public all(next:(err:Error, result?:any[])=>void, eager?:boolean):void;
  public all(params:any, next?:(err:Error, result?:any[])=>void, eager?:boolean):void;
  public all(params?:any, next?:any, eager = true):void {
    if (typeof params === 'function') {
      eager = !!next;
      next = params;
      params = {};
    }
    var stmt:{sql:string;objVars:any} = this.getSQLSelectStmt(params);
    log('get all', stmt);
    this.db.all(stmt.sql, stmt.objVars, (err:Error, records:any[]):void => {
      if (err) return next(err);
      if (eager) {
        this.joinMany(records, next);
      } else {
        next(null, records);
      }
    });
  }

  public count(where:any = {}, next:(err?:Error, count?:number)=>void = ()=> {
  }):void {
    log('get count', where);
    var stmt:{sql:string;objVars:any} = this.getSQLSelectStmt(where, null, 'COUNT(id) as c');
    this.db.get(stmt.sql, stmt.objVars, (err:Error, record:any):void => {
      next(err, parseInt(record.c));
    });
  }

  public allLimited(where?:any,
                    limit:{limit:number;offset:number} = {limit: 1000, offset: 0},
                    next:(err?:Error, result?:any[])=>void = ()=> {
                    }, eager = true):void {
    var stmt:{sql:string;objVars:any} = this.getSQLSelectStmt(where, limit);
    log('get allLimited', stmt);
    this.db.all(stmt.sql, stmt.objVars, (err:Error, records:any[]):void => {
      if (err) return next(err);
      if (eager) {
        this.joinMany(records, next);
      } else {
        next(null, records);
      }
    });
  }

  public joinMany(records:any[], next:(err:Error, results?:any[])=>void):void {
    var joined = [];

    if (records.length === 0) {
      return next(null, records);
    }

    records.forEach((r) => {
      this.joins(r, (err:Error, j):void => {
        if (err) {
          return next(err);
        }
        joined.push(j);
        if (joined.length === records.length) {
          next(null, joined);
        }
      });
    });
  }

  public find(params:string, next:(err:Error, result?:any)=>void, eager?:boolean):void;
  public find(params:any, next:(err:Error, result?:any)=>void, eager?:boolean):void;
  public find(params:any, next:(err:Error, result?:any)=>void, eager = true):void {
    var typeofParams:string = typeof params;
    if (typeofParams === 'string' || typeofParams === 'number') {
      params = {id: params};
    }
    var stmt:{sql:string;objVars:any} = this.getSQLSelectStmt(params);
    log('find', stmt);
    this.db.get(stmt.sql, stmt.objVars, (err:Error, record:any):void => {
      if (err) return next(err);
      if (!record) return next(null);
      if (eager) {
        this.joins(record, next);
      } else {
        next(null, record);
      }
    });
  }

  public insert(data:any, next:(err?:Error, id?:string)=>void):void {
    log('insert', data);

    if (data.id) {
      delete data.id;
    }

    var keys:string[] = Object.keys(data);
    var keysVars:string[] = keys.map((key:string):string => '$' + key);
    var objVars:any = this.getObjVars(data);

    var sql:string = 'INSERT INTO ' + this.getTableName()
      + '(' + keys.join(',') + ') '
      + 'VALUES(' + keysVars.join(',') + ')';

    this.db.run(sql, objVars, function (err):void {
      data.id = this.lastID;
      next(err, data.id);
    });
  }

  public save(data:any, next:(err?:Error, record?:any)=>void):void {
    if (data.id) {
      this.update(data, (err:Error) => next(err, data));
    } else {
      this.insert(data, (err:Error) => next(err, data));
    }
  }

  public update(data:any, next:(err?:Error)=>void):void {
    log('update', data);
    if (!data.id) {
      logError('id is not specified, can not update');
      next(new Error('id is not specified'));
      return;
    }
    var keys:string[] = Object.keys(data);
    var updateStmts:string[] = keys.map((key:string):string => {
      return key + '=$' + key;
    });
    var objVars:any = this.getObjVars(data);

    var sql:string = 'UPDATE ' + this.getTableName()
      + ' SET ' + updateStmts.join(' , ')
      + ' WHERE id=$id';

    this.db.run(sql, objVars, next);
  }

  public remove(id:string, next:(err?:Error, isSuccess?:boolean)=>void):void {
    this.db.run('DELETE FROM ' + this.getTableName() + ' WHERE id=?', id, function (err) {
      next(err, this.changes === 1);
    });
  }

  private getObjVars(obj):any {
    var objVars:any = {};

    Object.keys(obj).forEach((key:string):void => {
      objVars['$' + key] = Array.isArray(obj[key]) ? obj[key][1] : obj[key];
    });

    return objVars;
  }

  private getSQLSelectStmt(params:any, limit?:{limit:number;offset:number}, select = '*'):{sql:string; objVars:any} {
    var objVars:any = this.getObjVars(params);
    var whereStmts:string[] = Object.keys(params)
      .map((key:string):string => {
        var sign = Array.isArray(params[key]) ? params[key][0] : '=';
        return key + sign + '$' + key;
      });
    var where:string = whereStmts.length > 0 ? ' WHERE ' + whereStmts.join(' AND ') : '';
    var limitSQL:string = '';

    if (limit) {
      limitSQL += ' LIMIT ' + parseInt(<any>limit.limit).toString();
      if (limit.offset) {
        limitSQL += ' OFFSET ' + parseInt(<any>limit.offset).toString();
      }
    }

    return {
      sql: 'SELECT ' + select + ' FROM ' + this.getTableName() + where + limitSQL,
      objVars: objVars
    };
  }

  public getTableName():string {
    if (!this.tableName) {
      throw new Error('tableName is not specified, override public get tableName():string method');
    }
    return this.tableName;
  }

  public get db():sqlite3.Database {
    return this._db;
  }

}

export = SQLiteTable;
