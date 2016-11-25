# MNIST Visualize Exsample for TensorFlow

It is an exsample to interactively test MNIST with a browser.

## How to Use

After `clone`, build the web application.  You need to have `npm` installed.

```
$ clone git https://github.com/ornew/mnist-visual.git
$ cd mnist-visual/www
$ npm i
$ npm run build
```

Next, execute `python train.py` to create a model. Hang tight, this may take a while...

`train.py` creates a checkpoint every 1000 steps.

```
$ cd ..
$ python train.py
```

When you are done, start the server: `python server.py -p <port>`. Open `localhost:<port>` in the browser.

---

Copyright 2016 Arata Furukawa \<old.river.new@gmail.com\>

