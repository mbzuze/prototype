require('source-map-support').install();

var _ = require('lodash');

import * as fs from 'fs';

//var config = JSON.parse(fs.readFileSync('../config.json').toString());

import { configGen } from "./config"

import * as trex from './utils'
import * as state from "./state"
//import * as discordBot from './discordBot'

trex.log("\n\n======================== START PROCESS ===============================\n\n")
let config: any = configGen();
var version = config.version; //
//trex.log(config);

var compression = require('compression')

import * as express from 'express'

const app = express()
var http = require('http');
var https = require('https');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
import * as accounts from './accounts'

import * as events from "events";

import * as utilsLib from "./utils"

var mongojs = require('mongojs')

const { VM } = require('vm2');

var db = mongojs(config.mongoConnection, config.mongoCollections);



var eventHub = new events.EventEmitter();
import { plugins } from "./plugins/config"
import { userInfo } from 'os';

import * as stats from "./stats"
import { utils } from 'mocha';

app.disable('x-powered-by');
app.use(cookieParser());
app.use(compression());

app.use(express.static('../public'))
app.use(express.static('../client'))
app.use(express.static('../client/dist'))

app.use('/view', express.static('../client/dist'))
app.use('/u/:username/view', express.static('../client/dist'))





//####################################################################
// PLUGINS

eventHub.on("device", (data: any) => {
  //console.log("----")



  handleDeviceUpdate(data.apikey, data.packet, {socketio:true} , (e: Error, r: any) => { });
})
eventHub.on("plugin", (data: any) => {
  io.sockets.emit('plugin', data);
})

//app.use(express.json())
app.use(safeParser);

//FIRST RUN
// OLD: accounts.defaultAdminAccount(db);
utilsLib.checkFirstRun(db);

utilsLib.createUsernamesForOldAccounts(db);
utilsLib.createDeviceKeysForOldAccounts(db);

//handle accounts/cookies.
app.use(accounts.midware(db)); 



db.on('connect', function () {
  
  for (var p in plugins) {
    if (plugins[p].init) { plugins[p].init(app, db, eventHub); }
  }

})

//####################################################################
// USERS LAST SEEN / ACTIVE
app.use( (req:any, res:any, next:any)=>{
  if (req.user) {
    console.log("user active:\t"+req.user.email+"\t"+req.url)
    db.users.findOne({apikey : req.user.apikey}, (e:Error, user:any)=>{
      user["_last_seen"] = new Date();
      db.users.update({apikey : req.user.apikey}, user, (e2:Error, r2:any)=>{
        next();
      })
    })
  } else {
    next();
  }
  
})

//####################################################################

app.get('/', (req: any, res: any) => {

  //redirect main page people to https.


  if (req.protocol == "http") {
    trex.log("HTTP VISITOR")
    if (config.ssl) {
      res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
      res.end();
    }
  }

  if (req.user) {
    if (req.user.level > 0) {
      fs.readFile('../public/react.html', (err: Error, data: any) => {
        res.end(data.toString())
      })
    } else {
      fs.readFile('../public/react.html', (err: Error, data: any) => {
        res.end(data.toString())
      })
    }
  } else {
    res.end("AN ERROR HAS OCCURED. ARE COOKIES ENABLED?")
  }

})

stats.init(app,db);

app.get('/admin/accounts', (req: any, res: any) => {
  fs.readFile('../public/admin_accounts.html', (err: Error, data: any) => {
    res.end(data.toString())
  })
})



app.get('/signout', (req: any, res: any) => {
  res.clearCookie("uuid");
  res.redirect('/');
});

app.post('/signin', accounts.signInFromWeb(db));

app.get("/u/:username", (req:any, res:any)=>{
  fs.readFile('../public/react.html', (err: Error, data: any) => {
    res.end(data.toString())
  })
})

app.get("/u/:username/view/:devid", (req:any, res:any)=>{
  fs.readFile('../public/react.html', (err: Error, data: any) => {
    res.end(data.toString())
  })
})


app.get('/settings', (req: any, res: any) => {
  fs.readFile('../public/react.html', (err: Error, data: any) => {
    res.end(data.toString())
  })
});

