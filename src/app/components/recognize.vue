<template lang="pug">
  section(v-if="session")
    template(v-if="!!checkpoints")
      select(v-model="selected")
        template(v-for="ckpt in checkpoints")
          option(:value="ckpt") Step: {{ ckpt }}
      div(v-if="!selected") ステップを選択してください
      mnist-canvas(@recognize="recognize")
      .inference
        div 予測
        .value {{recognized.inference}}
      recognize-result(:data="recognized.results")
</template>

<style lang="stylus" scoped>
  select
    margin 0 auto
    width 10em
    display block
  .inference
    margin 1em 0
    text-align center
    .value
      font-size 3em
</style>

<script>
  import MnistCanvas from 'components/mnist-canvas.vue'
  import RecognizeResult from 'components/recognize-result'
  export default {
    props: {
      session: {
        required: true,
      },
    },
    data: () => ({
      checkpoints: [],
      selected: null,
      recognized: {
        inference: '-',
        results: [],
      },
    }),
    mounted(){
      this.session
        .addEventListener('message', this.onMessage.bind(this))
    },
    methods: {
      recognize(pixels){
        if(!this.selected){
          return
        }
        this.session.send('recognize', {
          image: pixels,
          step: this.selected,
        })
      },
      onMessage(event){
        let json = JSON.parse(event.data);
        switch(json.event){
          case 'checkpoint':
            this.checkpoints.push(json.data.step)
            break
          case 'recognized':
            this.recognized.inference = json.data.inference
            this.recognized.results = json.data.results
            break
        }
      },
    },
    components: {
      'mnist-canvas': MnistCanvas,
      'recognize-result': RecognizeResult,
    },
  }
</script>
