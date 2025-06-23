**README.md**

# Send to Tech Support – A UXP Panel for Adobe Premiere Pro

**Send to Tech Support** is a lightweight panel extension for Adobe Premiere Pro designed to make it easier for users to report technical issues accurately and efficiently. Built as part of Adobe Innovation Week, this panel helps editors gather key diagnostic information about their editing environment and export it in a clean, copyable format.

> “Because describing your export settings *shouldn’t* be harder than editing your timeline.”

---

## ✨ Features

* 📋 One-click collection of key diagnostic data:

  * Premiere version
  * OS, CPU, GPU/driver info (mocked)
  * RAM and storage type (mocked)
  * Media type, sequence settings, export settings (mocked)

* ✅ Copy to Clipboard

* 📄 Export as `.txt`

* 📆 Download mock project + logs as a `.zip`

---

## 🧪 Current Status

This is an Innovation Week prototype. Data is currently mocked for demonstration purposes, but the panel structure is built to support real API integrations as UXP permissions allow.

---

## 📁 Project Structure

```
send-to-tech-support/
├── manifest.json       # UXP plugin manifest
├── index.html          # Panel UI layout
├── index.js            # Main panel logic
├── styles.css          # Optional custom styling
├── assets/             # Icons or dummy logs
├── README.md           # You're reading it!
```

---

## 🚀 How to Use

1. Clone this repo to your local machine.
2. Open [UXP Developer Tool](https://developer.adobe.com/uxp/devtools/).
3. Load this plugin into Premiere Pro.
4. Open the panel under `Window > Extensions (UXP) > Send to Tech Support`.
5. Click around and watch the magic ✨

---

## 🎯 Future Plans

* Swap mock data with real system/API values as access expands
* Offer optional anonymization of clip/project names
* Add auto-formatting for Reddit, Adobe Forums, or support tickets

---

## 🧑‍💻 Built by

Kylee Peña – Senior Product Marketing Manager, Adobe
This project is a vibes-based exploration of useful utilities for real editors.

