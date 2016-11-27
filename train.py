import sys
import os
import argparse
import time
import json
import numpy as np
import tensorflow as tf
from tensorflow.examples.tutorials.mnist import input_data
import mnist

# MNIST data
mnist_data = input_data.read_data_sets('MNIST_data', one_hot=True)

# Log verbose
verbose = False

abscd = os.path.abspath(os.path.dirname(__file__))

FLAGS = None

def train():
  with tf.Graph().as_default():
    # test results
    tests = np.zeros((20, 10, 10));

    # Placeholders
    x = tf.placeholder(tf.float32, shape=[None, 784])
    y = tf.placeholder(tf.float32, shape=[None, 10])
    keep_prob = tf.placeholder(tf.float32)

    inference = mnist.inference(x, keep_prob)
    train = mnist.train(inference, y)
    accuracy = mnist.accuracy(inference, y)

    saver = tf.train.Saver(max_to_keep=200)

    print('Checkpoints directory: %s' % FLAGS.ckpt_dir)
    if tf.gfile.Exists(FLAGS.ckpt_dir):
      print('Cleaning checkpoints...')
      tf.gfile.DeleteRecursively(FLAGS.ckpt_dir)
    tf.gfile.MakeDirs(FLAGS.ckpt_dir)

    # Create Session
    sess = tf.Session()
    sess.run(tf.initialize_all_variables())

    # Training and Evaluting
    print('Start training.')
    start = time.time()
    for step in range(1,20000+1):
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
          ckpt = saver.save(sess, os.path.join(FLAGS.ckpt_dir, 'ckpt'), global_step=step)
          sys.stdout.write(" @%s" % ckpt)
          test = sess.run(inference, feed_dict={
            x: mnist_data.test.images, y: mnist_data.test.labels, keep_prob: 1.0})
          for i in xrange(len(test)):
            t = np.argmax(test[i])
            l = np.argmax(mnist_data.test.labels[i])
            if t != l:
              tests[step // 1000 - 1][l][t] += 1;
        print ''
      elif verbose:
        print ''
      sess.run(train, feed_dict={x: batch[0], y: batch[1], keep_prob: 0.5})
    elapsed_time = time.time() - start
    print('Total time: {0} [sec]'.format(elapsed_time))
    print('Save test_results.json ...')
    f = open(os.path.join(abscd, 'root', 'test_results.json'), 'w')
    json.dump(tests, f);
    print('Done!')

if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument(
      '--ckpt_dir',
      type=str,
      default=os.path.join(abscd, 'root', 'models'),
      help='Checkpoints saved directory.'
  )
  FLAGS, unparsed = parser.parse_known_args()
  train()

