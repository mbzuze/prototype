import React, { Component } from "react";
import * as $ from "jquery";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { tomorrowNightBright } from 'react-syntax-highlighter/styles/hljs';

export class ApiInfo extends Component {
  state = {
    apiMenu : 1
  };

  handleCopyClipboard() {
    var textField = document.createElement("textarea");
    textField.innerText = $("#postSample").html();
    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    textField.remove();
  }

  getMenuClasses = function (num ) {
    if (num == this.state.apiMenu) {
      return "menuTab borderTopSpot"
    } else {
      return "menuTab menuSelectable"
    }
  }

  getMenuPageStyle = function (num ) {
    if (num == this.state.apiMenu) {
      return { display: "" }
    } else {
      return { display: "none" }
    }
  }

  onClickMenuTab = function (num) {
    return (event) => {
      /*
      console.log(event);
      event.currentTarget.className = "col-md-2 menuTab borderTopSpot";
      console.log(num)
      */
     var apiMenu = num;
     this.setState( { apiMenu})
    }
  } 

  render() {

    


    var apiCall = { path: window.location.origin  }

    var samplePacket = { "id": "yourDevice001", "data": { "temperature": 24.54, "doorOpen": false, "gps": { "lat": 25.123, "lon": 28.125} } }
    var samplePacket2 = { "id": "yourDevice001" }

    var authheader = 'Basic ' + Buffer.from("api:key-" + this.props.apikey).toString('base64')

    var curlPostSample =
      "curl --user 'api:key-" +
      this.props.apikey +
      '\' -X POST -H "Content-Type: application/json" -d \'' + JSON.stringify(samplePacket) + '\' ' +
      window.location.origin +
      "/api/v3/data/post";

    var curlViewSample =
    "curl --user 'api:key-" +
    this.props.apikey +
    '\' -X POST -H "Content-Type: application/json" -d \'' + JSON.stringify({ "id": "yourDevice001" }) + '\' ' +
    window.location.origin +
    "/api/v3/view";

    var codeStringRealtimeSocketIo = 'var socket = require("socket.io-client")("'+apiCall.path+'");\n\nsocket.on("connect", function(data) {\n\tconsole.log("connected.");\n\tsocket.emit("join", "'+this.props.apikey+'"); // your api key\n\n\tsocket.on("post", data => {\n\t\tconsole.log(data);\n\t});\n});';
    var codeStringRealtimeSocketIoResult = '{ id: \'yourDevice001\',\n  data:\n    { temperature: 24.54,\n      doorOpen: false,\n      gps: { lat: 25.123, lon: 28.125 } },\n  timestamp: \'2018-08-27T08:42:30.512Z\' }';
    var codeStringRealtimeSocketIoSingleDevice = 'socket.emit("join", "'+this.props.apikey+'|yourDevice001"); // your api key | device id';

    return (
      <div className="" style={{ paddingTop: 0, margin: "0 37px", marginTop: "50px" }} >

        <div className="row"> 
          <div className={this.getMenuClasses(1)} onClick={this.onClickMenuTab(1) } >APIKEY</div>
          <div className={this.getMenuClasses(2)} onClick={this.onClickMenuTab(2) }>HTTP REST</div>
          <div className={this.getMenuClasses(3)} onClick={this.onClickMenuTab(3) }>SOCKET.IO</div>
          <div className={this.getMenuClasses(4)} onClick={this.onClickMenuTab(4) } >MQTT</div>
          <div className={this.getMenuClasses(5)} onClick={this.onClickMenuTab(5) } >PYTHON</div>
        </div>


        <div className="row" style={this.getMenuPageStyle(1)}>
          <div className="col-md-12 commanderBgPanel" ><br />
            <p>
              To get started we recommend using the HTTP REST api at first.
            </p>
          </div>
        
          <div className="col-md-6 commanderBgPanel">
            <h4>YOUR API KEY:</h4>
            <p id="accountApikey" className="commanderBgPanel">
              <span className="spot">{this.props.apikey}</span>
            </p>
          </div>
          <div className="col-md-6 commanderBgPanel">
            <p>The procedure involves setting up the authentication headers for the call and pointing the call to the correct server. You may also add the body with data if applicable.<br />
              The type of authorization needs to be "Basic Auth" with these details:<br /><br />
              Username: <span className="spot">api</span><br />
              Password: <span className="spot">key-{this.props.apikey}</span>
            </p>
            <p>Using tools such as <a href="https://www.getpostman.com/">POSTMAN</a>, you can generate a base64 encoded header automatically. Depending on the tool used to make the call, an "Authorization" header may need to be generated manually.</p>
          </div>
      
          <div className="col-md-12 commanderBgPanel" >
            <h4>HEADERS</h4>

            <p>Only two headers are required. The tool/software used will usually handle the Authorization header construction based on the username/password.<br /> </p>

            <pre className="commanderBgPanel" style={{ fontSize: 12 }}>
              "Authorization":"{authheader}"<br />
              "Content-Type":"application/json"
            </pre>
          </div>
        </div>



        <div className="row" style={this.getMenuPageStyle(2)}>
          <div className="col-md-12 commanderBgPanel" >
            <h4 className="spot">HOW TO CREATE AN ENDPOINT AND UPDATE ITS DATA</h4>
            <p>To create a new device and update it is quite simple.</p>
            <p>The API call to send the data as a device is identical to update the server. The data will be merged in the current state. Changes will be stored as packets and these packets will represents the history of a device. Each device has an id and the device id only needs to be unique to your own account. The recommended method to start integration is through our HTTPS REST API, although sockets.io is also available.</p>
            <h6>METHOD PATH</h6>
            <pre className="commanderBgPanel">POST {apiCall.path + "/api/v3/data/post"}</pre>
            <h6>BODY DATA ("application/json")</h6>
            
            <SyntaxHighlighter language="javascript" style={tomorrowNightBright}>{JSON.stringify(samplePacket, null, 2)}</SyntaxHighlighter>
            <p>You can make the "id" anything you want as long as it is unique to your account and api key. When sending data you <span className="spot">MUST</span> have a "data" parameter.</p>
            <h4>HOST AND PATH</h4>
            <p>Finally we have to send the query in the right direction.</p>
            <h6>CURL EXAMPLE</h6>
            <p className="commanderBgPanel" id="postSample" >{curlPostSample}</p>
          </div>
          <div className="col-md-12 commanderBgPanel" >
            <h4 className="spot">HOW TO RETRIEVE AN ENDPOINTS STATE</h4>
            <p>This call sends the ID you are interested in, and the server responds with that ID's latest state.</p>
            <h6>METHOD PATH</h6>
            <pre className="commanderBgPanel">POST {apiCall.path + "/api/v3/view"}</pre>
            <h6>BODY DATA ("application/json")</h6>
            
            <SyntaxHighlighter language="javascript" style={tomorrowNightBright}>{JSON.stringify(samplePacket2)}</SyntaxHighlighter>
            <p>The id must already exist on your account.</p>

            <h6>CURL EXAMPLE</h6>
            <p className="commanderBgPanel" >{curlViewSample}</p>
            <h4>RESPONSE</h4>
            <p>The server response will include the data about the latest state of the device. Here is an example:</p>
            <SyntaxHighlighter language="javascript" style={tomorrowNightBright}>{ JSON.stringify(JSON.parse('{"_id":"5b80078bd6033ba3181c1a51",\n"apikey":"'+this.props.apikey+'",\n"devid":"yourDevice001",\n"payload":{"id":"yourDevice001","data":{"temperature":24.54,"doorOpen":false,"gps":{"lat":25.123,"lon":28.125}},"timestamp":"2018-08-27T08:41:31.719Z"},\n"meta":{"user":{},\n"created":{"unix":1535359291719,"jsonTime":"2018-08-27T08:41:31.719Z"},"ip":"::ffff:127.0.0.1","ipLoc":null,"userAgent":"curl/7.58.0","method":"POST"}}'),null,2) }</SyntaxHighlighter>
          </div>
        </div>





        <div className="row" style={this.getMenuPageStyle(3)}>
          <div className="col-md-12 commanderBgPanel" >
            <h4 className="spot">SOCKET.IO</h4>
            <p>This page uses socket.io for real-time connectivity in the browser. This can also be used from the command line.</p>

            <p>Node.js</p>

            <p>Download <a href="https://nodejs.org/en/">Node.js</a> and duplicate the code below in a <b>test.js</b> file. This code will connect to your account and stream data to your terminal. We use this method to keep a connection open to the server and will be ready to receive data when needed. This example will stream data from all your devices if configured correctly.</p>

            <SyntaxHighlighter language='javascript' showLineNumbers={true} style={tomorrowNightBright}>{codeStringRealtimeSocketIo}</SyntaxHighlighter>

            <p>On line 5 you can alternatively connect to a specific device by using the | (pipe) character in between your api key and the device id:</p>
            <SyntaxHighlighter startingLineNumber={5} language='javascript' showLineNumbers={true} style={tomorrowNightBright}>{codeStringRealtimeSocketIoSingleDevice}</SyntaxHighlighter>
            {/* <pre className="commanderBgPanel" >{ 'var socket = require("socket.io-client")("https://prototype.iotnxt.io");\n\nsocket.on("connect", function(data) {\n\tconsole.log("connected.");\n\tsocket.emit("join", "'+this.props.apikey+'"); // your api key\n\n\tsocket.on("post", data => {\n\t\tconsole.log(data);\n\t});\n});' }</pre> */}

            <p>Install the socket.io-client dependency from the same folder.</p>

            <pre className="commanderBgPanel" >$ npm install socket.io-client</pre>

            <p>Run it from the command line.</p>

            <pre className="commanderBgPanel" >$ node test.js<br />
              connected.
            </pre>

            <p>You can now test it by sending some data from a device. Your data should appear in your terminal.</p>

            <p className="commanderBgPanel" id="postSample" >{curlPostSample}</p>


            <SyntaxHighlighter language="javascript" style={tomorrowNightBright}>{codeStringRealtimeSocketIoResult}</SyntaxHighlighter>

            <h4>SENDING DATA</h4>
            
            <p>Once socket.io is connected and you've "joined" using your API key, you can now start sending data. The format of the packet is identical to the HTTP REST post method.</p>

            <SyntaxHighlighter language="javascript" style={tomorrowNightBright}>{'socket.emit("post", {id: "yourDevice001", data: { temperature: 25.0 } } )'}</SyntaxHighlighter>
          </div>
        </div>


        <div className="row" style={this.getMenuPageStyle(4)}>
          <div className="col-md-12 commanderBgPanel" >
            <h4 className="spot">MQTT</h4>
            <p>This code example is for nodejs users, but should be similar for other mqtt clients</p>

            <SyntaxHighlighter language="javascript" style={tomorrowNightBright}>
              { "var mqtt = require('mqtt');\nvar config = { apikey: \""+this.props.apikey+"\" };\nvar client  = mqtt.connect('mqtt://"+window.location.host+"', {username:\"api\", password:\"key-\"+config.apikey});\n\nclient.on('connect', function () {\n\tconsole.log(\"connected.\");\n\n\tclient.subscribe(config.apikey, function (err) {\n\t\tif (err) { console.log(err) }\n\t\tconsole.log(\"subscribed.\")\n\t})\n\n\tsetInterval(()=>{\n\t\tclient.publish(config.apikey, JSON.stringify({id:\"mqttDevice01\", data: { a: Math.random() }}) );\n\t},1000)\n})\n\nclient.on('message', function (topic, message) {\n\tconsole.log(message.toString())\n})"}
            </SyntaxHighlighter>
          </div>
        </div>

        <div className="row" style={this.getMenuPageStyle(5)}>
          <div className="col-md-12 commanderBgPanel" >
            <h4 className="spot">Python</h4>
            <p>This code is for python users </p>

            <SyntaxHighlighter language="python" style={tomorrowNightBright}>
              { 'import json\nimport urllib2\n\t"data" = {\n\t\t"id": "python2device",\n\t\t"data": {\n\t\t\t"temperature": 25.12,\n\t\t\t"doorClosed" : True,\n\t\t\t"movementDetected" : False\n\t\t}\n}\n\nreq = urllib2.Request(http://localhost:8080/api/v3/data/post)\nreq.add_header("Content-Type", "application/json")\nreq.add_header("Authorization", "Basic YXBpOmtleS1tZnJhZGg2ZHJpdmJ5a3o3czRwM3ZseWVsamI4NjY2dg==")\n\nresponse = urllib2.urlopen(req, json.dumps(data))'} 
            </SyntaxHighlighter>

            <SyntaxHighlighter language="python" style={tomorrowNightBright}>
              { 'import json\nimport urllib.request\n\t"data" = {\n\t\t"id": "python3device",\n\t\t"data": {\n\t\t\t"temperature": 25.12,\n\t\t\t"doorClosed" : True,\n\t\t\t"movementDetected" : False\n\t\t}\n}\n\nreq = urllib.request.Request(http://localhost:8080/api/v3/data/post)\nreq.add_header("Content-Type", "application/json")\nreq.add_header("Authorization", "Basic YXBpOmtleS1tZnJhZGg2ZHJpdmJ5a3o3czRwM3ZseWVsamI4NjY2dg==")\n\nresponse = urllib.request.urlopen(req, json.dumps(data).encode("utf8"))'} 
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    );
  }
}
