<template lang="pug">
  canvas
</template>

<script>
  import Chart from 'chart.js'
  export default {
    props: {
      data: {
        required: true,
      },
    },
    data: () => ({
      chart: null,
    }),
    watch: {
      data(){
        this.chart.data.datasets[0].data = this.data
        this.chart.update()
      },
    },
    mounted(){
      this.chart = new Chart(this.$el, {
        type: 'bar',
        data: {
          labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
          datasets: [{
            label: 'Predicted distribution',
            data: this.data,
          }]
        },
        options: {
          scales: {
            yAxes: [{
              ticks: {
                max: 15,
                min: -15,
                stepSize: 5
              }
            }]
          }
        }
      })
    },
  }
</script>
