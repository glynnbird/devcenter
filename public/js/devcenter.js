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

var deleteDocs = function(docIds) {
   $('#deletebutton').prop('disabled', true);
   $('#deletebutton').text('Updating...')
  var ids = []
  if (docIds) {
    ids = docIds
  } else {
    $('.select_checkbox:checked')
      .each(function() {
        ids.push(this.id)
      })
  }
  var req = {
    url: "markdeleted",
    method: "post",
    data: {"ids": JSON.stringify(ids)},
    dataType: "json"
  };
  $.ajax(req)
    .always(function() {
      $('#deletebutton').text('Delete')
      $('#deletebutton').prop('disabled', false)
      $('#searchbutton').click()
    })

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

var searchDocs = function(search, bookmark) {
  if (typeof search !== 'undefined' & search != null) {
    $('#searchinput').val(search);
  }

  var url = '/searchdoc?q='+(encodeURIComponent($('#searchinput').val()) || '*:*');
  if (bookmark) {
    url += '&bookmark='+bookmark;
  }

  $('#searchinput').prop('disabled', true);
  $('#searchbutton').prop('disabled', true);
  $('#morebutton').prop('disabled', true);

  resetFilters();

  $.get(url)
    .done(function(data) {
      if (bookmark) {
        $('.table_basic > tbody').append(data);
      }
      else {
        $('.table_basic > tbody').html(data);
      }

      var count = $('.table_basic > tbody > tr.docrow').length;
      var total = Number($('.table_basic > tbody > tr.docrow').last().data('total-rows') || 0);
      var hasMore = total > count;
      $('.search_count').text('Showing ' + count + ' of ' + total);
      $('#morebutton').css('visibility', hasMore ? 'visible' : 'hidden');
      $('#morebutton').data('bookmark', hasMore ? $('.table_basic > tbody > tr.docrow').last().data('bookmark') : null);
    })
    .fail(function(err) {
      renderMessage(err);
    })
    .always(function() {
      $('#searchinput').prop('disabled', false);
      $('#searchbutton').prop('disabled', false);
      $('#morebutton').prop('disabled', false);
    });

  return false; 
}

var updateNav = function(activeDom) {
  $("li.active").removeClass("active");
  if (activeDom) {
    $(activeDom).parentNode.addClass("active");
  }
}

var resetFilters = function() {
  var query = $('#searchinput').val();

  $('div.searchfacet a.type_link').each(function(index) {
    var data = $(this).data('search-filter');
    var quoted = data.split(':');
    quoted = (quoted[0] + ':"' + quoted[1] + '"');

    if ((query + ' ').indexOf(data + ' ') > -1 ||
        (query + ' ').indexOf(quoted + ' ') > -1) {
      $(this).addClass('active');
    }
    else {
      $(this).removeClass('active');
    }
  });

  $('#searchclear').css('visibility', (query.length == 0 || query === '*:*') ? 'hidden' : 'visible');
}

var filterSearch = function(n, i) {
  var current = $('#searchinput').val() || '*:*';
  var next = $('#' + n + '-' + i).data('search-filter').split(':');
  // add quotes if facet contains space and is not already quoted
  var query = (next[0].indexOf(' ') == -1 || next[0].indexOf('"') == 0) ? next[0] : ('"' + next[0] + '"');

  // add quotes if value contains space and is not already quoted
  if (next[1]) {
    query += ':';
    query += next[1].indexOf('"') == 0 ? next[1] : ('"' + next[1] + '"');
  }

  // remove search query if already exists else append search query
  if (current.indexOf(query) > -1) {
    query = current.replace(query, '').replace(/((\sAND\s)+)/ig, ' AND ');
  }
  else if (current !== '*:*') {
    query += (' AND ' + current);
  }

  query = query.trim();
  
  if (query.indexOf('AND') == 0) {
    query = query.substring(3);
  }
  
  if (query.lastIndexOf('AND') == query.length - 3) {
    query = query.substring(0, query.lastIndexOf('AND'));
  }

  searchDocs(query);
}

$(function() {
  $( ".tabbed-panel" ).tabs();
});
