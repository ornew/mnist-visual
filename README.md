# MNIST Visualize Exsample for TensorFlow

It is an exsample to interactively test MNIST with a web browser.

## How to Use

Download and unzip the released zip file. Execute `train.py` to create a model
and a checkpoint every 1000 steps. Hang tight, this may take a while...

When you are done, start the server: `python build/server.py -p <port>`. Open
`localhost:<port>` in your web browser.

```
$ cd <unziped dir>
$ python server.py -p <port>
```

## How to Build

After `clone`, build the web application. You need to have `npm` installed.

```
$ clone git https://github.com/ornew/mnist-visual.git
$ cd mnist-visual
$ npm i
$ npm run gulp build
```

---

Copyright 2016 Arata Furukawa \<old.river.new@gmail.com\>

