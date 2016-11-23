var cloudant = require("./db.js"),
  DBNAME = "devcenter",
  db = cloudant.db.use(DBNAME),
  couchmigrate = require('./couchmigrate.js'),
  schemaDocName = "schema",
  fixedfields = require('./fixedfields.js');


// load the schema document from the database
var load = function(callback) {
  db.get(schemaDocName, callback);
};

// save a document as 'schema'
var save = function(doc, callback) {
  doc._id = schemaDocName;
  load(function(err, data) {
    if (!err) {
      doc._rev = data._rev;
    }
    db.insert(doc, callback);
  });
};

var saveAndGenerate = function(doc, callback) {
  save(doc, function(err, data) {
    var response = { ok: true, write: data, migrate: null};
    generateSearchIndex(doc, function(err, data) {
      response.migrate = data;
      callback(err, response);
    });
  })
}

// return a new blank document based on
// 1) the fixed fields that appear in every do
// 2) the fields determinted by the schema
var newDocument = function(callback) {
  load(function(err, schema) {
    var doc = fixedfields.get();
    if (!err) {
      for (var i in schema) {
        switch(schema[i].type) {
          case "arrayofstrings":
            doc[i] = [];
            break;
          case "string":
            doc[i] = "";
            break;
          case "boolean":
            doc[i] = false;
            break;
          case "number":
            doc[i] = 0;
            break;
        }
      }
    }
    callback(null, doc);
  });
};


// create a design document that indexes all the fixed and 
// schema-specified fields in the database, faceting when
// appropriate
var generateSearchIndex = function(schema, callback) {
  var func = 'function(doc){\n';
  func += '  if (doc._id =="schema" || doc._id.match(/^_design/)) return;\n';
  func += '  if (doc.status != "Live") return;\n';
  func += '  var indy = function(key, value, facet) {\n';
  func += '    var t = typeof value;\n';
  func += '    if (t == "string" || t == "number" || t == "boolean") {\n';
  func += '       index(key, value, {facet: facet,store:false});\n';
  func += '    } else if (t == "object" && value != null) {\n';
  func += '       for(var i in value) {\n';
  func += '         index(key, value[i], {facet: facet});\n';
  func += '       }\n';
  func += '    }\n';
  func += '  };\n\n';  
  
  // index the fixed fields
  func += '  indy("name", doc.name, false);\n';
  func += '  indy("full_name", doc.full_name, false);\n';
  func += '  indy("created_at", doc.created_at, false);\n';
  func += '  indy("updated_at", doc.updated_at, false);\n';
  func += '  indy("status", doc.status, false);\n';
  
  // index the other fields in the schema
  for (var i in schema) {
    var f = schema[i];
    var faceted = (typeof f.faceted=="boolean" && f.faceted)?"true":"false" 
    if (i != "_id" && i != "_rev") {
      func += '  indy("' + i + '", doc["'+ i + '"], ' + faceted + ');\n'; 
    }     
  }
  
  // create  a default index on all the fields
  func += '  delete doc._id;\n';
  func += '  delete doc._rev;\n';
  func += '  var str = "";\n';
  func += '  for(var key in doc) {\n';
  func += '    if(doc[key]) {\n';
  func += '      str += doc[key].toString() +" ";\n';
  func += '    }\n';
  func += '  }\n';
  func += '  indy("default", str, false);\n';
  func += '  indy("date", parseInt(doc.updated_at.substring(0,19).replace(/[^0-9]/g, "")), false); '
  func += '}\n';


  var func2 = 'function(doc){\n';
  func2 += '  if (doc._id =="schema" || doc._id.match(/^_design/)) return;\n';
  func2 += '  if (typeof doc.status !== "string") return;\n';
  func2 += '  var indy = function(key, value, facet) {\n';
  func2 += '    var t = typeof value;\n';
  func2 += '    if (t == "string" || t == "number" || t == "boolean") {\n';
  func2 += '       index(key, value, {facet: facet,store:false});\n';
  func2 += '    } else if (t == "object" && value != null) {\n';
  func2 += '       for(var i in value) {\n';
  func2 += '         index(key, value[i], {facet: facet});\n';
  func2 += '       }\n';
  func2 += '    }\n';
  func2 += '  };\n\n';  
  
  // index the fixed fields
  func2 += '  indy("name", doc.name, false);\n';
  func2 += '  indy("full_name", doc.full_name, false);\n';
  func2 += '  indy("status", doc.status, false);\n';
  
  // index the other fields in the schema
  for (var i in schema) {
    var f = schema[i];
    var faceted = (typeof f.faceted=="boolean" && f.faceted)?"true":"false" 
    if (i != "_id" && i != "_rev") {
      func2 += '  indy("' + i + '", doc["'+ i + '"], ' + faceted + ');\n'; 
    }     
  }
  
  func2 += '}\n';
  
  // generate design doc
  var ddoc = { _id: "_design/search", 
              views: {
                  bystatus: {
                    reduce: "_count",
                    map: "function (doc) {\n  if(typeof doc.status === \"string\") {\n    emit(doc.status, {name: doc.name, url:doc.url});\n  }\n}"
                  }
                },
               indexes: {
                 search: {
                   index: func
                 },
                 searchdocs: {
                   index: func2
                 }
               }};

  couchmigrate.migrate(DBNAME, ddoc, callback);
};



