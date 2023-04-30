// From https://github.com/typicode/lowdb#custom-serialization
import { Low } from 'lowdb'
import { TextFile } from 'lowdb/node'
import YAML from 'yaml'

class YAMLFile {
  adapter: TextFile;
  
  constructor(filename: string) {
    this.adapter = new TextFile(filename)
  }

  async read() {
    const data = await this.adapter.read()
    if (data === null) {
      return null
    } else {
      return YAML.parse(data)
    }
  }

  write(obj: Record<string, any>) {
    return this.adapter.write(YAML.stringify(obj))
  }
}

const adapter = new YAMLFile('./data/vanilla.yaml')
const db = new Low(adapter)

// From https://github.com/typicode/lowdb#usage

// Read data from JSON file, this will set db.data content
await db.read()

// If db.json doesn't exist, db.data will be null
// Use the code below to set default data
// db.data = db.data || { posts: [] } // For Node < v15.x
db.data ||= { posts: [] }             // For Node >= 15.x

// Create and query items using native JS API
db.data.posts.push('hello world')
// const firstPost = db.data.posts[0]

// Alternatively, you can also use this syntax if you prefer
const { posts } = db.data
posts.push('hello world ' + (new Date()).toISOString())

// Finally write db.data content to file
await db.write()