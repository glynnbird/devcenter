var request = require('request');
var unfluff = require('unfluff');
 var htmltotext = require('html-to-text');

var url = function(u, callback) {
  request(u, function (error, response, body) {
    try {
      
      // unfluff to extract structured data
      var data = unfluff(body);
      var doc={}
      doc.full_name = data.title?data.title:"";
      doc.imageurl = data.image?data.image:"";
      doc.description = data.description?data.description:"";
       
      // extract the body using htmltotext
      doc.body = htmltotext.fromString(body, {  ignoreHref: true , ignoreImage: true});
      
      callback(null,doc);

    } catch(e) {

      callback(true,null);
    }
  });
}

module.exports = {
  url: url
};