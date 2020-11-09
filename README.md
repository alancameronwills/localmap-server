# localmap-server
Azure Functions server for localmap

## Quick clues about Azure Functions

This Azure Functions code is automatically synced with the server. Access to the portal configuration is through portal.azure.com

Each function has a directory containing its code in index.js; and context, trigger, input & output bindings set by function.json.

The URL of each function is https://deep-map.azurewebsites.net/api/{function name}

proxies.json maps incoming URLs to server code. In particular:

* .../any_file maps to the client code store, which is in the blob store https://deepmap.blob.core.windows.net/deepmap/{file}
* The root URL / maps to ...blob...index.html
* /api/file maps to these server functions

## Main server functions

**places** retrieves the complete set of places for a project. 
* project - id recommended
* after - (long) timestamp - just returns updates since
**map** get map code from chosen map service
* sort - google or bing
**uploadPlace** - what it says

Media are uploaded straight to blob store by the client code.
