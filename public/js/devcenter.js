var renderMessage = function(msg, containerId) {
  var id = containerId || "error";
  var str = msg;
  
  if (typeof msg == "object") {
    str = msg.message || JSON.stringify(msg);
  }
  
  var html = '<div class="alert-container warning" role="alert">';
  html += '<p>' + str + '</p>';
  html += '<div class="dialog_dismiss"><button class="button_primary" onclick="document.getElementById(\'' + id + '\').innerHTML=\'\';">Dismiss</button></div>';
  html += '</div>';
  
  $('#' + id).html(html);
}

var checkLogin = function() {
  
  var password = $('#password').val();
  var req = {
    url: "login",
    method: "post",
    data: {
      password:password
    },
    dataType: "json"
  };
  $('#loginbtn').prop('disabled', true);
  $.ajax(req).done(function(msg) {
    if(msg.ok==true) {
      window.location.href=".";
    } else {
      renderMessage("Invalid password");
    }
    $('#loginbtn').prop('disabled', false);
    

  }).fail(function(msg) {
    renderMessage("Something went wrong");
    $('#loginbtn').prop('disabled', false);
  });
  
  return false;
};

var submitProvisional = function() {
  console.log("Submitting");
  var doc = $('#provisional').serialize();
  console.log(doc);
  var req = {
    url: "submitprovisional",
    method: "post",
    data: $('#provisional').serialize(),
    dataType: "json"
  };
  $('#provsubmitbtn').prop('disabled', true);
  $.ajax(req).done(function(msg) {
    if(msg.ok==true) {
      renderMessage("Success");
    } else {
      renderMessage(msg.error);
    }
    $('#provsubmitbtn').prop('disabled', false);
  }).fail(function(msg) {
    renderMessage("Something went wrong");
    $('#provsubmitbtn').prop('disabled', false);
  });

  return false;
  
}

var submitDoc = function() {
  console.log("Submitting");
  var doc = $('#doc').serialize();
  console.log(doc);
  var req = {
    url: "submitdoc",
    method: "post",
    data: $('#doc').serialize(),
    dataType: "json"
  };
  $('#submitdocbtn').prop('disabled', true);
  $.ajax(req).done(function(msg) {
    if(msg.ok==true) {
      renderMessage("Success", "submiterror");
    } else {
      renderMessage(msg.error, "submiterror");
    }
    $('#submitdocbtn').prop('disabled', false);
  }).fail(function(msg) {
    renderMessage("Something went wrong", "submiterror");
    $('#submitdocbtn').prop('disabled', false);
  });

  return false;
  
}


var submitSchema= function() {
  
  var val = editor.getValue();
  console.log(val);
  try {
    var parseval = JSON.parse(val);
    $('#schemasubmitbtn').prop('disabled', true);
    var req = {
      url: "schema",
      method: "post",
      data: {schema :JSON.stringify(parseval) }
    };
    $.ajax(req).done(function(msg) {
      console.log(msg);
      if(msg.ok==true) {
        renderMessage("Success");
      } else {
        renderMessage(msg.error);
      }
      $('#schemasubmitbtn').prop('disabled', false);
    }).fail(function(msg) {
      renderMessage("Something went wrong");
      $('#schemasubmitbtn').prop('disabled', false);
    });
  }
  catch(e) {
    renderMessage("Invalid JSON");
      $('#schemasubmitbtn').prop('disabled', false);
  }
  return false;
}

var updateNav = function(activeDom) {
  $("li.active").removeClass("active");
  if (activeDom) {
    $(activeDom).parentNode.addClass("active");
  }
}

$(function() {
  $( ".tabbed-panel" ).tabs();
});
