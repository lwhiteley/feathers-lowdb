import assert from 'assert'
import { adapterTests } from '@feathersjs/adapter-tests'
import errors from '@feathersjs/errors'
import { feathers } from '@feathersjs/feathers'
import { LowDBService, YAMLFile, Low } from '../src/index.js'

const testSuite = adapterTests([
  '.options',
  '.events',
  '._get',
  '._find',
  '._create',
  '._update',
  '._patch',
  '._remove',
  '.get',
  '.get + $select',
  '.get + id + query',
  '.get + NotFound',
  '.get + id + query id',
  '.find',
  '.find + paginate + query',
  '.remove',
  '.remove + $select',
  '.remove + id + query',
  '.remove + multi',
  '.remove + multi no pagination',
  '.remove + id + query id',
  '.update',
  '.update + $select',
  '.update + id + query',
  '.update + NotFound',
  '.update + id + query id',
  '.update + query + NotFound',
  '.patch',
  '.patch + $select',
  '.patch + id + query',
  '.patch multiple',
  '.patch multiple no pagination',
  '.patch multi query same',
  '.patch multi query changed',
  '.patch + query + NotFound',
  '.patch + NotFound',
  '.patch + id + query id',
  '.create',
  '.create + $select',
  '.create multi',
  'internal .find',
  'internal .get',
  'internal .create',
  'internal .update',
  'internal .patch',
  'internal .remove',
  '.find + equal',
  '.find + equal multiple',
  '.find + $sort',
  '.find + $sort + string',
  '.find + $limit',
  '.find + $limit 0',
  '.find + $skip',
  '.find + $select',
  '.find + $or',
  '.find + $in',
  '.find + $nin',
  '.find + $lt',
  '.find + $lte',
  '.find + $gt',
  '.find + $gte',
  '.find + $ne',
  '.find + $gt + $lt + $sort',
  '.find + $or nested + $sort',
  '.find + paginate',
  '.find + paginate + $limit + $skip',
  '.find + paginate + $limit 0',
  '.find + paginate + params',
  'params.adapter + paginate',
  'params.adapter + multi',
])

describe('Feathers Memory Service', () => {
  type Person = {
    id: number
    name: string
    age: number
  }

  type Animal = {
    type: string
    age: number
  }

  const events = ['testing']
  const app = feathers<{
    people: LowDBService<Person>
    'people-customid': LowDBService<Person>
    animals: LowDBService<Animal>
    matcher: LowDBService
  }>()

  app.use('people', new LowDBService<Person>({ events }))
  app.use(
    'people-customid',
    new LowDBService<Person>({
      id: 'customid',
      events,
    })
  )

  it('update with string id works', async () => {
    const people = app.service('people')
    const person = await people.create({
      name: 'Tester',
      age: 33,
    })

    const updatedPerson = await people.update(person.id.toString(), person)

    assert.strictEqual(typeof updatedPerson.id, 'number')

    await people.remove(person.id.toString())
  })

  it('patch record with prop also in query', async () => {
    app.use('animals', new LowDBService<Animal>({ multi: true }))
    const animals = app.service('animals')
    await animals.create([
      {
        type: 'cat',
        age: 30,
      },
      {
        type: 'dog',
        age: 10,
      },
    ])

    const [updated] = await animals.patch(
      null,
      { age: 40 },
      { query: { age: 30 } }
    )

    assert.strictEqual(updated.age, 40)

    await animals.remove(null, {})
  })

  it('allows to pass custom find and sort matcher', async () => {
    let sorterCalled = false
    let matcherCalled = false

    app.use(
      'matcher',
      new LowDBService({
        matcher() {
          matcherCalled = true
          return function () {
            return true
          }
        },

        sorter() {
          sorterCalled = true
          return function () {
            return 0
          }
        },
      })
    )

    await app.service('matcher').find({
      query: { something: 1, $sort: { something: 1 } },
    })

    assert.ok(sorterCalled, 'sorter called')
    assert.ok(matcherCalled, 'matcher called')
  })

   
  it('does not modify the original data', async () => {
    const people = app.service('people')

    const person = await people.create({
      name: 'Delete tester',
      age: 33,
    })

    delete person.age

    const otherPerson = await people.get(person.id)

    assert.strictEqual(otherPerson.age, 33)

    await people.remove(person.id)
  })

  it('support params.adapter.Model', async () => {
    const Model = new Low(new YAMLFile('/tmp/test-model-' + Date.now() + '.yml'))
    const oldParams = { adapter: { Model } } as any
    const people = app.service('people')

    const youngPerson = await people.create({
      id: 42,
      name: 'Delete tester',
      age: 19,
    })
    const oldPerson = await people.create({
      id: 42,
      name: 'Delete tester',
      age: 69,
    }, oldParams)
    const youngPersonRes = await people.get(42)
    const oldPersonRes = await people.get(42, oldParams)
    assert.strictEqual(youngPerson.age, 19)
    assert.strictEqual(youngPersonRes.age, 19)
    assert.strictEqual(oldPerson.age, 69)
    assert.strictEqual(oldPersonRes.age, 69)

    await people.remove(youngPerson.id)
  })

  it('update with null throws error', async () => {
    try {
      await app.service('people').update(null, {})
      throw new Error('Should never get here')
    } catch (error: any) {
      if (error instanceof Error) {
        assert.strictEqual(
          error.message,
          "You can not replace multiple instances. Did you mean 'patch'?"
        )
      } else {
        throw new Error('Should never get here')
      }
    }
  })

  it('use $select as only query property', async () => {
    const people = app.service('people')
    const person = await people.create({
      name: 'Tester',
      age: 42,
    })

    const results = await people.find({
      paginate: false,
      query: {
        $select: ['name'],
      },
    })

    assert.deepStrictEqual(results[0], { id: person.id, name: 'Tester' })

    await people.remove(person.id)
  })

  testSuite(app, errors, 'people')
  testSuite(app, errors, 'people-customid', 'customid')
})
