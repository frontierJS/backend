import DB from './Database.js'
import BaseModel from './BaseModel.js'

class Model extends BaseModel {
  constructor(opts = { meta: true }) {
    super()
    //maybe make a function that returns all the $rel functions on current model
    //as refs for whats connected
    this.metaData(opts.meta)
    return this
  }
  metaData(includeMeta) {
    if (includeMeta) {
      this._created = true
      this._model = this.constructor.name
    }
  }
  get _() {
    return this.constructor
  }
  static get table() {
    return this.name.toLowerCase() + 's'
  }
  static get fields() {
    return []
  }
  static get indexes() {
    return []
  }
  static get visible() {
    return []
  }
  static get hidden() {
    return []
  }
  static get fillable() {
    return []
  }
  static get guarded() {
    return ['id']
  }
  static get useSoftDeletes() {
    return false
  }
  static get visibleFields() {
    let { fields, visible, hidden } = this

    visible = visible.length ? visible : fields.map((field) => field.name)
    let fieldsArray = visible.filter((field) => !hidden.includes(field))
    return fieldsArray
  }
  static get fillableFields() {
    let { fillable, fields, guarded } = this
    fillable = fillable.length ? fillable : fields.map((field) => field.name)
    let fieldsArray = fillable.filter((field) => !guarded.includes(field))
    return fieldsArray
  }
  get fillableParams() {
    let fillable = this._.fillableFields
    let params = {}
    //Not sure if I need this anymore
    // pulling the params from parameterized fields don't filter
    // Object.keys(this).forEach(field => {
    //     console.log({field})
    //     if (fillable.includes(field)) params[field] = this[field]
    // })
    fillable.forEach((field) => (params[field] = this[field]))
    return params
  }
  static get parameterizedFields() {
    let fillable = this.fillableFields
    let parameterized = fillable.map((field) => '$' + field)
    // console.log({parameterized})
    return parameterized
  }

  static get fillableInsertQuery() {
    let sql =
      '(' +
      this.fillableFields +
      ')' +
      ' VALUES (' +
      this.parameterizedFields +
      ' )'
    return sql
  }
  static get fillableUpdateQuery() {
    let fillable = this.fillableFields
    let sqlString = fillable.map((field) => field + ' = $' + field + ' ')
    return sqlString
  }

  static get select() {
    let sqlSelect = 'SELECT ' + this.visibleFields
    return sqlSelect
  }
  get qInsert() {
    let sqlInsert = 'INSERT INTO ' + this._.table
    return sqlInsert
  }
  get qUpdate() {
    let sqlUpdate = 'UPDATE ' + this._.table + ' SET '
    return sqlUpdate
  }

  static get query() {
    let sqlPartial = this.select + ' FROM ' + this.table + ' WHERE 1=1 '
    return sqlPartial
  }
  // start of model querying
  //here could be the divide between base model and model
  static rawAll(sql, params) {
    return DB.all(sql, params)
  }
  static raw(sql, params) {
    return DB.get(sql, params)
  }
  static run(sql, params) {
    return DB.run(sql, params)
  }

  static getAll2(opts = { meta: false }) {
    let results = this._getAll(...arguments)
    return results.map((result) => new this({ ...result, opts }))
  }
  static _getAll2({ withDeleted = false } = {}) {
    let sql = this.query
    sql += this.useSoftDeletes && !withDeleted ? ' AND is_deleted IS NULL' : ''
    return DB.all(sql)
  }
  //need to reconcile these two
  static _getAll(field = '', params, pull = 'all', opts = {}) {
    if (field.constructor === Object) {
      opts = field
      field = ''
    }

    let sql = this.query
    sql +=
      this.useSoftDeletes && !opts.withDeleted ? ' AND is_deleted IS NULL' : ''

    if (field) {
      sql += ' AND ' + field + ' = ?'
    }
    return DB[pull](sql, params)
  }
  static getAll() {
    let results = this._getAll(...arguments)
    return results.map((result) => new this({ ...result }))
  }

  static _getWhere(field, param) {
    return this._getAll(field, param, 'get')
  }
  static getWhere() {
    return new this(this._getWhere(...arguments))
  }

  static _get(id) {
    return this._getWhere('id', id)
  }

  static get() {
    return new this(this._get(...arguments))
  }

  // end of model querying
  static create(data) {
    let instance = new this(data)
    return instance.save()
  }

  save() {
    return this.id ? this.update() : this.insert()
  }

  insert() {
    let params = this.fillableParams
    let sql = this.qInsert + this._.fillableInsertQuery
    let { changes, lastInsertRowid } = DB.run(sql, params)
    return this._.get(lastInsertRowid)
  }

  update() {
    let sql = this.qUpdate + this._.fillableUpdateQuery
    sql += ' WHERE id = $id'

    let params = this.fillableParams
    params['id'] = this.id

    let { changes, lastInsertRowid } = DB.run(sql, params)
    return this
  }
  static delete(id) {
    let instance = this.get(id)
    return instance.delete()
  }
  delete() {
    let sql = this.qUpdate + ' is_deleted = $is_deleted '
    sql += ' WHERE id = $id'

    let params = { id: this.id, is_deleted: new Date().toJSON() }
    let { changes, lastInsertRowid } = DB.run(sql, params)

    // return returnId ? lastInsertRowid : this.find(lastInsertRowid)
    return this._.get(this.id) //or can I just return this
  }
  //TODO: make this a permanant deletion from DB
  erase() {
    let sql = 'DELETE FROM ' + this._.table + ' WHERE id = $id'
    let params = { id: this.id }
    let { changes, lastInsertRowid } = DB.run(sql, params)
    // return this.find(this.id)
  }

  static restore(id) {
    let instance = new this()
    return instance.restore(id)
  }
  restore(id) {
    let sql = this.qUpdate + ' is_deleted = $is_deleted WHERE id = $id'
    let params = { id: id, is_deleted: null }
    DB.run(sql, params)
    return this._._get(id) //or can I just return this
  }
  with(attrs) {
    //Handle Strings
    if (attrs.constructor === String) {
      // Did we pass in $users or users
      let [attr, func] =
        attrs.charAt(0) == '$' ? [attrs.slice(1), attrs] : [attrs, '_' + attrs]
      this[attr] = this[func]
      return this
    }
    // Handle Arrays
    attrs.forEach((field) => {
      let [attr, func] =
        field.charAt(0) == '$' ? [field.slice(1), field] : [field, '_' + field]
      this[attr] = this[func]
    })
    return this
  }
}

export default Model
