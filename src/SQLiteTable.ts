/// <reference path="../../login-server/src/typings/tsd.d.ts"/>

import sqlite3 = require('sqlite3');
import debug = require('debug');

var log = debug('sqlite-table');
var logError = debug('sqlite-table:error');

class SQLiteTable {

  private _tableName:string;

  constructor(private db:sqlite3.Database) {
    
  }

  public all(next:(err?:Error)=>void):void;
  public all(params?:any, next?:(err?:Error)=>void):void {
    if (typeof params === 'function') {
      next = params;
      params = {};
    }
    log('get all', params);
    var stmt:{sql:string;objVars:any} = this.getSQLSelectStmt(params);
    this.db.all(stmt.sql, stmt.objVars, next);
  }

  public find(params:string, next:(err?:Error)=>void):void;
  public find(params:any, next:(err?:Error)=>void):void {
    var typeofParams:string = typeof params;
    if (typeofParams === 'string' || typeofParams === 'number') {
      params = {id: params};
    }
    log('find', params);
    var stmt:{sql:string;objVars:any} = this.getSQLSelectStmt(params);
    this.db.get(stmt.sql, stmt.objVars, next);
  }

  public insert(data:any, next:(err?:Error)=>void):void {
    log('insert', data);
    var keys:string[] = Object.keys(data);
    var keysVars:string[] = keys.map((key:string):string => '$' + key);
    var objVars:any = this.getObjVars(data);

    var sql:string = 'INSERT INTO ' + this.tableName
      + '(' + keys.join(',') + ') '
      + 'VALUES(' + keysVars.join(',') + ')';

    this.db.run(sql, objVars, next);
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

    var sql:string = 'UPDATE ' + this.tableName
      + ' SET ' + updateStmts.join(' , ')
      + ' WHERE id=$id';

    this.db.run(sql, objVars, next);
  }

  private getObjVars(obj):any {
    var objVars:any = {};

    Object.keys(obj).forEach((key:string):void => {
      objVars['$' + key] = obj[key];
    });

    return objVars;
  }

  private getSQLSelectStmt(params:any):{sql:string; objVars:any} {
    var objVars:any = this.getObjVars(params);
    var whereStmts:string[] = Object.keys(params)
      .map((key:string):string => key + '=$' + key);
    var where:string = whereStmts.length > 0 ? ' WHERE ' + whereStmts.join(' AND ') : '';

    return {
      sql: 'SELECT * FROM ' + this.tableName + where,
      objVars: objVars
    };
  }

  public get tableName():string {
    if (!this._tableName) {
      logError('tableName is not specified');
      throw new Error('tableName is not specified');
    }
    return this._tableName;
  }

}

export = SQLiteTable;