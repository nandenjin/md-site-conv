# @nandenjin/md-site-conv

Generate js-importable pagetree from Markdown files.

## Install

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
  "_content": "<h1>Sample Document</h1><p>This is a sample document.</p>"
}
```

* `_index.json` is index of the pages & subdirs in the directory. You can prevent generating this by removing `--index` option.
* `index` at end of value of `path` will be deleted. Ex: Input `/subdir/index.md` -> Output filename: `/subdir/index.json` field: `/subdir/`
