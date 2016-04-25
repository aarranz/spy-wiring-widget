Spy Wiring widget
======================

The Spy Wiring widget is a WireCloud widget that provides an easy way to inspect the data that travels trough the wiring.

Latest version of this widget is always [provided in FIWARE lab](https://store.lab.fiware.org/search/keyword/KurentoStarterKit) where you can make use of it on the [Mashup portal](https://mashup.lab.fiware.org/)

Build
-----

Be sure to have installed [Node.js](http://node.js) and [Bower](http://bower.io)
in your system. For example, you can install it on Ubuntu and Debian running the
following commands:

```bash
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install nodejs
sudo apt-get install npm
sudo npm install -g bower
```

Install other npm dependencies by running: (need root because some libraries use applications, check package.json before to be sure)

```bash
sudo npm install
```

For build the widget you need download grunt:

```bash
sudo npm install -g grunt-cli
```

And now, you can use grunt:

```bash
grunt
```

If everything goes well, you will find a wgt file in the `build` folder.

## Settings

- `Allow send data`: If this preference is set to true, the widget enters the "allow-send mode" where new events can be created and sent events won't be destroyed.

## Wiring

### Input Endpoints

- `Input`: The data to be analyzed.

### Output Endpoints

- `Output`: The endpoint where the received data will be sent.

## Usage

Plug in the output endpoint you want to spy and it will be displayed on the widget.
If the record mode is activated, data won't be sent forward until the step or run buttons are pressed. While on this mode, data can be edited and the modified data will be sent instead.

If the `Allow send data` preference is set to true, new events can be created through the widget. While on this mode captured events can also be edited. Sent events while on this mode won't be deleted until the drop button is pressed.

The output data will be sent with the type defined by the type selector.

## Copyright and License

Copyright 2015 CoNWeT Lab., Universidad Politecnica de Madrid

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
