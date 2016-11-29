# MNIST Visualize Exsample for TensorFlow

It is an exsample to interactively test MNIST with a browser.

## How to Build

After `clone`, build the web application.  You need to have `npm` installed.

```
$ clone git https://github.com/ornew/mnist-visual.git
$ cd mnist-visual
$ npm i
$ npm run gulp build
```

Next, execute `train.py` to create a model and a checkpoint every 1000 steps. Hang tight, this may take a while...

When you are done, start the server: `python build/server.py -p <port>`. Open `localhost:<port>` in the browser.

```
$ python build/train.py
$ python build/server.py -p <port>
```
---

Copyright 2016 Arata Furukawa \<old.river.new@gmail.com\>

