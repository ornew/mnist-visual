#!/usr/bin/env python

import os
import argparse
import BaseHTTPServer
import CGIHTTPServer
import cgitb; cgitb.enable()  ## This line enables CGI error reporting

FLAGS = None

def run_server():
  os.chdir(FLAGS.root_dir)
  server = BaseHTTPServer.HTTPServer
  handler = CGIHTTPServer.CGIHTTPRequestHandler
  server_address = ("", FLAGS.port)
  httpd = server(server_address, handler)
  httpd.serve_forever()

if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument(
      '-p',
      '--port',
      type=int,
      default=8000,
      help='Port number.')
  parser.add_argument(
      '--root_dir',
      type=str,
      default=os.path.join(os.getcwd(), 'www'),
      help='Server root directory.')
  FLAGS, unparsed = parser.parse_known_args()
  run_server()

