/* global process */
const os = require('os')
const args = require('yargs').argv

const BASELINE_GREP = /[\d\w-]*-baseline/
const DEFAULT_GREP = /.*/
const grep = args.grep ? new RegExp(args.grep) : DEFAULT_GREP

const benchmarks = require('./benchmarks')

const runOne = async (benchmark) => {
  let stats = {
    count: 0
  }

  let memory = {
    before: process.memoryUsage()
  }

  process.stdout.write(`\r${benchmark.name} / Preparing`)
  const log = await benchmark.prepare()

  process.stdout.clearLine()
  const startTime = process.hrtime()
  while (benchmark.while(stats, startTime)) {
    process.stdout.write(`\r${benchmark.name} / Cycles: ${stats.count}`)
    await benchmark.cycle(log)
    stats.count++
  }

  elapsed = process.hrtime(startTime)
  memory.after = process.memoryUsage()

  process.stdout.write(`\r${benchmark.name} / Finishing`)
  await benchmark.teardown()
  process.stdout.clearLine()

  stats.avg = Math.round(stats.count / elapsed[0])
  return {
    name: benchmark.name,
    cpus: os.cpus(),
    loadavg: os.loadavg(),
    elapsed,
    stats,
    memory
  }
}

const start = async () => {
  let results = []

  const baselineOnly = args.b || args.baseline

  process.stdout.write(`Running ${baselineOnly ? 'baseline ' : ''}benchmarks matching: ${grep}`)
  process.stdout.write('\n')

  try {
    for (const benchmark of benchmarks) {
      if (baselineOnly && !BASELINE_GREP.test(benchmark.name)) {
        continue
      }

      if (!grep.test(benchmark.name)) {
        continue
      }
      const result = await runOne(benchmark)
      results.push(result)
    }

    process.stdout.write(`\rCompleted ${results.length} benchmark${results.length > 1 ? 's' : ''}`)
  } catch (e) {
    console.log(e)
  }

  //TODO: compare/delta to cached version
}

start()
