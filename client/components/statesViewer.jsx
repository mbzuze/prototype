import React, { Component } from "react";

import { confirmAlert } from './react-confirm-alert'; 
import './react-confirm-alert/src/react-confirm-alert.css' 

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSort, faSortNumericDown, faSortAlphaDown, faSortAmountDown } from '@fortawesome/free-solid-svg-icons'
import * as _ from "lodash"

import * as p from "../prototype.ts"

import { StatesViewerMenu } from "./statesViewerMenu.jsx"
import { StatesViewerItem} from "./statesViewerItem.jsx"

library.add(faSort)
library.add(faSortNumericDown);
library.add(faSortAlphaDown);
library.add(faSortAmountDown);


import socketio from "socket.io-client";


export class Pagination extends Component {

  onClick = (button) => {
    return evt => {
      this.props.onPageChange(button)
    }
  }

  calcClass = (button) => {
    if (button.active) {
      return "pagination paginationActive"
    } else {
      return "pagination"
    }

  }

  render() {
    if (this.props.pages.length > 1) {
      return (<div>
        {
          this.props.pages.map((button, i) => <div key={i} onClick={this.onClick(button)} className={this.calcClass(button)} >{button.text}</div>)
        }
      </div>)
    } else {
      return (<div></div>)
    }
  }
}

export class DeviceList extends Component {

  state = {
    activePage: 1
  }

  onPageChange = (data) => {
    this.setState({ activePage: data.text })
  }

  handleActionCall = (a) => {
    return (e) => {
      this.props.actionCall({ a, e })
    }
  }

  render() {

    if (this.props.devices == undefined) {
      return null
    }

    var pagesNum = Math.ceil(this.props.devices.length / this.props.max);


    //if (pagesNum < this.state.activePage) { this.setState({activePage : 1 })}

    var pages = [];
    for (var a = 1; a <= pagesNum; a++) {
      pages.push({ text: a, active: (this.state.activePage == a) });
    }


    if (this.props.devices.length == 0) {
      return (
        <div className="row " style={{ opacity: 0.5 }}>
          <div className="col-12" style={{ padding: "0 5px 0 5px" }}>
            <div className="commanderBgPanel" style={{ margin: 0 }}>
              <center>No devices to display.</center>
            </div>
          </div>
        </div>
      )
    } else {

      var devicelist = _.clone(this.props.devices);

      if (this.props.max) {
        var start = this.props.max * (this.state.activePage - 1)
        var end = this.props.max * this.state.activePage
        devicelist = devicelist.slice(start, end);
      }

      if (devicelist.length == 0) {
        if (this.state.activePage != 1) {
          this.setState({ activePage: 1 })
        }
      }

      return (
        <div>
          {devicelist.map(device => <StatesViewerItem username={this.props.username} actionCall={this.handleActionCall(device.devid)} key={device.key} device={device} devID={device.devid}/>)}
          <div style={{ marginLeft: -9 }}> <Pagination pages={pages} className="row" onPageChange={this.onPageChange} /> </div>
        </div>
      )
    }
  }
}

export class StatesViewer extends Component {
  state = {
    search: "",
    sort: "",
    devicesServer: [],
    devicesView: [],
    checkboxstate: "Select All",
    boxtick: "far fa-check-square",
    publicButton: "",
    deleteButton: "",
    shareButton: "",
    selectedDevices: [],
    selectAllState: null,
  };

  socket = undefined;
  busyGettingNewDevice = false;

  constructor(props) {
    super(props)

    this.socket = socketio();

    this.socket.on("connect", a => {
      console.log("socket connected")
      //this.loadList();
      this.socket.emit("join", this.props.username)
      this.socket.on("info", (info) => {
        console.log(info);
        if (info.newdevice) {
          p.statesByUsername(this.props.username, (states) => {
            for (var s in states) {
              states[s].selected = false
            }
            this.setState({ devicesServer: states }, () => {
      
              for (var device in this.state.devicesServer) {
                this.socket.emit("join", this.state.devicesServer[device].key);
              }
      
              if(this.state.search.length < 1){
                this.setState({ devicesView: states }, () => {
                //this.socketConnectDevices();
                //this.sort();
              })}
            })
          })
        }
      })
      
      this.socket.on("post", (packet) => {
        this.handleDevicePacket(packet)  
      })
    });

    p.statesByUsername(this.props.username, (states) => {
      for (var s in states) {
        states[s].selected = false
      }
      this.setState({ devicesServer: states }, () => {

        for (var device in this.state.devicesServer) {
          this.socket.emit("join", this.state.devicesServer[device].key);
        }

        this.setState({ devicesView: states }, () => {
          //this.socketConnectDevices();
          //this.sort();
        })
      })
    })
  }

  getNewDevice = () => {
    if (this.busyGettingNewDevice == true) {
      console.log("already busy.. please wait")
    } else {
      console.log("getting new device(s)")
      p.statesByUsername(this.props.username, (states) => {
        console.log(states);
      });
    }
  }

  componentWillUnmount = () => { 
    this.socket.disconnect(); 
  }