app.get('/view/:id', (req: express.Request | any, res: express.Response | any) => {
  trex.log("client is viewing: " + JSON.stringify(req.params));
  fs.readFile('../public/react.html', (err: Error, data: any) => {
    res.end(data.toString())
  })
})

app.get('/view/:id/:mode', (req: express.Request | any, res: express.Response | any) => {
  trex.log("client is viewing: " + JSON.stringify(req.params));
  fs.readFile('../public/react.html', (err: Error, data: any) => {
    res.end(data.toString())
  })
})



app.get('/fbp', (req: express.Request | any, res: express.Response | any) => {
  trex.log("fbp:");
  fs.readFile('../public/react.html', (err: Error, data: any) => {
    res.end(data.toString())
  })
})




app.get('/api/v3/version', (req: any, res: any) => {
  res.json(version);
})

app.get('/api/v3/account', (req: any, res: any) => {
  var cleanUser = _.clone(req.user);

  delete cleanUser.password;
  res.json(cleanUser);
})

// This is to update the workflow on a device.
app.post("/api/v3/workflow", (req: any, res: any) => {
  if (req.body) {
    trex.log("WORKFLOW UPDATE");

    state.updateWorkflow(db, req.user.apikey, req.body.id, req.body.code, (err: Error, result: any) => {
      if (err) res.json(err);
      if (result) res.json(result);
    })

  } else {
    trex.log("WORKFLOW API ERROR")
  }
})



app.post("/api/v3/packets", (req: any, res: any, next: any) => {
  if (!req.user) { res.json({ error: "user not authenticated" }); return; }

  var limit = 25;
  if (req.body.limit) { limit = req.body.limit }

  if (req.body.id) {
    db.packets.find({ apikey: req.user.apikey, devid: req.body.id }).sort({ _id: -1 }).limit(limit, (err: Error, rawpackets: any) => {
      rawpackets = rawpackets.reverse();
      var packets = []

      for (var p in rawpackets) {
        //packets.push({data: rawpackets[p].payload.data, timestamp: rawpackets[p].payload.timestamp})
        var payload = rawpackets[p].payload;
        payload.meta = { userAgent: rawpackets[p].meta.userAgent, method: rawpackets[p].meta.method }
        packets.push(payload)
      }
      res.json(packets);
    })
  } else {
    res.json({ error: "No id parameter provided to filter states by id. Use GET /api/v3/states instead for all states data." })
  }
});

// run to update old packet data to have correct timestamp
// app.get("/admin/processpackets", (req:any, res:any)=>{
//   if (req.user.level < 100) { res.end("no permission"); return; }
//   db.packets.find({"_created_on" : { "$exists" : false }}).limit(10000, (err:Error, packets:any)=>{
//     res.write("packets:\t"+packets.length);
//     for (var packet of packets) {
//       if (packet["_created_on"] == undefined) {
//         packet["_created_on"] = new Date(packet.meta.created.jsonTime);
//         db.packets.update({"_id" : packet["_id"]}, packet)
//       }      
//     }
//     res.end("\ndone.")
//   })
// })

// run to update old packet data to have correct timestamp
app.get("/admin/processusers", (req:any, res:any)=>{
  if (req.user.level < 100) { res.end("no permission"); return; }

  db.users.find({"_created_on" : { "$exists" : false }}).limit(10000, (err:Error, users:any)=>{
    res.write("users:\t"+users.length);
    for (var user of users) {
      if (user["_created_on"] == undefined) {
        user["_created_on"] = new Date(user.created.jsonTime);
        db.users.update({"_id" : user["_id"]}, user)
      }      
    }
    res.end("\ndone.")
  }) 
})

app.get("/admin/processusersseen", (req:any, res:any)=>{
  if (req.user.level < 100) { res.end("no permission"); return; }

  db.users.find({"_last_seen" : { "$exists" : false }}).limit(10000, (err:Error, users:any)=>{
    res.write("users:\t"+users.length);
    for (var user of users) {
      if (user["_last_seen"] == undefined) {
        user["_last_seen"] = new Date(user.created.jsonTime);
        db.users.update({"_id" : user["_id"]}, user)
      }      
    }
    res.end("\ndone.")
  }) 
})

