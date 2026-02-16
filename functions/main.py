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

# Collections
AUTH_COLLECTION = 'auth'
ADMIN_EMAIL = 'chetan2469@gmail.com'

def hash_password(password):
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(hashed_password, password):
    return hashed_password == hash_password(password)

def get_user_by_email(email):
    """Get user document from auth collection"""
    doc = db.collection(AUTH_COLLECTION).document(email).get()
    return doc.to_dict() if doc.exists else None

def is_admin(email):
    """Check if user is admin"""
    return email == ADMIN_EMAIL

def get_access_request(email):
    """Get access request for a user"""
    doc = db.collection(AUTH_COLLECTION).document(email).collection('access').document('request').get()
    return doc.to_dict() if doc.exists else None

def has_access(email):
    """Check if user has been granted access"""
    if is_admin(email):
        return True
    
    access_request = get_access_request(email)
    return access_request and access_request.get('status') == 'approved'

def create_user_collection(email):
    """Create initial collection structure for new approved user"""
    # Create empty teams document
    db.collection(email).document('teams').set({'data': []})
    # Create empty players document  
    db.collection(email).document('players').set({'data': []})
    # Create default settings document
    db.collection(email).document('settings').set({'data': {}})

# Initialize existing user in auth collection
def initialize_existing_user():
    """Add the existing user to auth collection if not already present"""
    existing_email = 'chetan2469@gmail.com'
    existing_password = 'Ux9146CT'
    
    user = get_user_by_email(existing_email)
    if not user:
        user_data = {
            'email': existing_email,
            'password': existing_password,  # Store as plain text
            'role': 'admin',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        db.collection(AUTH_COLLECTION).document(existing_email).set(user_data)
        print(f"Initialized existing user: {existing_email}")
    else:
        # Update existing user to ensure they have admin role
        db.collection(AUTH_COLLECTION).document(existing_email).update({'role': 'admin'})
        print(f"Updated role to admin for: {existing_email}")

# Initialize on startup
initialize_existing_user()

@app.route('/register', methods=['POST'])
def register():
    try:
        data = flask.request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return flask.jsonify({'error': 'Email and password required'}), 400
        
        # Check if user already exists
        existing_user = get_user_by_email(email)
        if existing_user:
            return flask.jsonify({'error': 'User already exists'}), 400
        
        # Create user account
        user_data = {
            'email': email,
            'password': password,  # Store password as plain text
            'role': 'user',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        db.collection(AUTH_COLLECTION).document(email).set(user_data)
        
        # Create access request for admin approval
        access_request = {
            'email': email,
            'status': 'pending',
            'requested_at': firestore.SERVER_TIMESTAMP,
            'approved_at': None,
            'approved_by': None
        }
        db.collection(AUTH_COLLECTION).document(email).collection('access').document('request').set(access_request)
        
        return flask.jsonify({
            'success': True, 
            'message': 'Registration successful. Waiting for admin approval.',
            'status': 'pending_approval'
        })
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = flask.request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return flask.jsonify({'error': 'Email and password required'}), 400
        
        user = get_user_by_email(email)
        if not user:
            # Special case for admin - allow login with hardcoded password
            if is_admin(email) and password == 'Ux9146CT':
                # Create admin user in database if not exists
                db.collection(AUTH_COLLECTION).document(email).set({
                    'email': email,
                    'password': password,  # Store as plain text
                    'role': 'admin'
                })
                user = {'email': email, 'role': 'admin'}
            else:
                return flask.jsonify({'error': 'User not found'}), 404
        
        # Special handling for admin - always allow with hardcoded password
        if is_admin(email):
            if password != 'Ux9146CT':
                return flask.jsonify({'error': 'Invalid password'}), 401
        else:
            # Compare plain text passwords directly
            stored_password = user.get('password', '')
            if stored_password != password:
                return flask.jsonify({'error': 'Invalid password'}), 401
        
        # Check if user has access (admin always has access)
        if not has_access(email):
            access_request = get_access_request(email)
            status = access_request.get('status', 'no_request') if access_request else 'no_request'
            return flask.jsonify({
                'error': 'Access denied. Waiting for admin approval.',
                'status': status
            }), 403
        
        # Ensure user collection exists (for approved users)
        if not is_admin(email):
            # Check if user collection exists, create if not
            teams_doc = db.collection(email).document('teams').get()
            if not teams_doc.exists:
                create_user_collection(email)
        
        return flask.jsonify({
            'success': True, 
            'message': 'Login successful',
            'email': email,
            'role': user.get('role', 'user')
        })
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/admin/access-requests', methods=['GET'])
def get_access_requests():
    try:
        # Only admin can access this
        admin_email = flask.request.args.get('admin_email')
        if not admin_email or not is_admin(admin_email):
            return flask.jsonify({'error': 'Unauthorized'}), 403
        
        # Get all users and their access requests
        users_ref = db.collection(AUTH_COLLECTION).stream()
        requests = []
        
        for user_doc in users_ref:
            user_data = user_doc.to_dict()
            email = user_data.get('email')
            
            if email != ADMIN_EMAIL:  # Don't include admin
                access_request = get_access_request(email)
                if access_request and access_request.get('status') == 'pending':
                    requests.append({
                        'email': email,
                        'status': access_request.get('status'),
                        'requested_at': access_request.get('requested_at'),
                        'approved_at': access_request.get('approved_at'),
                        'approved_by': access_request.get('approved_by')
                    })
        
        return flask.jsonify({'requests': requests})
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/admin/approve-access', methods=['POST'])
def approve_access():
    try:
        data = flask.request.get_json()
        admin_email = data.get('admin_email')
        user_email = data.get('user_email')
        
        if not admin_email or not is_admin(admin_email):
            return flask.jsonify({'error': 'Unauthorized'}), 403
        
        if not user_email:
            return flask.jsonify({'error': 'User email required'}), 400
        
        # Update access request
        access_update = {
            'status': 'approved',
            'approved_at': firestore.SERVER_TIMESTAMP,
            'approved_by': admin_email
        }
        db.collection(AUTH_COLLECTION).document(user_email).collection('access').document('request').update(access_update)
        
        # Create user collection
        create_user_collection(user_email)
        
        return flask.jsonify({'success': True, 'message': f'Access granted to {user_email}'})
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/admin/deny-access', methods=['POST'])
def deny_access():
    try:
        data = flask.request.get_json()
        admin_email = data.get('admin_email')
        user_email = data.get('user_email')
        
        if not admin_email or not is_admin(admin_email):
            return flask.jsonify({'error': 'Unauthorized'}), 403
        
        if not user_email:
            return flask.jsonify({'error': 'User email required'}), 400
        
        # Update access request
        access_update = {
            'status': 'denied',
            'approved_at': firestore.SERVER_TIMESTAMP,
            'approved_by': admin_email
        }
        db.collection(AUTH_COLLECTION).document(user_email).collection('access').document('request').update(access_update)
        
        return flask.jsonify({'success': True, 'message': f'Access denied to {user_email}'})
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/teams', methods=['GET'])
def get_teams():
    try:
        email = flask.request.args.get('email')
        if not email:
            return flask.jsonify({'error': 'Email required'}), 400
        
        # Verify user exists
        user = get_user_by_email(email)
        if not user:
            return flask.jsonify({'error': 'User not found'}), 404
        
        collection_name = email
        doc_ref = db.collection(collection_name).document('teams')
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
        email = data.get('email')
        if not email:
            return flask.jsonify({'error': 'Email required'}), 400
        
        # Verify user exists
        user = get_user_by_email(email)
        if not user:
            return flask.jsonify({'error': 'User not found'}), 404
        
        collection_name = email
        doc_ref = db.collection(collection_name).document('teams')
        doc_ref.set({'data': data.get('data', [])})
        return flask.jsonify({'success': True})
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/players', methods=['GET'])
def get_players():
    try:
        email = flask.request.args.get('email')
        if not email:
            return flask.jsonify({'error': 'Email required'}), 400
        
        # Verify user exists
        user = get_user_by_email(email)
        if not user:
            return flask.jsonify({'error': 'User not found'}), 404
        
        collection_name = email
        doc_ref = db.collection(collection_name).document('players')
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
        email = data.get('email')
        if not email:
            return flask.jsonify({'error': 'Email required'}), 400
        
        # Verify user exists
        user = get_user_by_email(email)
        if not user:
            return flask.jsonify({'error': 'User not found'}), 404
        
        collection_name = email
        doc_ref = db.collection(collection_name).document('players')
        doc_ref.set({'data': data.get('data', [])})
        return flask.jsonify({'success': True})
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@app.route('/settings', methods=['GET'])
def get_settings():
    try:
        email = flask.request.args.get('email')
        if not email:
            return flask.jsonify({'error': 'Email required'}), 400
        
        # Verify user exists
        user = get_user_by_email(email)
        if not user:
            return flask.jsonify({'error': 'User not found'}), 404
        
        collection_name = email
        doc_ref = db.collection(collection_name).document('settings')
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
        email = data.get('email')
        if not email:
            return flask.jsonify({'error': 'Email required'}), 400
        
        # Verify user exists
        user = get_user_by_email(email)
        if not user:
            return flask.jsonify({'error': 'User not found'}), 404
        
        collection_name = email
        doc_ref = db.collection(collection_name).document('settings')
        doc_ref.set({'data': data.get('data', {})})
        return flask.jsonify({'success': True})
    except Exception as e:
        return flask.jsonify({'error': str(e)}), 500

@https_fn.on_request()
def api(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()