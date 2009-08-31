;/**
 * @fileOverview DB Class
 * @author <a href="http://ngsdev.org/">Atsushi Nagase </a>
 * @license <a href="http://www.apache.org/licenses/LICENSE-2.0">Apache License 2.0</a>
 * @global DBClass
 */

/** @static
 * @class */
DBClass.Adapter = {
	/** @member
	 * @constant */
	HTML5 : "html5",
	/** @member
	 * @constant */
	YAHOO : "yahoo",
	/** @member
	 * @constant */
	AIR : "air",
	/** @member
	 * @constant */
	AUTO  : "auto"
}
 
/**
 * @class
 * @constructor
 */
function DBClass() {
	throw Error("DBClass has no constructor");
}

/**
 * @static
 * @function
 * @param {String} name Database name or Path to database(Yahoo).
 * @param {int} type Database size; If Yahoo,this will be ignored.
 * @param {DBClass.Adapter} type Database type; If Yahoo, this will be ignored.
 * @param {String} version Database version; If Yahoo, this will be ignored.
 * @param {String} comment Database comment; If Yahoo, this will be ignored.
 */
DBClass.create = function(name,size,type,version,comment) {
	if(!name)  throw Error("Parameter:name is required.");
	var c = function() {
		this.name = name||this.name;
		this.size = size||this.size;
		this.type = type||this.type;
		this.version = version||this.vertion;
		this.comment = this.comment;
		this.db = DBClass.detectDB(this);
	};
	c.prototype = DBClass.prototype;
	return c;
}

/**
 * @private
 * @static
 */
DBClass.detectDB = function(ins) {
	var db;
	switch(ins.type) {
	case DBClass.Adapter.HTML5:
		db = openDatabase(ins.name, ins.version, ins.comment, ins.size);
		return db;
		break;
	case DBClass.Adapter.YAHOO:
		db = new SQLite();
		db.open(ins.name);
		return db;
		break;
	case DBClass.Adapter.AUTO:
		var e;
		for(var i in DBClass.Adapter) {
			var t = DBClass.Adapter[i];
			if(t==DBClass.Adapter.AUTO) continue;
			try {
				ins.type = t;
				db = DBClass.detectDB(ins);
				return db;
			} catch(e) {
				throw Error("Database is not supported.");
			}
		}
		break;
	}
}

/** @class */
DBClass.prototype = {
	/**
	 * Database name or Path to database(Yahoo).
	 * @type String
	 */
	name : "",
	/**
	 * Database size; If Yahoo, this will be ignored.
	 * @type int
	 * @default 200000
	 */
	size : 200000,
	/**
	 * Database type; If Yahoo, this will be ignored.
	 * @type DBClass.Adapter
	 * @default DBClass.Adapter.AUTO
	 */
	type : DBClass.Adapter.AUTO,
	/**
	 * Database version; If Yahoo, this will be ignored.
	 * @type String
	 * @default 1.0
	 */
	verion : "1.0",
	/**
	 * Database comment; If Yahoo, this will be ignored.
	 * @type String
	 * @default Uncommented database generated by DBClass.js
	 */
	comment : "Uncommented database generated by DBClass.js",
	/**
	 * Database instance.
	 * @type Object
	 */
	db : null,
	/**
	 * @param {String} table Table name.
	 * @param {Array.&lt;AbstractSQL.Field&gt;} fields Array contains AbstractSQL.Field class instances.
	 * @returns DBClass.Schema
	 * @param {Boolean} createManually
	 */
	schema : function(table,fields,createManually) {
		return new DBClass.Schema(this,table,fields,createManually);
	}
}

/**
 * @class
 * @constructor
 * @param {DBClass} db
 * @param {String} name Table name.
 * @param {Array.&lt;AbstractSQL.Field&gt;} fields Array contains AbstractSQL.Field class instances.
 * @param {Boolean} createManually
 */
DBClass.Schema = function(db,name,fields,createManually) {
	this.name = name;
	this.db = db;
	this.fields = fields;
	this.createManually = !!createManually;
}

