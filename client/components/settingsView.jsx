import React, { Component } from "react";

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave } from '@fortawesome/free-solid-svg-icons'
library.add(faSave)

import { plugins } from "../plugins/config.ts"



export class SettingsView extends React.Component {
  state = { menuList: [] }

  componentDidMount = () => {
    this.getAccount();
  }

  getAccount = () => {
    fetch("/api/v3/account").then(res => res.json()).then(user => {
      if (user.settingsMenuTab) {
        this.setState({ activeMenu: user.settingsMenuTab })
      } else {
        this.setState({ activeMenu: 0 })
      }
    }).catch(err => console.error(err.toString()))
  }

  onClickMenuTab = function (num) {
    return (event) => {
      var activeMenu = num;
      this.setState({ activeMenu })


      fetch("/api/v3/account/update", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ "settingsMenuTab": num })
      }).then(response => {
        response.json()
      }).then(data => {

      }).catch(err => console.error(err.toString()));


    }
  }

  getMenuClasses = function (num) {
    if (num == this.state.activeMenu) {
      return "settingsButton settingsButtonActive"
    } else {
      return "settingsButton settingsButtonInActive"
    }
  }

  genPage = () => {
    if (this.state.activeMenu !== undefined) {
      var SettingsPanel = plugins[this.state.activeMenu].SettingsPanel
      return <SettingsPanel />
    } else {
      return <div>none</div>
    }

  }

  genMenu = () => {
    return (
      <div style={{ padding: 20 }}>
        {
          plugins.map((item, i) => {
            return <div key={i} className={this.getMenuClasses(i)}  onClick={this.onClickMenuTab(i)}>{item.name}</div>
          })
        }
      </div>
    )
  }

  render() {
    return (
      <div style={{ background: "rgba(0,0,0,0.2)", margin: 20, overflow: "hidden" }}>
        <div className="row">
          <div className="col-2" style={{ background: "rgba(0,0,0,0.2)", padding: 20 }} >
            {this.genMenu()}
          </div>

          <div className="col-10" style={{ display: "", padding: "0 20px 0 20px", boxSizing: "border-box" }}>
            {this.genPage()}
          </div>

        </div>
      </div>
    )
  }
}
