import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import yaml from 'yaml'
import { execSync } from 'child_process'
import { Page, Route } from '../src'

describe('Artifact check with --index', () => {
  const distDir = path.resolve(
    os.tmpdir(),
    'md-site-conv-test_' + Math.floor(Math.random() * 10000000)
  )
  execSync(
    [
      'node',
      path.resolve(__dirname, '../lib/index.js'),
      path.resolve(__dirname, 'data'),
      '-o',
      distDir,
      '--index',
    ].join(' ')
  )
  it('outputs correct files', () => {
    expect(fs.readdirSync(distDir).sort()).toEqual(
      ['index.json', '_index.json', 'structed.json', 'nested'].sort()
    )
    expect(fs.readdirSync(path.resolve(distDir, 'nested')).sort()).toEqual(
      ['sample.json', '_index.json', 'dummy-asset.txt'].sort()
    )
  })
  it('outputs correct data for index of /', () => {
    expect(
      JSON.parse(
        fs.readFileSync(path.resolve(distDir, '_index.json'), {
          encoding: 'utf-8',
        })
      )
    ).toMatchObject<Route[]>([
      {
        type: 'directory',
        path: '/nested',
        name: 'nested',
        ref: 'nested/_index.json',
      },
      {
        type: 'page',
        path: '/',
        name: 'index',
        ref: 'index.json',
        meta: { title: 'Hello World', author: 'Kazumi Inada' },
      },
    ])
  })
  it('outputs correct data for /index.md', () => {
    expect(
      JSON.parse(
        fs.readFileSync(path.resolve(distDir, 'index.json'), {
          encoding: 'utf-8',
        })
      )
    ).toMatchObject<Page>({
      html: '<h1>Hello World</h1>\n<p>A sample page as root index.</p>\n',
      meta: { title: 'Hello World', author: 'Kazumi Inada' },
      path: '/',
    })
  })
  it('outputs correct data for /structed.yaml', () => {
    expect(
      JSON.parse(
        fs.readFileSync(path.resolve(distDir, 'structed.json'), {
          encoding: 'utf-8',
        })
      )
    ).toMatchObject<Page>({
      path: '/structed',
      structed: yaml.parse(
        fs.readFileSync(path.resolve(__dirname, 'data/structed.yaml'), {
          encoding: 'utf-8',
        })
      ),
    })
  })
  it('outputs correct data for index of /nested/', () => {
    expect(
      JSON.parse(
        fs.readFileSync(path.resolve(distDir, 'nested/_index.json'), {
          encoding: 'utf-8',
        })
      )
    ).toMatchObject<Route[]>([
      {
        type: 'page',
        path: '/nested/sample',
        name: 'sample',
        ref: 'sample.json',
        meta: {},
      },
    ])
  })
  it('outputs correct data for /nested/sample.md', () => {
    expect(
      JSON.parse(
        fs.readFileSync(path.resolve(distDir, 'nested/sample.json'), {
          encoding: 'utf-8',
        })
      )
    ).toMatchObject<Page>({
      html: '<h1>Nested Sample</h1>\n<p>A sample page in nested route.</p>\n',
      meta: {},
      path: '/nested/sample',
    })
  })
  it('outputs correct data for nested/dummy-asset.txt', () => {
    expect(
      fs.readFileSync(path.resolve(distDir, 'nested/dummy-asset.txt'), {
        encoding: 'utf-8',
      })
    ).toEqual<string>(
      fs.readFileSync(path.resolve(__dirname, 'data/nested/dummy-asset.txt'), {
        encoding: 'utf-8',
      })
    )
  })
})

describe('Artifact check without --index', () => {
  const distDir = path.resolve(
    os.tmpdir(),
    'md-site-conv-test_' + Math.floor(Math.random() * 10000000)
  )
  execSync(
    [
      'node',
      path.resolve(__dirname, '../lib/index.js'),
      path.resolve(__dirname, 'data'),
      '-o',
      distDir,
    ].join(' ')
  )
  it('outputs correct files', () => {
    expect(fs.readdirSync(distDir).sort()).toEqual(
      ['index.json', 'structed.json', 'nested'].sort()
    )
    expect(fs.readdirSync(path.resolve(distDir, 'nested')).sort()).toEqual(
      ['sample.json', 'dummy-asset.txt'].sort()
    )
  })
})