app.get("/admin/processstates", (req:any, res:any)=>{
  if (req.user.level < 100) { res.end("no permission"); return; }

  db.states.find({"_last_seen" : { "$exists" : false }}).limit(10000, (err:Error, states:any)=>{
    res.write("states:\t"+states.length);
    for (var state of states) {
      
      if (state["_last_seen"] == undefined) {
        state["_last_seen"] = new Date(state.meta.created.jsonTime);  
      } 
      if (state["_created_on"] == undefined) {
        state["_created_on"] = new Date(state.meta.created.jsonTime);  
      } 

      db.states.update({"_id" : state["_id"]}, state)     
    }
    res.end("\ndone.")
  }) 
})



app.post("/api/v3/view", (req: any, res: any, next: any) => {
  if (!req.user) { res.json({ error: "user not authenticated" }); return; }


  if (req.username) {
    //

    if (req.body.username != req.user.username) {
      if (req.user.level < 100) { res.json({error:"must be level 100"}); return; }
    } 

    db.users.findOne({username: req.body.username}, (dbError:Error, user:any) => {
      if (user) {
        ///
          if (req.body.id) {
            db.states.findOne({ apikey: user.apikey, devid: req.body.id }, (err: Error, state: any) => {
        
              if (state == null) { res.json({ "error": "id not found" }); return; }
        
              if (state) {
                var viewState = state.payload;
                viewState.meta = { userAgent: state.meta.userAgent, method: state.meta.method }
                res.json(viewState);
              } else {
                res.json({ error: "state not found" })
              }
        
        
            })
          } else {
            res.json({ error: "No id parameter provided to filter states by id. Use GET /api/v3/states instead for all states data." })
          }
        ///
      }
    });
    //
  } else {
    if (req.body.id) {
      db.states.findOne({ apikey: req.user.apikey, devid: req.body.id }, (err: Error, state: any) => {
  
        if (state == null) { res.json({ "error": "id not found" }); return; }
  
        if (state) {
          var viewState = state.payload;
          viewState.meta = { userAgent: state.meta.userAgent, method: state.meta.method }
          res.json(viewState);
        } else {
          res.json({ error: "state not found" })
        }
  
  
      })
    } else {
      res.json({ error: "No id parameter provided to filter states by id. Use GET /api/v3/states instead for all states data." })
    }
  }



});

app.post("/api/v3/state", (req: any, res: any, next: any) => {


  if (req.body.username) { 

    if (req.body.username != req.user.username) {
      if (req.user.level < 100) { res.json({error:"must be level 100"}); return; }
    } 
    

    db.users.findOne({username: req.body.username}, (dbError:Error, user:any) => {
      if (user) {
        console.log(user)
        /////
          if (req.body.id) {
            db.states.findOne({ apikey: user.apikey, devid: req.body.id }, (err: Error, state: any) => {
              res.json(state);
            })
          } else {
            res.json({ error: "No id parameter provided to filter states by id. Use GET /api/v3/states instead for all states data." })
          }
        /////
      }
    })
    // mash to complete.
    // search db for username
    // db.users.find({username})
    // db.states.findOne({apikey, id}m )
   } else {

    if (!req.user) { res.json({ error: "user not authenticated" }); return; }

    if (req.body.id) {
      db.states.findOne({ apikey: req.user.apikey, devid: req.body.id }, (err: Error, state: any) => {
        res.json(state);
      })
    } else {
      res.json({ error: "No id parameter provided to filter states by id. Use GET /api/v3/states instead for all states data." })
    }

   }




});



app.get('/api/v3/states', (req: any, res: any) => {
  if (!req.user) { res.json({ error: "user not authenticated" }); return; }

  db.states.find({ apikey: req.user.apikey }, (err: Error, states: any[]) => {
    var cleanStates = []
    for (var a in states) { cleanStates.push(states[a].payload) }
    res.json(cleanStates);
  })
})

