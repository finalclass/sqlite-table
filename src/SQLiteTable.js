/// <reference path="../typings/tsd.d.ts"/>
var debug = require('debug');
var log = debug('sqlite-table');
var logError = debug('sqlite-table:error');
var SQLiteTable = (function () {
    function SQLiteTable(_db) {
        this._db = _db;
    }
    SQLiteTable.prototype.joins = function (record, done) {
        done(null, record);
    };
    SQLiteTable.prototype.all = function (params, next) {
        var _this = this;
        if (typeof params === 'function') {
            next = params;
            params = {};
        }
        log('get all', params);
        var stmt = this.getSQLSelectStmt(params);
        this.db.all(stmt.sql, stmt.objVars, function (err, records) {
            if (err)
                return next(err);
            _this.joinMany(records, next);
        });
    };
    SQLiteTable.prototype.joinMany = function (records, next) {
        var _this = this;
        var joined = [];
        records.forEach(function (r) {
            _this.joins(r, function (err, j) {
                if (err) {
                    return next(err);
                }
                joined.push(j);
                if (joined.length === records.length) {
                    next(null, joined);
                }
            });
        });
    };
    SQLiteTable.prototype.find = function (params, next) {
        var _this = this;
        var typeofParams = typeof params;
        if (typeofParams === 'string' || typeofParams === 'number') {
            params = { id: params };
        }
        log('find', params);
        var stmt = this.getSQLSelectStmt(params);
        this.db.get(stmt.sql, stmt.objVars, function (err, record) {
            if (err)
                return next(err);
            _this.joins(record, next);
        });
    };
    SQLiteTable.prototype.insert = function (data, next) {
        log('insert', data);
        if (data.id) {
            delete data.id;
        }
        var keys = Object.keys(data);
        var keysVars = keys.map(function (key) { return '$' + key; });
        var objVars = this.getObjVars(data);
        var sql = 'INSERT INTO ' + this.getTableName() + '(' + keys.join(',') + ') ' + 'VALUES(' + keysVars.join(',') + ')';
        this.db.run(sql, objVars, function (err) {
            data.id = this.lastID;
            next(err, data.id);
        });
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
        var sql = 'UPDATE ' + this.getTableName() + ' SET ' + updateStmts.join(' , ') + ' WHERE id=$id';
        this.db.run(sql, objVars, next);
    };
    SQLiteTable.prototype.remove = function (id, next) {
        this.db.run('DELETE FROM ' + this.getTableName() + ' WHERE id=?', id, function (err) {
            next(err, this.changes === 1);
        });
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
        var whereStmts = Object.keys(params).map(function (key) { return key + '=$' + key; });
        var where = whereStmts.length > 0 ? ' WHERE ' + whereStmts.join(' AND ') : '';
        return {
            sql: 'SELECT * FROM ' + this.getTableName() + where,
            objVars: objVars
        };
    };
    SQLiteTable.prototype.getTableName = function () {
        if (!this.tableName) {
            throw new Error('tableName is not specified, override public get tableName():string method');
        }
        return this.tableName;
    };
    Object.defineProperty(SQLiteTable.prototype, "db", {
        get: function () {
            return this._db;
        },
        enumerable: true,
        configurable: true
    });
    return SQLiteTable;
})();
module.exports = SQLiteTable;
