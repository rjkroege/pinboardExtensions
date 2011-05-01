Overview
====

A small Chrome extension for making it possible to create bookmarks from
the omnibar.

To use: type `+pin` *tags note* where *tags* is a `+` connected sequence of tags
for the new bookmark and *note* is an arbitrary string of text that goes in
the description field.

How it works
===
An options page permits setting your pinboard authentication data. This is stored
unencrypted (including the password) in local storage so you ought not to be
using the same password for [pinboard.in](http://pinboard.in) as you do for something
important.

A background page implements an omnibox extension. It parses what's typed and
extracts the tags and the note. When you press enter, the code builds a pinboard.in
API URL and makes an XHR to save the bookmark. Error handling is sparse but it
worked reliably in my testing.

Next Steps
====
Sync the pinboard bookmarks with the chrome bookmarks in some fashion.
