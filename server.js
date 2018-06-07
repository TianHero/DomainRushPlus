const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
var MongoClient = require('mongodb').MongoClient;
const dbName = 'demo2'
var url = 'mongodb://localhost:27017/' + dbName
var assert = require('assert')

let app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
//渲染前端页面 非接口
app.get('/', (req, res) => {
  fs.readFile('./post.html', 'utf8', (err, data) => {
    res.end(data)
  })
})
app.get('/jq', (req, res) => {
  fs.readFile('./jquery.min.js', 'utf8', (err, data) => {
    res.end(data)
  })
})
//返回所有域名api
app.get('/all', (req, response) => {
  MongoClient.connect(url, (err, db) => {
    assert.equal(null, err)
    let dbase = db.db(dbName)
    dbase.collection('domains').find({}, { sort: { 'success': 1, _id: -1 } }).toArray((err, result) => {
      assert.equal(null, err)
      // console.log(result)
      response.send(result)
      db.close()
    })
  })
})

// 还未成功域名api
app.get('/rush', (req, response) => {
  MongoClient.connect(url, (err, db) => {
    assert.equal(null, err)
    let dbase = db.db(dbName)
    dbase.collection('domains').find({ 'success': 0 }).toArray((err, result) => {
      assert.equal(null, err)
      console.log(result)
      response.send(result)
      db.close()
    })
  })
})

//添加域名api
app.post('/domain', (req, response) => {
  let aDomain = req.body;
  //存在不插入，不存在插入
  MongoClient.connect(url, (err, db) => {
    assert.equal(null, err)
    let dbase = db.db(dbName)
    // console.log(aDomain.domain);
    let selectStr = { 'domain': aDomain.domain }
    dbase.collection('domains').find(selectStr).toArray((err, doc) => {
      assert.equal(null, err)

      if (doc.length !== 0) {
        response.send({ error: 'existed' })
        console.log('添加失败，已存在')
        db.close()
      }
      else {
        let insertDomain = {
          domain: aDomain.domain,
          customer: aDomain.customer,
          contact: aDomain.contact,
          ns1: aDomain.ns1,
          ns2: aDomain.ns2,
          startTime: new Date().toISOString(),
          endTime: '',
          success: 0
        }
        dbase.collection('domains').insertOne(insertDomain, (err, res) => {
          assert.equal(null, err)
          console.log('添加成功')
          db.close()
          response.send({ success: 'OK' })
        })
      }
    })
  })
})

//删除域名
app.post('/delete', (req, response) => {
  const deletaDomain = req.body.domain

  MongoClient.connect(url, (err, db) => {
    assert.equal(null, err)
    let dbase = db.db(dbName)
    const selectStr = { 'domain': deletaDomain }
    dbase.collection('domains').deleteOne(selectStr, (err, doc) => {
      assert.equal(null, err)
      console.log('删除了' + deletaDomain);
      db.close();
    })
  })
  response.end('hello')
})

//配置端口
var server = app.listen(3000, () => {
  const host = server.address().address
  const port = server.address().port
  console.log("应用实例，访问地址为 http://localhost:%s", port)
})