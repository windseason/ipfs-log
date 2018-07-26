/* global process */
const os = require('os')

//TODO: parse args for benchmark names and parameters

const benchmarks = require('./benchmarks')

const runOne = async (benchmark) => {
  console.log(`Running ${benchmark.name}`)
  let stats = {
    count: 0,
    seconds: 0
  }

  let memory = {
    before: process.memoryUsage()
  }

  const execute = async (log) => {
    const interval = setInterval(() => {
      stats.seconds++
    }, 1000)

    while (benchmark.while(stats)) {
      await benchmark.cycle(log)
      stats.count++
    }

    clearInterval(interval)
    memory.after = process.memoryUsage()
  }

  const log = await benchmark.prepare()
  await execute(log)
  await benchmark.teardown()

  stats.avg = Math.round(stats.count / stats.seconds)
  return {
    name: benchmark.name,
    cpus: os.cpus(),
    loadavg: os.loadavg(),
    stats,
    memory
  }
}

const start = async () => {
  let results = []

  try {
    for (const benchmark of benchmarks) {
      const result = await runOne(benchmark)
      results.push(result)
    }
    console.log(results)
  } catch (e) {
    console.log(e)
  }

  //TODO: compare/delta to cached version
}

start()
