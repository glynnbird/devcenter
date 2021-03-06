/*jshint node:true*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as it's web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

var cloudant = require('./lib/db.js');
var dw = cloudant.db.use('dw');

// moment
var moment = require('moment');

// spider 
var spider = require('./lib/spider.js');

// body parsing
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

// sessions please
var session = require('express-session');
app.use(session({
  secret: 'devcenter'
}));



// automatically create meta data for a URL
var autoMeta = function(doc, callback) {
  // grab existing values
  dw.view("search","breakdown", { group_level: 2 }, function(err, data) {
    if(err) {
      return callback("Something went wrong", doc);
    }
    var str = [doc.name,doc.full_name, doc.description, doc.body].join(" ");
    str = str.replace(/\W+/g,' ');
    var words = str.split(' ');
    for(var i in data.rows) {
      var key = data.rows[i].key;
      if(words.indexOf(key[1]) > -1 && doc[key[0]].indexOf(key[1])==-1) {
        doc[key[0]].push(key[1])
      }
    }
    callback(err, doc);
  });
};


var template =  {  
   "_id": "",
   "name":"",
   "full_name":"",
   "url":"",
   "created_at":"",
   "updated_at":"",
   "languages":[  
   ],
   "technologies":[  
   ],
   "friendly_name":"",
   "description":"",
   "topic":[  
   ],
   "featured":false,
   "body": "",
   "related": [],
   "imageurl":"",
   "githuburl": "",
   "videourl": "",
   "demourl": "",
   "documentationurl": "",
   "otherurl": "",
   "type": "Article",
   "status": "Provisional",
   "author": ""
};

// use the jade templating engine
app.set('view engine', 'jade');

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

var crypto = require('crypto');

var genhash = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
};


app.get('/', function(req,res) {
  if(req.session.loggedin) {
    res.redirect("/menu");
  } else {
    res.render('home', { });
  }

});

app.post('/login', function(req,res) {
  if(req.body.password == process.env.PASSWORD) {
    req.session.loggedin=true;
    res.send({"ok":true});
  } else {
    res.send({"ok":false});
  }
});

app.get('/menu', function(req,res) {
  if (req.session.loggedin) {
    dw.view("search","bystatus", { reduce: false}, function(err,data) {
      res.render("menu", {session:req.session, docs: data});
    });
  } else {
    res.redirect("/");
  }
});

app.get('/doc', function(req,res) {
  if (req.session.loggedin) {
    var doc = JSON.parse(JSON.stringify(template));
    res.render("doc", {session:req.session, doc:doc});
  } else {
    res.redirect("/");
  }
});

app.get('/doc/:id', function(req,res) {
  if (req.session.loggedin) {
   
    var id = req.params.id;
    dw.get(id, function(err, data) {
      if(err) {
        return res.status(404);
      }
      data.githuburl = (data.githuburl || "");
      data.videourl = (data.videourl || "");
      data.demourl = (data.demourl || "");
      data.documentationurl = (data.documentationurl || "");
      data.otherurl = (data.otherurl || "");
      res.render("doc", {session:req.session, doc:data});
    });
    
  } else {
    res.redirect("/");
  }
});

var split = function(str) {
  if(str.length==0) {
    return [];
  }
  var s = str.split(",");
  for(var i in s) {
    s[i] = s[i].replace(/^ +/,"").replace(/ +$/,"");
  }
  return s;
}

var now = function() {
  return moment().format("YYYY-MM-DD HH:mm:ss Z");
}

var submitProvisional = function(url, callback) {
  var u = require('url');
  var parsed = u.parse(url);
  if(!parsed.hostname || !parsed.protocol) {
    return callback("Invalid URL", null);
  }
  var doc = JSON.parse(JSON.stringify(template));
  doc.url = url;
  doc._id =  genhash(doc.url);
  spider.url(doc.url, function(err, data) {
    doc.body="";
    doc.full_name="";
    if (!err) {
      doc.body=data.body;
      doc.name = doc.full_name= data.full_name
    }
    autoMeta(doc, function(err, data) {
      if(!err) {
        doc = data;
      }
      dw.insert(doc, function(err, data){
        console.log(err,data);
        callback(err,data);
      })
    });
  }); 
};

app.post('/submitprovisional', function(req,res) {
  submitProvisional(req.body.url, function(err,data) {
    res.send({"ok":(err==null), "error": err, "reply": data});
  });
})

app.post('/submitdoc', function(req,res) {
  if (req.session.loggedin) {
    
    var doc = req.body;
    
    if(!doc._id || doc._id.length==0) {
      doc._id =  genhash(doc.url);
      delete doc._rev;
    }
    doc.languages = split(doc.languages);
    doc.technologies = split(doc.technologies);
    doc.topic = split(doc.topic);
    doc.related = split(doc.related);
    doc.featured = false;
    doc.updated_at = now();
    if(!doc.created_at || doc.created_at.length==0) {
      doc.created_at = now();
    }
    if(doc.body.length==0) {
      spider.url(doc.url, function(err, data) {
        doc.body="";
        doc.full_name="";
        if(!err) {
          doc.body=data.body;
          doc.full_name= data.full_name
        }
        dw.insert(doc, function(err, data){
          res.send({"ok":(err==null), "error": err, "reply": data});
        })
      }); 
    } else {
      dw.insert(doc, function(err, data){
        res.send({"ok":(err==null), "error": err, "reply": data});
      });
    }
    
  } else {
    res.redirect("/");
  }
});

app.get('/logout', function(req,res) {
  req.session.loggedin=false;
  res.redirect("/");
});

app.post('/slack', function(req,res) {
  if(req.body.token && req.body.token == process.env.SLACK_TOKEN) {
    var url = req.body.text;
    if (typeof url == "string" && url.length>0) {
      submitProvisional(url, function(err,data) {
        if (err) {
          res.send("There was an error :( " + err);
        } else {
          res.send("Thanks for submitting " + url + ". The URL will be published after it is reviewed by a human. " + 
                     "https://devcenter.mybluemix.net/doc/"+data.id);
        }
      });
    } else {
      res.send("Syntax: /devcenter <url>   e.g. /devcenter http://mysite.com/");
    }
  } else {
    res.send("Invalid request.");   
  }
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, appEnv.bind, function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
