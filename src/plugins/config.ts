export var plugins:any = []

import * as account from "./account/account"
import * as admin from "./admin/admin"
// import * as serialports from "./serialports/serialports"
import * as iotnxt from "./iotnxt/iotnxtserverside"
import * as tcpPlugin from "./tcp/pluginTcp_serverside"
import * as discord from "./discord/discord"
import * as mqttPlugin from "./mqttserver/mqttPlugin"
import * as httpPlugin from "./http/pluginHTTP_serverside"

plugins.push(account)
plugins.push(admin)
// plugins.push(serialports)
plugins.push(iotnxt)
plugins.push(tcpPlugin)
plugins.push(discord);
plugins.push(mqttPlugin);
plugins.push(httpPlugin);