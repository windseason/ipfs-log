const releaseRepo = (repo) => {
  return new Promise((resolve, reject) => {
    repo.close((err) => {
      if (err) {
        return reject(err)
      }

      resolve()
    })
  })
}

module.exports = releaseRepo
