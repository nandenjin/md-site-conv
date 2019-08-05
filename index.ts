#! /usr/bin/env node

import * as path from 'path'
import * as fs from 'fs'
const fsp = fs.promises

import parseArgs from 'minimist'
import consola from 'consola'
import MarkdownIt from 'markdown-it'
import markdownItMeta from 'markdown-it-meta'

const md = new MarkdownIt()
md.use(markdownItMeta)

export const convertDir = async (
  entryDir: string,
  outDir: string,
  rootDir: string = entryDir
): Promise<void> => {
  const tasks: Promise<any>[] = []
  const entries = await fsp.readdir(entryDir, { withFileTypes: true })

  // Create directory
  await fsp.mkdir(outDir)

  for (let i = 0; i < entries.length; i++) {
    const ent = entries[i]
    const name = ent.name
    const routeName = name.replace(/\.[^/.]+$/, '')
    const entPath = path.join(entryDir, name)
    const route = '/' + path.relative(rootDir, entPath).replace(/\.[^/.]+$/, '')

    // Recursively read if the entry is a directory
    if (ent.isDirectory())
      tasks.push(convertDir(entPath, path.join(outDir, name, rootDir)))
    // Convert if the entry is a markdown data
    else if (name.match(/\.md$/)) {
      consola.log(route)

      // Output path
      const distPath = path.join(outDir, routeName) + '.json'

      // Write to file
      tasks.push(
        convertFile(entPath).then(result =>
          fsp.writeFile(distPath, JSON.stringify({ ...result, route }), {
            encoding: 'utf-8'
          })
        )
      )
    }
  }

  await Promise.all(tasks)
}

export const convertFile = async (entryPath: string): Promise<object> => {
  const source = await fsp.readFile(entryPath, { encoding: 'utf8' })
  const rendered = md.render(source)
  const meta = (<any>md).meta as object
  return {
    _content: rendered,
    meta
  }
}

if (!module.parent) {
  const createError = (message: string): Error => {
    consola.fatal(message)
    return new Error(message)
  }

  const args = parseArgs(process.argv.slice(2))

  if (!args._ || !args._[0] || args._[0].length < 1)
    throw createError('Path for entryDir is required')
  if (!args.o || args.o.length < 1)
    throw createError('Path for outDir is required (-o)')

  const entryDir = args._[0]
  const outDir = args.o

  consola.info('Processing...')
  convertDir(entryDir, outDir)
}
