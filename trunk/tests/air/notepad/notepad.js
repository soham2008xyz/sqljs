var schema,initialized=false,windows;
var ID_LENGTH = 15, ID_BASE = "abcdefghijklmnopqrstuvwxyz0123456789";
var trace = air.trace;

function init(event) {
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
	var width = new AbstractSQL.Field("width",AbstractSQL.FieldType.INTEGER);
	width.notNull = true;
	var height = new AbstractSQL.Field("height",AbstractSQL.FieldType.INTEGER);
	height.notNull = true;
	var modified = new AbstractSQL.Field("modified",AbstractSQL.FieldType.TEXT,0xff);
	modified.notNull = true;
	schema = db.schema("nodepad",[id,title,text,added,modified,xpos,ypos,width,height]);
	air.trace(event);
	schema.init(function(s){
		air.trace(this.sql);
		if(!s) return alert("Failed to initialize.");
		initialized = true;
		schema.select(["id","title","text","added","modified","x","y","width","height"],null,null,null,function(s){
			air.trace(this.sql);
			if(!this.length)
				return newNote();
			this.each(function(i){ appendNote(this); });
		});
	});
}

function generateId(callback) {
	var id = "";
	do {
		id += ID_BASE.charAt(parseInt(ID_BASE.length*Math.random()));
	} while(id.length<ID_LENGTH);
	schema.count(new AbstractSQL.Where("id",id),function(n){
		if(n>0) generateId(callback);
		else callback.apply(window,[id]);
	})
}

function newNote() {
	if(!initialized) return;
	generateId(function(id){
		var obj = {
			id:id,
			title:"Untitled",
			text:"",
			added:new Date().toString(),
			modified:new Date().toString(),
			x : 0xffff, y : 0xffff
		};
		schema.insert(obj,null,function(){
			if(this.error) return alert(this.error.message);
			appendNote(obj);
		});
	});
}

function appendNote(item) {
	var opts = new air.NativeWindowInitOptions(); 
	//opts.systemChrome = "none"; 
	//opts.type = "lightweight"; 
	 
	var bnds = new air.Rectangle(200,250,300,400); 
	var loader = air.HTMLLoader.createRootWindow(true, opts, true, bnds);
	loader.load(new air.URLRequest("note.html"));
	var win = loader.window;
	win._opener = this;
	win.id = item.id;
	var nw = win.nativeWindow;
	nw.addEventListener(air.NativeWindowBoundsEvent.MOVE,function(e){
		trace(e.afterBounds);
	});
	trace();

}
