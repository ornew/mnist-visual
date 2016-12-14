#!/usr/bin/env python

import sys
import os
import numpy as np
import tensorflow as tf
import mnist

ckpt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models'))

def error(m):
  return {
    'error': m
  }

def evalute(payload=None):
  if payload == None:
    return error('Payload was not found.')

  image = payload.get('data', None)
  step = payload.get('step', 1000)

  if image == None:
    return error("The 'data' parameter is require.")

  with tf.Graph().as_default():
    x = tf.placeholder(tf.float32, shape=[None, 784])
    keep_prob = tf.placeholder(tf.float32)
    inference = mnist.inference(x, keep_prob)
    saver = tf.train.Saver()
    session = tf.Session()
    session.run(tf.global_variables_initializer())
    ckpt = os.path.join(ckpt_dir, 'ckpt-%d' % step)
    if os.path.isfile(ckpt):
      saver.restore(session, ckpt)
    else:
      return error('Checkpoint file for %d step is not found.' % step)
    results = session.run(inference, feed_dict={x:[image], keep_prob: 1.0})[0]
    result = np.argmax(results)
    return {
      'inference': result,
      'results': results.tolist()
    }

