#!/usr/bin/env python

from __future__ import print_function
from __future__ import unicode_literals
from __future__ import absolute_import
from future_builtins import *

import os
import sys
import uuid
import functools
import time
import datetime
import argparse
import urlparse
import threading
import json
from tornado import httpserver, web, websocket, ioloop
from tornado import gen
import numpy as np
import tensorflow as tf
from tensorflow.examples.tutorials.mnist import input_data
import mnist
from train import train

pwd = os.path.abspath(os.path.dirname(__file__))

class APIHandler(web.RequestHandler):
    def impl(self, path):
        paths = path.split('/')
        if(paths[0] == 'evalute.json'):
            payload = json.loads(self.get_body_argument('payload'))
            response = evalute(payload)
            self.set_status(200)
            self.set_header('content-type', 'application/json')
            self.write(json.dumps(response))
            self.finish()
        else:
            self.set_status(404)
    def get(self, path):
        self.impl(path)
    def post(self, path):
        self.impl(path)

from collections import deque
from tornado.concurrent import run_on_executor
from concurrent.futures import ThreadPoolExecutor
MAX_WORKERS = 2
clients = deque()
suspend_clients = deque()
data_dir = os.path.join(pwd, 'MNIST_data')
cache_dir = os.path.join(pwd, 'app', 'img', 'test')
print('Downloading MNIST datasets...')
mnist_data = input_data.read_data_sets(data_dir, one_hot=True)
def generate_test_image_files(test_data):
    from scipy import misc
    if not tf.gfile.Exists(cache_dir):
        tf.gfile.MakeDirs(cache_dir)
    print('Converting the MNIST test dataset into an image files... ', end='')
    for i in xrange(len(test_data)):
        misc.imsave(
            os.path.join(cache_dir, '%d.png' % i),
            (1. - test_data[i].reshape((28,28))).tolist())
    print('done.')
if not tf.gfile.Exists(os.path.join(cache_dir, '9999.png')):
    generate_test_image_files(mnist_data.test.images)

class HandleWrapper:
    def __init__(self, handler):
        self.handler = handler
    def fire(self, typ, data=None):
        self.handler.fire(typ, data)
    def listen(self, listener):
        self.handler.listen(listener)

class TrainStreamingHandler(websocket.WebSocketHandler):
    executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

    def fire(self, typ, data=None):
        self.write_message(json.dumps({
            'event': typ,
            'data': data,
            'id': self.uuid.hex}))
    def listen(self, listener):
        self.listener.append(listener)
    @run_on_executor
    @gen.coroutine
    def start(self):
        self.fire('start', {
            'test_labels': mnist_data.test.labels.argmax(axis=1).tolist()})
        ckpt_dir = os.path.join(pwd, 'var', self.uuid.hex)
        if tf.gfile.Exists(ckpt_dir):
            print('Already exist checkpoints...')
        tf.gfile.MakeDirs(ckpt_dir)
        args = argparse.Namespace()
        args.data_dir = data_dir
        args.ckpt_dir = ckpt_dir
        args.verbose = False
        train(args, mnist_data, handler=HandleWrapper(self))
        raise gen.Return()

    @run_on_executor
    @gen.coroutine
    def recognize(self, payload):
        def _impl(payload):
            def error(m):
                return {'error': m}
            ckpt_dir = os.path.join(pwd, 'var', self.uuid.hex)
            if payload == None:
                return error('Payload was not found.')

            image = payload.get('image', None)
            step = payload.get('step', None)

            if image == None:
                return error("The 'image' parameter is require.")
            if step == None:
                return error("The 'step' parameter is require.")

            with tf.Graph().as_default():
                x = tf.placeholder(tf.float32, shape=[None, 784])
                keep_prob = tf.placeholder(tf.float32)
                inference = mnist.inference(x, keep_prob)
                saver = tf.train.Saver()
                session = tf.Session()
                session.run(tf.global_variables_initializer())
                ckpt = os.path.join(ckpt_dir, 'ckpt-%d' % step)
                saver.restore(session, ckpt)
                #return error('Checkpoint file for %d step is not found.' % step)
                results = session.run(inference, feed_dict={x:[image], keep_prob: 1.0})[0]
                result = np.argmax(results)
                return {
                    'inference': result,
                    'results': results.tolist()
                }
        self.fire('recognized', _impl(payload))
        raise gen.Return()
    def open(self):
        if self not in clients or self not in suspend_clients:
            self.listener = deque()
            self.uuid = uuid.uuid4()
            if MAX_WORKERS > len(clients):
                clients.append(self)
                self.fire('open')
            else:
                suspend_clients.append(self)
                self.fire('suspend', {
                    'message': 'I am sorry, please wait for the order because '
                    'it exceeds the maximum number of sessions.'})
    def on_message(self, message):
        try:
            request = json.loads(message)
            event = request['event']
            if event == 'start':
                self.start()
            elif event == 'recognize':
                self.recognize(request['data'])
            else:
                if len(self.listener) > 0:
                    for listener in self.listener:
                        listener(request)
                else:
                    self.fire('error', {
                        'message': 'Unknown request type.'})
        except:
            self.fire('error', {
                'mesage': 'Invalid message.'})
    def on_close(self):
        if self in clients:
            clients.remove(self)
            if len(suspend_clients) > 0:
                new_client = suspend_clients.popleft()
                new_client.fire('open')
                clients.append(new_client)
        if self in suspend_clients:
            suspend_clients.remove(self)
        for listener in self.listener:
            listener('close')

def run_server(FLAGS):
    os.chdir(FLAGS.root_dir)
    try:
        application = web.Application([
            (r'/api/(.*)', APIHandler),
            (r'/streaming', TrainStreamingHandler),
            (r'/(.*)', web.StaticFileHandler, {"path": FLAGS.root_dir, "default_filename": "index.html"}),
        ])
        server = httpserver.HTTPServer(application)
        server.listen(FLAGS.port)
        print('Start server.')
        ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        ioloop.IOLoop.instance().stop()

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

