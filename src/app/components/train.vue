<template lang="pug">
  section(v-if="session")
    div.buttons
      button(raised @click="start", :disabled="ui.buttons.start") 訓練を開始する
      button(raised @click="cancel", :disabled="ui.buttons.cancel") 訓練を中断する
    div(v-if="status") {{ status }}

    template(v-if="test.logs.length > 0")
      h3 テスト結果 （{{ test.logs[test.logs.length - 1].step }}ステップ目）
      div 100-300ステップは10ステップごとに、300-1000ステップは100ステップごとに、それ以降は200ステップごとにテスト結果を表示します。
      .accuracy
        span 正答率
        span.per {{ test.logs[test.logs.length - 1].accuracy }}%

      .samples
        template(v-for="(testSample, i) in testSamples")
          div(:class="test.labels[i + sample.start] == testSample ? 'true' : 'false'")
            img(:src="'/img/test/' + (i + sample.start) + '.png'")
            span {{ testSample }}
      div テスト結果 {{sample.start}} - {{sample.start + sample.size}} 件目を表示中
      .buttons
        button(colored @click="prev") 前
        span |
        button(colored @click="next") 次
      h3 テストを行う
      p
        | 実際に下の枠に囲まれた部分に数字を書いて試してみましょう。セレクトボックスから学習ステップを選択してください。
      recognize(:session="session")
</template>

<script>
  import Recognize from 'components/recognize'
  export default {
    props: {
      session: {
        required: true,
      },
    },
    data: () => ({
      ui: {
        buttons: {
          start: true,
          cancel: true,
        },
      },
      sample: {
        start: 0,
        size: 200,
      },
      test: {
        labels:[],
        logs: [],
      },
    }),
    watch: {
      session(){
        this.session
          .addEventListener('message', this.onMessage.bind(this))
          .addEventListener('close', this.onClose.bind(this))
      }
    },
    methods: {
      prev(){
        this.sample.start -= this.sample.size
        if(this.sample.start < 0){
          this.sample.start = 0
        }
      },
      next(){
        this.sample.start += this.sample.size
        if(this.sample.start + this.sample.size >= this.test.labels.length){
          this.sample.start = this.test.labels.length - this.sample.size
        }
      },
      start() {
        this.ui.buttons.start  = true;
        this.ui.buttons.cancel = false;
        this.session.send('start', null);
        this.status = '訓練を実行しています・・・';
      },
      cancel() {
        this.ui.buttons.cancel = true;
        this.session.send('cancel', null);
        this.status = '訓練を中断しています・・・';
      },
      onMessage(event){
        let json = JSON.parse(event.data);
        switch(json.event){
          case 'open':
            this.ui.buttons.start = false
            break
          case 'start':
            this.test.labels = json.data.test_labels;
            break
          case 'cancel':
            //this.data.ui.buttons.start = false;
            this.status = '訓練が中断されました。（やり直す場合はページをリロードしてください）'
            break
          case 'test':
            this.test.logs.push({
              step: json.data.step,
              accuracy: Math.floor(json.data.accuracy * 10000) / 100,
              inference: json.data.inference,
            })
            break
        }
      },
      onClose(){
        this.ui.buttons.start = true;
        this.ui.buttons.cancel = true;
        this.status = '通信が切断されました。';
      },
    },
    computed: {
      testSamples(){
        return this.test.logs[this.test.logs.length - 1].inference.slice(
          this.sample.start,
          this.sample.start + this.sample.size);
      },
    },
    components: {
      Recognize,
    },
  }
</script>
