#!/usr/bin/env python

import os
import sys
import argparse
import urlparse
import threading
import json
import SocketServer
import BaseHTTPServer
import SimpleHTTPServer
import cgitb; cgitb.enable()  ## This line enables CGI error reporting
from evalute import evalute

class Handler(SimpleHTTPServer.SimpleHTTPRequestHandler):
  def impl(self):
    is_api = False
    try:
      url = urlparse.urlparse(self.path)
      paths = os.path.normpath(url.path).split(os.path.sep)
      content_len = int(self.headers.getheader('content-length', 0))
      body = self.rfile.read(content_len)
      params = dict(urlparse.parse_qsl(url.query))
      params.update(dict(urlparse.parse_qsl(body)))
      if(paths[1] == 'api'):
        is_api = True
        if(len(paths) > 2):
          if(paths[2] == 'evalute.json'):
            payload = json.loads(params.get('payload', {}))
            response = evalute(payload)
            self.send_response(200)
            self.send_header('content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response))
          else:
            self.send_error(404)
        else:
          self.send_error(403)
      else:
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)
    except Exception as e:
      sys.stdout = sys.__stdout__
      if(is_api):
        self.send_response(500)
        self.send_header('content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
          'error': 'Something happened!'
        }))
      else:
        self.send_error(500)
      print "Exception: " + str(e)
  def do_GET(self):
    self.impl()
  def do_POST(self):
    self.impl()

class Server(SocketServer.ThreadingMixIn, BaseHTTPServer.HTTPServer):
  pass

def run_server(FLAGS):
  os.chdir(FLAGS.root_dir)
  address = ('', FLAGS.port)
  server  = Server(address, Handler)
  httpd   = threading.Thread(target=server.serve_forever)
  httpd.setDaemon(True)
  httpd.start()
  try:
    while True:
      pass
  except KeyboardInterrupt:
    return


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
      default=os.path.join(os.path.abspath(os.path.dirname(__file__)), 'app'),
      help='Server root directory.')
  FLAGS, unparsed = parser.parse_known_args()
  run_server(FLAGS)

