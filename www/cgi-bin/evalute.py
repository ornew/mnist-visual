#!/usr/bin/env python

import sys
import os
import cgi
import json
import numpy as np
import tensorflow as tf
sys.path.append(os.path.abspath(os.path.abspath(os.path.dirname(__file__)) + '/../../'))
import mnist

def error(m):
  print json.dumps({
    'error': m
  })

print "Content-type: application/json"
print # Follow body


def do(payload):
  image = payload.get('data', None)
  step = payload.get('step', 1200)

  if image == None:
    error("The 'data' parameter is require.")
    return

  with tf.Graph().as_default():
    x = tf.placeholder(tf.float32, shape=[None, 784])
    keep_prob = tf.placeholder(tf.float32)
    inference = mnist.inference(x, keep_prob)
    saver = tf.train.Saver()
    session = tf.Session()
    session.run(tf.initialize_all_variables())
    ckpt = os.path.abspath('../www/models/ckpt-%d' % step)
    if os.path.isfile(ckpt):
      saver.restore(session, ckpt)
    else:
      error('Checkpoint file for %d step is not found.' % step)
      return
    results = session.run(inference, feed_dict={x:[image], keep_prob: 1.0})[0]
    result = np.argmax(results)
    results_plus = results + np.abs(results[np.argmin(results)])
    print json.dumps({
        'inference': result,
        'results': (results_plus * 100. / np.sum(results_plus)).tolist()
      })

if __name__ == "__main__":
  form = cgi.FieldStorage()
  payload = json.loads(form.getvalue('payload', 'null'))
  if payload == None:
    error('Payload was not found.')
  else:
    do(payload)
