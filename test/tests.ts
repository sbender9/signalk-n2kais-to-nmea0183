import { expect, assert } from 'chai'
import { convert, mpsToKn, radsToDeg, convRot } from '../dist/index'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AisDecode } = require('ggencoder')

const app = { debug: () => {} }
const options = { sendSelf: true }
const events = []

describe('sk-to-nmea2000 tests', () => {
  it(`129038 works`, (done) => {
    const pgn = {
      pgn: 129038,
      prio: 4,
      src: 43,
      dst: 255,
      timestamp: '2017-04-15T14:57:58.726Z',
      description: 'AIS Class A Position Report',
      fields: {
        messageId: 'Scheduled Class A position report',
        repeatIndicator: 'Initial',
        userId: 367515850,
        longitude: -76.3859882,
        latitude: 39.074605,
        positionAccuracy: 'High',
        raim: 'not in use',
        timeStamp: '59',
        cog: 5.6933,
        sog: 2,
        communicationState: 34965,
        aisTransceiverInformation: 'Channel A VDL reception',
        heading: 0.0698,
        rateOfTurn: 10,
        navStatus: 'Under way using engine',
        specialManeuverIndicator: 'Not available',
        reserved: 0,
        spare18: 0,
        reserved19: 0
      }
    }
    const expected = {
      valid: true,
      msglen: 28,
      channel: 'A',
      aistype: 3,
      repeat: 0,
      mmsi: pgn.fields.userId.toString(),
      class: 'A',
      navstatus: 0,
      lon: -76.38598666666667,
      lat: 39.074605,
      //rot: convRot(pgn.fields.rateOfTurn),
      rot: 109,
      sog: 3.8,
      cog: Number(radsToDeg(pgn.fields.cog)),
      hdg: Number(radsToDeg(pgn.fields.heading)),
      utc: 60,
      smi: 0
    }

    try {
      const enc = convert(app, options, 'xxx', [], pgn)

      const dec = { ...new AisDecode(enc.nmea) }

      delete dec.bitarray
      delete dec.payload

      expect(dec).to.deep.equal(expected)

      done()
    } catch (err) {
      done(err)
    }
  })

  it(`129039 works`, (done) => {
    const pgn = {
      pgn: 129039,
      prio: 4,
      src: 43,
      dst: 255,
      timestamp: '2017-04-15T14:57:59.409Z',
      description: 'AIS Class B Position Report',
      fields: {
        messageId: 'Standard Class B position report',
        repeatIndicator: 'Initial',
        userId: 338184312,
        longitude: -76.4640032,
        latitude: 39.0700267,
        positionAccuracy: 'High',
        raim: 'in use',
        timeStamp: '59',
        cog: 2.1206,
        sog: 2.46,
        communicationState: 393222,
        aisTransceiverInformation: 'Own information not broadcast',
        regionalApplication: 0,
        regionalApplicationB: 0,
        unitType: 'CS',
        integratedDisplay: 'No',
        dsc: 'Yes',
        band: 'Entire marine band',
        canHandleMsg22: 'Yes',
        aisMode: 'Autonomous',
        aisCommunicationState: 'ITDMA',
        reserved: 32640
      }
    }

    const expected = {
      valid: true,
      msglen: 28,
      channel: 'A',
      aistype: 18,
      repeat: 0,
      mmsi: '338184312',
      class: 'B',
      status: -1,
      lon: -76.46400166666666,
      lat: 39.070026666666664,
      sog: 4.7,
      cog: 122,
      hdg: 122,
      utc: 56
    }

    try {
      const enc = convert(app, options, 'xxx', [], pgn)

      const dec = { ...new AisDecode(enc.nmea) }

      delete dec.bitarray
      delete dec.payload

      expect(dec).to.deep.equal(expected)

      done()
    } catch (err) {
      done(err)
    }
  })

  it(`129794 works`, (done) => {
    const pgn = {
      pgn: 129794,
      prio: 6,
      src: 43,
      dst: 255,
      timestamp: '2017-04-15T14:58:37.235Z',
      description: 'AIS Class A Static and Voyage Related Data',
      fields: {
        messageId: 'Static and voyage related data',
        repeatIndicator: 'Initial',
        userId: 367307850,
        imoNumber: 0,
        callsign: 'WDD9171',
        name: 'ATLANTIC COAST',
        typeOfShip: 'Tug',
        length: 30,
        beam: 7,
        positionReferenceFromStarboard: 0,
        positionReferenceFromBow: 9,
        etaDate: '2018.03.01',
        etaTime: '06:00:00',
        draft: 4.2,
        destination: 'BALTIMORE',
        aisVersionIndicator: 'ITU-R M.1371-1',
        gnssType: 'GPS',
        dte: 'Available',
        reserved: 0,
        aisTransceiverInformation: 'Channel B VDL reception',
        reserved21: 0
      }
    }

    const expected = {
      valid: true,
      msglen: 71,
      channel: 'A',
      aistype: 5,
      repeat: 0,
      mmsi: '367307850',
      class: 'A',
      imo: 0,
      callsign: 'WDD9171',
      shipname: 'ATLANTIC COAST',
      cargo: 52,
      dimA: 9,
      dimB: 21,
      dimC: 7,
      dimD: 0,
      etaMo: 0,
      etaDay: 0,
      etaHr: 0,
      etaMin: 0,
      draught: 4,
      destination: 'BALTIMORE',
      length: 30,
      width: 7
    }

    try {
      const enc = convert(app, options, 'xxx', [], pgn)

      const dec = { ...new AisDecode(enc.nmea) }

      delete dec.bitarray
      delete dec.payload

      expect(dec).to.deep.equal(expected)

      done()
    } catch (err) {
      done(err)
    }
  })

  it(`129809 works`, (done) => {
    const pgn = {
      pgn: 129809,
      prio: 6,
      src: 43,
      dst: 255,
      timestamp: '2017-04-15T15:00:51.200Z',
      description: 'AIS Class B static data (msg 24 Part A)',
      fields: {
        messageId: 'Static data report',
        repeatIndicator: 'Initial',
        userId: 338184312,
        name: 'WILHELM',
        aisTransceiverInformation: 'Channel A VDL transmission',
        reserved: 0
      }
    }

    const expected = {
      valid: true,
      msglen: 27,
      channel: 'A',
      aistype: 24,
      repeat: 0,
      mmsi: '338184312',
      class: 'B',
      part: 0,
      shipname: 'WILHELM'
    }

    try {
      const enc = convert(app, options, 'xxx', [], pgn)

      const dec = { ...new AisDecode(enc.nmea) }

      delete dec.bitarray
      delete dec.payload

      expect(dec).to.deep.equal(expected)

      done()
    } catch (err) {
      done(err)
    }
  })

  it(`129810 works`, (done) => {
    const pgn = {
      pgn: 129810,
      prio: 6,
      src: 43,
      dst: 255,
      timestamp: '2017-04-15T15:01:01.945Z',
      description: 'AIS Class B static data (msg 24 Part B)',
      fields: {
        messageId: 'Static data report',
        repeatIndicator: 'Initial',
        userId: 338184312,
        typeOfShip: 'Sailing',
        vendorId: 'SMTD*:0',
        length: 9,
        beam: 4,
        positionReferenceFromStarboard: 2,
        positionReferenceFromBow: 6,
        mothershipUserId: 0,
        reserved: 0,
        spare13: 0,
        gnssType: 'Default: undefined',
        aisTransceiverInformation: 'Channel A VDL transmission',
        reserved16: 0
      }
    }

    const expected = {
      valid: true,
      msglen: 28,
      channel: 'A',
      aistype: 24,
      repeat: 0,
      mmsi: '338184312',
      class: 'B',
      part: 1,
      cargo: 36,
      callsign: '',
      dimA: 6,
      dimB: 3,
      dimC: 2,
      dimD: 2,
      length: 9,
      width: 4
    }

    try {
      const enc = convert(app, options, 'xxx', [], pgn)

      const dec = { ...new AisDecode(enc.nmea) }

      delete dec.bitarray
      delete dec.payload

      expect(dec).to.deep.equal(expected)

      done()
    } catch (err) {
      done(err)
    }
  })

  it(`129041 works`, (done) => {
    const pgn = {
      pgn: 129041,
      prio: 4,
      src: 43,
      dst: 255,
      timestamp: '2017-04-15T15:01:08.463Z',
      description: 'AIS Aids to Navigation (AtoN) Report',
      fields: {
        messageId: 'ATON report',
        repeatIndicator: 'Initial',
        userId: 993672309,
        longitude: -76.5269299,
        latitude: 39.2180833,
        positionAccuracy: 'High',
        raim: 'not in use',
        timeStamp: 'Manual input mode',
        atonType: 'Fixed beacon: starboard hand',
        offPositionIndicator: 'No',
        virtualAtonFlag: 'Yes',
        assignedModeFlag: 'Autonomous and continuous',
        spare: 0,
        positionFixingDeviceType: 'Surveyed',
        reserved19: 0,
        atonStatus: 0,
        aisTransceiverInformation: 'Channel B VDL reception',
        reserved22: 0,
        atonName: 'NC'
      }
    }

    const expected = {
      valid: true,
      msglen: 45,
      channel: 'A',
      aistype: 21,
      repeat: 0,
      mmsi: '993672309',
      class: '-',
      aidtype: 0,
      shipname: 'NC',
      lon: -76.52692833333333,
      lat: 39.21808166666667,
      dimA: 0,
      dimB: 0,
      dimC: 0,
      dimD: 0,
      length: 0,
      width: 0,
      utc: 60,
      offpos: 0,
      txt: ''
    }

    try {
      const enc = convert(app, options, 'xxx', [], pgn)

      const dec = { ...new AisDecode(enc.nmea) }

      delete dec.bitarray
      delete dec.payload

      expect(dec).to.deep.equal(expected)

      done()
    } catch (err) {
      done(err)
    }
  })
})
