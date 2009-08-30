;/**
 * @file Overview Abstract SQL
 * @author Atsushi Nagase http://ngsdev.org/1
 * 
 */
 
/**
 * @constructor
 * @param {String} table Table name
 * @param {Boolean} lower Is syntax lower.
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
	 * @returns {String} SQL String
	 */
	createTable : function(fields) {
		var sql = [];
		for(var i in fields) {
			var f = fields[i];
			if(!f.key||!f.type) continue;
			var s = f.key+" "+AbstractSQL.util.sqlcase(f.type,this.lower);
			if(f.length) s+=AbstractSQL.util.parenthesis(f.length);
			if(f.primary) s+=AbstractSQL.util.sqlcase(" primary key",this.lower);
			if(f.order) s+=AbstractSQL.util.sqlcase(" "+f.order,this.lower);
			sql.push(s);
		}
		sql = [
			AbstractSQL.util.sqlcase("create table",this.lower),
			this.table,
			AbstractSQL.util.parenthesis(sql)
		].join(" ")+";";
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
	 * @param {AbstractSQL.Conflict} on conflict
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
 * @param {Boolean} primary 
 * @param {AbstractSQL.Order} order 
 */
AbstractSQL.Field = function(key,type,length,primary,order) {
	this.key = key;
	this.type = type;
	this.primary = primary?true:false;
	this.order = new RegExp("^("+AbstractSQL.Order.ASC+"|"+AbstractSQL.Order.DESC+")$","i").test(order)?order:null;
	this.length = length;
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