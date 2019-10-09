((mongoService, mongodb)=>{
  var connectionString = process.env.connectionString ||
  "mongodb://localhost:27017";

  var Connect = (cb)=>{
    mongodb.connect(connectionString, (err,client)=>{
      var db = client.db('paypaltesting');
      return cb(err, db, ()=>{ client.close(); });
    });
  };

  mongoService.Create = (colName, createObj, cb)=>{
    Connect((err, db, close)=>{
      db.collection(colName).insert(createObj, (err, results)=>{
        cb(err, results);
        return close();
      });
    });
  };

  mongoService.Read = (colName, readObj, cb)=>{
    Connect((err, db, close)=>{
      db.collection(colName).find(readObj).toArray((err, results)=>{
        cb(err, results);
        return close();
      });
    });
  }

  mongoService.Update = (colName, findObj, updateObj, cb)=>{
    Connect((err, db, close)=>{
      db.collection(colName).update(findObj, { $set: updateObj }, (err, results)=>{
        cb(err, results);
        return close();
      });
    });
  };

  mongoService.Delete = (colName, findObject, cb) => {
    Connect((err, db, close)=>{
      db.collection(colName).remove(findObject, (err,  results)=>{
        cb(err, results);
        return close();
      })
    })
  }
})
(
  module.exports,
  require('mongodb')
);