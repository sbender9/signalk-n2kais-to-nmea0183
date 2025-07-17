/* eslint-disable @typescript-eslint/no-explicit-any */
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

import {
  PGN,
  PGN_129038,
  PGN_129794,
  PGN_129039,
  PGN_129809,
  PGN_129810,
  PGN_129041,
  YesNo,
  PositionAccuracy,
  AisTransceiver,
  RaimFlag,
  NavStatusValues,
  ShipTypeValues,
  AisAssignedModeValues,
  AtonTypeValues,
  convertNamesToCamel
} from '@canboat/ts-pgns'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AisEncode } = require('ggencoder')

export default function (app: any) {
  const plugin: any = {}
  let n2kCallback: any = undefined

  plugin.id = 'signalk-n2kais-to-nmea0183'
  plugin.name = 'N2K AIS to NMEA0183'
  plugin.description = plugin.name

  plugin.schema = {
    type: 'object',
    properties: {
      events: {
        type: 'string',
        title: 'NMEA 0183 Out Events',
        default: 'nmea0183out',
        description: 'can be comma separated list'
      },
      sendSelf: {
        type: 'boolean',
        title: 'Send self data',
        default: false
      }
    }
  }

  plugin.start = function (options: any) {
    const eventsString = options.events || 'nmea0183out'
    const events = eventsString.split(',').map((s: string) => s.trim())
    const myMMSI = app.getSelfPath('mmsi')

    app.debug('out events %j', events)

    n2kCallback = (msg: PGN) => {
      const enc = convert(app, options, myMMSI, msg)

      if (enc) {
        const sentence = enc.nmea
        if (sentence && sentence.length > 0) {
          app.debug('sending: ' + sentence)
          events.forEach((name: string) => {
            app.emit(name, sentence)
          })
          if (app.reportOutputMessages) {
            app.reportOutputMessages(events.length)
          }
        }
      }
    }

    app.on('N2KAnalyzerOut', n2kCallback)
  }

  plugin.stop = function () {
    if (n2kCallback) {
      app.removeListener('N2KAnalyzerOut', n2kCallback)
      n2kCallback = undefined
    }
  }

  return plugin
}

