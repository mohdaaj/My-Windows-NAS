from flask import Flask, render_template, send_from_directory, abort, request, redirect, url_for, jsonify
import json
import os
import socket
import string
from datetime import datetime

app = Flask(__name__)

CONFIG_FILE = "shared_folders.json"
DEFAULT_SHARED_FOLDERS = {
    "Movies": r"C:\Users\Public\Videos",
    "Documents": r"C:\Users\Public\Documents"
}


def load_shared_folders():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as config_file:
                data = json.load(config_file)
                if isinstance(data, dict):
                    return data
        except Exception:
            pass
    return DEFAULT_SHARED_FOLDERS.copy()


def save_shared_folders(folders):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as config_file:
            json.dump(folders, config_file, indent=4)
    except Exception:
        pass


def list_root_drives():
    drives = []
    for letter in string.ascii_uppercase:
        drive = f"{letter}:\\"
        if os.path.exists(drive):
            drives.append(drive)
    return drives


SHARED_FOLDERS = load_shared_folders()

FILE_ICONS = {
    "mp4": "fa-file-video",
    "mkv": "fa-file-video",
    "mov": "fa-file-video",
    "avi": "fa-file-video",
    "jpg": "fa-file-image",
    "jpeg": "fa-file-image",
    "png": "fa-file-image",
    "gif": "fa-file-image",
    "pdf": "fa-file-pdf",
    "doc": "fa-file-word",
    "docx": "fa-file-word",
    "xls": "fa-file-excel",
    "xlsx": "fa-file-excel",
    "ppt": "fa-file-powerpoint",
    "pptx": "fa-file-powerpoint",
    "zip": "fa-file-zipper",
    "rar": "fa-file-zipper",
    "txt": "fa-file-lines",
    "csv": "fa-file-csv",
    "json": "fa-file-code",
    "py": "fa-file-code",
}

CATEGORY_LABELS = {
    "video": {"icon": "fa-file-video", "label": "Video"},
    "image": {"icon": "fa-file-image", "label": "Image"},
    "document": {"icon": "fa-file-lines", "label": "Document"},
    "archive": {"icon": "fa-file-zipper", "label": "Archive"},
    "code": {"icon": "fa-file-code", "label": "Code"},
}


def format_size(bytes_size):
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if bytes_size < 1024:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024
    return f"{bytes_size:.1f} PB"


def format_date(timestamp):
    return datetime.fromtimestamp(timestamp).strftime("%b %d, %Y")


def file_icon(filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    return FILE_ICONS.get(ext, "fa-file")


def file_category(filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext in {"mp4", "mkv", "mov", "avi"}:
        return CATEGORY_LABELS["video"]
    if ext in {"jpg", "jpeg", "png", "gif", "bmp", "svg"}:
        return CATEGORY_LABELS["image"]
    if ext in {"pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv"}:
        return CATEGORY_LABELS["document"]
    if ext in {"zip", "rar", "7z", "tar", "gz"}:
        return CATEGORY_LABELS["archive"]
    if ext in {"py", "js", "css", "html", "json", "yml", "yaml", "md"}:
        return CATEGORY_LABELS["code"]
    return {"icon": "fa-file", "label": ext.upper() or "File"}


def build_folder_stats():
    stats = {}
    for name, path in SHARED_FOLDERS.items():
        count = 0
        try:
            count = len([f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))])
        except Exception:
            count = 0
        stats[name] = count
    return stats


@app.route("/")
def index():
    return render_template(
        "index.html",
        folders=SHARED_FOLDERS.keys(),
        folder_stats=build_folder_stats(),
        folder_name=None,
        files=[],
        total_size=None,
        default_folders=DEFAULT_SHARED_FOLDERS.keys(),
        message=request.args.get("message", ""),
        message_type=request.args.get("message_type", "success"),
    )


@app.route("/view/<folder_name>")
def view_folder(folder_name):
    path = SHARED_FOLDERS.get(folder_name)
    if not path or not os.path.exists(path):
        abort(404)

    files = []
    total_size = 0

    for name in sorted(os.listdir(path), key=lambda n: n.lower()):
        full_path = os.path.join(path, name)
        if not os.path.isfile(full_path):
            continue
        size = os.path.getsize(full_path)
        mtime = os.path.getmtime(full_path)
        total_size += size
        category = file_category(name)
        files.append(
            {
                "name": name,
                "size": format_size(size),
                "modified": format_date(mtime),
                "icon": file_icon(name),
                "type": category["label"],
                "category_icon": category["icon"],
            }
        )

    return render_template(
        "index.html",
        files=files,
        folder_name=folder_name,
        folders=SHARED_FOLDERS.keys(),
        folder_stats=build_folder_stats(),
        total_size=format_size(total_size) if total_size else "0 B",
        default_folders=DEFAULT_SHARED_FOLDERS.keys(),
        message="",
        message_type="success",
    )


@app.route("/download/<folder_name>/<path:filename>")
def download_file(folder_name, filename):
    directory = SHARED_FOLDERS.get(folder_name)
    if not directory or not os.path.exists(directory):
        abort(404)
    return send_from_directory(directory, filename, as_attachment=True)


@app.route("/browse-folders")
def browse_folders():
    requested_path = request.args.get("path", "")
    if requested_path:
        norm_path = os.path.abspath(requested_path)
        if os.path.isdir(norm_path):
            try:
                entries = [entry for entry in os.listdir(norm_path) if os.path.isdir(os.path.join(norm_path, entry))]
                entries.sort(key=str.lower)
                parent = os.path.dirname(norm_path)
                if parent == norm_path:
                    parent = ""
                return jsonify({"path": norm_path, "entries": entries, "parent": parent})
            except OSError:
                pass

    drives = list_root_drives()
    return jsonify({"path": "", "entries": drives, "parent": ""})


@app.route("/add-folder", methods=["POST"])
def add_folder():
    folder_name = request.form.get("folder_name", "").strip()
    folder_path = request.form.get("folder_path", "").strip()

    if not folder_name or not folder_path:
        return redirect(url_for("index", message="Enter both folder name and path.", message_type="error"))

    if folder_name in SHARED_FOLDERS:
        return redirect(url_for("index", message="Folder name already exists.", message_type="error"))

    folder_path = os.path.abspath(folder_path)
    if not os.path.isdir(folder_path):
        return redirect(url_for("index", message="Invalid folder path.", message_type="error"))

    if folder_path in SHARED_FOLDERS.values():
        return redirect(url_for("index", message="Folder path is already shared.", message_type="error"))

    SHARED_FOLDERS[folder_name] = folder_path
    save_shared_folders(SHARED_FOLDERS)
    return redirect(url_for("index", message="Folder added successfully.", message_type="success"))


@app.route("/remove-folder/<folder_name>", methods=["POST"])
def remove_folder(folder_name):
    if folder_name in SHARED_FOLDERS and folder_name not in DEFAULT_SHARED_FOLDERS:
        SHARED_FOLDERS.pop(folder_name, None)
        save_shared_folders(SHARED_FOLDERS)
        return redirect(url_for("index", message="Folder removed successfully.", message_type="success"))
    return redirect(url_for("index", message="Cannot remove default folder.", message_type="error"))


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
