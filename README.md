# smartthings-kumo
SmartThings Schema connector for Mitsubishi Kumo Cloud.

This provides a SmartThings Schema Connector webserver which exposes Mitsubishi HVACs to SmartThings. 

Kumo support leverages the excellent [kumojs](https://github.com/sushilks/kumojs) package.

## Requirements

* Mitsubishi Kumo Cloud account and [hardware](https://smile.amazon.com/Wireless-Control-Interface-Mitsubishi-PACUSWHS002WF1/dp/B019PBL9W2) installed in your 
HVAC.
* SmartThings developer account

## Currently supported

* Displays state of:
    * current room temperature
    * configured mode
    * configured fan speed
    * configured vent direction
    * current filter state (clean/dirty)
* Allows control of:
    * mode
    * temperature (with heating/cooling setpoints)
    * fan speed
    * vent direction
* Works well with Google Home! (when SmartThings is added to your assistant).
    
* Configuration is currently hardcoded - you'll need to generate a config file using the [kumojs](https://github.com/sushilks/kumojs) instructions.
* I implemented this as a Schema Connector device, which means you need to set up your own device in the SmartThings developer workspace. I couldn't really
follow how DTHs work in the "new" app, and the docs all pointed to this approach. If there's a way to do this as a DTH people can just copy+paste, that'd be
even better.

## Setup

TODO: instructions

## TODO

Note: there is no security on the endpoints currently. Need to fix this as part of #2 below.

1. Graceful error handling/retry
1. Non-hardcoded configuration (i.e. actual login process).