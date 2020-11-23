import replaceInFiles from 'replace-in-files'
import arg from 'arg'

const args = arg({
  '--from': String,
  '--to': String
})

if (args['--from'] && args['--to']) {
  replaceInFiles({
    files: ['.'],
    from: new RegExp(args['--from'], 'g'),
    to: args['--to']
  }).then(() => {
    console.log(`Changed all references of ${args['--from']} to ${args['--to']}`)
  })
} else {
  console.log('Usage: change-org --from @outsrc --to @yourcompany')
}
