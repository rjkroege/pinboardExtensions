// The url for the tab in which we activated the command.
var baseUrl;

// The note if any for this pinboard bookmark
var note;

// The title of the webpage
var title;

// The string of tags for this pinboard bookmark
var tags;

// True if we have sufficient content to actually register
// a bookmark. The minimum content is at least one tag.
var valid;

// Pinboard user name and password combination.
var properties;

/**
 * For each entered character, update the default displayed action.
 */
chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
  window.console.info('typed: ' + text)
  window.console.info('url: ' + baseUrl)
      
  var chunks = text.split(' ');
  
  if (text == "") {
    // No arguments. We require at least one
    valid = false;
    if (baseUrl) {
      chrome.omnibox.setDefaultSuggestion({
        description: '<dim>Enter tags and note for page: <url>' + baseUrl + '</url></dim>'
      });
    } else {
      chrome.omnibox.setDefaultSuggestion({
        description: '<dim>Enter tags and note for page</dim>'
      });
    }
  } else if (text != "" && chunks.length == 1) {
    // No note, only a tag.
    tags = chunks[0];
    note = null;
    valid = true;
    chrome.omnibox.setDefaultSuggestion({
      description: 'Tag: <match>' + tags + '</match> ' +
      '<dim>for url <url>' + baseUrl + '</url></dim>'
    });
  } else {
    // tag and note
    valid = true;
    tags = chunks[0];
    note = chunks.slice(1).join(' ');
    chrome.omnibox.setDefaultSuggestion({
      description: 'Tag: <match>' + tags + '</match>' +
      ' Note: <match>' + note + '</match> <dim>for url <url>' +
      baseUrl + '</url></dim>'
    });
  }
});


function resetState() {
  baseUrl = null;
  note = null;
  tags = null;
  title = null;
  valid = false;
}

function resetDefaultSuggestion() {
  resetState();
  chrome.omnibox.setDefaultSuggestion({
    description: 'Add bookmark to pinboard'
  });
}

resetDefaultSuggestion();

// Called once after typing the activation keyword.
// Rests the state and stashes the url.
chrome.omnibox.onInputStarted.addListener(function() {
  resetState(); // Reset our state.
  chrome.tabs.getSelected(null, function(tab) { // Grab the url for use later.
    baseUrl = tab.url;
    title = tab.title;
  });
  chrome.omnibox.setDefaultSuggestion({
    description: '<dim>Enter tags and note for url <url>' + baseUrl + '</url></dim>'
  });
});

chrome.omnibox.onInputCancelled.addListener(function() {
  resetDefaultSuggestion();
});

// Constructs an API url for pinboard. All urls have a standard
// structure: a dictionary of key/value pairs, an actual method
// name and authentication data.
function vendURL(method, user, pass, dict) {
  var url = 'https://' + user + ':' + pass + '@api.pinboard.in/v1/' + method + '?';
  var keyval = [];
  for (var key in dict) {
    keyval.push(key + '=' + encodeURI(dict[key]));
  }
  url = url + (keyval.join('&'));
  return url;
}

function trySavingBookmark(url) {
  console.info('trySavingBookmark');
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.onreadystatechange = function() {
    if (req.readyState == 4) {
      console.info('completed the xhr?');
      if (req.status != 200 &&
          req.responseXML.childNodes[0].attributes['code'].value != 'done') {
        // We have a problem
        // TODO(rjkroege): retry here a few times with growing backoff
        // TODO(rjkroege): need to track the timeout before we add retry so
        // we preserve the bookmark time. (Or does it matter very much?)
        // Worry about several bookmark requests in flight at a time?
        alert('Shucks. Posting the bookmark did not succeed.');
      }
    }
  }
  req.send(null);
}

/**
 * Fetches the property values from local storage.
 */
function getSavedProps() {
  var props = {};
  props['pinboardName'] = localStorage['pinboardName'];
  props['pinboardPassword'] = localStorage['pinboardPassword'];
  return props;
} 


chrome.omnibox.onInputEntered.addListener(function(text) {
  // It is possible that I need to update the state here?
  // Let's be lazy and not do it for now and assume that it's correct
  // from the last update from a typed character.

  window.console.info('we entered on our command. should make a bookmark now, tags: ' +
      tags + ' note: ' + note);

  window.console.info('valid: ' + valid);
  if (valid) {
    var response = getSavedProps();
    console.log("auth: " + response.pinboardName + " " + response.pinboardPassword);

    // insert the necessary parameters here
    // TODO(rjkroege): better error checking. Invalid perms, invalid yada...
    var dict = {
      url: baseUrl,
      description: title,
      extended: note,
      tags: tags
    };
    var url = vendURL('posts/add', response.pinboardName, response.pinboardPassword, dict);
    window.console.info('rest api: sending url <' + url + '>');
    // uncomment to run.
    trySavingBookmark(url);
  }
});

/**
 * Get properties from the options page.
 * Do this onload.
 */
function getTheProperties(argument) {
  chrome.extension.sendRequest({greeting: "hello"}, function(response) {
    properties = response;
    console.log(response.srcLocation);
  });
}

// Actually get some properties.
getTheProperties();

// TODO(rjkroege): some sort of error
