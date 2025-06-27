**README.md**

# Send to Tech Support – A UXP Panel for Adobe Premiere Pro

**Send to Tech Support** is a lightweight panel extension for Adobe Premiere Pro designed to make it easier for users to report technical issues accurately and efficiently. Built as part of Adobe Innovation Week 2025, this panel helps editors gather key diagnostic information about their editing environment in a clean, copyable format.

> “Because describing your sequence settings *shouldn’t* be harder than editing your timeline.”

---

## ✨ Features

* 📋 One-click collection of key diagnostic data:

  * Premiere version
  * OS and version, CPU, GPU/driver info (GPU is mocked)
  * Sequence settings including frame size and frame rate
  * Media in sequence (mocked)
  * Third party plugins (mocked)

* ✅ Copy to Clipboard

* Upon paste, four additional questions are added for the user to complete when posting for support online.

---

## 🧪 Current Status

This is an Innovation Week prototype. Some data is currently mocked for demonstration purposes, but the panel structure is built to support real API integrations as UXP permissions allow.

---

## 📁 Project Structure

```
send-to-tech-support/
├── manifest.json       # UXP plugin manifest
├── index.html          # Panel UI layout
├── index.js            # Main panel logic
├── styles.css          # Optional custom styling
├── README.md           # You're reading it!
```

---

## 🚀 How to Use

1. Clone this repo to your local machine.
2. Open [UXP Developer Tool](https://developer.adobe.com/uxp/devtools/).
3. Load this plugin into Premiere Pro.
4. Open the panel under `Window > Extensions (UXP) > Send to Tech Support`.
5. Copy to clipboard.
6. Paste!

---

## 🎯 Future Plans

* Swap mock data with real system/API values as access expands
* Add capability to package up a copy of the project, related logs, screenshot, and more.
* Add auto-formatting for Reddit, Adobe Forums, or support tickets

---

## 🧑‍💻 Built by

Kylee Peña – Senior Product Marketing Manager, Adobe
This project is a vibes-based exploration of useful utilities for real editors. It was made with the help of Cursor, ChatGPT, and Claude. 

