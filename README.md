# signalk-n2kais-to-nmea0183

[![Greenkeeper badge](https://badges.greenkeeper.io/sbender9/signalk-n2kais-to-nmea0183.svg)](https://greenkeeper.io/)

Signal K plugin to convert N2K AIS to NMEA 0183

This does direct conversion from NMEA 2000 AIS messages to NMEA 0183 sentences and makes them available on the node server 0183 TPC port.

You can then get AIS data in apps like iSailor, iNavX, etc.

## Per-group AIS source blacklisting

Output can be split into multiple named event groups, each with its own blacklist of CAN sources — for example, excluding internet-sourced AIS (e.g. from a SignalK-to-SignalK or AIS-over-internet connection) from one output while still sending it to another.

This requires:
- "Use Can NAME in source data" enabled on the N2K connection in Signal K's NMEA 2000 settings
- A Signal K server version that includes the connection's `providerId` on the `N2KAnalyzerOut` event (not yet released upstream at the time of writing)

Without both, the blacklist option will have no effect — AIS messages will still be sent to all configured event groups.

