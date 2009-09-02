var schema,initialized=false,windows;
var ID_LENGTH = 15, ID_BASE = "abcdefghijklmnopqrstuvwxyz0123456789";

function init(event) {
	air.trace(event);
	windows = [];
	var MyDB = DBClass.create("dbclass_test.db",10000,DBClass.Adapter.AUTO,"1.0","DBClass Demo");
	var db = new MyDB();
	var id = new AbstractSQL.Field("id",AbstractSQL.FieldType.TEXT,ID_LENGTH);
	id.primary = true;
	id.notNull = true;
	id.unique = true;
	var title = new AbstractSQL.Field("title",AbstractSQL.FieldType.TEXT,0xff);
	var text = new AbstractSQL.Field("text",AbstractSQL.FieldType.TEXT,0xff);
	var added = new AbstractSQL.Field("added",AbstractSQL.FieldType.TEXT,0xff);
	added.notNull = true;
	var xpos = new AbstractSQL.Field("x",AbstractSQL.FieldType.INTEGER);
	xpos.notNull = true;
	var ypos = new AbstractSQL.Field("y",AbstractSQL.FieldType.INTEGER);
	ypos.notNull = true;
	var modified = new AbstractSQL.Field("modified",AbstractSQL.FieldType.TEXT,0xff);
	modified.notNull = true;
	schema = db.schema("nodepad",[id,title,text,added,modified,xpos,ypos]);
	schema.init(function(s){
		air.trace(this.sql);
		if(!s) return alert("Failed to initialize.");
		initialized = true;
		schema.select(["id","title","text","added","modified","x","y"],null,null,null,function(s){
			air.trace(this.sql);
			if(!this.length)
				return newNote();
			this.each(function(i){ appendNote(this); });
		});
	});
}

function newNote() {
	
}

function appendNote(item) {

}