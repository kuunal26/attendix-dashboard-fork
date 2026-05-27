
# 📡 Attendix: Decentralized TOTP Attendance System

[![Live Domain](https://img.shields.io/badge/Live-attendix.online-success.svg)](https://attendix.online)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32-blue.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Motoko%20%7C%20Internet%20Computer-purple.svg)]()

Attendix is a highly secure, hardware-backed attendance verification system. It utilizes an ESP32 microcontroller to generate atomic-clock-synced Time-Based One-Time Passwords (TOTP) embedded within QR codes. These dynamic codes are scanned by students and verified against a decentralized backend deployed on the Internet Computer (IC) network.

## ✨ Key Features

* **Dynamic TOTP QR Codes:** Generates a new cryptographically secure token every 20 seconds to prevent screenshot sharing or proxy attendance.
* **Millisecond NTP Sync:** Hardware maintains a non-blocking connection to global atomic clocks (`pool.ntp.org`) ensuring perfect synchronization with the backend validation window.
* **Hardware UX Cues:** Integrated OLED display (SSD1306) for QR rendering and an active buzzer that chirps precisely when the QR code cycles.
* **Baseline Photo Registration:** Frontend captures a master reference selfie of the student to allow for manual face-matching on the faculty dashboard.
* **64-Bit Cryptography:** Hardware-level 64-bit integer processing prevents memory overflow during heavy cryptographic calculations.

---

## 🛠️ Tech Stack

### Hardware (Edge Node)
* **Microcontroller:** ESP32-WROOM-32
* **Display:** 0.96" SSD1306 OLED (I2C)
* **Feedback:** 3V Active Buzzer
* **Firmware:** C++ (Arduino Framework)

### Software & Backend
* **Smart Contracts / Backend:** Motoko (Internet Computer Protocol)
* **Frontend:** React / WebRTC (for Camera/Selfie integration)
* **DNS Routing:** GoDaddy CNAME configuration mapping to IC boundary nodes.

---

## 🔌 Hardware Wiring Diagram

The ESP32 acts as the local motherboard. Ensure components share a common Ground (`GND`).

| Component | Pin Name | ESP32 GPIO | Notes |
| :--- | :--- | :--- | :--- |
| **OLED Display** | VCC | `3V3` | *Strictly 3.3V, do not use 5V* |
| **OLED Display** | GND | `GND` | |
| **OLED Display** | SDA | `GPIO 21` | I2C Data |
| **OLED Display** | SCL | `GPIO 22` | I2C Clock |
| **Active Buzzer**| VCC (+) | `GPIO 23` | Signal & Power |
| **Active Buzzer**| GND (-) | `GND` | |

> **⚠️ PCB Layout Note:** When designing a custom PCB, ensure no copper pours or traces are routed directly underneath the ESP32 Wi-Fi antenna to prevent signal attenuation during NTP syncing.

---

## 🔐 Security Architecture

1. **The Window Fallback:** The TOTP algorithm divides the UNIX epoch into 20-second windows (`epoch / 20`). To account for network latency and camera focus time, the backend accepts tokens from both the *current* and *immediately previous* 20-second block (effectively a 40-second maximum lifespan).
2. **Visual Verification:** A student bypassing the TOTP window must still submit a live selfie via the frontend `getUserMedia` API. This is displayed side-by-side with their baseline registration photo on the faculty dashboard.

---

## 👨‍💻 Author

**Kunal Kuber Dhanawade, Pinak Mandar Dhavale**
* Electronics & Telecommunication Engineering 
* Developer & Hardware Integrator
* Satara, Maharashtra, India

