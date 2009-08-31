;/**
 * @fileOverview Abstract SQL
 * @author <a href="http://ngsdev.org/">Atsushi Nagase </a>
 * @license <a href="http://www.apache.org/licenses/LICENSE-2.0">Apache License 2.0</a>
 * 
 */
 
/**
 * @constructor
 * @param {String} table Table name
 * @param {Boolean} lower Is syntax lower. Default is false.
 */
function AbstractSQL(table,lower) {
	this.table = table;
	this.lower = lower;
	this.sql = [];
}

/*
 * @class
 */
AbstractSQL.prototype = {
	/**
	 * @returns {String} SQL String
	 */
	toString : function() {
		return this.sql.join("\n");
	},
	/** @private */
	sql:null,
	/** Is syntax lower case. */
	lower : false,
	/**
	 * @param {Array.&lt;AbstractSQL.Field&gt;} fields 
	 * @param {Boolean} ifNotExists <q>IF NOT EXISTS</q>. Default is false.
	 * @param {Boolean} temporary <q>TEMPORARY</q>. Default is false.
	 * @returns {String} SQL String
	 */
	createTable : function(fields,ifNotExists,temporary) {
		var sql = [AbstractSQL.util.sqlcase("create",this.lower)];
		if(temporary) sql.push("temporary");
		sql.push(AbstractSQL.util.sqlcase("table",this.lower))
		if(ifNotExists) sql.push(AbstractSQL.util.sqlcase("if not exists",this.lower));
		sql.push(this.table);
		var fld = [];
		for(var i in fields) {
			fields[i].lower = this.lower;
			var s = fields[i].toString();
			if(!s) continue;
			fld.push(s);
		}
		sql.push(AbstractSQL.util.parenthesis(fld));
		sql = sql.join(" ")+";";
		this.sql.push(sql);
		return sql;
	},
	/**
	 * @param {Boolean} ifExists 
	 * @returns {String} SQL String
	 */
	dropTable : function(ifExists) {
		var sql = [AbstractSQL.util.sqlcase("drop table",this.lower)];
		if(ifExists) sql.push(AbstractSQL.util.sqlcase("if exists",this.lower));
		sql.push(this.table);
		sql = sql.join(" ");
		this.sql.push(sql);
		return sql;
		
	},
	/**
	 * @param {Array.&lt;String&gt;} fields
	 * @param {AbstractSQL.Where|AbstractSQL.WhereList} where
	 * @param {int} limit
	 * @param {AbstractSQL.Order} order
	 * @returns {String} SQL String
	 */
	select : function(fields,where,limit,order) {
		if(!fields) fields = "*";
		if(fields instanceof Array) fields = fields.length?fields.join(","):"*";
		var sql = [
			AbstractSQL.util.sqlcase("select",this.lower),
			fields,
			AbstractSQL.util.sqlcase("from",this.lower),
			this.table
		];
		sql = this.appendWhere(sql,where);
		if(limit) sql.push(AbstractSQL.util.sqlcase("limit",this.lower)+" "+limit);
		sql = sql.join(" ")+";";
		this.sql.push(sql);
		return sql;
	},
	/**
	 * @param {Map.&lt;String,String&gt;} data
	 * @param {AbstractSQL.Conflict} onConflict
	 * @returns {String} SQL String
	 */
	insert : function(obj,onConflict) {
		var fields = [], data = [];
		for(var i in obj) {
			fields.push(i);
			data.push(obj[i]);
		}
		var sql = [
			AbstractSQL.util.sqlcase("insert",this.lower),
		];
		if(onConflict) {
			sql.push(
				AbstractSQL.util.sqlcase([
					AbstractSQL.Logic.OR,
					onConflict
				].join(" "),this.lower)
			);
		}
		sql = sql.concat([
			AbstractSQL.util.sqlcase("into",this.lower),
			this.table,
			AbstractSQL.util.parenthesis(fields),
			AbstractSQL.util.sqlcase("values",this.lower)+AbstractSQL.util.quotize(data)
		]);
		sql = sql.join(" ")+";";
		this.sql.push(sql);
		return sql;
	},
	/**
	 * @param {Map.&lt;String,String&gt;} data
	 * @param {AbstractSQL.Where|AbstractSQL.WhereList} where
	 * @param {AbstractSQL.Conflict} on conflict
	 * @returns {String} SQL String
	 */
	update : function(data,where,onConflict) {
		var val = [];
		for(var i in data) {
			val.push(i+"="+AbstractSQL.util.quotize(data[i]));
		}
		var sql = [
			AbstractSQL.util.sqlcase("update",this.lower)
		];
		if(onConflict) {
			sql.push(
				AbstractSQL.util.sqlcase([
					AbstractSQL.Logic.OR,
					onConflict
				].join(" "),this.lower)
			);
		}
		sql = sql.concat([
			this.table,
			AbstractSQL.util.sqlcase("set",this.lower),
			val.join(", ")
		]);
		sql = this.appendWhere(sql,where);
		sql = sql.join(" ")+";";
		this.sql.push(sql);
		return sql;
	},
	/**
	 * DELETE
	 * @param {AbstractSQL.Where|AbstractSQL.WhereList} where
	 * @returns {String} SQL String
	 */
	remove : function(where) {
		var val = [];
		var sql = [
			AbstractSQL.util.sqlcase("delete from",this.lower),
			this.table,
		];
		sql = this.appendWhere(sql,where);
		sql = sql.join(" ")+";";
		this.sql.push(sql);
		return sql;
	},
	/**
	 * @param {String} key
	 * @param {AbstractSQL.Where|AbstractSQL.WhereList} where
	 * @returns {String} SQL String
	 */
	count : function(key,where) {
		if(!key) key = "*";
		var sql = [
			AbstractSQL.util.sqlcase("select count",this.lower)+AbstractSQL.util.parenthesis(key),
			AbstractSQL.util.sqlcase("from",this.lower),
			this.table
		];
		sql = this.appendWhere(sql,where);
		sql = sql.join(" ")+";";
		this.sql.push(sql);
		return sql;
	},
	/** @private */
	appendWhere : function(sql,where) {
		if(
			where instanceof AbstractSQL.Where||
			where instanceof AbstractSQL.WhereLest
		) {
			where.lower = this.lower;
			return where.toString();
		}
		
		return where?sql.concat([AbstractSQL.util.sqlcase("where",this.lower),where]):sql;
	}
}

