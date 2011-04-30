/*
  JavaScript for implementing the options dialog. Fetch/save the preserved
  value from wherever. Use localStorage for options.
*/

// What is the purpose of this method.
/**
 * Fetches the property values from localStorage and insert into the page.
 */
function getValues() {
  var allTheProps = document.querySelectorAll('input');
  Array.prototype.forEach.call(allTheProps, function (x) {
    window.console.info('loading: ' + x.id + '=' + localStorage[x.id]);
    x.value = localStorage[x.id];
  })
}

/**
 * Fetches the property values from local storage.
 */
function getSavedProps() {
  var props = {};
  var allTheProps = document.querySelectorAll('input');
  Array.prototype.forEach.call(allTheProps, function (x) {
    props[x.id] = localStorage[x.id];
  })
  return props;
} 


/**
 * On click, dig through the values, get the values of the
 * properties, save.
 */
 // TODO(rjkroege): consider encrypting the password value in some
 // fashion.
function saveProperties() {
  window.console.info('saveProperties called');
  var allTheProps = document.querySelectorAll('input');
  Array.prototype.forEach.call(allTheProps, function (x) {
    window.console.info('my id: ' + x.id + ' ' + x.value);
    localStorage[x.id] = x.value;
  })
  // add some kind of status here?
}

/**
 * Starts up the webapp.
 */
function main() {
  var x = document.querySelector('#saveButton');
  x.addEventListener("mouseup", saveProperties);
  getValues();

  // Only available in an extension.
  if (chrome && chrome.extension && chrome.extension.onRequest) {
    chrome.extension.onRequest.addListener(
          function(request, sender, sendResponse) {
      console.log(sender.tab ? "from a content script:" + sender.tab.url :
                  "from the extension");
      if (request.greeting == "hello")
        sendResponse(getSavedProps());
      else
        sendResponse({}); // snub them.
    });
  }
}


  