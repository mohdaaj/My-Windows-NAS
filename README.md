# 🚀 PyNAS: Personal Windows NAS

A lightweight, cool-looking Network Attached Storage (NAS) built with Python and Flask. This app allows you to share specific Windows folders over your local network, making them accessible to your phone, laptop, and Samsung TV via IP address.

## ✨ Features
*   **Modern Web UI:** Dark mode, glassmorphism design.
*   **Dynamic Sharing:** Select folders on your PC to share instantly.
*   **Cross-Device:** Accessible via any browser on the same Wi-Fi.
*   **Windows Optimized:** Built specifically to run as a server on Windows 10/11.

## 🛠️ Tech Stack
*   **Backend:** Python 3.x, Flask
*   **Frontend:** HTML5, CSS3 (Glassmorphism), JavaScript
*   **Tools:** VS Code, Git

## 🚦 Quick Start
1. Clone the repo: `git clone https://github.com/YOUR_USERNAME/My-Windows-NAS.git`
2. Create venv: `python -m venv venv`
3. Activate venv: `.\venv\Scripts\activate`
4. Install requirements: `pip install flask`
5. Run the server: `python app.py`

## 📺 Connecting to Samsung TV
1. Ensure your TV and PC are on the same Wi-Fi.
2. Open the Web Browser on your TV.
3. Type in the IP address shown in the terminal (e.g., `http://192.168.100.15:5000`).