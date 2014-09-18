/// <reference path="../../login-server/src/typings/tsd.d.ts"/>
var debug = require('debug');

var log = debug('sqlite-table');
var logError = debug('sqlite-table:error');

var SQLiteTable = (function () {
    function SQLiteTable(db) {
        this.db = db;
    }
    SQLiteTable.prototype.all = function (params, next) {
        if (typeof params === 'function') {
            next = params;
            params = {};
        }
        log('get all', params);
        var stmt = this.getSQLSelectStmt(params);
        this.db.all(stmt.sql, stmt.objVars, next);
    };

    SQLiteTable.prototype.find = function (params, next) {
        var typeofParams = typeof params;
        if (typeofParams === 'string' || typeofParams === 'number') {
            params = { id: params };
        }
        log('find', params);
        var stmt = this.getSQLSelectStmt(params);
        this.db.get(stmt.sql, stmt.objVars, next);
    };

    SQLiteTable.prototype.insert = function (data, next) {
        log('insert', data);
        var keys = Object.keys(data);
        var keysVars = keys.map(function (key) {
            return '$' + key;
        });
        var objVars = this.getObjVars(data);

        var sql = 'INSERT INTO ' + this.tableName + '(' + keys.join(',') + ') ' + 'VALUES(' + keysVars.join(',') + ')';

        this.db.run(sql, objVars, next);
    };

    SQLiteTable.prototype.update = function (data, next) {
        log('update', data);
        if (!data.id) {
            logError('id is not specified, can not update');
            next(new Error('id is not specified'));
            return;
        }
        var keys = Object.keys(data);
        var updateStmts = keys.map(function (key) {
            return key + '=$' + key;
        });
        var objVars = this.getObjVars(data);

        var sql = 'UPDATE ' + this.tableName + ' SET ' + updateStmts.join(' , ') + ' WHERE id=$id';

        this.db.run(sql, objVars, next);
    };

    SQLiteTable.prototype.getObjVars = function (obj) {
        var objVars = {};

        Object.keys(obj).forEach(function (key) {
            objVars['$' + key] = obj[key];
        });

        return objVars;
    };

    SQLiteTable.prototype.getSQLSelectStmt = function (params) {
        var objVars = this.getObjVars(params);
        var whereStmts = Object.keys(params).map(function (key) {
            return key + '=$' + key;
        });
        var where = whereStmts.length > 0 ? ' WHERE ' + whereStmts.join(' AND ') : '';

        return {
            sql: 'SELECT * FROM ' + this.tableName + where,
            objVars: objVars
        };
    };

    Object.defineProperty(SQLiteTable.prototype, "tableName", {
        get: function () {
            if (!this._tableName) {
                logError('tableName is not specified');
                throw new Error('tableName is not specified');
            }
            return this._tableName;
        },
        enumerable: true,
        configurable: true
    });
    return SQLiteTable;
})();

module.exports = SQLiteTable;
//# sourceMappingURL=SQLiteTable.js.map
