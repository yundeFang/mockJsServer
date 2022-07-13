const express = require('express');
const path = require('path');
const fs = require('fs');
const Mock = require('mockjs');

const app = express();
const port = 6022;
const apiPath = path.join(__dirname, '../api/');
let apiData = {};
let jsonObject = {};

app.listen(port, function () {
  console.info('mock server is  listening at ' + port)
});

//读取接口配置的JSON文件
let getApi = () => {
  fs.readdir(apiPath, function(err, files) {
    if (err) {
      console.warn(err, "读取文件夹错误！")
    } else {
      //遍历读取到的文件列表
      files.forEach(function(filename) {
        //获取当前文件的绝对路径
        var filedir = path.join(apiPath, filename);
        let readStream = fs.createReadStream(filedir, {
          encoding: 'utf8'
        })
        readStream.on('data', (chunk) => {
          apiData = JSON.parse(chunk)
          for ( let key in apiData ) {
            jsonObject[key] = apiData[key];
          }
        });
        readStream.on('end', () => {
          console.info('文件【' + filename + '】读取已完成..');
        });

      })
    }
  })
}

fs.watch(apiPath, () => {
  getApi();
});
getApi();

app.use((req, res, next) => {
  const originalUrl = req.originalUrl;
  let data = undefined;
  let findItem = undefined;
  // 匹配路径
  for (let url in jsonObject) {
    // 如果是个对象那么判断url是否匹配
    if ( jsonObject[url].url ) {
      if ( jsonObject[url].url == originalUrl ) {
        findItem = jsonObject[url];
      }
    } else {
      // 如果不是对象那么是个数组就搜索
      findItem = jsonObject[url].find((result) => {
        if (result.url === originalUrl) {
          return result
        }
      });
    }
    // 如果找到了匹配的那么就按照接口返回
    if (findItem !== undefined) {
      console.info('\n###  当前mock配置--->  ' + JSON.stringify(jsonObject) + '  <---');
      data = Mock.mock(findItem.res); //使用mock.js创建数据
      console.info('\n###  接口【'+findItem.url+'】返回数据--->  ' + JSON.stringify(data) + '  <---');
      break;
    }
  }

 // 解决跨域问题
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Authorization,X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method' )
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, PUT, DELETE')
  res.header('Allow', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')

  //返回数据
  data !== undefined ? res.send(data) : res.sendStatus(404);
  next();
});