  handleDevicePacket = (packet) => {
    var devices = _.clone(this.state.devicesServer)
    var found = 0;
    for (var dev in devices) {
      if (devices[dev].devid == packet.id) {
        found = 1;
        devices[dev]["_last_seen"] = packet.timestamp;
        devices[dev].payload = _.merge(devices[dev].payload, packet)        
      }
    }

    if (found == 0) {
      // new device?
      // this.loadList()
      console.log("recieved data for device not on our list yet.")
    } else {
      // update
      if(this.state.search.length > 0){
        this.setState({ devicesServer: devices })
      }else{
        this.setState({ devicesServer: devices })
        this.setState({ devicesView: devices }, () => {
          this.sort()
        })
      }
    }
  }

  // updateDeviceList = () => {
  //   var loadList = _.clone(this.state.devicesView);

  //   this.setState({ devicesServer: loadList })
  //   this.setState({ devicesView: loadList }, () => {
  //     this.sort()
  //   })    

  // }

  search = evt => {
    this.setState({ search: evt.target.value.toString() }, () => {
      var newDeviceList = []
      //filter
      for (var device of this.state.devicesServer) {
        if (this.state.search.length > 0) {
          if (device.devid.toString().toLowerCase().includes(this.state.search.toLowerCase())) {
            newDeviceList.push(device)
          }
        } else {
          newDeviceList.push(device)
        }
      }
      //end filter
      this.setState({ devicesView: newDeviceList }, this.selectCountUpdate)
    })
  }

  sort = (sorttype) => {
    var value;
    if (sorttype != undefined) {
      value = sorttype;
      this.setState({ sort: value })
    } else {
      value = this.state.sort;
    }

    var newDeviceList = _.clone(this.state.devicesView)

    if (value == "timedesc") {
      newDeviceList.sort((a, b) => {
        if (new Date(a["_last_seen"]) > new Date(b["_last_seen"])) {
          return 1
        } else {
          return -1
        }
      }).reverse();
    }

    if (value == "namedesc") {
      newDeviceList.sort((a, b) => {
        if (a.devid >= b.devid) {
          return 1
        } else { return -1 }
      })
    }

    if (value == "") {
      newDeviceList.sort((a, b) => {
        if (new Date(a["_created_on"]) > new Date(b["_created_on"])) {
          return 1
        } else {
          return -1
        }
      }).reverse();
    }

    this.setState({ devicesView: newDeviceList }, this.selectCountUpdate)

  }

  selectCountUpdate = () => {
    var selectCount = 0;
    for (var dev in this.state.devicesView) {
      if (this.state.devicesView[dev].selected) {
        selectCount++;
      }
    }
    this.setState({selectCount : selectCount})
  }

  selectAll = (value) => {
    var newDeviceList = _.clone(this.state.devicesView)

    if (value == true) {
      for (var dev in newDeviceList) {
        newDeviceList[dev].selected = true;
        this.state.selectedDevices.push(newDeviceList[dev].devid);
      }
      this.setState({ devicesView: newDeviceList }, this.selectCountUpdate)
      this.setState({ selectAllState: true });
    }
    if (value == false) {
      
      for (var dev in newDeviceList) {
        newDeviceList[dev].selected = false;
        this.state.selectedDevices.pop(newDeviceList[dev].devid);
      }
      this.setState({ devicesView: newDeviceList }, this.selectCountUpdate)
      this.setState({ selectAllState: false });
    }
  }

  handleActionCall = (clickdata) => {
    var newDeviceList = _.clone(this.state.devicesView)
    
    for (var dev in newDeviceList) {
      if (newDeviceList[dev].devid == clickdata.a) {
        if (clickdata.e == "deselect") {
          if(this.state.selectAllState === true){
            this.setState({ selectAllState: false });
          }
          newDeviceList[dev].selected = false;
        }
        if (clickdata.e == "select") { 
          newDeviceList[dev].selected = true; 
        }
      }
    }
    
    this.setState({ devicesView: newDeviceList } , this.selectCountUpdate );
  }

  deleteSelectedDevices = () => { 
    var devicesToDelete= this.state.devicesServer.filter( (device) => { return device.selected == true; })

    for (var dev in devicesToDelete) {
      if(devicesToDelete[dev].selected === true){
        fetch("/api/v3/state/delete", {
          method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ id: devicesToDelete[dev].devid })
        }).then(response => response.json()).then(serverresponse => {
            console.log(serverresponse)             
        }).catch(err => console.error(err.toString()));
      }   
    }

    // -------------------------------
    var devicesServerTemp = this.state.devicesServer.filter( (device) => { return device.selected == false; })
    var devicesViewTemp = this.state.devicesView.filter( (device) => { return device.selected == false; })
    this.setState({devicesView:devicesViewTemp, devicesServer:devicesServerTemp}, this.selectCountUpdate)
  }

  render() {
    if (this.state.deleted == true) {
      return (<div style={{ display: "none" }}></div>);
    } else {
      return (
        <div className="" style={{ paddingTop: 25, margin: 30 }} >
          {/* <span>username: {this.props.username}</span> */}
          <StatesViewerMenu search={this.search} selectAll={this.selectAll} devices={this.state.devicesView} sort={this.sort} selectCount={this.state.selectCount} deleteSelected={this.deleteSelectedDevices}/>
          <DeviceList username={this.props.username} devices={this.state.devicesView} max={15} actionCall={this.handleActionCall} />
        </div>
      )
    }
  }
}
