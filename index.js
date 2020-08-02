/**
 * Copyright 2018 Scott Bender (scott@scottbender.net)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const AisEncode = require("ggencoder").AisEncode
const AisDecode = require("ggencoder").AisDecode

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

var assignedModeFlag = {
  "Autonomous and continuous": 0,
  "Assigned mode": 1
}

var atonTypeMapping = {
  "Default: Type of AtoN not specified": 0,
  "Referece point": 1,
  "RACON": 2,
  "Fixed structure off-shore": 3,
  "Reserved for future use": 4,
  "Fixed light: without sectors": 5,
  "Fixed light: with sectors": 6,
  "Fixed leading light front": 7,
  "Fixed leading light rear": 8,
  "Fixed beacon: cardinal N": 9,
  "Fixed beacon: cardinal E": 10,
  "Fixed beacon: cardinal S": 11,
  "Fixed beacon: cardinal W": 12,
  "Fixed beacon: port hand": 13,
  "Fixed beacon: starboard hand": 14,
  "Fixed beacon: preferred channel port hand": 15,
  "Fixed beacon: preferred channel starboard hand": 16,
  "Fixed beacon: isolated danger": 17,
  "Fixed beacon: safe water": 18,
  "Floating AtoN: cardinal N": 20,
  "Floating AtoN: cardinal E": 21,
  "Floating AtoN: cardinal S": 22,
  "Floating AtoN: cardinal W": 23,
  "Floating AtoN: port hand mark": 24,
  "Floating AtoN: starboard hand mark": 25,
  "Floating AtoN: preferred channel port hand": 26,
  "Floating AtoN: preferred channel starboard hand": 27,
  "Floating AtoN: isolated danger": 28,
  "Floating AtoN: safe water": 29,
  "Floating AtoN: special mark": 30,
  "Floating AtoN: light vessel/LANBY/rigs": 31,
}

module.exports = function(app) {
  var plugin = {
  };
  var n2kCallback = undefined

  plugin.id = "signalk-n2kais-to-nmea0183"
  plugin.name = "N2K AIS to NMEA0183"
  plugin.description = plugin.name

  plugin.schema = {
    type: "object",
    properties: {
      events: {
        type: 'string',
        title: 'NMEA 0183 Out Events',
        default: 'nmea0183out',
        description: 'can be comma separated list'
      },
    }
  }
  
  plugin.start = function(options) {
    let eventsString = options.events || 'nmea0183out'
    let events = eventsString.split(',').map(s => s.trim())
    const myMMSI = app.getSelfPath('mmsi')
    
    app.debug('out events %j', events)

    n2kCallback = (msg) => {
      try {
        var enc_msg = null
        var fields = msg['fields']

        switch ( msg.pgn )
        {
          case 129038:
          {
            if ( fields['AIS Transceiver information'] !== 'Own information not broadcast' ) {
              var rot = fields['Rate of Turn']
              if ( rot !== undefined && rot != 0 )
              {
                var trot = rot < 0 ? rot * -1 : rot
                trot = (4.733 * Math.sqrt(trot * 3437.74677078493)).toFixed(0)
                if ( rot < 0 )
                  trot *= -1
                rot = trot
              }
              enc_msg = {
                aistype: 3, // class A position report
                repeat: 0,
                mmsi: fields['User ID'],
                navstatus: stateMapping[fields['Nav Status']],
              sog: mpsToKn(fields.SOG),
                lon: fields.Longitude,
                lat: fields.Latitude,
                cog: radsToDeg(fields.COG),
                hdg: radsToDeg(fields.Heading),
                rot: rot
              }
            }
          }
          break;
          
          case 129794:
          {
            var type = typeMapping[fields['Type of ship']]
            enc_msg = {
              aistype: 5, //class A static
              repeat: 0,
              mmsi: fields['User ID'],
              mso: fields['IMO number'],
              cargo: type,
              callsign: fields.Callsign,
              shipname: fields.Name,
              draught: fields.Draft/10,
              destination: fields.Destination
            }

            putDimensions(enc_msg,
                          fields["Position reference from Bow"],
                          fields.Length,
                          fields["Position reference from Starboard"],
                          fields.Beam)
          }
          break;

          case 129039:
          {
            //app.debug("MMSI: " + msg.fields['User ID'])

            if (fields['AIS Transceiver information'] !== 'Own information not broadcast' ) {
              enc_msg = {
                aistype: 18, // class B position report
                repeat: 0,
                mmsi: fields['User ID'],
                sog: mpsToKn(fields.SOG),
                accuracy: fields['Position Accuracy'] == "Low" ? 0 : 1, 
                lon: fields.Longitude,
                lat: fields.Latitude,
                cog: radsToDeg(fields.COG),
                hdg: radsToDeg(fields.Heading),
              }
            }
          }
          break;

          case 129809:
          {
            enc_msg = {
              aistype: 24, // class B static
              repeat: 0,
              part: 0,
              mmsi: fields['User ID'],
              shipname: fields.Name
            }
          }
          break;

          case 129810:
          {
            var type = typeMapping[fields['Type of ship']]
            enc_msg = {
              aistype: 24, // class B static
              repeat: 0,
              part: 1,
              mmsi: fields['User ID'],
              cargo: type,
              callsign: fields.Callsign,
            }
            putDimensions(enc_msg,
                          fields["Position reference from Bow"],
                          fields.Length,
                          fields["Position reference from Starboard"],
                          fields.Beam)
          }
          break;

          case 129041:
          {
            var type = atonTypeMapping[fields['AtoN Type']]
            var assigned = assignedModeFlag[fields['Assigned Mode Flag']]
            enc_msg = {
              aistype: 21, // AtoN report
              repeat: 0,
              mmsi: fields['User ID'],
              aid_type: type,
              atonname: fields['AtoN Name'],
              accuracy: msg.fields['Position Accuracy'] == "Low" ? 0 : 1,
              lon: fields.Longitude,
              lat: fields.Latitude,
              off_position: mapFlag(fields["Off Position Indicator"]),
              raim: mapFlag(fields['AIS RAIM flag']),
              virtual_aid: mapFlag(fields['Virtual AtoN Flag']),
              assigned: assigned
            }
            putDimensions(enc_msg,
                          fields["Position reference from Bow"],
                          fields["AtoN Structure Length/Diameter"],
                          fields["Position reference from Starboard"],
                          fields["AtoN Structure Beam/Diameter"])
          }
          break;
        }
        if ( enc_msg )
        {
          if ( myMMSI && fields['User ID'] == myMMSI ) {
            return
          }
          
          app.debug("Data: %o", msg)

          var enc = new AisEncode(enc_msg)
          app.debug("Ais msg: %o", enc_msg)
          var sentence = enc.nmea
          if ( sentence && sentence.length > 0 )
          {
            app.debug("sending: " + sentence)
            events.forEach(name => {
              app.emit(name, sentence)
            })
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    app.on("N2KAnalyzerOut", n2kCallback)
  }

  plugin.stop = function() {
    if ( n2kCallback )
    {
      app.removeListener("N2KAnalyzerOut", n2kCallback)
      n2kCallback = undefined
    }
  }

  return plugin
}
         

function radsToDeg(radians) {
  if ( radians )
    return (radians * 180 / Math.PI).toFixed(0)
  else
    return radians
}

function mpsToKn(mps) {
  if ( mps )
    return 1.9438444924574 * mps
  else
    return mps
}

function mapFlag(flag)
{
  return flag == 'Yes' ? 1 : 0
}

function putDimensions(enc_msg, from_bow, length, from_stbrd, beam)
{
  //debug("putDimensions: " + from_bow + ", " + length + ", " + from_stbrd + ", " + beam)
  if ( from_bow !== undefined )
    enc_msg.dimA = from_bow
  if ( from_bow !== undefined && length !== undefined )
    enc_msg.dimB = length - from_bow
  if ( beam !== undefined && from_stbrd !== undefined )
    enc_msg.dimC = beam - from_stbrd
  if ( from_stbrd !== undefined )
    enc_msg.dimD = from_stbrd
}
