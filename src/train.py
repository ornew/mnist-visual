import sys
import os
import uuid
from datetime import datetime as dt
import argparse
import time
import json
import numpy as np
import tensorflow as tf
from tensorflow.examples.tutorials.mnist import input_data
import mnist

pwd = os.path.abspath(os.path.dirname(__file__))

def train(FLAGS):
    mnist_data = input_data.read_data_sets(FLAGS.data_dir, one_hot=True)
    with tf.Graph().as_default():
        # test results
        tests = np.zeros((20, 10, 10), dtype=np.int64);

        # Placeholders
        x = tf.placeholder(tf.float32, shape=[None, 784])
        y = tf.placeholder(tf.float32, shape=[None, 10])
        keep_prob = tf.placeholder(tf.float32)

        inference = mnist.inference(x, keep_prob)
        train = mnist.train(inference, y)
        accuracy = mnist.accuracy(inference, y)
        merge = tf.summary.merge_all()

        saver = tf.train.Saver(
                write_version=1, # Avoid version bug
                max_to_keep=200)

        print('Checkpoints directory: %s' % FLAGS.ckpt_dir)
        if tf.gfile.Exists(FLAGS.ckpt_dir):
            print('Cleaning checkpoints...')
            tf.gfile.DeleteRecursively(FLAGS.ckpt_dir)
        tf.gfile.MakeDirs(FLAGS.ckpt_dir)

        # Create Session
        sess = tf.Session()
        sess.run(tf.global_variables_initializer())

        writer = tf.summary.FileWriter(
            os.path.join(FLAGS.log_dir, dt.now().strftime('%Y%m%d%H%M%S')) + '_' + uuid.uuid4().hex,
            sess.graph)

        # Training and Evaluting
        print('Start training.')
        start = time.time()
        for step in range(1,20000+1):
            batch = mnist_data.train.next_batch(50)
            if FLAGS.verbose:
                result = sess.run(inference, feed_dict={
                    x:batch[0], y: batch[1], keep_prob: 1.0})
                for i in range(50):
                    t = np.argmax(batch[1][i])
                    i = np.argmax(result[i])
                    if t == i:
                        sys.stdout.write("\033[94mx\033[0m")
                    else:
                        sys.stdout.write("\033[91mx\033[0m")
                sys.stdout.write("... ")
            if step % 100 == 0:
                train_accuracy = sess.run(accuracy, feed_dict={
                    x:mnist_data.test.images, y: mnist_data.test.labels, keep_prob: 1.0})
                sys.stdout.write("===> Step %5d, Test Accuracy: %1.02f" % (step, train_accuracy))
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
            elif FLAGS.verbose:
                print ''
            _, summary = sess.run([train, merge], feed_dict={x: batch[0], y: batch[1], keep_prob: 0.5})
            writer.add_summary(summary, global_step=step)
        elapsed_time = time.time() - start
        print('Total time: {0} [sec]'.format(elapsed_time))
        print('Save test_results.json ...')
        f = open(os.path.join(pwd, 'app', 'test_results.json'), 'w')
        json.dump(tests.tolist(), f);
        print('Done!')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--ckpt_dir',
        type=str,
        default=os.path.join(pwd, 'models'),
        help='Checkpoints saved directory.')
    parser.add_argument(
        '--log_dir',
        type=str,
        default=os.path.join(pwd, 'log'),
        help='The training log outputed directory.')
    parser.add_argument(
        '--data_dir',
        type=str,
        default=os.path.join(pwd, 'MNIST_data'),
        help='MNIST data directory.')
    verbose = parser.add_mutually_exclusive_group()
    verbose.add_argument('-v', '--verbose', dest='verbose', action='store_true', help='Log verbose')
    verbose.add_argument('--no_verbose', dest='verbose', action='store_false')
    parser.set_defaults(verbose=False)
    FLAGS, unparsed = parser.parse_known_args()
    train(FLAGS)

