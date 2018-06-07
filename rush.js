const request = require('request');

var userConfig = require('./config.js');
const user = new userConfig;

var MongoClient = require('mongodb').MongoClient;
const dbName = 'demo2'
var url = 'mongodb://localhost:27017/' + dbName
var assert = require('assert')

let timer = null

timer = setInterval(function () {

  MongoClient.connect(url, (err, db) => {
    assert.equal(null, err)
    let dbase = db.db(dbName)
    dbase.collection('domains').find({ 'success': 0 }).toArray((err, result) => {
      assert.equal(null, err)
      console.log('---------' + result.length + '---------');
      result.forEach(element => {
        const isEU = suffixEu(element.domain);
        const euStr = '&admin-contact-id=-1&tech-contact-id=-1&billing-contact-id=-1';
        // console.log(element.domain);
        const url = 'https://httpapi.com/api/domains/register.json?domain-name=' + element.domain + '&auth-userid=' + user.auth_userid + '&api-key=' + user.api_key + '&years=1&ns=' + element.ns1 + '&ns=' + element.ns2 + '&customer-id=' + element.customer + '&reg-contact-id=' + element.contact + (isEU ? euStr : '') + '&admin-contact-id=' + element.contact + '&tech-contact-id=' + element.contact + '&billing-contact-id=' + element.contact + '&invoice-option=PayInvoice&protect-privacy=true';
        // console.log(url);
        httprequest(url, element.domain);
      });
      db.close()
    })
  })
}, 4000)

function httprequest(httpurl, domain) {
  request({
    url: httpurl,
    method: "POST",
    json: true,
    headers: {
      "content-type": "application/json",
    }
  }, function (error, response, body) {
    console.log(domain);
    // console.log(body);
    if (!error && response.statusCode == 200) {
      if (body.status === 'Success') {
        //注册成功的逻辑
        MongoClient.connect(url, (err, db) => {
          assert.equal(null, err)
          let dbase = db.db(dbName)
          const selectStr = { 'domain': domain }
          const updateStr = { $set: { "success": 1, "endTime": new Date().toISOString(),"myFlag":1} };
          dbase.collection('domains').updateOne(selectStr, updateStr, (err, doc) => {
            assert.equal(null, err)
            console.log('更新了' + domain);
            db.close();
          })
        })
      } else if (body.error.indexOf('exists') !== -1) {
        console.log('在我账号下');
        MongoClient.connect(url, (err, db) => {
          if (err) throw err;
          let dbase = db.db(dbName)
          const selectStr = { 'domain': domain }
          const updateStr = { $set: { "success": 1, "endTime": new Date().toISOString()} };
          dbase.collection('domains').updateOne(selectStr, updateStr, (err, doc) => {
            if (err) throw err;
            console.log('更新了' + domain);
            db.close();
          })
        })
      }
    }
  });
};

function suffixEu(str) {
  let tmpArr = str.split('.');
  const suf = tmpArr[tmpArr.length - 1];
  return suf === 'eu';
}

