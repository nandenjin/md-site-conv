#! /usr/bin/env node

import * as path from 'path'
import { promises as fsp } from 'fs'

import parseArgs from 'minimist'
import consola from 'consola'
import MarkdownIt from 'markdown-it'
import markdownItMeta from 'markdown-it-meta'
import rimraf from 'rimraf'

const md = new MarkdownIt()
md.use(markdownItMeta)

export enum RouteType {
  // eslint-disable-next-line no-unused-vars
  DIRECTORY = 'directory',
  // eslint-disable-next-line no-unused-vars
  PAGE = 'page'
}

export interface Route {
  type: RouteType
  path: string
  name: string
  ref: string
  meta?: object
}

export interface ConvertOptions {
  exportIndex?: boolean
}

export const convertDir = async (
  entryDir: string,
  outDir: string,
  options: ConvertOptions = {},
  rootDir: string = entryDir
): Promise<void> => {
  const tasks: Promise<any>[] = []
  const entries = await fsp.readdir(entryDir, { withFileTypes: true })
  const routes: Route[] = []

  // Create directory
  await fsp.mkdir(outDir)

  for (let i = 0; i < entries.length; i++) {
    const ent = entries[i]
    const name = ent.name
    const ext = path.extname(name)
    const routeName = name.replace(/\.[^/.]+$/, '')
    const entPath = path.join(entryDir, name)

    // Route path
    // - remove "index" and extension
    const route =
      '/' + path.relative(rootDir, entPath).replace(/(index)?\.[^/.]+$/, '')

    // Recursively read if the entry is a directory
    if (ent.isDirectory()) {
      tasks.push(convertDir(entPath, path.join(outDir, name), options, rootDir))
      routes.push({
        type: RouteType.DIRECTORY,
        path: route,
        name: routeName,
        ref: path.join(routeName, '_index.json')
      })
    }

    // Convert if the entry is a markdown data
    else if (ext === '.md') {
      consola.log(route)

      // Output path
      const distPath = path.join(outDir, routeName) + '.json'

      // Write to file
      tasks.push(
        convertFile(entPath).then(result => {
          fsp.writeFile(distPath, JSON.stringify({ ...result, path: route }), {
            encoding: 'utf-8'
          })
          routes.push({
            type: RouteType.PAGE,
            path: route,
            name: routeName,
            ref: routeName + '.json',
            meta: result.meta
          })
        })
      )
    }

    // Just copy other files
    else {
      consola.log(route + ext)
      const distPath = path.join(outDir, routeName) + ext
      tasks.push(fsp.copyFile(entPath, distPath))
    }
  }

  await Promise.all(tasks)

  const indexPath = path.join(outDir, '_index.json')
  fsp.writeFile(indexPath, JSON.stringify(routes))
}

export const convertFile = async (entryPath: string): Promise<any> => {
  const source = await fsp.readFile(entryPath, { encoding: 'utf8' })
  const rendered = md.render(source)
  const meta = (<any>md).meta as object
  return {
    _content: rendered,
    meta
  }
}

// Entry point
if (!module.parent) {
  ;(async () => {
    // Parse CLI args
    const args = parseArgs(process.argv.slice(2))

    if (!args._ || !args._[0] || args._[0].length < 1)
      throw new Error('Path for entryDir is required')
    if (!args.o || args.o.length < 1)
      throw new Error('Path for outDir is required (-o)')

    const entryDir = args._[0]
    const outDir = args.o
    const index = !!args.index
    const watch = !!args.watch

    const options: ConvertOptions = {
      exportIndex: index
    }

    try {
      fsp.stat(outDir)

      consola.info('outDir is already existing. Cleaning...')
      await new Promise((resolve, reject) =>
        rimraf(outDir, error => (!error ? resolve() : reject(error)))
      )
    } catch (_) {
      // Do nothing
    }

    consola.info('Processing files...')
    convertDir(entryDir, outDir, options)

    if (watch) {
      consola.success('First convert done!')
      consola.info('Start watching...')
    } else {
      consola.success('Done!')
    }
  })().catch(e => {
    consola.fatal(e)
  })
}