export function convert(
  app: any,
  options: any,
  myMMSI: string,
  msg: any
) {
  try {
    let enc_msg: any = null
    let userId

    switch (msg.pgn) {
      case 129038:
        {
          const pgn: PGN_129038 = convertNamesToCamel(app, msg) as PGN_129038
          userId = pgn.fields.userId
          app.debug('MMSI: ' + userId)

          if (
            pgn.fields.aisTransceiverInformation !==
              AisTransceiver.OwnInformationNotBroadcast ||
            options.sendSelf
          ) {
            enc_msg = {
              aistype: 3, // class A position report
              repeat: 0,
              mmsi: pgn.fields.userId,
              navstatus:
                pgn.fields.navStatus !== undefined
                  ? NavStatusValues[
                      pgn.fields.navStatus as keyof typeof NavStatusValues
                    ]
                  : undefined,
              sog: mpsToKn(pgn.fields.sog),
              lon: pgn.fields.longitude,
              lat: pgn.fields.latitude,
              cog: radsToDeg(pgn.fields.cog),
              hdg: radsToDeg(pgn.fields.heading),
              rot: convRot(pgn.fields.rateOfTurn)
            }
          }
        }
        break

      case 129794:
        {
          const pgn: PGN_129794 = convertNamesToCamel(app, msg) as PGN_129794
          userId = pgn.fields.userId
          const type =
            pgn.fields.typeOfShip !== undefined
              ? ShipTypeValues[pgn.fields.typeOfShip]
              : undefined
          enc_msg = {
            aistype: 5, //class A static
            repeat: 0,
            mmsi: pgn.fields.userId,
            imo: pgn.fields.imoNumber,
            cargo: type,
            callsign: pgn.fields.callsign,
            shipname: pgn.fields.name,
            destination: pgn.fields.destination
          }
          if (pgn.fields.draft !== undefined) {
            enc_msg.draught = pgn.fields.draft / 10
          }

          putDimensions(
            enc_msg,
            pgn.fields.positionReferenceFromBow,
            pgn.fields.length,
            pgn.fields.positionReferenceFromStarboard,
            pgn.fields.beam
          )
        }
        break

      case 129039:
        {
          const pgn: PGN_129039 = convertNamesToCamel(app, msg) as PGN_129039
          userId = pgn.fields.userId
          app.debug('MMSI: ' + pgn.fields.userId)

          if (
            pgn.fields.aisTransceiverInformation !==
              AisTransceiver.OwnInformationNotBroadcast ||
            options.sendSelf
          ) {
            enc_msg = {
              aistype: 18, // class B position report
              repeat: 0,
              mmsi: pgn.fields.userId,
              sog: mpsToKn(pgn.fields.sog),
              accuracy:
                pgn.fields.positionAccuracy == PositionAccuracy.Low ? 0 : 1,
              lon: pgn.fields.longitude,
              lat: pgn.fields.latitude,
              cog: radsToDeg(pgn.fields.cog),
              hdg: radsToDeg(pgn.fields.heading)
            }
          }
        }
        break

      case 129809:
        {
          const pgn: PGN_129809 = convertNamesToCamel(app, msg) as PGN_129809
          userId = pgn.fields.userId
          enc_msg = {
            aistype: 24, // class B static
            repeat: 0,
            part: 0,
            mmsi: pgn.fields.userId,
            shipname: pgn.fields.name
          }
        }
        break

      case 129810:
        {
          const pgn: PGN_129810 = convertNamesToCamel(app, msg) as PGN_129810
          userId = pgn.fields.userId
          const type =
            pgn.fields.typeOfShip !== undefined
              ? ShipTypeValues[pgn.fields.typeOfShip]
              : undefined
          enc_msg = {
            aistype: 24, // class B static
            repeat: 0,
            part: 1,
            mmsi: pgn.fields.userId,
            cargo: type,
            callsign: pgn.fields.callsign
          }
          putDimensions(
            enc_msg,
            pgn.fields.positionReferenceFromBow,
            pgn.fields.length,
            pgn.fields.positionReferenceFromStarboard,
            pgn.fields.beam
          )
        }
        break

      case 129041:
        {
          const pgn: PGN_129041 = convertNamesToCamel(app, msg) as PGN_129041
          userId = pgn.fields.userId
          const type =
            pgn.fields.atonType !== undefined
              ? AtonTypeValues[pgn.fields.atonType]
              : undefined
          const assigned =
            AisAssignedModeValues[
              pgn.fields
                .assignedModeFlag as unknown as keyof typeof AisAssignedModeValues
            ]
          enc_msg = {
            aistype: 21, // AtoN report
            repeat: 0,
            mmsi: pgn.fields.userId,
            aid_type: type,
            atonname: pgn.fields.atonName,
            accuracy:
              pgn.fields.positionAccuracy == PositionAccuracy.Low ? 0 : 1,
            lon: pgn.fields.longitude,
            lat: pgn.fields.latitude,
            off_position: mapFlag(pgn.fields.offPositionIndicator),
            raim: pgn.fields.raim === RaimFlag.InUse ? 1 : 0,
            virtual_aid: mapFlag(pgn.fields.virtualAtonFlag),
            assigned: assigned
          }
          putDimensions(
            enc_msg,
            pgn.fields.positionReferenceFromTrueNorthFacingEdge,
            pgn.fields.lengthDiameter,
            pgn.fields.positionReferenceFromStarboardEdge,
            pgn.fields.beamDiameter
          )
        }
        break
    }
    if (enc_msg) {
      if (!options.sendSelf && myMMSI && userId == myMMSI) {
        return
      }

      return new AisEncode(enc_msg)
    }
  } catch (e) {
    console.error(e)
  }
}

export function convRot(rot?: number) {
  if (rot !== undefined && rot != 0) {
    let trot = rot < 0 ? rot * -1 : rot
    trot = 4.733 * Math.sqrt(trot * 3437.74677078493)
    if (rot < 0) trot *= -1
    return trot
  }
}

export function radsToDeg(radians: number | undefined) {
  if (radians) return ((radians * 180) / Math.PI).toFixed(0)
  else return radians
}

export function mpsToKn(mps: number | undefined) {
  if (mps) return 1.9438444924574 * mps
  else return mps
}

function mapFlag(flag: YesNo | number) {
  return flag == YesNo.Yes ? 1 : 0
}

function putDimensions(
  enc_msg: any,
  from_bow?: number,
  length?: number,
  from_stbrd?: number,
  beam?: number
) {
  //debug("putDimensions: " + from_bow + ", " + length + ", " + from_stbrd + ", " + beam)
  if (from_bow !== undefined) enc_msg.dimA = from_bow
  if (from_bow !== undefined && length !== undefined)
    enc_msg.dimB = length - from_bow
  if (beam !== undefined && from_stbrd !== undefined)
    enc_msg.dimC = beam - from_stbrd
  if (from_stbrd !== undefined) enc_msg.dimD = from_stbrd
}
