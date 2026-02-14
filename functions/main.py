# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app, credentials, firestore
import flask
import json
import os
from flask_cors import CORS

# For cost control, you can set the maximum number of containers that can be
# running at the same time. This helps mitigate the impact of unexpected
# traffic spikes by instead downgrading performance. This limit is a per-function
# limit. You can override the limit for each function using the max_instances
# parameter in the decorator, e.g. @https_fn.on_request(max_instances=5).
set_global_options(max_instances=10)

# Initialize Firebase Admin
# For local development, use the service account
cred_path = os.path.join(os.path.dirname(__file__), '..', 'axilam-firebase-adminsdk-9x8a3-650eee6bca.json')
if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    initialize_app(cred)
else:
    initialize_app()

db = firestore.client()

app = flask.Flask(__name__)
CORS(app)  # Enable CORS for all routes

COLLECTION_NAME = 'chetan2469@gmail.com'

@app.route('/teams', methods=['GET'])
def get_teams():
    try:
        doc_ref = db.collection(COLLECTION_NAME).document('teams')
        doc = doc_ref.get()
        if doc.exists:
            return flask.jsonify(doc.to_dict().get('data', []))
        else:
            return flask.jsonify([])
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/teams', methods=['POST'])
def save_teams():
    try:
        data = flask.request.get_json()
        doc_ref = db.collection(COLLECTION_NAME).document('teams')
        doc_ref.set({'data': data})
        return flask.jsonify({'success': True})
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/players', methods=['GET'])
def get_players():
    try:
        doc_ref = db.collection(COLLECTION_NAME).document('players')
        doc = doc_ref.get()
        if doc.exists:
            return flask.jsonify(doc.to_dict().get('data', []))
        else:
            return flask.jsonify([])
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/players', methods=['POST'])
def save_players():
    try:
        data = flask.request.get_json()
        doc_ref = db.collection(COLLECTION_NAME).document('players')
        doc_ref.set({'data': data})
        return flask.jsonify({'success': True})
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/settings', methods=['GET'])
def get_settings():
    try:
        doc_ref = db.collection(COLLECTION_NAME).document('settings')
        doc = doc_ref.get()
        if doc.exists:
            return flask.jsonify(doc.to_dict().get('data', {}))
        else:
            return flask.jsonify({})
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/settings', methods=['POST'])
def save_settings():
    try:
        data = flask.request.get_json()
        doc_ref = db.collection(COLLECTION_NAME).document('settings')
        doc_ref.set({'data': data})
        return flask.jsonify({'success': True})
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@https_fn.on_request()
def api(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()