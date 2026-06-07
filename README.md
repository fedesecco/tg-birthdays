# tg-birthdays

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Build Bot](https://github.com/fedesecco/tg-birthdays/actions/workflows/build-bot.yml/badge.svg)](https://github.com/fedesecco/tg-birthdays/actions/workflows/build-bot.yml)
[![Build Frontend](https://github.com/fedesecco/tg-birthdays/actions/workflows/build-frontend.yml/badge.svg)](https://github.com/fedesecco/tg-birthdays/actions/workflows/build-frontend.yml)
[![Deploy Frontend](https://github.com/fedesecco/tg-birthdays/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/fedesecco/tg-birthdays/actions/workflows/deploy-frontend.yml)

`tg-birthdays` is a Telegram-based birthday reminder app with a Telegram Mini App frontend for managing contacts and Google birthday sync.

## Features

- Manual contact and birthday management
- Google Contacts birthday sync
- Duplicate detection and merge flow
- Reminder enable/pause setting
- Daily birthday reminder delivery on Telegram

## Architecture And Hosting

The product has two main parts:

- a backend/bot app that sends Telegram reminders and exposes the API
- a Telegram Mini App frontend used for the user-facing flows

Current hosting setup:

- source code on GitHub
- frontend hosted on Netlify
- backend hosted on Google Cloud Run
- scheduled reminder trigger executed by Google Cloud Scheduler calling the backend
