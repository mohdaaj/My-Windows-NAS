from flask import Flask, render_template, send_from_directory, abort, request, redirect, url_for
import json
import os
import socket
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
CONFIG_FILE = "shared_folders.json"
DEFAULT_SHARED_FOLDERS = {
    "Movies": r"C:\Users\Public\Videos",
    "Documents": r"C:\Users\Public\Documents"
}

VIDEO_EXTENSIONS = {"mp4", "mkv", "mov", "avi", "webm"}


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


def normalize_folder_name(name):
    return name.replace("/", "").replace("\\", "").strip()


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
    return {
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
    }.get(ext, "fa-file")


def file_category(filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext in VIDEO_EXTENSIONS:
        return {"icon": "fa-file-video", "label": "Video"}
    if ext in {"jpg", "jpeg", "png", "gif", "bmp", "svg"}:
        return {"icon": "fa-file-image", "label": "Image"}
    if ext in {"pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv"}:
        return {"icon": "fa-file-lines", "label": "Document"}
    if ext in {"zip", "rar", "7z", "tar", "gz"}:
        return {"icon": "fa-file-zipper", "label": "Archive"}
    if ext in {"py", "js", "css", "html", "json", "yml", "yaml", "md"}:
        return {"icon": "fa-file-code", "label": "Code"}
    return {"icon": "fa-file", "label": ext.upper() or "File"}


def secure_path_join(base_path, *path_parts):
    candidate = os.path.normpath(os.path.join(base_path, *path_parts))
    try:
        if os.path.commonpath([candidate, base_path]) != os.path.abspath(base_path):
            return None
    except ValueError:
        return None
    return candidate


@app.route('/upload/<folder_name>', methods=['POST'])
def upload_files(folder_name):
    directory = SHARED_FOLDERS.get(folder_name)
    if not directory or not os.path.isdir(directory):
        return redirect(url_for('index', message='Invalid destination folder.', message_type='error'))

    subfolder_name = normalize_folder_name(request.form.get('subfolder_name', ''))
    destination_dir = directory
    if subfolder_name:
        safe_dir = secure_path_join(directory, subfolder_name)
        if not safe_dir:
            return redirect(url_for('view_folder', folder_name=folder_name, message='Invalid subfolder name.', message_type='error'))
        destination_dir = safe_dir
        try:
            os.makedirs(destination_dir, exist_ok=True)
        except Exception:
            return redirect(url_for('view_folder', folder_name=folder_name, message='Could not create subfolder.', message_type='error'))

    uploaded_files = request.files.getlist('upload_files')
    uploaded_files = [f for f in uploaded_files if f and f.filename]
    if not uploaded_files:
        if subfolder_name:
            return redirect(url_for('view_folder', folder_name=folder_name, message=f"Created folder '{subfolder_name}'.", message_type='success'))
        return redirect(url_for('view_folder', folder_name=folder_name, message='Select files to upload.', message_type='error'))

    saved_count = 0
    for upload in uploaded_files:
        filename = secure_filename(upload.filename)
        if not filename:
            continue
        target_path = secure_path_join(destination_dir, filename)
        if not target_path:
            continue
        try:
            upload.save(target_path)
            saved_count += 1
        except Exception:
            continue

    if saved_count:
        message = f'Uploaded {saved_count} file{"s" if saved_count != 1 else ""} to {folder_name}.'
        return redirect(url_for('view_folder', folder_name=folder_name, message=message, message_type='success'))
    return redirect(url_for('view_folder', folder_name=folder_name, message='Upload failed. Try again.', message_type='error'))


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


def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    finally:
        s.close()


SHARED_FOLDERS = load_shared_folders()


@app.route("/")
def index():
    return render_template(
        "index.html",
        folders=SHARED_FOLDERS.keys(),
        folder_paths=SHARED_FOLDERS,
        folder_stats=build_folder_stats(),
        folder_name=None,
        files=[],
        total_size=None,
        default_folders=DEFAULT_SHARED_FOLDERS.keys(),
        server_ip=get_ip(),
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
        ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
        files.append(
            {
                "name": name,
                "size": format_size(size),
                "modified": format_date(mtime),
                "icon": file_icon(name),
                "type": category["label"],
                "category_icon": category["icon"],
                "is_video": ext in VIDEO_EXTENSIONS,
            }
        )

    return render_template(
        "index.html",
        files=files,
        folder_name=folder_name,
        folder_paths=SHARED_FOLDERS,
        folders=SHARED_FOLDERS.keys(),
        folder_stats=build_folder_stats(),
        total_size=format_size(total_size) if total_size else "0 B",
        default_folders=DEFAULT_SHARED_FOLDERS.keys(),
        server_ip=get_ip(),
        message=request.args.get("message", ""),
        message_type=request.args.get("message_type", "success"),
    )


@app.route("/download/<folder_name>/<path:filename>")
def download_file(folder_name, filename):
    directory = SHARED_FOLDERS.get(folder_name)
    if not directory or not os.path.exists(directory):
        abort(404)
    return send_from_directory(directory, filename, as_attachment=True)


@app.route("/preview/<folder_name>/<path:filename>")
def preview_file(folder_name, filename):
    directory = SHARED_FOLDERS.get(folder_name)
    if not directory or not os.path.exists(directory):
        abort(404)
    return send_from_directory(directory, filename, as_attachment=False)


@app.route("/add-folder", methods=["POST"])
def add_folder():
    folder_name = normalize_folder_name(request.form.get("folder_name", ""))
    folder_path = request.form.get("folder_path", "").strip()

    if not folder_name or not folder_path:
        return redirect(url_for("index", message="Enter both folder name and path.", message_type="error"))

    if folder_name in SHARED_FOLDERS:
        return redirect(url_for("index", message="Folder name already exists.", message_type="error"))

    if len(folder_name) > 40:
        return redirect(url_for("index", message="Folder label is too long.", message_type="error"))

    folder_path = os.path.abspath(folder_path)
    if not os.path.isdir(folder_path):
        return redirect(url_for("index", message="Invalid folder path.", message_type="error"))

    if folder_path in SHARED_FOLDERS.values():
        return redirect(url_for("index", message="Folder path is already shared.", message_type="error"))

    SHARED_FOLDERS[folder_name] = folder_path
    save_shared_folders(SHARED_FOLDERS)
    return redirect(url_for("view_folder", folder_name=folder_name, message="Folder added successfully.", message_type="success"))


@app.route("/remove-folder/<folder_name>", methods=["POST"])
def remove_folder(folder_name):
    if folder_name in SHARED_FOLDERS and folder_name not in DEFAULT_SHARED_FOLDERS:
        SHARED_FOLDERS.pop(folder_name, None)
        save_shared_folders(SHARED_FOLDERS)
        return redirect(url_for("index", message="Folder removed successfully.", message_type="success"))
    return redirect(url_for("index", message="Cannot remove default folder.", message_type="error"))


if __name__ == "__main__":
    print(f"\n--- NAS SERVER ACTIVE ---")
    print(f"IP Address: http://{get_ip()}:5000")
    print(f"--------------------------\n")
    app.run(host="0.0.0.0", port=5000)
