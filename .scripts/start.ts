import pm2 from 'pm2'
import fs from 'fs'
import internalIp from 'internal-ip'
import devKong from 'dev-kong'
import arg from 'arg'

const pm2Connect = () =>
  new Promise((resolve, reject) => {
    pm2.connect(err => {
      if (err) {
        return reject(err)
      }

      resolve(undefined)
    })
  })

const pm2Start = (options: pm2.StartOptions) =>
  new Promise((resolve, reject) => {
    pm2.start(options, err => {
      if (err) {
        return reject(err)
      }

      resolve(undefined)
    })
  })

function listApps(): any[] {
  const files = fs.readdirSync('./packages/app/')

  const apps: any[] = []

  files.forEach(file => {
    if (fs.statSync('./packages/app/' + file).isDirectory()) {
      const content = JSON.parse(fs.readFileSync(`./packages/app/${file}/package.json`).toString())
      apps.push(content)
    }
  })

  return apps
}

const apps = listApps()

const includes = (str: string, arr: string[]) => arr.some(item => item === str)

const packageNameToAPIName = (name: string) => name.split('/')[1] || name

const startApp = (dev: string[]) => async (app: any): Promise<void> =>
  pm2Connect()
    .then(() => {
      const appName = packageNameToAPIName(app.name)
      const devMode = includes(appName, dev)
      return pm2Start({
        script: '.yarn/releases/yarn-1.18.0.cjs',
        name: appName,
        args: ['workspace', app.name, devMode ? 'dev' : 'start']
      }).then(() => {
        console.log(`[${devMode ? 'dev' : 'ssg'}] - ${app.name}`)
      })
    })
    .then(() => {
      pm2.disconnect()
    })
    .catch(err => {
      console.log(err)
    })

const delay = (t: number) =>
  new Promise(resolve => {
    setTimeout(resolve, t)
  })

const wireApp = (apis: any[], dev: string[]) => async (app: any): Promise<void> => {
  const apiName = packageNameToAPIName(app.name)
  if (apis.find(api => api.name === apiName)) {
    await devKong.dropApi(apiName, { silent: true })
  }

  const api = await devKong.addKongApi(
    apiName,
    'localhost',
    `http://${internalIp.v4.sync()}:${app.config.port}`,
    app.config.path,
    { stripuri: !includes(apiName, dev), silent: true }
  )

  console.log(`[kon] - ${app.config.path.padEnd(25, ' ')} - ${api.name}`)

  return undefined
}

const args = arg({
  '--dev': String
})

const startAllApps = async (apps: any[], dev: string[]) => {
  for (const app of apps) {
    await startApp(dev)(app)
  }
}

devKong
  .checkStatus({ silent: true })
  .then(stat => {
    if (!stat) {
      return devKong.startKongServer({ port: 3000, silent: true }).then(() => delay(6000))
    }
  })
  .then(() => startAllApps(apps, args['--dev']?.split(',') ?? []))
  .then(() => devKong.listApis({ silent: true }))
  .then(apis => apis && Promise.all(apps.map(wireApp(apis, args['--dev']?.split(',') ?? []))))
  .catch(err => {
    console.log(err)
  })
