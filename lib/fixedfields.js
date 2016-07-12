
var get = function() {
  var template = {  
     "_id": "",
    "_rev": "",
     "name": "",
     "full_name": "",
     "description": "",
     "body": "",
     "url": "",
     "created_at": "",
     "updated_at": "",
     "imageurl": "",
     "status": "Provisional"
  };
  var clone = JSON.parse(JSON.stringify(template));
  return clone;
}

module.exports = {
  get: get
};

