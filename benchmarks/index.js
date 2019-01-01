/* global process */
const os = require('os')
const args = require('yargs').argv

const BASELINE_GREP = /[\d\w-]*-baseline/
const DEFAULT_GREP = /.*/
const grep = args.grep ? new RegExp(args.grep) : DEFAULT_GREP

const benchmarks = require('./benchmarks')
const report = require('./report')

const getElapsed = (time) => {
  return +time[0] * 1e9 + +time[1]
}

const runOne = async (benchmark) => {
  let stats = {
    count: 0
  }

  let memory = {
    before: process.memoryUsage()
  }

  process.stdout.write(`\r${benchmark.name} / Preparing`)
  const params = await benchmark.prepare()

  process.stdout.clearLine()
  const startTime = process.hrtime() // eventually convert to hrtime.bigint
  while (benchmark.while(stats, startTime)) {
    process.stdout.write(`\r${benchmark.name} / Cycles: ${stats.count}`)
    await benchmark.cycle(params)
    stats.count++
  }

  elapsed = getElapsed(process.hrtime(startTime))
  memory.after = process.memoryUsage()

  process.stdout.write(`\r${benchmark.name} / Finishing`)
  await benchmark.teardown(params)
  process.stdout.clearLine()

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
  const runnerStartTime = process.hrtime()

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

    const runnerElapsed = getElapsed(process.hrtime(runnerStartTime))
    let output = `\rCompleted ${results.length} benchmark${results.length > 1 ? 's' : ''}`
    output += ` in ${(runnerElapsed / 1000000000).toFixed(2)} seconds`
    process.stdout.write(output)

    if (args.r || args.report) {
      report(results)
    }
  } catch (e) {
    console.log(e)
  }

  //TODO: compare/delta to cached version
}

start()