// new in 5.0.34:
app.post("/api/v3/states", (req:any, res:any) => {
  if (req.body) {
    // find state by username
    if (req.body.username != req.user.username) {
      if (req.user.level < 100) {
        res.json([])
        return;
      }
    }
    
    // todo filter by permission/level
    if (req.body.username) {
      db.users.findOne({username:req.body.username}, (e:Error, user:any)=>{
        
        if (e) { res.json({error: "db error"})}
        if (user) {
            

          db.states.find({ apikey: user.apikey }, (er:Error, states: any[]) => {
            var cleanStates:any = []
            for (var a in states) {
              var cleanState = _.clone(states[a])
              delete cleanState["apikey"]
              cleanStates.push(cleanState);
            }
            res.json(cleanStates)
          })
        }
      })
    } 
  }
})

app.get("/api/v3/states/full", (req: any, res: any) => {
  db.states.find({ apikey: req.user.apikey }, (err: Error, states: any[]) => {
    res.json(states);
  })
})



app.post('/api/v3/accounts/create', (req: any, res: any) => {
  if (req.user.level < 100) { res.json({ error: "permission denied" }); return; }

  if (req.body) {
    if (req.body.email) {
      accounts.accountCreate(db, req.body.email, req.get('User-Agent'), req.ip, (err: Error, user: any) => {
        if (err) res.json({ error: err.toString() });
        if (user) res.json(user)
      }, req.body);
    }
  }
})




app.post('/api/v3/account/update', (req: any, res: any) => {
  db.users.update({ apikey: req.user.apikey }, { "$set": req.body }, (err: Error, result: any) => {
    if (err) res.json({ error: err.toString() });
    if (result) res.json(result);
  })
})






function safeParser(req: any, res: any, next: any) {
  var buf = ""
  req.on("data", (chunk: any) => { buf += chunk.toString(); })

  req.on("end", () => {
    if (buf.length > 0) {
      try {
        var jsonin = JSON.parse(buf)
        req.body = jsonin;
        next();
      } catch (err) {
        res.status(400).json({ "error:" : err.toString()+". Make sure you are sending valid JSON" })
        next();
      }
    } else { next(); }
  })
}

function addRawBody(req: any, res: any, buf: any, encoding: any) {
  req.rawBody = buf.toString();
}

///////// END



app.put("/api/v3/data/put", (req: any, res: any, next: any) => {
  handleState(req, res, next);
});

app.post("/api/v3/data/post", (req: any, res: any, next: any) => {
  handleState(req, res, next);
});

function handleState(req: any, res: any, next: any) {

  if (req.body === undefined) { return; }

  
  if ((req.user) && (req.user.level) > 0) {
    if (!req.body.id) { res.json({ "error": "id parameter missing" }); return; }
    if (typeof req.body.id != "string") { res.status(400).json({"error": "parameter id must be of type string"}); return;}
    if (!req.body.data) { res.status(400).json({"error":"data parameter missing"}); return;}
    if (req.body.id == null) { res.json({ "error": "id parameter null" }); return; }
    if (!req.body.data) { res.json({ "error": "data parameter missing" }); return; }

    var meta = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method
    }

    processPacketWorkflow(db, req.user.apikey, req.body.id, req.body, plugins, (err: Error, newpacket: any) => {
      state.postState(db, req.user, newpacket, meta, (packet: any, info:any) => {
        
        io.to(req.user.apikey).emit('post', packet.payload);
        io.to(req.user.apikey + "|" + req.body.id).emit('post', packet.payload);
        io.to(packet.key).emit('post', packet.payload)
        
        if (info.newdevice) {
          io.to(req.user.username).emit("info", info)
        }
        


        for (var p in plugins) {
          if (plugins[p].handlePacket) {
            plugins[p].handlePacket(db, packet, (err: Error, packet: any) => {

            });
          }
        }
        // iotnxtUpdateDevice(packet, (err:Error, result:any)=>{
        //   if (err) console.log("couldnt publish")
        // }); 

        res.json({ result: "success" });

      })
    })

  } else {
    res.json({ "error": "user not authenticated" })
  }
}

