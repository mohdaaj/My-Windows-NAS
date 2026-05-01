from flask import Flask, render_template, send_from_directory
import os
import socket

app = Flask(__name__)

# Change these to the folders you want to share
SHARED_FOLDERS = {
    "Movies": r"C:\Users\Public\Videos",
    "Documents": r"C:\Users\Public\Documents"
}

@app.route("/")
def index():
    return render_template("index.html", folders=SHARED_FOLDERS.keys())

@app.route("/view/<folder_name>")
def view_folder(folder_name):
    path = SHARED_FOLDERS.get(folder_name)
    if not path or not os.path.exists(path):
        return "Folder not found", 404
    files = os.listdir(path)
    return render_template("index.html", files=files, folder_name=folder_name, folders=SHARED_FOLDERS.keys())

@app.route("/download/<folder_name>/<filename>")
def download_file(folder_name, filename):
    directory = SHARED_FOLDERS.get(folder_name)
    return send_from_directory(directory, filename)

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip

if __name__ == "__main__":
    print(f"\n--- NAS SERVER ACTIVE ---")
    print(f"IP Address: http://{get_ip()}:5000")
    print(f"--------------------------\n")
    app.run(host="0.0.0.0", port=5000)
