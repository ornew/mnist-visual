#!/usr/bin/env python

import sys
import os
import cgi
import json
import numpy as np
import tensorflow as tf
import mnist

ckpt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__),'app','models'))

def error(m):
  print json.dumps({
    'error': m
  })

def evalute(payload=None):
  print "Content-type: application/json"
  print # Follow body
  if payload == None:
    error('Payload was not found.')
    return
  image = payload.get('data', None)
  step = payload.get('step', 1000)

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
    ckpt = os.path.join(ckpt_dir, 'ckpt-%d' % step)
    if os.path.isfile(ckpt):
      saver.restore(session, ckpt)
    else:
      error('Checkpoint file for %d step is not found.' % step)
      return
    results = session.run(inference, feed_dict={x:[image], keep_prob: 1.0})[0]
    result = np.argmax(results)
    print json.dumps({
        'inference': result,
        'results': results.tolist()
      })