/** @class */
DBClass.Schema.prototype = {
	/**
	 * Initialize Schema
	 * @param {Function} callback
	 */
	init : function(callback) {
		var sql = new AbstractSQL(this.name);
		var schema = this;
		callback = callback || function(){};
		if(!this.createManually) {
			schema.exec(sql.createTable(this.fields,true,false),function(){
				callback.apply(schema,[this]);
			});
		}
	},
	/**
	 * If true, don't create table automatic.
	 * @type Boolean
	 */
	createManually : false,
	/**
	 * Table name
	 * @type String
	 */
	name : "",
	/**
	 * Array contains AbstractSQL.Field class instances.
	 * @type Array.&lt;AbstractSQL.Field&gt;
	 */
	fields : null,
	/**
	 * Execute SQL
	 * @param {AbstractSQL} sql First callback argument in DBClass.Result instance.
	 * @param {Function} callback
	 * @param {Array.<String>} bind Bind Variables; Not supported in Yahoo
	 */
	exec : function(sql,callback,bind) {
		var schema = this;
		callback = callback || function(){};
		bind = bind||[];
		if(schema.db.type==DBClass.Adapter.YAHOO) {
			
		} else {
			schema.db.db.transaction(function(tx){
				tx.executeSql(sql,bind,function(tx,r){
					var res = new DBClass.Result(r.rows&& new RegExp("^select .+","i").test(sql)?r:null);
					res.success = true;
					res.sql = sql;
					callback.apply(res);
				},function(tx,err){
					var res = new DBClass.Result(null);
					res.success = true;
					res.sql = sql;
					res.error = err;
					callback.apply(res);
				});
			});
		}
	},
	/**
	 * Select rows
	 * @param {Array.&lt;String&gt;} fields
	 * @param {AbstractSQL.Where|AbstractSQL.WhereList} where
	 * @param {int} limit
	 * @param {AbstractSQL.Order} order
	 * @param {Function} callback
	 */
	select : function(fields,where,limit,order,callback) {
		var sql = new AbstractSQL(this.name);
		var schema = this;
		callback = callback||function(){};
		schema.exec(sql.select(fields,where,limit,order),function(){
			callback.apply(this,[this.success]);
		});
		
	},
	/**
	 * Insert data
	 * @param {Map.&lt;String,mixed&gt;} data
	 * @param {AbstractSQL.Conflict} onConflict
	 * @param {Function} callback
	 */
	insert : function(data,onConflict,callback) {
		var sql = new AbstractSQL(this.name);
		var schema = this;
		callback = callback||function(){};
		schema.exec(sql.insert(data,onConflict),function(){
			callback.apply(this,[this.success]);
		});
		
	},
	/**
	 * Update rows
	 * @param {Map.&lt;String,String&gt;} data
	 * @param {AbstractSQL.Where|AbstractSQL.WhereList} where
	 * @param {AbstractSQL.Conflict} on conflict
	 * @param {Function} callback
	 */
	update : function(data,where,onConflict,callback) {
		var sql = new AbstractSQL(this.name);
		var schema = this;
		callback = callback||function(){};
		schema.exec(sql.update(data,where,onConflict),function(){
			callback.apply(this,[this.success]);
		});
	},
	/**
	 * Remove rows
	 * @param {AbstractSQL.Where|AbstractSQL.WhereList} where
	 * @param {Function} callback
	 */
	remove : function(where,callback) {
		var sql = new AbstractSQL(this.name);
		var schema = this;
		callback = callback||function(){};
		schema.exec(sql.remove(where),function(){
			callback.apply(this,[this.success]);
		});
	},
	/**
	 * Get rows size, first argument of callback is number.
	 * @param {AbstractSQL.Where} where
	 * @param {Function} callback
	 */
	count : function(where,callback) {
		var sql = new AbstractSQL(this.name);
		var schema = this;
		if(typeof where == "function") {
			callback = where;
			where = null;
		}
		callback = callback||function(){};
		schema.exec(sql.count("*",where),function(){
			var r = !this.error&&this.resultSet?this.resultSet.rows:false;
			if(!r) return callback.apply(this,[-1]);
			var o = r.item(0);
			for(var i in o) {
				return callback.apply(this,[o[i]]);
			}
		});
	},
	/**
	 * Drop table
	 * @param {Function} callback
	 */
	drop : function(callback) {
		var sql = new AbstractSQL(this.name);
		var schema = this;
		callback = callback||function(){};
		schema.exec(sql.dropTable(true),function(){
			callback.apply(this,[!this.error]);
		});
		
	}
}

/**
 * Called from only DBClass#select
 * @constructor
 * @param {SQLResultSet} resultSet
 */
DBClass.Result = function(resultSet) {
	if(resultSet) {
		this.resultSet = resultSet;
		var rows = resultSet.rows;
		/** @ignore */
		this.each = function(callback) {
			for(var i=0;i<rows.length;i++) {
				callback.apply(rows.item(i),[i,this]);
			}
		}
		/** @ignore */
		this.length = rows.length;
		/** @ignore */
		this.item = function(idx) {
			return rows.item(idx);
		}
	}
}

/**
 * @class
 */
DBClass.Result.prototype = {
	/** @private */
	resultSet : null,
	/** @private */
	sql : "",
	/**
	 * @type Error
	 */
	error : null,
	/**
	 * @type Boolean
	 */
	success : false,
	/**
	 * @type int
	 */
	length : 0,
	/**
	 * Called each items.
	 * @param {Function} func
	 */
	each : function(){ throw Error("DBClass.Result#each can use only result of select method."); },
	/**
	 * @param {int} idx
	 */
	item : function(){ throw Error("DBClass.Result#item can use only result of select method."); }
}