/**
 * @namespace
 */
AbstractSQL.util = {
	sqlcase : function(str,lower) {
		str = str||"";
		return lower?str.toLowerCase():str.toUpperCase();
	},
	/**
	 * @param {String|Array} val
	 * @returns {String} String val wrapped by parenthesis.
	 */
	parenthesis : function(val) {
		return ["(",val instanceof Array?val.join(", "):val,")"].join("");
	},
	/**
	 * @param {String|Array|Boolean} val
	 * @returns {String} Serialized value.
	 */
	quotize : function(val) {
		var ret,t=typeof val;
		if(t == "string") return ["'",val,"'"].join("");
		if(t == "boolean") return val?1:0;
		if(val instanceof Array) {
			ret = [];
			for(var i in val) {
				ret.push(this.quotize(val[i]));
			}
			return AbstractSQL.util.parenthesis(ret);
		}
		return val;
	}
};

/**
 * @class
 * @constructor
 * @param {String} key
 * @param {AbstractSQL.FieldType} type
 * @param {int} length 0-0xff
 * @param {Boolean} primary PRIMARY KEY
 * @param {AbstractSQL.Order} order ASC|DESC
 * @param {AbstractSQL.Conflict} keyOnConflict
 * @param {Boolean} autoIncrement AUTOINCREMENT
 * @param {Boolean} notNull NOT NULL
 * @param {AbstractSQL.Conflict} notNullOnConflict
 * @param {Boolean} unique UNIQUE
 * @param {AbstractSQL.Conflict} uniqueNullOnConflict
 */
AbstractSQL.Field = function(
	key,type,length,
	primary,order,keyOnConflict,autoIncrement,
	notNull,notNullOnConflict,
	unique,uniqueOnConflict
) {
	this.key = key;
	this.type = type;
	this.length = length;
	this.primary = primary?true:false;
	this.order = new RegExp("^("+AbstractSQL.Order.ASC+"|"+AbstractSQL.Order.DESC+")$","i").test(order)?order:null;
	this.keyOnConflict = keyOnConflict;
	this.autoIncrement = autoIncrement;
	this.notNull = notNull;
	this.notNullOnConflict = notNullOnConflict;
	this.unique = unique;
	this.uniqueOnConflict = uniqueOnConflict;
}