/* ----------------------------------------------------------------------------- 
    DB QUERY
*/


function handleDeviceUpdate(apikey: string, packetIn: any, options:any, cb: any) {

  state.getUserByApikey(db, apikey, (err: any, user: any) => {
    if (err) { console.log(err); cb(err, undefined); return; }

    processPacketWorkflow(db, apikey, packetIn.id, packetIn, plugins, (err: Error, newpacket: any) => {
      state.postState(db, user, newpacket, packetIn.meta, (packet: any, info:any) => {
        if (options) {
          if (options.socketio == true) {
            io.to(apikey).emit('post', packet.payload);
            io.to(apikey + "|" + packetIn.id).emit('post', packet.payload);
            io.to(packet.key).emit('post', packet.payload)

            if (info.newdevice) {
              io.to(user.username).emit("info", info)
            }

          }
        }
        
        //console.log(apikey + "|" + packetIn.id)


        for (var p in plugins) {
          if (plugins[p].handlePacket) {
            plugins[p].handlePacket(db, packet, (err: Error, packet: any) => {

            });
          }
        }


        // iotnxtUpdateDevice(packet, (err:Error, result:any)=>{
        //   if (err) console.log("couldnt publish")
        // }); 

        cb(undefined, { result: "success" });

      })
    })

  })

}



app.get("/api/v3/state", (req: any, res: any) => {
  db.states.find({ "payload.id": req.body.id }, (err: Error, state: any) => {
    res.json(state);
  })
});

app.post("/api/v3/state/delete", (req: any, res: any) => {
  if ((req.user) && (req.user.level) > 0) {
    if (!req.body.id) { res.json({ "error": "id parameter missing" }); return; }

    var meta = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method
    }

    if (req.body.id) {
      db.states.remove({ apikey: req.user.apikey, devid: req.body.id }, (err: Error, removed: any) => {
        if (err) res.json(err);
        if (removed) res.json(removed);
      })
    }
  } else {
    res.json({ result: "auth failed" });
  }

})

app.post("/api/v3/state/clear", (req: any, res: any) => {

  if (!req.user) { return; }
  if (req.user.level < 1) { return; }
  if (!req.body.id) { res.json({ "error": "id parameter missing" }); return; }



  db.states.update({ apikey: req.user.apikey, devid: req.body.id }, { "$set": { payload: { id: req.body.id, data: {} }, "meta.method": "clear", "meta.userAgent": "api" } }, (err: Error, cleared: any) => {
    if (err) res.json(err);
    if (cleared) res.json(cleared);
  })



})


app.post("/api/v3/state/query", (req: any, res: any) => {
  if (!req.user) { res.json({ error: "user not authenticated" }); return; }

  if ((req.user) && (req.user.level) > 0) {
    if (!req.body.id) { res.json({ "error": "id parameter missing" }); return; }

    var meta = {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method
    }

    if (req.body.data) {
      state.queryProject(db, req.user, req.body, meta, (packet: any) => {

        io.to(req.user.apikey).emit('post', packet.payload);
        io.to(req.user.apikey + "|" + req.body.id).emit('post', packet.payload);

        for (var p in plugins) {
          if (plugins[p].handlePacket) {
            plugins[p].handlePacket(db, packet, (err: Error, packet: any) => {

            });
          }
        }

        res.json(packet);

      })
    } else {
      state.queryProject(db, req.user, req.body, meta, (packet: any) => { res.json(packet); })
    }
  }

});





app.get("/api/v3/plugins/definitions", (req:any, res:any)=>{

  var definitions:any = [];

  for (var plugin of plugins) {
    if (plugin.workflow) {
      console.log("loading workflow definitions for plugin: "+plugin.name)
      definitions.push(plugin.workflowDefinitions);
    }
  }

  res.json({definitions})
})






