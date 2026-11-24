# SmartPlants

**Green thumb, without lifting a finger.**

SmartPlants is a small DIY system for automatic plant care. An ESP8266 board reads a soil moisture sensor and turns on a water pump when the soil gets too dry. Because the board is modular, you can add sensors for temperature, light and other readings, and send the data to a screen, over Bluetooth or over WiFi.

This repository holds the project's website: a bilingual (Italian and English) landing page that explains how the system works and shows the builds made so far.

**Live:** https://smart-plants.vercel.app

## The hardware

| Build | What it does |
| --- | --- |
| Base | Irrigation driven by a soil moisture sensor |
| Custom | Moisture indicators, a buzzer and a screen |
| Irrigation only | Board, sensor and water pump, for any plant |

Every build starts from the same core: an ESP8266 board, a soil moisture sensor and a small water pump.

## The website

- React 18, Vite and TypeScript
- Tailwind CSS for styling, Framer Motion for animations
- i18next for Italian and English, with Italian as the default
- EmailJS for the contact form
- Deployed on Vercel

### Run it locally

```bash
npm install
npm run dev
```

## Roadmap

The next step is a **live dashboard**: the ESP sends its sensor readings over WiFi, and the web app shows moisture, temperature and light in real time, keeps a history and lets you water a plant remotely. The landing page stays as the public front.
