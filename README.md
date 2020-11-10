# @nandenjin/md-site-conv
![GitHub](https://img.shields.io/github/license/nandenjin/md-site-conv?style=flat-square)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/nandenjin/md-site-conv?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/nandenjin/md-site-conv/CI?style=flat-square)
[![Dependencies](https://img.shields.io/david/nandenjin/md-site-conv?style=flat-square)](https://david-dm.org/nandenjin/md-site-conv)
[![devDependencies](https://img.shields.io/david/dev/nandenjin/md-site-conv?style=flat-square)](https://david-dm.org/nandenjin/md-site-conv?type=dev)

Generate js-importable pagetree from Markdown files.

## Install

This package is now published on GitHub Package Registry. You can set registry for all `@nandenjin/` packages by adding this to `.npmrc`:
```
registry=https://npm.pkg.github.com/nandenjin
```

Then 

```shell
# Global install
$ npm install @nandenjin/md-site-conv -g
$ md-site-conv [ENTRY_DIR] -o [OUTPUT_DIR] --index

# Quick use
$ npx @nandenjin/md-site-conv [ENTRY_DIR] -o [OUTPUT_DIR] --index
```

## I/O

### Input
#### Filetree
```
- /
  - subfolder
    - ...
  - sample.md
  - data.yaml
```

#### /sample.md
```markdown
---
title: Sample Document
author: Kazumi Inada
---

# Sample Document

This is a sample document.
```

#### /data.yaml
```yaml
hello: world
description: "You can also use plain yaml for programmable use with >= v1.2.0"
```

### Output
#### Filetree
```
- /
  - subfolder
    - _index.json
  - _index.json
  - sample.json
```

#### /_index.json (prettified)
```json
[
  {
    "type":"directory",
    "path":"/subfolder",
    "name":"subfolder",
    "ref":"subfolder/_index.json"
  },{
    "type":"page",
    "path":"/sample",
    "name":"sample",
    "ref":"sample.json",
    "meta":{
      "title": "Sample Document",
      "author": "Kazumi Inada"
    }
  }
]
```

#### /sample.json (prettified)
```json
{
  "path": "/sample",
  "meta": {
    "title": "Sample Document",
    "author": "Kazumi Inada"
  },
  "html": "<h1>Sample Document</h1><p>This is a sample document.</p>"
}
```

#### data.json (prettified)
```json
{
  "path": "/data",
  "structed": {
    "hello": "world",
    "description": "You can also use plain yaml for programmable use with >= v1.2.0"
  }
}
```

* `_index.json` is index of the pages & subdirs in the directory. You can prevent generating this by removing `--index` option.
* `index` at end of value of `path` will be deleted. Ex: Input `/subdir/index.md` -> Output filename: `/subdir/index.json` field: `/subdir/`
