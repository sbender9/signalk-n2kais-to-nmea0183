/*
 * Copyright 2016 Teppo Kurki <teppo.kurki@ıki.fi>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const AisEncode = require("ggencoder").AisEncode
const AisDecode = require("ggencoder").AisDecode
const debug = require('debug')('signalk-n2kais-to-nmea0183')
const util = require('util')

const stateMapping = {
  'Under way using engine': 0,
  'At anchor': 1,
  'Not under command': 2,
  'Restricted manoeuverability': 3,
  'Constrained by her draught': 4,
  'Moored': 5,
  'Aground': 6,
  'Engaged in Fishing': 7,
  'Under way sailing': 8,
  'Hazardous material, High Speed': 9,
  'Hazardous material, Wing in Ground': 10,
  'AIS-SART': 14
}


const typeMapping = {
  "unavailable": 0,
  "Wing In Ground": 20,
  "Wing In Ground (no other information)": 29,
  "Fishing": 30,
  "Towing": 31,
  "Towing exceeds 200m or wider than 25m": 32,
  "Engaged in dredging or underwater operations": 33,
  "Engaged in diving operations": 34,
  "Engaged in military operations": 35,
  "Sailing": 36,
  "Pleasur": 37,
  "High speed craft": 40,
  "High speed craft carrying dangerous goods": 41,
  "High speed craft hazard cat B": 42,
  "High speed craft hazard cat C": 43,
  "High speed craft hazard cat D": 44,
  "High speed craft (no additional information": 49,
  "Pilot vessel": 50,
  "SAR": 51,
  "Tug": 52,
  "Port tender": 53,
  "Anti-pollution": 54,
  "Law enforcement": 55,
  "Spare": 56,
  "Spare #2": 57,
  "Medical": 58,
  "RR Resolution No.1": 59,
  "Passenger ship": 60,
  "Passenger ship (no additional information": 69,
  "Cargo ship": 70,
  "Cargo ship carrying dangerous goods": 71,
  "Cargo ship hazard cat B": 72,
  "Cargo ship hazard cat C": 73,
  "Cargo ship hazard cat D": 74,
  "Cargo ship (no additional information": 79,
  "Tanker": 80,
  "Tanker carrying dangerous goods": 81,
  "Tanker hazard cat B": 82,
  "Tanker hazard cat C": 83,
  "Tanker hazard cat D": 84,
  "Tanker (no additional information": 89,
  "Other": 90,
  "Other carrying dangerous goods": 91,
  "Other hazard cat B": 92,
  "Other hazard cat C": 93,
  "Other hazard cat D": 94,
  "Other (no additional information": 99
}

module.exports = function(app) {
  var plugin = {
  };

  plugin.id = "signalk-n2kais-to-nmea0183"
  plugin.name = "SignalK N2K AIS to NMEA0183"
  plugin.description = plugin.name

  plugin.schema = {
    type: "object",
    properties: {}
  }
  
  plugin.start = function(options) {

    app.on("N2KAnalyzerOut", function(msg) {
      try {
        var enc = null
        switch ( msg.pgn )
        {
          case 129038:
          {
            //debug("Data: " + util.inspect(msg, {showHidden: false, depth: 5}))
            rot = msg['fields']['Rate of Turn']
            if ( rot !== undefined && rot != 0 )
            {
              trot = rot < 0 ? rot * -1 : rot
          debug("sqrt: " + Math.sqrt(trot))
              trot = (4.733 * Math.sqrt(trot * 3437.74677078493)).toFixed(0)
              if ( rot < 0 )
                trot *= -1
              rot = trot
            }
            enc = new AisEncode({
              aistype: 3, // class A position report
              repeat: 0,
              mmsi: msg['fields']['User ID'],
              navstatus: stateMapping[msg['fields']['Nav Status']],
              sog: mpsToKn(msg['fields'].SOG),
              lon: msg['fields'].Longitude,
              lat: msg['fields'].Latitude,
              cog: radsToDeg(msg['fields'].COG).toFixed(0),
              hdg: radsToDeg(msg['fields'].Heading).toFixed(0),
              rot: rot
            })
          }
          break;
          
          case 129794:
          {
            type = typeMapping[msg['fields']['Type of ship']]
            enc = new AisEncode({
              aistype: 5, //class A static
              repeat: 0,
              mmsi: msg['fields']['User ID'],
              mso: msg['fields']['IMO number'],
              cargo: type,
              callsign: msg['fields'].Callsign,
              shipname: msg['fields'].Name,
              dimA: msg['fields']["Position reference from Bow"],
              dimB: msg['fields'].Length - msg['fields']["Position reference from Bow"],
              dimC: msg['fields'].Beam - msg['fields']["Position reference from Starboard"],
              dimD: msg['fields']["Position reference from Starboard"],
              draught: msg['fields'].Draft/10,
              destination: msg['fields'].Destination
            })
        
          }
          break;

          case 129039:
          {
            //debug("MMSI: " + msg.fields['User ID'])
            
            enc =  new AisEncode({
              aistype: 18, // class B position report
              repeat: 0,
              mmsi: msg['fields']['User ID'],
              sog: mpsToKn(msg['fields'].SOG),
              accuracy: msg.fields['Position Accuracy'] == "Low" ? 0 : 1, 
              lon: msg['fields'].Longitude,
              lat: msg['fields'].Latitude,
              cog: radsToDeg(msg['fields'].COG).toFixed(0),
              hdg: radsToDeg(msg['fields'].Heading).toFixed(0),
            })
          }
          break;

          case 129809:
          {
            enc =  new AisEncode({
              aistype: 24, // class B static
              repeat: 0,
              part: 0,
              mmsi: msg['fields']['User ID'],
              shipname: msg['fields'].Name
            })
          }
          break;

          case 129810:
          {
            type = typeMapping[msg['fields']['Type of ship']]
            enc =  new AisEncode({
              aistype: 24, // class B static
              repeat: 0,
              part: 1,
              mmsi: msg['fields']['User ID'],
              cargo: type,
              callsign: msg['fields'].Callsign,
              dimA: msg['fields']["Position reference from Bow"],
              dimB: msg['fields'].Length - msg['fields']["Position reference from Bow"],
              dimC: msg['fields'].Beam - msg['fields']["Position reference from Starboard"],
              dimD: msg['fields']["Position reference from Starboard"]
            })
          }
          break;
        }
        if ( enc )
        {
          var sentence = enc.nmea
          //debug("Decoded: " + util.inspect(new AisDecode(sentence, null), {showHidden: false, depth: 5}))
          debug("sending: " + sentence)
          app.emit('nmea0183out', sentence)
        }
      } catch (e) {
        console.error(e)
      }
    })
  }

  plugin.stop = function() {
  }

  return plugin
}
         

function radsToDeg(radians) {
  return radians * 180 / Math.PI
}

function mpsToKn(mps) {
  return 1.9438444924574 * mps
}