/*
{
  "_id": "schema",
  "_rev": "1-19ce521ebf44fa23470a9e3b097b9899",
  "languages": {
    "type": "arrayofstrings",
    "enforceValues": true,
    "values": [
      "Ruby",
      "Python",
      "Java",
      "JavaScript",
      "PHP",
      "Objective-C",
      "C#",
      "Swift",
      "C"
    ],
    "faceted": true
  },
  "technologies": {
    "type": "arrayofstrings",
    "enforceValues": true,
    "values": [
      "Bluemix",
      "Cloud Foundry",
      "Virtual machines",
      "Containers",
      "Cloudant",
      "Cloudant Local",
      "Cordova",
      "CouchDB",
      "DataWorks",
      "Elasticsearch",
      "Graph Data Store",
      "Ionic",
      "Looker",
      "MobileFirst",
      "MongoDB",
      "OAuth",
      "PhoneGap",
      "PostgreSQL",
      "PouchDB",
      "Redis",
      "Salesforce",
      "Spark",
      "WebSockets",
      "dashDB"
    ],
    "faceted": true
  },
  "topic": {
    "type": "string",
    "enforceValues": true,
    "values": [
      "Article",
      "Tutorial",
      "Video",
      "Sample",
      "API",
      "Blog",
      "Forum"
    ],
    "faceted": true
  },
  "featured": {
    "type": "boolean",
    "faceted": true
  },
  "demourl": {
    "type": "string"
  },
  "githuburl": {
    "type": "string"
  },
  "imageurl": {
    "type": "string"
  },
  "videourl": {
    "type": "string"
  },
  "documentationurl": {
    "type": "string"
  },
  "author": {
    "type": "string"
  },
  "otherurl": {
    "type": "string"
  },
  "level": {
    "type": "string",
    "enforceValues": true,
    "values": [
      "Beginner",
      "Intermediate",
      "Advanced"
    ],
    "faceted": true
  },
  "namespace": {
    "type": "string",
    "enforceValues": true,
    "values": [
      "Bluemix",
      "Cloud Data Services"
    ],
    "faceted": true
  }
}
*/

// on startup, make sure that the schema is current
cloudant.db.create(DBNAME, function(err,data){
  
  // set CORS
  cloudant.set_cors({ enable_cors: true, allow_credentials: true, origins: ["*"]}, function(err, data) {
    console.log("Enabled CORS on this Cloudant account");
  });
  
  // set world-readable
  var security = {
    nobody: ['_reader']
  };
  db.set_security(security, function(err, result) {
    console.log("Enabled read-only access to everyone to this database.");
  });
  
  
  load(function(e, data) {
    if (e) {
/*      var schema = {};
      saveAndGenerate(schema,  function() {
      });*/
    } else {
      generateSearchIndex(data, function() {
    
      });
    }
  });
});


module.exports = {
  load: load,
  save: save,
  newDocument: newDocument,
  saveAndGenerate: saveAndGenerate
}