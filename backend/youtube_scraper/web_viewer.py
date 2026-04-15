from flask import Flask, jsonify
import psycopg2
from config import DB_CONFIG

app = Flask(__name__)

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

@app.route("/")
def index():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SET client_encoding TO 'UTF8'")
    cur.execute("SELECT video_id, title, url, genre, view_count, created_at FROM sharks ORDER BY created_at DESC LIMIT 500")
    tracks = cur.fetchall()
    cur.close()
    conn.close()

    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Sample Hunt - Sharks Database</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a2e; color: #eee; }
            h1 { color: #e94560; }
            table { border-collapse: collapse; width: 100%; background: #16213e; }
            th, td { border: 1px solid #0f3460; padding: 10px; text-align: left; }
            th { background: #e94560; }
            tr:hover { background: #0f3460; }
            a { color: #00d9ff; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .count { color: #888; }
        </style>
    </head>
    <body>
        <h1>🎵 Sample Hunt - Sharks Database</h1>
        <p class="count">Total tracks: """ + str(len(tracks)) + """</p>
        <table>
            <tr>
                <th>Title</th>
                <th>URL</th>
                <th>Genre</th>
                <th>Views</th>
                <th>Date</th>
            </tr>
    """

    for track in tracks:
        video_id, title, url, genre, view_count, created_at = track
        html += f"""
            <tr>
                <td>{title}</td>
                <td><a href="{url}" target="_blank">▶ {video_id}</a></td>
                <td>{genre}</td>
                <td>{view_count:,}</td>
                <td>{created_at}</td>
            </tr>
        """

    html += """
        </table>
    </body>
    </html>
    """

    return html

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)