import React, { Component } from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import { Stats } from "./stats.jsx"

import SyntaxHighlighter from "react-syntax-highlighter";
import { tomorrowNightBright } from "react-syntax-highlighter/styles/hljs";
import * as _ from "lodash"
import { confirmAlert } from 'react-confirm-alert';
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faHdd, faEraser } from "@fortawesome/free-solid-svg-icons";
import { DevicePluginPanel } from "../plugins/iotnxt/iotnxt_device.jsx";
import Modal from 'react-modal';
import { DataView } from "./dataView.jsx"

import moment from 'moment'

library.add(faHdd);
library.add(faTrash);
library.add(faEraser);


import * as p from "../prototype.ts"


import socketio from "socket.io-client";




import { Dashboard } from "./dashboard/dashboard.jsx"
import { Editor } from "./editor.jsx"

const customStyles = {
  content : {
 top                   : '50%',
    left                  : '50%',
    right                 : '50%',
    bottom                : 'auto',
    marginRight           : '-50%',
transform             : 'translate(-50%, -50%)',

    background : "rgba(3, 4, 5, 0.9)",
  
  },
 
};

export class DeviceView extends Component {
  state = {
    devid: undefined,
    lastTimestamp: "no idea",
    packets: [],
    socketDataIn: {},
    getPackets: false,
    trashClicked: 0,
    trashButtonText: "DELETE DEVICE",
    clearStateClicked: 0,
    eraseButtonText: "CLEAR STATE",
    sharebuttonText: "SHARE DEVICE",
    view: undefined,
    apiMenu: 1,
    isOpen:false,
    stats:{},
    tempstat:[],
    search:"",
    isOpen:false,
    userSearched: "Search For users above"
  };

  socket;

  constructor(props) {
    super(props);
    this.socket = socketio();
    this.state.devid = props.devid
    this.socket.on("connect", a => {
      this.socket.on("post", (packet) => {
        this.updateView(packet)
      })
    });
  }
search = evt => {
    this.setState({ search: evt.target.value.toString()}, () => {
    var temp = []; 
    var newDeviceList = [];
    this.state.stats.users24hList.map((person,i) =>{ 
      temp=[...temp, person.email]
             if (person.email.toLowerCase().includes(this.state.search.toLowerCase())) {
        newDeviceList.push(person.email);
           }   else {
          newDeviceList.push("|");
                }
    });
      temp=newDeviceList.filter((users) =>{ return users !== "|"})
                  this.setState({ z: temp })
                     console.log(temp);
   })
}
   userNameList = () => {
    
    try {
      return (<div>
        {
this.state.z.map( (user, i) =>{
     return <Link key={i} to={""} >  <div className="commanderBgPanel commanderBgPanelClickable">{ user }</div> <br></br>   </Link>
          })
        }
      </div>)
    } catch (err) {}
  }

  updateView = (packet) => {
    var view = _.clone(this.state.view);
    view = _.merge(view, packet)
    
    // should be same as DB.states for this device.
    var state = _.clone(this.state.state);
    state.payload = _.merge(state.payload, packet);
    state["_last_seen"] = packet.timestamp;
    this.setState({ view, state })
  }

  updateTime = () => {
    if (this.state.view) {
      if (this.state.view.timestamp) {
        var timeago = moment(this.state.view.timestamp).fromNow()
        this.setState({ timeago })
      }
    }
  }

  componentWillMount(){
    Modal.setAppElement('body');
      fetch("/api/v3/stats", {
      method: "GET", headers: { "Accept": "application/json", "Content-Type": "application/json" }
    }).then(response => response.json()).then(stats => {      
      this.setState({stats: stats})
     }).catch(err => console.error(err.toString()));
  }

  componentDidMount = () => {
    this.updateTime();
    setInterval(() => {
      this.updateTime();
    }, 500)

    p.getView(this.props.devid, (view) => {
      this.setState({ view })
    })

    p.getState(this.props.devid, (state) => {
      this.setState({ state }, ()=>{
        this.socket.emit("join", state.key)
      })      
    })
    

  }

  componentWillUnmount = () => {
    this.socket.disconnect();
  }

  getName() {
    return "device name/id";
  }

  latestTimestamp() {
    return "no idea";
  }

  deleteDevice = (id) => {
    // deletes a device's state and packet history
    if (this.state.trashClicked >= 0) {
      this.setState({ trashClicked: 1 })
      confirmAlert({
        customUI: ({ onClose }) => {
          return (
            <div className='protoPopup'>
              <h1>Are you sure?</h1>
              <p>Deleting a device is irreversible</p>
              <button onClick={onClose}>No</button>
              
              <button onClick={() => {
                  //this.handleClickDelete()
                  {fetch("/api/v3/state/delete", {
                    method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify({ id: id })
                  }).then(response => response.json()).then(serverresponse => {
                    console.log(serverresponse);
                    window.location.href = "/"
                  }).catch(err => console.error(err.toString()));}
              }}>Yes, Delete it!</button>
            </div>
          )
        }
      })
      return;
    }
  };

  dialog() {
    if (this.state.dialog) {
      return (
        <div className="container" style={{ color: "red" }}>
        </div>
      );
    }
}