export function processPacketWorkflow(db:any, apikey:string, deviceId:string, packet:any, plugins:any, cb:any) {

  db.states.find({apikey:apikey}, (err:Error, states:any)=>{
    if (err) { console.log("WORKFLOW ERROR"); }
    
    var statesObj:any = {}
    for (var s in states) { statesObj[states[s].devid] = states[s]; }

    var state:any = {};
    for (var s in states) {
      if (states[s].devid == deviceId) {
        state = states[s];
      }
    }

    if (state) {
      if (state.workflowCode) {
        // WORKFLOW EXISTS ON THIS DEVICE
        
        var sandbox:any = {
          http : require("http"),
          https : require("https"),
          state:state,
          states:states,
          statesObj:statesObj,
          packet: packet,
          callback: (packetDone:any) => {
            //if (alreadyExitScript == false) { 
              packetDone.err = "";
              alreadyExitScript = true;              
              cb(undefined, packetDone); 
            //}
            
          }
        }  

        for (var plugin of plugins) {
          if (plugin.workflow) {
            sandbox[plugin.name] = plugin.workflow;
          }
        }
        
        var alreadyExitScript = false;

        const vm = new VM({
          timeout: 1000,
          sandbox: sandbox         
        });



        // Sync
        try {
          vm.run(state.workflowCode);          
        } catch (err) {
          //console.error('Failed to execute script.', err);
          
          //if (alreadyExitScript == false) { 
            console.log("VM WORKFLOW ERROR!")
            console.error(err);
            alreadyExitScript = true;
            packet.err = err.toString();
            cb(undefined, packet); 
          //}        
        }




        
      } else {
        // NO WORKFLOW ON THIS DEVICE
        cb(undefined, packet);
      }
    } else {
      // NO DEVICE YET
      cb(undefined, packet);
    }
    

  })

}























// app.use((req,res,next)=>{
//   res.json({error:"invalid_route"})
// })

var server;

if (config.ssl) {
  server = https.createServer(config.sslOptions, app);
} else {
  server = http.createServer(app);
}


/* ############################################################################## */

var io = require('socket.io')(server);

io.on('connection', function (socket: any) {
  //trex.log(socket);

  //utilsLib.log(socket.id)
  //trex.log(socket.handshake)
  //trex.log('socket connected...');
  setTimeout(function () {
    socket.emit("connect", { hello: "world" })
  }, 5000)

  socket.on('join', function (path: string) {
    console.log(socket.id + " joins " + path)
    //console.log(socket)
    //AUTH
    //trex.log("SOCKET.IO JOIN "+path)
    socket.join(path);
  });

  socket.on('post', (data: any) => {
    //trex.log("socket posted");
    //console.log(data);

    for (var key in socket.rooms) {
      if (socket.rooms.hasOwnProperty(key)) {

        var testkey = key;

        if (key.split("|").length == 2) { testkey = key.split("|")[0] }

        var packet = {
          id : data.id,
          data: data.data,
          meta: { method: "socketioclient"}
        }

        handleDeviceUpdate(testkey, packet, {socketio:true}, (e: Error, r: any) => { });



        // state.validApiKey(db, testkey, (err: Error, result: any) => {
        //   if (err) { console.log(err); return; }
        //   if (result) {

        //     if (result.valid) {
        //       /*--------------------------------------------------------*/
        //       var meta = {}

        //       state.postState(db, result.user, data, meta, (packet: any) => { })
        //       /*--------------------------------------------------------*/
        //     } else {

        //     }

        //   }




        // })

      }
    }
  })


  socket.on('disconnect', function () { })
});




if (config.ssl) {
  server.listen(443);

  // temporary open ports for shockwave pivot
  var httpserver = http.createServer(app);
  httpserver.listen(80);

  // REDIR TO HTTPS
  // var http = require('http');
  // http.createServer(function (req: any, res: any) {
  //   res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  //   res.end();
  // }).listen(80);

  /////
} else {
  trex.log("server running on port HTTP " + config.httpPort)
  server.listen(config.httpPort);
}

server.on('error', (e: any) => {

  if (e.code == "EACCES") {
    trex.log("\nERROR do you have permission for this port? Try sudo.\n")
  } else {
    trex.log(e);
  }

})





process.on('unhandledRejection', console.log);
process.on("uncaughtException", console.log);