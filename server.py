#!/usr/bin/env python

import BaseHTTPServer
import CGIHTTPServer
import cgitb; cgitb.enable()  ## This line enables CGI error reporting

server = BaseHTTPServer.HTTPServer
handler = CGIHTTPServer.CGIHTTPRequestHandler
#handler.cgi_directories = ["."]
server_address = ("", 59630)

httpd = server(server_address, handler)
httpd.serve_forever()

