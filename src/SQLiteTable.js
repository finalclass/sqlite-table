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
    SQLiteTable.prototype.all = function (params, next, eager) {
        var _this = this;
        if (eager === void 0) { eager = true; }
        if (typeof params === 'function') {
            eager = !!next;
            next = params;
            params = {};
        }
        var stmt = this.getSQLSelectStmt(params);
        log('get all', stmt);
        this.db.all(stmt.sql, stmt.objVars, function (err, records) {
            if (err)
                return next(err);
            if (eager) {
                _this.joinMany(records, next);
            }
            else {
                next(null, records);
            }
        });
    };
    SQLiteTable.prototype.count = function (where, next) {
        if (where === void 0) { where = {}; }
        if (next === void 0) { next = function () {
        }; }
        var stmt = this.getSQLSelectStmt(where, null, 'COUNT(id) as c');
        log('get count', stmt);
        this.db.get(stmt.sql, stmt.objVars, function (err, record) {
            next(err, parseInt(record.c));
        });
    };
    SQLiteTable.prototype.allLimited = function (where, limit, next, eager) {
        var _this = this;
        if (limit === void 0) { limit = { limit: 1000, offset: 0 }; }
        if (next === void 0) { next = function () {
        }; }
        if (eager === void 0) { eager = true; }
        var stmt = this.getSQLSelectStmt(where, limit);
        log('get allLimited', stmt);
        this.db.all(stmt.sql, stmt.objVars, function (err, records) {
            if (err)
                return next(err);
            if (eager) {
                _this.joinMany(records, next);
            }
            else {
                next(null, records);
            }
        });
    };
    SQLiteTable.prototype.joinMany = function (records, next) {
        var _this = this;
        var joined = [];
        if (records.length === 0) {
            return next(null, records);
        }
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
    SQLiteTable.prototype.find = function (params, next, eager) {
        var _this = this;
        if (eager === void 0) { eager = true; }
        var typeofParams = typeof params;
        if (typeofParams === 'string' || typeofParams === 'number') {
            params = { id: params };
        }
        var stmt = this.getSQLSelectStmt(params);
        log('find', stmt);
        this.db.get(stmt.sql, stmt.objVars, function (err, record) {
            if (err)
                return next(err);
            if (!record)
                return next(null);
            if (eager) {
                _this.joins(record, next);
            }
            else {
                next(null, record);
            }
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
        log('insert', sql, objVars);
        this.db.run(sql, objVars, function (err) {
            data.id = this.lastID;
            next(err, data.id);
        });
    };
    SQLiteTable.prototype.save = function (data, next) {
        if (data.id) {
            this.update(data, function (err) { return next(err, data); });
        }
        else {
            this.insert(data, function (err) { return next(err, data); });
        }
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
        log('update', sql, objVars);
        this.db.run(sql, objVars, next);
    };
    SQLiteTable.prototype.remove = function (id, next) {
        var sql = 'DELETE FROM ' + this.getTableName() + ' WHERE id=?';
        log('remove', sql);
        this.db.run(sql, id, function (err) {
            next(err, this.changes === 1);
        });
    };
    SQLiteTable.prototype.getObjVars = function (obj) {
        var objVars = {};
        Object.keys(obj).forEach(function (key) {
            objVars['$' + key] = Array.isArray(obj[key]) ? obj[key][1] : obj[key];
        });
        return objVars;
    };
    SQLiteTable.prototype.getSQLSelectStmt = function (params, limit, select) {
        if (select === void 0) { select = '*'; }
        var objVars = this.getObjVars(params);
        var whereStmts = Object.keys(params).map(function (key) {
            var sign = Array.isArray(params[key]) ? params[key][0] : '=';
            return key + sign + '$' + key;
        });
        var where = whereStmts.length > 0 ? ' WHERE ' + whereStmts.join(' AND ') : '';
        var limitSQL = '';
        if (limit) {
            limitSQL += ' LIMIT ' + parseInt(limit.limit).toString();
            if (limit.offset) {
                limitSQL += ' OFFSET ' + parseInt(limit.offset).toString();
            }
        }
        return {
            sql: 'SELECT ' + select + ' FROM ' + this.getTableName() + where + limitSQL,
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
//# sourceMappingURL=SQLiteTable.js.map