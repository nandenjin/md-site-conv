#! /usr/bin/env node

import * as path from 'path'
import { promises as fsp } from 'fs'

import parseArgs from 'minimist'
import consola from 'consola'
import MarkdownIt from 'markdown-it'
import markdownItMeta from 'markdown-it-meta'
import rimraf from 'rimraf'
import chokidar from 'chokidar'

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

export interface Page {
  _content: string
  meta: { [key: string]: string }
}

/**
 * Convert files under directory. Markdown files (`.md`) will be converted to json (`.json`), and the others will just be copied to same position in the dist directory.
 * @param entryDir Path to entry directory
 * @param outDir Path to dist directory
 * @param options Options for converter (optional)
 * @param rootDir Path as content root (optional / for internal usage)
 */
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
  try {
    await fsp.mkdir(outDir)
  } catch (e) {
    try {
      if (!(await fsp.stat(outDir)).isDirectory()) {
        throw e
      }
    } catch (_) {
      throw e
    }
  }

  for (let i = 0; i < entries.length; i++) {
    const ent = entries[i]
    const name = ent.name
    const ext = path.extname(name)
    const routeName = name.replace(/\.[^/.]+$/, '')
    const entPath = path.join(entryDir, name)

    // Ignore dot files
    if (name.match(/^\./)) continue

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
      const distPath = path.join(outDir, name)
      tasks.push(fsp.copyFile(entPath, distPath))
    }
  }

  await Promise.all(tasks)

  const indexPath = path.join(outDir, '_index.json')
  fsp.writeFile(indexPath, JSON.stringify(routes))
}

/**
 * Convert markdown file to JSON object with `Page` scheme.
 * @param entryPath Path to `.md` file to be converted.
 */
export const convertFile = async (entryPath: string): Promise<Page> => {
  const source = await fsp.readFile(entryPath, { encoding: 'utf8' })
  const rendered = md.render(source)
  const meta = (<any>md).meta as { [key: string]: string }
  const result: Page = {
    _content: rendered,
    meta
  }

  return result
}

/**
 * Watch files under `entryDir` and re-converted content in dist directory for every time the files are updated. (The real-time version of `convertDir()`.)
 * @param entryDir Path to entry directory
 * @param outDir Path to dist directory
 * @param options Options for converter (optional, will be passed to `convertDir` internally)
 */
export const watchDir = (
  entryDir: string,
  outDir: string,
  options: ConvertOptions
) => {
  return chokidar.watch(entryDir).on('all', (event, at) => {
    const isDirectory = ['addDir', 'unlinkDir'].includes(event)

    // Directory contains the file or directory path itself
    const src = isDirectory ? at : path.dirname(at)
    const target = path.join(outDir, path.relative(entryDir, src))
    convertDir(src, target, options, entryDir).catch(e => consola.error(e))
  })
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
      await fsp.stat(outDir)

      consola.info('outDir is already existing. Cleaning...')
      await new Promise((resolve, reject) =>
        rimraf(outDir, error => (!error ? resolve() : reject(error)))
      )
    } catch (_) {
      // Do nothing
    }

    // Watch Mode
    if (watch) {
      consola.info('Start watching...')
      watchDir(entryDir, outDir, options)
    }

    // Normal Mode
    else {
      consola.info('Processing files...')
      convertDir(entryDir, outDir, options)
      consola.success('Done!')
    }
  })().catch(e => {
    consola.fatal(e)
  })
}
