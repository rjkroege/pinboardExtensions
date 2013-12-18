
function Pinmark() {
    // The url for the tab in which we activated the command.
    this.base_url_ = null;

    // The note if any for this pinboard bookmark
    this.note_ = null;

    // The title of the webpage
    this.title_ = null;

    // The string of tags for this pinboard bookmark
    this.tags_ = null;

    // True if we have sufficient content to actually register
    // a bookmark. The minimum content is at least one tag.
    this.valid_ = false;
}

// Pinboard user name and password combination.
Pinmark.prototype.properties_ = null;

Pinmark.prototype.onInputChanged = function(text, suggest) {
  window.console.info('typed: ' + text)
  window.console.info('url: ' + this.base_url_)
      
  var chunks = text.split(' ');
  
  if (text == "") {
    // No arguments. We require at least one
    this.valid_ = false;
    if (this.base_url_) {
      chrome.omnibox.setDefaultSuggestion({
        description: '<dim>Enter this.tags_ and this.note_ for page: <url>' + this.base_url_ + '</url></dim>'
      });
    } else {
      chrome.omnibox.setDefaultSuggestion({
        description: '<dim>Enter this.tags_ and this.note_ for page</dim>'
      });
    }
  } else if (text != "" && chunks.length == 1) {
    // No this.note_, only a tag.
    this.tags_ = chunks[0];
    this.note_ = null;
    this.valid_ = true;
    chrome.omnibox.setDefaultSuggestion({
      description: 'Tag: <match>' + this.tags_ + '</match> ' +
      '<dim>for url <url>' + this.base_url_ + '</url></dim>'
    });
  } else {
    // tag and this.note_
    this.valid_ = true;
    this.tags_ = chunks[0];
    this.note_ = chunks.slice(1).join(' ');
    chrome.omnibox.setDefaultSuggestion({
      description: 'Tag: <match>' + this.tags_ + '</match>' +
      ' Note: <match>' + this.note_ + '</match> <dim>for url <url>' +
      this.base_url_ + '</url></dim>'
    });
  }
}

/**
 * Forces the pinmark record to a consistent state.
 */
Pinmark.prototype.resetState = function() {
  this.base_url_ = null;
  this.note_ = null;
  this.tags_ = null;
  this.title_ = null;
  this.valid_ = false;
}

/**
 * TODO(rjkroege): what does this do?
 */
Pinmark.prototype.resetDefaultSuggestion = function() {
  this.resetState();
  chrome.omnibox.setDefaultSuggestion({
      description: 'Add bookmark to pinboard'
  });
}

/**
 * For each entered character, update the default displayed action.
 */
chrome.omnibox.onInputChanged.addListener( /* insert bind call here */ );


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

