import pm2 from 'pm2'
import devKong from 'dev-kong'

const pm2Connect = () =>
  new Promise((resolve, reject) => {
    pm2.connect(err => {
      if (err) {
        return reject(err)
      }

      return resolve(undefined)
    })
  })

const pm2List = () =>
  new Promise((resolve, reject) => {
    pm2.list((err, list) => {
      if (err) {
        return reject(err)
      }

      resolve(list)
    })
  })

const pm2StopAndDelete = (name: string) =>
  new Promise((resolve, reject) => {
    pm2.stop(name, err => {
      if (err) {
        return reject(err)
      }

      pm2.delete(name, err => {
        if (err) {
          return reject(err)
        }

        resolve(undefined)
      })
    })
  })

devKong
  .stopKongServer({ silent: true })
  .then(pm2Connect)
  .then(pm2List)
  .then((list: any[]) =>
    Promise.all(
      list.map(item => {
        console.log(`- ${item.name}`)
        return pm2StopAndDelete(item.name)
      })
    )
  )
  .then(() => {
    pm2.disconnect()
    console.log('All stopped')
  })
