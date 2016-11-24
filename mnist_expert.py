import time
import sys
from tensorflow.examples.tutorials.mnist import input_data
import tensorflow as tf
import numpy as np
import mnist

# MNIST data
mnist_data = input_data.read_data_sets('MNIST_data', one_hot=True)

# Log verbose
verbose = False

with tf.Graph().as_default():
  # Placeholders
  x = tf.placeholder(tf.float32, shape=[None, 784])
  y = tf.placeholder(tf.float32, shape=[None, 10])
  keep_prob = tf.placeholder(tf.float32)

  inference = mnist.inference(x, keep_prob)
  train = mnist.train(inference, y)
  accuracy = mnist.accuracy(inference, y)

  saver = tf.train.Saver(max_to_keep=200)

  # Create Session
  sess = tf.Session()
  sess.run(tf.initialize_all_variables())

  # Training and Evaluting
  start = time.time()
  for step in range(20000):
    batch = mnist_data.train.next_batch(50)
    if verbose:
      result = sess.run(inference, feed_dict={
        x:batch[0], y: batch[1], keep_prob: 1.0})
      for i in range(50):
        t = np.argmax(batch[1][i])
        i = np.argmax(result[i])
        if t == i:
          sys.stdout.write("\033[94mx\033[0m")
        else:
          sys.stdout.write("\033[91mx\033[0m")
    if step % 100 == 0:
      train_accuracy = sess.run(accuracy, feed_dict={
        x:batch[0], y: batch[1], keep_prob: 1.0})
      sys.stdout.write(" ===> Step %5d, Accuracy %1.02f" % (step, train_accuracy))
      if step % 1000 == 0:
        ckpt = saver.save(sess, 'www/models/ckpt', global_step=step)
        sys.stdout.write(" @%s" % ckpt)
      print ''
    elif verbose:
      print ''
    sess.run(train, feed_dict={x: batch[0], y: batch[1], keep_prob: 0.5})
  elapsed_time = time.time() - start

  print("Total time: {0}".format(elapsed_time)) + " [sec]"

  # Test
  print("Test Accuracy: %g" % sess.run(accuracy, feed_dict={
    x: mnist_data.test.images, y: mnist_data.test.labels, keep_prob: 1.0}))