AbstractSQL.Field.prototype = {
	/**
	 * @type String
	 */
	key : "",
	/**
	 * @type AbstractSQL.FieldType
	 */
	type : "",
	/**
	 * @type int
	 */
	length : 0,
	/**
	 * @type Boolean PRIMARY KEY
	 */
	primary : false,
	/**
	 * @type AbstractSQL.Order
	 */
	order : null,
	/**
	 * @type AbstractSQL.Conflict
	 */
	keyOnConflict : "",
	/**
	 * @type Boolean
	 */
	autoIncrement : false,
	/**
	 * @type notNull
	 */
	notNull : false,
	/**
	 * @type AbstractSQL.Conflict
	 */
	notNullOnConflict : false,
	/**
	 * @type Boolean
	 */
	unique : false,
	/**
	 * @type AbstractSQL.Conflict
	 */
	uniqueOnConflict : false,
	/**
	 * @type Boolean
	 * @default false
	 */
	lower : false,
	/**
	 * @returns SQL String
	 * @returns String
	 */
	toString : function() {
		var t = AbstractSQL.util.sqlcase(this.type,this.lower);
		if(this.length) t+=AbstractSQL.util.parenthesis(this.length);
		var s = [this.key,t];
		if(this.primary) {
			s.push(AbstractSQL.util.sqlcase("primary key",this.lower));
			if(this.order) s.push(AbstractSQL.util.sqlcase(this.order,this.lower));
			if(this.keyOnConflict) s.push(AbstractSQL.util.sqlcase("on conflict "+this.keyOnConflict,this.lower));
			if(this.autoIncrement) s.push(AbstractSQL.util.sqlcase("autoinclement"))
		}
		if(this.notNull) {
			s.push(AbstractSQL.util.sqlcase("not null"));
			if(this.notNullOnConflict) s.push(AbstractSQL.util.sqlcase("on conflict "+this.notNullOnConflict,this.lower));
		}
		if(this.unique) {
			s.push(AbstractSQL.util.sqlcase("unique"));
			if(this.uniqueOnConflict) s.push(AbstractSQL.util.sqlcase("on conflict "+this.uniqueOnConflict,this.lower));
		}
		return s.join(" ");
	}
}

/**
 * @constructor
 * @param {String} key
 * @param {String} value
 * @param {AbstractSQL.Operator} operator 
 */
AbstractSQL.Where = function(key,value,operator) {
	this.key = key;
	this.value = value;
	this.operator = operator||AbstractSQL.Operator.EQ;
}

/* @class */
AbstractSQL.Where.prototype = {
	/**
	 * @type String
	 */
	key : "",
	/**
	 * @type String
	 */
	value : "",
	/**
	 * @type AbstractSQL.Operator
	 */
	operator : "",
	/**
	 * @type Boolean
	 * @default false
	 */
	lower : false,
	/**
	 * @returns {String} SQL String
	 */
	toString : function() {
		var sql = [
			this.key,
			AbstractSQL.util.sqlcase(this.operator,this.lower),
			AbstractSQL.util.quotize(this.value)
		];
		return sql.join("");
	}
}

/**
 * @constructor
 * @param {AbstractSQL.Logic} logic 
 * @param {Array&lt;AbstractSQL.Where|AbstractSQL.WhereList&gt;} list
 */
AbstractSQL.WhereLest = function(logic,list) {
	this.list = list;
	this.logic = logic;
}

/* @class */
AbstractSQL.WhereLest.prototype = {
	/**
	 * @type Array&lt;AbstractSQL.Where|AbstractSQL.WhereList&gt;
	 */
	list : [],
	/**
	 * @type String
	 * @default AbstractSQL.Logic.OR
	 */
	logic : "or",
	/**
	 * @type Boolean
	 * @default false
	 */
	lower : false,
	/**
	 * @returns {String} SQL String
	 */
	toString : function() {
		var sql = [];
		for(var i in this.list) {
			var w = this.list[i];
			if(!w instanceof AbstractSQL.Where&&!w instanceof AbstractSQL.WhereList) continue;
			sql.push(w);
		
		}
		sql = AbstractSQL.util.parenthesis(
			sql.join(" "+AbstractSQL.util.sqlcase(this.logic,this.lower)+" ")
		);
		return sql;
	}

}

/** @static
 * @class */
AbstractSQL.FieldType = {
	/** @member
	 * @constant */
	NULL:"null",
	/** @member
	 * @constant */
	INTEGER:"integer",
	/** @member
	 * @constant */
	REAL:"real",
	/** @member
	 * @constant */
	TEXT:"text",
	/** @member
	 * @constant */
	BLOB:"blob"
}

/** @static
 * @class */
AbstractSQL.Order = {
	/** @member
	 * @constant */
	ASC : "asc",
	/** @member
	 * @constant */
	DESC : "desc"
}

/** @static
 * @class */
AbstractSQL.Operator = {
	/** @member
	 * @constant */
	EQ : "=",
	/** @member
	 * @constant */
	NE : "!=",
	/** @member
	 * @constant */
	LE : "<=",
	/** @member
	 * @constant */
	GE : ">=",
	/** @member
	 * @constant */
	LT : "<",
	/** @member
	 * @constant */
	GT : ">",
	/** @member
	 * @constant */
	LIKE : " like "
	
}

/** @static
 * @class */
AbstractSQL.Logic = {
	/** @member
	 * @constant */
	AND : "and",
	/** @member
	 * @constant */
	OR : "or"
}

/** @static
 * @class */
AbstractSQL.Conflict = {
	/** @member
	 * @constant */
	ROLLBACK : "rollback",
	/** @member
	 * @constant */
	ABORT : "abort",
	/** @member
	 * @constant */
	FAIL : "fail",
	/** @member
	 * @constant */
	REPLACE : "replace"
}



// __EOF__