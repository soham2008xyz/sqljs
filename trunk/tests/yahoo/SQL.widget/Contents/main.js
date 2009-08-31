var schema,initialized=false,windows;
var ID_LENGTH = 15, ID_BASE = "abcdefghijklmnopqrstuvwxyz0123456789";

function init() {
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
		if(!s) return alert("Failed to initialize.");
		initialized = true;
		schema.select(["id","title","text","added","modified","x","y"],null,null,null,function(s){
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
		else callback.apply(widget,[id]);
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

function updateNote(id,timestamp) {
	var win = getWindow(id);
	var title = getValue("title",id);
	var text = getValue("text",id);
	var d = new Date();
	var obj = {
		title : title,
		text :text,
		x : win.hOffset,
		y : win.vOffset
	}
	if(timestamp) obj.modified = d.toString();
	schema.update(obj,new AbstractSQL.Where("id",id),null,function(s){
		log(this.sql);
		if(timestamp) setValue("modified",id,getDateString(d));
		if(this.error) return alert(this.error.message);
	});
}

function removeNote(id) {
	schema.remove(new AbstractSQL.Where("id",id),function(s){
		log(this.sql);
		if(this.error) return alert(this.error.message);
		getWindow(id).close();
	});
}

function getDateString(date) {
	return [
		[date.getFullYear(),date.getMonth()+1,date.getDate()].join("\/"),
		[date.getHours(),date.getMinutes(),date.getSeconds()].join("\/")
	].join(" ");

}

function appendNote(item) {
	var doc = XMLDOM.parseFile("Resources/memo.xml");
	doc.evaluate("window/text[@name='modified']").item(0).setAttribute("id","modified-"+item.id);
	doc.evaluate("window/frame/textarea[@name='title']").item(0).setAttribute("id","title-"+item.id);
	doc.evaluate("window/textarea[@name='text']").item(0).setAttribute("id","text-"+item.id);
	doc.evaluate("window/frame/text[@name='close']").item(0).setAttribute("id","close-"+item.id);
	var li = widget.createWindowFromXML(doc);
	li.id = "note-"+item.id;
	item.x = item.x == 0xffff ? li.hOffset : item.x;
	item.y = item.y == 0xffff ? li.vOffset : item.y;
	li.hOffset = item.x;
	li.vOffset = item.y;
	var added = new Date(item.added);
	var modified = new Date(item.modified);
	var update = function() {
		updateNote(item.id,false);
	}
	li.onMouseEnter = update;
	li.onMouseExit  = update;
	getElement("title",item.id).onLoseFocus = update;
	getElement("text",item.id).onLoseFocus  = update;
	setValue("title",item.id,item.title);
	setValue("modified",item.id,getDateString(modified));
	setValue("text",item.id,item.text);
	getElement("close",item.id).onClick = function() {
		removeNote(item.id);
	}
	li.visible = true;
	windows.push(li);
}

function getValue(key,id) {
	return getElement(key,id).data;
}

function setValue(key,id,val) {
	return getElement(key,id).data = val;
}

function getWindow(id) {
	return getElement("note",id);
}

function getElement(key,id) {
	return widget.getElementById(key+"-"+id);
}

function removeAll() {
	schema.drop(function(){
		log(this.sql);
		if(this.error) {
			alert(this.error);
		}
		for(var i in windows) {
			log(/^note-.+/.test(windows[i].id),windows[i].id);
			if(windows[i]) {
				windows[i].close();
			}
		}
	});
}