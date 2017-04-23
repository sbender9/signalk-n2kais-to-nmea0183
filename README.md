# signalk-n2kais-to-nmea0183
Signal K provider to convert N2K AIS to NMEA 0183

1. Cd to your node server directory
2. npm install signalk-n2kais-to-nmea0183
3. Install the latest ggencoder: npm install ggencoder
4. Update your settings to include the provider 

This does direct conversion from NMEA 2000 AIS messages to NMEA 0183 sentences and makes them available on the node server 0183 TPC port.

```json
    {
      "id": "actisense",
      "pipeElements": [{
        "type": "providers/execute",
        "options": {
          "command": "actisense-serial /dev/actisense",
          "toChildProcess": "nmea2000out"
        }
      }, {
        "type": "providers/liner"
      }, {
        "type": "providers/n2kAnalyzer"
      }, {
        "type": "signalk-n2kais-to-nmea0183"
      }, {
        "type": "providers/n2k-signalk",
      }]
```