  getMenuClasses = function (num) {
    if (num == this.state.apiMenu) {
      return "menuTab borderTopSpot"
    } else {
      return "menuTab menuSelectable"
    }
  }

  getMenuPageStyle = function (num) {
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
      this.setState({ apiMenu });
      this.forceUpdate();


    }
  }

  clearState = () => {
    //clears state, but retains history and workflow
    var idlocal = this.state.devid;

    if (this.state.clearStateClicked >= 0) {
      this.setState({ clearStateClicked: 1 });
      confirmAlert({
        customUI: ({ onClose }) => {
          return (
            <div className='protoPopup'>
              <h1>Are you sure?</h1>
              <p>Clearing A State is irreversible</p>
              <button onClick={onClose}>No</button>
              
              <button onClick={() => {
                  //this.handleClickDelete()
                  {fetch("/api/v3/state/clear", {
                    method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify({ id: idlocal })
                  }).then(response => response.json()).then(serverresponse => {
                    console.log(serverresponse);
                    window.location.reload()
                  }).catch(err => console.error(err.toString()));}
              }}>Yes, Clear it!</button>
            </div>
          )
        }
      })
      return;
    }
  };

  toggleModal = () => {
    this.setState({isOpen:!this.state.isOpen})
  }

  drawState = () => {
    if (this.state.state) {
      return ( 
        <div  style={{ maxWidth: "400px", overflow: "hidden", margin:0, padding:0 }}>

          <SyntaxHighlighter language="javascript" style={tomorrowNightBright} >{JSON.stringify(this.state.state.payload, null, 2)}</SyntaxHighlighter>

          {/* <pre className="commanderBgPanel" style={{ fontSize: "10px", padding: 5, margin: 0}}>
            {JSON.stringify(this.state.state, null, 2)}
          </pre>           */}
        </div>
      )
    } else {
      return (
        <div></div>
      )
    }
    
  }

  render() {
    var devid = "loading";
    var lastTimestamp = "";
    var packets = [];
    var socketDataIn = "socketDataIn";
    //console.log(this.props);

    var latestState = {};

    let plugins;

    if (this.state.view) {
      latestState = this.state.view;

      if (this.state.view.id) {
        plugins = <DevicePluginPanel stateId={this.state.view.id} />;
      } else {
        plugins = <p>plugins loading</p>;
      }
    }

    if (this.state.packets) {
      packets = this.state.packets;
    }

    return (
     <div>
        <div className="container-fluid protoMenu commanderBgPanel" style={{ margin: 10 }}>
          <div className="row" style={{ marginBottom: 10, paddingBottom: 1 }}>

            <div className="col">
                <h3>{this.state.devid}</h3>
                <span className="faded" >{this.state.timeago}</span>
            </div>

            <div className="col" style={{ flex: "0 0 400px", padding: 0 }}>
              <div className="commanderBgPanel commanderBgPanelClickable" style={{ width: 130, float: "right",fontSize:10,marginRight: 10,marginLeft: 3 }} onClick={this.deleteDevice}>
                <FontAwesomeIcon icon="trash" /> {this.state.trashButtonText}
              </div>

              <div className="commanderBgPanel commanderBgPanelClickable" style={{ width: 122, float: "right",fontSize:10 }} onClick={this.clearState}>
                <FontAwesomeIcon icon="eraser" /> {this.state.eraseButtonText}
              </div>

                          <div className="commanderBgPanel commanderBgPanelClickable" style={{ width: 125, float: "left", marginRight: 10,fontSize:10 }} onClick={this.toggleModal}>
                
              <i className="fas fa-share-alt"></i> {this.state.sharebuttonText}
              </div>
              <div ><center>
              <Modal style={customStyles}  isOpen={this.state.isOpen} onRequestClose={this.toggle}><i className="fas fa-times" onClick={this.toggleModal} style={{color:"red"}}></i> 
                 <center style={{color:"white"}}>
                Search For users to share  with<br></br>
                
                  <div style={{color:"white"}}><i className="fas fa-search" style={{color:"white"}}></i> <input  type="text" name="search" placeholder=" By email" onChange={this.search} /></div></center><br></br>
                        <br></br>  
                      {this.userNameList()}   
                  </Modal>
                  </center>
                  </div>
            </div>
          </div>
          
          
          <div className="row" >            
            <div className="col" style={{ flex: "0 0 400px" }} >
              <div>
                <div style={{marginBottom : 20 }}>
                  <h4 className="spot">DEVICE DATA</h4>
                  <DataView data={ this.state.state  } />
                </div>
                
                <div>
                  <h4 className="spot">LATEST STATE</h4>
                  { this.drawState() }
                </div>

                <div>
                  <h4 className="spot">PLUGINS</h4>
                  {plugins}
                </div>                
              </div>              
            </div>

            <div className="col" >
              <h4 className="spot">DASHBOARD</h4>
              <div style={{ backgroundColor: "transparent" }}>
                <Dashboard state={this.state.state} />
              </div>

              <h4 className="spot">PROCESSING</h4>
              <div>
                  <Editor state={this.state.state} /> 
              </div>              
            </div>
          </div>
        </div>
      </div>
    );
  }
}